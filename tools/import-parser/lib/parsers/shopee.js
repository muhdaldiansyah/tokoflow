const STATUS_MAP = {
  'selesai': 'completed',
  'pesanan selesai': 'completed',
  'completed': 'completed',
  'dibatalkan': 'cancelled',
  'cancelled': 'cancelled',
  'dalam pengiriman': 'in_transit',
  'dikirim': 'in_transit',
  'sedang dikirim': 'in_transit',
  'menunggu konfirmasi': 'pending',
  'siap dikirim': 'pending',
  'diproses': 'pending',
};

const SCHEMA = {
  order_id:        ['No. Pesanan', 'Nomor Pesanan', 'No Pesanan'],
  order_date:      ['Tanggal Pesanan Dibuat', 'Waktu Pesanan Dibuat', 'Tanggal Pembayaran'],
  product_name:    ['Nama Produk'],
  variant_name:    ['Nama Variasi', 'Variasi'],
  channel_sku:     ['Nomor Referensi SKU', 'SKU Referensi', 'Kode Produk', 'SKU'],
  quantity:        ['Jumlah'],
  gross_sales:     ['Total Harga Pesanan', 'Jumlah Total Pesanan', 'Total Harga'],
  seller_discount: ['Voucher Ditanggung Penjual', 'Paket Diskon (Penjual)', 'Diskon Penjual'],
  marketplace_fee: ['Biaya Komisi', 'Biaya Administrasi', 'Biaya Layanan', 'Komisi', 'Total Biaya Platform'],
  shipping_fee:    ['Ongkir yang Dibayar Pembeli', 'Estimasi Ongkir', 'Ongkos Kirim'],
  net_settlement:  ['Total Penghasilan', 'Total Penghasilan Bersih', 'Penghasilan Bersih'],
  status:          ['Status Pesanan', 'Status'],
};

function findCol(row, aliases) {
  for (const alias of aliases) {
    const key = Object.keys(row).find(k =>
      k.toLowerCase().trim() === alias.toLowerCase().trim()
    );
    if (key && row[key] !== undefined && row[key] !== '') {
      return row[key];
    }
  }
  return null;
}

function num(val) {
  if (!val) return 0;
  return parseFloat(String(val).replace(/[^\d.-]/g, '')) || 0;
}

function parseDate(val) {
  if (!val) return '';
  const dmy = val.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
  const iso = val.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return val;
}

function parseShopee(rows, headers) {
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
    const gross_sales   = num(g('gross_sales'));
    const seller_disc   = num(g('seller_discount'));
    const mfee          = num(g('marketplace_fee'));
    const shipping_fee  = num(g('shipping_fee'));
    const net_settle    = num(g('net_settlement'));
    const rawStatus     = (g('status') || '').toLowerCase().trim();
    const status        = STATUS_MAP[rawStatus] || 'unknown';
    const unit_price    = quantity > 0 ? Math.round(gross_sales / quantity) : 0;

    const filled = [order_id, order_date, product_name, channel_sku, quantity, gross_sales]
      .filter(v => v && v !== 0).length;
    const confidence = Math.round((filled / 6) * 100);

    const notes = [];
    if (!channel_sku) notes.push('missing:channel_sku');
    if (mfee === 0 && status === 'completed') notes.push('fallback:marketplace_fee=0');
    if (!order_date) notes.push('missing:order_date');
    if (status === 'unknown') notes.push(`unknown_status:${rawStatus}`);

    const normalized = {
      channel: 'shopee', order_date, order_id, product_name, variant_name,
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

module.exports = { parseShopee };
