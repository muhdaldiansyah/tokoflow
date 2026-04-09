// lib/services/marketplace/tiktok-shop/signer.js
//
// TikTok Shop Partner Center v202309 request signer.
//
// Every authenticated call to https://open-api.tiktokglobalshop.com must
// include a `sign` query parameter computed with HMAC-SHA256(app_secret, ...).
// The exact string-to-sign composition is partner-gated documentation, so
// this implementation follows the EcomPHP reference SDK verbatim:
//
//   https://github.com/EcomPHP/tiktokshop-php/blob/master/src/Client.php
//
// Algorithm (deterministic given the same inputs):
//
//   1. Collect the full set of query params that will go on the wire:
//        caller-provided params + app_key + timestamp
//        + shop_cipher (unless path is "shopless")
//   2. Remove `sign`, `access_token`, and `x-tts-access-token` from the
//      set used to build the signature (the access_token goes in a header,
//      and `sign` is what we're computing).
//   3. Sort remaining keys alphabetically (ASCII, case-sensitive).
//   4. Concatenate each as `{key}{value}` with NO separator and NO URL
//      encoding. Skip any value that is null / undefined / array.
//   5. Prepend the path (leading slash, no host, no query string).
//   6. If method is not GET and content-type is not multipart/form-data,
//      append the raw JSON body (byte-identical to what goes on the wire).
//   7. Wrap the whole string with app_secret on both ends:
//        wrapped = app_secret + step6 + app_secret
//   8. sign = lowercase hex of hmac_sha256(app_secret, wrapped).
//
// The `access_token` header is attached separately by the caller as
// `x-tts-access-token`, NOT as an `Authorization: Bearer` header.
//
// This file is pure — no network, no filesystem, no Supabase. It exists at
// this boundary specifically so it can be unit-tested against known vectors
// without credentials.

import { hmacSha256Hex } from '../crypto.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const TIKTOK_SHOP_API_HOST = 'https://open-api.tiktokglobalshop.com';
export const TIKTOK_SHOP_AUTH_HOST = 'https://auth.tiktok-shops.com';

// Paths that do NOT require shop_cipher in the signature and query string.
// Derived from the EcomPHP SDK's isShoplessRoute() helper.
const SHOPLESS_PATH_PREFIXES = [
  '/authorization/',
  '/seller/',
  '/api/v2/token/',
];

// Exact path suffixes that are shopless even though they live under /product/
// (these are global category/brand/file-upload endpoints).
const SHOPLESS_EXACT_PATHS = new Set([
  // add here if new upload endpoints are discovered; the common ones today:
  '/product/202309/categories',
  '/product/202309/brands',
  '/product/202309/files/upload',
  '/product/202309/images/upload',
]);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a fully-signed TikTok Shop API request.
 *
 * Returned object is ready to pass to `marketplaceFetch`:
 *   const signed = signTikTokShopRequest({ ... });
 *   await marketplaceFetch({
 *     url: signed.url,
 *     method: signed.method,
 *     headers: signed.headers,
 *     body: signed.body,
 *     classifier: classifyTikTokShopError,
 *     providerLabel: 'tiktok-shop',
 *   });
 *
 * @param {object} args
 * @param {string} args.method — 'GET' | 'POST' | 'PUT' | 'DELETE'
 * @param {string} args.path — e.g. '/order/202309/orders/search'
 * @param {Record<string, string | number>} [args.query] — caller-provided query params (sortable scalars only)
 * @param {object | null} [args.body] — request body (will be JSON.stringify'd deterministically if present)
 * @param {string} args.appKey
 * @param {string} args.appSecret
 * @param {string} [args.accessToken] — goes in x-tts-access-token header; excluded from sig
 * @param {string} [args.shopCipher] — required for all non-shopless paths
 * @param {number} [args.timestamp] — unix seconds; defaults to now. Overridable for tests.
 * @param {string} [args.contentType='application/json']
 * @returns {{ url: string, method: string, headers: Record<string, string>, body: string | null, debug: object }}
 */
export function signTikTokShopRequest({
  method,
  path,
  query = {},
  body = null,
  appKey,
  appSecret,
  accessToken,
  shopCipher,
  timestamp,
  contentType = 'application/json',
}) {
  if (!method) throw new Error('signTikTokShopRequest: method is required');
  if (!path || !path.startsWith('/')) {
    throw new Error('signTikTokShopRequest: path must start with "/"');
  }
  if (!appKey) throw new Error('signTikTokShopRequest: appKey is required');
  if (!appSecret) throw new Error('signTikTokShopRequest: appSecret is required');

  const normalizedMethod = method.toUpperCase();
  const ts = typeof timestamp === 'number' ? timestamp : Math.floor(Date.now() / 1000);

  // 1. Build the full query-param set that will go on the wire.
  const wireQuery = { ...query, app_key: appKey, timestamp: ts };

  const shopless = isShoplessPath(path);
  if (!shopless) {
    if (!shopCipher) {
      throw new Error(
        `signTikTokShopRequest: shop_cipher is required for path "${path}" ` +
          'but was not provided. Only authorization/seller/token endpoints are shopless.'
      );
    }
    wireQuery.shop_cipher = shopCipher;
  }

  // 2-5. Build the sortable portion of the signable string.
  const signable = buildSignableString({
    path,
    query: wireQuery,
    method: normalizedMethod,
    body,
    contentType,
  });

  // 6-7. Wrap with app_secret on both ends.
  const wrapped = appSecret + signable + appSecret;

  // 8. Compute signature.
  const sign = hmacSha256Hex(appSecret, wrapped).toLowerCase();

  // Assemble final URL (deterministic key order — sorted — for reproducibility
  // in logs and tests; the platform doesn't require a specific query order).
  const finalQuery = { ...wireQuery, sign };
  const qs = encodeQueryString(finalQuery);
  const url = `${TIKTOK_SHOP_API_HOST}${path}?${qs}`;

  const headers = {
    'content-type': contentType,
  };
  if (accessToken) {
    headers['x-tts-access-token'] = accessToken;
  }

  // Serialize body deterministically only if the caller passed an object.
  // The serialized string is the EXACT bytes we signed above — this is
  // critical: any re-serialization between sign and send will fail auth.
  let serializedBody = null;
  if (normalizedMethod !== 'GET' && body !== null && body !== undefined) {
    serializedBody = typeof body === 'string' ? body : stableJsonStringify(body);
  }

  return {
    url,
    method: normalizedMethod,
    headers,
    body: serializedBody,
    debug: {
      path,
      timestamp: ts,
      signable, // redact before logging in production
      sign,
    },
  };
}

// ---------------------------------------------------------------------------
// Internals (exported for unit tests)
// ---------------------------------------------------------------------------

/**
 * @internal exported for testing
 */
export function isShoplessPath(path) {
  if (SHOPLESS_EXACT_PATHS.has(path)) return true;
  for (const prefix of SHOPLESS_PATH_PREFIXES) {
    if (path.startsWith(prefix)) return true;
  }
  return false;
}

/**
 * Build the string-to-sign (path + sorted k-v concat + optional body).
 * Does NOT wrap with app_secret — that's the caller's job.
 *
 * @internal exported for testing
 */
export function buildSignableString({ path, query, method, body, contentType }) {
  // Exclude fields that MUST NOT appear in the signature.
  const EXCLUDED = new Set(['sign', 'access_token', 'x-tts-access-token']);

  const keys = Object.keys(query)
    .filter((k) => !EXCLUDED.has(k))
    .filter((k) => {
      const v = query[k];
      // Skip null/undefined/arrays per SDK behavior.
      if (v === null || v === undefined) return false;
      if (Array.isArray(v)) return false;
      return true;
    })
    .sort();

  const concatenated = keys.map((k) => `${k}${query[k]}`).join('');
  let signable = path + concatenated;

  if (
    method !== 'GET' &&
    body !== null &&
    body !== undefined &&
    contentType !== 'multipart/form-data'
  ) {
    const bodyString = typeof body === 'string' ? body : stableJsonStringify(body);
    signable += bodyString;
  }

  return signable;
}

/**
 * Deterministic JSON stringify with sorted object keys at every level.
 * Arrays preserve order. This is what we sign AND what we send on the wire,
 * so signature and transmission are byte-identical by construction.
 *
 * @internal exported for testing
 */
export function stableJsonStringify(value) {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sortKeys);
  const sorted = {};
  for (const k of Object.keys(value).sort()) {
    sorted[k] = sortKeys(value[k]);
  }
  return sorted;
}

/**
 * URL-encode a query param object into a query string.
 * Stable key order for log grep + test reproducibility.
 */
function encodeQueryString(params) {
  return Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(params[k]))}`)
    .join('&');
}
