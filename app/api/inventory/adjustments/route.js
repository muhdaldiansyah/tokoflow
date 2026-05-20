// app/api/inventory/adjustments/route.js
import { createClient } from '../../../../lib/database/supabase-server/index.js';
import { successResponse, errorResponse, handleSupabaseError } from '../../../../lib/utils/api-response';
import { authenticateRequest } from '../../../../lib/utils/auth-helpers.js';
import { makeETag, maybeNotModified } from '../../../../lib/http/jsonETag.js';

export const runtime = 'nodejs';

/**
 * GET /api/inventory/adjustments - Get stock adjustment history
 */
export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sku = searchParams.get('sku');

    let query = supabase
      .from('tf_stock_adjustments')
      .select(`
        *,
        product:tf_products!tf_stock_adjustments_sku_fkey(
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (sku) {
      query = query.eq('sku', sku);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    // Format the data
    const adjustments = data.map(adjustment => ({
      id: adjustment.id,
      sku: adjustment.sku,
      product_name: adjustment.product?.name || adjustment.sku,
      quantity_change: adjustment.quantity_change,
      new_balance: adjustment.new_balance,
      reason: adjustment.reason,
      notes: adjustment.notes,
      created_at: adjustment.created_at,
      created_by: adjustment.created_by
    }));

    // ETag implementation
    const body = JSON.stringify({ success: true, data: adjustments });
    const etag = makeETag(body);

    if (maybeNotModified(request, etag)) {
      return new Response(null, {
        status: 304,
        headers: { etag }
      });
    }

    return new Response(body, {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'private, max-age=0, must-revalidate',
        etag
      }
    });
  } catch (error) {
    console.error('Error fetching adjustments:', error);
    return errorResponse('Failed to fetch adjustments', 500);
  }
}
