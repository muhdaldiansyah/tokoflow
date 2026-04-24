# Changelog — CatatOrder Web

> Version history for catatorder.id (Next.js web app)

---

## v4.2.0 — Architecture Transformation (2026-03-22)

Based on 36 evidence-based conclusions from behavioral science research.

- **Smart Defaults & Onboarding:** Setup 3-layar (tipe bisnis → 3 produk → link siap < 2 min). 8 tipe bisnis auto-configure mode, kapasitas, satuan. Auth redirect ke /setup untuk new users.
- **Komunitas / Pasar Mode:** communities + community_members tables. /komunitas/[slug] public page. /join/[code] shortlink. Auto-join on signup. Koordinator commission 30%. KAKIS 6/25 → 19/25.
- **Temporal Architecture:** 5 cron jobs — morning brief 06:00 WIB, death valley day 1-66, milestone (10-1000), monthly review, alerts (stock, capacity).
- **Progressive Disclosure:** Sidebar menu muncul by usage (3 → 7 menus).
- **Intelligence:** Decision rules — stock critical, source concentration, collection rate, revenue anomaly.
- **Meaning & Viral Loop:** Contribution framing, WA Status sharing, champion kit, time-saved tracking, social proof.
- **Landing Page:** Problem/vision story section, hero rewritten.
- **Migrations:** 067 (business_type), 069 (communities)

## v4.1.0 (2026-03-21)

- Receipt/struk removed from dashboard
- Mode System v2: 4-card picker (Pre-order, Langganan, Makan di Tempat, Booking)
- Booking mode: is_booking + booking_time fields
- Business categories expanded from 8 to 16
- Push notifications: Edge Function + DB trigger
- Middleware fix: proxy.ts → middleware.ts

## v4.0.0 (2026-03-21)

- Marketplace: /toko directory, /toko/[city] per-city pages, SEO
- Admin Panel: dashboard, user detail, analytics, mitra payout
- Performance: 15 static pages, CDN caching, AVIF/WebP, API cache, ~1,500 lines dead code removed
- WA Bot removed (0 orders in 5 weeks, Meta ban)

## v3.5.0

- API restructure: 85 functions moved to server-side API routes. ~50 new endpoints. Dual auth (Bearer + cookies).

## v3.4.0

- Bisnis (PKP) tier Rp99K/month. Invoice formal, e-Faktur XML (Coretax), PDF A4, piutang dashboard, laporan PPN.

## v3.3.0

- Pricing optimization: medium pack Rp25K/100 (decoy), unlimited raised to Rp39K, per-order price framing.

## v3.2.0

- Referral program: 30% commission, 6 months, auto-generated codes, mitra page.

## v3.1.0

- Dine-in mode: table number, customer optional, amber badge.

## v3.0.0

- Persiapan (production list), capacity limits, HPP/food cost, photo attachment (max 3), WA order confirmation, customer delete.

## v2.9.0

- Preorder mode (default ON), delivery date required, violet badge.

## v2.8.0

- Piutang aging, new vs returning customers, stock alerts, late order alerts.

## v2.7.0

- Enhanced rekap harian/bulanan, source breakdown, growth indicator, monthly WA send.

## v2.6.0

- Live order page (/r/[id]), "Sudah Bayar" claim, receipt image download, public order form improvements.
