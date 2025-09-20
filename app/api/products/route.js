// app/api/products/route.js
import { authenticateRequest } from '../../../lib/utils/auth-helpers';
import { successResponse, errorResponse, handleSupabaseError } from '../../../lib/utils/api-response';

/**
 * GET /api/products - Get all products with optional filters
 */
export async function GET(request) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof Response) {
      return authResult; // Return error response if auth failed
    }

    const { user, supabase } = authResult;
    const { searchParams } = new URL(request.url);
    
    // Optional filters
    const search = searchParams.get('search');
    const stockFilter = searchParams.get('stock'); // 'negative', 'zero', 'positive'
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('tf_products')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`sku.ilike.%${search}%,name.ilike.%${search}%`);
    }

    // Apply stock filter
    if (stockFilter === 'negative') {
      query = query.lt('stock', 0);
    } else if (stockFilter === 'zero') {
      query = query.eq('stock', 0);
    } else if (stockFilter === 'positive') {
      query = query.gt('stock', 0);
    }

    // Apply pagination
    query = query
      .order('sku')
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse({
      products: data,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < count
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
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
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof Response) {
      return authResult; // Return error response if auth failed
    }

    const { user, supabase } = authResult;
    const { updates } = await request.json();

    if (!Array.isArray(updates)) {
      return errorResponse('Updates must be an array');
    }

    const results = [];
    
    for (const update of updates) {
      if (!update.sku) continue;

      const { error } = await supabase
        .from('tf_products')
        .update({
          name: update.name,
          stock: update.stock,
          updated_at: new Date().toISOString()
        })
        .eq('sku', update.sku);

      results.push({
        sku: update.sku,
        success: !error,
        error: error?.message
      });
    }

    return successResponse({ results });
  } catch (error) {
    console.error('Error updating products:', error);
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
