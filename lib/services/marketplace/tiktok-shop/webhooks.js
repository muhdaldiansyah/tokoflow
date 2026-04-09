// lib/services/marketplace/tiktok-shop/webhooks.js
//
// TikTok Shop Partner Center webhook signature verification and event
// parsing.
//
// Webhook delivery model (per EcomPHP SDK reference + TikTok Shop docs):
//
//   POST https://<your_domain>/api/webhooks/tiktok-shop
//   Headers:
//     Authorization: <hex HMAC-SHA256 signature>   ← overloaded, not Bearer
//     Content-Type: application/json
//   Body (raw JSON):
//     {
//       "type": <numeric event type>,
//       "tts_notification_id": "...",
//       "shop_id": "...",
//       "timestamp": <unix seconds>,
//       "data": { ... event-specific payload ... }
//     }
//
// The signature is computed as:
//
//   sig = hex_lowercase( HMAC_SHA256(app_secret, app_key + raw_request_body) )
//
// The raw body must be read BEFORE JSON parsing — any re-serialization will
// change bytes and break the signature check. In a Next.js App Router route
// this means `await request.text()` first, then `JSON.parse(text)`.
//
// Event types (numeric, per Webhook.php in EcomPHP):
//
//   1  ORDER_STATUS_UPDATE              — primary "new order"/"order changed"
//   2  REVERSE_ORDER_STATUS_UPDATE      — returns/cancellations
//   3  RECIPIENT_ADDRESS_UPDATE
//   4  PACKAGE_UPDATE
//   5  PRODUCT_STATUS_UPDATE
//   6  SELLER_DEAUTHORIZATION           — CRITICAL: mark connection inactive
//   7  UPCOMING_AUTHORIZATION_EXPIRATION
//   12 RETURN_STATUS_UPDATE
//
// This module is pure (no Supabase, no network). The webhook route calls
// verifyWebhookSignature() and parseEvent(), then hands off to a processor
// that uses the `connections.js` and order-fetch helpers.

import { hmacSha256Hex, timingSafeEqualString } from '../crypto.js';

// ---------------------------------------------------------------------------
// Event type catalog
// ---------------------------------------------------------------------------

export const EVENT_TYPES = {
  ORDER_STATUS_UPDATE: 1,
  REVERSE_ORDER_STATUS_UPDATE: 2,
  RECIPIENT_ADDRESS_UPDATE: 3,
  PACKAGE_UPDATE: 4,
  PRODUCT_STATUS_UPDATE: 5,
  SELLER_DEAUTHORIZATION: 6,
  UPCOMING_AUTHORIZATION_EXPIRATION: 7,
  RETURN_STATUS_UPDATE: 12,
};

// Inverted lookup for display / logging.
export const EVENT_NAMES = Object.fromEntries(
  Object.entries(EVENT_TYPES).map(([k, v]) => [v, k])
);

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

/**
 * Verify a TikTok Shop webhook signature in constant time.
 *
 * Authoritative algorithm (from Webhook.php#verify()):
 *   expected = lowercase_hex( hmac_sha256( app_secret, app_key + raw_body ) )
 *   return timingSafeEqual(expected, authHeaderValue.toLowerCase())
 *
 * @param {object} args
 * @param {string} args.rawBody — EXACT raw bytes of the request body as received
 * @param {string} args.appKey
 * @param {string} args.appSecret
 * @param {string | null | undefined} args.authHeader — value of the `Authorization` header
 * @returns {boolean} true iff signature matches
 */
export function verifyWebhookSignature({ rawBody, appKey, appSecret, authHeader }) {
  if (typeof rawBody !== 'string') return false;
  if (!appKey || !appSecret) return false;
  if (typeof authHeader !== 'string' || authHeader.length === 0) return false;

  const expected = hmacSha256Hex(appSecret, appKey + rawBody).toLowerCase();
  const provided = authHeader.trim().toLowerCase();

  return timingSafeEqualString(expected, provided);
}

// ---------------------------------------------------------------------------
// Event parsing
// ---------------------------------------------------------------------------

/**
 * Parse and shallow-validate a webhook payload.
 *
 * Returns a normalized envelope. Does NOT throw on unknown event types —
 * just returns them as-is with `known: false` so the webhook inbox can
 * still accept and log them.
 *
 * @param {string} rawBody — the verified raw body JSON string
 * @returns {{
 *   type: number,
 *   typeName: string | undefined,
 *   known: boolean,
 *   shopId: string | null,
 *   timestamp: number,
 *   notificationId: string | null,
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

  const type = Number(parsed.type);
  const typeName = EVENT_NAMES[type];
  const shopId = parsed.shop_id != null ? String(parsed.shop_id) : null;
  const timestamp = Number(parsed.timestamp) || 0;
  const notificationId = parsed.tts_notification_id
    ? String(parsed.tts_notification_id)
    : null;

  const externalOrderId = extractOrderIdFromData(type, parsed.data);

  return {
    type,
    typeName,
    known: typeName !== undefined,
    shopId,
    timestamp,
    notificationId,
    data: parsed.data ?? null,
    externalOrderId,
  };
}

/**
 * Best-effort: pull an order_id out of the event data so the inbox row can
 * be indexed for fast lookup. Shape differs per event type.
 *
 * @internal exported for testing
 */
export function extractOrderIdFromData(type, data) {
  if (!data || typeof data !== 'object') return null;

  // ORDER_STATUS_UPDATE / REVERSE_ORDER_STATUS_UPDATE:
  //   data: { order_id, order_status, update_time }
  if (type === EVENT_TYPES.ORDER_STATUS_UPDATE || type === EVENT_TYPES.REVERSE_ORDER_STATUS_UPDATE) {
    return data.order_id != null ? String(data.order_id) : null;
  }

  // PACKAGE_UPDATE / RECIPIENT_ADDRESS_UPDATE: carry order_id too.
  if (type === EVENT_TYPES.PACKAGE_UPDATE || type === EVENT_TYPES.RECIPIENT_ADDRESS_UPDATE) {
    return data.order_id != null ? String(data.order_id) : null;
  }

  return null;
}
