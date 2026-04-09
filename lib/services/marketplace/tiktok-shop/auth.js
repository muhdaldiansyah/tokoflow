// lib/services/marketplace/tiktok-shop/auth.js
//
// TikTok Shop Partner Center OAuth helpers.
//
// Three stages of the token lifecycle live here:
//
//   1. buildAuthorizeUrl({ state })
//        Builds the URL the merchant gets redirected to. The `state` should
//        be a CSRF-signed token that ties the callback back to a session so
//        the callback handler can resolve it safely.
//
//   2. exchangeAuthCode({ authCode })
//        Called from the OAuth callback. Exchanges the short-lived auth_code
//        for an access_token + refresh_token bundle. IMPORTANT: TikTok Shop
//        uses GET (not POST) with secrets in the query string for this call,
//        against auth.tiktok-shops.com (not the open-api host).
//
//   3. refreshAccessToken({ refreshToken })
//        Called by the sync loop when the stored access_token is close to
//        expiry. Same auth host, GET semantics.
//
// After token exchange, the caller must ALSO call fetchAuthorizedShops({
// accessToken }) to get the per-shop `cipher` values and persist them into
// tf_marketplace_connections.shop_cipher — that's what future API calls need.
//
// This module depends on the shared http.js fetch wrapper for retry/backoff
// and on classifyTikTokShopError for error taxonomy. It is called from API
// routes (connect + callback) and from the sync cron.

import { marketplaceFetch } from '../http.js';
import { classifyTikTokShopError } from '../errors.js';
import { signTikTokShopRequest, TIKTOK_SHOP_AUTH_HOST } from './signer.js';

// ---------------------------------------------------------------------------
// Stage 1: Authorization URL
// ---------------------------------------------------------------------------

/**
 * Build the TikTok Shop merchant authorization URL.
 *
 * Scopes are configured in Partner Center per app — they are NOT passed as
 * a query param like with standard OAuth. The merchant sees whatever scopes
 * the app was approved for on the consent screen.
 *
 * @param {object} args
 * @param {string} args.appKey — from TIKTOKSHOP_APP_KEY env
 * @param {string} args.state — opaque CSRF token; used to tie callback to session
 * @returns {string} the URL to redirect the merchant to
 */
export function buildAuthorizeUrl({ appKey, state }) {
  if (!appKey) throw new Error('buildAuthorizeUrl: appKey is required');
  if (!state) throw new Error('buildAuthorizeUrl: state is required (CSRF protection)');

  const params = new URLSearchParams({
    app_key: appKey,
    state,
  });
  return `${TIKTOK_SHOP_AUTH_HOST}/oauth/authorize?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Stage 2: Exchange auth_code for tokens
// ---------------------------------------------------------------------------

/**
 * Exchange the OAuth callback's `code` (aka auth_code) for a token bundle.
 *
 * Response shape per TikTok Shop docs:
 *   {
 *     code: 0,
 *     data: {
 *       access_token: '...',
 *       access_token_expire_in: 604800,   // seconds
 *       refresh_token: '...',
 *       refresh_token_expire_in: 31536000,
 *       open_id: '...',
 *       seller_name: '...',
 *       seller_base_region: 'ID',
 *       granted_scopes: [ ... ]
 *     },
 *     message: '',
 *     request_id: '...'
 *   }
 *
 * @param {object} args
 * @param {string} args.appKey
 * @param {string} args.appSecret
 * @param {string} args.authCode — from ?code= on the OAuth callback
 * @returns {Promise<TikTokShopTokenBundle>}
 */
export async function exchangeAuthCode({ appKey, appSecret, authCode }) {
  if (!authCode) throw new Error('exchangeAuthCode: authCode is required');

  const params = new URLSearchParams({
    app_key: appKey,
    app_secret: appSecret,
    auth_code: authCode,
    grant_type: 'authorized_code',
  });
  const url = `${TIKTOK_SHOP_AUTH_HOST}/api/v2/token/get?${params.toString()}`;

  // Note: the auth endpoints are NOT signed with HMAC — they're just GETs
  // with app_secret in the query string. The shared marketplaceFetch wrapper
  // still gives us retry/backoff/classification.
  const { body } = await marketplaceFetch({
    url,
    method: 'GET',
    classifier: classifyTikTokShopError,
    providerLabel: 'tiktok-shop',
  });

  return normalizeTokenBundle(body?.data);
}

// ---------------------------------------------------------------------------
// Stage 3: Refresh access_token
// ---------------------------------------------------------------------------

/**
 * Exchange a refresh_token for a new access_token bundle.
 *
 * @param {object} args
 * @param {string} args.appKey
 * @param {string} args.appSecret
 * @param {string} args.refreshToken
 * @returns {Promise<TikTokShopTokenBundle>}
 */
export async function refreshAccessToken({ appKey, appSecret, refreshToken }) {
  if (!refreshToken) throw new Error('refreshAccessToken: refreshToken is required');

  const params = new URLSearchParams({
    app_key: appKey,
    app_secret: appSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const url = `${TIKTOK_SHOP_AUTH_HOST}/api/v2/token/refresh?${params.toString()}`;

  const { body } = await marketplaceFetch({
    url,
    method: 'GET',
    classifier: classifyTikTokShopError,
    providerLabel: 'tiktok-shop',
  });

  return normalizeTokenBundle(body?.data);
}

// ---------------------------------------------------------------------------
// Stage 4: Fetch authorized shops + ciphers
// ---------------------------------------------------------------------------

/**
 * Fetch the list of shops this access_token is authorized for, including
 * the per-shop `cipher` that every subsequent API call requires.
 *
 * This hits the open-api host (not auth host) and IS a signed request.
 * The path is shopless per signer.js so no shop_cipher is required yet.
 *
 * Response shape:
 *   {
 *     code: 0,
 *     data: {
 *       shops: [
 *         {
 *           id: '1234567890',
 *           name: 'My Shop',
 *           region: 'ID',
 *           seller_type: 'TIKTOK_SHOP',  // or 'TOKOPEDIA_SHOP' post-merger
 *           cipher: 'OPAQUE_CIPHER',
 *           code: 'GSxxxx'               // shop code visible in seller center
 *         },
 *         ...
 *       ]
 *     }
 *   }
 *
 * A single access_token can be authorized for multiple shops (e.g. a
 * merchant with both a TikTok Shop and a migrated Tokopedia storefront).
 * The caller should persist one tf_marketplace_connections row per shop.
 *
 * @param {object} args
 * @param {string} args.appKey
 * @param {string} args.appSecret
 * @param {string} args.accessToken
 * @returns {Promise<Array<{ id: string, name: string, region: string, sellerType: string, cipher: string, code?: string }>>}
 */
export async function fetchAuthorizedShops({ appKey, appSecret, accessToken }) {
  const signed = signTikTokShopRequest({
    method: 'GET',
    path: '/authorization/202309/shops',
    appKey,
    appSecret,
    accessToken,
    // shopless path — no shopCipher needed
  });

  const { body } = await marketplaceFetch({
    url: signed.url,
    method: signed.method,
    headers: signed.headers,
    body: signed.body,
    classifier: classifyTikTokShopError,
    providerLabel: 'tiktok-shop',
  });

  const shops = Array.isArray(body?.data?.shops) ? body.data.shops : [];
  return shops.map((s) => ({
    id: String(s.id),
    name: s.name,
    region: s.region,
    sellerType: s.seller_type,
    cipher: s.cipher,
    code: s.code,
  }));
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * @typedef {object} TikTokShopTokenBundle
 * @property {string} accessToken
 * @property {Date} accessTokenExpiresAt
 * @property {string} refreshToken
 * @property {Date} refreshTokenExpiresAt
 * @property {string} [openId]
 * @property {string} [sellerName]
 * @property {string} [sellerBaseRegion]
 * @property {string[]} [grantedScopes]
 */

/**
 * Normalize the raw `data` object from /api/v2/token/get or /token/refresh
 * into a camelCased bundle with absolute expiry timestamps.
 *
 * @param {any} data
 * @returns {TikTokShopTokenBundle}
 */
function normalizeTokenBundle(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('normalizeTokenBundle: response missing `data` object');
  }
  if (!data.access_token) {
    throw new Error('normalizeTokenBundle: response missing access_token');
  }

  const now = Date.now();
  const accessTokenExpiresAt = new Date(
    now + (Number(data.access_token_expire_in) || 0) * 1000
  );
  const refreshTokenExpiresAt = new Date(
    now + (Number(data.refresh_token_expire_in) || 0) * 1000
  );

  return {
    accessToken: data.access_token,
    accessTokenExpiresAt,
    refreshToken: data.refresh_token,
    refreshTokenExpiresAt,
    openId: data.open_id,
    sellerName: data.seller_name,
    sellerBaseRegion: data.seller_base_region,
    grantedScopes: Array.isArray(data.granted_scopes) ? data.granted_scopes : undefined,
  };
}
