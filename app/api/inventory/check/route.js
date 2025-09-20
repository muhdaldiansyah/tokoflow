// app/api/inventory/check/route.js
import { createClient } from '../../../../lib/database/supabase-server/index.js';
import { successResponse, errorResponse } from '../../../../lib/utils/api-response';
import { checkStockAvailability } from '../../../../lib/services/inventory';
import { authenticateRequest } from '../../../../lib/utils/auth-helpers.js';

/**
 * GET /api/inventory/check - Check stock availability
 * Useful before processing sales
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
    const sku = searchParams.get('sku');
    const quantity = parseInt(searchParams.get('quantity') || '0');

    if (!sku) {
      return errorResponse('SKU is required');
    }

    const result = await checkStockAvailability(sku, quantity, supabase);

    if (!result.available && result.error) {
      return errorResponse(result.error, 404);
    }

    return successResponse(result);
  } catch (error) {
    console.error('Error checking stock:', error);
    return errorResponse('Failed to check stock', 500);
  }
}
