// Example API calls for TokoFlow database functions

// 1. Add a new sales input (equivalent to entering data in DashboardInput)
const addSalesInput = async (supabase, data) => {
  const { data: result, error } = await supabase
    .from('sales_input')
    .insert({
      transaction_date: data.date,
      sku: data.sku,
      product_name: data.productName,
      selling_price: data.price,
      quantity: data.quantity,
      channel: data.channel,
      status: 'ok'
    })
    .select()
    .single();
    
  if (error) throw error;
  return result;
};

// 2. Process all pending sales (equivalent to clicking "Simpan" button)
const processPendingSales = async (supabase) => {
  const { data, error } = await supabase
    .rpc('batch_process_sales');
    
  if (error) throw error;
  return data; // Returns number of processed records
};

// 3. Add incoming goods input
const addIncomingGoods = async (supabase, data) => {
  const { data: result, error } = await supabase
    .from('incoming_goods_input')
    .insert({
      transaction_date: data.date,
      sku: data.sku,
      product_name: data.productName,
      quantity: data.quantity,
      status: 'ok'
    })
    .select()
    .single();
    
  if (error) throw error;
  return result;
};

// 4. Process incoming goods
const processIncomingGoods = async (supabase) => {
  const { data, error } = await supabase
    .rpc('batch_process_incoming_goods');
    
  if (error) throw error;
  return data;
};

// 5. Get current inventory
const getInventory = async (supabase) => {
  const { data, error } = await supabase
    .from('v_inventory')
    .select('*')
    .order('sku');
    
  if (error) throw error;
  return data;
};

// 6. Get stock alerts
const getStockAlerts = async (supabase) => {
  const { data, error } = await supabase
    .from('v_stock_alerts')
    .select('*');
    
  if (error) throw error;
  return data;
};

// 7. Get sales by channel
const getSalesByChannel = async (supabase) => {
  const { data, error } = await supabase
    .from('v_sales_by_channel')
    .select('*');
    
  if (error) throw error;
  return data;
};

// 8. Get sales transactions with filters
const getSalesTransactions = async (supabase, filters = {}) => {
  let query = supabase
    .from('sales_transactions')
    .select('*')
    .order('transaction_date', { ascending: false });
    
  if (filters.startDate) {
    query = query.gte('transaction_date', filters.startDate);
  }
  
  if (filters.endDate) {
    query = query.lte('transaction_date', filters.endDate);
  }
  
  if (filters.channel) {
    query = query.eq('channel', filters.channel);
  }
  
  if (filters.sku) {
    query = query.eq('sku', filters.sku);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
};

// 9. Add/Update product
const upsertProduct = async (supabase, product) => {
  const { data, error } = await supabase
    .from('products')
    .upsert({
      sku: product.sku,
      name: product.name,
      stock: product.stock || 0
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// 10. Add/Update product cost
const upsertProductCost = async (supabase, cost) => {
  const { data, error } = await supabase
    .from('product_costs')
    .upsert({
      sku: cost.sku,
      modal_cost: cost.modalCost,
      packing_cost: cost.packingCost,
      affiliate_percentage: cost.affiliatePercentage
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// 11. Manage marketplace fees
const upsertMarketplaceFee = async (supabase, fee) => {
  const { data, error } = await supabase
    .from('marketplace_fees')
    .upsert({
      channel: fee.channel.toLowerCase(),
      fee_percentage: fee.feePercentage
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// 12. Manage product compositions
const addProductComposition = async (supabase, composition) => {
  const { data, error } = await supabase
    .from('product_compositions')
    .insert({
      parent_sku: composition.parentSku,
      component_sku: composition.componentSku,
      quantity: composition.quantity,
      source_channel: composition.sourceChannel || 'semua',
      status: composition.status || 'aktif'
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export {
  addSalesInput,
  processPendingSales,
  addIncomingGoods,
  processIncomingGoods,
  getInventory,
  getStockAlerts,
  getSalesByChannel,
  getSalesTransactions,
  upsertProduct,
  upsertProductCost,
  upsertMarketplaceFee,
  addProductComposition
};
