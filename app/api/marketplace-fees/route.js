// app/api/marketplace-fees/route.js
import { createClient } from '../../../lib/database/supabase-server';
import { successResponse, errorResponse, handleSupabaseError } from '../../../lib/utils/api-response';

/**
 * GET /api/marketplace-fees - Get all marketplace fees
 * Mirrors FeeMarketplace sheet
 */
export async function GET(request) {
  try {
    console.log('GET /api/marketplace-fees called');
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth check - user:', !!user, 'error:', authError?.message);
    
    const { data, error } = await supabase
      .from('tf_marketplace_fees')
      .select('*')
      .order('channel');

    console.log('Database query - data count:', data?.length, 'error:', error?.message);

    if (error) {
      console.error('Supabase error in GET marketplace fees:', error);
      return handleSupabaseError(error);
    }

    // Ensure fee_percentage is returned as a number
    const formattedData = (data || []).map(fee => ({
      ...fee,
      fee_percentage: parseFloat(fee.fee_percentage) || 0
    }));

    console.log('Returning formatted data:', formattedData.length, 'items');
    return successResponse(formattedData);
  } catch (error) {
    console.error('Error fetching marketplace fees:', error);
    return errorResponse('Failed to fetch marketplace fees', 500);
  }
}

/**
 * POST /api/marketplace-fees - Create new marketplace fee
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    if (!body.channel) {
      return errorResponse('Channel is required');
    }

    // Normalize channel name to lowercase for consistency
    const normalizedChannel = body.channel.toLowerCase();

    const { data, error } = await supabase
      .from('tf_marketplace_fees')
      .insert({
        channel: normalizedChannel,
        fee_percentage: body.fee_percentage || 0
      })
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data, 201);
  } catch (error) {
    console.error('Error creating marketplace fee:', error);
    return errorResponse('Failed to create marketplace fee', 500);
  }
}

/**
 * PUT /api/marketplace-fees - Batch update marketplace fees
 */
export async function PUT(request) {
  try {
    const supabase = await createClient();
    const { fees } = await request.json();

    if (!Array.isArray(fees)) {
      return errorResponse('Fees must be an array');
    }

    const results = [];
    
    for (const fee of fees) {
      if (!fee.channel) continue;

      const normalizedChannel = fee.channel.toLowerCase();
      
      // Try update first
      const { data, error } = await supabase
        .from('tf_marketplace_fees')
        .update({
          fee_percentage: fee.fee_percentage,
          updated_at: new Date().toISOString()
        })
        .eq('channel', normalizedChannel)
        .select()
        .single();

      if (error && error.code === 'PGRST116') {
        // Record doesn't exist, create it
        const { data: newData, error: insertError } = await supabase
          .from('tf_marketplace_fees')
          .insert({
            channel: normalizedChannel,
            fee_percentage: fee.fee_percentage || 0
          })
          .select()
          .single();

        results.push({
          channel: normalizedChannel,
          success: !insertError,
          action: 'created',
          error: insertError?.message
        });
      } else {
        results.push({
          channel: normalizedChannel,
          success: !error,
          action: 'updated',
          error: error?.message
        });
      }
    }

    return successResponse({ results });
  } catch (error) {
    console.error('Error updating marketplace fees:', error);
    return errorResponse('Failed to update marketplace fees', 500);
  }
}

/**
 * DELETE /api/marketplace-fees/[channel] - Delete marketplace fee
 */
export async function DELETE(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');

    if (!channel) {
      return errorResponse('Channel is required');
    }

    const normalizedChannel = channel.toLowerCase();

    // Check if used in any transactions
    const { data: transactions } = await supabase
      .from('tf_sales_transactions')
      .select('id')
      .eq('channel', normalizedChannel)
      .limit(1);

    if (transactions && transactions.length > 0) {
      return errorResponse('Cannot delete fee used in transactions', 400);
    }

    const { error } = await supabase
      .from('tf_marketplace_fees')
      .delete()
      .eq('channel', normalizedChannel);

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse({ message: 'Marketplace fee deleted successfully' });
  } catch (error) {
    console.error('Error deleting marketplace fee:', error);
    return errorResponse('Failed to delete marketplace fee', 500);
  }
}
