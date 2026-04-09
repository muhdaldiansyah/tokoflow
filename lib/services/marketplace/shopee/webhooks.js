// lib/services/marketplace/shopee/webhooks.js
//
// Shopee Open Platform v2 webhook (push notification) handling.
//
// Delivery model:
//   POST https://<your_domain>/api/webhooks/shopee
//   Headers (two variants are documented in different Shopee doc eras; we
//   accept either):
//     Variant A — "Authorization" header, signature = HMAC(url + "|" + body)
//     Variant B — "X-Shopee-Signature" header, signature = HMAC(body)
//   Body (raw JSON):
//     {
//       "code": <event_code>,
//       "shop_id": <int>,
//       "timestamp": <unix seconds>,
//       "data": { ... event-specific payload ... }
//     }
//
// The ambiguity is real — Shopee has shipped both variants at different
// points, and community SDKs verify differently. Our verifier tries both
// and returns which one matched so the webhook route can log it. Long term,
// once we see which variant Shopee is using for Tokoflow's app, we can
// narrow to just that one. For now, accepting either is the safe play.
//
// Event codes (from Shopee v2 push docs):
//
//   1  Shop authorization
//   3  Order status update            ← the important one
//   4  TrackingNo update
//   10 Shop deauthorization           ← mark connection inactive
//   13 Update Shop                    ← shop profile changed
//
// This module is pure (no Supabase, no network). It's paired with a
// webhook.test.js unit test.

import { hmacSha256Hex, timingSafeEqualString } from '../crypto.js';

// ---------------------------------------------------------------------------
// Event code catalog
// ---------------------------------------------------------------------------

export const EVENT_CODES = {
  SHOP_AUTHORIZATION: 1,
  ORDER_STATUS_UPDATE: 3,
  TRACKING_NO_UPDATE: 4,
  SHOP_DEAUTHORIZATION: 10,
  UPDATE_SHOP: 13,
};

export const EVENT_NAMES = Object.fromEntries(
  Object.entries(EVENT_CODES).map(([k, v]) => [v, k])
);

// ---------------------------------------------------------------------------
// Signature verification (tries both documented variants)
// ---------------------------------------------------------------------------

/**
 * Verify a Shopee webhook signature. Returns an object telling the caller
 * which variant matched (or none). This lets the webhook route log/alert
 * when Shopee is using a variant we weren't expecting.
 *
 * @param {object} args
 * @param {string} args.rawBody — EXACT raw bytes of the request body
 * @param {string} args.partnerKey
 * @param {string} args.url — the full URL Shopee called (including path + query)
 * @param {string | null | undefined} [args.authHeader] — `Authorization` header value
 * @param {string | null | undefined} [args.signatureHeader] — `X-Shopee-Signature` header value
 * @returns {{ verified: boolean, variant: 'authorization' | 'x-shopee-signature' | null }}
 */
export function verifyWebhookSignature({
  rawBody,
  partnerKey,
  url,
  authHeader,
  signatureHeader,
}) {
  if (typeof rawBody !== 'string' || !partnerKey) {
    return { verified: false, variant: null };
  }

  // Variant A: Authorization header, signed string = url + "|" + body
  if (typeof authHeader === 'string' && authHeader.length > 0 && typeof url === 'string') {
    const expectedA = hmacSha256Hex(partnerKey, `${url}|${rawBody}`).toLowerCase();
    if (timingSafeEqualString(expectedA, authHeader.trim().toLowerCase())) {
      return { verified: true, variant: 'authorization' };
    }
  }

  // Variant B: X-Shopee-Signature header, signed string = body only
  if (typeof signatureHeader === 'string' && signatureHeader.length > 0) {
    const expectedB = hmacSha256Hex(partnerKey, rawBody).toLowerCase();
    if (timingSafeEqualString(expectedB, signatureHeader.trim().toLowerCase())) {
      return { verified: true, variant: 'x-shopee-signature' };
    }
  }

  return { verified: false, variant: null };
}

// ---------------------------------------------------------------------------
// Event parsing
// ---------------------------------------------------------------------------

/**
 * Parse a verified Shopee webhook payload into a normalized envelope.
 *
 * @param {string} rawBody
 * @returns {{
 *   code: number,
 *   codeName: string | undefined,
 *   known: boolean,
 *   shopId: string | null,
 *   timestamp: number,
 *   data: any,
 *   externalOrderId: string | null
 * }}
 */
export function parseEvent(rawBody) {
  let parsed;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new Error('parseEvent: rawBody is not valid JSON');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('parseEvent: rawBody did not decode to an object');
  }

  const code = Number(parsed.code);
  const codeName = EVENT_NAMES[code];
  const shopId = parsed.shop_id != null ? String(parsed.shop_id) : null;
  const timestamp = Number(parsed.timestamp) || 0;

  const externalOrderId = extractOrderIdFromData(code, parsed.data);

  return {
    code,
    codeName,
    known: codeName !== undefined,
    shopId,
    timestamp,
    data: parsed.data ?? null,
    externalOrderId,
  };
}

/**
 * @internal exported for testing
 */
export function extractOrderIdFromData(code, data) {
  if (!data || typeof data !== 'object') return null;

  // ORDER_STATUS_UPDATE:
  //   data: { ordersn, status, update_time }
  if (code === EVENT_CODES.ORDER_STATUS_UPDATE) {
    return data.ordersn != null ? String(data.ordersn) : null;
  }

  // TRACKING_NO_UPDATE:
  //   data: { ordersn, package_number, tracking_no }
  if (code === EVENT_CODES.TRACKING_NO_UPDATE) {
    return data.ordersn != null ? String(data.ordersn) : null;
  }

  return null;
}
