// app/api/sales/transactions/route.js
import { createClient } from '../../../../lib/database/supabase-server/index.js';
import { successResponse, errorResponse, handleSupabaseError } from '../../../../lib/utils/api-response';

/**
 * GET /api/sales/transactions - Get sales transaction history
 * Mirrors Rekapanpenjualan sheet
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Filters
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const channel = searchParams.get('channel');
    const sku = searchParams.get('sku');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('tf_sales_transactions')
      .select('*', { count: 'exact' })
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

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

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    // Calculate totals for the filtered data
    const totals = data.reduce((acc, row) => ({
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

    return successResponse({
      transactions: data,
      totals,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < count
      }
    });
  } catch (error) {
    console.error('Error fetching sales transactions:', error);
    return errorResponse('Failed to fetch sales transactions', 500);
  }
}
