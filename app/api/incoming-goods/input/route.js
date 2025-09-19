// app/api/incoming-goods/input/route.js
import { createClient } from '../../../../lib/database/supabase-server';
import { successResponse, errorResponse, handleSupabaseError } from '../../../../lib/utils/api-response';

/**
 * GET /api/incoming-goods/input - Get incoming goods input records
 * Mirrors BarangMasukInput sheet
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const hasQuantity = searchParams.get('has_quantity');

    let query = supabase
      .from('tf_incoming_goods_input')
      .select(`
        *,
        product:tf_products!tf_incoming_goods_input_sku_fkey(
          name,
          stock
        )
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (hasQuantity === 'true') {
      query = query.not('quantity', 'is', null);
    } else if (hasQuantity === 'false') {
      query = query.is('quantity', null);
    }

    const { data, error } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data);
  } catch (error) {
    console.error('Error fetching incoming goods input:', error);
    return errorResponse('Failed to fetch incoming goods input', 500);
  }
}

/**
 * POST /api/incoming-goods/input - Create new incoming goods input
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    // Validate required fields
    const required = ['transaction_date', 'sku', 'product_name'];
    for (const field of required) {
      if (!body[field]) {
        return errorResponse(`${field} is required`);
      }
    }

    // Create input record
    const { data, error } = await supabase
      .from('tf_incoming_goods_input')
      .insert({
        transaction_date: body.transaction_date,
        sku: body.sku,
        product_name: body.product_name,
        quantity: body.quantity || null,
        status: body.status || 'pending',
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data, 201);
  } catch (error) {
    console.error('Error creating incoming goods input:', error);
    return errorResponse('Failed to create incoming goods input', 500);
  }
}

/**
 * PATCH /api/incoming-goods/input - Update incoming goods input
 */
export async function PATCH(request) {
  try {
    const supabase = await createClient();
    const { ids, updates } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse('IDs array is required');
    }

    const { error } = await supabase
      .from('tf_incoming_goods_input')
      .update(updates)
      .in('id', ids);

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse({ 
      message: `Updated ${ids.length} records`,
      ids 
    });
  } catch (error) {
    console.error('Error updating incoming goods input:', error);
    return errorResponse('Failed to update incoming goods input', 500);
  }
}

/**
 * DELETE /api/incoming-goods/input - Delete incoming goods input
 */
export async function DELETE(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids')?.split(',');

    if (!ids || ids.length === 0) {
      return errorResponse('IDs are required');
    }

    const { error } = await supabase
      .from('tf_incoming_goods_input')
      .delete()
      .in('id', ids)
      .eq('status', 'pending');

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse({ 
      message: `Deleted ${ids.length} records`,
      ids 
    });
  } catch (error) {
    console.error('Error deleting incoming goods input:', error);
    return errorResponse('Failed to delete incoming goods input', 500);
  }
}
