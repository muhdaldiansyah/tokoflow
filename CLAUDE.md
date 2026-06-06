# Tokoflow

> **We handle the receipts. Not the recipes.**
> *"Resi kami urus. Resep kamu."*
> Tokoflow handles mechanical residue (admin, payment matching, invoicing, status updates) invisibly via Background Twin. Customer relationships stay merchant-controlled, amplified by Foreground Assist that suggests but never sends. Pure craft is protected — Tokoflow never enters the kitchen.
> Forked from CatatOrder (ID) · Next.js 16 · React 19 · TypeScript · Supabase · Tailwind 4.

> **🇮🇩 INDONESIA DEPLOYMENT (2026-06-05).** Tokoflow is the **Indonesia** deployment of the Kedaiflow (Malaysia) codebase. The codebase keeps Kedaiflow's multi-country **country axis** (`lib/country/resolve.ts`, `MY | ID`) but **defaults to ID** — currency IDR (Rp), payment **Midtrans** (QRIS/GoPay/OVO/DANA/ShopeePay/VA), e-invoice **e-Faktur Coretax**, tax **PPN** (0/11/12%), NPWP/NIB/PKP, badan usaha **PT**, phone **+62**, timezone **WIB**. The Malaysia path (Billplz / MyInvois / SST / RM) remains in the tree but **dormant**. See the `2026-06-05 · Indonesia localization` changelog entry below. ⚠️ **Much of the strategy/positioning prose in this file and `docs/` is still Malaysia-context** (target market, Sdn Bhd, RM pricing, BM/Manglish AI prompts) and is pending an Indonesia rewrite — treat market/strategy claims here as MY-legacy until rewritten.

**Domain:** https://tokoflow.co.id (primary, ID) · deploys to the `tokoflow` Vercel project
**Target Year 1:** Indonesia — UMKM / home-based & small sellers (toko online, F&B rumahan, jasa lokal). Segment hypotheses inherited from the Kedaiflow MY playbook (IKS/manufacturer credibility-first + mompreneur order-chaos-first) need re-validation for the ID market.
**Status:** Phase 1 + Phase 2 + Year-2 scaffolds code **complete** · Background Twin (`/api/twin/*`) + Foreground Assist (`/api/assist/*`) + Photo Magic v1 + Repeat Order live · `/store` directory active · **111 migrations** applied on the **Tokoflow Supabase project `yhwjvdwmwboasehznlfv`** (schema reset + full re-apply 2026-06-05; 110 = country default → ID, 111 = Indonesia provinces/cities + Bahasa labels) · Pre-launch — gated on **Midtrans account + KYB**, **e-Faktur/Coretax credentials**, full **Bahasa Indonesia UI copy pass** (UI currently English/MY-legacy), and ID market validation.

> **Strategic compass:** [`docs/positioning/`](./docs/positioning/) is the bible — read [`00-manifesto.md`](./docs/positioning/00-manifesto.md) before any product decision. Every feature must pass **Test 0** (hits one of Three-Tier Reality: Pure Craft / Customer Relationship / Mechanical Residue) + the 5 tests below it.

> **Execution synthesis:** [`docs/SYNTHESIS-2026-05-05.md`](./docs/SYNTHESIS-2026-05-05.md) is the field-applied playbook derived from bible v1.2. Contains: locked decisions (sub-niche, framing arc, distribution thesis), strategic analog mapping (Owner.com + Klaviyo + Substack inheritance), Phase 0 8-week plan with 7 pre-committed triggers (6 kill + 1 rebrand-flag), backup B2B playbook for scenario (c). Refresh after Phase 0 retrospective.

---

## Three-Tier Reality (root product framework)

Hari setiap solo maker terbagi 3, bukan 2. Setiap fitur Tokoflow harus hit one of these tiers (Test 0):

| Tier | What it is | Tokoflow's role | Architecture |
|---|---|---|---|
| **Tier 1 — Pure Craft** | What merchant loves (baking, design, writing) | Protect — never enter | (no surface) |
| **Tier 2 — Customer Relationship** | What merchant often values (Pak Andi loyalty, school moms WA, custom orders) | Amplify with suggestions, never replace | Foreground Assist (suggests, merchant sends) |
| **Tier 3 — Mechanical Residue** | Admin, payment match, invoice, status, repetitive Q&A | Remove invisibly | Background Twin (autonomous) |

> **Internal naming**: "Background Twin", "Foreground Assist", "Three-Tier", "Tier 3" are precision terms for engineering + strategy. **Customer-facing UI must NEVER expose these.** Use "Tokoflow" or first-person *"saya urus"*. See [`04-design-system.md` Internal Architecture Names](./docs/positioning/04-design-system.md).

---

## Wedges (refined 2026-04-28)

1. **The Photo Magic v1 (Phase 1, planned):** foto → AI **extract** inventory + pricing metadata. **Photo itself stays untouched** — kitchen-protection: photo IS part of merchant's craft and brand, we don't regenerate or beautify. See [`P4-photo-magic-plan.md`](./docs/positioning/P4-photo-magic-plan.md).
2. **Real moat (4-dimensional)**: **(a)** unstructured input parsing (WA chat screenshots, voice notes, mixed e-wallets) where competitors require structured forms · **(b)** Bahasa-first conversational UX (Manglish, code-switch BM/EN/Mandarin) · **(c)** compliance silent (gated to Pro+, never visible Free tier) · **(d)** buyer experience (storefront from photo + conversational order flow). AI labor is the underlying enabling shift; the moat is what we build on top.
3. **AI-native (shipped):** paste WA chat → order, voice → order, screenshot → order. Gemini 3.5 Flash via OpenRouter (model id centralized in `lib/ai/model.ts` with a `gemini-2.5-flash` fallback). MY SMB vocab, +60 phones, Asia/Kuala_Lumpur.
4. **Community data (shipped, density-gated):** peer benchmark live at `/api/benchmark` (≥10 users/cluster gate). Group-buy pooling deferred to Phase 4.
5. **Silent superpower — LHDN MyInvois (demoted to Pro/Business gated):** one-tap submit at `/invoices`. **Not Phase 1 hero.** SST RM 500K threshold means most home F&B mompreneur Year 1 don't hit. Surfaces only when merchant approaches threshold. See [`01-positioning.md`](./docs/positioning/01-positioning.md) for full anti-positioning + refuse list.

## What Tokoflow REFUSES to do (positioning weapon)

Restraint > capability messaging. Tokoflow **never**:
1. DM customer atas namamu (relationship is yours)
2. Set harga produkmu (judgment is yours)
3. Auto-reply review/komplain (voice is yours)
4. Post ke social media (brand is yours)
5. Regenerate/beautify foto produk (craft is yours)
6. Klaim ownership customer (data tetap milikmu)
7. Otomatisasi respon emosional (judgment kamu, draft kami)
8. Gamify dengan streak/badge (anti-anxiety)
9. Jual data kamu (never)
10. Lock kamu di platform (cancel 1-tap, ekspor data full)

Full list in [`00-manifesto.md` What We REFUSE to Do](./docs/positioning/00-manifesto.md#what-we-refuse-to-do-added-2026-04-28).

---

## Country axis — Tokoflow (ID, active) vs the dormant MY path

Tokoflow runs the **ID** side of `lib/country/resolve.ts`. The "MY path" column is the
**dormant** Malaysia config (kept in-tree, never the active deployment).

| Dimension | Tokoflow — **ID (active)** | MY path (dormant) |
|---|---|---|
| Currency | **IDR — `Rp`** (no fractional) | MYR — `RM` |
| Locale / TZ | **id-ID · WIB**, quiet hours 21:00–05:00 | en-MY · MYT, 22:00–06:00 |
| Payment | **Midtrans Snap** (QRIS / VA / GoPay / OVO / DANA / ShopeePay) — `lib/payment/midtrans-adapter.ts` · static QRIS upload (zero setup) | Billplz — `lib/payment/billplz-adapter.ts` |
| Tax | **PPN** (0 / 11 / 12%) · NPWP / NIB / PKP · PKP threshold Rp 4.8 M/yr | SST 0/6% · TIN / BRN |
| e-Invoice | **e-Faktur / Coretax** — `lib/einvoice/efaktur-adapter.ts` (submit flow = follow-up) | LHDN MyInvois — `lib/myinvois/` |
| Pricing | **Gratis / Pro Rp 99.000 / Business Rp 199.000** (`pricing_tiers`, country-keyed) | Free / RM 49 / RM 99 |
| Cities | **38 provinces + 88 cities** (migration 111) | 16 states + 44 cities (migration 080, deactivated) |
| Phone | **+62** (`lib/utils/phone.ts`, default ID) | +60 |
| Couriers | JNE / J&T / SiCepat / AnterAja / Ninja Xpress / Pos Indonesia / TIKI / Lion Parcel (`lib/utils/courier.ts`) | Pos Laju / Ninja Van / GDEX |
| Copy | **Bahasa Indonesia** (marketing + customer flow; dashboard core still EN) | English |
| Marketplace (Shopee/TikTok) | **Dropped** (was in old Tokoflow; archive branch only) | — |

Everything country-coupled flows through `resolveCountry()` — no `if (country === …)`
outside `lib/country/`. Lineage: CatatOrder (ID) → Tokoflow → Kedaiflow (MY) → Tokoflow (ID).

---

## Database schema

All 109 migrations (000 baseline + 001–109) live on the Tokoflow Supabase project (`emcuvtqafisspsefsoiy`, **Singapore region** `ap-southeast-1`). Re-provisioned fresh 2026-05-18 during Tokoflow→Tokoflow rebrand; old Tokoflow project (`yhwjvdwmwboasehznlfv`, Mumbai) holds only 3 test users / 10 orders and is being left dormant. Migrations 081–098 are post-bible-v1.2 additions: 081 service-role grants, 082 orders undo window, 083 payment_notifications, 084 drop unique-code constraint, 085 new-order email notify, 086 merchant Billplz keys, 087 order_payments, 088 customer delivery ack, 089 unify money columns to NUMERIC(14,2), 090 JSONB shape CHECKs, 091 standalone FK index on `orders.assigned_staff_id`, 092 phase_0_* tracking tables, 093 photo_magic columns, 094 country_axis, 095 cities_country (slug→id bug fixed in same session — see Recent strategic passes 2026-05-18), 096 country_pricing_and_gateway, 098 delivery metadata (`delivery_address`, `tracking_number`, `courier_name`).

### Phase 2 additions (this session)

**Migration 077 — MY tax + MyInvois schema**
| Table | New columns |
|---|---|
| `profiles` | `brn`, `tin`, `sst_registration_id`, `myinvois_client_id`, `myinvois_client_secret_enc`, `default_sst_rate`. Quiet-hours defaults → MYT 22:00–06:00. |
| `customers` | `tin`, `sst_registration_id`, `brn` |
| `invoices` | `sst_rate`, `sst_amount`, `myinvois_submission_uid`, `myinvois_uuid`, `myinvois_long_id`, `myinvois_status`, `myinvois_submitted_at`, `myinvois_validated_at`, `myinvois_errors`, `buyer_tin`, `buyer_brn`, `buyer_sst_id`, `requires_individual_einvoice` |
| `payment_orders` | `billplz_bill_id`, `billplz_collection_id`, `billplz_url`, `billplz_paid_at` |

**Migration 078 — seller-side MY tax snapshot**
| Table | New columns |
|---|---|
| `invoices` | `seller_tin`, `seller_brn`, `seller_sst_registration_id` (captured at invoice-issue time for audit + PDF). |

**Migration 079 — staff accounts + order assignment**
| Table | Columns |
|---|---|
| `staff` (new) | `id`, `user_id` (owner FK), `name`, `phone`, `role` (`owner`\|`assistant`), `active` · RLS scoped to owner |
| `orders` | `assigned_staff_id` FK, `assigned_at` |

**Migration 080 — MY localization for lookup tables**
| Table | Change |
|---|---|
| `business_categories` | Relabelled 16 ID rows to MY-English (`Catering & Nasi Box`, `Kopitiam & Food Stall`, …); added 8 service categories (`tailor`, `kosmetik`, `laundry`, `rental`, `elektronik`, `otomotif`, `pendidikan`, `desain`). 24 active rows. |
| `product_units` | Relabelled 10 ID units (`porsi`→`pax`, `loyang`→`tray`, `gelas`→`glass`, `lembar`→`sheet`, `batang`→`stick`); added 7 (`set`, `cup`, `carton`, `litre`, `package`, `session`, `hour`). 17 active rows. |
| `provinces` | Seeded 16 MY states + federal territories (KL, Selangor, Penang, …). Sort order surfaces Klang Valley first. |
| `cities` | Seeded 44 MY cities mirroring (now-deleted) `config/my-cities.ts`, joined to `provinces` via FK. |

### Session additions (2026-05-20)

**Migration 101 — order_status_logs**
| Table | Columns |
|---|---|
| `order_status_logs` (new) | `id`, `order_id` FK → orders, `from_status`, `to_status`, `changed_by` FK → auth.users, `changed_by_name` (snapshot), `changed_at` · RLS owner-scoped via orders.user_id |

Fire-and-forget insert from `/api/orders/[id]/status` (single) + `/api/orders/bulk/status` (batch). `changed_by_name` snapshot means no join needed if profile names change later. `StatusTimeline` component in `features/orders/components/` renders dot-line timeline (newest-first) inside the ORDER STATUS section of the edit form.

**Migration 102 — fulfillment mode**
| Table | New columns |
|---|---|
| `profiles` | `delivery_enabled BOOLEAN NOT NULL DEFAULT false`, `pickup_enabled BOOLEAN NOT NULL DEFAULT true` |

Corrective migration sets `delivery_enabled = true` for all rows where `preorder_enabled = true` (Scheduled merchants were implicitly offering delivery before this migration). Settings UI redesigned from a single 2-button toggle (Pre-order/Walk-in) into two sections: **TIMING** radio (Scheduled / On-demand) + **FULFILLMENT** conditional checkboxes (Scheduled → Delivery + Pickup; On-demand → Pickup + Dine-in). Switching timing auto-clears incompatible fulfillment; at least one fulfillment always stays enabled. PublicOrderForm: shows a fulfillment picker (Delivery / Pickup selector) when merchant enables both; delivery address field is conditional on delivery being selected (or delivery-only mode). `public-order.service.ts` exposes `deliveryEnabled` + `pickupEnabled`.

### Core tables (inherited)

| Table | Key columns |
|---|---|
| `profiles` | `orders_used`, `order_credits`, `unlimited_until`, `slug`, `order_form_enabled`, `preorder_enabled`, `delivery_enabled`, `pickup_enabled`, `bisnis_until`, `referral_code`, plus MY tax fields |
| `communities` + `community_members` + `community_announcements` | Community infra (group-buy pooling still deferred) |
| `orders` | `order_number` (CO-YYMMDD-XXXXXX), `items` JSONB, `subtotal/discount/total`, `paid_amount`, `delivery_date`, `is_preorder`, `status`, `source`, `assigned_staff_id` |
| `customers` | `name`, `phone` (unique per user), `total_orders`, `total_spent`, MY tax fields |
| `products` | `name`, `price`, `category`, `is_available`, `stock`, `unit`, `cost_price` |
| `invoices` | `invoice_number` (INV-YYYY-XXXX), seller/buyer snapshots, MY tax + MyInvois tracking |
| `invoice_counters` | `(user_id, year)` PK — atomic sequential |
| `ai_analyses` | Cached AI recap insights |
| `payment_orders` + `transactions` | Billplz billing |

### Key DB functions

`check_order_limit`, `increment/decrement_orders_used`, `add_order_pack`, `add_order_pack_with_credits`, `activate_unlimited`, `activate_bisnis`, `generate_order/invoice/receipt_number`, `recalculate_customer_stats` (trigger), `increment_referral_commission`, `decrement_product_stock`, `generate_community_invite_code`.

### Legacy-column status

Columns from CatatOrder still present for compat (dropped in a future migration):
- `profiles.npwp`, `profiles.nitku`, `profiles.wp_type`, `profiles.wp_registered_year`
- `invoices.ppn_rate`, `invoices.ppn_amount` — every write path mirrors sst_rate/sst_amount to these columns
- `invoices.seller_npwp`, `invoices.seller_nitku`, `invoices.buyer_npwp`, `invoices.trx_code`
- `customers.npwp`

Every service and API route accepts the new MY field names and writes them alongside the legacy columns, so the drop is safe whenever it happens.

---

## Project structure

```
app/
├── (marketing)/             # /, /features, /pricing, /blog, /about, /contact, /store, /store/[city], /community/[slug], /mitra, /coba-aplikasi
├── (auth)/                  # /login, /register, /forgot-password, /reset-password
├── (onboarding)/setup/      # Business type → products → link ready
├── (public)/order/[slug]/   # Customer order form → /[slug] via rewrite (next.config.ts)
├── (public)/r/[id]/         # Public receipt page
├── (dashboard)/             # orders, products, customers, prep, report (was recap — 301 from /recap + /rekap in middleware), invoices, community, tax, settings, profil, laporan, pengingat, pembayaran
├── (admin)/                 # Internal admin: phase-0 (dashboard + interviews + distribution + smoke-test), ai-test, users, registrations, lookup, mitra, analytics
├── join/[code]/             # Community invite shortlink
└── api/                     # ~115 routes + 5 cron jobs
    ├── billing/             # Billplz payments + webhook
    ├── invoices/[id]/myinvois-{submit,status,cancel}/  # Pro-plan LHDN submit
    ├── invoices/sst-summary/         # Monthly SST summary (RMCD SST-02 helper)
    ├── tax/summary/                  # Annual revenue + SST + MyInvois stats
    ├── staff/ + orders/[id]/assign/  # Phase 2 staff + assignment
    ├── orders/[id]/status/           # Status change + fire-and-forget order_status_logs insert
    ├── orders/bulk/status/           # Bulk status change + batch log insert
    ├── public/order-history/         # Past-orders lookup (endpoint kept, NOT surfaced on order form — removed for privacy: phone numbers get reused)
    ├── public/orders/[id]/upload-proof/  # Customer payment screenshot upload → payment-proofs bucket (private) → signed URL appended to image_urls
    ├── public/orders/[id]/verify-phone/ # Phone verification gate — POST {phone} → compares against orders.customer_phone, rate-limited 10/hr/IP
    ├── twin/payment-match/           # Background Twin — Tier 3 autonomous payment matcher
    ├── assist/reply-draft/           # Foreground Assist — Tier 2 reply suggestions (drafts only)
    ├── customers/[id]/reorder/       # Repeat order shortcut (Klaviyo customer-ownership)
    ├── onboarding/photo-magic/{persist}/  # Photo Magic v1 demo + auth persist
    └── admin/phase-0/{interviews,distribution,smoke-test,export}/  # Phase 0 validation tooling

features/{orders,customers,products,billing,report,receipts,referral,invoices,staff,tax,auth,onboarding}/
lib/
├── ai/twin-prompts.ts       # ACTIVE — production prompts (PAYMENT_MATCH, CUSTOMER_MEMORY, REPLY_DRAFT, PATTERN_DETECTION) + callTwinAI helper with 20s timeout, AI usage propagation
├── billplz/                 # ACTIVE — types, client, verify
├── myinvois/                # ACTIVE — types, generate-json, client
├── copy/index.ts            # Microcopy library — empty/error/loading/confirm/success/empathy templates + jargon-free labels (per docs/positioning/04)
├── pdf/generate-invoice.ts  # EN + TIN/BRN/SST + MyInvois UUID ref
├── utils/quiet-hours.ts     # Shared MYT quiet-hours boundary check across morning-brief, alerts, engagement crons
└── supabase/, voice/, offline/, utils/

config/{plans.ts, categories.ts, category-defaults.ts, site.ts, navigation.ts}
scripts/phase-0/             # MyInvois + Billplz sandbox spikes + merchant interview + ai-cost measurement + distribution README + backup-b2b playbook
supabase/migrations/         # 000 (baseline) + 001–109 (all applied to live Supabase)
middleware.ts                # Legacy-route 301s (pesanan→orders etc. + /baru→/new leaf)
docs/
├── positioning/             # Strategic compass — start with 00-manifesto.md
├── MECE-PROBLEM-TREE.md     # Causal problem tree (locked 2026-05-23) — 8 problems in 3 layers + 1 barrier, demand sequencing, segment playbooks, messaging hierarchy
├── SYNTHESIS-2026-05-05.md  # Execution playbook — Phase 0 plan + 7 pre-committed triggers + backup B2B
└── CHANGES-2026-05-06.md   # Overnight build diary (26 features + 11 audit-fix bugs)
```

Subpath renames: `/orders/new` (was `/pesanan/baru`), `/products/new`, `/invoices/new`, `/community/new`.
Legacy paths: `/pembayaran` (payment result), `/pengingat` (reminders), `/profil`, `/laporan` — kept as-is for now (not in the rename map).

---

## Integrations

> **Indonesia (ACTIVE):** payment = **Midtrans** (`lib/payment/midtrans-adapter.ts`, selected
> by the country axis — `getPaymentGateway(ctx)` returns midtrans for ID; needs `MIDTRANS_SERVER_KEY`)
> + static **QRIS** upload (merchant uploads in Profile, customer scans + uploads proof, AI receipt
> triage assists). e-invoice = **e-Faktur / Coretax** (`lib/einvoice/efaktur-adapter.ts`; the invoice
> *submit* flow is still MyInvois-shaped — a documented follow-up). The Billplz / MyInvois / ToyyibPay /
> CHIP material below is the **dormant MY path**, kept for reference.

### Payment architecture — MY 4-level roadmap (DORMANT · decided 2026-05-22)

> MY-legacy. For Indonesia, payment is Midtrans (above). The 4-level Billplz/ToyyibPay/CHIP
> roadmap applies only to the dormant Malaysia deployment.

Payment smoothness has four levels. Current code supports Level 1 + Level 2 (Billplz only). Roadmap toward Level 4.

| Level | Flow | Merchant setup | Status |
|---|---|---|---|
| **1** | Static DuitNow QR — customer scans, manual verify | Upload QR image | **Live (fallback)** |
| **2** | Gateway checkout — FPX + eWallet in-browser, auto-confirm via webhook | Merchant's own gateway account | **Live (Billplz only)** |
| **3** | ToyyibPay added alongside Billplz — IC-only registration, no business reg needed, supports TNG/ShopeePay/GrabPay/Boost | IC registration (~24-48h) | **Planned (next gateway)** |
| **4** | Sub-merchant model — Tokoflow as marketplace operator, merchant enters bank account only, funds route directly to merchant (zero fund-holding, no MSB risk) | Bank account number only | **Post-Sdn Bhd KYB** |

**ToyyibPay status — requires verification before building:**
- CLAUDE.md previously stated IC-only, but internal research doc (`docs/malaysia-market/05-pembayaran.md`) lists ToyyibPay as "MY biz required"
- Conflict unresolved — **verify at toyyibpay.com/register before implementing**
- If IC-only confirmed: implement ToyyibPay (2-3 days, ~70% Billplz reuse) as bridge to Level 2 for Phase 0 merchants
- If Sdn Bhd required: ToyyibPay becomes redundant — skip directly to Level 4 via CHIP sub-merchant post-Sdn Bhd
- ToyyibPay is NOT the long-term answer regardless — Level 4 sub-merchant supersedes it

**Sub-merchant model (Level 4, post-Sdn Bhd) — correct long-term architecture:**
- **CHIP (chip-in.asia)** or Billplz marketplace tier as operator platform
- Tokoflow registers once as marketplace operator — each merchant enters bank account number only (zero gateway registration friction)
- Customer pays → gateway routes funds directly to merchant's bank — Tokoflow never holds funds
- No MSB (Money Services Business) license risk — gateway handles regulatory compliance
- Enables marketplace commission split (D-018 Stage 3+): direct orders 0%, marketplace-attributed 2-3%
- Tokoflow has full payment visibility → Background Twin payment matching works end-to-end
- Architecture equivalent to Toast/Square/Shopify Payments
- **CHIP preferred**: modern API (Stripe-like), fastest onboarding (~1 day), no setup/annual fee, BNM-licensed
- See [`docs/ops/sdn-bhd-roadmap.md`](./docs/ops/sdn-bhd-roadmap.md) for full incorporation + gateway sequence

### Billplz (payment — MY path, DORMANT; ID uses Midtrans)

- `lib/billplz/` — zero-SDK adapter: `types.ts`, `client.ts`, `verify.ts`, `index.ts`
- Merchant redirects to Billplz-hosted payment page. No Snap popup, no client SDK.
- Webhook verifies HMAC-SHA256 X-Signature with timing-safe comparison.
- Wired at `/api/billing/payments` (create bill) + `/api/billing/webhook` (state changes → plan activation + referral commission).
- Env: `BILLPLZ_API_KEY`, `BILLPLZ_COLLECTION_ID`, `BILLPLZ_X_SIGNATURE_KEY`, `BILLPLZ_BASE_URL` (optional).

### ToyyibPay (payment — PLANNED, next gateway to implement)

- IC-only registration at toyyibpay.com — no business registration required. ~24-48h approval.
- Supports FPX + DuitNow QR + TNG eWallet + ShopeePay + GrabPay + Boost — wider coverage than Billplz.
- API pattern: `POST /index.php/api/createBill` → returns `{ BillCode }` → payment URL `https://toyyibpay.com/{BillCode}`.
- Webhook: `billCallbackUrl` receives `refno`, `billcode`, `status` (1=success), `transaction_id`.
- Merchant keys: `userSecretKey` + `categoryCode` (2 fields vs Billplz 3 fields).
- Architecture: `lib/toyyibpay/` adapter (copy Billplz pattern) + `/api/public/orders/toyyibpay-callback/route.ts` webhook handler.
- Settings page: ToyyibPay section alongside existing Billplz section.

### MyInvois (tax — MY path, DORMANT; ID uses e-Faktur/Coretax)

- `lib/myinvois/` — UBL 2.1 JSON builder + OAuth client_credentials + submit/status/cancel/reject.
- `features/invoices/services/myinvois-adapter.ts` — bridges DB invoice → MyInvois document (proportional discount allocation, walk-in buyer fallback, >RM 10K rule detection).
- Routes: `/api/invoices/[id]/myinvois-{submit,status,cancel}` — Pro-plan gated, idempotent, 72h cancel window enforced. Submit is **one-tap from UI**, not automatic on paid.
- Supplier state codes via `MY_STATE_CODES` in `lib/myinvois/generate-json.ts`.
- Env: `MYINVOIS_CLIENT_ID`, `MYINVOIS_CLIENT_SECRET`, `MYINVOIS_BASE_URL` (defaults preprod in dev), `MYINVOIS_IDENTITY_BASE`.

### Supabase

- Project ref: `yhwjvdwmwboasehznlfv` (**the Tokoflow project** — schema reset + 111 migrations re-applied 2026-06-05, defaults to country=ID). The Kedaiflow project `emcuvtqafisspsefsoiy` (Singapore) is the **separate Malaysia deployment** — do NOT write to it from Tokoflow.
- `site_url`: `https://tokoflow.com` · `uri_allow_list`: tokoflow.com + www + localhost:3000 + localhost:3101
- **Google OAuth enabled** (client ID in vault + in Supabase auth config). Consent screen is in **Testing** mode — add beta testers to the Test users list until the app is published.
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- No auth users yet · 0 rows across tables · 5 storage buckets (order-images, payment-proofs, product-images, profile-photos, qris-codes) re-created by migrations.

### Gemini 3.5 Flash (AI)

- Via OpenRouter. **Model id centralized in `lib/ai/model.ts`** (`AI_TEXT_MODELS`, passed as the OpenRouter `models` fallback array — primary `google/gemini-3.5-flash`, fallback `google/gemini-2.5-flash`). Used across all 6 AI features: `/api/recap/analyze`, `/api/voice/parse`, `/api/image/parse`, `/api/onboarding/photo-magic`, `/api/orders/[id]/verify-proof-ai`, and the twin/assist helper (`lib/ai/twin-prompts.ts`). Image generation (`lib/ai/product-image.ts`) is a separate model (`gemini-2.5-flash-image`).
- System prompts written for Malaysian SMB context — Malay + English + Manglish examples, +60 phone formats, Asia/Kuala_Lumpur timezone.
- Env: `OPENROUTER_API_KEY`. AI cost ~RM 2.65/merchant/month at 50 orders (Phase-0 dry-run at 3.5-flash, PASS_AMPLE under the ≤RM 25 gate; run `scripts/phase-0/ai-cost/measure.ts --full` for exact).

---

## Code patterns

- **Service layer:** `fetch("/api/...")`, return null/[] on error. Zero direct Supabase in UI.
- **API routes:** `getAuthenticatedClient(req)` — dual auth: Bearer (mobile) → cookies (web). Destructure as `{ supabase, user }`.
- **Components:** `"use client"`, `useState`, toast via `sonner`.
- **Customer auto-create:** Upsert on order. Phone match first, then name ilike. Stats auto-synced by trigger.
- **Payment derivation:** `derivePaymentStatus()` — paid_amount vs total.
- **Validation:** Items (name non-empty, price ≥ 0, qty ≥ 1), quota (402), delivery dates, slug, storage.
- **View/edit separation:** `/orders/[id]` read-only (redirects to edit), `/orders/[id]/edit` mutations. `/invoices/[id]` detail, `/invoices/[id]/edit` mutations.
- **Modals:** Bottom-sheet for destructive actions (no `confirm()`).
- **Search:** 300ms debounce on all lists.
- **WA messages:** 8 builders in `lib/utils/wa-messages.ts`, all branded `_Sent via Tokoflow — https://tokoflow.com_`. Order builders (`buildOrderConfirmation`, `buildOrderWithStatus`, `buildPreorderConfirmation`, `buildCelebrationConfirmation`) include `discountLine()` — shows Subtotal + Discount rows when discount > 0.
- **Slug:** `afterFiles` rewrite `/:slug` → `/order/:slug`. Reserved slugs in `lib/utils/slug.ts` include both EN (orders, invoices, …) and legacy ID slugs (pesanan, faktur, …) so legacy-prefix collisions can't happen.
- **Route rename (MY):** `middleware.ts` 301-redirects every legacy ID prefix (`/pesanan` → `/orders`, etc.) and the `/baru` → `/new` leaf so WhatsApp and bookmark links survive.
- **Stock:** Auto-decrement on order, auto-disable at 0, server-side race prevention.
- **Swipe:** Right = advance status, Left = WA.
- **Realtime:** Supabase on `orders` INSERT (toast + sound) + UPDATE (payment claim toast).
- **Offline:** Network-first + IDB fallback. FIFO sync + localStorage lock (30s TTL).
- **Analytics:** `track(event, properties?)` → `events` table + UTM.
- **Day-1 nav:** All core surfaces (Today, Orders, Products, Customers, Report, Invoices, Settings) visible from signup. Only Tax hides behind the Pro gate. Invoices were previously Pro-gated but opened to all users (2026-05-20). The earlier volume-gated cognitive cut was rolled back — hiding Orders/Customers from new merchants made them feel the product was missing.
- **Smart defaults:** `config/category-defaults.ts` — 28 entries map a `business_category` ID to mode (preorder/dine-in/booking), capacity, sample products, and suggested categories. Drives `/setup` step 1 → 2 transition.
- **Pricing compass:** Traffic light 🟢🟡🔴⚫ in ProductForm (net margin after overhead). Peer benchmark via `/api/benchmark` (gated ≥10 users/cluster).
- **Quiet hours:** `profiles.quiet_hours_start/end` (default 22:00–06:00 MYT). Push suppressed during window.
- **Quota nudge:** two-state only — `"none"` until 50 orders used, then `"exhausted"`. No soft/medium/urgent thresholds, no `"X/50 used"` banners (anti-anxiety, see [`docs/positioning/03-features.md`](./docs/positioning/03-features.md)). `TrialBanner` shows a single quiet line at exhausted; settings page surfaces Pro upgrade as the only resolution path.
- **Tax identity gating:** TIN/BRN/SST inputs in `/settings` only render for Pro merchants OR users who already have tax info entered — free-tier merchants don't see the form (compliance is silent superpower).
- **Microcopy:** import from `lib/copy` for empty states, errors, loading, confirmations, success, and the 7 empathy moments. Adds new copy via this library, not inline.
- **MyInvois submission (Pro):** One-tap from `/invoices/[id]` detail or `/invoices/[id]/edit`. Polls `/myinvois-status` every 5s until terminal (valid / invalid / cancelled / rejected) or 2 min timeout. Stores UUID + longId + validation state on the invoice row. 72h cancel modal with reason capture.
- **SST calculation:** Per-invoice toggle (0% / 6%), seeded from `profile.default_sst_rate`. Not per-product-category (that would require schema extension).
- **Staff assignment:** `AssigneePicker` component in `features/staff/components/`. Owner assigns from `/orders/[id]/edit`. Staff CRUD at `/settings/staff`. Phone+PIN staff login deferred to Phase 4.
- **Store mode:** Two-dimension matrix — TIMING (`preorder_enabled`: Scheduled / On-demand) × FULFILLMENT (`delivery_enabled`, `pickup_enabled`, `dine_in_enabled`). Valid combinations: Scheduled → Delivery+Pickup (any mix); On-demand → Pickup+Dine-in (any mix). Scheduled+Dine-in and On-demand+Delivery are not surfaced. Settings UI enforces "at least one fulfillment always on".
- **Order status timeline:** `order_status_logs` table records every status change with `changed_by_name` snapshot and timestamp. `StatusTimeline` component in OrderForm edit page renders dot-line UI newest-first. Fire-and-forget insert pattern — log failure never blocks the status update.
- **Customer payment proof upload:** `/api/public/orders/[id]/upload-proof` accepts `image/*` (max 5 MB), uploads to `payment-proofs` bucket (public), appends URL to `orders.image_urls`. Triggered from receipt page (`/r/[id]`) QR flow — customer can attach a screenshot before clicking "I've paid".
- **Payment proof separation:** `orders.image_urls` stores both merchant reference photos (`order-images` bucket) and customer payment proofs (`payment-proofs` bucket). Separate in UI by checking `url.includes("payment-proofs")`. Proofs are read-only in the merchant dashboard — never shown with delete buttons. `image_urls` save payload always merges both arrays to preserve proofs.
- **Phone verification gate:** Receipt page write actions (upload proof, claim payment) require the customer to verify their phone number against `orders.customer_phone` via `POST /api/public/orders/[id]/verify-phone`. Verified state stored in `sessionStorage` keyed by `receipt_verified_${orderId}`. Rate-limited 10 attempts/hr per IP.
- **Tracking section:** `TrackingSection` client component renders a "On the way" card on `/r/[id]` when `status === "shipped"` and `tracking_number` exists. Auto-detects courier from tracking number pattern via `detectCourier` in `lib/utils/courier.ts`. For non-shipped statuses, compact inline row is shown instead.
- **Customer reorder:** `/api/public/order-history` endpoint exists but is NOT surfaced on the order form. Phone numbers get reused — showing past orders of a previous holder is a privacy risk (removed from storefront 2026-05-20).
- **Community join:** Cookie `community_code` → auth callback → upsert member + set community_id + set organizer as referrer.

---

## UI patterns

### Dashboard
- Colors: warm bg `hsl(35 20% 97%)`, cards `hsl(36 15% 99%)`. Marketing: `bg-white`
- Cards: `rounded-xl border bg-card shadow-sm`
- Primary CTA: `h-9 px-3 bg-warm-green text-white rounded-lg`
- Text hierarchy: L1 `font-semibold text-foreground` → L2 values → L3 `text-foreground` → L4 `text-muted-foreground`
- Inputs: `h-11 px-3 bg-card border rounded-lg shadow-sm`
- Touch targets: min `h-11` (44px)

### Marketing
- Containers: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- CTAs: `bg-green-600 text-white hover:bg-green-700`
- Voice: conversational English, SMB-friendly. Honest copy — never claim something that isn't shipped.

### SEO
- Title: `%s | Tokoflow`. OG 1200×630. `lang="en"`
- JSON-LD: SoftwareApplication (landing), LocalBusiness (store), Organization (community), FAQPage (pricing, contact)
- noindex: auth, dashboard, admin

---

## Cron jobs (`vercel.json`)

| Job | Schedule (UTC) | MYT | Function |
|---|---|---|---|
| invoice-overdue | 07:00 | 15:00 | Mark overdue invoices |
| morning-brief | 22:00 | 06:00 | Push: today's lineup + cost trend (food cost delta ≥ 5pp) + **Hari Sepi** variant when today's revenue <30% of 7-day avg (with >RM 50/day baseline) |
| engagement | 00:00 | 08:00 | Push: onboarding drip · milestone (10/50/100/500/1000) · monthly recap · **Anniversary** (1y/3y/5y) · **Customer Returns** (3+ orders, drip-deduped) · **Pre-Ramadan** (14d before, hard-coded dates 2027-2030) |
| alerts | 00:00 | 08:00 | Push: stock ≤ 3, capacity ≥ 80%, quota exhausted (single trigger at 50, no pre-exhaustion banner per anti-anxiety rules) |
| tax-reminder | 02:00 on day 10 | 10:00 | Pro merchants with unsubmitted invoices, quiet-hours aware (warm tone, not pressure) |

**Mid-Rush** (client-side, not cron): the dashboard's realtime listener counts INSERTs in a 30-min sliding window and surfaces a one-time supportive toast at 5+ orders, 60-min suppressed via sessionStorage.

---

## Environment variables

```
# App
NEXT_PUBLIC_APP_URL=https://tokoflow.co.id    # required — logout redirect + billing callback
NEXT_PUBLIC_APP_NAME=Tokoflow
NEXT_PUBLIC_APP_DESCRIPTION=Resi kami urus. Resep kamu.
NEXT_PUBLIC_APP_SCHEMA=public                 # optional — defaults to public

# Supabase (project yhwjvdwmwboasehznlfv)
NEXT_PUBLIC_SUPABASE_URL=https://yhwjvdwmwboasehznlfv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…
SUPABASE_ACCESS_TOKEN=…                       # CLI / Management API only (migrations)

# Midtrans (payment — Indonesia, ACTIVE path)
MIDTRANS_SERVER_KEY=                           # SB-Mid-server-… (sandbox) | Mid-server-… (prod)
MIDTRANS_SNAP_URL=                             # optional — defaults by key prefix
MIDTRANS_API_URL=                              # optional

# Billplz (payment — MY path, DORMANT; leave empty for ID)
BILLPLZ_API_KEY=
BILLPLZ_COLLECTION_ID=
BILLPLZ_X_SIGNATURE_KEY=
BILLPLZ_BASE_URL=                             # optional — defaults by NODE_ENV

# MyInvois (e-Invoice — MY path, DORMANT; ID uses e-Faktur. Leave empty for ID)
MYINVOIS_CLIENT_ID=
MYINVOIS_CLIENT_SECRET=
MYINVOIS_BASE_URL=                            # optional — defaults to preprod in dev
MYINVOIS_IDENTITY_BASE=
MYINVOIS_SECRET_KEY=                          # at-rest encryption for gateway/e-invoice creds

# AI
OPENROUTER_API_KEY=

# Geocoding (reverse geocoding proxy at /api/geocode)
# Primary: HERE Maps — 250K req/month free, no CC, best MY quality
# Sign up at developer.here.com → create project → API key (restrict to tokoflow.com)
# Without this key, /api/geocode falls back to Nominatim automatically.
HERE_API_KEY=

# Cron
CRON_SECRET=

# Transactional email (password reset, receipts)
GMAIL_USER=
GMAIL_APP_PASSWORD=
```

Google OAuth client id/secret live inside Supabase auth config — **not** in `.env.local`. Supabase handles the OAuth flow server-side.

---

## Phase 0 gates (revised 2026-05-05 — synthesis aligned)

Phase 0 = 8-week adversarial validation. **No Phase 1 build until Gate 0 passes.** Full plans in [`06-roadmap.md` Phase 0](./docs/positioning/06-roadmap.md#phase-0--validation-first-foundation-aprjul-2026-3-months) (strategic) + [`SYNTHESIS-2026-05-05.md`](./docs/SYNTHESIS-2026-05-05.md) (execution) + [`scripts/phase-0/README.md`](./scripts/phase-0/README.md) (operational).

### Validation milestones

- [ ] **5 friendly + 5 hostile interviews** Shah Alam mompreneur (NOT just observation — hostile q first: "what part of jualan you ENJOY?" then "why might Tokoflow NOT work for you?") + brand resonance test (Tokoflow name 1-10 friction)
- [ ] **Manual Twin smoke test**: Aldi as Background Twin for 1 volunteer merchant for 2 weeks via WA admin (cheap, validates trust transfer architecturally)
- [ ] **AI cost measurement** with production-grade prompts (Background Twin + Foreground Assist) at 50-order/month load
- [ ] **Ariff partnership formal** — kopi 2 jam, decide tier (advisor 1.5% / co-founder 5–10%), sign SAFE/MOU. **No casual mode.**
- [ ] Sdn Bhd registration submitted (SSM)
- [ ] **Distribution validation**: Aldi TikTok + komuniti penetration → ≥300 followers + ≥15 inbound DM cumulative by Week 8 (or scenario c backup B2B activated)
- [ ] **Brand resonance**: friction <4/10 average from 10 interviews → keep Tokoflow; ≥4/10 → trigger rebrand decision

### Spike scripts (still required)

- [ ] `myinvois-spike.ts` returns `submissionUid` + accepted `uuid` from LHDN preprod
- [ ] `billplz-spike.ts` passes X-Signature round-trip (genuine + tamper tests)
- [ ] MDEC MD Status application submitted + cleared (not yet applied — see [`docs/ops/sdn-bhd-roadmap.md`](./docs/ops/sdn-bhd-roadmap.md) for full sequence)

### Gate 0 pass criteria (all 7 must hit)

1. ✓ ≥7/10 interviews resonate with Three-Tier framework (mechanical residue distinct from valued relationship + craft)
2. ✓ Smoke test merchant rates manual twin >7/10 helpfulness AND no customer noticed AI tone
3. ✓ AI cost ≤ **RM 25/merchant/month** at 50-order/month projected scale (RM 25-30 = retest Week 6 must clear ≤RM 25)
4. ✓ Ariff formal partnership locked (signed) OR Plan B locked
5. ✓ Sdn Bhd in SSM queue
6. ✓ Distribution: ≥300 followers + ≥15 inbound DM cumulative
7. ✓ Brand decision data-backed (keep <4/10 friction OR rebrand ≥4/10 friction)

### Pre-committed triggers — 7 total (6 kill + 1 rebrand-flag)

> No rationalization when emotion arrives. Aligned with [SYNTHESIS-2026-05-05.md §5](./docs/SYNTHESIS-2026-05-05.md).

1. **AI cost**: ≤RM 25 pass / RM 25-30 warning + retest Week 6 / >RM 30 → kill (Pro RM 49 locked)
2. **<7/10 interviews** resonate Three-Tier (kill); <5/10 = catastrophic
3. Smoke test: customer detects AI tone OR merchant trust degrades OR <7/10 helpfulness → reduce twin scope to Foreground Assist only OR kill
4. Ariff declines + Plan B unproven 4 weeks → kill
5. Sdn Bhd structural block + sole-prop alternative non-viable → kill
6. **Distribution**: <300 followers + <15 inbound DM by Week 8 → kill content-led OR activate scenario (c) backup B2B
7. **Brand friction ≥4/10 average** → trigger rebrand decision Week 7 (NOT kill — flag; bias toward keep due to 3-6 week switching cost)

### Phase 1 Gate (post-validation, end Oct 2026) — "Love" operationally defined

≥4/5 must hit:
- Sean Ellis test: ≥40% answer "very disappointed" without Tokoflow
- DAU consistency: ≥70% daily active over 4 weeks
- Spontaneous referral: ≥1 alpha tells another merchant unprompted
- NPS: ≥8 from all 5 alphas
- Self-reported craft hours saved: ≥3 hours/week median

---

## Recent strategic passes

### 2026-06-05 → 06-06 · Indonesia localization — Kedaiflow (MY) codebase → Tokoflow (ID)

Replaced the old Tokoflow codebase (Next 15 / JS / marketplace-era) with the
newer Kedaiflow codebase (Next 16 / React 19 / TS / Tailwind 4) and pointed the
whole thing at Indonesia. Done on branch `migrate-to-kedaiflow-id`; the prior
working tree is preserved on `archive/pre-kedaiflow-id-migration-2026-06-05`.

**What changed:**
- **Source swap.** Wiped the Tokoflow working tree (kept `.git` + `.vercel`) and
  copied the Kedaiflow source in. The dropped marketplace integrations (Shopee,
  TikTok Shop) are **not** carried over (decision: drop permanently); they live
  in git history + the archive branch if ever needed.
- **Rebrand.** 1259 `kedaiflow/Kedaiflow/KEDAIFLOW` occurrences across 213 files
  → `tokoflow/Tokoflow/TOKOFLOW`; `design_system/kedaiflow_v2` → `tokoflow_v2`;
  domains `kedaiflow.com`/`kedaiflow.co.id` → `tokoflow.com`/`tokoflow.co.id`.
- **Country axis → ID default.** `lib/country/resolve.ts`: `resolveCountry(null)`
  now returns **ID**; `countryFromHost` is ID-first (only `.my` → MY). ~10 hardcoded
  `"MY"` fallbacks flipped to `"ID"` (API route AI-context fallbacks, `phone.ts`,
  `quiet-hours.ts`, `currency/format.ts` defaults, store/order JSON-LD
  `addressCountry`). MY identities preserved where correct (MyInvois/Billplz
  adapters, `ctx.code === "MY"` guards). The dormant MY path is fully intact.
- **DB (`yhwjvdwmwboasehznlfv`).** Reset `public` + `wastruk` + storage
  (buckets/policies) + 4 test users, then re-applied **all 111 migrations** via
  the Management API (Kedaiflow's chain proved clean on a fresh DB).
  - **Migration 110** — flips column defaults to ID (`profiles/customers/invoices.country`,
    `cities/provinces.country_code`), quiet-hours → WIB 21:00–05:00, and widens the
    tax-rate CHECKs to allow Indonesia PPN (`0/6/11/12`, was `0/6` SST-only).
  - **Migration 111** — relabels `business_categories` + `product_units` back to
    Bahasa Indonesia, deactivates the 16 MY states / 44 MY cities (`is_active=false`,
    kept for the dormant MY path), and seeds **38 ID provinces + 88 major ID cities**.
  - Result: 41 public tables, ID pricing tiers (Gratis Rp0 / Pro Rp99.000 /
    Business Rp199.000), 5 storage buckets + 18 object policies.
- **Env.** New `.env.local` on the Tokoflow Supabase project + `OPENROUTER_API_KEY`
  (Tokoflow key) + shared Gmail + fresh `CRON_SECRET`. Midtrans + e-Faktur keys are
  placeholders (`MIDTRANS_SERVER_KEY=` etc.) pending real accounts.
- **Build:** `next build` green (Next 16.1.4, TS pass, 150 static pages).

**Follow-on passes (2026-06-06) — localized the rest + synced prod:**
- **Currency app-wide.** `lib/utils/format.ts` `formatRupiah`/`formatCurrency` were
  emitting **RM** despite the name → fixed to Rp/IDR (id-ID); 60-file sweep of inline
  `RM ${x.toLocaleString("en-MY")}` → Rp + `id-ID` (orders, products, customers,
  recap, invoices, receipts, crons, public flow); JSON-LD `priceCurrency` → IDR.
- **Functional layer → ID:** `PhoneInput` (was rejecting `08xx` numbers, stored `60xxx`)
  → `+62`/`62xxx`; `wa-messages.ts` (RM/SST/`tokoflow.com` → Rp/PPN/QRIS/`tokoflow.co.id`,
  Bahasa Indonesia); `courier.ts` → ID couriers; API phone validation (`62`/`08x`);
  `geocode` coordinate bounds were Malaysia-only (rejected ID coords) → widened to ID;
  Photo-Magic onboarding prompt → Bahasa Indonesia + IDR.
- **Marketing site + tax dashboard + settings → Bahasa Indonesia / ID:** landing,
  features, about, contact, terms, privacy, blog, mitra, coba-aplikasi, pricing,
  MarketplaceCostCalculator (UU PDP, DJP/Coretax, Jakarta, UMKM/IKM, QRIS/Midtrans,
  PPN/NPWP/NIB/PKP, Rp pricing). `/tax` dashboard: SST→PPN, MyInvois→e-Faktur, PKP
  threshold Rp 4.8 M. Settings: single **Pro Rp 99.000/bulan via Midtrans** button
  (MY annual tier + per-merchant Billplz card removed; ID note added). `billing/payments`
  charges the country-aware tier (ID Pro = Rp 99.000, not the RM 79 constant).
- **AI prompts** confirmed: voice/image/twin/assist already have solid ID branches
  (Bahasa Indonesia, +62, Rp, BCA/GoPay/QRIS) — the MY branches stay for the dormant path.
- **Vercel production env synced** (REST; the CLI token refreshes on `whoami`): the
  previously-empty `NEXT_PUBLIC_APP_NAME/URL/SITE_URL/DESCRIPTION`, `OPENROUTER_API_KEY`,
  `CRON_SECRET` set; Supabase + Gmail were already valid.

**Remaining follow-ups (need creds / decisions, not code):**
- **Midtrans** — set `MIDTRANS_SERVER_KEY` (needs a Midtrans account; code + UI ready).
- **e-Faktur / Coretax** — the invoice e-invoice *submit* backend is still MyInvois-shaped;
  the ID adapter exists but the Coretax submit flow + DJP creds are a dedicated project.
- **Dashboard BI copy** — core dashboard strings are still English (currency/labels are
  ID-correct; full Bahasa Indonesia copy is a follow-up; no i18n scaffold yet).
- **Strategy/positioning docs** (`docs/`, the deeper sections of this file) + `/admin`
  phase-0 tooling still carry the Malaysia market context — pending an ID rewrite.
- **Domain** `tokoflow.co.id` DNS → Vercel (APP_URL already set to it).

### 2026-05-28 · Security hardening + customer order flow UX overhaul (17 commits)

**Security fixes shipped:**
- Server-side catalog price enforcement on public order form (prevents POST body price manipulation)
- Rate limiting: global 10/hr per IP + targeted 3/hr per IP per merchant slug (quota exhaustion attack)
- `payment-proofs` storage bucket set to private (migration 105); upload endpoint now stores 10-year signed URLs instead of public URLs
- Upload-proof: max 3 proofs per order + 5/hr per IP rate limit
- `fetchPaidStatus` + `fetchOrderDetails` scoped to merchant's own orders (prevents cross-merchant reads)
- Receipt page write actions (upload proof, "I've paid") gated behind phone verification: `POST /api/public/orders/[id]/verify-phone` — customer must enter the phone number used to place the order, rate-limited 10 attempts/hr per IP, verified state stored in sessionStorage

**Customer order flow — sukses page:**
- sessionStorage fallback replaced with `useMemo` + server-fetched `serverOrderDetails` — order card now shows correctly on refresh, new tab, and shared URLs
- `isPreorder` / `isLangganan` derived from both URL params and DB (fixes Billplz redirect where URL params are absent)
- Billplz redirect URL now includes `order=`, `preorder=1`, `langganan=1` via `URLSearchParams`; langganan orders skip Billplz entirely
- Split `proofInputRef` into `proofInputRefQr` + `proofInputRef` (was causing broken file picker in QR-first flow)
- "Already paid?" card hidden for non-QR merchants (payment not yet requested — "Next steps: Pay once confirmed")
- `handleClaimPayment` fully error-handled; `claimError` state surfaced to user
- Sukses page URL no longer leaks merchant phone (`phone=`), name, or total — server-fetched data only
- "Order again" removed from sukses page; on receipt page gated to `status === "done" | "cancelled"`
- "Save receipt" + "View status" rendered as equal-weight side-by-side grid buttons
- Customer can view and download their own uploaded proof via modal (tapping "Payment proof sent! · Tap to view")

**Merchant dashboard:**
- Order history section always visible in edit mode; "Order placed" synthetic entry from `order.created_at`; payment status changes (Paid/DP/Unpaid) now logged to `order_status_logs` as `payment_paid` / `payment_partial` / `payment_unpaid`; blue dot for payment events, muted dot for creation
- Payment proofs separated from reference photos in `OrderForm` + `OrderDetail` — split by URL path (`payment-proofs` bucket vs `order-images`); proof thumbnails open a fullscreen modal with Download button; merchant cannot accidentally delete customer-uploaded proofs
- Receipt link added to order edit page header ("Receipt" button → opens `/r/${orderId}` in new tab)
- Download receipt button added to `/r/[id]` receipt page — canvas PNG identical to sukses page receipt, available to both customer and merchant

**Receipt page (`/r/[id]`):**
- Progress bar now shows step labels: Received · Processing · Shipped · Done
- "Delivery:" / "Pickup:" / "Date:" label conditional on `delivery_address` presence and `is_preorder`
- "What happens next" guidance section added for `status === "new"` orders
- "Transfer amount" / `unique_code` section removed (Indonesian IDR legacy, never triggered for MY)
- `handleClaimPayment` fully error-handled; `claimError` surfaced; QR-flow "I've paid" disabled until proof uploaded
- "Contact seller" renamed → "Message on WhatsApp"; demoted from green CTA to outlined secondary
- `businessName` fallback: "Toko" → "Store"
- Customer proof upload viewed/downloaded via modal after upload

**Order form (`/[slug]`):**
- `isLowStock` threshold: 20 → 5 (only warn when genuinely low)
- Notes placeholder updated to bakery context ("no onions" removed)
- All hardcoded `#1a4d35` replaced with `bg-warm-green` / `text-warm-green` design tokens
- `memberSince` gated to accounts ≥6 months (hides trust-negative "Active since May 2026")
- "More stores in city" moved from mid-profile to page footer
- Billplz payment method preview card added for merchants without QR
- "Order now" → "Send order" for preorder merchants; "Order now" for walk-in
- "Earliest: [date]" lead time hint below date picker for preorder merchants
- Fulfillment picker refactored from `delivery|pickup` to dynamic `delivery|pickup|dine-in` array; `dine_in_enabled` now fetched from service

**Shipping / tracking:**
- `TrackingSection` client component: "On the way" card shown on receipt page when `status === "shipped"` with tracking number — courier name, copy button, full-width "Track on [Courier]" button (auto-detects Pos Laju, J&T, Ninja Van, Skynet, DHL via `detectCourier`)
- Compact row shown for non-shipped statuses (unchanged)
- Shipped modal in merchant dashboard: courier dropdown moved first, tracking number field second with courier-specific placeholder and green ring when courier selected

### 2026-05-23 · Marketing refresh to English + MECE problem tree + Master Brand Strategy v1.0

**Marketing pages translated to English (commit `9fae7ec`):**
- `app/(marketing)/page.tsx`: BM echo line removed from hero. 3-card `entryPaths` (headings, bodies, CTAs) translated. Problem Selector section titles translated ("Which one sounds like you?" / "Pick the one that fits your situation."). Calculator section title translated ("How much does selling on marketplaces actually cost you?").
- `app/(marketing)/MarketplaceCostCalculator.tsx`: all labels, descriptions, dynamic break-even string, disclaimer, and CTA button translated to English.
- `app/(marketing)/about/page.tsx`: repositioned to owned-commerce thesis v0.3. Mission reframed from "democratize selling" to "own your commerce channel". `targetUsers` updated: added "IKS & small manufacturers", "Health & wellness", "Independent retailers"; removed generic entries.

**3-card problem selector + Marketplace Cost Calculator (landed this session):**
Three `entryPaths` cards on landing page for self-selection: (1) serious product but digital channel still WhatsApp → IKS/credibility angle → `/register`; (2) WhatsApp order chaos → mompreneur angle → `/register`; (3) platform cost unclear → marketplace-heavy seller → `#calculator`. Card 3 anchors to `MarketplaceCostCalculator` — interactive: avg order value × orders/month × effective platform cost % → monthly platform cost vs RM 49 → saving + break-even. CTA renders only when saving > 0.

**MECE problem tree written — `docs/MECE-PROBLEM-TREE.md` (locked 2026-05-23):**
Causal problem tree in 4 layers used as basis for all copy, demo scripts, and pitch:
- **Layer 1 Strategic** (why merchant registers): Channel control · Customer relationship · Effective platform cost · Credibility
- **Layer 2 Conversion** (why orders are lost): Reorder friction · Order capture
- **Layer 3 Operations** (why merchant stays): Operations control · Payment reconciliation
- **Layer 4 Barrier**: Implementation barrier — the reason the above 8 remain unsolved, not a standalone problem
- **Demand sequencing**: Already felt (order capture, operations control, payment reconciliation, credibility/IKS) / Partially felt (platform cost, reorder friction, customer relationship) / Needs surfacing (channel control, customer ownership, platform dependency)
- **Segment playbooks**: IKS = proof-first demo (real order email → website → customer journey → dashboard → photo magic → pricing). Mompreneur = pain-first demo (customer self-order → rapi dashboard → payment status → repeat order link → website bonus).
- **3-level messaging hierarchy**: Level 1 simple hook / Level 2 felt pain / Level 3 strategic insight. Don't open with Level 3.

**Master Brand Strategy v1.0 (conversation artifact — write to `docs/brand/` when ready):**
- Core positioning: *"Owned-commerce layer untuk bisnes independen Malaysia yang sudah punya demand, tapi belum punya mesin jualan sendiri."*
- Brand essence (internal): **Kontrol** — channel, customer, order, payment, invoice, repeat purchase, data, credibility
- Brand essence (external): **"Bisnes anda. Laman web anda. Customer anda."**
- Language discipline by context: Brand strategy → "bisnes independen" · Landing headline → "laman web order sendiri" · Merchant copy → "bisnes anda / laman web sendiri / customer anda" · Agency pitch → "usahawan independen / SME independen" · Internal → "owned-commerce layer"
- Logo direction: **K-flow monogram** — rounded letter K from commerce flow lines, ONE dominant metaphor, readable at favicon/icon/sidebar size. Lowercase wordmark `tokoflow`.
- **Color decision PENDING**: teal + deep navy (#14B8A6 / #0F172A) vs existing `warm-green` (#05A660). Switching requires full design system token migration. Must be decided before briefing designer.
- Font: **Satoshi** or **Manrope** (Plus Jakarta Sans dropped — too common in MY startup ecosystem).
- Avoid: food bowl, literal shop/awning, receipt icon, delivery pin, robot/AI sparkle, coin+box combo.
- Tone: modern Malay-English commerce language — not formal BM, not startup English, not Indonesian.

**First organic IKS user signal — AmeenAleem (IKS manufacturer, Kedah):**
Signed up organically (not from mompreneur channel). Referred to Tokoflow as *"our own company website"* when communicating with his business network — validating the IKS credibility angle. Confirms two-segment picture: Segment A = IKS manufacturer (credibility-first entry), Segment B = mompreneur (order-chaos-first entry). **Phase 0 interview scope must be expanded to include IKS manufacturers**, not only Shah Alam F&B mompreneurs.

### 2026-05-20 · Store mode 2D + QoL improvements + 5 bug fixes

**Two-dimension store mode (Timing × Fulfillment):**
- Migration 102: `delivery_enabled` + `pickup_enabled` columns on `profiles`. Corrective migration sets `delivery_enabled = true` for all preorder merchants (they were implicitly offering delivery before this schema existed).
- Settings UI redesigned from 2-button toggle (Pre-order/Walk-in) → TIMING radio (Scheduled / On-demand) + FULFILLMENT conditional checkboxes. Switching timing auto-clears the incompatible fulfillment (e.g. switching to On-demand disables Delivery).
- PublicOrderForm: fulfillment picker shown when merchant enables both Delivery+Pickup; address field conditional on selected fulfillment.

**QoL improvements:**
- `order_status_logs` (migration 101) — every status change recorded with who, when, from→to. `StatusTimeline` component renders in OrderForm edit page.
- Recap → Report rename: `/recap` → `/report` URL; sidebar label "Recap" → "Report"; `middleware.ts` 301-redirects `/recap` + `/rekap` → `/report` so old bookmarks/WA links survive.
- Invoices sidebar item: removed `requiresBisnis` gate — visible to all users regardless of plan.
- "Log order" → "New order" button on orders list + today view.
- Invoice product grid: tap-to-add catalog items directly in invoice form (reuses `getFrequentItems` from order service).

**5 bug fixes (customer-reported):**
1. Discount not showing in WA messages — added `discountLine()` to all 4 order WA builders.
2. Transfer amount wrong in customer receipt view — was using stale `transfer_amount` column (IDR unique_code mechanism, deprecated for MY in migration 084). Fixed to always use `order.total`.
3. No delivery address in customer order form — migration 102 conservative default set `delivery_enabled=false` for all rows; corrected via SQL to `true` for preorder merchants + migration updated.
4. Order history by phone removed from storefront — privacy risk (phone numbers get reused; new holder would see previous person's orders).
5. Payment screenshot upload added to `/r/[id]` QR flow — new endpoint + `ImageUp` button in ReceiptActions; uploads to `payment-proofs` bucket, appends to `image_urls` on order.

### 2026-05-19 · Bible v1.3 — Marketplace trajectory + Stage 1 directory activation

Founder discussion 2026-05-19 surfaced a positioning gap that v1.2 deferred: merchants seek alternatives to Shopee/Foodpanda/TikTok Shop (25-35% commission pain), but v1.2 framed Tokoflow as a tool-only product. The `/toko` (renamed `/store`) directory infrastructure was already built (migration 060, DirectoryGrid, profiles.is_listed) but disabled — leftover from v1.2 lock. Activating it forced a positioning question that v1.3 now answers.

**Bible v1.3 deltas (additive, v1.2 archive preserved):**
- New **[D-018 marketplace trajectory](./docs/positioning/07-decisions.md#d-018--marketplace-trajectory--4-stage-roadmap-refuse-6-refined-2026-05-19)** — 4-stage roadmap (beachhead → soft directory → light marketplace → full marketplace) over 3-5 years
- **Refuse #6 refined** — direct-axis ownership preserved (0% commission, merchant owns customer); discovery-axis platform identity permitted at Stage 3+ (2-3% commission, transaction data still merchant-owned)
- **Two-track economics** — `orders.referral_source` column (always existed per migration 060, was waiting for this) drives 0% direct vs 2-3% marketplace
- **Companion doc** [`docs/positioning/09-marketplace-trajectory.md`](./docs/positioning/09-marketplace-trajectory.md) — analog mapping (Toast + Substack), MY marketplace graveyard analysis (PgMall, PrestoMall, 11street MY), Stage 3 customer-account decision matrix (Model B, deferred until Phase 0 validates)
- Phase 0 interview **§8 added** — 5 marketplace appetite questions with decision thresholds

**Stage 1 directory activated (commits `baa347f` → `01286cf` → this pass):**
- Directory route activated (next.config redirect removed)
- Renamed `/toko` → `/store` for English-UI consistency (commit `01286cf`)
- Shipment tracking schema + UI (migration 098, delivery_address + tracking_number + courier_name) — also commits `baa347f`
- Settings UI: `is_listed` toggle + live `/store/[city]` link indicator
- `/store` polished: tagline subtitle, city chips, empty-state CTA
- `/store/[citySlug]` polished: validate against cities table (proper 404 on invalid), "be the first" empty state for valid empty city (no more notFound on legitimate slugs), addressCountry MY (was incorrectly ID)
- Marketing nav: "Browse" link added
- Landing hero: secondary "browse local sellers" link
- Footer: "Browse stores" → `/store`

**Data seeded for Phase 0 testing (via Management API, this session):**
- Founder admin role set (Aldi → `role='admin'`)
- 5 bakery products + 2 customers + 3 test orders (1 new, 2 shipped with Pos Laju + local courier tracking)
- Ack token generated for shipped order — `/a/[token]` verified live-rendering tracking + address
- `/store` directory verified 200 with 2 merchants visible

**Tier 3 Phase 0 launch readiness (commit `a9f7a9d`):**
- **OnboardingChecklist gains directory step.** `/setup` captures business_category (step 1) but never city — Aldi himself signed up with city=NULL during testing, the exact state that hides a merchant from `/store`. Rather than bolt a city picker onto `/setup` (extra friction kills conversion), the existing OnboardingChecklist on `/orders` now surfaces a soft "complete profile to appear on Tokoflow directory" step once the merchant has at least one product, linking to `/profil/edit` where the state→city cascade already lives.
- **Privacy + Terms refreshed for current product.** Privacy gains explicit directory-listing disclosure (exactly what is public on `/store`: business name, description, city, category, logo, products — *never* email, phone, address, BRN/TIN/SST) and a section explaining `/r/` and `/a/` URLs are unguessable token URLs not indexed by search engines. Section 1 widened to enumerate `delivery_address`, `tracking_number`, `courier_name`. Cross-border line corrected. Terms gain §5 codifying the directory-listing contract: "Direct customer orders remain at 0% commission and you retain full ownership"; any future marketplace commission per D-018 Stage 3 will be opt-in and disclosed before activation. Both docs dated 2026-05-19; sections renumbered.
- **robots.txt rebuilt.** Was previously allowing everything except `/api/` and `/pembayaran/`. Now disallows 23 prefixes: auth (`/login`, `/register`, `/forgot-password`, `/reset-password`), all dashboard surfaces, admin, token URLs (`/r/`, `/a/`), and `/setup`. `/store` + `/store/[city]` stay explicitly indexable.
- **SEO audit clean.** Sitemap covers landing + features/pricing/blog/about/contact/privacy/terms + `/store` + `/store/[city]` + `/[slug]` + `/community/[slug]`. JSON-LD coverage confirmed: SoftwareApplication on landing, ItemList on `/store` + `/store/[city]`, LocalBusiness + OfferCatalog on `/[slug]`. `/sitemap.xml` and `/robots.txt` both serve 200.
- **Email + cron sanity check passed.** 5 cron jobs configured in `vercel.json` (`invoice-overdue`, `morning-brief`, `engagement`, `alerts`, `tax-reminder`); all read `CRON_SECRET`. `lib/utils/email.ts` reads `GMAIL_USER` + `GMAIL_APP_PASSWORD` (live in production); brand `from:` header is "Tokoflow"; zero Indonesian/Tokoflow leaks in cron route copy.

**State for next session:**
- Tier 1 + Tier 2 + Tier 3 of consolidated list complete
- Bible v1.3 documented (D-018 + 09-marketplace-trajectory.md + Refuse #6 refinement in manifesto)
- Phase 0 interview script ready with marketplace validation (§8)
- Founder + Ariff Danial profiles live on production; Aldi role=admin; bakery test data seeded
- Privacy + Terms reflect current product; robots.txt locked down
- Deferred (gated by Phase 0): Model D per-merchant magic link (16-24h, defer until Q3 ≥7/10), branding asset refresh (no design files), customer accounts Model B (Stage 3, Year 2, gated by Q2 ≥7/10)
- Blocked external: Billplz (Sdn Bhd + KYB), MyInvois (LHDN preprod), Google OAuth consent screen publish (blocked on Privacy URL hosting + production logo)

### 2026-05-18 · Tokoflow → Tokoflow rebrand + Singapore Supabase re-provision

Codebase ported from the Tokoflow repo into the dedicated `tokoflow` GitHub repo (commit `cc7be85`). 943 string occurrences of `tokoflow`/`Tokoflow`/`TOKOFLOW` replaced across 130 files (domains, bundle IDs, and intentional `tokoflow.co.id` Indonesian-region refs preserved). 842 files / ~166K LOC pushed to `origin/main`.

**Supabase re-provisioned fresh in Singapore region:**
- New project: `emcuvtqafisspsefsoiy` (`ap-southeast-1`)
- All 97 migrations applied cleanly via `supabase db push --include-all`
- **Migration 095 bug fixed in-flight:** `business_categories.slug` and `product_units.name` columns don't exist — the PK is `id` and the MY labels live in `label`. Without the fix, every fresh provision would have failed at migration 095. Committed alongside the rebrand.
- Old Tokoflow Supabase (`yhwjvdwmwboasehznlfv`, Mumbai) left dormant with 3 test users / 10 orders — fresh-start decision, no data migration.

**Auth re-wired:**
- Google OAuth client recreated in `tokoflow` Google Cloud project (Client ID `394303789184-...`). Consent screen still in Testing mode.
- Supabase URL allow-list seeded with `tokoflow.com/**`, `www.tokoflow.com/**`, `localhost:3000/**`, `localhost:3101/**`.

**Vercel production env wired (8 of 14 vars live):**
- Set: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_DESCRIPTION`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` (newly generated), `OPENROUTER_API_KEY` (Tokoflow-specific key), `GMAIL_USER`, `GMAIL_APP_PASSWORD` (shared App Password).
- Still TBD: `BILLPLZ_*` (4 vars, blocked on Sdn Bhd + KYB) and `MYINVOIS_*` (4 vars, blocked on LHDN preprod credentials).
- **CLI stdin-piping silently stored empty strings** for all 7 initial writes. Confirmed by `vercel env pull`. Fixed by deleting via REST API and re-adding via REST API JSON body. Captured under Known issues.

**Production deploy verified:**
- `vercel --prod` succeeded after env fix. `https://www.tokoflow.com` returns 200 across `/`, `/login`, `/register`, `/pricing`.
- Domain alias chain: `www.tokoflow.com` (canonical) ← apex `tokoflow.com` (307 → www) ← deploy URL.

**Vault updated:** `/Users/muhamadaldiansyah/base/vault/credentials/tokoflow.md` now carries Supabase ref + PAT + anon/service keys + Google OAuth Client ID/Secret + OpenRouter key + Gmail App Password reference.

### 2026-05-06 · Overnight build — Phase 0 enabling infra + Year-2 AI scaffolds + audit pass

Single overnight session (00:08 → 07:16). Founder override of synthesis discipline ("no Phase 1 build until Gate 0 passes") to ship validation tooling + Year-2 scaffolds in parallel. 26 features + 11 audit-fix bugs in commit `6f4d988`. Build clean, TS-strict pass, lint-clean on touched files. Full diary in [`docs/CHANGES-2026-05-06.md`](./docs/CHANGES-2026-05-06.md).

**Phase 0 enabling infrastructure (all live):**
- Migrations 089–093 applied to Supabase `yhwjvdwmwboasehznlfv` via Management API. 089 unify money types · 090 jsonb shape constraints · 091 FK index · **092 phase_0_* tracking tables** (interviews, distribution_metrics, smoke_test_log) · **093 photo_magic columns** (profiles.bio, products.source).
- `/admin/phase-0` dashboard with 12 sub-metrics → 7 SYNTHESIS-level triggers (4 in-dashboard + 3 external).
- `/admin/phase-0/{interviews,distribution,smoke-test}` entry forms.
- `/api/admin/phase-0` aggregation + `/export` Markdown retrospective with auto-decision (KILL/PASS/PARTIAL/PENDING split correctly between data-driven vs external).
- AI cost measurement script reconciled — script REPLY_DRAFT_PROMPT now mirrors production verbatim.

**Year-2 features pulled forward (per founder override):**
- **Background Twin** at `/api/twin/payment-match` — Tier 3 autonomous, ESCALATE on <80% confidence.
- **Foreground Assist** at `/api/assist/reply-draft` — Tier 2, draft-only, response always carries reminder *"Tokoflow drafts. You send. Customer relationship stays with you."*
- `lib/ai/twin-prompts.ts` — production prompts + `callTwinAI` helper (AbortController 20s timeout, OpenRouter rankings headers, AI usage propagation).
- `/admin/ai-test` calibration console — sample DuitNow notif + WA history (BM/EN code-switch) preloaded.
- **Photo Magic v1** — `PhotoMagicEntry` (camera capture + canvas resize 1024px max edge JPEG 0.85) + `/api/onboarding/photo-magic/persist` (atomic profile + products write, INSERT-then-DELETE order).
- **Repeat Order** — `/api/customers/[id]/reorder` (Klaviyo customer-ownership inheritance) + Repeat button on customer detail.

**Audit pass — 11 real bugs fixed:**
- `callTwinAI` had no fetch timeout — added AbortController 20s default.
- Phase 0 export auto-decision was stuck in PARTIAL because external triggers always PENDING — split data-driven vs external.
- OrderForm double-decoded reorder items param; `%` literals throw URIError silently swallowed.
- Phase 0 routes accepted dead `"founder"` role string not in `USER_ROLES` — removed across 5 routes.
- `copy.empathy.midRush` said "I'll handle customer chat" — bible violation, rephrased to "I'll draft replies".
- Phase 0 entry forms swallow network errors (try/finally with no catch) — added explicit catch.
- PhotoMagicEntry called `.products.length` without array check — added shape guard.
- Reconciled production/script REPLY_DRAFT_PROMPT divergence per CLAUDE.md "keep these in sync."
- Plus dashboard header miscount, twin/assist usage propagation, surface fixes.

**State for the morning:**
- Pushed to `origin/main` as `6f4d988` (Vercel auto-deploys).
- Local + Vercel production envs both have canonical Tokoflow OpenRouter key.
- Founder profile `role='admin'` verified.
- Phase 0 tools live → Aldi can begin Week 1 (interview script + smoke test diary).

### 2026-04-28 · Bible v1.2 — Three-Tier Reality + 2-Layer Twin (this session)

8 ultrathink rounds + Steve Jobs lateral framing + devil's advocate red-team + critique-driven refinements. **Strategy locked, no code yet.** All in [`docs/positioning/`](./docs/positioning/) (versioned v1.2):

- **Root problem refined**: "operations ate craft" (sweeping) → **Three-Tier Reality** (Pure Craft / Customer Relationship / Mechanical Residue) — D-013
- **Solution architecture**: monolithic "autonomous twin" → **2-layer twin**: Background Twin (Tier 3, autonomous, invisible) + Foreground Assist (Tier 2, suggests, merchant sends). Trust transfer protected. — D-014
- **New tagline**: **"We handle the receipts. Not the recipes."** (Bahasa: *"Resi kami urus. Resep kamu."*). Kitchen line literal. "Less admin. More making." retired as generic. "From snap to sold" demoted to Photo Magic feature tagline.
- **6th iconic moment**: **The Disappearing Work** — felt absence of Tier 3 work, like Touch ID replacing password. New doc [`08-the-disappearing-work.md`](./docs/positioning/08-the-disappearing-work.md).
- **Photo Magic v1 reframed extraction-only** — AI parses inventory/pricing, **leaves photo untouched**. Kitchen-protection enforced.
- **Real moat sharpened** — 4-dimensional: unstructured input + Bahasa-first conversational + compliance silent + buyer experience. Not "AI labor" generic.
- **Wave 1-5 expansion hypothesis** — Wave 1 mompreneur F&B Shah Alam → Wave 2 vertical-first MY (kosmetik/fashion/jasa) → Wave 3 geographic (KL/Penang/SG) → Wave 4 cross-pattern (creator/freelancer) → Wave 5 global. Bridges mission-wedge altitude gap.
- **Phase 0 expanded** — 5 friendly + 5 hostile interviews + manual twin smoke test + AI cost measurement. 5 pre-committed kill triggers.
- **"Love" operationally defined** — Sean Ellis 40% + DAU 70% + spontaneous referral + NPS 8 + 3hr/week craft saved.
- **Phase 2 reframed** — milestone (50 paying) → underlying questions (Q1 retention >70%, Q2 CAC payback <3mo, Q3 K-factor >0.3).
- **Tax demoted** — LHDN MyInvois moved Phase 1 hero → Pro/Business gated (SST RM 500K threshold reality).
- **"What we refuse to do" list** — 10-item explicit restraint declaration as marketing weapon.
- **Distribution hypothesis** — FB groups (Mommies Daily, Ibu-Ibu Bisnes Online MY), TikTok mompreneur creators, WhatsApp komuniti. Anti-channels: LinkedIn, Twitter/X, paid Google Ads.
- **Lifestyle vs venture-scale acceptance** — RM 100-300K MRR ceiling realistic Year 3-5; venture-scale upside not assumption — D-015.
- **Internal vs customer-facing naming discipline** — "Twin/Background/Foreground/Tier 3" never expose to user — D-016.

Decision logs: D-013, D-014, D-015, D-016, D-017 (9 critique-driven refinements).

### 2026-04-27 · "From snap to sold" + anti-anxiety + microcopy

Shipped across 5 commits (10bc895 → 6fa38c3). **Code complete from this pass:**

- **Marketing reposition** — landing, features, pricing, about, contact, mitra, toko, coba-aplikasi rewritten; LHDN demoted from hero to silent superpower
- **Pricing collapsed** — UI shows Free / Pro RM 49 / Business RM 99 only; legacy pack constants `@deprecated`
- **Anti-anxiety sweep** — `BeresCelebration` deleted, `OnboardingChecklist` reframed as suggestions, `TrialBanner` quiet line at exhausted only, `getNudgeLevel` simplified to `"none" \| "exhausted"`
- **Compliance gating** — TIN/BRN/SST inputs in settings gated to Pro merchants or those with tax info entered
- **Microcopy library** — `lib/copy/index.ts` wired into 4 list empty states
- **Empathy moments shipped** — Hari Sepi, Customer Returns, Anniversary, Pre-Ramadan, Mid-Rush
- **Cron copy rewrite** — removed comparison shaming, robotic factoids, pressure tone, Indonesian leaks
- **Photo Magic plan** — [`P4-photo-magic-plan.md`](./docs/positioning/P4-photo-magic-plan.md) scopes 1-photo onboarding ticket

> **Note on tagline migration** (resolved 2026-05-05): the brand-level tagline "We handle the receipts. Not the recipes." (BM: "Resi kami urus. Resep kamu.") is live on landing/features/pricing/layout metadata. "From snap to sold" and "Less admin. More making." have been retired from marketing copy. "From snap to sold" remains reserved as the Photo Magic onboarding feature-line per bible v1.2.

---

## Positioning Loop — continuous radical search (started 2026-05-01)

> **Mode operasi: CONTINUOUS LOOP.** A 20-cycle adversarial positioning search is wired up to find a positioning that beats v1.2 — radical, not refined. While the loop is running, this section governs cycle behavior.

**What:** 20 cycles rotating through HYPOTHESIZE_RADICAL → RED_TEAM (3 personas: Bu Aisyah / Steve Jobs Maximalist / YC Devil's Advocate) → RESEARCH (competitor + cross-domain analogy) → SYNTHESIZE → LATERAL_JUMP → CONSTRAINT_HARDEN → DELETE_PASS, optimizing 8 dimensions toward all-≥9 convergence.

**Brain:** [`docs/positioning/loop/LOOP_INSTRUCTIONS.md`](./docs/positioning/loop/LOOP_INSTRUCTIONS.md) — full mandate, mode procedures, scoreboard, convergence criteria, forbidden phrases.

**Wrapper:** `scripts/run-positioning-loop.sh` — Layer 3 of the infinite-loop stack. Per-cycle = fresh `claude -p` session, context resets every cycle, MAX_CYCLES=20, CYCLE_TIMEOUT=2400s.

**State (disk = truth):**
- `runs/.loop-counter` — last completed cycle (wrapper-managed)
- `docs/positioning/loop/current-best.md` — leading positioning hypothesis
- `docs/positioning/loop/scoreboard.md` — 8-dim scores + history
- `docs/positioning/loop/CHANGELOG.md` — one line per cycle
- `docs/positioning/loop/{hypotheses,critiques,research,synthesis}/cycle-NNN.md` — per-cycle artifacts
- `docs/positioning/loop/CONVERGED.md` — sentinel (wrapper detects → stops loop)

**Per-cycle rules:**
1. Read `$LOOP_CYCLE` env var → know your cycle number → look up mode in table.
2. Read disk state first (current-best.md, scoreboard.md, last 3 CHANGELOG lines, latest cycle artifact).
3. Execute exactly ONE cycle per the mode procedure in LOOP_INSTRUCTIONS.md. Use ultrathink.
4. Write artifact to correct subdir, append CHANGELOG line, update INDEX/scoreboard.
5. Exit cleanly. Wrapper handles next session.
6. Never run multiple cycles in one session. Never ask the user mid-cycle. Never modify v1.2 archive files (`00-manifesto.md` through `08-the-disappearing-work.md`).

**Recovery from compaction or fresh session mid-loop:**
1. `cat runs/.loop-counter` → last completed cycle. Next = +1 (or read `$LOOP_CYCLE`).
2. Read last 3 lines of `CHANGELOG.md` → know what was just done.
3. Read latest artifact under `loop/{hypotheses,critiques,research,synthesis}/` → know prior context.
4. Resume from the next cycle. Disk is the answer — do not ask the user "where were we?".

**v1.2 baseline scoreboard (cycle 0):** SimpIT 6 / ZeroExt 3 / AInative 5 / JobsUX 5 / RevPot 5 / Magic 4 / 60sDemo 5 / Defense 6 → avg **4.9**. Goal: ≥9 across all 8.

---

## Phase 4 — deferred (post-launch)

| Item | Effort | Status |
|---|---|---|
| AI order parsing | ~16h | **Shipped** (voice, image, paste — all 3 in `features/orders/components/`) |
| Peer benchmark | ~24h | **Shipped** (`/api/benchmark` + pricing-compass in ProductForm) |
| Komunitas group-buy finish | ~28h | Tables + pages exist; group-buy pooling + announcement push not built |
| TikTok Shop MY sync | ~40h | Not ported. Lives in CatatOrder commit `f81e083`; needs TS port + schema for Tokoflow |
| Shopee MY sync | ~15h after TikTok | 0% |
| BM localization | ~40h | 0% — i18n scaffold not in place |
| Accounting sync (SQL Account, Bukku, AutoCount) | ~60h | 0% |
| Franchise / multi-outlet (Business tier RM 99) | ~60h | 0% |
| Singapore + Brunei cross-border | ~40h | 0% |

---

## Real-world ops (user action — code can't do)

- [ ] **MDEC MD Status** — apply at mdec.com.my (not yet applied; enables RM 1K paid-up vs RM 500K for foreign-owned Sdn Bhd; see [`docs/ops/sdn-bhd-roadmap.md`](./docs/ops/sdn-bhd-roadmap.md))
- [ ] Sdn Bhd registration — engage company secretary, file SSM post-MDEC approval (~2-4 weeks post-MDEC; with MD Status paid-up = RM 1K)
- [ ] Malaysian bank account (Maybank Biz / CIMB Biz — prereq for all gateways)
- [ ] **CHIP marketplace operator** application (chip-in.asia — Level 4 target; apply immediately post-Sdn Bhd; enables Bu Aisyah bank-account-only onboarding)
- [ ] Billplz merchant account — upload Sdn Bhd docs (Level 2 bridge while CHIP integration is built; also request marketplace/platform tier)
- [ ] ToyyibPay — verify IC-only claim at toyyibpay.com/register before building; if confirmed, implement as 2-3 day bridge; if Sdn Bhd required, skip in favour of CHIP Level 4
- [ ] MyInvois production certification (post Sdn Bhd verification)
- [x] `tokoflow.com` domain procured + Vercel alias live
- [x] Supabase migrations 001-109 applied to project `emcuvtqafisspsefsoiy` (Singapore) — fresh provision 2026-05-18 via `supabase db push`; 099-109 added 2026-05-29 → 06-04 (inventory ledger, piutang summary, delivery rates, lifetime free orders, private payment-proofs bucket, payment_status triggers, awaiting_payment)
- [x] OpenRouter API key set in Vercel production env (Tokoflow-specific key, set 2026-05-18 via REST API)
- [x] Gmail SMTP creds set in Vercel production (shared App Password — `aldhionet@gmail.com`)
- [x] Supabase region: Singapore (`ap-southeast-1`) ✓
- [ ] Founder profile `role='admin'` set on new Singapore Supabase (was set on old Mumbai project; needs re-set after first sign-up)
- [ ] Populate Billplz / MyInvois env vars in Vercel production (still placeholder)
- [ ] Publish Google OAuth consent screen (currently Testing mode — only test users can sign in)

---

## Known issues (as of 2026-04-24)

- ~~**Vercel auto-deploy is silent.**~~ Resolved 2026-04-27. GitHub App grant + `vercel git disconnect && vercel git connect` flushed the stale link. Pushes to `main` now deploy automatically again.
- **Vercel production env vars** were stored as empty encrypted strings when the project was set up. Sync from `.env.local` → Vercel via the REST API (not the CLI — CLI stdin piping silently stored empties). Some Phase 0 service env vars (`BILLPLZ_*`, `MYINVOIS_*`, `OPENROUTER_API_KEY`, `GMAIL_*`) are still unset in production because we don't have the creds yet.
- **Test-mode Google OAuth.** Only emails added to the Test users list in Google Cloud Console can sign in. Publish the consent screen before private beta.
- **Vercel CLI stdin-piping bug confirmed (2026-05-18):** `printf '%s' "value" | vercel env add KEY production` on CLI v52 stores an empty encrypted string. Verified by `vercel env pull` after every push. **Use the Vercel REST API instead** (`POST /v10/projects/{id}/env` with JSON body + `upsert=true`) — that path works reliably. The token lives at `~/Library/Application Support/com.vercel.cli/auth.json` under the `token` key.

---

## Credentials

Vault at `~/base/vault/credentials/tokoflow.md`:
- Supabase project ref, anon key, service role key, access token (never in repo, never in .env.example)
- Google OAuth client id + secret (enabled on Supabase auth, not in app env)

---

*Last updated: 2026-06-06 · Indonesia localization (Kedaiflow MY codebase → Tokoflow ID). Codebase swapped + run as Indonesia via the country axis (default ID): currency Rp app-wide, Midtrans payment, e-Faktur/PPN tax, +62 phone, WIB, ID couriers, 38 provinces/88 cities. DB `yhwjvdwmwboasehznlfv` reset + 111 migrations re-applied (110 = ID defaults, 111 = ID geo + Bahasa labels). Marketing site + tax dashboard + settings rewritten to Bahasa Indonesia / ID; Settings Pro = Rp 99.000/bulan via Midtrans. Vercel prod env synced. Build green. See the `2026-06-05 → 06-06 · Indonesia localization` entry above for detail. Remaining (creds/decisions, not code): Midtrans key, e-Faktur/Coretax integration, full dashboard BI copy, strategy-docs ID rewrite, `tokoflow.co.id` DNS. The deeper strategy/positioning sections of this file are MY-legacy.*
