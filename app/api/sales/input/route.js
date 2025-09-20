// app/api/sales/input/route.js
import { createClient } from '../../../../lib/database/supabase-server/index.js';
import { successResponse, errorResponse, handleSupabaseError } from '../../../../lib/utils/api-response';
import { authenticateRequest } from '../../../../lib/utils/auth-helpers.js';

/**
 * GET /api/sales/input - Get all sales input records
 * Mirrors DashboardInput sheet view
 */
export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status'); // 'ok', 'pending', 'processed'
    const hasQuantity = searchParams.get('has_quantity'); // 'true', 'false'

    let query = supabase
      .from('tf_sales_input')
      .select('*')
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
    console.error('Error fetching sales input:', error);
    return errorResponse('Failed to fetch sales input', 500);
  }
}

/**
 * POST /api/sales/input - Create new sales input record
 * Equivalent to adding row in DashboardInput
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
    const user = auth.user;

    // Validate required fields
    const required = ['transaction_date', 'sku', 'product_name', 'selling_price', 'channel'];
    for (const field of required) {
      if (!body[field]) {
        return errorResponse(`${field} is required`);
      }
    }

    // Create input record
    const { data, error } = await supabase
      .from('tf_sales_input')
      .insert({
        transaction_date: body.transaction_date,
        sku: body.sku,
        product_name: body.product_name,
        selling_price: body.selling_price,
        quantity: body.quantity || null,
        channel: body.channel,
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
    console.error('Error creating sales input:', error);
    return errorResponse('Failed to create sales input', 500);
  }
}

/**
 * PATCH /api/sales/input - Batch update sales input records
 * For updating status to 'ok' before processing
 */
export async function PATCH(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }

    const supabase = await createClient();
    const { ids, updates } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse('IDs array is required');
    }

    const { error } = await supabase
      .from('tf_sales_input')
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
    console.error('Error updating sales input:', error);
    return errorResponse('Failed to update sales input', 500);
  }
}

/**
 * DELETE /api/sales/input - Delete sales input records
 */
export async function DELETE(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids')?.split(',');

    if (!ids || ids.length === 0) {
      return errorResponse('IDs are required');
    }

    const { error } = await supabase
      .from('tf_sales_input')
      .delete()
      .in('id', ids)
      .eq('status', 'pending'); // Only allow deleting pending records

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse({ 
      message: `Deleted ${ids.length} records`,
      ids 
    });
  } catch (error) {
    console.error('Error deleting sales input:', error);
    return errorResponse('Failed to delete sales input', 500);
  }
}
