const STATUS_MAP = {
  'completed': 'completed',
  'delivered': 'completed',
  'cancelled': 'cancelled',
  'canceled': 'cancelled',
  'in transit': 'in_transit',
  'shipped': 'in_transit',
  'processing': 'pending',
  'unpaid': 'pending',
  'pending': 'pending',
};

const SCHEMA = {
  order_id:        ['Order ID'],
  order_date:      ['Created Time', 'Order Creation Time', 'Order Date'],
  product_name:    ['Product Name'],
  variant_name:    ['Variation', 'SKU Name', 'Product Variation'],
  channel_sku:     ['Seller SKU', 'Seller SKU ID'],
  quantity:        ['Quantity'],
  unit_price:      ['SKU Unit Original Price', 'Unit Price'],
  gross_sales:     ['SKU Subtotal After Discount', 'Order Amount', 'Total Amount'],
  seller_discount: ['SKU Seller Discount', 'Seller Discount'],
  marketplace_fee: ['Commission Fee', 'Platform Commission'],
  shipping_fee:    ['Shipping Fee After Discount', 'Original Shipping Fee', 'Shipping Fee'],
  net_settlement:  ['Settlement Amount', 'Net Settlement'],
  status:          ['Order Status'],
};

function findCol(row, aliases) {
  for (const alias of aliases) {
    const key = Object.keys(row).find(k =>
      k.toLowerCase().trim() === alias.toLowerCase().trim()
    );
    if (key && row[key] !== undefined && row[key] !== '') return row[key];
  }
  return null;
}

function num(val) {
  if (!val) return 0;
  return parseFloat(String(val).replace(/[^\d.-]/g, '')) || 0;
}

function parseDate(val) {
  if (!val) return '';
  const iso = val.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return val;
}

function parseTikTok(rows, headers) {
  const colCoverage = {};
  for (const [field, aliases] of Object.entries(SCHEMA)) {
    colCoverage[field] = aliases.find(a =>
      headers.some(h => h.toLowerCase().trim() === a.toLowerCase().trim())
    ) || null;
  }
  const missingFields = Object.entries(colCoverage).filter(([, v]) => !v).map(([k]) => k);

  const completed = [];
  const cancelled = [];

  for (const row of rows) {
    const g = (f) => findCol(row, SCHEMA[f]);

    const order_id      = g('order_id') || '';
    const order_date    = parseDate(g('order_date'));
    const product_name  = g('product_name') || '';
    const variant_name  = g('variant_name') || '';
    const channel_sku   = g('channel_sku') || '';
    const quantity      = num(g('quantity'));
    const unit_price    = num(g('unit_price'));
    const gross_sales   = num(g('gross_sales'));
    const seller_disc   = num(g('seller_discount'));
    const mfee          = num(g('marketplace_fee'));
    const shipping_fee  = num(g('shipping_fee'));
    const net_settle    = num(g('net_settlement'));
    const rawStatus     = (g('status') || '').toLowerCase().trim();
    const status        = STATUS_MAP[rawStatus] || 'unknown';

    const filled = [order_id, order_date, product_name, channel_sku, quantity, gross_sales]
      .filter(v => v && v !== 0).length;
    const confidence = Math.round((filled / 6) * 100);

    const notes = [];
    if (!channel_sku) notes.push('missing:channel_sku');
    if (mfee === 0 && status === 'completed') notes.push('fallback:marketplace_fee=0');
    if (!order_date) notes.push('missing:order_date');
    if (status === 'unknown') notes.push(`unknown_status:${rawStatus}`);

    const normalized = {
      channel: 'tiktok-shop', order_date, order_id, product_name, variant_name,
      channel_sku, quantity, unit_price, gross_sales,
      seller_discount: seller_disc, marketplace_fee: mfee,
      shipping_fee, refund_amount: status === 'cancelled' ? gross_sales : 0,
      net_settlement: net_settle, status, confidence,
      notes: notes.join('; '),
    };

    if (status === 'cancelled') cancelled.push(normalized);
    else completed.push(normalized);
  }

  return { rows: completed, cancelled, missingFields, colCoverage, totalRows: rows.length };
}

module.exports = { parseTikTok };
