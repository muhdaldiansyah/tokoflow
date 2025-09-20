// app/api/dashboard/analytics/route.js
import { createClient } from '../../../../lib/database/supabase-server/index.js';
import { successResponse, errorResponse } from '../../../../lib/utils/api-response';
import { authenticateRequest } from '../../../../lib/utils/auth-helpers.js';
import { makeETag, maybeNotModified } from '../../../../lib/http/jsonETag.js';

export const runtime = 'nodejs';

/**
 * GET /api/dashboard/analytics - Get detailed analytics data
 * Provides time-series data for charts and graphs
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
    
    const period = searchParams.get('period') || '30'; // days
    const groupBy = searchParams.get('group_by') || 'day'; // day, week, month
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get sales data for time series
    const { data: salesData, error } = await supabase
      .from('tf_sales_transactions')
      .select('transaction_date, revenue, net_profit, quantity, channel')
      .gte('transaction_date', startDate.toISOString().split('T')[0])
      .lte('transaction_date', endDate.toISOString().split('T')[0])
      .order('transaction_date');

    if (error) {
      throw error;
    }

    // Group data by date
    const dailyData = {};
    const channelData = {};
    const cumulativeData = {
      revenue: 0,
      profit: 0,
      quantity: 0
    };

    salesData?.forEach(row => {
      const date = row.transaction_date;
      
      // Daily aggregation
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          revenue: 0,
          profit: 0,
          quantity: 0,
          transactions: 0
        };
      }
      
      dailyData[date].revenue += Number(row.revenue);
      dailyData[date].profit += Number(row.net_profit);
      dailyData[date].quantity += row.quantity;
      dailyData[date].transactions++;

      // Channel aggregation
      if (!channelData[row.channel]) {
        channelData[row.channel] = {
          channel: row.channel,
          revenue: 0,
          profit: 0,
          quantity: 0,
          transactions: 0
        };
      }
      
      channelData[row.channel].revenue += Number(row.revenue);
      channelData[row.channel].profit += Number(row.net_profit);
      channelData[row.channel].quantity += row.quantity;
      channelData[row.channel].transactions++;

      // Cumulative totals
      cumulativeData.revenue += Number(row.revenue);
      cumulativeData.profit += Number(row.net_profit);
      cumulativeData.quantity += row.quantity;
    });

    // Fill missing dates with zero values
    const timeSeriesData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = dailyData[dateStr] || {
        date: dateStr,
        revenue: 0,
        profit: 0,
        quantity: 0,
        transactions: 0
      };
      
      // Calculate margin
      dayData.margin = dayData.revenue > 0 
        ? (dayData.profit / dayData.revenue * 100).toFixed(2)
        : 0;
      
      timeSeriesData.push(dayData);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get product performance
    const { data: productData } = await supabase
      .from('tf_sales_transactions')
      .select('sku, product_name, revenue, net_profit, quantity')
      .gte('transaction_date', startDate.toISOString().split('T')[0])
      .lte('transaction_date', endDate.toISOString().split('T')[0]);

    const productPerformance = {};
    productData?.forEach(row => {
      if (!productPerformance[row.sku]) {
        productPerformance[row.sku] = {
          sku: row.sku,
          name: row.product_name,
          revenue: 0,
          profit: 0,
          quantity: 0,
          transactions: 0
        };
      }
      
      productPerformance[row.sku].revenue += Number(row.revenue);
      productPerformance[row.sku].profit += Number(row.net_profit);
      productPerformance[row.sku].quantity += row.quantity;
      productPerformance[row.sku].transactions++;
    });

    // Calculate margins and sort
    Object.values(productPerformance).forEach(product => {
      product.margin = product.revenue > 0 
        ? (product.profit / product.revenue * 100).toFixed(2)
        : 0;
    });

    const topByRevenue = Object.values(productPerformance)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const topByQuantity = Object.values(productPerformance)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const topByMargin = Object.values(productPerformance)
      .filter(p => p.revenue > 0)
      .sort((a, b) => parseFloat(b.margin) - parseFloat(a.margin))
      .slice(0, 10);

    // Get inventory movement
    const { data: incomingData } = await supabase
      .from('tf_incoming_goods')
      .select('transaction_date, quantity')
      .gte('transaction_date', startDate.toISOString().split('T')[0])
      .lte('transaction_date', endDate.toISOString().split('T')[0]);

    const inventoryMovement = {};
    
    // Add incoming goods
    incomingData?.forEach(row => {
      const date = row.transaction_date;
      if (!inventoryMovement[date]) {
        inventoryMovement[date] = { date, incoming: 0, outgoing: 0 };
      }
      inventoryMovement[date].incoming += row.quantity;
    });

    // Add outgoing from sales
    salesData?.forEach(row => {
      const date = row.transaction_date;
      if (!inventoryMovement[date]) {
        inventoryMovement[date] = { date, incoming: 0, outgoing: 0 };
      }
      inventoryMovement[date].outgoing += row.quantity;
    });

    // Calculate growth rates
    const growthRates = {
      revenue: 0,
      profit: 0,
      quantity: 0
    };

    if (timeSeriesData.length >= 2) {
      const firstWeek = timeSeriesData.slice(0, 7).reduce((sum, day) => ({
        revenue: sum.revenue + day.revenue,
        profit: sum.profit + day.profit,
        quantity: sum.quantity + day.quantity
      }), { revenue: 0, profit: 0, quantity: 0 });

      const lastWeek = timeSeriesData.slice(-7).reduce((sum, day) => ({
        revenue: sum.revenue + day.revenue,
        profit: sum.profit + day.profit,
        quantity: sum.quantity + day.quantity
      }), { revenue: 0, profit: 0, quantity: 0 });

      if (firstWeek.revenue > 0) {
        growthRates.revenue = ((lastWeek.revenue - firstWeek.revenue) / firstWeek.revenue * 100).toFixed(2);
      }
      if (firstWeek.profit > 0) {
        growthRates.profit = ((lastWeek.profit - firstWeek.profit) / firstWeek.profit * 100).toFixed(2);
      }
      if (firstWeek.quantity > 0) {
        growthRates.quantity = ((lastWeek.quantity - firstWeek.quantity) / firstWeek.quantity * 100).toFixed(2);
      }
    }

    const responseData = {
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        days: period
      },
      summary: {
        totalRevenue: cumulativeData.revenue,
        totalProfit: cumulativeData.profit,
        totalQuantity: cumulativeData.quantity,
        averageMargin: cumulativeData.revenue > 0
          ? (cumulativeData.profit / cumulativeData.revenue * 100).toFixed(2)
          : 0,
        growthRates
      },
      timeSeries: timeSeriesData,
      channelPerformance: Object.values(channelData).map(channel => ({
        ...channel,
        margin: channel.revenue > 0
          ? (channel.profit / channel.revenue * 100).toFixed(2)
          : 0
      })),
      productPerformance: {
        byRevenue: topByRevenue,
        byQuantity: topByQuantity,
        byMargin: topByMargin
      },
      inventoryMovement: Object.values(inventoryMovement).sort((a, b) =>
        new Date(a.date) - new Date(b.date)
      )
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
    console.error('Error fetching analytics data:', error);
    return errorResponse('Failed to fetch analytics data', 500);
  }
}
