// app/api/inventory/route.js
import { createClient } from '../../../lib/database/supabase-server/index.js';
import { successResponse, errorResponse, handleSupabaseError } from '../../../lib/utils/api-response';
import { batchUpdateInventory, checkStockAvailability } from '../../../lib/services/inventory';

/**
 * GET /api/inventory - Get inventory status
 * Provides current stock levels and alerts
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const filter = searchParams.get('filter'); // 'negative', 'zero', 'low', 'all'
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('tf_products')
      .select('*', { count: 'exact' });

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

    // Apply pagination
    query = query
      .order('stock')
      .order('sku')
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    // Calculate inventory value for each product
    const inventoryData = data.map(product => {
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

    return successResponse({
      inventory: inventoryData,
      summary,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < count
      }
    });
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

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
