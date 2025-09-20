// app/api/dashboard/route.js
import { createClient } from '../../../lib/database/supabase-server/index.js';
import { successResponse, errorResponse } from '../../../lib/utils/api-response';
import { authenticateRequest } from '../../../lib/utils/auth-helpers.js';
import { makeETag, maybeNotModified } from '../../../lib/http/jsonETag.js';

export const runtime = 'nodejs';

/**
 * GET /api/dashboard - Get dashboard summary data
 * Provides overview metrics for the main dashboard
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
    
    // Optional date range filter
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    // Get today's date for daily metrics
    const today = new Date().toISOString().split('T')[0];

    // Parallelize all queries with Promise.all
    const [
      salesResult,
      todaySalesResult,
      inventoryAlertsResult,
      pendingSalesResult,
      pendingIncomingResult,
      topProductsResult,
      channelDataResult,
      recentSalesResult,
      recentIncomingResult
    ] = await Promise.all([
      // 1. Sales Summary
      supabase
        .from('tf_sales_transactions')
        .select('revenue, net_profit, quantity')
        .gte('transaction_date', startDate || '2000-01-01')
        .lte('transaction_date', endDate || '2999-12-31'),

      // 2. Today's Sales
      supabase
        .from('tf_sales_transactions')
        .select('revenue, net_profit')
        .eq('transaction_date', today),

      // 3. Inventory Alerts
      supabase
        .from('tf_products')
        .select('sku, name, stock')
        .or('stock.lt.0,stock.eq.0')
        .order('stock'),

      // 4. Pending Sales
      supabase
        .from('tf_sales_input')
        .select('id')
        .eq('status', 'ok')
        .not('quantity', 'is', null),

      // 5. Pending Incoming
      supabase
        .from('tf_incoming_goods_input')
        .select('id')
        .eq('status', 'ok')
        .not('quantity', 'is', null),

      // 6. Top Products
      supabase
        .from('tf_sales_transactions')
        .select('sku, product_name, quantity')
        .gte('transaction_date', startDate || '2000-01-01')
        .lte('transaction_date', endDate || '2999-12-31'),

      // 7. Channel Data
      supabase
        .from('tf_sales_transactions')
        .select('channel, revenue, net_profit')
        .gte('transaction_date', startDate || '2000-01-01')
        .lte('transaction_date', endDate || '2999-12-31'),

      // 8. Recent Sales
      supabase
        .from('tf_sales_transactions')
        .select('id, transaction_date, sku, product_name, revenue, channel, quantity, selling_price')
        .eq('transaction_date', today)
        .order('created_at', { ascending: false })
        .limit(10),

      // 9. Recent Incoming
      supabase
        .from('tf_incoming_goods')
        .select('id, transaction_date, sku, product_name, quantity')
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    // Process sales summary
    const salesData = salesResult.data;
    const salesSummary = salesData?.reduce((acc, row) => ({
      totalRevenue: acc.totalRevenue + Number(row.revenue),
      totalProfit: acc.totalProfit + Number(row.net_profit),
      totalQuantity: acc.totalQuantity + row.quantity,
      transactionCount: acc.transactionCount + 1
    }), {
      totalRevenue: 0,
      totalProfit: 0,
      totalQuantity: 0,
      transactionCount: 0
    }) || { totalRevenue: 0, totalProfit: 0, totalQuantity: 0, transactionCount: 0 };

    salesSummary.averageMargin = salesSummary.totalRevenue > 0
      ? (salesSummary.totalProfit / salesSummary.totalRevenue * 100).toFixed(2)
      : 0;

    // Process today's sales
    const todaySales = todaySalesResult.data;
    const todaySummary = todaySales?.reduce((acc, row) => ({
      revenue: acc.revenue + Number(row.revenue),
      profit: acc.profit + Number(row.net_profit),
      count: acc.count + 1
    }), { revenue: 0, profit: 0, count: 0 }) || { revenue: 0, profit: 0, count: 0 };

    // Process top products
    const topProducts = topProductsResult.data;
    const productSummary = {};
    topProducts?.forEach(row => {
      if (!productSummary[row.sku]) {
        productSummary[row.sku] = {
          sku: row.sku,
          name: row.product_name,
          totalQuantity: 0
        };
      }
      productSummary[row.sku].totalQuantity += row.quantity;
    });

    const topProductsList = Object.values(productSummary)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);

    // Process channel data
    const channelData = channelDataResult.data;
    const channelSummary = {};
    channelData?.forEach(row => {
      if (!channelSummary[row.channel]) {
        channelSummary[row.channel] = {
          channel: row.channel,
          revenue: 0,
          profit: 0,
          count: 0
        };
      }
      channelSummary[row.channel].revenue += Number(row.revenue);
      channelSummary[row.channel].profit += Number(row.net_profit);
      channelSummary[row.channel].count++;
    });

    // Extract data from results
    const inventoryAlerts = inventoryAlertsResult.data;
    const pendingSales = pendingSalesResult.data;
    const pendingIncoming = pendingIncomingResult.data;
    const recentSales = recentSalesResult.data;
    const recentIncoming = recentIncomingResult.data;

    // Compile dashboard data
    const dashboardData = {
      salesSummary,
      todaySales: todaySummary,
      inventoryAlerts: {
        negativeStock: inventoryAlerts?.filter(p => p.stock < 0) || [],
        zeroStock: inventoryAlerts?.filter(p => p.stock === 0) || [],
        totalAlerts: inventoryAlerts?.length || 0
      },
      pendingTransactions: {
        sales: pendingSales?.length || 0,
        incoming: pendingIncoming?.length || 0,
        total: (pendingSales?.length || 0) + (pendingIncoming?.length || 0)
      },
      topProducts: topProductsList,
      salesByChannel: Object.values(channelSummary),
      recentActivities: {
        sales: recentSales || [],
        incoming: recentIncoming || []
      },
      dateRange: {
        start: startDate || 'all time',
        end: endDate || 'current'
      }
    };

    const body = JSON.stringify(dashboardData);
    const etag = makeETag(body);
    if (maybeNotModified(request, etag)) {
      return new Response(null, { status: 304, headers: { etag } });
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
    console.error('Error fetching dashboard data:', error);
    return errorResponse('Failed to fetch dashboard data', 500);
  }
}
