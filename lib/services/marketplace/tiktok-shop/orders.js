// lib/services/marketplace/tiktok-shop/orders.js
//
// TikTok Shop Partner Center order-reading helpers.
//
// Two entry points the sync loop uses:
//
//   searchOrders({ connection, sinceUnix, pageSize, pageToken })
//     POST /order/202309/orders/search
//     Returns { orders: [{ id, status, update_time }], nextPageToken, totalCount }
//     Use update_time filter (NOT create_time) for incremental polling — it
//     catches status changes (cancellations, delivery updates) that we
//     otherwise would miss.
//
//   getOrderDetails({ connection, orderIds })
//     GET /order/202309/orders?ids=id1,id2,...
//     Returns an array of full order objects with line_items, payment
//     breakdown, recipient address, packages.
//
// The sync strategy (implemented in the sync route, not here):
//   1. Load connection + decrypt tokens.
//   2. Refresh token if expiring soon.
//   3. Call searchOrders with sinceUnix = connection.last_sync_cursor.
//   4. For each page, batch orderIds in groups of 50 and call getOrderDetails.
//   5. For each order, walk line_items and upsert tf_sales_input rows keyed
//      by (external_source='tiktok-shop', external_order_id=order.id,
//      external_item_id=line_items[].id).
//   6. Update connection.last_sync_cursor to max(update_time) of processed.

import { marketplaceFetch } from '../http.js';
import { classifyTikTokShopError } from '../errors.js';
import { signTikTokShopRequest } from './signer.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Max page_size on /orders/search per TikTok Shop docs.
export const MAX_PAGE_SIZE = 50;

// Max order IDs per /orders (detail) batch call.
export const MAX_DETAIL_BATCH = 50;

// ---------------------------------------------------------------------------
// Orders search (incremental poll)
// ---------------------------------------------------------------------------

/**
 * Search for orders updated since a given Unix timestamp.
 *
 * The ergonomic wrapper pages through results if needed — call it in a loop
 * using the returned nextPageToken until it's null.
 *
 * @param {object} args
 * @param {object} args.credentials — { appKey, appSecret, accessToken, shopCipher }
 * @param {number} args.sinceUnix — Unix seconds; filter update_time_ge
 * @param {number} [args.untilUnix] — Unix seconds; filter update_time_lt (default: now)
 * @param {number} [args.pageSize] — max 50
 * @param {string} [args.pageToken] — from previous response
 * @returns {Promise<{ orders: Array<{ id: string, status: string, create_time: number, update_time: number }>, nextPageToken: string | null, totalCount: number }>}
 */
export async function searchOrders({
  credentials,
  sinceUnix,
  untilUnix,
  pageSize = MAX_PAGE_SIZE,
  pageToken,
}) {
  assertCredentials(credentials);
  if (typeof sinceUnix !== 'number' || !Number.isFinite(sinceUnix)) {
    throw new Error('searchOrders: sinceUnix must be a finite number (Unix seconds)');
  }

  const effectivePageSize = Math.min(Math.max(1, pageSize | 0), MAX_PAGE_SIZE);
  const effectiveUntil = typeof untilUnix === 'number' ? untilUnix : Math.floor(Date.now() / 1000);

  const query = {
    page_size: effectivePageSize,
    sort_field: 'update_time',
    sort_order: 'ASC',
  };
  if (pageToken) query.page_token = pageToken;

  const body = {
    update_time_ge: sinceUnix,
    update_time_lt: effectiveUntil,
  };

  const signed = signTikTokShopRequest({
    method: 'POST',
    path: '/order/202309/orders/search',
    query,
    body,
    appKey: credentials.appKey,
    appSecret: credentials.appSecret,
    accessToken: credentials.accessToken,
    shopCipher: credentials.shopCipher,
  });

  const { body: response } = await marketplaceFetch({
    url: signed.url,
    method: signed.method,
    headers: signed.headers,
    body: signed.body,
    classifier: classifyTikTokShopError,
    providerLabel: 'tiktok-shop',
  });

  const data = response?.data || {};
  const rawOrders = Array.isArray(data.orders) ? data.orders : [];

  return {
    orders: rawOrders.map((o) => ({
      id: String(o.id),
      status: o.status,
      create_time: Number(o.create_time) || 0,
      update_time: Number(o.update_time) || 0,
    })),
    nextPageToken: data.next_page_token || null,
    totalCount: Number(data.total_count) || 0,
  };
}

// ---------------------------------------------------------------------------
// Order detail (hydrate line items after search)
// ---------------------------------------------------------------------------

/**
 * Fetch full order details for up to MAX_DETAIL_BATCH order IDs in one call.
 *
 * @param {object} args
 * @param {object} args.credentials
 * @param {string[]} args.orderIds
 * @returns {Promise<Array<object>>} array of full order objects
 */
export async function getOrderDetails({ credentials, orderIds }) {
  assertCredentials(credentials);
  if (!Array.isArray(orderIds) || orderIds.length === 0) return [];
  if (orderIds.length > MAX_DETAIL_BATCH) {
    throw new Error(
      `getOrderDetails: max ${MAX_DETAIL_BATCH} IDs per call, got ${orderIds.length}`
    );
  }

  const signed = signTikTokShopRequest({
    method: 'GET',
    path: '/order/202309/orders',
    query: { ids: orderIds.join(',') },
    appKey: credentials.appKey,
    appSecret: credentials.appSecret,
    accessToken: credentials.accessToken,
    shopCipher: credentials.shopCipher,
  });

  const { body: response } = await marketplaceFetch({
    url: signed.url,
    method: signed.method,
    headers: signed.headers,
    body: signed.body,
    classifier: classifyTikTokShopError,
    providerLabel: 'tiktok-shop',
  });

  const data = response?.data || {};
  return Array.isArray(data.orders) ? data.orders : [];
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function assertCredentials(c) {
  if (!c) throw new Error('credentials object required');
  const missing = ['appKey', 'appSecret', 'accessToken', 'shopCipher'].filter((k) => !c[k]);
  if (missing.length > 0) {
    throw new Error(`credentials missing: ${missing.join(', ')}`);
  }
}
