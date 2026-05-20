// lib/services/sales.js
import { updateInventory } from './inventory';
import { updateCompositionInventory } from './composition';

/**
 * Process sales transactions - mirrors simpanDataPenjualan
 * Handles profit calculation, inventory updates, and composition processing
 * @param {string} inputId - Sales input ID
 * @param {string} userId - User ID
 * @param {object} supabase - Supabase client instance (required)
 */
export async function processSalesTransaction(inputId, userId, supabase) {
  if (!supabase) {
    throw new Error('Supabase client is required');
  }
  
  try {
    // Start transaction
    const { data: inputData, error: fetchError } = await supabase
      .from('tf_sales_input')
      .select('*')
      .eq('id', inputId)
      .eq('status', 'ok')
      .single();

    if (fetchError || !inputData) {
      return { success: false, error: 'Sales input not found or not ready for processing' };
    }

    // Validate required fields
    if (!inputData.quantity || inputData.quantity <= 0) {
      return { success: false, error: 'Invalid quantity' };
    }

    // Get product cost data - mirrors mapModal lookup
    const { data: costData, error: costError } = await supabase
      .from('tf_product_costs')
      .select('*')
      .eq('sku', inputData.sku)
      .single();

    if (costError) {
      console.warn(`Cost data not found for SKU: ${inputData.sku}`);
    }

    // Get marketplace fee - mirrors mapFee lookup
    const { data: feeData, error: feeError } = await supabase
      .from('tf_marketplace_fees')
      .select('fee_percentage')
      .eq('channel', inputData.channel.toLowerCase())
      .single();

    if (feeError) {
      console.warn(`Fee not found for channel: ${inputData.channel}`);
    }

    // Calculate financials - exact same logic as original
    const harga = Number(inputData.selling_price) || 0;
    const qty = Number(inputData.quantity) || 0;
    const omzet = harga * qty; // Revenue

    const modal = Number(costData?.modal_cost || 0);
    const packing = Number(costData?.packing_cost || 0);
    const affiliatePersen = Number(costData?.affiliate_percentage || 0);
    const feePersen = Number(feeData?.fee_percentage || 0);

    const biayaAffiliate = (affiliatePersen / 100) * omzet;
    const biayaFee = (feePersen / 100) * omzet;
    const totalModal = (modal + packing) * qty + biayaAffiliate;
    const profit = omzet - totalModal - biayaFee;

    // Create sales transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('tf_sales_transactions')
      .insert({
        transaction_date: inputData.transaction_date,
        sku: inputData.sku,
        product_name: inputData.product_name,
        selling_price: harga,
        quantity: qty,
        channel: inputData.channel,
        customer_id: inputData.customer_id ?? null,
        modal_cost: modal,
        packing_cost: packing,
        affiliate_cost: biayaAffiliate,
        marketplace_fee: biayaFee,
        revenue: omzet,
        net_profit: profit,
        created_by: userId
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Update inventory - mirrors updateInventori call
    const inventoryResult = await updateInventory(inputData.sku, -qty, supabase);
    
    if (!inventoryResult.success) {
      console.error('Failed to update inventory:', inventoryResult.error);
    }

    // Update composition inventory - mirrors updateKomposisiInventori call
    const compositionResult = await updateCompositionInventory(
      inputData.sku,
      qty,
      inputData.channel,
      supabase
    );

    if (!compositionResult.success) {
      console.error('Failed to update composition inventory:', compositionResult.error);
    }

    // Clear quantity and update status - mirrors sheetInput.getRange().setValue("")
    const { error: clearError } = await supabase
      .from('tf_sales_input')
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
        transaction,
        inventoryUpdate: inventoryResult,
        compositionUpdate: compositionResult
      }
    };
  } catch (error) {
    console.error('Error processing sales transaction:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Batch process all pending sales - mirrors the loop in simpanDataPenjualan
 * @param {string} userId - User ID
 * @param {object} supabase - Supabase client instance (required)
 */
export async function batchProcessSales(userId, supabase) {
  if (!supabase) {
    throw new Error('Supabase client is required');
  }
  
  try {
    // Get all pending sales with status='ok'
    const { data: pendingSales, error: fetchError } = await supabase
      .from('tf_sales_input')
      .select('*')
      .eq('status', 'ok')
      .not('quantity', 'is', null)
      .order('created_at', { ascending: true });

    if (fetchError) throw fetchError;

    if (!pendingSales || pendingSales.length === 0) {
      return { 
        success: true, 
        message: 'No pending sales to process',
        processed: 0 
      };
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Process each sale
    for (const sale of pendingSales) {
      const result = await processSalesTransaction(sale.id, userId, supabase);
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
      
      results.push({
        id: sale.id,
        sku: sale.sku,
        ...result
      });
    }

    return {
      success: true,
      processed: pendingSales.length,
      successCount,
      errorCount,
      results
    };
  } catch (error) {
    console.error('Error in batch process sales:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get sales summary by channel
 * @param {string} startDate - Start date (optional)
 * @param {string} endDate - End date (optional)
 * @param {object} supabase - Supabase client instance (required)
 */
export async function getSalesByChannel(startDate, endDate, supabase) {
  if (!supabase) {
    throw new Error('Supabase client is required');
  }
  
  try {
    let query = supabase
      .from('tf_sales_transactions')
      .select('channel, revenue, net_profit, quantity');

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Aggregate by channel
    const summary = data.reduce((acc, row) => {
      if (!acc[row.channel]) {
        acc[row.channel] = {
          channel: row.channel,
          transactions: 0,
          totalQuantity: 0,
          totalRevenue: 0,
          totalProfit: 0
        };
      }
      
      acc[row.channel].transactions++;
      acc[row.channel].totalQuantity += row.quantity;
      acc[row.channel].totalRevenue += Number(row.revenue);
      acc[row.channel].totalProfit += Number(row.net_profit);
      
      return acc;
    }, {});

    // Calculate margins
    Object.values(summary).forEach(channel => {
      channel.margin = channel.totalRevenue > 0 
        ? (channel.totalProfit / channel.totalRevenue * 100).toFixed(2)
        : 0;
    });

    return { success: true, data: Object.values(summary) };
  } catch (error) {
    console.error('Error getting sales by channel:', error);
    return { success: false, error: error.message };
  }
}
