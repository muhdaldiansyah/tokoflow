// app/api/alerts/route.js
//
// In-app stock alert feed. Alerts are derived live from tf_products.stock_status
// (the generated column from Phase 4). The tf_alert_acks table records which
// SKU+status combos the current user has already seen, so the unread feed is
// the diff: live alerts MINUS acks-at-current-status.
//
// This means alerts auto-resolve when stock returns to normal (because the
// LEFT JOIN against alert_acks no longer matches once stock_status changes),
// and re-fire when a SKU drops back below threshold.
import { authenticateRequest } from '../../../lib/utils/auth-helpers';
import { successResponse, errorResponse, handleSupabaseError } from '../../../lib/utils/api-response';
import { makeETag, maybeNotModified } from '../../../lib/http/jsonETag.js';

export const runtime = 'nodejs';

/**
 * GET /api/alerts — list active stock alerts for the current user.
 *
 * Query params:
 *   ?include_acked=1   include alerts the user already acknowledged at the
 *                      current status (otherwise only "unread" alerts)
 *
 * Returns:
 *   { alerts: [...], counts: { negative, zero, low, total, unread } }
 */
export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return errorResponse(auth.error || 'Unauthorized', auth.status || 401);

    const { searchParams } = new URL(request.url);
    const includeAcked = searchParams.get('include_acked') === '1';

    const [{ data: products, error: pErr }, { data: acks, error: aErr }] = await Promise.all([
      auth.supabase
        .from('tf_products')
        .select('sku, name, stock, low_stock_threshold, stock_status, updated_at')
        .in('stock_status', ['negative', 'zero', 'low'])
        .order('stock', { ascending: true })
        .limit(500),
      auth.supabase
        .from('tf_alert_acks')
        .select('sku, acked_status, acked_at')
        .eq('user_id', auth.user.id),
    ]);

    if (pErr) return handleSupabaseError(pErr);
    if (aErr) return handleSupabaseError(aErr);

    const ackMap = new Map((acks || []).map(a => [a.sku, a]));

    const alerts = (products || []).map(p => {
      const ack = ackMap.get(p.sku);
      const isAcked = ack && ack.acked_status === p.stock_status;
      return {
        sku: p.sku,
        name: p.name,
        stock: p.stock,
        threshold: p.low_stock_threshold,
        status: p.stock_status,
        last_change: p.updated_at,
        acked: !!isAcked,
        acked_at: isAcked ? ack.acked_at : null,
      };
    });

    const visible = includeAcked ? alerts : alerts.filter(a => !a.acked);

    const counts = visible.reduce(
      (acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        acc.total += 1;
        return acc;
      },
      { negative: 0, zero: 0, low: 0, total: 0 }
    );
    counts.unread = visible.filter(a => !a.acked).length;

    const body = JSON.stringify({ success: true, error: null, data: { alerts: visible, counts } });
    const etag = makeETag(body);
    if (maybeNotModified(request, etag)) {
      return new Response(null, { status: 304, headers: { etag } });
    }
    return new Response(body, {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'private, max-age=0, must-revalidate',
        etag,
      },
    });
  } catch (err) {
    console.error('[alerts] GET error', err);
    return errorResponse('Failed to fetch alerts', 500);
  }
}
