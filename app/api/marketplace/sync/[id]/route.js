// app/api/marketplace/sync/[id]/route.js
//
// SCAFFOLDING — Manual sync trigger for a marketplace connection.
//
// What this endpoint will eventually do:
//   1. Load the connection by id, check it's active and not expired.
//   2. Refresh the access_token if needed using refresh_token.
//   3. Pull recent orders from the marketplace API:
//      - shopee:      /api/v2/order/get_order_list (last_24h, with sign)
//      - tokopedia:   /v2/orders (filter by updated_at)
//      - tiktok-shop: /api/orders/search
//   4. For each order:
//      a. Look up the SKU in tf_products
//      b. Insert into tf_sales_input with channel = connection.channel
//      c. Mark as 'ok' so the existing batch processor can finalize it
//   5. Update last_sync_at + last_sync_status on the connection.
//
// For now this returns a 501 with a clear message. The cron entry in
// vercel.json (NOT yet added) would call this endpoint hourly.
import { authenticateRequest } from '../../../../../lib/utils/auth-helpers';
import { requireOwner } from '../../../../../lib/auth/role.js';
import { successResponse, errorResponse, handleSupabaseError } from '../../../../../lib/utils/api-response';

export const runtime = 'nodejs';

export async function POST(request, { params }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return errorResponse(auth.error || 'Unauthorized', auth.status || 401);
    const gate = await requireOwner(auth);
    if (!gate.ok) return gate.response;

    const { id } = await params;
    const connId = Number(id);
    if (!Number.isFinite(connId)) return errorResponse('Invalid connection id', 400);

    const { data: conn, error } = await auth.supabase
      .from('tf_marketplace_connections')
      .select('id, channel, shop_id, is_active, access_token, token_expires_at')
      .eq('id', connId)
      .maybeSingle();

    if (error) return handleSupabaseError(error);
    if (!conn) return errorResponse('Connection not found', 404);
    if (!conn.is_active) return errorResponse('Connection is inactive', 400);

    // Mark as running for the UI
    await auth.supabase
      .from('tf_marketplace_connections')
      .update({
        last_sync_status: 'running',
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', connId);

    // ===================================================================
    // TODO: Replace with real API call. For now we record a failed sync
    // so the UI shows the merchant that connection works but sync isn't
    // implemented yet.
    // ===================================================================
    const errorMsg = `Sync untuk ${conn.channel} belum diimplementasi. ` +
                     `Lihat TODO di /api/marketplace/sync/[id]/route.js untuk spec API.`;

    await auth.supabase
      .from('tf_marketplace_connections')
      .update({
        last_sync_status: 'failed',
        last_sync_error: errorMsg,
      })
      .eq('id', connId);

    return errorResponse(errorMsg, 501);
  } catch (err) {
    console.error('[marketplace/sync] error', err);
    return errorResponse('Sync failed', 500);
  }
}
