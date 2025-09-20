// app/api/incoming-goods/history/route.js
import { createClient } from '../../../../lib/database/supabase-server/index.js';
import { successResponse, errorResponse, handleSupabaseError } from '../../../../lib/utils/api-response';
import { getIncomingGoodsHistory } from '../../../../lib/services/incoming-goods';
import { authenticateRequest } from '../../../../lib/utils/auth-helpers.js';
import { makeETag, maybeNotModified } from '../../../../lib/http/jsonETag.js';

export const runtime = 'nodejs';

/**
 * GET /api/incoming-goods/history - Get incoming goods history
 * Mirrors BarangMasuk sheet
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

    // ETag implementation
    const body = JSON.stringify({ success: true, data: result });
    const etag = makeETag(body);

    if (maybeNotModified(request, etag)) {
      return new Response(null, {
        status: 304,
        headers: { etag }
      });
    }

    return new Response(body, {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'private, max-age=0, must-revalidate',
        etag
      }
    });
  } catch (error) {
    console.error('Error fetching incoming goods history:', error);
    return errorResponse('Failed to fetch incoming goods history', 500);
  }
}
