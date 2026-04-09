// app/api/marketplace/sync/[id]/route.js
//
// Manual sync trigger for one marketplace connection.
//
// The UI calls this when the merchant clicks "Sync sekarang" on a
// connection card. It runs the provider-specific sync end-to-end and
// returns the result.
//
// Owner-only. Staff see a read-only view and can't trigger syncs.
//
// For periodic automatic syncs, the cron coordinator at
// /api/cron/marketplace-sync calls the same underlying sync functions for
// all active connections on a schedule.

import { authenticateRequest } from '../../../../../lib/utils/auth-helpers';
import { requireOwner } from '../../../../../lib/auth/role.js';
import { successResponse, errorResponse, handleSupabaseError } from '../../../../../lib/utils/api-response';
import { createServiceRoleClient } from '../../../../../lib/database/supabase-server';

import { syncTikTokShopConnection } from '../../../../../lib/services/marketplace/tiktok-shop/sync.js';
import { syncShopeeConnection } from '../../../../../lib/services/marketplace/shopee/sync.js';

export const runtime = 'nodejs';

// Vercel serverless functions have a 60s default ceiling. A full sync of a
// quiet shop completes in seconds; a noisy shop with 100s of new orders may
// need longer. Bump via vercel.json maxDuration if this becomes a problem.
export const maxDuration = 60;

export async function POST(request, { params }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return errorResponse(auth.error || 'Unauthorized', auth.status || 401);
    const gate = await requireOwner(auth);
    if (!gate.ok) return gate.response;

    const { id } = await params;
    const connId = Number(id);
    if (!Number.isFinite(connId) || connId <= 0) {
      return errorResponse('Invalid connection id', 400);
    }

    // Fetch the row just to read its channel and is_active + confirm it
    // exists. The sync functions below use the service role client so they
    // bypass RLS during writes (cron and manual paths share the same code).
    const { data: conn, error } = await auth.supabase
      .from('tf_marketplace_connections')
      .select('id, channel, is_active')
      .eq('id', connId)
      .maybeSingle();

    if (error) return handleSupabaseError(error);
    if (!conn) return errorResponse('Connection not found', 404);
    if (!conn.is_active) return errorResponse('Connection is inactive', 400);

    const serviceSupabase = createServiceRoleClient();

    let result;
    if (conn.channel === 'tiktok-shop') {
      result = await syncTikTokShopConnection({
        supabase: serviceSupabase,
        connectionId: connId,
      });
    } else if (conn.channel === 'shopee') {
      result = await syncShopeeConnection({
        supabase: serviceSupabase,
        connectionId: connId,
      });
    } else {
      return errorResponse(`Sync tidak tersedia untuk channel: ${conn.channel}`, 400);
    }

    if (!result.ok) {
      return errorResponse(result.error || 'Sync failed', 500);
    }

    return successResponse({
      connection_id: connId,
      channel: conn.channel,
      orders_processed: result.ordersProcessed,
      cursor: result.cursor?.toISOString?.() ?? null,
    });
  } catch (err) {
    console.error('[marketplace/sync]', err);
    return errorResponse('Sync failed: ' + (err?.message || 'unknown error'), 500);
  }
}
