// app/api/marketplace/connect/[provider]/route.js
//
// Start the OAuth flow for a marketplace provider.
//
// The merchant clicks "Connect Shopee" / "Connect TikTok Shop" in the UI,
// which POSTs here. This route:
//
//   1. Validates the provider and env vars.
//   2. Generates a signed `state` token (HMAC-SHA256(CRON_SECRET, user_id + ts))
//      that the callback will verify — prevents cross-session CSRF and lets
//      us tie the callback back to the user who initiated it.
//   3. Builds the provider-specific OAuth URL via the signer modules.
//   4. Returns { redirect_url } so the client can navigate to it.
//
// Owner-only: only the merchant owner can connect a new marketplace.
// Staff see a read-only view of existing connections.
//
// Tokopedia is intentionally not supported — it's being absorbed into
// TikTok Shop Partner Center (see research in project memory). The route
// returns a 410 Gone for 'tokopedia' with a clear explanation.

import crypto from 'node:crypto';

import { authenticateRequest } from '../../../../../lib/utils/auth-helpers';
import { requireOwner } from '../../../../../lib/auth/role.js';
import { successResponse, errorResponse } from '../../../../../lib/utils/api-response';

import { buildAuthorizeUrl as buildTikTokAuthorizeUrl } from '../../../../../lib/services/marketplace/tiktok-shop/auth.js';
import { buildAuthorizeUrl as buildShopeeAuthorizeUrl } from '../../../../../lib/services/marketplace/shopee/auth.js';

export const runtime = 'nodejs';

const SUPPORTED_PROVIDERS = new Set(['shopee', 'tiktok-shop']);

export async function POST(request, { params }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return errorResponse(auth.error || 'Unauthorized', auth.status || 401);
    const gate = await requireOwner(auth);
    if (!gate.ok) return gate.response;

    const { provider } = await params;

    // Tokopedia is gone — TikTok Shop covers it now.
    if (provider === 'tokopedia') {
      return errorResponse(
        'Integrasi Tokopedia sudah diabsorpsi ke TikTok Shop Partner Center. ' +
          'Gunakan "Connect TikTok Shop" — satu koneksi menutupi toko Tokopedia dan TikTok Shop.',
        410
      );
    }

    if (!SUPPORTED_PROVIDERS.has(provider)) {
      return errorResponse(`Provider tidak dikenal: ${provider}`, 400);
    }

    // Build a signed state token that the callback will verify.
    const state = buildState(auth.user.id);

    let redirectUrl;

    if (provider === 'tiktok-shop') {
      const appKey = process.env.TIKTOKSHOP_APP_KEY;
      if (!appKey) {
        return errorResponse(
          'TIKTOKSHOP_APP_KEY belum dikonfigurasi. Set env var lalu restart server.',
          501
        );
      }
      redirectUrl = buildTikTokAuthorizeUrl({ appKey, state });
    } else if (provider === 'shopee') {
      const partnerId = process.env.SHOPEE_PARTNER_ID;
      const partnerKey = process.env.SHOPEE_PARTNER_KEY;
      const redirect = resolveShopeeRedirect(request);
      if (!partnerId || !partnerKey) {
        return errorResponse(
          'SHOPEE_PARTNER_ID / SHOPEE_PARTNER_KEY belum dikonfigurasi.',
          501
        );
      }
      // Append state as a query param on the redirect URL so we can verify
      // it in the callback. Shopee itself doesn't pass `state` through.
      const redirectWithState = appendQuery(redirect, { state });
      redirectUrl = buildShopeeAuthorizeUrl({
        partnerId,
        partnerKey,
        redirect: redirectWithState,
        environment: process.env.SHOPEE_ENVIRONMENT,
      });
    }

    return successResponse({ redirect_url: redirectUrl });
  } catch (err) {
    console.error('[marketplace/connect] error', err);
    return errorResponse('Failed to start OAuth flow', 500);
  }
}

// ---------------------------------------------------------------------------
// State token (CSRF protection)
// ---------------------------------------------------------------------------

/**
 * Build a signed state token: base64url(user_id).base64url(ts).hex_hmac
 * Verified in the callback route before accepting the OAuth code.
 */
function buildState(userId) {
  const secret = process.env.CRON_SECRET || process.env.MARKETPLACE_ENCRYPTION_KEY || 'dev-state-secret';
  const ts = Math.floor(Date.now() / 1000);
  const payload = `${userId}.${ts}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${Buffer.from(payload, 'utf8').toString('base64url')}.${sig}`;
}

// ---------------------------------------------------------------------------
// Shopee redirect URL resolver
// ---------------------------------------------------------------------------

/**
 * Resolve the Shopee OAuth redirect URL. Prefer SHOPEE_REDIRECT_URI if set,
 * otherwise derive from the current request host (development).
 */
function resolveShopeeRedirect(request) {
  if (process.env.SHOPEE_REDIRECT_URI) return process.env.SHOPEE_REDIRECT_URI;
  const origin = getOrigin(request);
  return `${origin}/api/marketplace/callback/shopee`;
}

function getOrigin(request) {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  try {
    return new URL(request.url).origin;
  } catch {
    return 'http://localhost:3000';
  }
}

function appendQuery(url, extras) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(extras)) {
    u.searchParams.set(k, String(v));
  }
  return u.toString();
}
