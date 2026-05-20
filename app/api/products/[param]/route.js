// app/api/products/[param]/route.js
import { createClient } from '../../../../lib/database/supabase-server/index.js';
import { successResponse, errorResponse, handleSupabaseError } from '../../../../lib/utils/api-response';
import { authenticateRequest } from '../../../../lib/utils/auth-helpers.js';
import { getCurrentRole, requireOwner } from '../../../../lib/auth/role.js';
import { clearPrefix } from '../../../../lib/cache/index.js';
import { bump } from '../../../../lib/state/global-state.js';

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
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }

    const supabase = await createClient();
    const { param } = await params;

    // Determine if param is ID or SKU
    const isId = isUUID(param);
    const queryField = isId ? 'id' : 'sku';

    // Use view for products with costs if param is SKU
    if (!isId) {
      const { data: product, error: pErr } = await supabase
        .from('v_products_with_costs')
        .select('*')
        .eq('sku', param)
        .single();
      if (pErr || !product) return handleSupabaseError(pErr || new Error('Not found'));

      // Get compositions separately
      const { data: comps } = await supabase
        .from('tf_product_compositions')
        .select('id,parent_sku,component_sku,quantity')
        .or(`parent_sku.eq.${param},component_sku.eq.${param}`);

      const data = {
        ...product,
        modal_cost: product.modal_cost || 0,
        packing_cost: product.packing_cost || 0,
        affiliate_percentage: product.affiliate_percentage || 0,
        asParent: (comps || []).filter(c => c.parent_sku === param),
        asComponent: (comps || []).filter(c => c.component_sku === param),
      };

      return successResponse(data);
    }

    // For UUID id, use existing table-based logic
    const { data: product, error: pErr } = await supabase
      .from('tf_products')
      .select('id, sku, name, stock, low_stock_threshold, stock_status, warehouse_id, created_at, updated_at')
      .eq('id', param)
      .single();
    if (pErr || !product) return handleSupabaseError(pErr || new Error('Not found'));

    const [{ data: cost }, { data: comps }] = await Promise.all([
      supabase.from('tf_product_costs')
        .select('modal_cost,packing_cost,affiliate_percentage')
        .eq('product_id', product.id)
        .maybeSingle(),
      supabase.from('tf_product_compositions')
        .select('id,parent_sku,component_sku,quantity')
        .or(`parent_sku.eq.${product.sku},component_sku.eq.${product.sku}`)
    ]);

    const data = {
      ...product,
      modal_cost: cost?.modal_cost || 0,
      packing_cost: cost?.packing_cost || 0,
      affiliate_percentage: cost?.affiliate_percentage || 0,
      asParent: (comps || []).filter(c => c.parent_sku === product.sku),
      asComponent: (comps || []).filter(c => c.component_sku === product.sku),
    };

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
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Staff users may edit basic product info but not cost fields. We
    // resolve the role once and reject if a staff user is trying to touch
    // any of the cost columns.
    const role = await getCurrentRole(auth);
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

    const isCostFieldPresent =
      body.modal_cost !== undefined ||
      body.packing_cost !== undefined ||
      body.affiliate_percentage !== undefined;
    if (role !== 'owner' && isCostFieldPresent) {
      return errorResponse(
        'Mengubah biaya produk hanya untuk owner.',
        403
      );
    }

    // Determine if param is ID or SKU
    const isId = isUUID(param);
    const queryField = isId ? 'id' : 'sku';

    // Update product. Only forward fields the caller actually sent so we
    // don't accidentally clobber existing values with undefined.
    const productUpdate = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) productUpdate.name = body.name;
    if (body.stock !== undefined) productUpdate.stock = body.stock;
    if (body.low_stock_threshold !== undefined) {
      productUpdate.low_stock_threshold = body.low_stock_threshold;
    }
    if (body.warehouse_id !== undefined) {
      productUpdate.warehouse_id = body.warehouse_id;
    }

    const { data: product, error: productError } = await supabase
      .from('tf_products')
      .update(productUpdate)
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
        .from('tf_product_costs')
        .update(costUpdate)
        .eq('sku', product.sku);

      if (costError && costError.code === 'PGRST116') {
        // Cost record doesn't exist, create it
        const { error: insertError } = await supabase
          .from('tf_product_costs')
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
      .from('tf_products')
      .select(`
        *,
        cost:tf_product_costs!tf_product_costs_sku_fkey(
          modal_cost,
          packing_cost,
          affiliate_percentage
        )
      `)
      .eq('id', product.id)
      .single();

    // Clear cache and bump state after mutation
    clearPrefix(`p:${auth.user.id}`);
    bump('products');

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
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
    const gate = await requireOwner(auth);
    if (!gate.ok) return gate.response;

    const supabase = await createClient();
    const { param } = await params;

    // Determine if param is ID or SKU
    const isId = isUUID(param);
    
    // First get the product to retrieve SKU if needed
    const { data: product, error: fetchError } = await supabase
      .from('tf_products')
      .select('id, sku')
      .eq(isId ? 'id' : 'sku', param)
      .single();

    if (fetchError || !product) {
      return errorResponse('Product not found', 404);
    }

    const sku = product.sku;

    // Check if product is used in compositions
    const { data: compositions } = await supabase
      .from('tf_product_compositions')
      .select('id')
      .or(`parent_sku.eq.${sku},component_sku.eq.${sku}`)
      .limit(1);

    if (compositions && compositions.length > 0) {
      return errorResponse('Cannot delete product used in compositions', 400);
    }

    // Check if product has transactions
    const { data: transactions } = await supabase
      .from('tf_sales_transactions')
      .select('id')
      .eq('sku', sku)
      .limit(1);

    if (transactions && transactions.length > 0) {
      return errorResponse('Cannot delete product with transaction history', 400);
    }

    // Delete cost record first
    await supabase
      .from('tf_product_costs')
      .delete()
      .eq('sku', sku);

    // Delete product
    const { error } = await supabase
      .from('tf_products')
      .delete()
      .eq('id', product.id);

    if (error) {
      return handleSupabaseError(error);
    }

    // Clear cache and bump state after mutation
    clearPrefix(`p:${auth.user.id}`);
    bump('products');

    return successResponse({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return errorResponse('Failed to delete product', 500);
  }
}
