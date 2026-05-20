// lib/services/inventory.js

/**
 * Update product inventory - mirrors updateInventori from Apps Script
 * Allows negative stock as per original system
 * @param {string} sku - Product SKU
 * @param {number} quantityChange - Quantity to add (positive) or subtract (negative)
 * @param {object} supabase - Supabase client instance (required)
 */
export async function updateInventory(sku, quantityChange, supabase) {
  if (!supabase) {
    throw new Error('Supabase client is required');
  }
  
  try {
    // Get current stock
    const { data: product, error: fetchError } = await supabase
      .from('tf_products')
      .select('id, stock')
      .eq('sku', sku)
      .single();

    if (fetchError || !product) {
      console.warn(`SKU ${sku} not found in inventory`);
      return { success: false, error: `SKU ${sku} not found` };
    }

    // Calculate new stock (allow negative as per original system)
    const newStock = (product.stock || 0) + quantityChange;
    
    // Update stock
    const { error: updateError } = await supabase
      .from('tf_products')
      .update({ 
        stock: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id);

    if (updateError) {
      throw updateError;
    }

    // Log warning if stock becomes negative (matching original behavior)
    if (newStock < 0) {
      console.warn(`Stock negatif: ${sku} - stok: ${newStock}`);
    }

    return { 
      success: true, 
      data: { 
        sku, 
        previousStock: product.stock, 
        newStock,
        quantityChange 
      } 
    };
  } catch (error) {
    console.error('Error updating inventory:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Batch update inventory for multiple SKUs
 * Performance optimization over original single updates
 * @param {object} updates - Object with SKU as key and quantity change as value
 * @param {object} supabase - Supabase client instance (required)
 */
export async function batchUpdateInventory(updates, supabase) {
  if (!supabase) {
    throw new Error('Supabase client is required');
  }
  
  const results = [];
  
  try {
    // Get all affected products
    const skus = Object.keys(updates);
    const { data: products, error: fetchError } = await supabase
      .from('tf_products')
      .select('id, sku, stock')
      .in('sku', skus);

    if (fetchError) throw fetchError;

    // Create a map for quick lookup
    const productMap = new Map(products.map(p => [p.sku, p]));
    
    // Prepare batch updates
    const updatePromises = [];
    
    for (const [sku, quantityChange] of Object.entries(updates)) {
      const product = productMap.get(sku);
      
      if (!product) {
        console.warn(`SKU ${sku} not found in inventory`);
        results.push({ sku, success: false, error: 'SKU not found' });
        continue;
      }

      const newStock = (product.stock || 0) + quantityChange;
      
      // Log warning for negative stock
      if (newStock < 0) {
        console.warn(`Stock negatif: ${sku} - stok: ${newStock}`);
      }

      updatePromises.push(
        supabase
          .from('tf_products')
          .update({ 
            stock: newStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)
          .then(() => {
            results.push({
              sku,
              success: true,
              previousStock: product.stock,
              newStock,
              quantityChange
            });
          })
          .catch(error => {
            results.push({
              sku,
              success: false,
              error: error.message
            });
          })
      );
    }

    await Promise.all(updatePromises);
    
    return { success: true, results };
  } catch (error) {
    console.error('Error in batch inventory update:', error);
    return { success: false, error: error.message, results };
  }
}

/**
 * Check if stock is available (optional feature, not in original)
 * Original system allows negative stock, so this is optional
 * @param {string} sku - Product SKU
 * @param {number} requestedQuantity - Quantity requested
 * @param {object} supabase - Supabase client instance (required)
 */
export async function checkStockAvailability(sku, requestedQuantity, supabase) {
  if (!supabase) {
    throw new Error('Supabase client is required');
  }
  
  try {
    const { data: product, error } = await supabase
      .from('tf_products')
      .select('stock')
      .eq('sku', sku)
      .single();

    if (error || !product) {
      return { available: false, error: `SKU ${sku} not found` };
    }

    const currentStock = product.stock || 0;
    const available = currentStock >= requestedQuantity;

    return {
      available,
      currentStock,
      requestedQuantity,
      shortage: available ? 0 : requestedQuantity - currentStock
    };
  } catch (error) {
    console.error('Error checking stock:', error);
    return { available: false, error: error.message };
  }
}
