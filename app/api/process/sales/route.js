// app/api/process/sales/route.js
import { createClient } from '@/lib/database/supabase-server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { processSalesTransaction, batchProcessSales } from '@/lib/services/sales';

/**
 * POST /api/process/sales - Process sales transactions
 * Mirrors simpanDataPenjualan() from Apps Script
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    
    // Process single transaction if ID provided
    if (body.id) {
      const result = await processSalesTransaction(body.id, user.id, supabase);
      
      if (!result.success) {
        return errorResponse(result.error);
      }
      
      return successResponse(result.data);
    }
    
    // Otherwise batch process all pending
    const result = await batchProcessSales(user.id, supabase);
    
    if (!result.success) {
      return errorResponse(result.error);
    }

    return successResponse({
      message: `Processed ${result.successCount} sales successfully`,
      ...result
    });
  } catch (error) {
    console.error('Error processing sales:', error);
    return errorResponse('Failed to process sales', 500);
  }
}

/**
 * GET /api/process/sales/preview - Preview what will be processed
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    
    // Get all pending sales with status='ok'
    const { data, error } = await supabase
      .from('tokoflow_sales_input')
      .select(`
        *,
        product:tokoflow_products!tokoflow_sales_input_sku_fkey(
          name,
          stock
        ),
        cost:tokoflow_product_costs!tokoflow_product_costs_sku_fkey(
          modal_cost,
          packing_cost,
          affiliate_percentage
        ),
        fee:tokoflow_marketplace_fees!tokoflow_sales_input_channel_fkey(
          fee_percentage
        )
      `)
      .eq('status', 'ok')
      .not('quantity', 'is', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Preview error:', error);
      return errorResponse('Failed to get preview');
    }

    // Calculate preview for each transaction
    const preview = data.map(input => {
      const qty = Number(input.quantity) || 0;
      const price = Number(input.selling_price) || 0;
      const revenue = price * qty;
      
      const modal = Number(input.cost?.modal_cost || 0);
      const packing = Number(input.cost?.packing_cost || 0);
      const affiliatePercent = Number(input.cost?.affiliate_percentage || 0);
      const feePercent = Number(input.fee?.fee_percentage || 0);
      
      const affiliateCost = (affiliatePercent / 100) * revenue;
      const marketplaceFee = (feePercent / 100) * revenue;
      const totalCost = (modal + packing) * qty + affiliateCost;
      const profit = revenue - totalCost - marketplaceFee;
      
      return {
        ...input,
        calculated: {
          revenue,
          modalCost: modal * qty,
          packingCost: packing * qty,
          affiliateCost,
          marketplaceFee,
          totalCost,
          profit,
          margin: revenue > 0 ? (profit / revenue * 100).toFixed(2) : 0,
          newStock: (input.product?.stock || 0) - qty
        }
      };
    });

    // Summary
    const summary = preview.reduce((acc, item) => ({
      totalRevenue: acc.totalRevenue + item.calculated.revenue,
      totalProfit: acc.totalProfit + item.calculated.profit,
      totalQuantity: acc.totalQuantity + item.quantity,
      transactions: acc.transactions + 1
    }), {
      totalRevenue: 0,
      totalProfit: 0,
      totalQuantity: 0,
      transactions: 0
    });

    summary.averageMargin = summary.totalRevenue > 0 
      ? (summary.totalProfit / summary.totalRevenue * 100).toFixed(2)
      : 0;

    return successResponse({
      preview,
      summary
    });
  } catch (error) {
    console.error('Error getting preview:', error);
    return errorResponse('Failed to get preview', 500);
  }
}
