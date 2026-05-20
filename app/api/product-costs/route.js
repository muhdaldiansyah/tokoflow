// app/api/product-costs/route.js
import { createClient } from '../../../lib/database/supabase-server/index.js';
import { successResponse, errorResponse, handleSupabaseError, successResponseWithETag } from '../../../lib/utils/api-response';
import { authenticateRequest } from '../../../lib/utils/auth-helpers.js';
import { requireOwner } from '../../../lib/auth/role.js';
import { outputCache, clearPrefix } from '../../../lib/cache/index.js';
import { bump } from '../../../lib/state/global-state.js';

export const runtime = 'nodejs';

/**
 * HEAD /api/product-costs - Ultra-fast state validation
 * Returns only ETag for cache validation, no payload
 */
export async function HEAD(request) {
  try {
    // Simple auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(null, { status: 401 });
    }

    const url = new URL(request.url);
    const sku = url.searchParams.get('sku') ?? '';

    // Build lightweight state tag (timestamp-based for demo)
    const timeBucket = Math.floor(Date.now() / 15000); // Changes every 15 seconds
    const state = `pc:${sku || 'all'}`;
    const etag = `W/"${state}:${timeBucket}"`;

    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new Response(null, { status: 304, headers: { etag } });
    }

    return new Response(null, {
      status: 204,
      headers: {
        etag,
        'cache-control': 'private, max-age=0, must-revalidate, stale-while-revalidate=5',
      },
    });
  } catch (error) {
    console.error('[product-costs] HEAD error', error);
    return new Response(null, { status: 500 });
  }
}

/**
 * GET /api/product-costs - Get all product costs
 * Mirrors HargaModal sheet
 */
export async function GET(request) {
  const t0 = Date.now();

  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const sku = searchParams.get('sku');
    const userId = auth.user.id;

    // 1) Build a cheap "state tag" for this view
    // Get last update time + count for product costs
    let stateQuery = supabase.from('tf_product_costs').select('updated_at');
    if (sku) {
      stateQuery = stateQuery.eq('sku', sku);
    }

    const { data: latest } = await stateQuery
      .order('updated_at', { ascending: false })
      .limit(1);

    let countQuery = supabase.from('tf_product_costs').select('id', { count: 'exact', head: true });
    if (sku) {
      countQuery = countQuery.eq('sku', sku);
    }

    const { count } = await countQuery;

    // Stable tag for this query scope
    const stateTag = `W/"pc:${userId}:${count ?? 0}:${latest?.[0]?.updated_at ?? 0}:${sku || 'all'}"`;

    // --- EARLY VALIDATION ---
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch && ifNoneMatch === stateTag) {
      // true 304: no JSON, no heavy query, sub-50ms
      const ms = Date.now() - t0;
      console.log(`[perf] /api/product-costs ${ms}ms 304=true hit=false`);
      return new Response(null, {
        status: 304,
        headers: {
          etag: stateTag,
          'cache-control': 'private, max-age=0, must-revalidate',
        },
      });
    }

    // --- OUTPUT MICRO-CACHE (per-process) ---
    const cacheKey = stateTag; // includes user + sku signature
    const cached = outputCache.get(cacheKey);
    if (cached) {
      // fast 200 with body from memory, still sends strong ETag
      const ms = Date.now() - t0;
      console.log(`[perf] /api/product-costs ${ms}ms 304=false hit=true`);
      return successResponseWithETag(request, cached.payload, {
        etag: stateTag,
      });
    }

    // --- HEAVY QUERY PATH (only when data changed) ---
    console.log('⚡ Cache miss - executing heavy product-costs query');
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

    const payload = data;

    // fill micro-cache so parallel clicks/tabs are instant
    outputCache.set(cacheKey, { payload });

    const ms = Date.now() - t0;
    console.log(`[perf] /api/product-costs ${ms}ms 304=false hit=false`);

    return successResponseWithETag(request, payload, { etag: stateTag });
  } catch (error) {
    console.error('[product-costs] GET error', error);
    return errorResponse('Failed to fetch product costs', 500);
  }
}

/**
 * POST /api/product-costs - Create or update product cost
 * Uses upsert to handle both create and update
 */
export async function POST(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }
    const gate = await requireOwner(auth);
    if (!gate.ok) return gate.response;

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

    // Clear products cache and bump state after cost mutation
    clearPrefix(`p:${auth.user.id}`);
    bump('products');

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
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }
    const gate = await requireOwner(auth);
    if (!gate.ok) return gate.response;

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

    // Clear products cache and bump state after cost mutation
    clearPrefix(`p:${auth.user.id}`);
    bump('products');

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
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }
    const gate = await requireOwner(auth);
    if (!gate.ok) return gate.response;

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

    // Clear products cache and bump state after cost mutation
    clearPrefix(`p:${auth.user.id}`);
    bump('products');

    return successResponse({ message: 'Product cost deleted successfully' });
  } catch (error) {
    console.error('Error deleting product cost:', error);
    return errorResponse('Failed to delete product cost', 500);
  }
}
