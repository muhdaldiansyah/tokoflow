// app/api/cron/marketplace-sync/route.js
//
// Fan-out coordinator called by Vercel Cron every 15 minutes. For each
// active marketplace connection, runs the provider-specific sync in
// sequence (bounded by the serverless max duration).
//
// Security: only Vercel Cron can hit this endpoint. Vercel sets the
// Authorization header to "Bearer $CRON_SECRET" for scheduled invocations.
// We verify that shared secret and return 401 otherwise.
//
// Sequential fan-out is deliberate (vs Promise.all): TikTok Shop and Shopee
// both rate-limit per-shop, and serial execution keeps us well under the
// per-shop ceiling without any accounting. If the number of connections
// grows past ~20, switch to a queue-based model (Inngest/Trigger.dev).

import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

import { createServiceRoleClient } from '../../../../lib/database/supabase-server';
import { loadActiveConnections } from '../../../../lib/services/marketplace/connections.js';
import { syncTikTokShopConnection } from '../../../../lib/services/marketplace/tiktok-shop/sync.js';
import { syncShopeeConnection } from '../../../../lib/services/marketplace/shopee/sync.js';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes — room for several connections

export async function POST(request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  return runCoordinator();
}

// Vercel Cron sends a GET by default (configurable to POST via vercel.json).
// We accept both so the cron spec doesn't break if the default changes.
export async function GET(request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  return runCoordinator();
}

async function runCoordinator() {
  const supabase = createServiceRoleClient();

  const connections = await loadActiveConnections(supabase);
  const startedAt = new Date().toISOString();

  const results = [];
  for (const conn of connections) {
    const t0 = Date.now();
    try {
      let r;
      if (conn.channel === 'tiktok-shop') {
        r = await syncTikTokShopConnection({ supabase, connectionId: conn.id });
      } else if (conn.channel === 'shopee') {
        r = await syncShopeeConnection({ supabase, connectionId: conn.id });
      } else {
        r = { ok: false, error: `unsupported channel: ${conn.channel}` };
      }

      results.push({
        connection_id: conn.id,
        channel: conn.channel,
        shop_id: conn.shop_id,
        ok: r.ok,
        orders_processed: r.ok ? r.ordersProcessed : 0,
        error: r.ok ? null : r.error,
        duration_ms: Date.now() - t0,
      });
    } catch (err) {
      results.push({
        connection_id: conn.id,
        channel: conn.channel,
        shop_id: conn.shop_id,
        ok: false,
        orders_processed: 0,
        error: err?.message || String(err),
        duration_ms: Date.now() - t0,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    total: connections.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}

/**
 * Verify the shared CRON_SECRET in the Authorization header.
 * Constant-time comparison to prevent timing side channels.
 */
function authorizeCron(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn('[cron] CRON_SECRET not set — refusing to run');
    return false;
  }
  const header = request.headers.get('authorization') || '';
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
