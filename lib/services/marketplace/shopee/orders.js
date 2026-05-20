// lib/services/marketplace/shopee/orders.js
//
// Shopee Open Platform v2 order-reading helpers.
//
// Three entry points the sync loop uses:
//
//   getOrderList({ credentials, timeFrom, timeTo, cursor })
//     GET /api/v2/order/get_order_list
//     Returns { orders: [{ order_sn }], nextCursor, more }
//     Shopee paginates by `cursor` and caps time_from → time_to at 15 days.
//
//   getOrderDetail({ credentials, orderSns })
//     GET /api/v2/order/get_order_detail?order_sn_list=a,b,c&response_optional_fields=...
//     Returns the full list of orders with item_list, buyer, recipient.
//
//   getEscrowDetail({ credentials, orderSn })
//     GET /api/v2/payment/get_escrow_detail?order_sn=...
//     Returns commission_fee, service_fee, and net payout — the
//     authoritative per-order fee numbers used by the fee-reconciliation
//     daily job. Only populated after the order reaches COMPLETED.
//
// Pagination + time-window rules (enforced in code so callers can't get it
// wrong):
//   - Max window = 15 days per call. We split larger windows into chunks.
//   - Max page_size = 100.
//   - Cursor: empty string for page 1, then whatever Shopee returns.

import { marketplaceFetch } from '../http.js';
import { classifyShopeeError } from '../errors.js';
import { buildShopeeShopRequest } from './signer.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_PAGE_SIZE = 100;
export const MAX_DETAIL_BATCH = 50;
export const MAX_WINDOW_SECONDS = 15 * 24 * 60 * 60; // 15 days

const ORDER_LIST_PATH = '/api/v2/order/get_order_list';
const ORDER_DETAIL_PATH = '/api/v2/order/get_order_detail';
const ESCROW_DETAIL_PATH = '/api/v2/payment/get_escrow_detail';

// The full set of fields we want back on a detailed order. Passed to Shopee
// via `response_optional_fields`. Anything not in this list is omitted from
// the response (except the always-included basic fields).
const DETAIL_OPTIONAL_FIELDS = [
  'buyer_user_id',
  'buyer_username',
  'estimated_shipping_fee',
  'recipient_address',
  'actual_shipping_fee',
  'goods_to_declare',
  'note',
  'note_update_time',
  'item_list',
  'pay_time',
  'dropshipper',
  'dropshipper_phone',
  'split_up',
  'buyer_cancel_reason',
  'cancel_by',
  'cancel_reason',
  'actual_shipping_fee_confirmed',
  'buyer_cpf_id',
  'fulfillment_flag',
  'pickup_done_time',
  'package_list',
  'shipping_carrier',
  'payment_method',
  'total_amount',
  'order_status',
  'update_time',
].join(',');

// ---------------------------------------------------------------------------
// Order list (incremental poll)
// ---------------------------------------------------------------------------

/**
 * Fetch one page of order SNs matching the time window and status filter.
 * The caller is responsible for looping on `nextCursor` until `more` is false
 * and for chunking time windows larger than 15 days via
 * `enumerateWindows(timeFrom, timeTo)`.
 *
 * @param {object} args
 * @param {object} args.credentials — { partnerId, partnerKey, accessToken, shopId, environment }
 * @param {number} args.timeFrom — Unix seconds
 * @param {number} args.timeTo — Unix seconds (max 15 days after timeFrom)
 * @param {'create_time' | 'update_time'} [args.timeRangeField='update_time']
 * @param {number} [args.pageSize]
 * @param {string} [args.cursor=''] — empty string for first page
 * @param {string} [args.orderStatus] — e.g. 'COMPLETED', 'SHIPPED', 'READY_TO_SHIP'
 * @returns {Promise<{ orders: Array<{ order_sn: string }>, nextCursor: string, more: boolean }>}
 */
export async function getOrderList({
  credentials,
  timeFrom,
  timeTo,
  timeRangeField = 'update_time',
  pageSize = MAX_PAGE_SIZE,
  cursor = '',
  orderStatus,
}) {
  assertCredentials(credentials);
  assertTimeWindow(timeFrom, timeTo);

  const extraQuery = {
    time_range_field: timeRangeField,
    time_from: timeFrom,
    time_to: timeTo,
    page_size: Math.min(Math.max(1, pageSize | 0), MAX_PAGE_SIZE),
    cursor,
  };
  if (orderStatus) extraQuery.order_status = orderStatus;

  const signed = buildShopeeShopRequest({
    method: 'GET',
    path: ORDER_LIST_PATH,
    extraQuery,
    partnerId: credentials.partnerId,
    partnerKey: credentials.partnerKey,
    accessToken: credentials.accessToken,
    shopId: credentials.shopId,
    environment: credentials.environment,
  });

  const { body } = await marketplaceFetch({
    url: signed.url,
    method: signed.method,
    headers: signed.headers,
    body: signed.body,
    classifier: classifyShopeeError,
    providerLabel: 'shopee',
  });

  const data = body?.response || {};
  const orders = Array.isArray(data.order_list) ? data.order_list : [];

  return {
    orders: orders.map((o) => ({ order_sn: String(o.order_sn) })),
    nextCursor: data.next_cursor || '',
    more: Boolean(data.more),
  };
}

// ---------------------------------------------------------------------------
// Order detail (batch hydrate)
// ---------------------------------------------------------------------------

/**
 * Fetch detailed info for up to 50 order_sns in one call.
 *
 * @param {object} args
 * @param {object} args.credentials
 * @param {string[]} args.orderSns — max MAX_DETAIL_BATCH
 * @returns {Promise<Array<object>>} array of full order objects
 */
export async function getOrderDetail({ credentials, orderSns }) {
  assertCredentials(credentials);
  if (!Array.isArray(orderSns) || orderSns.length === 0) return [];
  if (orderSns.length > MAX_DETAIL_BATCH) {
    throw new Error(`getOrderDetail: max ${MAX_DETAIL_BATCH} SNs per call, got ${orderSns.length}`);
  }

  const signed = buildShopeeShopRequest({
    method: 'GET',
    path: ORDER_DETAIL_PATH,
    extraQuery: {
      order_sn_list: orderSns.join(','),
      response_optional_fields: DETAIL_OPTIONAL_FIELDS,
    },
    partnerId: credentials.partnerId,
    partnerKey: credentials.partnerKey,
    accessToken: credentials.accessToken,
    shopId: credentials.shopId,
    environment: credentials.environment,
  });

  const { body } = await marketplaceFetch({
    url: signed.url,
    method: signed.method,
    headers: signed.headers,
    body: signed.body,
    classifier: classifyShopeeError,
    providerLabel: 'shopee',
  });

  const data = body?.response || {};
  return Array.isArray(data.order_list) ? data.order_list : [];
}

// ---------------------------------------------------------------------------
// Escrow detail (authoritative per-order fees)
// ---------------------------------------------------------------------------

/**
 * Fetch the escrow detail for a single completed order. Contains the real
 * commission_fee, service_fee, and escrow_amount (net payout) — use these
 * in the fee reconciliation daily job to overwrite the static per-channel
 * fee % estimates in tf_marketplace_fees.
 *
 * @param {object} args
 * @param {object} args.credentials
 * @param {string} args.orderSn
 * @returns {Promise<object>} the raw escrow detail object
 */
export async function getEscrowDetail({ credentials, orderSn }) {
  assertCredentials(credentials);
  if (!orderSn) throw new Error('getEscrowDetail: orderSn is required');

  const signed = buildShopeeShopRequest({
    method: 'GET',
    path: ESCROW_DETAIL_PATH,
    extraQuery: { order_sn: orderSn },
    partnerId: credentials.partnerId,
    partnerKey: credentials.partnerKey,
    accessToken: credentials.accessToken,
    shopId: credentials.shopId,
    environment: credentials.environment,
  });

  const { body } = await marketplaceFetch({
    url: signed.url,
    method: signed.method,
    headers: signed.headers,
    body: signed.body,
    classifier: classifyShopeeError,
    providerLabel: 'shopee',
  });

  return body?.response || {};
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Split a large time window into Shopee-compliant 15-day chunks.
 * The last chunk may be shorter. Returns an array of [from, to] pairs in
 * Unix seconds.
 *
 * @param {number} from — Unix seconds (inclusive)
 * @param {number} to — Unix seconds (exclusive)
 * @returns {Array<[number, number]>}
 */
export function enumerateWindows(from, to) {
  if (from >= to) return [];
  const windows = [];
  let cursor = from;
  while (cursor < to) {
    const next = Math.min(cursor + MAX_WINDOW_SECONDS, to);
    windows.push([cursor, next]);
    cursor = next;
  }
  return windows;
}

function assertCredentials(c) {
  if (!c) throw new Error('credentials object required');
  const missing = ['partnerId', 'partnerKey', 'accessToken', 'shopId'].filter((k) => !c[k]);
  if (missing.length > 0) {
    throw new Error(`credentials missing: ${missing.join(', ')}`);
  }
}

function assertTimeWindow(from, to) {
  if (typeof from !== 'number' || typeof to !== 'number') {
    throw new Error('timeFrom and timeTo must be Unix-seconds numbers');
  }
  if (to <= from) {
    throw new Error('timeTo must be greater than timeFrom');
  }
  if (to - from > MAX_WINDOW_SECONDS) {
    throw new Error(
      `time window is ${to - from}s but Shopee caps at ${MAX_WINDOW_SECONDS}s (15 days). ` +
        'Use enumerateWindows() to chunk.'
    );
  }
}
