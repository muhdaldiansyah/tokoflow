// lib/services/incoming-goods.js
import { updateInventory } from './inventory';

/**
 * Process incoming goods - mirrors simpanDataBarangMasuk
 * @param {string} inputId - Incoming goods input ID
 * @param {string} userId - User ID
 * @param {object} supabase - Supabase client instance (required)
 */
export async function processIncomingGoods(inputId, userId, supabase) {
  if (!supabase) {
    throw new Error('Supabase client is required');
  }
  
  try {
    // Get input data
    const { data: inputData, error: fetchError } = await supabase
      .from('tokoflow_incoming_goods_input')
      .select('*')
      .eq('id', inputId)
      .eq('status', 'ok')
      .single();

    if (fetchError || !inputData) {
      return { success: false, error: 'Input not found or not ready for processing' };
    }

    // Validate quantity
    if (!inputData.quantity || inputData.quantity <= 0) {
      return { success: false, error: 'Invalid quantity' };
    }

    // Create incoming goods record
    const { data: record, error: recordError } = await supabase
      .from('tokoflow_incoming_goods')
      .insert({
        transaction_date: inputData.transaction_date,
        sku: inputData.sku,
        product_name: inputData.product_name,
        quantity: inputData.quantity,
        created_by: userId
      })
      .select()
      .single();

    if (recordError) throw recordError;

    // Update inventory - add stock
    const inventoryResult = await updateInventory(
      inputData.sku, 
      inputData.quantity, 
      supabase
    );
    
    if (!inventoryResult.success) {
      console.error('Failed to update inventory:', inventoryResult.error);
    }

    // Clear quantity and update status
    const { error: clearError } = await supabase
      .from('tokoflow_incoming_goods_input')
      .update({
        quantity: null,
        status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('id', inputId);

    if (clearError) {
      console.error('Failed to clear input quantity:', clearError);
    }

    return {
      success: true,
      data: {
        record,
        inventoryUpdate: inventoryResult
      }
    };
  } catch (error) {
    console.error('Error processing incoming goods:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Batch process all pending incoming goods
 * @param {string} userId - User ID
 * @param {object} supabase - Supabase client instance (required)
 */
export async function batchProcessIncomingGoods(userId, supabase) {
  if (!supabase) {
    throw new Error('Supabase client is required');
  }
  
  try {
    // Get all pending incoming goods with status='ok'
    const { data: pendingGoods, error: fetchError } = await supabase
      .from('tokoflow_incoming_goods_input')
      .select('*')
      .eq('status', 'ok')
      .not('quantity', 'is', null)
      .order('created_at', { ascending: true });

    if (fetchError) throw fetchError;

    if (!pendingGoods || pendingGoods.length === 0) {
      return { 
        success: true, 
        message: 'No pending incoming goods to process',
        processed: 0 
      };
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Process each incoming goods
    for (const goods of pendingGoods) {
      const result = await processIncomingGoods(goods.id, userId, supabase);
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
      
      results.push({
        id: goods.id,
        sku: goods.sku,
        ...result
      });
    }

    return {
      success: true,
      processed: pendingGoods.length,
      successCount,
      errorCount,
      results
    };
  } catch (error) {
    console.error('Error in batch process incoming goods:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get incoming goods history
 * @param {object} options - Query options
 * @param {object} supabase - Supabase client instance (required)
 */
export async function getIncomingGoodsHistory(options = {}, supabase) {
  if (!supabase) {
    throw new Error('Supabase client is required');
  }
  
  try {
    const { 
      startDate, 
      endDate, 
      sku, 
      limit = 50, 
      offset = 0 
    } = options;

    let query = supabase
      .from('tokoflow_incoming_goods')
      .select('*', { count: 'exact' })
      .order('transaction_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }
    if (sku) {
      query = query.eq('sku', sku);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return { 
      success: true, 
      data,
      count,
      hasMore: offset + limit < count
    };
  } catch (error) {
    console.error('Error getting incoming goods history:', error);
    return { success: false, error: error.message };
  }
}
