// app/api/inventory/movements/route.js
import { createClient } from '../../../../lib/database/supabase-server';
import { successResponse, errorResponse } from '../../../../lib/utils/api-response';

/**
 * GET /api/inventory/movements - Get stock movement history
 * Shows all ins and outs for tracking
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const sku = searchParams.get('sku');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Get sales (outgoing)
    let salesQuery = supabase
      .from('tf_sales_transactions')
      .select('transaction_date, sku, product_name, quantity, channel')
      .order('transaction_date', { ascending: false });

    if (sku) salesQuery = salesQuery.eq('sku', sku);
    if (startDate) salesQuery = salesQuery.gte('transaction_date', startDate);
    if (endDate) salesQuery = salesQuery.lte('transaction_date', endDate);
    
    salesQuery = salesQuery.limit(limit);

    // Get incoming goods
    let incomingQuery = supabase
      .from('tf_incoming_goods')
      .select('transaction_date, sku, product_name, quantity')
      .order('transaction_date', { ascending: false });

    if (sku) incomingQuery = incomingQuery.eq('sku', sku);
    if (startDate) incomingQuery = incomingQuery.gte('transaction_date', startDate);
    if (endDate) incomingQuery = incomingQuery.lte('transaction_date', endDate);
    
    incomingQuery = incomingQuery.limit(limit);

    const [salesResult, incomingResult] = await Promise.all([
      salesQuery,
      incomingQuery
    ]);

    if (salesResult.error || incomingResult.error) {
      throw salesResult.error || incomingResult.error;
    }

    // Combine and format movements
    const movements = [
      ...salesResult.data.map(sale => ({
        date: sale.transaction_date,
        sku: sale.sku,
        product_name: sale.product_name,
        type: 'out',
        quantity: -sale.quantity,
        description: `Sale - ${sale.channel}`,
        reference: sale.channel
      })),
      ...incomingResult.data.map(incoming => ({
        date: incoming.transaction_date,
        sku: incoming.sku,
        product_name: incoming.product_name,
        type: 'in',
        quantity: incoming.quantity,
        description: 'Incoming Goods',
        reference: 'Stock Receipt'
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate running balance if single SKU
    if (sku && movements.length > 0) {
      // Get current stock
      const { data: product } = await supabase
        .from('tf_products')
        .select('stock')
        .eq('sku', sku)
        .single();

      let runningBalance = product?.stock || 0;
      
      // Work backwards to calculate balance at each movement
      for (let i = 0; i < movements.length; i++) {
        movements[i].balanceAfter = runningBalance;
        movements[i].balanceBefore = runningBalance - movements[i].quantity;
        runningBalance = movements[i].balanceBefore;
      }
    }

    return successResponse({
      movements: movements.slice(0, limit),
      filters: {
        sku,
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return errorResponse('Failed to fetch stock movements', 500);
  }
}
