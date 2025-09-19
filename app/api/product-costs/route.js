// app/api/product-costs/route.js
import { createClient } from '../../../lib/database/supabase-server';
import { successResponse, errorResponse, handleSupabaseError } from '../../../lib/utils/api-response';

/**
 * GET /api/product-costs - Get all product costs
 * Mirrors HargaModal sheet
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const sku = searchParams.get('sku');

    let query = supabase
      .from('tf_product_costs')
      .select(`
        *,
        product:tf_products!tf_product_costs_sku_fkey(
          name,
          stock
        )
      `)
      .order('sku');

    if (sku) {
      query = query.eq('sku', sku);
    }

    const { data, error } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data);
  } catch (error) {
    console.error('Error fetching product costs:', error);
    return errorResponse('Failed to fetch product costs', 500);
  }
}

/**
 * POST /api/product-costs - Create or update product cost
 * Uses upsert to handle both create and update
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    if (!body.sku) {
      return errorResponse('SKU is required');
    }

    // Get product ID if not provided
    let productId = body.product_id;
    
    if (!productId) {
      const { data: product, error: productError } = await supabase
        .from('tf_products')
        .select('id')
        .eq('sku', body.sku)
        .single();

      if (productError || !product) {
        return errorResponse('Product not found with given SKU', 404);
      }
      
      productId = product.id;
    }

    // Upsert cost data
    const { data, error } = await supabase
      .from('tf_product_costs')
      .upsert({
        product_id: productId,
        sku: body.sku,
        modal_cost: body.modal_cost || 0,
        packing_cost: body.packing_cost || 0,
        affiliate_percentage: body.affiliate_percentage || 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'sku'
      })
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data, 201);
  } catch (error) {
    console.error('Error creating/updating product cost:', error);
    return errorResponse('Failed to save product cost', 500);
  }
}

/**
 * PUT /api/product-costs - Batch update product costs
 */
export async function PUT(request) {
  try {
    const supabase = await createClient();
    const { costs } = await request.json();

    if (!Array.isArray(costs)) {
      return errorResponse('Costs must be an array');
    }

    const results = [];
    
    for (const cost of costs) {
      if (!cost.sku) continue;

      // Get product ID
      const { data: product } = await supabase
        .from('tf_products')
        .select('id')
        .eq('sku', cost.sku)
        .single();

      if (!product) {
        results.push({
          sku: cost.sku,
          success: false,
          error: 'Product not found'
        });
        continue;
      }

      // Upsert cost
      const { error } = await supabase
        .from('tf_product_costs')
        .upsert({
          product_id: product.id,
          sku: cost.sku,
          modal_cost: cost.modal_cost || 0,
          packing_cost: cost.packing_cost || 0,
          affiliate_percentage: cost.affiliate_percentage || 0,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'sku'
        });

      results.push({
        sku: cost.sku,
        success: !error,
        error: error?.message
      });
    }

    return successResponse({ results });
  } catch (error) {
    console.error('Error batch updating product costs:', error);
    return errorResponse('Failed to update product costs', 500);
  }
}

/**
 * DELETE /api/product-costs/[sku] - Delete product cost
 */
export async function DELETE(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku');

    if (!sku) {
      return errorResponse('SKU is required');
    }

    const { error } = await supabase
      .from('tf_product_costs')
      .delete()
      .eq('sku', sku);

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse({ message: 'Product cost deleted successfully' });
  } catch (error) {
    console.error('Error deleting product cost:', error);
    return errorResponse('Failed to delete product cost', 500);
  }
}
