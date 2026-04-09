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

    const filter = searchParams.get('filter'); // 'negative' | 'zero' | 'low' | 'normal' | 'alert' | 'all'
    const search = searchParams.get('search');

    // Always project the columns we need for the dashboard's stock alerts.
    // The 'select' query param can override this for callers that want fewer fields.
    const defaultSelect = 'id,sku,name,stock,low_stock_threshold,stock_status,created_at,updated_at';
    const projection = (select && select !== '*') ? select : defaultSelect;

    let query = supabase
      .from('tf_products')
      .select(projection)
      .order('id', { ascending: true });

    // Filter by the generated stock_status column. 'alert' = anything that
    // needs the merchant's attention (negative + zero + low).
    if (filter === 'negative' || filter === 'zero' || filter === 'low' || filter === 'normal') {
      query = query.eq('stock_status', filter);
    } else if (filter === 'alert') {
      query = query.in('stock_status', ['negative', 'zero', 'low']);
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

    // Map the rows for the client. stockStatus mirrors the DB column for
    // backwards compatibility with existing UI consumers.
    const inventoryData = page.map(product => ({
      ...product,
      totalCostPerUnit: 0,        // costs come from /api/products view if needed
      inventoryValue: 0,
      stockStatus: product.stock_status,
      isComponent: false,
      isBundle: false,
    }));

    // Calculate summary statistics directly from stock_status
    const summary = inventoryData.reduce((acc, product) => ({
      totalProducts: acc.totalProducts + 1,
      totalStock: acc.totalStock + product.stock,
      totalValue: acc.totalValue + product.inventoryValue,
      negativeStock: acc.negativeStock + (product.stock_status === 'negative' ? 1 : 0),
      zeroStock:     acc.zeroStock     + (product.stock_status === 'zero'     ? 1 : 0),
      lowStock:      acc.lowStock      + (product.stock_status === 'low'      ? 1 : 0),
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
