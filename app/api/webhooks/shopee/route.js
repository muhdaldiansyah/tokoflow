// app/api/webhooks/shopee/route.js
//
// Shopee Open Platform webhook endpoint.
//
// Register this URL in Shopee Partner Center → Push → Push URL:
//   https://<your_domain>/api/webhooks/shopee
//
// Shopee's signature scheme has two documented variants that both appear in
// the wild (see shopee/webhooks.js for the full explanation). We verify
// against either and record which variant hit. The webhook route at
// Shopee's end signs with ONE of them, so once we see a real delivery we
// can narrow the expectation.
//
// Flow is the same as tiktok-shop: verify → insert into inbox → handle
// urgent events inline → return 200.

import { NextResponse } from 'next/server';

import { createServiceRoleClient } from '../../../../lib/database/supabase-server';
import {
  verifyWebhookSignature,
  parseEvent,
  EVENT_CODES,
} from '../../../../lib/services/marketplace/shopee/webhooks.js';
import {
  findConnectionByShop,
  deactivateConnection,
  markWebhookReceived,
} from '../../../../lib/services/marketplace/connections.js';

export const runtime = 'nodejs';

export async function POST(request) {
  const rawBody = await request.text();

  const partnerKey = process.env.SHOPEE_PARTNER_KEY;
  if (!partnerKey) {
    console.error('[webhook/shopee] env missing SHOPEE_PARTNER_KEY');
    return NextResponse.json({ ok: false, error: 'env_missing' }, { status: 503 });
  }

  const authHeader = request.headers.get('authorization') || '';
  const signatureHeader = request.headers.get('x-shopee-signature') || '';

  // Shopee's Variant A hash includes the full URL that they POSTed to.
  // Reconstruct that URL from the incoming request (respects X-Forwarded-*
  // via Next.js Request). Strip trailing slashes for deterministic matching.
  const url = new URL(request.url).toString().replace(/\/+$/, '');

  const verification = verifyWebhookSignature({
    rawBody,
    partnerKey,
    url,
    authHeader,
    signatureHeader,
  });

  if (!verification.verified) {
    console.warn('[webhook/shopee] signature verification FAILED', {
      authHeaderPresent: authHeader.length > 0,
      signatureHeaderPresent: signatureHeader.length > 0,
      bodyLength: rawBody.length,
    });
    return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 401 });
  }

  // Log which variant matched — useful early in production when we don't
  // yet know which one Shopee actually uses for this app.
  console.log('[webhook/shopee] verified variant=' + verification.variant);

  let evt;
  try {
    evt = parseEvent(rawBody);
  } catch (err) {
    console.warn('[webhook/shopee] parse failed', err.message);
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  let connectionId = null;
  if (evt.shopId) {
    try {
      const conn = await findConnectionByShop(supabase, 'shopee', evt.shopId);
      if (conn) {
        connectionId = conn.id;
        markWebhookReceived(supabase, conn.id).catch(() => {});
      }
    } catch (err) {
      console.warn('[webhook/shopee] connection lookup failed', err.message);
    }
  }

  try {
    const { error } = await supabase.from('tf_webhook_events').insert({
      source: 'shopee',
      event_type: String(evt.code),
      shop_id: evt.shopId,
      connection_id: connectionId,
      external_order_id: evt.externalOrderId,
      raw_body: safeJsonParse(rawBody),
      signature: (authHeader || signatureHeader).slice(0, 128),
      signature_verified: true,
      status: 'pending',
      attempts: 0,
    });
    if (error) {
      console.error('[webhook/shopee] inbox insert failed', error.message);
      return NextResponse.json({ ok: false, error: 'inbox_insert_failed' }, { status: 500 });
    }
  } catch (err) {
    console.error('[webhook/shopee] inbox insert threw', err);
    return NextResponse.json({ ok: false, error: 'inbox_insert_failed' }, { status: 500 });
  }

  if (evt.code === EVENT_CODES.SHOP_DEAUTHORIZATION && connectionId) {
    try {
      await deactivateConnection(
        supabase,
        connectionId,
        `SHOP_DEAUTHORIZATION webhook at ${new Date().toISOString()}`
      );
    } catch (err) {
      console.error('[webhook/shopee] deauth handling failed', err.message);
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
