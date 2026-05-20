// lib/services/index.js
/**
 * Central export for all service modules
 */

// Inventory services
export {
  updateInventory,
  batchUpdateInventory,
  checkStockAvailability
} from './inventory';

// Composition services
export {
  updateCompositionInventory,
  getProductCompositions,
  validateCompositionStock
} from './composition';

// Sales services
export {
  processSalesTransaction,
  batchProcessSales,
  getSalesByChannel
} from './sales';

// Incoming goods services
export {
  processIncomingGoods,
  batchProcessIncomingGoods,
  getIncomingGoodsHistory
} from './incoming-goods';
