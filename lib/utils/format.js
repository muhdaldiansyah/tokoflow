// Format utilities for TokoFlow

/**
 * Get product costs by SKUs
 * @param {array} skus - Array of SKUs to fetch costs for
 * @returns {object} Map of SKU to costs
 */
export async function getProductCostsBySKUs(skus) {
  if (!skus || skus.length === 0) return {};
  
  try {
    const { createClient } = await import('@/lib/database/supabase/client');
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('tokoflow_product_costs')
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
 * Format number as Indonesian Rupiah currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0';
  }
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with thousand separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Parse formatted currency string back to number
 * @param {string} str - Currency string to parse
 * @returns {number} Parsed number
 */
export function parseCurrency(str) {
  if (!str) return 0;
  
  // Remove currency symbol and spaces
  const cleaned = str.toString()
    .replace(/[Rp\s]/g, '')
    .replace(/\./g, '')  // Remove thousand separator
    .replace(',', '.');  // Convert decimal separator
    
  return Number(cleaned) || 0;
}

/**
 * Format date to Indonesian locale
 * @param {string|Date} date - Date to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date string
 */
export function formatDate(date, includeTime = false) {
  if (!date) return '-';
  
  const d = new Date(date);
  
  if (includeTime) {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }
  
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string for input
 */
export function formatDateForInput(date) {
  if (!date) {
    date = new Date();
  }
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Calculate percentage
 * @param {number} value - Value
 * @param {number} total - Total
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value, total, decimals = 1) {
  if (!total || total === 0) return '0%';
  
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, length = 50) {
  if (!text) return '';
  if (text.length <= length) return text;
  
  return text.substring(0, length) + '...';
}

/**
 * Convert status to display text
 * @param {string} status - Status code
 * @returns {string} Display text
 */
export function formatStatus(status) {
  const statusMap = {
    'pending': 'Pending',
    'ok': 'Ready',
    'processed': 'Processed',
    'cancelled': 'Cancelled',
  };
  
  return statusMap[status?.toLowerCase()] || status || '-';
}

/**
 * Get status color classes
 * @param {string} status - Status code
 * @returns {object} Color classes for background and text
 */
export function getStatusColor(status) {
  const colorMap = {
    'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'ok': { bg: 'bg-blue-100', text: 'text-blue-800' },
    'processed': { bg: 'bg-green-100', text: 'text-green-800' },
    'cancelled': { bg: 'bg-red-100', text: 'text-red-800' },
  };
  
  return colorMap[status?.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-800' };
}
