// app/api/dashboard/route.js
import { createClient } from '../../../lib/database/supabase-server';
import { successResponse, errorResponse } from '../../../lib/utils/api-response';

/**
 * GET /api/dashboard - Get dashboard summary data
 * Provides overview metrics for the main dashboard
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Optional date range filter
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    // Get today's date for daily metrics
    const today = new Date().toISOString().split('T')[0];

    // 1. Sales Summary
    let salesQuery = supabase
      .from('tf_sales_transactions')
      .select('revenue, net_profit, quantity');
    
    if (startDate) salesQuery = salesQuery.gte('transaction_date', startDate);
    if (endDate) salesQuery = salesQuery.lte('transaction_date', endDate);
    
    const { data: salesData } = await salesQuery;
    
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

    // Calculate average margin
    salesSummary.averageMargin = salesSummary.totalRevenue > 0 
      ? (salesSummary.totalProfit / salesSummary.totalRevenue * 100).toFixed(2)
      : 0;

    // 2. Today's Sales
    const { data: todaySales } = await supabase
      .from('tf_sales_transactions')
      .select('revenue, net_profit')
      .eq('transaction_date', today);
    
    const todaySummary = todaySales?.reduce((acc, row) => ({
      revenue: acc.revenue + Number(row.revenue),
      profit: acc.profit + Number(row.net_profit),
      count: acc.count + 1
    }), { revenue: 0, profit: 0, count: 0 }) || { revenue: 0, profit: 0, count: 0 };

    // 3. Inventory Alerts
    const { data: inventoryAlerts } = await supabase
      .from('tf_products')
      .select('sku, name, stock')
      .or('stock.lt.0,stock.eq.0')
      .order('stock');

    // 4. Pending Transactions
    const { data: pendingSales } = await supabase
      .from('tf_sales_input')
      .select('id')
      .eq('status', 'ok')
      .not('quantity', 'is', null);

    const { data: pendingIncoming } = await supabase
      .from('tf_incoming_goods_input')
      .select('id')
      .eq('status', 'ok')
      .not('quantity', 'is', null);

    // 5. Top Products (by quantity sold)
    const { data: topProducts } = await supabase
      .from('tf_sales_transactions')
      .select('sku, product_name, quantity')
      .gte('transaction_date', startDate || '2000-01-01')
      .lte('transaction_date', endDate || '2999-12-31');

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

    // 6. Sales by Channel
    const { data: channelData } = await supabase
      .from('tf_sales_transactions')
      .select('channel, revenue, net_profit')
      .gte('transaction_date', startDate || '2000-01-01')
      .lte('transaction_date', endDate || '2999-12-31');

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

    // 7. Recent Activities - Today's Sales
    const { data: recentSales } = await supabase
      .from('tf_sales_transactions')
      .select('id, transaction_date, sku, product_name, revenue, channel, quantity, selling_price')
      .eq('transaction_date', today)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: recentIncoming } = await supabase
      .from('tf_incoming_goods')
      .select('id, transaction_date, sku, product_name, quantity')
      .order('created_at', { ascending: false })
      .limit(5);

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

    return successResponse(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return errorResponse('Failed to fetch dashboard data', 500);
  }
}
