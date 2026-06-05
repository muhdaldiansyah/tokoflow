# Rekap Gap Analysis: Current State vs Ideal UMKM Rekap

> What CatatOrder's rekap currently shows, what's missing, and what to build next

*Analyzed: 2026-03-10 | Based on: CatatOrder v2.6.0 codebase*

---

## A. Current State Audit

### A.1 Daily Recap (`DailyRecap.tsx` + `recap.service.ts`)

| # | Metric | What's Shown | Format | Calculation Correct? | Actionability |
|---|--------|-------------|--------|---------------------|---------------|
| 1 | Total Pesanan | Count of all orders (including cancelled) | Plain number | **Incorrect** — `totalOrders` = `ordersList.length` includes cancelled orders, but revenue excludes cancelled. Inconsistent: "15 pesanan" might include 2 cancelled ones, misleading revenue-per-order | Low — just a count |
| 2 | Terkumpul | Sum of `paid_amount` from non-cancelled orders | Rupiah | Correct | Medium — shows actual cash in hand |
| 3 | Lunas/DP/Belum Bayar | Revenue grouped by payment status (count + nominal) | Color-coded Rupiah (green/yellow/red) | **Quirk** — shows `paidRevenue` as order `total` (not `paid_amount`), so Lunas row shows the full total of fully-paid orders. Consistent but could confuse: "Lunas Rp400.000" means total of orders that are lunas, not the amount actually collected from them | Medium — identifies collection problem |
| 4 | Status Pesanan | Count per status (Baru/Menunggu/Diproses/Dikirim/Selesai/Dibatalkan) | List with counts, only non-zero shown | Correct | Low — operational snapshot only |
| 5 | Produk Terlaris | Top 10 products by revenue (qty x price) | Name + qty + revenue, sorted desc | Correct, case-insensitive grouping | Medium — helps stock planning |
| 6 | Pelanggan Baru | Count of new customers created today | Plain number | Correct (queries `customers.created_at`) | Low — just a count, no names or context |
| 7 | Penggunaan Kuota | `orders_used / orders_limit` with progress bar | Fraction + bar | Correct | Low — billing concern, not business insight |

**Actions available:** Download Excel, Send to WhatsApp, AI Analysis.

### A.2 Monthly Report (`MonthlyReport.tsx` + `report.service.ts`)

Everything in daily recap **plus:**

| # | Metric | What's Shown | Format | Calculation Correct? | Actionability |
|---|--------|-------------|--------|---------------------|---------------|
| 8 | Total Penjualan | Sum of `total` from non-cancelled orders | Rupiah (muted color) | Correct | Medium — shows gross sales |
| 9 | Cancelled Count | Number of cancelled orders | Count (shown if > 0) | Correct | Low — just a count |
| 10 | Pelanggan Teratas | Top 10 customers by `paid_amount` sum | Ranked list: name, phone, totalSpent, orderCount | **Note** — ranks by actual amount paid, not total ordered. Good for identifying best-paying customers, but different from "biggest orderer" | High — identifies VIP customers |
| 11 | Rincian Harian | Daily breakdown table | Table: date, orders, revenue, terkumpul + totals footer | Correct | Medium — shows trends visually |

**Actions available:** Download Excel, AI Analysis. No WhatsApp send for monthly (unlike daily).

### A.3 AI Analysis (`/api/recap/analyze/route.ts` + `AIInsights.tsx`)

| Aspect | Daily | Monthly |
|--------|-------|---------|
| Data sent to AI | Orders, revenue, payment breakdown, top 5 items, new customers | Same + top 5 customers |
| Comparison | 7-day avg + same day last week | Previous month (orders + revenue) |
| Output format | 5 bullet points max | 4 sections: Ringkasan, Pelanggan, Produk, Saran |
| Max length | ~5 sentences | 300 words |
| Cache | `ai_analyses` table, keyed by period | Same |
| Stale detection | Compares `totalOrders` in snapshot vs current | Same |
| Share | Send to WA via WAPreviewSheet | Same |

**Key observation:** AI analysis is the most "actionable" part of the rekap, but it only receives aggregated summary data — not raw order details, customer history, or product trends across multiple periods.

### A.4 Excel Export

| Daily | Monthly |
|-------|---------|
| Per-order rows: order number, customer, phone, items, total, paid, remaining, status, payment | Same + date column |

**Missing from exports:** No summary/totals row, no charts, no payment aging, no product breakdown sheet.

---

## B. What's Missing — Category by Category

### B.1 Revenue & Profitability Gaps

| Gap | What's Missing | Current State | Impact |
|-----|---------------|---------------|--------|
| **Gross revenue not shown daily** | Daily recap shows "Terkumpul" (collected) but not "Total Penjualan" — monthly has both, daily doesn't | Daily only shows collected, making total invisible | High — seller doesn't see full sales picture |
| **Net revenue (after discount)** | `discount` field exists on orders but is completely ignored in all recap calculations | Revenue numbers don't reflect discounts given | Medium — if discounts used, revenue is overstated |
| **Revenue growth rate** | No % change shown in UI (only in AI prompt) | User must mentally compare yesterday/last week | High — trend awareness is critical for UMKM |
| **Average Order Value (AOV)** | Not calculated anywhere | Easy: `totalRevenue / totalOrders` | High — key business health metric |
| **Revenue per customer** | Not shown | Could derive from existing data | Medium — measures customer value |
| **Revenue per product (contribution %)** | Product list shows revenue but not % of total | Missing context of "how much does this product matter" | Medium — helps prioritize |
| **Collection rate** | Not calculated: what % of billed amount is actually collected | Must mentally compute from Terkumpul vs Total | High — critical cash flow metric |
| **Outstanding amount (piutang)** | Not explicitly shown as a single metric | Must add up DP remaining + unpaid | High — UMKM's #1 cash flow pain |

### B.2 Payment & Cash Flow Gaps

| Gap | What's Missing | Current State | Impact |
|-----|---------------|---------------|--------|
| **Total piutang (receivables)** | No single "Rp X belum masuk" number | User sees Lunas/DP/Belum Bayar separately, must calculate | High — this is THE number UMKM owners ask about |
| **Payment aging** | No "overdue 7/14/30 days" analysis | Orders have `created_at` but no aging analysis | High — piutang macet is problem B4 |
| **Payment claim tracking** | `payment_claimed_at` exists but not in recap | Customer claimed "Sudah Bayar" but seller hasn't verified | Medium — reduces fraud risk |
| **Cash flow trend** | No visual of cash collected over time | Daily breakdown exists monthly but no mini-chart | Medium — pattern recognition |
| **DP completion tracking** | No list of "which DP orders need follow-up" | DP shown as aggregate count/amount only | High — actionable follow-up list |
| **Payment method breakdown** | No data on how customers pay (QRIS vs cash vs transfer) | Not tracked in current schema | Low — needs new data field |

### B.3 Product Intelligence Gaps

| Gap | What's Missing | Current State | Impact |
|-----|---------------|---------------|--------|
| **Slow movers** | Only top 10 shown, no "bottom products" | Products rarely ordered are invisible in recap | Medium — helps menu optimization |
| **Product mix change** | No comparison "Nasi Box was #1 last week, now #3" | Top items shown without trend context | Medium — catches demand shifts |
| **Stock depletion forecast** | Products have `stock` field, but no "days until stockout" | Stock only managed on product page | Medium — prevents missed sales |
| **Revenue concentration** | No "80% of revenue from 2 products" warning | Top items shown flat, no Pareto analysis | High — business risk awareness |
| **Category performance** | Products have `category` field but recap doesn't group by it | Categories completely absent from recap | Medium — higher-level product view |
| **Product-customer matrix** | No "which customers buy which products" | Data exists in orders but not cross-referenced | Low — advanced analytics |
| **Average price point** | No average selling price across all items | Not calculated | Low — pricing intelligence |

### B.4 Customer Intelligence Gaps

| Gap | What's Missing | Current State | Impact |
|-----|---------------|---------------|--------|
| **New vs returning ratio** | Daily shows "new customers" count but not returning | Can't see if revenue comes from repeat buyers | High — retention is 5x cheaper than acquisition |
| **Customer retention/churn** | No "customers who ordered last month but not this month" | Not tracked | High — churn awareness |
| **Purchase frequency** | Top customers show order count, but no avg frequency | Monthly shows orders per customer but not days-between | Medium — identifies buying patterns |
| **Recency analysis** | No "last ordered X days ago" for at-risk customers | `last_order_at` exists in `customers` table but unused | Medium — reactivation targeting |
| **Customer acquisition by source** | Orders have `source` (manual/whatsapp/order_link) but recap doesn't show | Completely invisible: how are customers finding you? | High — channel effectiveness |
| **Customer lifetime value** | Not calculated | Could estimate from `total_orders` + `total_spent` on customers table | Medium — prioritizes VIP treatment |
| **Order frequency distribution** | No "X customers ordered once, Y ordered 2-3 times" | Not shown | Medium — identifies loyalty tiers |

### B.5 Operational Efficiency Gaps

| Gap | What's Missing | Current State | Impact |
|-----|---------------|---------------|--------|
| **Order source breakdown** | `source` field (manual/whatsapp/order_link) exists but ignored in recap | Seller can't see "how many orders came from link toko" | High — validates marketing investment |
| **Fulfillment rate** | No % of orders completed vs total | Status counts shown but not as a rate | Medium — operational health |
| **Cancellation rate** | Monthly shows cancelled count, daily doesn't highlight it | No % or trend | Medium — quality signal |
| **Time to fulfill** | Orders have `created_at` and `completed_at`/`shipped_at` but not analyzed | No SLA tracking | Low — matters more at scale |
| **Peak hours/days** | Order timestamps exist but no time-of-day analysis | Not tracked | Medium — staffing/prep planning |
| **Delivery date adherence** | `delivery_date` field exists but not compared to actual completion | Not tracked | Medium — customer satisfaction |
| **Menunggu → activated** | How many menunggu orders eventually became real orders? | Not tracked | Low — quota system feedback |

### B.6 Growth & Trend Gaps

| Gap | What's Missing | Current State | Impact |
|-----|---------------|---------------|--------|
| **Week-over-week comparison** | Only AI gets comparison data; UI shows no WoW/MoM | User sees absolute numbers only | High — trends matter more than absolutes |
| **Growth rate visualization** | No arrows, badges, or % indicators | Flat number display | High — instant trend recognition |
| **Projection/forecast** | No "at this rate, you'll do Rp X this month" | Data exists for simple linear projection | Medium — goal setting |
| **Milestone tracking** | No "you've hit 100 orders!" or "first Rp1M month!" | Not tracked | Low — motivation/engagement |
| **Best day ever / record** | No personal bests or records | Not tracked | Low — motivation |
| **Moving averages** | No 7-day or 30-day moving average | Not calculated | Medium — smooths daily noise |
| **Seasonality awareness** | No day-of-week patterns shown | Data exists but not analyzed | Medium — prep planning |

### B.7 Business Health Score

| Gap | What's Missing | Current State | Impact |
|-----|---------------|---------------|--------|
| **Overall health indicator** | No "bisnis kamu sehat/perlu perhatian" signal | Multiple metrics shown separately without synthesis | High — UMKM needs simple verdict |
| **Risk signals** | No automated alerts for concerning patterns | AI analysis covers some of this, but only on-demand | High — proactive warning |
| **Opportunity signals** | No "customer X hasn't ordered in 14 days, follow up" | Not tracked | Medium — revenue recovery |
| **Collection efficiency score** | No single "tingkat penagihan: 75%" | Must compute mentally | High — core cash flow metric |

---

## C. Priority Matrix

### High Impact + Easy (existing data, simple calculation)

| # | Gap | Data Source | Effort |
|---|-----|-----------|--------|
| 1 | **Total piutang (outstanding receivables)** | `SUM(total - paid_amount)` for non-cancelled, non-paid orders | 1 line calc |
| 2 | **Average Order Value** | `totalRevenue / totalOrders` (exclude cancelled) | 1 line calc |
| 3 | **Collection rate %** | `collectedRevenue / totalRevenue * 100` | 1 line calc |
| 4 | **Gross revenue on daily recap** | Already calculated (`totalRevenue`), just not shown | Add 1 row to UI |
| 5 | **Order source breakdown** | `GROUP BY source` on orders query (manual/whatsapp/order_link) | 5-line service addition |
| 6 | **Growth % indicator** | Compare with previous period (logic exists in AI route) | Port comparison to UI |
| 7 | **New vs returning customer ratio** | Cross-reference order `customer_phone` with `customers.created_at` | ~10 line query |
| 8 | **Revenue concentration warning** | Top item revenue / total revenue — if > 60%, flag it | 3-line calc |
| 9 | **Discount total** | `SUM(discount)` from orders — field exists but unused | 1 line calc |
| 10 | **Fulfillment rate** | `done / (total - cancelled - menunggu) * 100` | 2-line calc |

### High Impact + Moderate (existing data, needs new query/UI)

| # | Gap | What's Needed |
|---|-----|-------------|
| 11 | **Payment aging (piutang macet)** | Query unpaid/partial orders, bucket by days since `created_at`: 0-7d, 8-14d, 15-30d, 30d+ |
| 12 | **DP follow-up list** | Filter orders where `payment_status = 'partial'`, show customer + remaining amount |
| 13 | **Customer retention** | Compare this month's unique customers vs last month's; flag "churned" (ordered last month, not this) |
| 14 | **Peak hours/days** | Extract hour/day-of-week from `created_at`, aggregate counts |
| 15 | **Week-over-week chart** | Store/query last 4 weeks of daily data, render as mini sparkline or bar chart |
| 16 | **Category performance** | Group product revenue by `category` field |
| 17 | **Business health score** | Composite of: collection rate, order trend, cancellation rate, customer retention |
| 18 | **Monthly WA send** | Monthly recap currently has no "Kirim ke WhatsApp" like daily does |

### Medium Impact + Easy

| # | Gap | What's Needed |
|---|-----|-------------|
| 19 | **Cancellation rate** | `cancelled / total * 100` — already have the data |
| 20 | **Average items per order** | `SUM(item counts) / totalOrders` |
| 21 | **Revenue per customer (avg)** | `totalRevenue / unique customers` |
| 22 | **Product count sold** | How many distinct products sold today |
| 23 | **Slow movers** | Products in catalog not ordered in last 7/30 days |

### Medium Impact + Hard (needs new data or significant work)

| # | Gap | What's Needed |
|---|-----|-------------|
| 24 | **Time to fulfill** | Need consistent `completed_at` tracking; currently nullable |
| 25 | **Delivery date adherence** | Need to compare `delivery_date` vs actual ship/complete |
| 26 | **Revenue forecast** | Linear regression or simple trend extrapolation for month-end projection |
| 27 | **Customer lifetime value** | Multi-month aggregation from `customers.total_spent` / `total_orders` |
| 28 | **RFM segmentation** | Recency + Frequency + Monetary scoring across customer base |
| 29 | **Stock turnover / days to sell** | Track stock changes over time (needs stock movement log) |

### Low Impact (nice to have)

| # | Gap | What's Needed |
|---|-----|-------------|
| 30 | Payment method breakdown | New field needed on orders |
| 31 | Product-customer matrix | Cross-join analysis, complex UI |
| 32 | Milestone achievements | New tracking table + notification system |
| 33 | Personal records / best days | Historical max tracking |
| 34 | Export with charts/summary | Enhanced xlsx generation |
| 35 | Credit-ready financial report | Standardized format for bank submissions |

---

## D. Quick Wins vs Long Term

### Quick Wins (can ship in 1-2 days, existing data only)

**Service layer additions (recap.service.ts + report.service.ts):**

1. Add `totalRevenue` display to daily recap UI (data already exists, just hidden)
2. Calculate `piutang` = `totalRevenue - collectedRevenue` and show as prominent metric
3. Calculate `aov` = `totalRevenue / activeOrderCount`
4. Calculate `collectionRate` = `(collectedRevenue / totalRevenue * 100).toFixed(0) + '%'`
5. Add `ordersBySource` count: `{ manual: N, whatsapp: N, order_link: N }`
6. Show `discount` total (field exists on orders, unused in recap)
7. Add growth % indicator by porting comparison logic from AI route to recap service
8. Count returning customers: orders where `customer_phone` matches a customer with `created_at` before today
9. Add cancellation rate and fulfillment rate
10. Show monthly WA send (parity with daily)

**UI additions (DailyRecap.tsx + MonthlyReport.tsx):**

1. Add "Piutang" row with red highlight under Pendapatan
2. Add "Rata-rata Pesanan" (AOV) row
3. Add "Tingkat Penagihan" percentage
4. Add "Sumber Pesanan" section (manual/WA/Link Toko with counts)
5. Add growth arrow/badge next to revenue (up/down vs yesterday or last week)

### Medium Term (1-2 weeks, needs new queries + UI components)

1. **Payment aging section:** Bucket unpaid orders by age (0-7d, 8-14d, 15-30d, 30d+) with drill-down to order list
2. **DP follow-up list:** Actionable list of partial-payment orders with "Kirim Pengingat" button
3. **Customer insights section:** New/returning ratio, top churned customers, average frequency
4. **Mini revenue chart:** 7-day or 30-day sparkline in daily recap showing trend
5. **Category performance:** Revenue grouped by product category
6. **Business health badge:** Simple Sehat/Perlu Perhatian/Waspada based on composite metrics
7. **Enhanced AI prompts:** Feed more data (source breakdown, aging, customer retention) for richer AI insights
8. **Peak analysis:** "Hari tersibuk: Senin" / "Jam ramai: 10-12"

### Long Term (1+ month, strategic features)

1. **Credit-ready reports:** Standardized financial summary for bank/fintech credit applications (solves J4, A1)
2. **Revenue forecasting:** "Proyeksi bulan ini: RpX" based on daily run-rate
3. **RFM customer segmentation:** Auto-categorize customers for targeted marketing
4. **Comparative dashboards:** Side-by-side month comparison with highlighted deltas
5. **Stock intelligence:** Turnover rates, reorder alerts, demand forecasting
6. **Automated alerts:** Push notification when collection rate drops, revenue dips, or customer churns
7. **Goal setting:** "Target bulan ini: Rp5M" with progress tracking

---

## E. Notable Bugs & Inconsistencies Found

1. **`totalOrders` includes cancelled orders in daily recap** — `recap.service.ts` line 119 uses `ordersList.length` (all orders), but revenue calculations on lines 73-97 skip cancelled. Monthly report also uses `orders.length` (line 181) which includes cancelled. This means "15 pesanan" could include cancelled ones, making revenue-per-order misleading.

2. **`paidRevenue` semantic confusion** — In both services, `paidRevenue` is the sum of `order.total` for fully-paid orders, not the actual `paid_amount`. So "Lunas: Rp400.000" means "total value of orders that are lunas" — not "amount received from lunas orders." These happen to be the same for fully paid orders, but the naming is potentially confusing when read alongside `collectedRevenue` (which IS actual `paid_amount`).

3. **Daily recap missing `totalRevenue` in UI** — The service calculates `totalRevenue` and returns it, but `DailyRecap.tsx` only shows `collectedRevenue` (Terkumpul). Monthly shows both. This is a missed quick win — the data is already there.

4. **Monthly report has no WhatsApp send** — Daily recap has a WA send section; monthly does not. The AI insights can be sent to WA, but the raw monthly numbers cannot.

5. **Customer top spenders ranked by `paid_amount`, not `total`** — In `report.service.ts` line 153: `existing.totalSpent += paidAmount`. This means a customer with Rp2M in orders but Rp0 paid would rank below someone with Rp500K fully paid. This is arguably correct (rank by actual payment) but the label "Total Belanja" suggests total ordered.

6. **Discount field completely ignored** — Orders have a `discount` field, but neither recap service references it. If sellers give discounts, the "total" already reflects it (subtotal - discount = total), so revenue numbers are correct. But sellers can't see "total diskon yang diberikan bulan ini" — useful for pricing strategy.

7. **`source` field completely ignored** — Every order has `source` (manual/whatsapp/order_link) but this is never surfaced in any recap view. This is the single easiest way to measure Link Toko ROI.

---

## F. Recommendations Summary

### Top 5 priorities for next iteration:

1. **Show piutang as a headline metric** — This is THE number UMKM owners lose sleep over. One calculation: `totalRevenue - collectedRevenue`. Show it prominently in red at the top of every recap.

2. **Add order source breakdown** — "12 dari Link Toko, 3 manual" instantly validates whether Link Toko is working. Zero-effort insight from existing data.

3. **Show growth % vs previous period** — An up/down arrow with percentage next to revenue. The comparison logic already exists in the AI analysis route; port it to the main UI.

4. **Payment aging for monthly report** — Bucket unpaid/DP orders by age. This transforms "5 belum bayar" (abstract) into "2 lewat 30 hari, perlu ditindak" (actionable).

5. **Average Order Value** — Single division, massive insight. "Rata-rata Rp50.000 per pesanan" helps sellers think about upselling.

### Design principle for all additions:

Every metric added should pass the **"Terus kenapa?"** test — if the seller sees this number, do they know what to DO about it? If not, pair the metric with a suggested action or link to the relevant feature (e.g., piutang → link to unpaid orders filter, churn → link to customer list sorted by last order).

---

*Analysis based on: DailyRecap.tsx, MonthlyReport.tsx, recap.service.ts, report.service.ts, /api/recap/analyze/route.ts, AIInsights.tsx, order.types.ts*
