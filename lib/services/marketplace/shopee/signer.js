// lib/services/marketplace/shopee/signer.js
//
// Shopee Open Platform v2 request signer.
//
// Shopee v2 has a much simpler signing scheme than TikTok Shop:
//
//   Public endpoints (auth_partner redirect, token/get, access_token/get):
//     base = partner_id + path + timestamp
//     sign = lowercase_hex( hmac_sha256(partner_key, base) )
//     → passed as ?sign=<hex> query param
//
//   Shop-level endpoints (get_order_list, get_order_detail, get_escrow_detail, ...):
//     base = partner_id + path + timestamp + access_token + shop_id
//     sign = lowercase_hex( hmac_sha256(partner_key, base) )
//     → passed as ?sign=<hex> query param
//
// Notes:
//   - No separator between concatenated fields. Byte-identical string only.
//   - NO body signing in either variant — the JSON body of a POST is NOT
//     part of the signature. This is the opposite of TikTok Shop.
//   - NO sorting of query params. The base string uses a fixed field order.
//   - timestamp is Unix seconds as a decimal integer (not string, not ms).
//
// Base URLs:
//   Live:  https://partner.shopeemobile.com
//   UAT:   https://partner.test-stable.shopeemobile.com
// Selected via the SHOPEE_ENVIRONMENT env var ('live' | 'test').
//
// This file is pure — no network, no Supabase. Unit-testable against known
// vectors and paired with signer.test.js.

import { hmacSha256Hex } from '../crypto.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SHOPEE_LIVE_HOST = 'https://partner.shopeemobile.com';
export const SHOPEE_TEST_HOST = 'https://partner.test-stable.shopeemobile.com';

/**
 * Resolve the Shopee API host from env (or explicit override).
 *
 * @param {'live' | 'test'} [explicit]
 * @returns {string}
 */
export function getShopeeHost(explicit) {
  const env = explicit ?? process.env.SHOPEE_ENVIRONMENT ?? 'test';
  return env === 'live' ? SHOPEE_LIVE_HOST : SHOPEE_TEST_HOST;
}

// ---------------------------------------------------------------------------
// Signatures
// ---------------------------------------------------------------------------

/**
 * Compute the signature for a PUBLIC Shopee endpoint (auth_partner,
 * token/get, access_token/get).
 *
 * @param {object} args
 * @param {string | number} args.partnerId
 * @param {string} args.partnerKey
 * @param {string} args.path — e.g. '/api/v2/shop/auth_partner'
 * @param {number} args.timestamp — Unix seconds
 * @returns {string} lowercase hex
 */
export function signShopeePublic({ partnerId, partnerKey, path, timestamp }) {
  requireString('partnerKey', partnerKey);
  requirePath(path);
  requireTimestamp(timestamp);
  if (partnerId === undefined || partnerId === null || partnerId === '') {
    throw new Error('signShopeePublic: partnerId is required');
  }

  const base = `${partnerId}${path}${timestamp}`;
  return hmacSha256Hex(partnerKey, base).toLowerCase();
}

/**
 * Compute the signature for a SHOP-LEVEL authenticated Shopee endpoint.
 *
 * @param {object} args
 * @param {string | number} args.partnerId
 * @param {string} args.partnerKey
 * @param {string} args.path
 * @param {number} args.timestamp
 * @param {string} args.accessToken
 * @param {string | number} args.shopId
 * @returns {string} lowercase hex
 */
export function signShopeeShop({ partnerId, partnerKey, path, timestamp, accessToken, shopId }) {
  requireString('partnerKey', partnerKey);
  requirePath(path);
  requireTimestamp(timestamp);
  requireString('accessToken', accessToken);
  if (partnerId === undefined || partnerId === null || partnerId === '') {
    throw new Error('signShopeeShop: partnerId is required');
  }
  if (shopId === undefined || shopId === null || shopId === '') {
    throw new Error('signShopeeShop: shopId is required');
  }

  const base = `${partnerId}${path}${timestamp}${accessToken}${shopId}`;
  return hmacSha256Hex(partnerKey, base).toLowerCase();
}

// ---------------------------------------------------------------------------
// Request builders
// ---------------------------------------------------------------------------

/**
 * Build a signed Shopee PUBLIC request (for OAuth endpoints).
 *
 * @param {object} args
 * @param {'GET' | 'POST'} args.method
 * @param {string} args.path
 * @param {Record<string, string | number>} [args.extraQuery] — caller-provided params
 * @param {object} [args.body] — JSON body for POST (not signed)
 * @param {string | number} args.partnerId
 * @param {string} args.partnerKey
 * @param {number} [args.timestamp]
 * @param {'live' | 'test'} [args.environment]
 * @returns {{ url: string, method: string, headers: Record<string, string>, body: string | null, debug: { base: string, sign: string, timestamp: number } }}
 */
export function buildShopeePublicRequest({
  method,
  path,
  extraQuery = {},
  body = null,
  partnerId,
  partnerKey,
  timestamp,
  environment,
}) {
  const ts = typeof timestamp === 'number' ? timestamp : Math.floor(Date.now() / 1000);
  const sign = signShopeePublic({ partnerId, partnerKey, path, timestamp: ts });

  const query = { ...extraQuery, partner_id: partnerId, timestamp: ts, sign };
  const host = getShopeeHost(environment);
  const url = `${host}${path}?${encodeQuery(query)}`;

  const normalizedMethod = (method || 'GET').toUpperCase();
  const headers = { 'content-type': 'application/json' };
  const serializedBody =
    normalizedMethod !== 'GET' && body != null
      ? typeof body === 'string'
        ? body
        : JSON.stringify(body)
      : null;

  return {
    url,
    method: normalizedMethod,
    headers,
    body: serializedBody,
    debug: { base: `${partnerId}${path}${ts}`, sign, timestamp: ts },
  };
}

/**
 * Build a signed Shopee SHOP-LEVEL request (for authenticated API calls).
 *
 * @param {object} args
 * @param {'GET' | 'POST'} args.method
 * @param {string} args.path
 * @param {Record<string, string | number>} [args.extraQuery]
 * @param {object} [args.body] — JSON body for POST (not signed)
 * @param {string | number} args.partnerId
 * @param {string} args.partnerKey
 * @param {string} args.accessToken
 * @param {string | number} args.shopId
 * @param {number} [args.timestamp]
 * @param {'live' | 'test'} [args.environment]
 * @returns {{ url: string, method: string, headers: Record<string, string>, body: string | null, debug: object }}
 */
export function buildShopeeShopRequest({
  method,
  path,
  extraQuery = {},
  body = null,
  partnerId,
  partnerKey,
  accessToken,
  shopId,
  timestamp,
  environment,
}) {
  const ts = typeof timestamp === 'number' ? timestamp : Math.floor(Date.now() / 1000);
  const sign = signShopeeShop({
    partnerId,
    partnerKey,
    path,
    timestamp: ts,
    accessToken,
    shopId,
  });

  const query = {
    ...extraQuery,
    partner_id: partnerId,
    timestamp: ts,
    access_token: accessToken,
    shop_id: shopId,
    sign,
  };

  const host = getShopeeHost(environment);
  const url = `${host}${path}?${encodeQuery(query)}`;

  const normalizedMethod = (method || 'GET').toUpperCase();
  const headers = { 'content-type': 'application/json' };
  const serializedBody =
    normalizedMethod !== 'GET' && body != null
      ? typeof body === 'string'
        ? body
        : JSON.stringify(body)
      : null;

  return {
    url,
    method: normalizedMethod,
    headers,
    body: serializedBody,
    debug: {
      base: `${partnerId}${path}${ts}${accessToken}${shopId}`,
      sign,
      timestamp: ts,
    },
  };
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function requireString(name, value) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${name} is required (non-empty string)`);
  }
}
function requirePath(path) {
  if (typeof path !== 'string' || !path.startsWith('/')) {
    throw new Error('path must be a string starting with "/"');
  }
}
function requireTimestamp(ts) {
  if (typeof ts !== 'number' || !Number.isFinite(ts) || ts <= 0) {
    throw new Error('timestamp must be a positive Unix-seconds number');
  }
}
function encodeQuery(params) {
  return Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(params[k]))}`)
    .join('&');
}
