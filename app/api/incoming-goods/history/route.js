// app/api/incoming-goods/history/route.js
import { createClient } from '../../../../lib/database/supabase-server/index.js';
import { successResponse, errorResponse, handleSupabaseError } from '../../../../lib/utils/api-response';
import { getIncomingGoodsHistory } from '../../../../lib/services/incoming-goods';

/**
 * GET /api/incoming-goods/history - Get incoming goods history
 * Mirrors BarangMasuk sheet
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const sku = searchParams.get('sku');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const options = {
      startDate,
      endDate,
      sku,
      limit,
      offset
    };

    const result = await getIncomingGoodsHistory(options, supabase);
    
    if (!result.success) {
      return errorResponse(result.error);
    }

    return successResponse(result);
  } catch (error) {
    console.error('Error fetching incoming goods history:', error);
    return errorResponse('Failed to fetch incoming goods history', 500);
  }
}
