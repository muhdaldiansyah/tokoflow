// app/api/sales/transactions/route.js
import { createClient } from '../../../../lib/database/supabase-server/index.js';
import { successResponse, errorResponse, handleSupabaseError } from '../../../../lib/utils/api-response';
import { authenticateRequest } from '../../../../lib/utils/auth-helpers.js';
import { makeETag, maybeNotModified } from '../../../../lib/http/jsonETag.js';
import { parseQuery, buildNextLink } from '../../../../lib/http/paging.js';

export const runtime = 'nodejs';

/**
 * GET /api/sales/transactions - Get sales transaction history
 * Mirrors Rekapanpenjualan sheet
 */
export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }

    const supabase = await createClient();
    const { url, limit, cursor, select } = parseQuery(request, { maxLimit: 200, defaultLimit: 25 });
    const { searchParams } = new URL(request.url);

    // Filters
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const channel = searchParams.get('channel');
    const sku = searchParams.get('sku');
    const customerId = searchParams.get('customer_id');

    let query = supabase
      .from('tf_sales_transactions')
      .select(select)
      .order('id', { ascending: false });

    // Apply filters
    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }
    if (channel) {
      query = query.eq('channel', channel);
    }
    if (sku) {
      query = query.eq('sku', sku);
    }
    if (customerId) {
      // Special token to filter rows with no customer attributed
      if (customerId === 'none' || customerId === 'null') {
        query = query.is('customer_id', null);
      } else {
        query = query.eq('customer_id', customerId);
      }
    }

    // Apply cursor pagination
    if (cursor) {
      query = query.lt('id', cursor);
    }
    query = query.limit(limit + 1);

    const { data, error } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    // Handle pagination
    const hasMore = data.length > limit;
    const page = hasMore ? data.slice(0, limit) : data;
    const nextCursor = hasMore ? page[page.length - 1]?.id : null;

    // Calculate totals for the filtered data
    const totals = page.reduce((acc, row) => ({
      totalQuantity: acc.totalQuantity + row.quantity,
      totalRevenue: acc.totalRevenue + Number(row.revenue),
      totalProfit: acc.totalProfit + Number(row.net_profit),
      transactions: acc.transactions + 1
    }), {
      totalQuantity: 0,
      totalRevenue: 0,
      totalProfit: 0,
      transactions: 0
    });

    // Calculate average margin
    totals.averageMargin = totals.totalRevenue > 0
      ? (totals.totalProfit / totals.totalRevenue * 100).toFixed(2)
      : 0;

    const result = {
      transactions: page,
      totals
    };

    // ETag optimization
    const body = JSON.stringify(result);
    const etag = makeETag(body);
    if (maybeNotModified(request, etag)) {
      return new Response(null, { status: 304, headers: { etag } });
    }

    const response = new Response(body, {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'private, max-age=0, must-revalidate',
        etag
      }
    });

    const link = buildNextLink(url, nextCursor);
    if (link) {
      response.headers.set('link', `<${link}>; rel="next"`);
    }

    return response;
  } catch (error) {
    console.error('Error fetching sales transactions:', error);
    return errorResponse('Failed to fetch sales transactions', 500);
  }
}
