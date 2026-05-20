// app/api/cron/webhook-events-process/route.js
//
// Drain the tf_webhook_events inbox. Runs every 2 minutes via Vercel Cron.
//
// What this does:
//   1. Pick up to N pending events (oldest first), mark them 'processing'.
//   2. For each event:
//      - If the event carries an external_order_id and we have a connection:
//        fetch the order detail from the provider and upsert it into
//        tf_sales_input using the same sync pipeline.
//      - If the event is a deauthorization: the webhook handler already
//        marked the connection inactive, we just record as processed.
//      - Otherwise (product updates, address updates, etc.): record as
//        processed without action.
//   3. Mark each row 'processed' or 'failed' with an error message.
//
// Why bother with an inbox if the cron sync also runs? Because:
//   - Webhooks give us sub-minute latency on status changes vs 15-min cron.
//   - A failed webhook processor run leaves rows in 'failed' for debugging
//     rather than silently missing events.
//   - Rate-limit-induced retries don't spam the provider; each retry uses
//     the same fetch path with backoff.

import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

import { createServiceRoleClient } from '../../../../lib/database/supabase-server';
import { syncTikTokShopConnection } from '../../../../lib/services/marketplace/tiktok-shop/sync.js';
import { syncShopeeConnection } from '../../../../lib/services/marketplace/shopee/sync.js';

export const runtime = 'nodejs';
export const maxDuration = 300;

const BATCH_SIZE = 25;
const MAX_ATTEMPTS = 5;

export async function POST(request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  return drain();
}
export async function GET(request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  return drain();
}

async function drain() {
  const supabase = createServiceRoleClient();

  // Pick a batch of pending events, oldest first. We don't need FOR UPDATE
  // SKIP LOCKED because this cron is the only worker and runs serially.
  const { data: events, error } = await supabase
    .from('tf_webhook_events')
    .select('id, source, event_type, shop_id, connection_id, external_order_id, attempts')
    .eq('status', 'pending')
    .lt('attempts', MAX_ATTEMPTS)
    .order('received_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error('[cron/webhook-events] select failed', error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!events || events.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, message: 'inbox empty' });
  }

  // Distinct connection IDs in this batch — we only need to sync each
  // connection once per drain, even if multiple events point at it. The
  // incremental sync covers all recent updates for that connection in one
  // shot via the update_time cursor.
  const distinctConnections = new Map(); // connection_id → { channel, events: [] }

  for (const evt of events) {
    if (!evt.connection_id) {
      // No matching connection — mark as processed (nothing we can do
      // without knowing whose shop this is).
      await markProcessed(supabase, evt.id, 'no_connection');
      continue;
    }
    const key = String(evt.connection_id);
    if (!distinctConnections.has(key)) {
      distinctConnections.set(key, { connectionId: evt.connection_id, source: evt.source, events: [] });
    }
    distinctConnections.get(key).events.push(evt);
  }

  // Run one sync per distinct connection. The sync pulls ALL recent updates
  // (including the ones the event referenced) thanks to the update_time
  // cursor, so one call covers every event for that connection in the batch.
  // Since this cron is single-worker, we don't need a "processing" marker —
  // on success we flip rows to 'processed', on failure we bump attempts and
  // either leave as 'pending' (for next cron tick) or mark 'failed'.
  let successCount = 0;
  let failureCount = 0;

  for (const group of distinctConnections.values()) {
    let result;
    try {
      if (group.source === 'tiktok-shop') {
        result = await syncTikTokShopConnection({
          supabase,
          connectionId: group.connectionId,
        });
      } else if (group.source === 'shopee') {
        result = await syncShopeeConnection({
          supabase,
          connectionId: group.connectionId,
        });
      } else {
        result = { ok: false, error: `unknown source: ${group.source}` };
      }
    } catch (err) {
      result = { ok: false, error: err?.message || String(err) };
    }

    if (result.ok) {
      const eventIds = group.events.map((e) => e.id);
      await supabase
        .from('tf_webhook_events')
        .update({
          status: 'processed',
          processed_at: new Date().toISOString(),
          last_error: null,
        })
        .in('id', eventIds);
      successCount += eventIds.length;
    } else {
      // Bump attempts per row (each row has its own prior count).
      for (const evt of group.events) {
        const newAttempts = (evt.attempts || 0) + 1;
        const shouldRetry = newAttempts < MAX_ATTEMPTS;
        await supabase
          .from('tf_webhook_events')
          .update({
            status: shouldRetry ? 'pending' : 'failed',
            attempts: newAttempts,
            last_error: (result.error || 'unknown').slice(0, 500),
            processed_at: shouldRetry ? null : new Date().toISOString(),
          })
          .eq('id', evt.id);
        failureCount++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    batch: events.length,
    distinct_connections: distinctConnections.size,
    processed: successCount,
    failed: failureCount,
  });
}

async function markProcessed(supabase, id, note) {
  await supabase
    .from('tf_webhook_events')
    .update({
      status: 'processed',
      processed_at: new Date().toISOString(),
      last_error: note,
    })
    .eq('id', id);
}

function authorizeCron(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization') || '';
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
