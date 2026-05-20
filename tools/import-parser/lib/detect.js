const SIGNATURES = {
  shopee: [
    'No. Pesanan', 'Status Pesanan', 'Nama Variasi',
    'Nomor Referensi SKU', 'Harga Awal', 'Total Harga Pesanan',
    'Voucher Ditanggung Shopee', 'Total Penghasilan',
  ],
  tiktok: [
    'Order ID', 'Order Status', 'Seller SKU',
    'SKU Unit Original Price', 'Commission Fee', 'Settlement Amount',
    'SKU Subtotal After Discount',
  ],
  tokopedia: [
    'No Invoice', 'Tanggal Transaksi', 'Nama Produk',
    'Harga Awal Produk', 'Kode SKU', 'Biaya Admin',
  ],
};

function detectMarketplace(headers, filename = '') {
  const fname = filename.toLowerCase();
  if (fname.includes('shopee')) return { marketplace: 'shopee', confidence: 95, scores: {} };
  if (fname.includes('tiktok') || fname.includes('tts')) return { marketplace: 'tiktok', confidence: 95, scores: {} };
  if (fname.includes('tokopedia') || fname.includes('tkpd')) return { marketplace: 'tokopedia', confidence: 95, scores: {} };

  const scores = {};
  for (const [market, sigs] of Object.entries(SIGNATURES)) {
    scores[market] = sigs.filter(sig =>
      headers.some(h => h.toLowerCase().includes(sig.toLowerCase()))
    ).length;
  }

  const [best] = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (best[1] === 0) return null;

  const confidence = Math.round((best[1] / SIGNATURES[best[0]].length) * 100);
  return { marketplace: best[0], confidence, scores };
}

module.exports = { detectMarketplace };
