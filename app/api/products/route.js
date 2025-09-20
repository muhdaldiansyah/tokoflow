// app/api/products/route.js
import { authenticateRequest } from '../../../lib/utils/auth-helpers';
import { successResponse, errorResponse, handleSupabaseError, successResponseWithETag } from '../../../lib/utils/api-response';
import { parseQuery, buildNextLink } from '../../../lib/http/paging.js';
import { outputCache, clearPrefix } from '../../../lib/cache/index.js';
import { encodeCursor } from '../../../lib/http/cursor.js';
import { makeStateTag, bump } from '../../../lib/state/global-state.js';
import { withServerTiming } from '../../../lib/http/serverTiming.js';

export const runtime = 'nodejs';

export const preferredRegion = 'auto';

/**
 * HEAD /api/products - Zero-DB ultra-fast state validation
 * Returns only ETag for cache validation, no DB queries
 */
export async function HEAD(request) {
  try {
    // Simple auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(null, { status: 401 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search') ?? '';
    const stock = url.searchParams.get('stock') ?? '';
    const cursor = url.searchParams.get('cursor') ?? '';
    const limit = url.searchParams.get('limit') ?? '';
    const filterSig = `${search}:${stock}:${cursor}:${limit}`;
    const etag = makeStateTag('products', filterSig);

    const inm = request.headers.get('if-none-match');
    if (inm && inm === etag) {
      return new Response(null, { status: 304, headers: { etag } });
    }
    return new Response(null, {
      status: 204,
      headers: {
        etag,
        'cache-control': 'private, max-age=0, must-revalidate, stale-while-revalidate=5',
      },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}

/**
 * GET /api/products - Get all products with optional filters
 */
export async function GET(request) {
  const t0 = Date.now();

  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.ok) {
      return errorResponse(authResult.error, authResult.status || 401);
    }

    const { user, supabase } = authResult;
    const { url, limit, cursor, cursorComposite, select } = parseQuery(request, { maxLimit: 200, defaultLimit: 25 });
    const { searchParams } = new URL(request.url);

    // Optional filters
    const search = searchParams.get('search');
    const stockFilter = searchParams.get('stock'); // 'negative', 'zero', 'positive'

    // 1) Build a cheap "state tag" for this view
    const userId = user.id;
    const filterSig = `${search || ''}:${stockFilter || ''}:${cursor || ''}:${limit}`;

    // Get last update time + count from view (includes cost changes)
    let stateQuery = supabase.from('v_products_with_costs').select('updated_at');

    // Apply same filters for state tag calculation
    if (search) {
      stateQuery = stateQuery.textSearch('search_tsv', search, { type: 'websearch', config: 'public.simple_unaccent' });
    }
    if (stockFilter === 'negative') {
      stateQuery = stateQuery.lt('stock', 0);
    } else if (stockFilter === 'zero') {
      stateQuery = stateQuery.eq('stock', 0);
    } else if (stockFilter === 'positive') {
      stateQuery = stateQuery.gt('stock', 0);
    }

    const { data: latest } = await stateQuery
      .order('updated_at', { ascending: false })
      .limit(1);

    let countQuery = supabase.from('v_products_with_costs').select('id', { count: 'exact', head: true });

    // Apply same filters for count
    if (search) {
      countQuery = countQuery.textSearch('search_tsv', search, { type: 'websearch', config: 'public.simple_unaccent' });
    }
    if (stockFilter === 'negative') {
      countQuery = countQuery.lt('stock', 0);
    } else if (stockFilter === 'zero') {
      countQuery = countQuery.eq('stock', 0);
    } else if (stockFilter === 'positive') {
      countQuery = countQuery.gt('stock', 0);
    }

    const { count } = await countQuery;

    // Get max cost update time to include in state tag
    const { data: maxCost } = await supabase
      .from('tf_product_costs')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1);

    const maxProductUpdated = latest?.[0]?.updated_at || '1970-01-01T00:00:00.000Z';
    const maxCostUpdated = maxCost?.[0]?.updated_at || '1970-01-01T00:00:00.000Z';
    const maxUpdated = new Date(Math.max(new Date(maxProductUpdated), new Date(maxCostUpdated))).toISOString();

    // Stable tag for this query scope (includes cost changes)
    const stateTag = `W/"p:${userId}:${count ?? 0}:${maxUpdated}:${filterSig}"`;

    // --- EARLY VALIDATION (unchanged) ---
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch && ifNoneMatch === stateTag) {
      // true 304: no JSON, no heavy query, sub-50ms
      const ms = Date.now() - t0;
      console.log(`[perf] /api/products ${ms}ms 304=true hit=false`);
      return new Response(null, {
        status: 304,
        headers: {
          etag: stateTag,
          'cache-control': 'private, max-age=0, must-revalidate',
        },
      });
    }

    // --- NEW: OUTPUT MICRO-CACHE (per-process) ---
    const cacheKey = stateTag; // includes user + filter signature
    const cached = outputCache.get(cacheKey);
    if (cached) {
      // fast 200 with body from memory, still sends strong ETag
      const ms = Date.now() - t0;
      console.log(`[perf] /api/products ${ms}ms 304=false hit=true`);
      return successResponseWithETag(request, cached.payload, {
        etag: stateTag,
        link: cached.link,
      });
    }

    // HEAVY query path: use view for single-query access to products with costs
    const defaultSelect = 'id,sku,name,stock,created_at,updated_at,modal_cost,packing_cost,affiliate_percentage';
    const viewSelect = select === '*' ? defaultSelect : select;

    let query = supabase
      .from('v_products_with_costs')
      .select(viewSelect) // use field projection for smaller payloads
      .order('updated_at', { ascending: false })
      .order('id', { ascending: true });

    if (search) {
      query = query.textSearch('search_tsv', search, { type: 'websearch', config: 'public.simple_unaccent' });
    }

    if (stockFilter === 'negative') query = query.lt('stock', 0);
    else if (stockFilter === 'zero') query = query.eq('stock', 0);
    else if (stockFilter === 'positive') query = query.gt('stock', 0);

    if (cursorComposite?.updated_at && cursorComposite?.id) {
      // WHERE (updated_at, id) < (cursorUpdatedAt, cursorId)
      // PostgREST lacks tuple compare; emulate:
      query = query.or(
        `and(updated_at.lt.${cursorComposite.updated_at}),and(updated_at.eq.${cursorComposite.updated_at},id.gt.${cursorComposite.id})`
      );
    }
    query = query.limit(limit + 1);

    const { data: rows, error } = await query;
    if (error) return handleSupabaseError(error);

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = hasMore ? page[page.length - 1] : page[page.length - 1];
    const nextCursor = last ? { updated_at: last.updated_at, id: last.id } : null;

    // View already includes costs - no additional query needed
    const payload = {
      products: page.map(p => ({
        ...p,
        modal_cost: p.modal_cost || 0,
        packing_cost: p.packing_cost || 0,
        affiliate_percentage: p.affiliate_percentage || 0,
      })),
      pagination: {
        hasMore,
        nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
        total: page.length,
      },
    };

    const link = buildNextLink(url, nextCursor);
    outputCache.set(stateTag, { payload, link });

    const ms = Date.now() - t0;
    console.log(`[perf] /api/products ${ms}ms 304=false hit=false`);

    return successResponseWithETag(request, payload, {
      etag: stateTag,
      link,
      extraHeaders: { 'server-timing': withServerTiming(t0) }
    });
  } catch (error) {
    console.error('[products] GET error', error);
    return errorResponse('Failed to fetch products', 500);
  }
}

/**
 * POST /api/products - Create a new product
 */
export async function POST(request) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof Response) {
      return authResult; // Return error response if auth failed
    }

    const { user, supabase } = authResult;
    const body = await request.json();

    // Validate required fields
    if (!body.sku || !body.name) {
      return errorResponse('SKU and name are required');
    }

    // Start transaction - create product and cost record
    const { data: product, error: productError } = await supabase
      .from('tf_products')
      .insert({
        sku: body.sku,
        name: body.name,
        stock: body.stock || 0
      })
      .select()
      .single();

    if (productError) {
      return handleSupabaseError(productError);
    }

    // Create cost record if provided
    if (body.modal_cost !== undefined || body.packing_cost !== undefined || body.affiliate_percentage !== undefined) {
      const { error: costError } = await supabase
        .from('tf_product_costs')
        .insert({
          product_id: product.id,
          sku: body.sku,
          modal_cost: body.modal_cost || 0,
          packing_cost: body.packing_cost || 0,
          affiliate_percentage: body.affiliate_percentage || 0
        });

      if (costError) {
        // Rollback by deleting the product
        await supabase.from('tf_products').delete().eq('id', product.id);
        return handleSupabaseError(costError);
      }
    }

    // Clear cache and bump state after mutation
    clearPrefix(`p:${user.id}`);
    bump('products');

    // Return the created product
    return successResponse(product, 201);
  } catch (error) {
    console.error('Error creating product:', error);
    return errorResponse('Failed to create product', 500);
  }
}

/**
 * PUT /api/products - Update multiple products (batch update)
 */
export async function PUT(request) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.ok) return errorResponse(authResult.error, authResult.status || 401);
    const { supabase } = authResult;
    const { updates } = await request.json();
    if (!Array.isArray(updates)) return errorResponse('Updates must be an array', 400);

    const rows = updates
      .filter(u => u && u.sku)
      .map(u => ({
        sku: u.sku,
        name: u.name,
        stock: u.stock,
        updated_at: new Date().toISOString(),
      }));
    if (!rows.length) return successResponse({ updated: 0 });

    const { data, error } = await supabase
      .from('tf_products')
      .upsert(rows, { onConflict: 'sku' })
      .select('sku');
    if (error) return handleSupabaseError(error);

    // Clear cache and bump state after mutation
    const { user } = authResult;
    clearPrefix(`p:${user.id}`);
    bump('products');

    return successResponse({ updated: data?.length || 0 });
  } catch (e) {
    console.error('Error updating products:', e);
    return errorResponse('Failed to update products', 500);
  }
}

/**
 * PATCH /api/products - This should not be called directly
 * Individual product updates should use /api/products/[sku]
 */
export async function PATCH(request) {
  console.error('PATCH /api/products called - should use /api/products/[sku] instead');
  return errorResponse('Use PATCH /api/products/[sku] for individual product updates', 405);
}
