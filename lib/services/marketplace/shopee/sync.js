// lib/services/marketplace/shopee/sync.js
//
// End-to-end sync for a single Shopee v2 connection.
//
// Structurally identical to tiktok-shop/sync.js — the differences are just
// the API calls and the response shape:
//
//   1. Refresh access_token if expiring within 30 min (Shopee access_tokens
//      live only ~4 hours, so aggressive refresh is normal).
//   2. Enumerate time windows (max 15 days each) between last_sync_cursor
//      and now.
//   3. For each window, page through get_order_list with cursor/more.
//   4. Batch order_sns in groups of 50 and call get_order_detail.
//   5. Map item_list → tf_sales_input rows, keyed by (order_sn, order_item_id).
//   6. Bump last_sync_cursor on success.

import {
  loadConnectionById,
  updateConnectionTokensAfterRefresh,
  updateSyncStatus,
  deactivateConnection,
} from '../connections.js';
import { AuthError } from '../errors.js';
import {
  getOrderList,
  getOrderDetail,
  enumerateWindows,
  MAX_DETAIL_BATCH,
} from './orders.js';
import { refreshAccessToken } from './auth.js';

const FIRST_SYNC_LOOKBACK_SECONDS = 7 * 24 * 60 * 60;
const OVERLAP_SECONDS = 5 * 60;
const TOKEN_REFRESH_THRESHOLD_MS = 30 * 60 * 1000;

/**
 * Run a full sync for one Shopee connection.
 *
 * @param {object} args
 * @param {object} args.supabase — service role client
 * @param {number} args.connectionId
 * @returns {Promise<{ ok: true, ordersProcessed: number, cursor: Date } | { ok: false, error: string }>}
 */
export async function syncShopeeConnection({ supabase, connectionId }) {
  let connection = await loadConnectionById(supabase, connectionId);
  if (!connection) {
    return { ok: false, error: `connection ${connectionId} not found` };
  }
  if (connection.channel !== 'shopee') {
    return { ok: false, error: `connection ${connectionId} is not shopee` };
  }
  if (!connection.is_active) {
    return { ok: false, error: 'connection is inactive' };
  }

  const partnerId = process.env.SHOPEE_PARTNER_ID;
  const partnerKey = process.env.SHOPEE_PARTNER_KEY;
  const environment = process.env.SHOPEE_ENVIRONMENT || 'test';
  if (!partnerId || !partnerKey) {
    return { ok: false, error: 'SHOPEE_PARTNER_ID / SHOPEE_PARTNER_KEY not set' };
  }

  try {
    await updateSyncStatus(supabase, connectionId, { status: 'running', error: null });

    // --- Step 1: refresh token if needed -----------------------------------
    connection = await maybeRefreshToken({
      supabase,
      connection,
      partnerId,
      partnerKey,
      environment,
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

    const windows = enumerateWindows(sinceUnix, untilUnix);

    const credentials = {
      partnerId,
      partnerKey,
      accessToken: connection.access_token,
      shopId: connection.shop_id,
      environment,
    };

    // --- Step 3: page through orders across each window --------------------
    const allOrderSns = new Set();
    let maxUpdateTime = 0;

    for (const [from, to] of windows) {
      let cursor = '';
      let more = true;
      let guard = 0;

      while (more && guard++ < 100) {
        const result = await getOrderList({
          credentials,
          timeFrom: from,
          timeTo: to,
          timeRangeField: 'update_time',
          cursor,
        });

        for (const o of result.orders) {
          allOrderSns.add(o.order_sn);
        }

        cursor = result.nextCursor;
        more = result.more && !!cursor;
      }
    }

    // --- Step 4: hydrate details in batches of 50 --------------------------
    const orderSnList = Array.from(allOrderSns);
    const allOrders = [];

    for (let i = 0; i < orderSnList.length; i += MAX_DETAIL_BATCH) {
      const batch = orderSnList.slice(i, i + MAX_DETAIL_BATCH);
      const details = await getOrderDetail({ credentials, orderSns: batch });
      for (const d of details) {
        allOrders.push(d);
        if (Number(d.update_time) > maxUpdateTime) maxUpdateTime = Number(d.update_time);
      }
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

async function maybeRefreshToken({ supabase, connection, partnerId, partnerKey, environment }) {
  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : 0;
  const now = Date.now();

  if (expiresAt - now > TOKEN_REFRESH_THRESHOLD_MS) {
    return connection;
  }

  if (!connection.refresh_token) {
    throw new AuthError('no refresh_token on connection', { provider: 'shopee' });
  }

  const bundle = await refreshAccessToken({
    partnerId,
    partnerKey,
    refreshToken: connection.refresh_token,
    shopId: connection.shop_id,
    environment,
  });

  await updateConnectionTokensAfterRefresh(supabase, connection.id, {
    accessToken: bundle.accessToken,
    refreshToken: bundle.refreshToken,
    accessTokenExpiresAt: bundle.accessTokenExpiresAt,
    refreshTokenExpiresAt: bundle.refreshTokenExpiresAt,
  });

  return loadConnectionById(supabase, connection.id);
}

// ---------------------------------------------------------------------------
// Order → sales_input mapping
// ---------------------------------------------------------------------------

/**
 * For one Shopee order, insert one row per item_list entry into tf_sales_input.
 *
 * @returns {Promise<number>} rows inserted
 */
async function upsertOrderAsSalesRows({ supabase, connection, order }) {
  const items = Array.isArray(order.item_list) ? order.item_list : [];
  if (items.length === 0) return 0;

  // Skip orders still in UNPAID or already cancelled.
  const status = String(order.order_status || '').toUpperCase();
  if (status === 'UNPAID' || status === 'CANCELLED' || status === 'INVOICE_PENDING') return 0;

  const paidAt = Number(order.pay_time) || Number(order.create_time) || 0;
  const transactionDate =
    paidAt > 0
      ? new Date(paidAt * 1000).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

  const rows = items.map((item) => {
    // Shopee has model_sku (variant) and item_sku (parent). Variants are
    // what merchants actually use for SKU tracking — prefer model_sku.
    const sku =
      String(item.model_sku || item.item_sku || '').trim() || null;

    return {
      transaction_date: transactionDate,
      sku,
      product_name: item.item_name || null,
      selling_price: Number(
        item.model_discounted_price ?? item.model_original_price ?? 0
      ),
      quantity: Number(item.model_quantity_purchased) || 1,
      channel: 'shopee',
      status: sku ? 'ok' : 'pending',
      external_source: 'shopee',
      external_order_id: String(order.order_sn),
      external_item_id: String(item.order_item_id ?? item.item_id ?? ''),
      external_update_time: Number(order.update_time) || null,
      marketplace_raw: {
        order_sn: order.order_sn,
        order_status: order.order_status,
        order_item_id: item.order_item_id,
        item_id: item.item_id,
        model_id: item.model_id,
        item_sku: item.item_sku,
        model_sku: item.model_sku,
        shop_id: connection.shop_id,
      },
    };
  });

  const { data, error } = await supabase
    .from('tf_sales_input')
    .upsert(rows, {
      onConflict: 'external_source,external_order_id,external_item_id',
      ignoreDuplicates: true,
    })
    .select('id');

  if (error) throw new Error(`upsertOrderAsSalesRows (shopee): ${error.message}`);
  return Array.isArray(data) ? data.length : 0;
}
