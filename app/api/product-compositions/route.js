// app/api/product-compositions/route.js
import { createClient } from '../../../lib/database/supabase-server/index.js';
import { successResponse, errorResponse, handleSupabaseError } from '../../../lib/utils/api-response';
import { authenticateRequest } from '../../../lib/utils/auth-helpers.js';
import { makeETag, maybeNotModified } from '../../../lib/http/jsonETag.js';

export const runtime = 'nodejs';

/**
 * GET /api/product-compositions - Get product compositions
 * Mirrors KomposisiProduk sheet
 */
export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const parentSku = searchParams.get('parent_sku');
    const componentSku = searchParams.get('component_sku');
    const status = searchParams.get('status') || 'aktif';

    let query = supabase
      .from('tf_product_compositions')
      .select(`
        *,
        parent:tf_products!tf_product_compositions_parent_sku_fkey(
          sku,
          name,
          stock
        ),
        component:tf_products!tf_product_compositions_component_sku_fkey(
          sku,
          name,
          stock
        )
      `)
      .order('parent_sku')
      .order('component_sku');

    if (parentSku) {
      query = query.eq('parent_sku', parentSku);
    }
    if (componentSku) {
      query = query.eq('component_sku', componentSku);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    // ETag implementation
    const body = JSON.stringify({ success: true, data });
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
    console.error('Error fetching product compositions:', error);
    return errorResponse('Failed to fetch product compositions', 500);
  }
}

/**
 * POST /api/product-compositions - Create new composition
 */
export async function POST(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }

    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    if (!body.parent_sku || !body.component_sku) {
      return errorResponse('Parent SKU and Component SKU are required');
    }

    if (body.parent_sku === body.component_sku) {
      return errorResponse('Product cannot be its own component');
    }

    // Validate quantity
    const quantity = Number(body.quantity) || 1;
    if (quantity <= 0) {
      return errorResponse('Quantity must be greater than 0');
    }

    // Check if both products exist
    const { data: products, error: checkError } = await supabase
      .from('tf_products')
      .select('sku')
      .in('sku', [body.parent_sku, body.component_sku]);

    if (checkError || products.length !== 2) {
      return errorResponse('One or both products not found', 404);
    }

    // Check for duplicate composition
    const { data: existing } = await supabase
      .from('tf_product_compositions')
      .select('id')
      .eq('parent_sku', body.parent_sku)
      .eq('component_sku', body.component_sku)
      .eq('source_channel', body.source_channel || 'semua')
      .single();

    if (existing) {
      return errorResponse('This composition already exists', 409);
    }

    // Create composition
    const { data, error } = await supabase
      .from('tf_product_compositions')
      .insert({
        parent_sku: body.parent_sku,
        component_sku: body.component_sku,
        quantity: quantity,
        source_channel: body.source_channel || 'semua',
        status: body.status || 'aktif'
      })
      .select(`
        *,
        parent:tf_products!tf_product_compositions_parent_sku_fkey(
          sku,
          name
        ),
        component:tf_products!tf_product_compositions_component_sku_fkey(
          sku,
          name
        )
      `)
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data, 201);
  } catch (error) {
    console.error('Error creating product composition:', error);
    return errorResponse('Failed to create product composition', 500);
  }
}

/**
 * PATCH /api/product-compositions/[id] - Update composition
 */
export async function PATCH(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) {
      return errorResponse('Composition ID is required');
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
      .from('tf_product_compositions')
      .update(updates)
      .eq('id', id)
      .select()
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
 * DELETE /api/product-compositions/[id] - Delete composition
 */
export async function DELETE(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Composition ID is required');
    }

    const { error } = await supabase
      .from('tf_product_compositions')
      .delete()
      .eq('id', id);

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse({ message: 'Product composition deleted successfully' });
  } catch (error) {
    console.error('Error deleting product composition:', error);
    return errorResponse('Failed to delete product composition', 500);
  }
}
