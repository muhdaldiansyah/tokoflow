// lib/services/marketplace/tiktok-shop/sync.js
//
// End-to-end sync for a single TikTok Shop connection.
//
// Called from:
//   - POST /api/marketplace/sync/[id]  (manual trigger, owner only)
//   - POST /api/cron/marketplace-sync  (periodic, Vercel Cron every 15 min)
//   - POST /api/cron/webhook-events-process  (on-demand, after webhook arrives)
//
// Flow:
//   1. Load connection + decrypt tokens.
//   2. Refresh access_token if expiring within the next 30 minutes.
//   3. Page through /order/202309/orders/search with update_time_ge =
//      last_sync_cursor (fallback: 7 days ago for first sync).
//   4. For each page, batch order IDs (max 50) and hit /order/202309/orders
//      to hydrate details.
//   5. For each order, walk line_items and upsert one tf_sales_input row
//      per line item with external_source='tiktok-shop',
//      external_order_id=order.id, external_item_id=line_items[].id.
//      status='ok' so the existing batch processor picks it up.
//   6. Bump connection.last_sync_cursor to max(update_time) processed.
//   7. On error, write last_sync_status='failed' with a short message.
//
// Error handling:
//   - AuthError with code in the 360xxx family → attempt token refresh once,
//     then retry; if refresh also fails, deactivate the connection.
//   - AuthError with code in the 105xxx family → deactivate (scope issue,
//     merchant needs to re-authorize).
//   - RateLimitError / ServerError / NetworkError → the http wrapper already
//     retried; at this level we just log and surface the error.
//
// Idempotency: the unique index on tf_sales_input (external_source,
// external_order_id, external_item_id) means duplicate sync runs upsert
// cleanly — no double-counting.

import {
  loadConnectionById,
  updateConnectionTokensAfterRefresh,
  updateSyncStatus,
  deactivateConnection,
} from '../connections.js';
import { AuthError } from '../errors.js';
import { searchOrders, getOrderDetails, MAX_DETAIL_BATCH } from './orders.js';
import { refreshAccessToken } from './auth.js';

// Fallback look-back when last_sync_cursor is null (first ever sync for a
// connection). Shopee/TikTok Shop typically have orders within the last
// week worth reconciling.
const FIRST_SYNC_LOOKBACK_SECONDS = 7 * 24 * 60 * 60;

// Safety overlap on the window start to catch webhook-missed status updates.
const OVERLAP_SECONDS = 5 * 60;

// Refresh access_token if it expires within this window.
const TOKEN_REFRESH_THRESHOLD_MS = 30 * 60 * 1000;

/**
 * Run a full sync for one TikTok Shop connection.
 *
 * @param {object} args
 * @param {object} args.supabase — service role client (RLS bypass for inserts)
 * @param {number} args.connectionId
 * @returns {Promise<{ ok: true, ordersProcessed: number, cursor: Date } | { ok: false, error: string }>}
 */
export async function syncTikTokShopConnection({ supabase, connectionId }) {
  let connection = await loadConnectionById(supabase, connectionId);
  if (!connection) {
    return { ok: false, error: `connection ${connectionId} not found` };
  }
  if (connection.channel !== 'tiktok-shop') {
    return { ok: false, error: `connection ${connectionId} is not tiktok-shop` };
  }
  if (!connection.is_active) {
    return { ok: false, error: 'connection is inactive' };
  }

  const appKey = process.env.TIKTOKSHOP_APP_KEY;
  const appSecret = process.env.TIKTOKSHOP_APP_SECRET;
  if (!appKey || !appSecret) {
    return { ok: false, error: 'TIKTOKSHOP_APP_KEY / TIKTOKSHOP_APP_SECRET not set' };
  }

  try {
    await updateSyncStatus(supabase, connectionId, { status: 'running', error: null });

    // --- Step 1: refresh token if needed -----------------------------------
    connection = await maybeRefreshToken({
      supabase,
      connection,
      appKey,
      appSecret,
    });

    // --- Step 2: compute sync window ---------------------------------------
    const nowUnix = Math.floor(Date.now() / 1000);
    const cursorDate = connection.last_sync_cursor
      ? new Date(connection.last_sync_cursor)
      : null;
    const sinceUnix =
      cursorDate != null
        ? Math.floor(cursorDate.getTime() / 1000) - OVERLAP_SECONDS
        : nowUnix - FIRST_SYNC_LOOKBACK_SECONDS;
    const untilUnix = nowUnix;

    // --- Step 3: page through orders search --------------------------------
    const credentials = {
      appKey,
      appSecret,
      accessToken: connection.access_token,
      shopCipher: connection.shop_cipher,
    };

    const allOrderIds = [];
    let pageToken;
    let maxUpdateTime = 0;

    // Guard against unbounded loops (a shop with millions of orders).
    for (let page = 0; page < 100; page++) {
      const result = await searchOrders({
        credentials,
        sinceUnix,
        untilUnix,
        pageToken,
      });

      for (const o of result.orders) {
        allOrderIds.push(o.id);
        if (o.update_time > maxUpdateTime) maxUpdateTime = o.update_time;
      }

      if (!result.nextPageToken) break;
      pageToken = result.nextPageToken;
    }

    // --- Step 4: hydrate details in batches of 50 --------------------------
    const allOrders = [];
    for (let i = 0; i < allOrderIds.length; i += MAX_DETAIL_BATCH) {
      const batch = allOrderIds.slice(i, i + MAX_DETAIL_BATCH);
      const details = await getOrderDetails({ credentials, orderIds: batch });
      for (const d of details) allOrders.push(d);
    }

    // --- Step 5: upsert into tf_sales_input --------------------------------
    let ordersProcessed = 0;
    for (const order of allOrders) {
      const inserted = await upsertOrderAsSalesRows({
        supabase,
        connection,
        order,
      });
      if (inserted > 0) ordersProcessed++;
    }

    // --- Step 6: update cursor ---------------------------------------------
    const newCursor = maxUpdateTime > 0 ? new Date(maxUpdateTime * 1000) : new Date();
    await updateSyncStatus(supabase, connectionId, {
      status: 'success',
      error: null,
      cursor: newCursor,
      completedAt: new Date(),
    });

    return { ok: true, ordersProcessed, cursor: newCursor };
  } catch (err) {
    // Classify: AuthError → deactivate, everything else → mark failed.
    const message = err?.message || String(err);

    if (err instanceof AuthError) {
      await deactivateConnection(supabase, connectionId, `auth failed: ${message}`);
      return { ok: false, error: `auth failed, connection deactivated: ${message}` };
    }

    await updateSyncStatus(supabase, connectionId, {
      status: 'failed',
      error: message.slice(0, 500),
      completedAt: new Date(),
    });
    return { ok: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Token refresh
// ---------------------------------------------------------------------------

async function maybeRefreshToken({ supabase, connection, appKey, appSecret }) {
  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : 0;
  const now = Date.now();

  if (expiresAt - now > TOKEN_REFRESH_THRESHOLD_MS) {
    return connection; // still fresh
  }

  if (!connection.refresh_token) {
    throw new AuthError('no refresh_token on connection', { provider: 'tiktok-shop' });
  }

  const bundle = await refreshAccessToken({
    appKey,
    appSecret,
    refreshToken: connection.refresh_token,
  });

  await updateConnectionTokensAfterRefresh(supabase, connection.id, {
    accessToken: bundle.accessToken,
    refreshToken: bundle.refreshToken,
    accessTokenExpiresAt: bundle.accessTokenExpiresAt,
    refreshTokenExpiresAt: bundle.refreshTokenExpiresAt,
  });

  // Re-load to pick up the new values in a consistent shape.
  return loadConnectionById(supabase, connection.id);
}

// ---------------------------------------------------------------------------
// Order → sales_input mapping
// ---------------------------------------------------------------------------

/**
 * For one order, insert one row per line_item into tf_sales_input.
 * Uses upsert semantics via the partial unique index on
 * (external_source, external_order_id, external_item_id).
 *
 * Returns the number of NEW rows inserted (excluding conflicts that skipped).
 *
 * @returns {Promise<number>}
 */
async function upsertOrderAsSalesRows({ supabase, connection, order }) {
  const lineItems = Array.isArray(order.line_items) ? order.line_items : [];
  if (lineItems.length === 0) return 0;

  // Only materialize orders past UNPAID — waiting-for-payment orders can be
  // cancelled without ever becoming a sale. Wait until they're in
  // AWAITING_SHIPMENT or later.
  const status = String(order.status || '').toUpperCase();
  if (status === 'UNPAID' || status === 'CANCELLED') return 0;

  // Resolve a transaction date from paid_time or create_time.
  const paidAt = Number(order.paid_time) || Number(order.create_time) || 0;
  const transactionDate =
    paidAt > 0
      ? new Date(paidAt * 1000).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

  const rows = lineItems.map((li) => {
    // seller_sku is what TikTok Shop calls the merchant's own SKU — that's
    // our join key to tf_products. Fall back to sku_id if seller_sku missing.
    const sku = String(li.seller_sku || li.sku_id || '').trim() || null;

    return {
      transaction_date: transactionDate,
      sku,
      product_name: li.sku_name || li.product_name || null,
      selling_price: Number(li.sale_price ?? li.original_price ?? 0),
      quantity: Number(li.quantity) || 1,
      channel: 'tiktok-shop',
      status: sku ? 'ok' : 'pending', // SKU resolved → ready; unmatched → needs review
      external_source: 'tiktok-shop',
      external_order_id: String(order.id),
      external_item_id: String(li.id),
      external_update_time: Number(order.update_time) || null,
      marketplace_raw: {
        order_id: order.id,
        order_status: order.status,
        line_item_id: li.id,
        product_id: li.product_id,
        sku_id: li.sku_id,
        seller_sku: li.seller_sku,
        shop_id: connection.shop_id,
      },
    };
  });

  // Use upsert with the unique index as the conflict target. On conflict we
  // do nothing — first write wins — which is what we want since the
  // original insert captured the initial state; webhook/poll replays
  // shouldn't overwrite a row that's already in flight.
  const { data, error } = await supabase
    .from('tf_sales_input')
    .upsert(rows, {
      onConflict: 'external_source,external_order_id,external_item_id',
      ignoreDuplicates: true,
    })
    .select('id');

  if (error) throw new Error(`upsertOrderAsSalesRows: ${error.message}`);
  return Array.isArray(data) ? data.length : 0;
}
