// app/api/inventory/route.js
import { createClient } from '../../../lib/database/supabase-server/index.js';
import { successResponse, errorResponse, handleSupabaseError } from '../../../lib/utils/api-response';
import { batchUpdateInventory, checkStockAvailability } from '../../../lib/services/inventory';
import { authenticateRequest } from '../../../lib/utils/auth-helpers.js';
import { makeETag, maybeNotModified } from '../../../lib/http/jsonETag.js';
import { parseQuery, buildNextLink } from '../../../lib/http/paging.js';

export const runtime = 'nodejs';

/**
 * GET /api/inventory - Get inventory status
 * Provides current stock levels and alerts
 */
export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }

    const supabase = await createClient();
    const { url, limit, cursor, select } = parseQuery(request, { maxLimit: 200, defaultLimit: 25 });
    const { searchParams } = new URL(request.url);

    const filter = searchParams.get('filter'); // 'negative', 'zero', 'low', 'all'
    const search = searchParams.get('search');

    let query = supabase
      .from('tf_products')
      .select(select)
      .order('id', { ascending: true });

    // Apply filters
    if (filter === 'negative') {
      query = query.lt('stock', 0);
    } else if (filter === 'zero') {
      query = query.eq('stock', 0);
    } else if (filter === 'low') {
      query = query.gte('stock', 0).lte('stock', 10);
    }

    if (search) {
      query = query.or(`sku.ilike.%${search}%,name.ilike.%${search}%`);
    }

    // Apply cursor pagination
    if (cursor) {
      query = query.gt('id', cursor);
    }
    query = query.limit(limit + 1);

    const { data, error } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    // Handle pagination
    const hasMore = data.length > limit;
    const page = hasMore ? data.slice(0, limit) : data;
    const nextCursor = hasMore ? page[page.length - 1]?.id : null;

    // Calculate inventory value for each product
    const inventoryData = page.map(product => {
      const totalCostPerUnit = 0; // Will be fetched separately if needed
      const inventoryValue = totalCostPerUnit * product.stock;

      return {
        ...product,
        totalCostPerUnit,
        inventoryValue,
        stockStatus: product.stock < 0 ? 'negative' :
                    product.stock === 0 ? 'zero' :
                    product.stock <= 10 ? 'low' : 'normal',
        isComponent: false,
        isBundle: false
      };
    });

    // Calculate summary statistics
    const summary = inventoryData.reduce((acc, product) => ({
      totalProducts: acc.totalProducts + 1,
      totalStock: acc.totalStock + product.stock,
      totalValue: acc.totalValue + product.inventoryValue,
      negativeStock: acc.negativeStock + (product.stock < 0 ? 1 : 0),
      zeroStock: acc.zeroStock + (product.stock === 0 ? 1 : 0),
      lowStock: acc.lowStock + (product.stock > 0 && product.stock <= 10 ? 1 : 0)
    }), {
      totalProducts: 0,
      totalStock: 0,
      totalValue: 0,
      negativeStock: 0,
      zeroStock: 0,
      lowStock: 0
    });

    const result = {
      inventory: inventoryData,
      summary
    };

    // ETag optimization
    const body = JSON.stringify(result);
    const etag = makeETag(body);
    if (maybeNotModified(request, etag)) {
      return new Response(null, { status: 304, headers: { etag } });
    }

    const response = new Response(body, {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'private, max-age=0, must-revalidate',
        etag
      }
    });

    const link = buildNextLink(url, nextCursor);
    if (link) {
      response.headers.set('link', `<${link}>; rel=\"next\"`);
    }

    return response;
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return errorResponse('Failed to fetch inventory', 500);
  }
}

/**
 * POST /api/inventory/adjust - Manual stock adjustment
 * For corrections, stock takes, etc.
 */
export async function POST(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
    const user = auth.user;

    const supabase = await createClient();

    const body = await request.json();

    // Validate input
    if (!body.adjustments || !Array.isArray(body.adjustments)) {
      return errorResponse('Adjustments array is required');
    }

    // Build update map
    const updateMap = {};
    for (const adjustment of body.adjustments) {
      if (!adjustment.sku || adjustment.quantity === undefined) {
        continue;
      }
      
      // If adjustment type is 'set', calculate the difference
      if (adjustment.type === 'set') {
        const { data: product } = await supabase
          .from('tf_products')
          .select('stock')
          .eq('sku', adjustment.sku)
          .single();
        
        if (product) {
          updateMap[adjustment.sku] = adjustment.quantity - product.stock;
        }
      } else {
        // Default to 'add' type
        updateMap[adjustment.sku] = adjustment.quantity;
      }
    }

    // Apply batch update - pass supabase client
    const result = await batchUpdateInventory(updateMap, supabase);

    if (!result.success) {
      return errorResponse(result.error);
    }

    // Log adjustment for audit trail
    if (body.reason) {
      console.log('Stock adjustment:', {
        user: user.id,
        reason: body.reason,
        adjustments: updateMap,
        timestamp: new Date().toISOString()
      });
    }

    return successResponse({
      message: 'Stock adjusted successfully',
      results: result.results
    });
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    return errorResponse('Failed to adjust inventory', 500);
  }
}
