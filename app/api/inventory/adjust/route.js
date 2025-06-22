// app/api/inventory/adjust/route.js
import { createClient } from '@/lib/database/supabase-server';
import { successResponse, errorResponse, handleSupabaseError } from '@/lib/utils/api-response';

/**
 * POST /api/inventory/adjust - Single stock adjustment
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();

    // Validate input
    if (!body.sku || body.adjustment === undefined || !body.reason) {
      return errorResponse('SKU, adjustment, and reason are required');
    }

    // Get current stock
    const { data: product, error: productError } = await supabase
      .from('tokoflow_products')
      .select('stock')
      .eq('sku', body.sku)
      .single();

    if (productError || !product) {
      return errorResponse('Product not found');
    }

    const currentStock = product.stock;
    const adjustment = parseInt(body.adjustment);
    const newStock = currentStock + adjustment;

    // Update product stock
    const { error: updateError } = await supabase
      .from('tokoflow_products')
      .update({ 
        stock: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('sku', body.sku);

    if (updateError) {
      return handleSupabaseError(updateError);
    }

    // Log the adjustment
    const { error: logError } = await supabase
      .from('tokoflow_stock_adjustments')
      .insert({
        sku: body.sku,
        quantity_change: adjustment,
        new_balance: newStock,
        reason: body.reason,
        notes: body.notes || null,
        created_by: user.id,
        adjustment_date: body.adjustment_date || new Date().toISOString()
      });

    if (logError) {
      console.error('Failed to log adjustment:', logError);
      // Don't fail the request if logging fails
    }

    return successResponse({
      message: 'Stock adjusted successfully',
      sku: body.sku,
      previous_stock: currentStock,
      adjustment: adjustment,
      new_stock: newStock
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    return errorResponse('Failed to adjust stock', 500);
  }
}
