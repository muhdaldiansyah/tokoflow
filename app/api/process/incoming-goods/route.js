// app/api/process/incoming-goods/route.js
import { createClient } from '../../../../lib/database/supabase-server/index.js';
import { successResponse, errorResponse } from '../../../../lib/utils/api-response';
import { processIncomingGoods, batchProcessIncomingGoods } from '../../../../lib/services/incoming-goods';
import { authenticateRequest } from '../../../../lib/utils/auth-helpers.js';

/**
 * POST /api/process/incoming-goods - Process incoming goods
 * Mirrors simpanDataBarangMasuk() from Apps Script
 */
export async function POST(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
    const user = auth.user;

    const supabase = await createClient();

    const body = await request.json();
    
    // Process single record if ID provided
    if (body.id) {
      const result = await processIncomingGoods(body.id, user.id, supabase);
      
      if (!result.success) {
        return errorResponse(result.error);
      }
      
      return successResponse(result.data);
    }
    
    // Otherwise batch process all pending
    const result = await batchProcessIncomingGoods(user.id, supabase);
    
    if (!result.success) {
      return errorResponse(result.error);
    }

    return successResponse({
      message: `Processed ${result.successCount} incoming goods successfully`,
      ...result
    });
  } catch (error) {
    console.error('Error processing incoming goods:', error);
    return errorResponse('Failed to process incoming goods', 500);
  }
}

/**
 * GET /api/process/incoming-goods/preview - Preview what will be processed
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
    
    // Get all pending incoming goods with status='ok'
    const { data, error } = await supabase
      .from('tf_incoming_goods_input')
      .select(`
        *,
        product:tf_products!tf_incoming_goods_input_sku_fkey(
          name,
          stock
        )
      `)
      .eq('status', 'ok')
      .not('quantity', 'is', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Preview error:', error);
      return errorResponse('Failed to get preview');
    }

    // Calculate preview
    const preview = data.map(input => ({
      ...input,
      calculated: {
        currentStock: input.product?.stock || 0,
        newStock: (input.product?.stock || 0) + input.quantity
      }
    }));

    // Summary
    const summary = {
      totalItems: preview.length,
      totalQuantity: preview.reduce((sum, item) => sum + item.quantity, 0),
      uniqueProducts: new Set(preview.map(item => item.sku)).size
    };

    return successResponse({
      preview,
      summary
    });
  } catch (error) {
    console.error('Error getting preview:', error);
    return errorResponse('Failed to get preview', 500);
  }
}
