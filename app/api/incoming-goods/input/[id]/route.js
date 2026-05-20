// app/api/incoming-goods/input/[id]/route.js
import { createClient } from '../../../../../lib/database/supabase-server/index.js';
import { successResponse, errorResponse, handleSupabaseError } from '../../../../../lib/utils/api-response';
import { authenticateRequest } from '../../../../../lib/utils/auth-helpers.js';

/**
 * DELETE /api/incoming-goods/input/[id] - Delete a single incoming goods input record
 */
export async function DELETE(request, { params }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }

    const supabase = await createClient();
    const { id } = await params;

    if (!id) {
      return errorResponse('ID is required');
    }

    // Only allow deleting pending records
    const { error } = await supabase
      .from('tf_incoming_goods_input')
      .delete()
      .eq('id', id)
      .eq('status', 'pending');

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse({ 
      message: 'Incoming goods input deleted successfully',
      id 
    });
  } catch (error) {
    console.error('Error deleting incoming goods input:', error);
    return errorResponse('Failed to delete incoming goods input', 500);
  }
}
