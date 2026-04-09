// app/api/webhooks/tiktok-shop/route.js
//
// TikTok Shop Partner Center webhook endpoint.
//
// Register this URL in Partner Center → your app → Webhook URL:
//   https://<your_domain>/api/webhooks/tiktok-shop
//
// Flow:
//   1. Read the RAW request body (text, NOT parsed JSON — signature depends
//      on byte-identical representation).
//   2. Verify HMAC signature from the Authorization header. Reject 401 if
//      the signature is missing or wrong — never process unverified input.
//   3. Parse the event envelope.
//   4. Insert a row into tf_webhook_events (service role client — no
//      session; bypasses RLS).
//   5. For SELLER_DEAUTHORIZATION, immediately mark the connection inactive
//      so we stop hitting a dead token on the next cron.
//   6. Return 200 OK fast. Actual order ingestion happens in
//      /api/cron/webhook-events-process on the next cron tick (or can be
//      kicked synchronously for low latency — see sync.js in this folder).
//
// TikTok Shop retries on non-2xx for ~24 hours, so returning 500 on errors
// is safe — they'll redeliver.

import { NextResponse } from 'next/server';

import { createServiceRoleClient } from '../../../../lib/database/supabase-server';
import {
  verifyWebhookSignature,
  parseEvent,
  EVENT_TYPES,
} from '../../../../lib/services/marketplace/tiktok-shop/webhooks.js';
import {
  findConnectionByShop,
  deactivateConnection,
  markWebhookReceived,
} from '../../../../lib/services/marketplace/connections.js';

export const runtime = 'nodejs';

// Disable Next.js body parsing — we need the raw bytes for signature check.
// (In App Router, calling request.text() gives us the raw body.)
export async function POST(request) {
  // Read raw body exactly once. This is the canonical representation we
  // verify against.
  const rawBody = await request.text();

  const appKey = process.env.TIKTOKSHOP_APP_KEY;
  const appSecret = process.env.TIKTOKSHOP_APP_SECRET;
  if (!appKey || !appSecret) {
    console.error('[webhook/tiktok-shop] env missing TIKTOKSHOP_APP_KEY/APP_SECRET');
    return NextResponse.json({ ok: false, error: 'env_missing' }, { status: 503 });
  }

  const authHeader = request.headers.get('authorization') || '';

  const signatureOk = verifyWebhookSignature({
    rawBody,
    appKey,
    appSecret,
    authHeader,
  });

  if (!signatureOk) {
    // Log the non-verified attempt but do NOT include body in the log (may
    // contain PII). Include header prefix only so we can distinguish a
    // missing header from a mismatch.
    console.warn('[webhook/tiktok-shop] signature verification FAILED', {
      authHeaderPresent: authHeader.length > 0,
      bodyLength: rawBody.length,
    });
    return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 401 });
  }

  let evt;
  try {
    evt = parseEvent(rawBody);
  } catch (err) {
    console.warn('[webhook/tiktok-shop] parse failed', err.message);
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Resolve the connection from shop_id so downstream processors can find it.
  let connectionId = null;
  if (evt.shopId) {
    try {
      const conn = await findConnectionByShop(supabase, 'tiktok-shop', evt.shopId);
      if (conn) {
        connectionId = conn.id;
        // Fire-and-forget: touch last_webhook_at so the UI shows live status.
        markWebhookReceived(supabase, conn.id).catch(() => {});
      }
    } catch (err) {
      console.warn('[webhook/tiktok-shop] connection lookup failed', err.message);
    }
  }

  // Insert into the inbox. The cron drain processes status='pending' rows.
  try {
    const { error } = await supabase.from('tf_webhook_events').insert({
      source: 'tiktok-shop',
      event_type: String(evt.type),
      shop_id: evt.shopId,
      connection_id: connectionId,
      external_order_id: evt.externalOrderId,
      raw_body: safeJsonParse(rawBody),
      signature: authHeader.slice(0, 128),
      signature_verified: true,
      status: 'pending',
      attempts: 0,
    });
    if (error) {
      console.error('[webhook/tiktok-shop] inbox insert failed', error.message);
      // Return 500 so TikTok Shop retries delivery rather than losing the event.
      return NextResponse.json({ ok: false, error: 'inbox_insert_failed' }, { status: 500 });
    }
  } catch (err) {
    console.error('[webhook/tiktok-shop] inbox insert threw', err);
    return NextResponse.json({ ok: false, error: 'inbox_insert_failed' }, { status: 500 });
  }

  // Handle urgent events inline (don't wait for cron).
  if (evt.type === EVENT_TYPES.SELLER_DEAUTHORIZATION && connectionId) {
    try {
      await deactivateConnection(
        supabase,
        connectionId,
        `SELLER_DEAUTHORIZATION webhook at ${new Date().toISOString()}`
      );
    } catch (err) {
      console.error('[webhook/tiktok-shop] deauth handling failed', err.message);
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return { _raw: s.slice(0, 4000) };
  }
}
