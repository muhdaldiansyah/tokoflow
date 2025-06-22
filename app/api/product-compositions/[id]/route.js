// app/api/product-compositions/[id]/route.js
import { createClient } from '@/lib/database/supabase-server';
import { successResponse, errorResponse, handleSupabaseError } from '@/lib/utils/api-response';

/**
 * GET /api/product-compositions/[id] - Get specific composition
 */
export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { data, error } = await supabase
      .from('tokoflow_product_compositions')
      .select(`
        *,
        parent:tokoflow_products!tokoflow_product_compositions_parent_sku_fkey(
          sku,
          name,
          stock
        ),
        component:tokoflow_products!tokoflow_product_compositions_component_sku_fkey(
          sku,
          name,
          stock
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Product composition not found', 404);
      }
      return handleSupabaseError(error);
    }

    return successResponse(data);
  } catch (error) {
    console.error('Error fetching product composition:', error);
    return errorResponse('Failed to fetch product composition', 500);
  }
}

/**
 * PUT /api/product-compositions/[id] - Update specific composition
 */
export async function PUT(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const body = await request.json();

    // Check if composition exists
    const { data: existing, error: fetchError } = await supabase
      .from('tokoflow_product_compositions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return errorResponse('Product composition not found', 404);
      }
      return handleSupabaseError(fetchError);
    }

    const updates = {};
    
    if (body.quantity !== undefined) {
      const quantity = Number(body.quantity);
      if (quantity <= 0) {
        return errorResponse('Quantity must be greater than 0');
      }
      updates.quantity = quantity;
    }
    
    if (body.source_channel !== undefined) {
      updates.source_channel = body.source_channel;
    }
    
    if (body.status !== undefined) {
      updates.status = body.status;
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('tokoflow_product_compositions')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        parent:tokoflow_products!tokoflow_product_compositions_parent_sku_fkey(
          sku,
          name
        ),
        component:tokoflow_products!tokoflow_product_compositions_component_sku_fkey(
          sku,
          name
        )
      `)
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data);
  } catch (error) {
    console.error('Error updating product composition:', error);
    return errorResponse('Failed to update product composition', 500);
  }
}

/**
 * DELETE /api/product-compositions/[id] - Delete specific composition
 */
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Check if composition exists
    const { data: existing, error: fetchError } = await supabase
      .from('tokoflow_product_compositions')
      .select('parent_sku, component_sku')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return errorResponse('Product composition not found', 404);
      }
      return handleSupabaseError(fetchError);
    }

    const { error } = await supabase
      .from('tokoflow_product_compositions')
      .delete()
      .eq('id', id);

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse({ 
      message: 'Product composition deleted successfully',
      deleted_composition: {
        parent_sku: existing.parent_sku,
        component_sku: existing.component_sku
      }
    });
  } catch (error) {
    console.error('Error deleting product composition:', error);
    return errorResponse('Failed to delete product composition', 500);
  }
}
