// lib/services/marketplace/shopee/auth.js
//
// Shopee Open Platform v2 OAuth helpers.
//
// Three stages:
//
//   1. buildAuthorizeUrl({ redirect })
//        Build the URL the merchant is redirected to. The URL must include a
//        signed timestamp — Shopee's "auth_partner" flow uses the public
//        HMAC formula (partner_id + path + timestamp).
//
//   2. exchangeAuthCode({ code, shopId })
//        Called from the OAuth callback. Shopee's callback gives us `code`,
//        `shop_id`, and `main_account_id`. This step POSTs to
//        /api/v2/auth/token/get with a signed timestamp.
//
//   3. refreshAccessToken({ refreshToken, shopId })
//        POSTs to /api/v2/auth/access_token/get with a signed timestamp.
//        access_token lives ~4 hours; refresh_token ~30 days.
//
// The Shopee OAuth endpoints are PUBLIC (signed with the 3-field formula,
// not the 5-field shop formula). The signer builds the URLs; this file
// handles the HTTP + response normalization.
//
// IMPORTANT: Shopee v2 auth endpoints do NOT include access_token or shop_id
// in the signature even though shop_id is part of the POST body. Only the
// 3-field public formula applies.

import { marketplaceFetch } from '../http.js';
import { classifyShopeeError } from '../errors.js';
import { buildShopeePublicRequest, getShopeeHost } from './signer.js';

// ---------------------------------------------------------------------------
// Stage 1: Authorization redirect URL
// ---------------------------------------------------------------------------

const AUTH_PARTNER_PATH = '/api/v2/shop/auth_partner';

/**
 * Build the URL the merchant is redirected to for shop authorization.
 *
 * Shopee redirects back to `redirect` with:
 *   ?code=<auth_code>&shop_id=<id>&main_account_id=<id>
 *
 * @param {object} args
 * @param {string | number} args.partnerId
 * @param {string} args.partnerKey
 * @param {string} args.redirect — the callback URL registered with Shopee
 * @param {number} [args.timestamp]
 * @param {'live' | 'test'} [args.environment]
 * @returns {string} the URL to redirect the merchant to
 */
export function buildAuthorizeUrl({ partnerId, partnerKey, redirect, timestamp, environment }) {
  if (!redirect) throw new Error('buildAuthorizeUrl: redirect is required');

  const result = buildShopeePublicRequest({
    method: 'GET',
    path: AUTH_PARTNER_PATH,
    extraQuery: { redirect },
    partnerId,
    partnerKey,
    timestamp,
    environment,
  });
  return result.url;
}

// ---------------------------------------------------------------------------
// Stage 2: Exchange code for tokens
// ---------------------------------------------------------------------------

const TOKEN_GET_PATH = '/api/v2/auth/token/get';

/**
 * Exchange an auth code from the callback for an access_token + refresh_token.
 *
 * Response shape (Shopee v2):
 *   {
 *     access_token: '...',
 *     refresh_token: '...',
 *     expire_in: 14400,              // seconds — ~4 hours
 *     request_id: '...',
 *     error: '',                     // empty on success
 *     message: '',
 *     shop_id_list: [ 555666 ],      // or 'merchant_id_list'
 *     ...
 *   }
 *
 * Note: Shopee documents BOTH `shop_id_list` (for shop-level auth) and
 * `merchant_id_list` (for merchant-level auth with sub-shops). For Tokoflow
 * we only care about shop-level — use the shop_id we received in the
 * callback.
 *
 * @param {object} args
 * @param {string | number} args.partnerId
 * @param {string} args.partnerKey
 * @param {string} args.code — auth_code from the callback
 * @param {string | number} args.shopId — from the callback
 * @param {'live' | 'test'} [args.environment]
 * @returns {Promise<ShopeeTokenBundle>}
 */
export async function exchangeAuthCode({ partnerId, partnerKey, code, shopId, environment }) {
  if (!code) throw new Error('exchangeAuthCode: code is required');
  if (!shopId) throw new Error('exchangeAuthCode: shopId is required');

  const signed = buildShopeePublicRequest({
    method: 'POST',
    path: TOKEN_GET_PATH,
    body: {
      code,
      shop_id: Number(shopId),
      partner_id: Number(partnerId),
    },
    partnerId,
    partnerKey,
    environment,
  });

  const { body } = await marketplaceFetch({
    url: signed.url,
    method: signed.method,
    headers: signed.headers,
    body: signed.body,
    classifier: classifyShopeeError,
    providerLabel: 'shopee',
  });

  return normalizeTokenBundle(body, shopId);
}

// ---------------------------------------------------------------------------
// Stage 3: Refresh access token
// ---------------------------------------------------------------------------

const ACCESS_TOKEN_REFRESH_PATH = '/api/v2/auth/access_token/get';

/**
 * Refresh an expiring access_token using the stored refresh_token.
 *
 * Shopee returns a NEW refresh_token on each refresh call — always persist
 * both. Reusing an old refresh_token after a successful refresh will fail.
 *
 * @param {object} args
 * @param {string | number} args.partnerId
 * @param {string} args.partnerKey
 * @param {string} args.refreshToken
 * @param {string | number} args.shopId
 * @param {'live' | 'test'} [args.environment]
 * @returns {Promise<ShopeeTokenBundle>}
 */
export async function refreshAccessToken({
  partnerId,
  partnerKey,
  refreshToken,
  shopId,
  environment,
}) {
  if (!refreshToken) throw new Error('refreshAccessToken: refreshToken is required');
  if (!shopId) throw new Error('refreshAccessToken: shopId is required');

  const signed = buildShopeePublicRequest({
    method: 'POST',
    path: ACCESS_TOKEN_REFRESH_PATH,
    body: {
      refresh_token: refreshToken,
      shop_id: Number(shopId),
      partner_id: Number(partnerId),
    },
    partnerId,
    partnerKey,
    environment,
  });

  const { body } = await marketplaceFetch({
    url: signed.url,
    method: signed.method,
    headers: signed.headers,
    body: signed.body,
    classifier: classifyShopeeError,
    providerLabel: 'shopee',
  });

  return normalizeTokenBundle(body, shopId);
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * @typedef {object} ShopeeTokenBundle
 * @property {string} accessToken
 * @property {string} refreshToken
 * @property {Date} accessTokenExpiresAt
 * @property {Date} refreshTokenExpiresAt — ~30 days from now (Shopee doesn't
 *   return this explicitly; we compute a conservative 30-day window)
 * @property {string} shopId
 * @property {string} [requestId]
 */

function normalizeTokenBundle(body, shopId) {
  if (!body || typeof body !== 'object') {
    throw new Error('normalizeTokenBundle: response is not an object');
  }
  if (!body.access_token) {
    throw new Error(`normalizeTokenBundle: response missing access_token (error="${body.error || ''}")`);
  }

  const now = Date.now();
  const accessTokenExpiresAt = new Date(now + (Number(body.expire_in) || 0) * 1000);
  // Shopee doesn't publish a refresh_token lifetime in this response, but
  // docs state 30 days. Conservative: 29 days to leave a safety window.
  const refreshTokenExpiresAt = new Date(now + 29 * 24 * 60 * 60 * 1000);

  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
    shopId: String(shopId),
    requestId: body.request_id,
  };
}

// Re-export for callers that want to build URLs from a different module.
export { getShopeeHost };
