# Tokoflow Strategic Analysis

> Analisis mendalam per 7 April 2026 — CatatOrder vs Tokoflow, strategi produk, dan action plan untuk lead pertama (Ibu Clarice).

---

## 1. Konteks Situasi

### Lead Pertama
- **Nama**: Ibu Clarice (+62 813-1199-5099)
- **Domisili**: Pantai Indah Kapuk (PIK), Jakarta — area affluent
- **Source**: Google search → tokoflow.com
- **Intent**: Mau ketemu langsung untuk tanya-tanya Tokoflow untuk bisnisnya
- **Handler**: Ajie Rahayu (partner) via WhatsApp
- **Status**: Menunggu jadwal call/meeting

### Problem
- Marketing page Tokoflow menjanjikan fitur yang ~40-50% belum ada
- Tapi ada produk lain yang sudah mature: **CatatOrder** (v4.6.0, live, paying customers)
- Pertanyaan: tunjukkan yang mana? Bagaimana strategi terbaik?

---

## 2. Perbandingan Produk: CatatOrder vs Tokoflow

### Maturity Level

| Dimensi | CatatOrder | Tokoflow |
|---|---|---|
| Versi | v4.6.0 LIVE | Early stage (~v0.1) |
| Tech Stack | Next.js 16 + React 19 + TypeScript | Next.js 15 + JavaScript |
| API Routes | 99 endpoints | ~40 endpoints |
| Database | 28 tabel, 3470 baris migration | ~10 tabel |
| Mobile App | Expo React Native, published Play Store | Tidak ada |
| Payment | Midtrans QRIS working | Midtrans partial (no backend) |
| AI | Gemini (parse WA, insights, rekap) | Tidak ada |
| Cron Jobs | 5 (reminders, alerts, briefs) | 0 |
| Push Notifications | Ya (morning brief, milestones, alerts) | Tidak |
| Offline Mode | Ya (FIFO sync queue) | Tidak |
| Users | Real paying UMKM | Belum ada user |
| Revenue | Freemium Rp15K-99K/bulan | Belum ada |

### Posisi di Value Chain UMKM

```
SUPPLIER → BARANG MASUK → INVENTORY → COST SETUP → JUAL DI MARKETPLACE → ORDER MASUK → INVOICE → PIUTANG → PAJAK
           |_________________________ TOKOFLOW ________________________|  |_____________ CATATORDER ______________|
```

- **Tokoflow** = sisi SUPPLY/OPERATIONS (stok, biaya, fee marketplace, profit calculation)
- **CatatOrder** = sisi DEMAND/CUSTOMER (order masuk, invoice, piutang, pajak)
- **Bukan kompetitor — mereka puzzle pieces yang saling melengkapi**

---

## 3. Fitur Unik Masing-masing

### Hanya di CatatOrder (sudah production-ready)

1. **Customer order form** — link toko, WA paste dengan AI parsing, foto, voice input
2. **Customer management** — auto-create dari order, lifetime tracking (total orders, total spent)
3. **Invoice + e-Faktur** — formal invoice, PPN calculation, e-Faktur XML export ke Coretax
4. **Piutang (receivables)** — tracking utang customer, aging reports, overdue alerts
5. **Community + group buy** — buat komunitas UMKM, announcements, invite codes
6. **AI insights** — Gemini-powered daily/monthly analysis, decision rules, anomaly detection
7. **Mobile app** — Expo React Native, published di Google Play, offline-first
8. **Midtrans payment** — QRIS working, webhook reconciliation, plan activation
9. **Push notifications** — morning brief, milestone celebrations, stock alerts, death valley nudges
10. **Referral program** — 30% commission, signup bonus Rp5K, 6-month expiry
11. **Persiapan (production prep)** — delivery schedule, aggregated items per date
12. **Multiple order modes** — pre-order, dine-in, booking, langganan
13. **Pricing compass** — margin traffic light, peer benchmark, price suggestions
14. **Business health score** — 0-100 score gated after 3 months data
15. **Tax compliance** — PPN, PPh Final calculator, SPT summary, tax reminders
16. **WhatsApp integration** — 8 pre-built WA message templates, WA confirmation
17. **Quota system** — 50 free orders/month, credit packs, nudge psychology

### Hanya di Tokoflow (functional tapi early stage)

1. **Marketplace fee configuration** — set fee % per channel (Shopee, Tokopedia, TikTok Shop, dll)
2. **Detailed cost breakdown** — modal_cost + packing_cost + affiliate_percentage per produk
3. **Product compositions / bundle** — parent-component relationship, auto-deduct component stock
4. **Incoming goods management** — catat barang masuk, batch process, stock auto-update
5. **Stock adjustments** — koreksi manual dengan reason (opname/damage/lost/correction/return/sample), audit trail
6. **Per-transaction profit calculation** — revenue - (modal + packing) × qty - affiliate_cost - marketplace_fee = net_profit
7. **Sales history with channel analytics** — filter by channel/date/SKU, summary per channel (revenue, profit, margin %)
8. **Inventory monitoring** — status filtering (negative/low/normal), last movement timestamp

### Overlap (ada di keduanya)

1. **Product management** — CRUD produk, stock tracking (tapi struktur berbeda)
2. **Sales/order input** — manual entry (tapi flow berbeda)
3. **Dashboard** — overview metrics
4. **Reports** — rekap data historis, export
5. **Supabase backend** — auth, database, RLS (tapi instance terpisah)

---

## 4. Database Schema Comparison

### CatatOrder — 28 tabel

**Core:**
- `profiles` — user/merchant account dengan plan, quota, referral, tax settings, push token, quiet hours
- `orders` — customer orders (status pipeline: new→menunggu→processed→shipped→done→cancelled)
- `customers` — customer directory dengan lifetime stats (auto-recalculate via trigger)
- `products` — katalog produk (name, price, cost_price, stock, category, image)
- `invoices` — formal invoices dengan PPN, e-Faktur, payment terms, due date
- `receipts` — lightweight transaction records (legacy)

**Billing:**
- `plans` — subscription tiers (gratis/warung/toko/bisnis)
- `payment_orders` — Midtrans payment processing
- `transactions` — Midtrans transaction log
- `webhook_logs` — payment webhook audit

**Community:**
- `communities` — merchant communities/pasar
- `community_members` — membership tracking
- `community_announcements` — organizer→member announcements

**WhatsApp:**
- `wa_connections` — WA Business Account credentials
- `wa_sessions` — order collection state machine
- `wa_messages` — message audit log

**Analytics:**
- `events` — user action tracking
- `page_views` — store page visit tracking
- `product_views` — product-level analytics
- `ai_analyses` — cached AI insights

**Lookup:**
- `business_categories` — 28 categories (katering, bakery, elektronik, grosir, dll)
- `product_units` — units of measure (porsi, box, pcs, kg, dll)
- `cities`, `provinces` — Indonesian geography

**Counters:**
- `order_counters`, `receipt_counters`, `invoice_counters` — atomic sequential numbering

### Tokoflow — ~10 tabel

- `tf_products` — master produk (sku, name, stock)
- `tf_product_costs` — biaya per produk (modal_cost, packing_cost, affiliate_percentage)
- `tf_marketplace_fees` — fee % per channel
- `tf_sales_input` — staging table untuk input penjualan (pending→ok→processed)
- `tf_sales_transactions` — finalized sales dengan full financial calculation
- `tf_incoming_goods_input` — staging table untuk barang masuk
- `tf_incoming_goods` — finalized incoming goods records
- `tf_stock_adjustments` — manual stock correction audit trail
- `tf_product_compositions` — bundle/package definitions (parent_sku→component_sku)
- `v_products_with_costs` — view gabungan produk + biaya + full-text search

---

## 5. CatatOrder Business Model

### Pricing

| Tier | Harga | Fitur |
|---|---|---|
| Gratis | Rp 0 | 50 orders/bulan, semua fitur core |
| Isi Ulang Kecil | Rp 15.000 / 50 orders | Credit pack, never expires |
| Isi Ulang Besar | Rp 25.000 / 100 orders | Better value, never expires |
| Unlimited | Rp 39.000 / bulan | Unlimited orders |
| Bisnis (PKP) | Rp 99.000 / bulan | Unlimited + e-Faktur unlimited + SPT PPN + PPh calculator |

### Key Business Mechanics
- **No paywall on features** — semua fitur bisa diakses di free tier, hanya quota order yang terbatas
- **Nudge psychology** — soft warning di 40/50 orders, medium di 45, urgent di 48, hard stop di 50+
- **3rd pack promotion** — beli 3 pack dalam sebulan → otomatis unlimited sisa bulan itu
- **Referral** — 30% commission dari pembayaran referred user + Rp5K signup bonus
- **Community-driven distribution** — viral loop via link toko sharing, WA status, community invites

### Revenue Positioning
- vs GoFood/GrabFood: 0% commission (mereka 20-30%)
- vs POS (Moka, Majoo): designed for WA orders, bukan physical retail
- vs Accounting (Kledo Rp159K, Accurate Rp333K, Jurnal Rp450K): pesanan-first, bukan accounting-first

### Long-term Vision
Pesanan tercatat → Bisnis terlihat → Akses modal (Rp2.4T credit gap untuk UMKM Indonesia)

---

## 6. Analisis Strategis: Maintain 2 Produk vs Merge

### Kenapa TIDAK maintain 2 produk terpisah

| 2 Produk | 1 Produk |
|---|---|
| 2x bug fixes | 1x bug fixes |
| 2x database management | 1 Supabase project |
| 2x deployment & monitoring | 1 Vercel deployment |
| 2x security updates | 1 security surface |
| 2x customer support | 1 unified support |
| Brand confusion | 1 clear product |
| Tokoflow perlu rebuild: payment, auth, mobile, notif, dll | Sudah ada semua di CatatOrder |

**Membangun Tokoflow dari nol ke level CatatOrder = mengulang 40+ releases dan 3470 baris SQL migration. Tidak realistis untuk solo builder dengan 4 project paralel.**

### Apa yang terjadi kalau fitur Tokoflow di-port ke CatatOrder?

| Fitur Tokoflow | Jadi modul CatatOrder | Estimasi effort |
|---|---|---|
| Marketplace fees config | Setting fee % per channel → hitung saat order | Medium |
| Cost breakdown (modal/packing/affiliate) | Extend `products.cost_price` jadi multi-field | Medium |
| Product compositions | Tabel baru + auto-deduct komponen saat order | Medium |
| Incoming goods | Halaman baru `/barang-masuk` | Low-Medium |
| Stock adjustments | Halaman baru `/penyesuaian-stok` | Low |
| Profit calc per transaction | Extend order recap dengan cost breakdown | Medium |
| Channel analytics | Extend `/rekap` dengan channel breakdown | Low |

**Total: 2-4 minggu** untuk port semua fitur unik Tokoflow ke CatatOrder.

### Branding Options

| Strategi | Pro | Con |
|---|---|---|
| Tokoflow.com → redirect ke CatatOrder | SEO sudah jalan, bawa lead | Nama "CatatOrder" kurang cocok untuk inventory |
| CatatOrder rename jadi Tokoflow | Tokoflow branding lebih "pro" untuk retail | CatatOrder sudah punya users |
| Keep both names, 1 codebase | Tokoflow = entry retail, CatatOrder = entry F&B | Confusing long-term |
| Brand baru | Clean slate | Waste existing SEO & brand equity |

**Catatan:** CatatOrder `business_categories` sudah include: elektronik, grosir, toko-bangunan, sembako, konveksi, percetakan, rental — bukan hanya F&B. Secara teknis sudah support retail.

---

## 7. Rekomendasi: Strategi untuk Ibu Clarice

### Sebelum Meeting — Discovery Call

**Tujuan:** Pahami bisnis dia sebelum putuskan apa yang di-demo.

**Pertanyaan kunci:**
1. "Bisnis ibu di bidang apa?"
2. "Jualan di mana? Marketplace? Offline? WhatsApp?"
3. "Berapa banyak produk/SKU?"
4. "Apa masalah terbesar saat ini?" (stok kacau? susah hitung untung? order berantakan? piutang numpuk?)
5. "Pakai sistem apa sekarang?" (Excel? manual? software lain?)

### Decision Matrix

| Kalau bisnisnya... | Tunjukkan | Alasan |
|---|---|---|
| F&B / catering / makanan | CatatOrder | 100% ready, cocok sempurna |
| Online shop retail, multi-marketplace | CatatOrder + jelaskan inventory features coming soon | Lebih mature, jangan demo Tokoflow yang belum siap |
| Distributor / B2B | CatatOrder (invoice + piutang strongest) | Invoice dan piutang tracking sangat relevan |
| Toko fisik offline | CatatOrder | Order management + stok sudah ada |

### Script Approach

> "Bu Clarice, sebelum saya tunjukkan sistemnya, saya mau pastikan platform kami benar-benar cocok untuk bisnis ibu. Boleh ceritakan dulu tantangan utama yang ibu hadapi?"

Lalu demo hanya fitur yang relevan untuk masalahnya.

Soal fitur inventory yang lebih mendalam (kalau ditanya):
> "Kami sedang menambahkan modul inventory management yang lebih mendalam — cost tracking per produk, marketplace fee calculation, profit analysis per channel. Sebagai early adopter, ibu bisa influence fitur apa yang dibangun duluan."

### Pricing untuk Early Adopter

| Approach | Harga | Value |
|---|---|---|
| Free beta 3 bulan | Rp 0 | Real user, feedback, case study |
| Early adopter discount 70% | ~Rp 12K/bulan | Sedikit revenue + commitment |
| Lifetime discount | Rp 20K/bulan selamanya | Lock in customer |

**Rekomendasi:** Free 3 bulan, lalu diskon 50% setelahnya. Syarat:
- Aktif pakai dan kasih feedback
- Boleh jadi testimonial/case study (dengan izin)
- Prioritas fitur request

---

## 8. Action Plan

### Immediate (minggu ini)

| # | Action | Deadline |
|---|---|---|
| 1 | Discovery call Ibu Clarice — pahami bisnisnya | Sebelum meeting |
| 2 | Siapkan demo CatatOrder dengan sample data yang relevan | Sebelum meeting |
| 3 | Fix Tokoflow marketing page — hapus klaim false, tambah "Coming Soon" | Minggu ini |
| 4 | Siapkan early adopter package/offering | Sebelum meeting |

### Short-term (bulan ini)

| # | Action | Priority |
|---|---|---|
| 5 | Port marketplace fees config ke CatatOrder | High |
| 6 | Port cost breakdown (modal/packing/affiliate) ke CatatOrder products | High |
| 7 | Port incoming goods management ke CatatOrder | Medium |
| 8 | Port stock adjustments ke CatatOrder | Medium |
| 9 | Port product compositions ke CatatOrder | Medium |
| 10 | Extend CatatOrder rekap dengan profit breakdown per order | High |

### Medium-term (quarter ini)

| # | Action | Priority |
|---|---|---|
| 11 | Tokoflow.com → marketing funnel ke CatatOrder signup | Medium |
| 12 | Update CatatOrder onboarding untuk support retail categories | Medium |
| 13 | Channel analytics di CatatOrder dashboard | Medium |
| 14 | Evaluate branding strategy (1 nama vs 2 nama) | Low |

---

## 9. Kesimpulan

**CatatOrder adalah platform yang harus ditunjukkan ke Ibu Clarice.** Ini produk yang mature, punya payment working, mobile app, AI, dan sudah proven dengan paying customers.

**Tokoflow sebagai produk terpisah tidak sustainable** untuk solo builder. Fitur uniknya (marketplace fees, cost breakdown, compositions, incoming goods, stock adjustments) harus di-port ke CatatOrder sebagai modul baru.

**Tokoflow.com tetap dipertahankan** sebagai marketing funnel — SEO-nya sudah jalan (bawa lead dari Google). Tapi produk di belakangnya adalah CatatOrder.

**Yang membuat keputusan ini benar:**
- CatatOrder 28 tabel vs Tokoflow 10 tabel
- CatatOrder v4.6.0 vs Tokoflow v0.1
- CatatOrder punya payment, mobile, AI, community vs Tokoflow tidak punya semua itu
- Effort port fitur Tokoflow → CatatOrder: 2-4 minggu
- Effort bangun CatatOrder dari nol di Tokoflow: berbulan-bulan
- Solo builder dengan 4 project = harus consolidate, bukan spread

---

*Dokumen ini adalah living document. Update setelah discovery call dengan Ibu Clarice dan setelah keputusan branding diambil.*
