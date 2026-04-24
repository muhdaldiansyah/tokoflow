# Definitive Rekap Field Inventory — CatatOrder

> The authoritative reference for ALL data fields and metrics in CatatOrder's rekap (daily recap) and laporan (monthly report) features. Synthesized from data inventory, UMKM problem mapping, gap analysis, and current implementation audit.

*Compiled: 2026-03-10 | CatatOrder v2.6.0 | Based on: 1-data-inventory.md, 2-problem-data-mapping.md, 3-rekap-gap-analysis.md, rekap-feature-analysis.md*

---

## Part 1: Executive Summary

### By the Numbers

| Category | Count |
|----------|-------|
| **Total recommended fields/metrics (daily)** | 52 |
| **Total recommended fields/metrics (monthly)** | 71 |
| **Already implemented** | 14 |
| **New from existing data (no schema change)** | 43 |
| **New requiring new data collection** | 14 |
| **UMKM problems directly addressed** | 23 of 87 (26%) |
| **UMKM problems partially addressed** | 19 of 87 (22%) |
| **Total addressable by better rekap** | 42 of 87 (48%) |

### Strategic Reasoning

CatatOrder's rekap is not a "nice-to-have reporting page." For Indonesian UMKM, it IS the business intelligence system — often the only structured financial view the owner has ever seen. The data already exists in the database from normal order operations. The gap is not data collection but data presentation and insight generation.

Three strategic imperatives drive this field inventory:

1. **Pembukuan otomatis (B1, B2, B8):** 98% of UMKM have no bookkeeping. Every metric shown in rekap is one fewer manual calculation. The rekap replaces the notebook.

2. **Cash flow visibility (B4, B5, B9):** Piutang macet (bad receivables) is the #1 silent killer of UMKM margins. Aging analysis, collection rates, and outstanding amounts transform abstract "belum bayar" into actionable follow-up lists.

3. **Data-driven decisions (D5, B3, E5, I7):** Which products sell? Which customers are loyal? Which channels work? UMKM owners currently guess. Every field below converts a guess into a fact.

### Current vs Ideal Coverage

```
CURRENT REKAP (14 fields):
  Revenue: total_orders, collected_revenue, paid/partial/unpaid breakdown
  Products: top 10 by revenue
  Customers: new customer count, top 10 monthly
  Operations: status counts
  Meta: quota usage

IDEAL REKAP (52-71 fields):
  Revenue: 12 fields (+ piutang, AOV, growth, discount, gross revenue...)
  Payment: 8 fields (+ aging, collection rate, claim tracking...)
  Products: 10 fields (+ velocity, concentration, category, slow movers...)
  Customers: 10 fields (+ returning ratio, churn, CLV, acquisition source...)
  Operations: 8 fields (+ source breakdown, fulfillment rate, late orders...)
  Growth: 6 fields (+ WoW/MoM comparison, projections, moving averages...)
  Health Score: 4 composite metrics
  Monthly extras: 19 additional fields
```

---

## Part 2: Complete Field Inventory — Rekap Harian (Daily)

### Section 1: Ringkasan Utama (Headline Numbers)

These are the 4-6 numbers shown at the very top of the daily recap — the "dashboard glance."

| # | Field Name (UI) | Technical Definition | UMKM Problem | Status | Priority |
|---|----------------|---------------------|--------------|--------|----------|
| 1.1 | **Total Pesanan** | `COUNT(orders) WHERE status != 'cancelled' AND created_at IN date_range` — must exclude cancelled for consistency with revenue | B1, D3 | ✅ Exists (but **buggy** — currently includes cancelled) | P0 |
| 1.2 | **Total Penjualan** | `SUM(total) WHERE status != 'cancelled'` — gross billed amount | B1, B2, B8 | 🆕 New (data exists in service as `totalRevenue`, not shown in daily UI) | P0 |
| 1.3 | **Terkumpul** | `SUM(paid_amount) WHERE status != 'cancelled'` — actual cash received | B2, B4 | ✅ Exists | P0 |
| 1.4 | **Piutang** | `SUM(total - paid_amount) WHERE status != 'cancelled' AND total > paid_amount` — outstanding receivables | B4, B9 | 🆕 New (from existing data) | P0 |
| 1.5 | **Rata-rata Pesanan (AOV)** | `totalRevenue / activeOrderCount` (exclude cancelled) | B3, A8 | 🆕 New (from existing data) | P0 |
| 1.6 | **Tingkat Penagihan** | `(collectedRevenue / totalRevenue * 100)%` — collection rate | B4, B9 | 🆕 New (from existing data) | P0 |

### Section 2: Pendapatan & Piutang

| # | Field Name (UI) | Technical Definition | UMKM Problem | Status | Priority |
|---|----------------|---------------------|--------------|--------|----------|
| 2.1 | **Lunas** (count + nominal) | `COUNT + SUM(total) WHERE paid_amount >= total AND status != 'cancelled'` | B4 | ✅ Exists | P0 |
| 2.2 | **DP / Bayar Sebagian** (count + nominal) | `COUNT + SUM(total) WHERE paid_amount > 0 AND paid_amount < total AND status != 'cancelled'` | B4 | ✅ Exists | P0 |
| 2.3 | **Belum Bayar** (count + nominal) | `COUNT + SUM(total) WHERE (paid_amount = 0 OR paid_amount IS NULL) AND status != 'cancelled'` | B4 | ✅ Exists | P0 |
| 2.4 | **Total Diskon** | `SUM(discount) WHERE discount > 0 AND status != 'cancelled'` | B9 | 🆕 New (field exists on orders, never aggregated) | P1 |
| 2.5 | **Nilai Pesanan Dibatalkan** | `COUNT + SUM(total) WHERE status = 'cancelled'` | B9 | 🆕 New (monthly shows count, daily doesn't; neither shows value) | P1 |
| 2.6 | **Pertumbuhan vs Kemarin** | `((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100)%` — show as arrow + percentage | D5, C8 | 🆕 New (comparison logic exists in AI route, not in main UI) | P0 |
| 2.7 | **Pertumbuhan vs 7 Hari Lalu** | `((todayRevenue - sameDayLastWeekRevenue) / sameDayLastWeekRevenue * 100)%` | D5 | 🆕 New (data available from AI comparison query) | P1 |
| 2.8 | **Pendapatan dari Pelanggan Baru** | `SUM(total) WHERE customer's created_at = today AND status != 'cancelled'` | E5, E6 | 🆕 New (from existing data, cross-reference orders + customers) | P2 |
| 2.9 | **Pendapatan dari Pelanggan Lama** | `totalRevenue - newCustomerRevenue` | E5 | 🆕 New (derived from 2.8) | P2 |

### Section 3: Pembayaran

| # | Field Name (UI) | Technical Definition | UMKM Problem | Status | Priority |
|---|----------------|---------------------|--------------|--------|----------|
| 3.1 | **Daftar Piutang Hari Ini** | List of orders WHERE `paid_amount < total AND status != 'cancelled'`, show: customer_name, order_number, remaining amount (`total - paid_amount`) | B4 | 🆕 New (actionable list, not just aggregate) | P0 |
| 3.2 | **Klaim "Sudah Bayar"** | `COUNT WHERE payment_claimed_at IS NOT NULL AND payment_claimed_at IN date_range` — customer claims pending verification | B4 | 🆕 New (field exists since v2.6.0, not in recap) | P1 |
| 3.3 | **DP yang Perlu Follow-up** | List of orders WHERE `paid_amount > 0 AND paid_amount < total AND status != 'cancelled'`, show: customer, remaining, days since order | B4 | 🆕 New (actionable list for partial payments) | P1 |

### Section 4: Produk

| # | Field Name (UI) | Technical Definition | UMKM Problem | Status | Priority |
|---|----------------|---------------------|--------------|--------|----------|
| 4.1 | **Produk Terlaris** (top 10) | Aggregate `orders.items` JSONB: `SUM(qty)` and `SUM(price * qty)` GROUP BY `LOWER(name)`, ORDER BY revenue DESC, LIMIT 10 | B3, D5 | ✅ Exists | P0 |
| 4.2 | **Kontribusi % Produk Teratas** | `topProductRevenue / totalRevenue * 100` for each top product | B3, I7 | 🆕 New (from existing top items data) | P1 |
| 4.3 | **Konsentrasi Revenue** | `SUM(revenue of top 1 product) / totalRevenue * 100` — alert if > 60% | I7 | 🆕 New (from existing data) | P1 |
| 4.4 | **Jumlah Jenis Produk Terjual** | `COUNT(DISTINCT LOWER(item.name))` across all order items today | I7, B3 | 🆕 New (from existing data) | P2 |
| 4.5 | **Velocity Produk** | For each top product: `SUM(qty today)` vs `AVG(qty per day, last 7 days)` — show trend arrow | B7, G6, G1 | 🆕 New (needs historical query) | P1 |
| 4.6 | **Stok Hampir Habis** | `SELECT name, stock FROM products WHERE stock IS NOT NULL AND stock > 0 AND stock <= 10 AND is_available = true` — alert list | B7, G6 | 🆕 New (from products table, not order data) | P1 |
| 4.7 | **Prediksi Habis Stok** | For products with stock != null: `stock / (7-day avg daily qty sold)` = days until stockout | B7, G6 | 🆕 New (needs velocity calculation + products.stock) | P2 |
| 4.8 | **Performa per Kategori** | `SUM(revenue)` GROUP BY product category (match order item names to `products.category`) | I7, B3 | 🆕 New (needs join: order items ↔ products table) | P2 |

### Section 5: Pelanggan

| # | Field Name (UI) | Technical Definition | UMKM Problem | Status | Priority |
|---|----------------|---------------------|--------------|--------|----------|
| 5.1 | **Pelanggan Baru** | `COUNT(customers) WHERE created_at IN date_range AND user_id = current_user` | E5 | ✅ Exists (count only) | P0 |
| 5.2 | **Pelanggan Baru (daftar nama)** | List of new customer names from 5.1 | E5 | 🆕 New (names, not just count) | P1 |
| 5.3 | **Pelanggan Returning** | `COUNT(DISTINCT customer_id) WHERE customer has orders before today, AND has order today` | E5, E6 | 🆕 New (cross-reference orders + customers.created_at) | P0 |
| 5.4 | **Rasio Pelanggan Baru vs Returning** | `newCustomers / (newCustomers + returningCustomers) * 100` | E5 | 🆕 New (derived from 5.1 + 5.3) | P1 |
| 5.5 | **Total Pelanggan Aktif Hari Ini** | `COUNT(DISTINCT customer_id OR customer_phone) FROM orders WHERE created_at IN date_range AND status != 'cancelled'` | E5, J4 | 🆕 New (from existing data) | P1 |

### Section 6: Operasional

| # | Field Name (UI) | Technical Definition | UMKM Problem | Status | Priority |
|---|----------------|---------------------|--------------|--------|----------|
| 6.1 | **Status Pesanan** | Count per status: Baru, Menunggu, Diproses, Dikirim, Selesai, Dibatalkan — only show non-zero | F5 | ✅ Exists | P0 |
| 6.2 | **Sumber Pesanan** | `COUNT GROUP BY source`: Manual, Link Toko (`order_link`), WhatsApp | D3, E1, E6 | 🆕 New (field exists on every order, completely ignored in recap) | P0 |
| 6.3 | **Revenue per Sumber** | `SUM(total) GROUP BY source` | E6 | 🆕 New (from existing data) | P1 |
| 6.4 | **Pesanan Terlambat** | `COUNT WHERE delivery_date < NOW() AND status NOT IN ('done', 'cancelled')` — orders past their delivery date | F5 | 🆕 New (delivery_date field exists, never analyzed) | P1 |
| 6.5 | **Tingkat Penyelesaian** | `COUNT(done) / COUNT(all non-cancelled non-menunggu) * 100` — fulfillment rate | G8, F5 | 🆕 New (from existing data) | P1 |
| 6.6 | **Tingkat Pembatalan** | `COUNT(cancelled) / COUNT(all) * 100` | B9, F2 | 🆕 New (from existing data) | P2 |
| 6.7 | **Pesanan Terjadwal (Upcoming)** | `COUNT + list WHERE delivery_date > NOW() AND status NOT IN ('done', 'cancelled')` — future deliveries | B5, F3 | 🆕 New (from existing data) | P2 |
| 6.8 | **Penggunaan Kuota** | `orders_used / 50` with progress bar, or "Unlimited" if unlimited_until > now | — (billing) | ✅ Exists | P0 |

### Section 7: Pertumbuhan & Tren

| # | Field Name (UI) | Technical Definition | UMKM Problem | Status | Priority |
|---|----------------|---------------------|--------------|--------|----------|
| 7.1 | **Tren 7 Hari** | Array of `{date, orderCount, revenue}` for last 7 days — render as sparkline or mini bar chart | D5, C8 | 🆕 New (data queryable, needs new UI component) | P1 |
| 7.2 | **Rata-rata Harian 7 Hari** | `AVG(revenue)` and `AVG(orderCount)` over last 7 days | D5, B5 | 🆕 New (calculated in AI route, not shown in main UI) | P1 |
| 7.3 | **Hari Terbaik Minggu Ini** | `MAX(revenue)` day in current week + the date | C8 | 🆕 New (from existing data) | P2 |

### Section 8: Skor Kesehatan Bisnis

A composite "business health" indicator shown as a simple badge (Sehat / Perlu Perhatian / Waspada).

| # | Field Name (UI) | Technical Definition | UMKM Problem | Status | Priority |
|---|----------------|---------------------|--------------|--------|----------|
| 8.1 | **Skor Kesehatan** | Composite score (0-100) from weighted components below. Display as badge: ≥70 "Sehat" (green), 40-69 "Perlu Perhatian" (yellow), <40 "Waspada" (red) | B1, B4, C8 | 🆕 New (needs composite calculation) | P1 |
| 8.2 | **Komponen: Penagihan** | `collectionRate` — weight 30%. Score: ≥80%=100, 60-79%=70, 40-59%=40, <40%=10 | B4 | 🆕 New (derived) | P1 |
| 8.3 | **Komponen: Volume** | Compare today vs 7-day avg. Score: ≥avg=100, 70-99% of avg=70, 50-69%=40, <50%=10 | D5 | 🆕 New (derived) | P1 |
| 8.4 | **Komponen: Pelanggan** | returningRatio. Score: ≥50% returning=100, 30-49%=70, 10-29%=40, <10%=10 | E5 | 🆕 New (derived) | P1 |

**Total Daily Fields: 52**

---

## Part 3: Complete Field Inventory — Laporan Bulanan (Monthly)

The monthly report includes ALL daily fields (recalculated for the month) PLUS the following monthly-specific fields.

### Section 9: Ringkasan Bulanan (Monthly Summary Additions)

| # | Field Name (UI) | Technical Definition | UMKM Problem | Status | Priority |
|---|----------------|---------------------|--------------|--------|----------|
| 9.1 | **Total Penjualan Bulan Ini** | `SUM(total) WHERE status != 'cancelled' AND created_at IN month_range` | B1, B8 | ✅ Exists (shown in monthly, not daily) | P0 |
| 9.2 | **Perbandingan Bulan Lalu (%)** | `((thisMonth - lastMonth) / lastMonth * 100)%` for orders, revenue, collected | B8, C8, D5 | 🆕 New (data exists in AI route, not in main UI) | P0 |
| 9.3 | **Rata-rata Harian Bulan Ini** | `totalRevenue / daysWithOrders` (not calendar days — actual operating days) | B5 | 🆕 New (from existing data) | P0 |
| 9.4 | **Hari Operasional** | `COUNT(DISTINCT DATE(created_at))` — days with at least 1 order | B6, J4 | 🆕 New (from existing data) | P1 |
| 9.5 | **Proyeksi Revenue Bulan Ini** | `avgDailyRevenue * remainingDaysInMonth + currentMonthRevenue` — simple linear projection | B5 | 🆕 New (from existing data) | P1 |
| 9.6 | **Revenue per Hari Kerja** | `totalRevenue / operationalDays` — more accurate daily average | B5, B6 | 🆕 New (derived from 9.3 + 9.4) | P2 |

### Section 10: Piutang & Aging (Monthly Specific)

| # | Field Name (UI) | Technical Definition | UMKM Problem | Status | Priority |
|---|----------------|---------------------|--------------|--------|----------|
| 10.1 | **Piutang Total (Semua Waktu)** | `SUM(total - paid_amount) WHERE total > paid_amount AND status NOT IN ('cancelled')` — all outstanding across all time, not just this month | B4 | 🆕 New (critical: this is THE piutang number) | P0 |
| 10.2 | **Aging: 0-7 Hari** | `SUM(total - paid_amount) WHERE (NOW() - created_at) <= 7 days AND unpaid` | B4 | 🆕 New (needs aging query) | P0 |
| 10.3 | **Aging: 8-14 Hari** | Same pattern, 8-14 days | B4 | 🆕 New | P0 |
| 10.4 | **Aging: 15-30 Hari** | Same pattern, 15-30 days | B4 | 🆕 New | P0 |
| 10.5 | **Aging: >30 Hari** | Same pattern, >30 days — highlight in red, these are "macet" | B4 | 🆕 New | P0 |
| 10.6 | **Piutang per Pelanggan** | `SUM(total - paid_amount) GROUP BY customer, ORDER BY outstanding DESC` — ranked list | B4 | 🆕 New (from existing data) | P0 |
| 10.7 | **Rata-rata Waktu Bayar** | `AVG(time from created_at to when paid_amount reached total)` for orders that became fully paid this month. Needs: orders where `paid_amount = total` and we can estimate payment time from `updated_at` | B4 | 🆕 New (approximate — needs `updated_at` as proxy for payment time) | P2 |

### Section 11: Pelanggan Bulanan (Monthly Customer Depth)

| # | Field Name (UI) | Technical Definition | UMKM Problem | Status | Priority |
|---|----------------|---------------------|--------------|--------|----------|
| 11.1 | **Pelanggan Teratas** (top 10) | Top 10 by `SUM(paid_amount)` — ranked list with name, phone, totalSpent, orderCount | E5 | ✅ Exists | P0 |
| 11.2 | **Pelanggan Baru Bulan Ini** | `COUNT(customers) WHERE created_at IN month_range` | E5 | ✅ Exists (count) | P0 |
| 11.3 | **Total Pelanggan Aktif** | `COUNT(DISTINCT customer_id OR customer_phone) FROM orders WHERE created_at IN month_range AND status != 'cancelled'` | E5, J4 | 🆕 New | P0 |
| 11.4 | **Pelanggan Returning** | Customers who ordered this month AND had previous orders before this month | E5 | 🆕 New | P0 |
| 11.5 | **Retention Rate** | `returning_this_month / active_last_month * 100` | E5, A8, J4 | 🆕 New (needs last month's customer set) | P1 |
| 11.6 | **Pelanggan Churned** | Customers who ordered last month but NOT this month — list with name, last_order_at, total_spent | E5 | 🆕 New (critical for reactivation) | P1 |
| 11.7 | **Customer Lifetime Value (CLV)** | `AVG(total_spent) FROM customers WHERE user_id = current_user AND total_orders > 0` | E5, A8 | 🆕 New (from customers table aggregates) | P2 |
| 11.8 | **Rata-rata Pesanan per Pelanggan** | `totalOrders / activeCustomers` for the month | E5 | 🆕 New (from existing data) | P1 |
| 11.9 | **Distribusi Frekuensi** | Histogram: X customers ordered 1x, Y ordered 2-3x, Z ordered 4+ times this month | E5 | 🆕 New (GROUP BY customer, then bucket counts) | P2 |
| 11.10 | **Sumber Akuisisi Pelanggan Baru** | For new customers this month, what was their first order's `source`? GROUP BY source | E6 | 🆕 New (cross-reference first order source) | P1 |

### Section 12: Produk Bulanan (Monthly Product Depth)

| # | Field Name (UI) | Technical Definition | UMKM Problem | Status | Priority |
|---|----------------|---------------------|--------------|--------|----------|
| 12.1 | **Produk Terlaris** (top 10) | Same as daily but for full month | B3 | ✅ Exists | P0 |
| 12.2 | **Produk Tidak Laku** | Products in catalog (`products` table, `is_available = true`) with 0 orders this month | E8, F2 | 🆕 New (LEFT JOIN products vs order items) | P1 |
| 12.3 | **Velocity Rata-rata per Produk** | For each top product: `SUM(qty) / operating_days` = units sold per day on average | B7, G6, G1 | 🆕 New (from existing data) | P1 |
| 12.4 | **Revenue Concentration Index** | `(top1_product_revenue / totalRevenue * 100)` — warn if >60% | I7 | 🆕 New (from existing data) | P1 |
| 12.5 | **Performa Kategori** | Revenue + qty GROUP BY product category (match via products table) | I7, B3 | 🆕 New (needs product-category join) | P2 |
| 12.6 | **Perubahan Ranking Produk** | Compare this month's top 10 ranking vs last month — show rank change arrows | D5, B3 | 🆕 New (needs last month's product ranking) | P2 |

### Section 13: Rincian Harian (Daily Breakdown — Enhanced)

| # | Field Name (UI) | Technical Definition | UMKM Problem | Status | Priority |
|---|----------------|---------------------|--------------|--------|----------|
| 13.1 | **Tabel Harian** | Per-day rows: date, orderCount, revenue, collected | D5, B8 | ✅ Exists | P0 |
| 13.2 | **Piutang per Hari** | Additional column: `SUM(total - paid_amount)` per day | B4 | 🆕 New (add column to existing table) | P1 |
| 13.3 | **Pesanan per Sumber per Hari** | Additional columns or breakdown: manual/link/WA count per day | D3, E6 | 🆕 New (add to daily breakdown query) | P2 |
| 13.4 | **Hari Terbaik Bulan Ini** | `MAX(revenue)` day highlighted in the table + called out as text | C8 | 🆕 New (derived from table data) | P2 |

### Section 14: Pola Waktu (Time Patterns — Monthly Only)

| # | Field Name (UI) | Technical Definition | UMKM Problem | Status | Priority |
|---|----------------|---------------------|--------------|--------|----------|
| 14.1 | **Hari Tersibuk** | `COUNT GROUP BY EXTRACT(DOW FROM created_at AT TIME ZONE 'Asia/Jakarta')` — show day name with highest count | D5, F3 | 🆕 New (from existing timestamps) | P1 |
| 14.2 | **Jam Tersibuk** | `COUNT GROUP BY EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Jakarta')` — show hour range with highest count | D3, F3 | 🆕 New (from existing timestamps) | P1 |
| 14.3 | **Weekend vs Weekday** | Compare avg orders Sat+Sun vs Mon-Fri | F3 | 🆕 New (derived from 14.1 data) | P2 |

### Section 15: Keuangan & Pajak (Monthly Only)

| # | Field Name (UI) | Technical Definition | UMKM Problem | Status | Priority |
|---|----------------|---------------------|--------------|--------|----------|
| 15.1 | **Omzet Kumulatif Tahun Ini (YTD)** | `SUM(total) WHERE status != 'cancelled' AND created_at >= Jan 1 of current year` | H6, A1, J4 | 🆕 New (needs cross-month query) | P2 |
| 15.2 | **Estimasi Pajak (PPh Final 0.5%)** | `YTD_revenue * 0.005` — shown if YTD > 0 | H6 | 🆕 New (derived from 15.1) | P2 |
| 15.3 | **Konsistensi Revenue** | Coefficient of variation: `STDEV(monthly_revenue) / AVG(monthly_revenue)` over available months. Low = consistent = credit-worthy | A8, J4 | 🆕 New (needs multi-month historical query) | P2 |

**Total Monthly Fields: 71 (52 daily + 19 monthly-specific)**

---

## Part 4: Complete Field Inventory — Analisis AI

### 4.1 Daily AI Analysis

#### Data Points to Send (Current + New)

**Currently sent:**
- Active order count (non-cancelled)
- Revenue: total, collected, per payment status (paid/partial/unpaid count + amount)
- Top 5 products (name, qty, revenue)
- New customer count
- Comparison: 7-day average (orders, revenue), same day last week (orders, revenue)

**New data points to add:**

| # | Data Point | Why AI Needs It |
|---|-----------|----------------|
| AI-D1 | **Order source breakdown** (manual/WA/link counts + revenue) | AI can comment on channel effectiveness: "75% pesanan dari Link Toko — channel ini paling efektif" |
| AI-D2 | **Piutang total + aging summary** (0-7d, 8-14d, 15-30d, 30d+ amounts) | AI can flag: "Ada Rp75.000 yang sudah lewat 30 hari dari Bu Ratna — segera kirim pengingat" |
| AI-D3 | **Returning vs new customer count** | AI can analyze retention: "80% pesanan hari ini dari pelanggan lama — basis pelanggan setia kamu bagus" |
| AI-D4 | **Collection rate %** | AI can benchmark: "Tingkat penagihan 67% — di bawah rata-rata minggumu 80%. Perlu follow-up" |
| AI-D5 | **Discount total given** | AI can flag if discounts are excessive: "Diskon hari ini Rp50.000 (10% dari revenue) — evaluasi apakah ini sustainable" |
| AI-D6 | **Late orders count** (past delivery date, not done) | AI can prioritize: "2 pesanan melewati tanggal kirim — prioritaskan hari ini" |
| AI-D7 | **Revenue concentration** (top product's % of total) | AI can warn: "70% revenue dari Nasi Box Ayam — pertimbangkan diversifikasi menu" |
| AI-D8 | **Stock alerts** (products with stock <10) | AI can recommend: "Stok Nasi Box tinggal 5 — siapkan bahan baku untuk besok" |
| AI-D9 | **Payment claims pending** (count of claimed but unverified) | AI can remind: "3 pelanggan sudah klaim Sudah Bayar — cek rekening dan konfirmasi" |

#### Expected AI Output — Daily (Enhanced)

```
FORMAT: 5-7 bullet points, each 1-2 sentences
LANGUAGE: Indonesian sederhana, tanpa jargon keuangan
TONE: Seperti teman bisnis yang memberikan insight

REQUIRED SECTIONS:
1. Ringkasan performa hari ini + perbandingan (existing)
2. Status pembayaran & piutang — WHO specifically needs follow-up (enhanced)
3. Produk insight — what's selling, concentration risk if any (enhanced)
4. Channel insight — mana yang paling efektif (NEW)
5. 1-2 action items spesifik untuk besok (existing, now data-enriched)

OPTIONAL (if relevant):
6. Stock alert — produk yang perlu di-restock (NEW)
7. Late order warning (NEW)
8. Payment claim verification reminder (NEW)
```

### 4.2 Monthly AI Analysis

#### Data Points to Send (Current + New)

**Currently sent:**
- All daily data points but for the month
- Top 5 customers (name, totalSpent, orderCount)
- Comparison: previous month (orders, revenue, growth %)

**New data points to add:**

| # | Data Point | Why AI Needs It |
|---|-----------|----------------|
| AI-M1 | **Customer retention rate** (returning / last month active) | AI can assess customer health: "Retention 78% — bagus! 22% pelanggan bulan lalu tidak kembali" |
| AI-M2 | **Churned customer list** (top 5 by total_spent who didn't return) | AI can name specific follow-ups: "Pak Budi (biasanya Rp500K/bulan) sudah tidak pesan — hubungi dia" |
| AI-M3 | **Revenue by source** (manual/WA/link totals + %) | AI can recommend channel strategy: "Link Toko menghasilkan 60% revenue — bagikan link lebih sering" |
| AI-M4 | **Piutang aging summary** | AI can escalate: "Rp200.000 piutang sudah >30 hari — 3 pelanggan perlu ditindak lanjuti segera" |
| AI-M5 | **Product ranking changes** (top 5 changes vs last month) | AI can spot trends: "Kue Lapis naik dari #5 ke #2 — permintaan meningkat, pertimbangkan tambah stok" |
| AI-M6 | **Peak day/hour** | AI can advise: "Jumat paling ramai (rata-rata 18 pesanan) — siapkan ekstra untuk Jumat depan" |
| AI-M7 | **Operating days + avg daily revenue** | AI can project: "Rata-rata Rp250K/hari × 20 hari operasional — proyeksi bulan depan Rp5jt" |
| AI-M8 | **YTD revenue + growth trend** | AI can motivate: "Omzet tahun ini sudah Rp15jt, growth 15%/bulan — jika terus, bisa capai Rp100jt tahun ini" |
| AI-M9 | **New customer acquisition by source** | AI can optimize: "8 dari 12 pelanggan baru dari Link Toko — fokus promosi di WA Status & bio IG" |
| AI-M10 | **Fulfillment rate + avg time** | AI can flag ops issues: "Tingkat penyelesaian 85% — 15% masih tertunda. Rata-rata waktu proses 2 hari" |

#### Expected AI Output — Monthly (Enhanced)

```
FORMAT: 4 sections, max 400 words total (up from 300)
LANGUAGE: Indonesian sederhana
TONE: Mentor bisnis yang mendukung

SECTIONS:
1. RINGKASAN
   - MoM comparison with specific numbers and %
   - Operating days, avg daily, projection (NEW)
   - Revenue consistency assessment (NEW)
   - Overall health verdict: "Bisnis kamu [sehat/perlu perhatian/waspada]"

2. PELANGGAN
   - Top spender appreciation (existing)
   - Retention rate + churned customer names (ENHANCED)
   - New vs returning ratio (NEW)
   - Specific customer follow-up recommendations (ENHANCED)

3. PRODUK
   - Top performers + ranking changes (ENHANCED)
   - Revenue concentration risk (NEW)
   - Slow movers / underperformers (NEW)
   - Category performance if available (NEW)

4. SARAN
   - 3-5 specific, actionable recommendations (ENHANCED)
   - Channel optimization advice (NEW)
   - Stock/supply planning for next month (NEW)
   - Pricing recommendations if data supports (NEW)
   - One stretch goal: "Bulan depan, coba..."
```

### 4.3 Questions the AI Should Answer for UMKM Owners

The AI analysis should implicitly answer these questions that UMKM owners have but can't articulate:

**Daily:**
1. "Hari ini bagus atau jelek?" → Comparison to 7-day average
2. "Siapa yang belum bayar?" → Piutang list with names
3. "Produk apa yang paling laku?" → Top items with context
4. "Apa yang harus saya lakukan besok?" → Specific action items
5. "Dari mana pesanan masuk?" → Source breakdown

**Monthly:**
1. "Bisnis saya berkembang atau menurun?" → MoM growth with %
2. "Pelanggan saya setia atau tidak?" → Retention rate + churned names
3. "Produk mana yang harus saya fokuskan?" → Revenue concentration + trends
4. "Berapa uang yang seharusnya sudah masuk?" → Collection rate + piutang
5. "Apa strategi bulan depan?" → Data-driven recommendations
6. "Bisnis saya layak ajukan kredit?" → Consistency metrics (later phase)

---

## Part 5: Export Enhancements

### 5.1 Daily Excel Export

**Current columns:**
| No. Pesanan | Pelanggan | Telepon | Item | Total (Rp) | Dibayar (Rp) | Sisa (Rp) | Status | Pembayaran |

**New columns to add:**

| Column | Source | Priority |
|--------|--------|----------|
| **Tanggal** | `created_at` formatted as DD/MM/YYYY HH:MM | P0 (missing!) |
| **Sumber** | `source`: Manual / Link Toko / WhatsApp | P1 |
| **Tanggal Kirim** | `delivery_date` formatted, or "-" | P1 |
| **Diskon (Rp)** | `discount` value | P2 |

**New: Summary sheet** (second tab in Excel):

| Metric | Value |
|--------|-------|
| Total Pesanan | {count} |
| Total Penjualan | {revenue} |
| Terkumpul | {collected} |
| Piutang | {outstanding} |
| Rata-rata Pesanan | {AOV} |
| Tingkat Penagihan | {collection_rate}% |
| Sumber: Manual / Link Toko / WA | {counts} |
| Produk Terlaris | {top 3 names} |
| Pelanggan Baru | {count} |

Priority: P1

### 5.2 Monthly Excel Export

**Current columns:**
| Tanggal | No. Pesanan | Pelanggan | Telepon | Total (Rp) | Dibayar (Rp) | Sisa (Rp) | Status | Pembayaran |

**New columns to add:**

| Column | Source | Priority |
|--------|--------|----------|
| **Sumber** | `source` | P1 |
| **Tanggal Kirim** | `delivery_date` | P1 |
| **Item Detail** | `items` JSONB formatted as text | P1 (currently missing in monthly!) |
| **Diskon (Rp)** | `discount` | P2 |

**New sheets to add:**

**Sheet 2: Ringkasan Bulanan**
- All monthly summary metrics (revenue, collected, piutang, AOV, collection rate, growth %)
- Payment status breakdown (count + amount)
- Source breakdown (count + amount)

**Sheet 3: Rincian Harian**
- The daily breakdown table (date, orders, revenue, collected, piutang)

**Sheet 4: Produk**
- Top products: name, qty, revenue, contribution %

**Sheet 5: Pelanggan**
- Top customers: name, phone, total_spent, order_count
- Piutang per customer

Priority: P1 (sheets 2-3), P2 (sheets 4-5)

### 5.3 WhatsApp Recap Message

**Current format (daily only):**
```
*{Nama Bisnis}* — {Tanggal}

Total Pesanan: {jumlah}
Pendapatan: Rp{total revenue}
Lunas: {jumlah lunas} · Belum bayar: {jumlah belum bayar}
Item terlaris: {top 3 items}
```

**Enhanced format (daily):**
```
*{Nama Bisnis}* — Rekap {Tanggal}

📊 *Ringkasan*
Pesanan: {count} ({growth_arrow}{growth%} dari kemarin)
Penjualan: Rp{revenue}
Terkumpul: Rp{collected} ({collection_rate}%)
Piutang: Rp{outstanding}

💰 *Pembayaran*
✅ Lunas: {count} · Rp{amount}
🟡 DP: {count} · Rp{amount}
🔴 Belum Bayar: {count} · Rp{amount}

🛒 *Produk Terlaris*
1. {name} — {qty} pcs · Rp{revenue}
2. {name} — {qty} pcs · Rp{revenue}
3. {name} — {qty} pcs · Rp{revenue}

📱 *Sumber Pesanan*
Link Toko: {count} · Manual: {count} · WA: {count}

_Dibuat dengan CatatOrder — catatorder.id_
```

Priority: P0 (add piutang + collection rate), P1 (add source + growth)

**New: Monthly WA message** (currently doesn't exist):
```
*{Nama Bisnis}* — Laporan {Bulan Tahun}

📊 *Ringkasan Bulan*
Total Pesanan: {count} ({growth_arrow}{growth%} dari bulan lalu)
Total Penjualan: Rp{revenue}
Terkumpul: Rp{collected} ({collection_rate}%)
Piutang: Rp{outstanding}
Rata-rata/hari: Rp{daily_avg}

👥 *Pelanggan*
Aktif: {count} · Baru: {new_count} · Returning: {returning_count}

🏆 *Pelanggan Teratas*
1. {name} — Rp{spent} ({orders} pesanan)
2. {name} — Rp{spent} ({orders} pesanan)
3. {name} — Rp{spent} ({orders} pesanan)

🛒 *Produk Terlaris*
1. {name} — {qty} pcs · Rp{revenue}
2. {name} — {qty} pcs · Rp{revenue}
3. {name} — {qty} pcs · Rp{revenue}

_Dibuat dengan CatatOrder — catatorder.id_
```

Priority: P0 (monthly WA send is a gap — daily has it, monthly doesn't)

### 5.4 PDF Report (Future — Credit-Ready)

A standardized PDF for bank/fintech credit applications (solves A1, J4, A7):

```
HEADER: CatatOrder — Laporan Keuangan Usaha
Business name, address, phone, period

SECTION 1: Identitas Usaha
- Nama usaha, pemilik, alamat, kontak
- Tanggal mulai menggunakan CatatOrder
- Total bulan data tersedia

SECTION 2: Ringkasan Keuangan ({period})
- Total omzet
- Total terkumpul
- Jumlah transaksi
- Rata-rata transaksi
- Jumlah pelanggan aktif

SECTION 3: Tren Bulanan (chart)
- Bar chart: monthly revenue for last 6-12 months
- Line chart: monthly order count

SECTION 4: Konsistensi Operasional
- Operating days per month
- Revenue consistency (CoV)
- Customer retention rate

SECTION 5: Detail Transaksi (last 3 months)
- Summary table per month

FOOTER: "Laporan ini dihasilkan otomatis oleh CatatOrder (catatorder.id)
         berdasarkan data transaksi aktual. Data tidak dapat dimanipulasi."
         + QR code to verify (future)
```

Priority: P2 (strategic, high-impact for credit access but complex to build)

---

## Part 6: Implementation Roadmap

### Wave 1: Quick Wins (1-3 days, existing data, simple calculations)

All items below require NO schema changes and minimal new queries. Mostly adding calculations to existing service results and rendering them in UI.

| # | Item | Where to Change | Effort | Impact | Solves |
|---|------|----------------|--------|--------|--------|
| W1.1 | **Fix: totalOrders excludes cancelled** | `recap.service.ts` line ~119, `report.service.ts` line ~181 — filter `status != 'cancelled'` before `.length` | 5 min | Bug fix | — |
| W1.2 | **Show Total Penjualan in daily recap** | `DailyRecap.tsx` — add row for `totalRevenue` (data already returned by service) | 10 min | High | B1, B2, B8 |
| W1.3 | **Calculate + show Piutang** | Service: `piutang = totalRevenue - collectedRevenue`. UI: Add prominent red row | 15 min | Very High | B4, B9 |
| W1.4 | **Calculate + show AOV** | Service: `aov = totalRevenue / activeOrderCount`. UI: Add row | 10 min | High | B3, A8 |
| W1.5 | **Calculate + show Collection Rate** | Service: `collectionRate = (collectedRevenue / totalRevenue * 100)`. UI: Add percentage | 10 min | Very High | B4, B9 |
| W1.6 | **Add Source Breakdown** | Service: `GROUP BY source` on the already-fetched orders array (in-memory). UI: New section with 3 counts | 30 min | Very High | D3, E1, E6 |
| W1.7 | **Show Discount Total** | Service: `SUM(discount)` from already-fetched orders. UI: Add row if > 0 | 10 min | Medium | B9 |
| W1.8 | **Show Cancelled Count + Value** | Service: filter cancelled from already-fetched orders. UI: Show if > 0 | 15 min | Medium | B9 |
| W1.9 | **Calculate Fulfillment Rate** | Service: `done / (total - cancelled - menunggu) * 100`. UI: Show percentage | 10 min | Medium | G8, F5 |
| W1.10 | **Calculate Cancellation Rate** | Service: `cancelled / total * 100`. UI: Show percentage | 10 min | Medium | B9, F2 |
| W1.11 | **Growth % indicator** | Port comparison logic from `/api/recap/analyze/route.ts` to recap service. UI: Arrow + % next to revenue | 45 min | Very High | D5, C8 |
| W1.12 | **Monthly WA send** | Add WA send section to `MonthlyReport.tsx` (copy from daily, adjust message format) | 30 min | High | — (feature parity) |
| W1.13 | **New customer names (not just count)** | Service: return customer names from the new-customer query. UI: List names | 15 min | Medium | E5 |

**Wave 1 total effort: ~3-4 hours**
**Impact: Transforms daily recap from 7 fields to 20+ fields**

### Wave 2: Medium Effort (1-2 weeks, needs new queries but data exists)

These require new database queries or cross-table joins but no schema changes.

| # | Item | What's Needed | Effort | Impact | Solves |
|---|------|-------------|--------|--------|--------|
| W2.1 | **New vs Returning customers** | Query: for each order's customer, check if `customers.created_at` is within today/this month OR before. Count each. | 2-3 hrs | Very High | E5, E6 |
| W2.2 | **Piutang Aging (monthly)** | Query: all unpaid/partial orders across all time, bucket by `NOW() - created_at`. Show 4 age buckets + per-customer breakdown | 3-4 hrs | Very High | B4 |
| W2.3 | **DP Follow-up List** | Query: partial-payment orders with customer name + remaining + days since creation. UI: Actionable list with WA button | 2-3 hrs | High | B4 |
| W2.4 | **Product Velocity** | Query: for each top product, get 7-day historical daily qty. Calculate avg. Compare to today | 3-4 hrs | High | B7, G6, G1 |
| W2.5 | **Stock Alerts** | Query: `products WHERE stock IS NOT NULL AND stock <= threshold AND is_available = true`. Show in recap | 1-2 hrs | High | B7, G6 |
| W2.6 | **Peak Days/Hours (monthly)** | Query: `GROUP BY DOW/HOUR` on month's orders. Show "Hari tersibuk: Jumat" / "Jam ramai: 10-12" | 2-3 hrs | Medium | D5, F3 |
| W2.7 | **Late Orders Alert** | Query: `orders WHERE delivery_date < NOW() AND status NOT IN ('done', 'cancelled')`. Show count + list | 1-2 hrs | High | F5 |
| W2.8 | **Revenue per Source** | Extend source breakdown to include `SUM(total) GROUP BY source` | 30 min | Medium | E6 |
| W2.9 | **7-day Trend Sparkline** | Query last 7 days' daily revenue. Render as simple SVG sparkline or mini bar chart | 3-4 hrs | High | D5, C8 |
| W2.10 | **Business Health Score** | Implement composite score: collection rate (30%) + volume vs avg (30%) + returning ratio (20%) + fulfillment rate (20%). Show badge | 2-3 hrs | High | B1, B4, C8 |
| W2.11 | **Retention Rate (monthly)** | Query: customers who ordered last month → check how many also ordered this month | 2-3 hrs | High | E5, A8, J4 |
| W2.12 | **Churned Customer List (monthly)** | From retention query: list those who DIDN'T return, with name + last_order_at + total_spent | 1-2 hrs | High | E5 |
| W2.13 | **Revenue Concentration Warning** | Calculate top product's % of total. Show warning badge if > 60% | 30 min | Medium | I7 |
| W2.14 | **Monthly Comparison in UI** | Show MoM % change for orders, revenue, collected next to each metric in monthly view | 2-3 hrs | High | B8, C8, D5 |
| W2.15 | **Enhanced AI Prompts** | Feed all Wave 1 + Wave 2 data to AI. Update prompt template with new data and output format | 3-4 hrs | Very High | All |
| W2.16 | **Excel Summary Sheet** | Add second tab to Excel export with summary metrics | 2-3 hrs | Medium | B1, A1 |
| W2.17 | **Customer Acquisition Source** | For new customers this month, find their first order's source. GROUP BY | 1-2 hrs | Medium | E6 |

**Wave 2 total effort: ~35-45 hours (1-2 weeks)**
**Impact: Comprehensive business intelligence dashboard**

### Wave 3: New Data / Strategic (1+ month)

These either need new data collection, complex calculations, or new features entirely.

| # | Item | What's Needed | Effort | Impact | Solves |
|---|------|-------------|--------|--------|--------|
| W3.1 | **Revenue Projection** | Linear regression or simple trend extrapolation from daily/monthly data. Show "Proyeksi bulan ini: RpX" | 4-6 hrs | High | B5 |
| W3.2 | **Prediksi Habis Stok** | Combine product velocity (W2.4) with `products.stock`. Calculate `stock / daily_velocity` = days to stockout | 3-4 hrs | High | B7, G6 |
| W3.3 | **Customer Lifetime Value** | Multi-month aggregation from `customers.total_spent` / months since first order. Requires enough historical data | 3-4 hrs | Medium | E5, A8 |
| W3.4 | **Lead Time / Fulfillment Speed** | `AVG(completed_at - created_at)` for done orders. Needs `completed_at` to be reliably set (currently nullable) | 2-3 hrs | Medium | F5, G8 |
| W3.5 | **Category Performance** | Match order item names to `products.category` via fuzzy/exact match. Aggregate by category | 4-6 hrs | Medium | I7, B3 |
| W3.6 | **Product Ranking Change** | Store previous month's product rankings, compare to current. Show arrows | 3-4 hrs | Medium | D5, B3 |
| W3.7 | **Seasonal Patterns (12-month)** | Query monthly revenue for past 12 months. Show chart + identify seasonal peaks | 4-6 hrs | Medium | F3, D5 |
| W3.8 | **Omzet YTD + Estimasi Pajak** | Cross-month query: SUM revenue Jan-now. Calculate 0.5% PPh Final estimate | 2-3 hrs | Medium | H6 |
| W3.9 | **Revenue Consistency (CoV)** | `STDEV(monthly_revenue) / AVG(monthly_revenue)` across available months | 2-3 hrs | Medium | A8, J4 |
| W3.10 | **PDF Credit Report** | Generate standardized PDF with business identity, financial summary, trend charts, consistency metrics | 2-3 weeks | Very High | A1, A7, J4 |
| W3.11 | **Multi-sheet Monthly Excel** | Excel with 5 sheets: orders, summary, daily breakdown, products, customers | 4-6 hrs | Medium | B1, A1 |
| W3.12 | **Payment Method Tracking** | New field on orders: `payment_method` (cash/QRIS/transfer/other). Needs schema migration + UI input | 1-2 weeks | Medium | D6 |
| W3.13 | **Delivery Date Adherence** | Compare `delivery_date` vs `completed_at` or `shipped_at`. Calculate on-time rate | 2-3 hrs | Medium | F5 |
| W3.14 | **Goal Setting & Tracking** | New table for monthly revenue/order goals. Compare actual vs target | 1-2 weeks | Medium | C8 |

**Wave 3 total effort: ~6-8 weeks**
**Impact: Credit-readiness, forecasting, advanced analytics**

---

## Part 7: Bugs & Issues in Current Implementation

### Bug 1: totalOrders Includes Cancelled Orders (HIGH)

**Location:** `recap.service.ts` (~line 119), `report.service.ts` (~line 181)
**Issue:** `totalOrders = ordersList.length` uses the full array which includes cancelled orders. However, revenue calculations explicitly skip cancelled orders. This creates an inconsistency: "15 pesanan" might include 2 cancelled, but revenue only reflects 13.
**Impact:** AOV would be wrong if calculated as `revenue / totalOrders`. Users see inflated order count.
**Fix:** `const activeOrders = ordersList.filter(o => o.status !== 'cancelled'); const totalOrders = activeOrders.length;`

### Bug 2: paidRevenue Semantic Confusion (MEDIUM)

**Location:** Both recap and report services
**Issue:** `paidRevenue` sums `order.total` for fully-paid orders, not the actual `paid_amount`. For fully-paid orders these are identical, so it's not mathematically wrong. But the naming `paidRevenue` suggests "amount paid" when it actually means "total value of orders that are paid."
**Impact:** Confusing for developers; could lead to wrong calculations if someone adds a feature expecting `paidRevenue` to be actual payments.
**Fix:** Rename to `paidOrdersTotal` or add a comment. Or change to `SUM(paid_amount) WHERE paid_amount >= total`.

### Bug 3: Daily Recap Missing totalRevenue Display (HIGH)

**Location:** `DailyRecap.tsx`
**Issue:** The service returns `totalRevenue` (gross billed amount) but the daily UI only shows `collectedRevenue` (Terkumpul). Monthly shows both. This means daily users can't see their total sales — only what's been collected.
**Impact:** UMKM owner doesn't know their actual daily sales volume. This is the most basic number a business needs.
**Fix:** Add "Total Penjualan: Rp{totalRevenue}" row above "Terkumpul" in daily recap.

### Bug 4: Monthly Report Has No WhatsApp Send (MEDIUM)

**Location:** `MonthlyReport.tsx`
**Issue:** Daily recap has a "Kirim ke WhatsApp" section; monthly does not. AI insights can be sent to WA, but raw monthly numbers cannot.
**Impact:** Monthly reporting is less shareable. UMKM owners who want to share monthly results with partners/investors can't easily do so.
**Fix:** Add WhatsApp send section to monthly report (copy pattern from daily, adjust message format).

### Bug 5: Top Customer Ranking by paid_amount, Label Says "Total Belanja" (LOW)

**Location:** `report.service.ts` (~line 153)
**Issue:** Monthly top customers are ranked by `SUM(paid_amount)` — actual amount paid. But the UI label says "Total Belanja" which implies total ordered. A customer with Rp2M in orders but Rp0 paid would rank last.
**Impact:** Minor — ranking by actual payment is arguably better. But the label is misleading.
**Fix:** Either change label to "Total Terbayar" or change ranking to use `SUM(total)`. Recommendation: keep the ranking by paid_amount (it's more useful) but fix the label.

### Bug 6: discount Field Completely Ignored (MEDIUM)

**Location:** Both recap and report services
**Issue:** Orders have a `discount` field, but no recap calculation references it. The `total` field already reflects `subtotal - discount`, so revenue numbers are technically correct. But sellers can't see "total diskon yang diberikan" — a critical metric for pricing strategy.
**Impact:** Sellers who give discounts can't track the total cost of those discounts over time.
**Fix:** Add `totalDiscount = SUM(discount) WHERE discount > 0` to both services. Show in UI if > 0.

### Bug 7: source Field Completely Ignored (HIGH)

**Location:** Both recap and report services + all UI components
**Issue:** Every order has a `source` field (manual/whatsapp/order_link) but this is NEVER surfaced in any recap view, export, or AI prompt. This is the single easiest way to measure Link Toko ROI.
**Impact:** Sellers have no visibility into which channels drive orders. They can't optimize marketing spend or effort.
**Fix:** Add `ordersBySource` count and revenue to both services. Show as new section in UI. Include in AI prompts. Add to Excel export.

### Bug 8: AI Analysis Receives Limited Data (MEDIUM)

**Location:** `/api/recap/analyze/route.ts`
**Issue:** AI only receives aggregated summary data (totals, top 5 items, new customer count). It doesn't receive: source breakdown, piutang aging, returning customer info, discount data, late orders, stock info, payment claims. This limits the AI's ability to give specific, actionable advice.
**Impact:** AI insights are generic rather than specific. "Ada 5 pesanan belum bayar" is less useful than "Bu Ratna belum bayar Rp75.000 sudah 3 hari — kirim pengingat."
**Fix:** Enrich AI data payload with all Wave 1 + Wave 2 metrics.

### Bug 9: Monthly Excel Missing Item Detail (LOW)

**Location:** Excel export for monthly report
**Issue:** Daily Excel includes an "Item" column with order item details. Monthly Excel does not include items — just totals.
**Impact:** Monthly Excel is less useful for detailed analysis or record-keeping.
**Fix:** Add "Item" column to monthly Excel export.

### Bug 10: No Stale-Data Indicator for Non-AI Recap (LOW)

**Location:** `DailyRecap.tsx`, `MonthlyReport.tsx`
**Issue:** The AI analysis has stale-data detection (compares snapshot vs current order count). But the main recap has no such indicator. If a user opens today's recap at 10am, then more orders come in, the recap shows stale data without any indication.
**Impact:** Minor — users can manually refresh. But could lead to decisions based on incomplete data.
**Fix:** Add a "Data terakhir diperbarui: {time}" label and/or auto-refresh mechanism.

---

*This document is the authoritative reference for rebuilding CatatOrder's rekap feature. All field names, calculations, and priorities should be used as specified. A developer should be able to implement any field directly from the technical definitions provided.*

*Compiled: 2026-03-10 | Sources: 1-data-inventory.md, 2-problem-data-mapping.md, 3-rekap-gap-analysis.md, rekap-feature-analysis.md*
