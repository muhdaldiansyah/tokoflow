// Database helper functions for TokoFlow

import { createClient } from '@/lib/database/supabase/server';

/**
 * Get product costs by SKUs
 * @param {array} skus - Array of SKUs to fetch costs for
 * @returns {object} Map of SKU to costs
 */
export async function getProductCostsBySKUs(skus) {
  if (!skus || skus.length === 0) return {};
  
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('product_costs')
      .select('sku, modal_cost, packing_cost, affiliate_percentage')
      .in('sku', skus);
    
    if (error) {
      console.error('Error fetching product costs:', error);
      return {};
    }
    
    // Convert to map for easy lookup
    const costMap = {};
    data.forEach(cost => {
      costMap[cost.sku] = cost;
    });
    
    return costMap;
  } catch (error) {
    console.error('Error in getProductCostsBySKUs:', error);
    return {};
  }
}

/**
 * Get product compositions by parent SKUs
 * @param {array} parentSkus - Array of parent SKUs
 * @returns {object} Map of parent SKU to compositions
 */
export async function getProductCompositionsByParentSKUs(parentSkus) {
  if (!parentSkus || parentSkus.length === 0) return {};
  
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('product_compositions')
      .select('parent_sku, component_sku, quantity, source_channel, status')
      .in('parent_sku', parentSkus)
      .eq('status', 'aktif');
    
    if (error) {
      console.error('Error fetching product compositions:', error);
      return {};
    }
    
    // Group by parent SKU
    const compositionMap = {};
    data.forEach(comp => {
      if (!compositionMap[comp.parent_sku]) {
        compositionMap[comp.parent_sku] = [];
      }
      compositionMap[comp.parent_sku].push(comp);
    });
    
    return compositionMap;
  } catch (error) {
    console.error('Error in getProductCompositionsByParentSKUs:', error);
    return {};
  }
}

/**
 * Merge products with their costs and compositions
 * @param {array} products - Array of products
 * @returns {array} Products with costs and compositions merged
 */
export async function mergeProductsWithRelatedData(products) {
  if (!products || products.length === 0) return products;
  
  const skus = products.map(p => p.sku);
  
  // Fetch costs and compositions in parallel
  const [costsMap, compositionsMap] = await Promise.all([
    getProductCostsBySKUs(skus),
    getProductCompositionsByParentSKUs(skus)
  ]);
  
  // Merge data
  return products.map(product => ({
    ...product,
    cost: costsMap[product.sku] || {
      modal_cost: 0,
      packing_cost: 0,
      affiliate_percentage: 0
    },
    compositions: compositionsMap[product.sku] || [],
    isBundle: (compositionsMap[product.sku] || []).length > 0
  }));
}
