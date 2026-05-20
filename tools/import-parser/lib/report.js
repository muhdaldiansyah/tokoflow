const fs = require('fs');
const path = require('path');

const FIELDS = [
  'channel', 'order_date', 'order_id', 'product_name', 'variant_name',
  'channel_sku', 'quantity', 'unit_price', 'gross_sales', 'seller_discount',
  'marketplace_fee', 'shipping_fee', 'refund_amount', 'net_settlement',
  'status', 'confidence', 'notes',
];

function toCSVRow(obj) {
  return FIELDS.map(f => {
    const v = String(obj[f] ?? '');
    return (v.includes(',') || v.includes('"') || v.includes('\n'))
      ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(',');
}

function rp(n) {
  return `Rp ${Number(n).toLocaleString('id-ID')}`;
}

function writeReport(result, marketplace, outputDir, sourceFile) {
  const { rows, cancelled, missingFields, totalRows, error } = result;

  if (error) {
    console.error(`\nParser error: ${error}\n`);
    return;
  }

  const done = rows.filter(r => r.status === 'completed');
  const totalGross = done.reduce((s, r) => s + r.gross_sales, 0);
  const totalFee   = done.reduce((s, r) => s + r.marketplace_fee, 0);
  const totalNet   = done.reduce((s, r) => s + r.net_settlement, 0);
  const avgConf    = rows.length ? Math.round(rows.reduce((s, r) => s + r.confidence, 0) / rows.length) : 0;
  const skuSet     = new Set(rows.map(r => r.channel_sku).filter(Boolean));
  const noSKU      = rows.filter(r => !r.channel_sku);

  console.log(`── Parse Result ──────────────────────────────`);
  console.log(`Marketplace    : ${marketplace.toUpperCase()}`);
  console.log(`Total rows     : ${totalRows}`);
  console.log(`Completed      : ${done.length}`);
  console.log(`Cancelled      : ${cancelled.length}`);
  console.log(`Other/unknown  : ${totalRows - done.length - cancelled.length}`);
  console.log(`Unique SKUs    : ${skuSet.size}`);
  console.log(`Missing SKU    : ${noSKU.length} rows`);
  console.log(`Avg confidence : ${avgConf}%`);
  console.log(``);
  console.log(`── Financials (completed only) ───────────────`);
  console.log(`Gross sales    : ${rp(totalGross)}`);
  console.log(`Marketplace fee: ${rp(totalFee)}`);
  console.log(`Net settlement : ${rp(totalNet)}`);
  console.log(``);

  if (missingFields.length) {
    console.log(`── Missing Columns ───────────────────────────`);
    missingFields.forEach(f => console.log(`  ⚠  ${f} — not found, fallback applied`));
    console.log(``);
  }

  if (noSKU.length) {
    console.log(`── Rows Without SKU (first 5) ────────────────`);
    noSKU.slice(0, 5).forEach(r => console.log(`  ⚠  "${r.product_name}" ${r.variant_name}`));
    if (noSKU.length > 5) console.log(`  ... and ${noSKU.length - 5} more`);
    console.log(``);
  }

  // Write normalized CSV (non-cancelled)
  const ts = Date.now();
  const normalizedPath = path.join(outputDir, `normalized_${marketplace}_${ts}.csv`);
  fs.writeFileSync(normalizedPath, [FIELDS.join(','), ...rows.map(toCSVRow)].join('\n'), 'utf-8');

  console.log(`── Output ────────────────────────────────────`);
  console.log(`Normalized CSV : ${normalizedPath}`);

  if (cancelled.length) {
    const cancelPath = path.join(outputDir, `cancelled_${marketplace}_${ts}.csv`);
    fs.writeFileSync(cancelPath, [FIELDS.join(','), ...cancelled.map(toCSVRow)].join('\n'), 'utf-8');
    console.log(`Cancelled CSV  : ${cancelPath}`);
  }

  console.log(``);
  console.log(`Next: review normalized CSV → konfirmasi ke operator → save-to-db.`);
  console.log(``);
}

module.exports = { writeReport };
