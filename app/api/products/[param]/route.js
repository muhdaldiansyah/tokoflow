// app/api/products/[param]/route.js
import { createClient } from '@/lib/database/supabase-server';
import { successResponse, errorResponse, handleSupabaseError } from '@/lib/utils/api-response';

/**
 * Helper function to determine if param is UUID
 */
function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * GET /api/products/[param] - Get a single product by SKU or ID
 */
export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { param } = await params;

    // Determine if param is ID or SKU
    const isId = isUUID(param);
    const queryField = isId ? 'id' : 'sku';

    const { data, error } = await supabase
      .from('tokoflow_products')
      .select(`
        *,
        cost:tokoflow_product_costs!tokoflow_product_costs_sku_fkey(
          modal_cost,
          packing_cost,
          affiliate_percentage
        ),
        compositions:tokoflow_product_compositions!tokoflow_product_compositions_parent_sku_fkey(
          *,
          component:tokoflow_products!tokoflow_product_compositions_component_sku_fkey(
            sku,
            name,
            stock
          )
        )
      `)
      .eq(queryField, param)
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data);
  } catch (error) {
    console.error('Error fetching product:', error);
    return errorResponse('Failed to fetch product', 500);
  }
}

/**
 * PATCH /api/products/[param] - Update a single product
 */
export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient();
    const { param } = await params;
    
    // Log the param to debug
    console.log('PATCH request for param:', param);
    
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('Failed to parse JSON body:', jsonError);
      return errorResponse('Invalid JSON in request body', 400);
    }

    // Determine if param is ID or SKU
    const isId = isUUID(param);
    const queryField = isId ? 'id' : 'sku';

    // Update product
    const { data: product, error: productError } = await supabase
      .from('tokoflow_products')
      .update({
        name: body.name,
        stock: body.stock !== undefined ? body.stock : undefined,
        updated_at: new Date().toISOString()
      })
      .eq(queryField, param)
      .select()
      .single();

    if (productError) {
      return handleSupabaseError(productError);
    }

    // Update costs if provided
    if (body.modal_cost !== undefined || body.packing_cost !== undefined || body.affiliate_percentage !== undefined) {
      const costUpdate = {};
      if (body.modal_cost !== undefined) costUpdate.modal_cost = body.modal_cost;
      if (body.packing_cost !== undefined) costUpdate.packing_cost = body.packing_cost;
      if (body.affiliate_percentage !== undefined) costUpdate.affiliate_percentage = body.affiliate_percentage;
      
      costUpdate.updated_at = new Date().toISOString();

      const { error: costError } = await supabase
        .from('tokoflow_product_costs')
        .update(costUpdate)
        .eq('sku', product.sku);

      if (costError && costError.code === 'PGRST116') {
        // Cost record doesn't exist, create it
        const { error: insertError } = await supabase
          .from('tokoflow_product_costs')
          .insert({
            product_id: product.id,
            sku: product.sku,
            ...costUpdate
          });

        if (insertError) {
          console.error('Error creating cost record:', insertError);
        }
      }
    }

    // Fetch updated product with all relations
    const { data: updatedProduct } = await supabase
      .from('tokoflow_products')
      .select(`
        *,
        cost:tokoflow_product_costs!tokoflow_product_costs_sku_fkey(
          modal_cost,
          packing_cost,
          affiliate_percentage
        )
      `)
      .eq('id', product.id)
      .single();

    return successResponse(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return errorResponse('Failed to update product', 500);
  }
}

/**
 * DELETE /api/products/[param] - Delete a product
 */
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient();
    const { param } = await params;

    // Determine if param is ID or SKU
    const isId = isUUID(param);
    
    // First get the product to retrieve SKU if needed
    const { data: product, error: fetchError } = await supabase
      .from('tokoflow_products')
      .select('id, sku')
      .eq(isId ? 'id' : 'sku', param)
      .single();

    if (fetchError || !product) {
      return errorResponse('Product not found', 404);
    }

    const sku = product.sku;

    // Check if product is used in compositions
    const { data: compositions } = await supabase
      .from('tokoflow_product_compositions')
      .select('id')
      .or(`parent_sku.eq.${sku},component_sku.eq.${sku}`)
      .limit(1);

    if (compositions && compositions.length > 0) {
      return errorResponse('Cannot delete product used in compositions', 400);
    }

    // Check if product has transactions
    const { data: transactions } = await supabase
      .from('tokoflow_sales_transactions')
      .select('id')
      .eq('sku', sku)
      .limit(1);

    if (transactions && transactions.length > 0) {
      return errorResponse('Cannot delete product with transaction history', 400);
    }

    // Delete cost record first
    await supabase
      .from('tokoflow_product_costs')
      .delete()
      .eq('sku', sku);

    // Delete product
    const { error } = await supabase
      .from('tokoflow_products')
      .delete()
      .eq('id', product.id);

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return errorResponse('Failed to delete product', 500);
  }
}
