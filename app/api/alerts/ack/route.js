// app/api/alerts/ack/route.js
//
// POST /api/alerts/ack
// Body: { sku: string, status: 'negative'|'zero'|'low' } — acknowledge a single
//                                                          alert at a specific status
//        OR { acknowledge_all: true } — acknowledge every currently-active alert
//                                       at its current status
//
// Acks are scoped per-user. RLS enforces that users only see/write their own.
import { authenticateRequest } from '../../../../lib/utils/auth-helpers';
import { successResponse, errorResponse, handleSupabaseError } from '../../../../lib/utils/api-response';

export const runtime = 'nodejs';

const VALID_STATUSES = new Set(['negative', 'zero', 'low']);

export async function POST(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return errorResponse(auth.error || 'Unauthorized', auth.status || 401);

    const body = await request.json().catch(() => ({}));

    // Path 1: acknowledge every active alert
    if (body.acknowledge_all === true) {
      const { data: products, error } = await auth.supabase
        .from('tf_products')
        .select('sku, stock_status')
        .in('stock_status', ['negative', 'zero', 'low']);
      if (error) return handleSupabaseError(error);

      if (!products || products.length === 0) {
        return successResponse({ acknowledged: 0 });
      }

      const rows = products.map(p => ({
        user_id: auth.user.id,
        sku: p.sku,
        acked_status: p.stock_status,
        acked_at: new Date().toISOString(),
      }));

      const { error: upsertError } = await auth.supabase
        .from('tf_alert_acks')
        .upsert(rows, { onConflict: 'user_id,sku' });

      if (upsertError) return handleSupabaseError(upsertError);
      return successResponse({ acknowledged: rows.length });
    }

    // Path 2: acknowledge a single alert
    const { sku, status } = body;
    if (!sku || typeof sku !== 'string') return errorResponse('sku is required');
    if (!VALID_STATUSES.has(status)) {
      return errorResponse('status must be negative | zero | low');
    }

    const { error } = await auth.supabase
      .from('tf_alert_acks')
      .upsert(
        {
          user_id: auth.user.id,
          sku,
          acked_status: status,
          acked_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,sku' }
      );

    if (error) return handleSupabaseError(error);
    return successResponse({ acknowledged: 1, sku });
  } catch (err) {
    console.error('[alerts/ack] POST error', err);
    return errorResponse('Failed to acknowledge alert', 500);
  }
}
