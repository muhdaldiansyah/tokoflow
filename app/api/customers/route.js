// app/api/customers/route.js
import { authenticateRequest } from '../../../lib/utils/auth-helpers';
import { successResponse, errorResponse, handleSupabaseError } from '../../../lib/utils/api-response';
import { makeETag, maybeNotModified } from '../../../lib/http/jsonETag.js';

export const runtime = 'nodejs';

/**
 * GET /api/customers — list customers with optional search + lifetime stats.
 *
 * Lifetime stats (orders, total_spent, total_profit, last_order) are computed
 * on read by joining tf_sales_transactions. No triggers, no denormalization —
 * UMKM-scale data makes this cheap, and it eliminates a class of stale-counter
 * bugs.
 *
 * Query params:
 *   ?search=<text>   — case-insensitive match against name and phone
 *   ?with_stats=0    — skip the stats join (faster for the sales-input dropdown)
 */
export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return errorResponse(auth.error || 'Unauthorized', auth.status || 401);

    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const withStats = searchParams.get('with_stats') !== '0';

    // 1) Fetch customers (small list, no pagination needed at UMKM scale yet)
    let q = supabase
      .from('tf_customers')
      .select('id, name, phone, notes, created_at, updated_at')
      .order('name', { ascending: true })
      .limit(500);

    if (search) {
      // ilike is case-insensitive. Search both name and phone.
      q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: customers, error } = await q;
    if (error) return handleSupabaseError(error);

    let result = customers || [];

    // 2) Optionally enrich with lifetime stats
    if (withStats && result.length > 0) {
      const ids = result.map(c => c.id);
      const { data: sales, error: sErr } = await supabase
        .from('tf_sales_transactions')
        .select('customer_id, revenue, net_profit, transaction_date')
        .in('customer_id', ids);

      if (sErr) return handleSupabaseError(sErr);

      // Build per-customer aggregate map
      const stats = new Map();
      (sales || []).forEach(row => {
        if (row.customer_id == null) return;
        const cur = stats.get(row.customer_id) || {
          orders: 0,
          total_spent: 0,
          total_profit: 0,
          last_order_at: null,
        };
        cur.orders += 1;
        cur.total_spent  += Number(row.revenue || 0);
        cur.total_profit += Number(row.net_profit || 0);
        if (!cur.last_order_at || row.transaction_date > cur.last_order_at) {
          cur.last_order_at = row.transaction_date;
        }
        stats.set(row.customer_id, cur);
      });

      result = result.map(c => ({
        ...c,
        ...(stats.get(c.id) || { orders: 0, total_spent: 0, total_profit: 0, last_order_at: null }),
      }));
    }

    const body = JSON.stringify({ success: true, error: null, data: result });
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
    console.error('[customers] GET error', err);
    return errorResponse('Failed to fetch customers', 500);
  }
}

/**
 * POST /api/customers — create a new customer.
 * Body: { name (required), phone, notes }
 */
export async function POST(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return errorResponse(auth.error || 'Unauthorized', auth.status || 401);

    const { supabase } = auth;
    const body = await request.json();

    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return errorResponse('Customer name is required');
    }

    const insert = {
      name: body.name.trim(),
      phone: body.phone?.trim() || null,
      notes: body.notes?.trim() || null,
    };

    const { data, error } = await supabase
      .from('tf_customers')
      .insert(insert)
      .select()
      .single();

    if (error) return handleSupabaseError(error);
    return successResponse(data, 201);
  } catch (err) {
    console.error('[customers] POST error', err);
    return errorResponse('Failed to create customer', 500);
  }
}
