# CatatOrder Target Market & Katering Flow Assessment

> Analysis of target market segments and product readiness for home-based food/katering UMKM

**Date:** 2026-03-11 · **Version:** v2.9.0

---

## Target Market Segments (Prioritized)

### Tier 1 — Go Here First

**Katering & kue rumahan (home-based food, pre-order model)**

- Preorder mode is already built and default ON
- High order volume, WA-native sales, recurring customers, delivery dates matter
- They literally do what CatatOrder is designed for
- Signal: sells via WA Status/groups, takes orders days in advance, has a price list

### Tier 2 — Expand Here Next

**Frozen food & sambal sellers**

- Similar to Tier 1 but simpler orders (fewer customizations)
- Product catalog fits perfectly, stock tracking matters (batch production)
- Signal: posts product photos on WA Status, takes bulk orders

### Tier 3 — Natural Adjacency

**Warung makan with delivery/pesanan**

- Daily order volume, needs debt tracking, benefits from recap
- Less preorder-oriented, more walk-in
- Signal: already uses GoFood/GrabFood, takes WA orders on the side

### Tier 4 — Later

**Laundry, jahit, jasa lainnya**

- Order tracking fits, but product language (items, harga, qty) needs adaptation
- Lower priority until core is proven

### Skip for Now

- **Toko kelontong** — inventory-focused, not order-focused. Different job
- **Level 0 digital readiness** — too expensive to acquire
- **Level 3 (already uses other tools)** — switching cost too high

---

## Digital Readiness Segmentation

| Level | Description | Strategy |
|-------|-------------|----------|
| **Level 0** | Only calls and basic WA (voice notes, no typing) | Skip — too expensive to acquire |
| **Level 1** | Active WA user, sends photos, uses groups | Entry point — needs hand-holding onboarding |
| **Level 2** | Uses some apps (GoPay, Shopee, basic banking) | Sweet spot — can self-serve with Link Toko |
| **Level 3** | Has tried other business tools | Secondary — may already have solutions |

---

## Katering Flow Assessment: What's Built vs What's Needed

### Current Flow (End-to-End)

```
Seller setup:
  /pengaturan → set slug, upload logo, add phone, upload QRIS
  /produk → add menu items (name, price, category, stock, unit, min qty, image)
  Preorder mode ON by default

Customer orders:
  catatorder.id/{slug} → browse category-grouped menu → select items
  → fill name, phone, delivery date (required) → submit
  → success page: order summary, receipt image download, "Hubungi Penjual via WA"

Seller manages:
  /pesanan → realtime notification on new order
  → swipe right to advance status (Baru → Diproses → Dikirim → Selesai)
  → swipe left to send WA message
  → edit: update payment (Lunas/DP/Belum Bayar), status, items

Payment tracking:
  Customer taps "Sudah Bayar" → seller gets realtime toast
  → seller verifies in bank → marks Lunas in dashboard
  → if unpaid: WA payment reminder template ready

Daily close:
  /rekap → total orders, revenue, piutang, AOV, payment breakdown
  → source breakdown (Manual/Link Toko/WhatsApp)
  → stock alerts, late delivery alerts
  → share via WA or export Excel
```

### Feature Readiness Matrix

| Katering Need | Status | Implementation |
|---|---|---|
| Customer orders days ahead | ✅ Done | Preorder mode ON by default, delivery date required (min=tomorrow) |
| Browse menu + order | ✅ Done | Category-grouped catalog grid, stock enforcement, min qty |
| Accept DP, collect balance later | ✅ Done | Lunas/DP/Belum Bayar toggle, `paid_amount` tracking |
| Track who owes what | ✅ Done | Piutang in daily recap, aging buckets in monthly, WA reminders |
| Manage stock (limited batch) | ✅ Done | `stock` field, auto-decrement, auto-unavailable at 0, "Sisa X" warning |
| Made-to-order items | ✅ Done | `stock=null` (unlimited) is the default |
| Process orders by status | ✅ Done | Baru → Diproses → Dikirim → Selesai, swipe-to-action |
| Late delivery alerts | ✅ Done | Red warning in daily recap for overdue orders |
| Customer confirms payment | ✅ Done | "Sudah Bayar" → `payment_claimed_at` → realtime toast to seller |
| Share order link | ✅ Done | `catatorder.id/{slug}`, shareable via WA |
| Daily/monthly reporting | ✅ Done | Full recap with piutang, AOV, source breakdown, AI insights, Excel |
| WA communication | ✅ Done | 6 templates: confirmation, reminder, preorder, payment claim |
| Downloadable receipt | ✅ Done | Canvas-generated PNG with items + QRIS + receipt URL |
| Multi-channel order capture | ✅ Done | Manual dashboard, Link Toko, WA bot — all tracked by source |
| Bulk order management | ✅ Done | Multi-select → bulk mark paid or bulk status update |
| Offline capability | ✅ Done | Network-first with IDB fallback, auto-sync on reconnect |
| Returning customer detection | ✅ Done | localStorage persists name+phone by slug on public form |

### Gaps (Not Blockers)

| Gap | Impact | Priority |
|-----|--------|----------|
| **No product variants** | Katering selling "Nasi Box" can't offer Ayam/Ikan/Vegetarian at different prices. Must create 3 separate products | Medium — workaround exists |
| **Piutang aging not in daily view** | Aging buckets (0-7d, 8-14d, etc.) only in monthly report. Owner won't see that Bu Yani's Rp500K is 15 days overdue from daily view | Low — monthly covers it |
| **No delivery batch view** | 20 orders for same delivery date can't be viewed as "today's deliveries" in one dedicated screen. Must filter by date | Low — date filter works |
| **No minimum order total** | Can enforce min qty per item, but can't set "minimum order Rp100,000" for whole order | Low — rare need at start |
| **No cost/margin tracking** | Revenue tracked but ingredient costs and profit margin aren't | Low — Phase 2 feature |
| **No recipe/ingredient tracking** | Stock is finished-goods only, no BOM | Low — too complex for now |

---

## Conclusion

**The product is ready for katering distribution.** All core workflows — preorder, payment tracking, piutang, stock management, multi-channel orders, WA communication, daily recap — are built and functional.

The gaps (variants, daily piutang aging, delivery batch view) are improvements, not blockers. A katering ibu can run her business on CatatOrder today:

1. Share `catatorder.id/{slug}` on WA Status
2. Customers browse menu, pick items, set delivery date, submit
3. Seller gets realtime notification, manages order in dashboard
4. Tracks payment: DP on order, balance on delivery, WA reminder for unpaid
5. End of day: recap shows revenue, piutang, orders by source

**The constraint is not features — it's finding the first 10 ibu katering to try it.**

### Next Steps (Distribution, Not Code)

1. Find one WA group of ibu-ibu katering/kue in one community
2. Personally onboard 10 sellers: set up their Link Toko, upload products, configure QRIS
3. Make daily recap shareable enough to trigger WA Status sharing (the referral loop)
4. Track: weekly retention, organic referral rate, orders per user per week
5. Don't build new features until 50 active users

---

*Last updated: 2026-03-11*
