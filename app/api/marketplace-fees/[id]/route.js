// app/api/marketplace-fees/[id]/route.js
import { createClient } from '@/lib/database/supabase-server';
import { successResponse, errorResponse, handleSupabaseError } from '@/lib/utils/api-response';

/**
 * GET /api/marketplace-fees/[id] - Get specific marketplace fee
 */
export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { data, error } = await supabase
      .from('tokoflow_marketplace_fees')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Marketplace fee not found', 404);
      }
      return handleSupabaseError(error);
    }

    return successResponse(data);
  } catch (error) {
    console.error('Error fetching marketplace fee:', error);
    return errorResponse('Failed to fetch marketplace fee', 500);
  }
}

/**
 * PUT /api/marketplace-fees/[id] - Update specific marketplace fee
 */
export async function PUT(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const body = await request.json();

    // Validate required fields
    if (!body.channel && body.fee_percentage === undefined) {
      return errorResponse('Channel or fee_percentage is required');
    }

    // Check if the fee exists
    const { data: existingFee, error: fetchError } = await supabase
      .from('tokoflow_marketplace_fees')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return errorResponse('Marketplace fee not found', 404);
      }
      return handleSupabaseError(fetchError);
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (body.channel) {
      updateData.channel = body.channel.toLowerCase();
    }

    if (body.fee_percentage !== undefined) {
      updateData.fee_percentage = body.fee_percentage;
    }

    // Update the fee
    const { data, error } = await supabase
      .from('tokoflow_marketplace_fees')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data);
  } catch (error) {
    console.error('Error updating marketplace fee:', error);
    return errorResponse('Failed to update marketplace fee', 500);
  }
}

/**
 * DELETE /api/marketplace-fees/[id] - Delete specific marketplace fee
 */
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Check if the fee exists and get its channel
    const { data: existingFee, error: fetchError } = await supabase
      .from('tokoflow_marketplace_fees')
      .select('channel')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return errorResponse('Marketplace fee not found', 404);
      }
      return handleSupabaseError(fetchError);
    }

    // Check if used in any transactions
    const { data: transactions } = await supabase
      .from('tokoflow_sales_transactions')
      .select('id')
      .eq('channel', existingFee.channel)
      .limit(1);

    if (transactions && transactions.length > 0) {
      return errorResponse('Cannot delete fee that is used in sales transactions', 400);
    }

    // Check if used in any sales input
    const { data: salesInput } = await supabase
      .from('tokoflow_sales_input')
      .select('id')
      .eq('channel', existingFee.channel)
      .limit(1);

    if (salesInput && salesInput.length > 0) {
      return errorResponse('Cannot delete fee that is used in sales input', 400);
    }

    // Delete the fee
    const { error } = await supabase
      .from('tokoflow_marketplace_fees')
      .delete()
      .eq('id', id);

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse({ 
      message: 'Marketplace fee deleted successfully',
      deleted_channel: existingFee.channel 
    });
  } catch (error) {
    console.error('Error deleting marketplace fee:', error);
    return errorResponse('Failed to delete marketplace fee', 500);
  }
}
