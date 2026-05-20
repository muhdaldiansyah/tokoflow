// app/api/marketplace/callback/[provider]/route.js
//
// OAuth callback handler. The merchant is redirected here by the marketplace
// after approving the connection. We:
//
//   1. Extract the code + identifiers from the query string.
//   2. Verify the signed `state` param against the current Supabase session
//      (CSRF protection — the user who started the flow must be the same
//      user who receives the callback).
//   3. Exchange the code for tokens.
//   4. For TikTok Shop: fetch authorized shops to get the per-shop cipher.
//   5. Upsert one row in tf_marketplace_connections per shop, with
//      encrypted tokens.
//   6. Redirect the browser back to /marketplace?connected=<provider> on
//      success, or /marketplace?error=<message> on failure.
//
// This route is GET because OAuth providers always redirect with GET.
// It needs Node runtime (crypto + ESM imports).

import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

import { authenticateRequest } from '../../../../../lib/utils/auth-helpers';

import {
  exchangeAuthCode as exchangeTikTokCode,
  fetchAuthorizedShops,
} from '../../../../../lib/services/marketplace/tiktok-shop/auth.js';
import { exchangeAuthCode as exchangeShopeeCode } from '../../../../../lib/services/marketplace/shopee/auth.js';

import { upsertConnectionWithTokens } from '../../../../../lib/services/marketplace/connections.js';

export const runtime = 'nodejs';

const SUPPORTED_PROVIDERS = new Set(['shopee', 'tiktok-shop']);

export async function GET(request, { params }) {
  const { provider } = await params;
  const url = new URL(request.url);

  const returnTo = (search) => NextResponse.redirect(`${url.origin}/marketplace${search}`);

  if (!SUPPORTED_PROVIDERS.has(provider)) {
    return returnTo(`?error=${encodeURIComponent('provider_unknown')}`);
  }

  try {
    // --- Authenticate the current user --------------------------------------
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return returnTo(`?error=${encodeURIComponent('session_expired')}`);
    }

    // --- Verify state (CSRF) -----------------------------------------------
    const state = url.searchParams.get('state');
    if (!verifyState(state, auth.user.id)) {
      return returnTo(`?error=${encodeURIComponent('state_invalid')}`);
    }

    // --- Provider-specific exchange ----------------------------------------
    if (provider === 'tiktok-shop') {
      const result = await handleTikTokShopCallback({ url, auth });
      if (!result.ok) return returnTo(`?error=${encodeURIComponent(result.error)}`);
      return returnTo(`?connected=tiktok-shop&shops=${result.shopCount}`);
    }

    if (provider === 'shopee') {
      const result = await handleShopeeCallback({ url, auth });
      if (!result.ok) return returnTo(`?error=${encodeURIComponent(result.error)}`);
      return returnTo(`?connected=shopee`);
    }

    return returnTo(`?error=${encodeURIComponent('provider_unknown')}`);
  } catch (err) {
    console.error('[marketplace/callback]', provider, err);
    return returnTo(`?error=${encodeURIComponent('callback_failed')}`);
  }
}

// ---------------------------------------------------------------------------
// TikTok Shop
// ---------------------------------------------------------------------------

async function handleTikTokShopCallback({ url, auth }) {
  const code = url.searchParams.get('code');
  if (!code) return { ok: false, error: 'no_code' };

  const appKey = process.env.TIKTOKSHOP_APP_KEY;
  const appSecret = process.env.TIKTOKSHOP_APP_SECRET;
  if (!appKey || !appSecret) return { ok: false, error: 'env_missing' };

  // 1. Exchange auth_code for token bundle.
  const bundle = await exchangeTikTokCode({ appKey, appSecret, authCode: code });

  // 2. Fetch the list of shops this token is authorized for + their ciphers.
  const shops = await fetchAuthorizedShops({
    appKey,
    appSecret,
    accessToken: bundle.accessToken,
  });

  if (shops.length === 0) {
    return { ok: false, error: 'no_shops_authorized' };
  }

  // 3. Upsert one connection row per shop.
  for (const shop of shops) {
    await upsertConnectionWithTokens(auth.supabase, {
      channel: 'tiktok-shop',
      shopId: shop.id,
      shopName: shop.name,
      sellerType: shop.sellerType,
      shopCipher: shop.cipher,
      accessToken: bundle.accessToken,
      refreshToken: bundle.refreshToken,
      accessTokenExpiresAt: bundle.accessTokenExpiresAt,
      refreshTokenExpiresAt: bundle.refreshTokenExpiresAt,
      scope: Array.isArray(bundle.grantedScopes) ? bundle.grantedScopes.join(',') : null,
      connectionMeta: {
        open_id: bundle.openId,
        seller_name: bundle.sellerName,
        seller_base_region: bundle.sellerBaseRegion,
        shop_region: shop.region,
        shop_code: shop.code,
      },
      createdBy: auth.user.id,
    });
  }

  return { ok: true, shopCount: shops.length };
}

// ---------------------------------------------------------------------------
// Shopee
// ---------------------------------------------------------------------------

async function handleShopeeCallback({ url, auth }) {
  const code = url.searchParams.get('code');
  const shopId = url.searchParams.get('shop_id');
  if (!code) return { ok: false, error: 'no_code' };
  if (!shopId) return { ok: false, error: 'no_shop_id' };

  const partnerId = process.env.SHOPEE_PARTNER_ID;
  const partnerKey = process.env.SHOPEE_PARTNER_KEY;
  const environment = process.env.SHOPEE_ENVIRONMENT || 'test';
  if (!partnerId || !partnerKey) return { ok: false, error: 'env_missing' };

  const bundle = await exchangeShopeeCode({
    partnerId,
    partnerKey,
    code,
    shopId,
    environment,
  });

  await upsertConnectionWithTokens(auth.supabase, {
    channel: 'shopee',
    shopId: bundle.shopId,
    shopName: null, // Shopee's token response doesn't include shop name; populate on first sync
    sellerType: 'Shopee',
    shopCipher: null, // Shopee doesn't use a cipher
    accessToken: bundle.accessToken,
    refreshToken: bundle.refreshToken,
    accessTokenExpiresAt: bundle.accessTokenExpiresAt,
    refreshTokenExpiresAt: bundle.refreshTokenExpiresAt,
    scope: null,
    connectionMeta: {
      main_account_id: url.searchParams.get('main_account_id') || null,
      request_id: bundle.requestId,
    },
    createdBy: auth.user.id,
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// State verification
// ---------------------------------------------------------------------------

/**
 * Verify a state token produced by the connect route.
 * Format: base64url(user_id.ts).hex_hmac
 *
 * Rejects if:
 *   - format is wrong
 *   - HMAC mismatch
 *   - user_id differs from current session user
 *   - older than 1 hour
 */
function verifyState(state, currentUserId) {
  if (!state || typeof state !== 'string') return false;
  const parts = state.split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, sig] = parts;
  let payload;
  try {
    payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
  } catch {
    return false;
  }

  const secret = process.env.CRON_SECRET || process.env.MARKETPLACE_ENCRYPTION_KEY || 'dev-state-secret';
  const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const sigBuf = Buffer.from(sig || '', 'hex');
  const expBuf = Buffer.from(expectedSig, 'hex');
  if (sigBuf.length !== expBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false;

  const [userId, tsStr] = payload.split('.');
  if (userId !== currentUserId) return false;

  const ts = Number(tsStr);
  if (!Number.isFinite(ts)) return false;
  const ageSeconds = Math.floor(Date.now() / 1000) - ts;
  if (ageSeconds < 0 || ageSeconds > 3600) return false;

  return true;
}
