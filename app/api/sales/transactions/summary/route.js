// app/api/sales/transactions/summary/route.js
import { createClient } from '../../../../../lib/database/supabase-server/index.js';
import { successResponse, errorResponse, handleSupabaseError } from '../../../../../lib/utils/api-response';
import { authenticateRequest } from '../../../../../lib/utils/auth-helpers.js';
import { makeETag, maybeNotModified } from '../../../../../lib/http/jsonETag.js';

export const runtime = 'nodejs';

/**
 * GET /api/sales/transactions/summary - Get sales summary
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
    
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const groupBy = searchParams.get('group_by') || 'channel'; // 'channel', 'product', 'date'

    let query = supabase.from('tf_sales_transactions').select('*');

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    // Group and summarize data
    const summary = {};
    
    data.forEach(row => {
      let key;
      switch (groupBy) {
        case 'product':
          key = `${row.sku} - ${row.product_name}`;
          break;
        case 'date':
          key = row.transaction_date;
          break;
        default:
          key = row.channel;
      }

      if (!summary[key]) {
        summary[key] = {
          key,
          transactions: 0,
          quantity: 0,
          revenue: 0,
          profit: 0,
          modalCost: 0,
          packingCost: 0,
          affiliateCost: 0,
          marketplaceFee: 0
        };
      }

      summary[key].transactions++;
      summary[key].quantity += row.quantity;
      summary[key].revenue += Number(row.revenue);
      summary[key].profit += Number(row.net_profit);
      summary[key].modalCost += Number(row.modal_cost) * row.quantity;
      summary[key].packingCost += Number(row.packing_cost) * row.quantity;
      summary[key].affiliateCost += Number(row.affiliate_cost);
      summary[key].marketplaceFee += Number(row.marketplace_fee);
    });

    // Calculate margins
    Object.values(summary).forEach(item => {
      item.margin = item.revenue > 0 
        ? (item.profit / item.revenue * 100).toFixed(2)
        : 0;
    });

    // Sort by revenue descending
    const sortedSummary = Object.values(summary)
      .sort((a, b) => b.revenue - a.revenue);

    const responseData = {
      summary: sortedSummary,
      groupBy
    };

    // ETag implementation
    const body = JSON.stringify({ success: true, data: responseData });
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
    console.error('Error fetching sales summary:', error);
    return errorResponse('Failed to fetch sales summary', 500);
  }
}
