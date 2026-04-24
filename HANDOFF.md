# Tokoflow — Handoff

**Status:** Phase 1 complete + Phase 2 MyInvois / Billplz scaffold complete.
**Code is ready for Phase 0 sandbox validation.** Not yet deployed — see Infra checklist below.

Zero user-visible Bahasa Indonesia strings remain. Midtrans is fully removed. Billplz is wired. MyInvois submit/status/cancel routes are live. Private beta launch is gated only on real Phase 0 validation + Sdn Bhd + Billplz merchant account + MyInvois cert.

---

## Delivered (what's in this tree)

### Translation — 100% EN
- All marketing (landing, pricing, features, about, contact, privacy, terms, blog, coba-aplikasi, mitra, toko, komunitas, ComingSoon)
- All auth (login, register, forgot-password, reset-password, social)
- All onboarding (`/setup`)
- All customer-facing public (`/pesan/[slug]/*`, `/r/[id]/*`)
- All dashboard interiors (pesanan, produk, pelanggan, pengaturan, faktur, komunitas, persiapan, rekap, pajak, profil, admin)
- All features components (orders, products, customers, recap, invoices)
- All WA message builders, canvas receipt generator, PDF invoice generator
- All cron push-notification messages (engagement, alerts, morning brief)
- All API route error messages + AI Gemini prompts (`/api/recap/analyze`, `/api/voice/parse`, `/api/image/parse`)
- Navigation labels, Sidebar, Mobile header, Footer, MarketingNav
- Order/payment status labels cascade from a single source (`features/orders/types/order.types.ts`)

### Payment — Billplz wired, Midtrans deleted
- `lib/billplz/` — `types.ts`, `client.ts`, `verify.ts`, `index.ts`. Zero SDK, HMAC-SHA256 X-Signature, timing-safe.
- `app/api/billing/payments/route.ts` — creates Billplz bill, returns payment URL.
- `app/api/billing/webhook/route.ts` — verifies X-Signature, updates payment_orders, activates plans, credits referrers.
- Client sites (`pengaturan`, `faktur`) redirect to Billplz-hosted payment page. No Snap SDK, no popup.
- `lib/midtrans/` — DELETED.
- `features/billing/services/payment-service.ts` — DELETED (orphaned).

### MyInvois — fully scaffolded
- `lib/myinvois/types.ts` — UBL 2.1 types + state codes + document statuses.
- `lib/myinvois/generate-json.ts` — UBL 2.1 Invoice builder (supplier/buyer parties, line items, tax totals, SHA-256 hash). Exports `computeInvoiceTotals`, `MY_INVOIS_WALK_IN_BUYER`, `MY_STATE_CODES`.
- `lib/myinvois/client.ts` — OAuth client_credentials token cache, `submitDocuments`, `getDocumentStatus`, `cancelDocument`, `rejectDocument`, `getSubmission`.
- `features/invoices/services/myinvois-adapter.ts` — bridges Tokoflow DB invoice → MyInvois document. Handles phone normalization, address splitting, proportional discount allocation, walk-in buyer fallback, >RM10,000 rule detection.
- `app/api/invoices/[id]/myinvois-submit/route.ts` — Pro-plan-gated submission route. Persists UUID + submission_uid + status + long_id on the invoice.
- `app/api/invoices/[id]/myinvois-status/route.ts` — status polling with DB sync on transition.
- `app/api/invoices/[id]/myinvois-cancel/route.ts` — 72-hour window validation.

### Config — fully MY-localized
- `config/plans.ts` — MY pricing (PACK RM 5, MEDIUM RM 8, UNLIMITED RM 13, BISNIS RM 49, BUSINESS RM 99). `formatPrice()` → "RM X". `BISNIS_CODE` preserved for DB compat.
- `config/site.ts` — Tokoflow brand, MY LHDN-first keywords.
- `config/my-cities.ts` — NEW. 43 cities × 16 states + helpers.
- `config/business-types.ts` — 10 types with MY-localized products + TikTok Shop Reseller added.
- `config/categories.ts` — EN fallback categories.
- `config/navigation.ts` — EN labels, BI hrefs (route rename deferred).

### Database — migration 077 ready
`supabase/migrations/077_my_tax_upgrade.sql` adds:
- `profiles`: brn, tin, sst_registration_id, myinvois_client_id, myinvois_client_secret_enc, default_sst_rate. Quiet-hours defaults shifted to MYT.
- `customers`: tin, sst_registration_id, brn.
- `invoices`: sst_rate, sst_amount, myinvois_submission_uid, myinvois_uuid, myinvois_long_id, myinvois_status, myinvois_submitted_at, myinvois_validated_at, myinvois_errors, buyer_tin, buyer_brn, buyer_sst_id, requires_individual_einvoice.
- `payment_orders`: billplz_bill_id, billplz_collection_id, billplz_url, billplz_paid_at.
- Legacy ID columns commented for removal in migration 078 after cutover.

### Phase 0 spikes — ready to run
`scripts/phase-0/`:
- `myinvois-spike.ts` — OAuth + submit hello-world. Run: `npx tsx --env-file=scripts/phase-0/.env.phase-0 scripts/phase-0/myinvois-spike.ts`
- `billplz-spike.ts` — Create bill + X-Signature round-trip verify.
- `merchant-interview.md` — 10-merchant script bilingual, pass/fail criteria.
- `.env.phase-0.example` — env var template.

### Housekeeping
- `CLAUDE.md` — rewritten as Tokoflow spec.
- Legacy BI content archived under `content/blog/_archived_bi/` and `docs/_archived_bi/`.
- Domain references: all `catatorder.id` → `tokoflow.com`, all `CatatOrder` → `Tokoflow`.

---

## Your action (Phase 0 validation)

1. Register MyInvois preprod at https://preprod.myinvois.hasil.gov.my → get Client ID + Secret.
2. Register Billplz sandbox at https://www.billplz-sandbox.com → get API key + Collection ID + X-Signature key.
3. `cp scripts/phase-0/.env.phase-0.example scripts/phase-0/.env.phase-0` + fill in.
4. Run both spike scripts. **Gate A:** both must pass.
5. Interview 10 MY merchants using `scripts/phase-0/merchant-interview.md`. **Gate A:** ≥7/10 score e-Invoice panic ≥7/10.
6. Contact Niagawan sales — confirm their e-Invoice timeline is ≥6 months away.
7. Submit MDEC Digitalisation Partner application (6-8 week lag).

If any gate fails — pivot wedge before more code.

---

## Infra checklist (before deploy)

- [ ] Sdn Bhd registration (nominee director route acceptable; ~RM 10-20K/year)
- [ ] Malaysian bank account opened (prerequisite for Billplz KYB)
- [ ] Billplz merchant account — upload Sdn Bhd docs
- [ ] MyInvois production credentials (after LHDN verifies Sdn Bhd)
- [ ] New Supabase project in Singapore region (ap-southeast-1), apply migrations 001-077
- [ ] Configure env vars (see `CLAUDE.md` → Environment variables):
  - `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `BILLPLZ_API_KEY`, `BILLPLZ_COLLECTION_ID`, `BILLPLZ_X_SIGNATURE_KEY`, `BILLPLZ_BASE_URL`
  - `MYINVOIS_CLIENT_ID`, `MYINVOIS_CLIENT_SECRET`, `MYINVOIS_BASE_URL`
  - `OPENROUTER_API_KEY`, `CRON_SECRET`
- [ ] Procure `tokoflow.com` domain; Vercel deployment
- [ ] MDEC Digitalisation Partner certification (structural GTM lever)

---

## Open work — after Phase 0 passes

### Phase 2 final touches (code, ~40h)
1. **Rewrite InvoiceForm.tsx** — remove NPWP/NITKU inputs, add TIN/BRN/SST inputs with validation; wire the MyInvois submit button + status polling UI.
2. **Rewrite InvoiceDetail.tsx** — show MyInvois UUID + QR code + long ID; cancel button (72h window).
3. **Tax engine refactor** — replace `/app/api/tax/pph-calculation/` (Indonesian monthly PPh) with annual MY tax reports. Replace `/app/api/invoices/ppn-summary/` with SST summary.
4. **Delete `lib/efaktur/`** and `features/invoices/types/efaktur.types.ts` once InvoiceForm/InvoiceDetail no longer import them.
5. **Staff accounts + order assignment** (Orderla complaint #1).
6. **Customer accounts + 1-tap reorder** (Orderla founder-admitted gap).
7. **Private beta** — 20 merchants, 3-week retention ≥ 70% (Gate D).

### Route rename (separate PR, risky)
- `/pesanan` → `/orders`, `/produk` → `/products`, `/pelanggan` → `/customers`, `/persiapan` → `/prep`, `/rekap` → `/recap`, `/faktur` → `/invoices`, `/komunitas` → `/community`, `/pajak` → `/tax`, `/pengaturan` → `/settings`, `/pesan/[slug]` → `/order/[slug]`
- ~200+ internal `Link href=`, `router.push`, and service URL updates
- 301 redirects in `next.config.ts` or `middleware.ts`

### Post-launch (Q4 2026 +)
- Port CatatOrder komunitas feature (wedge #3 — merchant density-gated)
- Native accounting sync (SQL Account, Bukku, AutoCount)
- TikTok Shop MY integration
- BM localization (phase 2 UI)
- Franchise / multi-outlet mode (RM 99 Business tier)
- Expand to Brunei + Singapore via DuitNow QR cross-border

---

## Snapshot

```
/Users/muhamadaldiansyah/base/tokoflow/
├── CLAUDE.md                                    ← Tokoflow spec
├── HANDOFF.md                                   ← this file
├── scripts/phase-0/                             ← spike scripts + interview
├── config/
│   ├── plans.ts (MY pricing)
│   ├── site.ts (Tokoflow brand)
│   ├── my-cities.ts (NEW)
│   ├── business-types.ts (EN + MY samples)
│   ├── categories.ts (EN)
│   └── navigation.ts (EN labels, BI hrefs)
├── lib/
│   ├── billplz/                                 ← active
│   ├── myinvois/                                ← NEW, active
│   ├── efaktur/                                 ← LEGACY (stub; delete w/ InvoiceForm rewrite)
│   └── utils/wa-messages.ts (EN)
├── supabase/migrations/077_my_tax_upgrade.sql
├── app/
│   ├── (marketing)/                             ← EN
│   ├── (auth)/                                  ← EN
│   ├── (onboarding)/                            ← EN
│   ├── (public)/                                ← EN
│   ├── (dashboard)/                             ← EN
│   ├── (admin)/                                 ← EN
│   └── api/
│       ├── billing/                             ← Billplz
│       └── invoices/[id]/myinvois-{submit,status,cancel}/route.ts
├── features/
│   ├── orders/, products/, customers/, recap/, referral/ ← EN
│   └── invoices/services/myinvois-adapter.ts    ← NEW
└── components/layout/ (all EN)
```

## Resume point for next session

1. Verify Phase 0 spikes pass (your action).
2. If pass — rewrite InvoiceForm.tsx for MyInvois UI (Phase 2 final touch #1).
3. Private beta 20 merchants.
4. Public launch Q3 2026 for LHDN panic window.
