// lib/services/composition.js
import { updateInventory } from './inventory';

/**
 * Update inventory for product compositions - mirrors updateKomposisiInventori
 * Handles bundle/package products that consist of multiple components
 * @param {string} parentSku - Parent product SKU
 * @param {number} quantity - Quantity of parent product
 * @param {string} channel - Sales channel
 * @param {object} supabase - Supabase client instance (required)
 */
export async function updateCompositionInventory(
  parentSku, 
  quantity, 
  channel, 
  supabase
) {
  if (!supabase) {
    throw new Error('Supabase client is required');
  }
  
  try {
    // Get all active compositions for this parent SKU
    const { data: compositions, error } = await supabase
      .from('tokoflow_product_compositions')
      .select('*')
      .eq('parent_sku', parentSku)
      .eq('status', 'aktif');

    if (error) throw error;

    if (!compositions || compositions.length === 0) {
      // No compositions found, nothing to update
      return { success: true, message: 'No active compositions found' };
    }

    const updates = [];
    
    // Process each composition
    for (const composition of compositions) {
      // Check if composition applies to this channel
      const sourceChannel = (composition.source_channel || '').toLowerCase();
      const currentChannel = (channel || '').toLowerCase();
      
      if (sourceChannel === 'semua' || sourceChannel === currentChannel) {
        // Calculate quantity to deduct
        const componentQuantity = composition.quantity * quantity;
        
        // Add to updates
        updates.push({
          sku: composition.component_sku,
          quantityChange: -componentQuantity,
          composition
        });
      }
    }

    // Apply all inventory updates
    const results = [];
    for (const update of updates) {
      const result = await updateInventory(
        update.sku, 
        update.quantityChange,
        supabase
      );
      
      results.push({
        ...result,
        composition: update.composition
      });
    }

    return {
      success: true,
      componentsUpdated: updates.length,
      results
    };
  } catch (error) {
    console.error('Error updating composition inventory:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all compositions for a product
 * @param {string} parentSku - Parent product SKU
 * @param {object} supabase - Supabase client instance (required)
 */
export async function getProductCompositions(parentSku, supabase) {
  if (!supabase) {
    throw new Error('Supabase client is required');
  }
  
  try {
    const { data, error } = await supabase
      .from('tokoflow_product_compositions')
      .select(`
        *,
        component:tokoflow_products!tokoflow_product_compositions_component_sku_fkey(
          sku,
          name,
          stock
        )
      `)
      .eq('parent_sku', parentSku)
      .eq('status', 'aktif');

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching compositions:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Validate if components are available for a bundle product
 * Optional check - original system allows negative stock
 * @param {string} parentSku - Parent product SKU
 * @param {number} requestedQuantity - Quantity requested
 * @param {string} channel - Sales channel
 * @param {object} supabase - Supabase client instance (required)
 */
export async function validateCompositionStock(
  parentSku, 
  requestedQuantity, 
  channel,
  supabase
) {
  if (!supabase) {
    throw new Error('Supabase client is required');
  }
  
  try {
    // Get compositions
    const { data: compositions, error } = await supabase
      .from('tokoflow_product_compositions')
      .select(`
        *,
        component:tokoflow_products!tokoflow_product_compositions_component_sku_fkey(
          sku,
          name,
          stock
        )
      `)
      .eq('parent_sku', parentSku)
      .eq('status', 'aktif');

    if (error) throw error;

    const validationResults = [];
    let allAvailable = true;

    for (const composition of compositions) {
      const sourceChannel = (composition.source_channel || '').toLowerCase();
      const currentChannel = (channel || '').toLowerCase();
      
      if (sourceChannel === 'semua' || sourceChannel === currentChannel) {
        const requiredQuantity = composition.quantity * requestedQuantity;
        const currentStock = composition.component?.stock || 0;
        const available = currentStock >= requiredQuantity;
        
        if (!available) allAvailable = false;
        
        validationResults.push({
          componentSku: composition.component_sku,
          componentName: composition.component?.name,
          requiredQuantity,
          currentStock,
          available,
          shortage: available ? 0 : requiredQuantity - currentStock
        });
      }
    }

    return {
      success: true,
      allAvailable,
      validationResults
    };
  } catch (error) {
    console.error('Error validating composition stock:', error);
    return { success: false, error: error.message };
  }
}
