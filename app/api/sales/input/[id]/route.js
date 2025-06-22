// app/api/sales/input/[id]/route.js
import { createClient } from '@/lib/database/supabase-server';
import { successResponse, errorResponse, handleSupabaseError } from '@/lib/utils/api-response';

/**
 * DELETE /api/sales/input/[id] - Delete a single sales input record
 */
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    if (!id) {
      return errorResponse('ID is required');
    }

    // Only allow deleting pending records
    const { error } = await supabase
      .from('tokoflow_sales_input')
      .delete()
      .eq('id', id)
      .eq('status', 'pending');

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse({ 
      message: 'Sales input deleted successfully',
      id 
    });
  } catch (error) {
    console.error('Error deleting sales input:', error);
    return errorResponse('Failed to delete sales input', 500);
  }
}
