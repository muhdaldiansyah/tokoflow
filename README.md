# Tokoflow

**LHDN-ready WhatsApp storefront for Malaysian SMBs.** Share an order link, customers self-order, submit each sale to LHDN MyInvois in one tap.

**Status:** Phase 1 + Phase 2 code complete · route rename complete · database + 80 migrations applied · Google OAuth wired · pre-launch. Launch-blocked on Phase 0 validation (LHDN preprod spike, Billplz sandbox spike, 10 merchant interviews, MDEC Partner certification) + Sdn Bhd + real-world ops. See [HANDOFF.md](./HANDOFF.md).

**Target market:** Malaysia — RM 1M–5M turnover merchants facing the LHDN e-Invoice Phase 4 mandate (enforcement 1 Jan 2027, relaxation ends 31 Dec 2026).

**Codebase:** ~45K LOC across 319 TS/TSX files. Zero user-visible Bahasa Indonesia strings. Zero commission. 0% platform fee.

## What it does

Malaysian small businesses take orders on WhatsApp — chat piles up, orders slip, LHDN deadlines loom. Tokoflow gives merchants a **store link** — customers order themselves, every order lands tidy, and (on the Pro tier) the merchant ships each invoice to MyInvois with one tap. DuitNow QR settles payment. No commission. Customers stay yours.

## Core wedge

1. **Compliance (urgent, dated):** native LHDN MyInvois integration. Orderla.my has zero e-Invoice support; Niagawan is building but not shipped. RM 10,000 individual-invoice rule live 1 Jan 2026; Phase 4 enforcement 1 Jan 2027.
2. **AI-native (shipped):** paste WhatsApp chat → order, voice → order, screenshot → order (Gemini Flash Lite via OpenRouter). Prompts tuned for Malay / English / Manglish vocab.
3. **Community data (shipped, density-gated):** peer benchmark live at `/api/benchmark` with a ≥10 users/cluster gate. Group-buy pooling deferred to Phase 4.

MVP for launch = wedge 1. 2–3 are retention differentiators.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 · React 19 · TypeScript |
| Styling | Tailwind CSS 4 · shadcn/ui |
| Database | Supabase (Mumbai region — Singapore migration planned) · 80 migrations (000 baseline + 001-079) |
| Auth | Supabase Auth (email + Google OAuth in testing mode) |
| Payment | Billplz — FPX / DuitNow QR / cards (`lib/billplz/`, zero-SDK adapter) |
| Tax / e-Invoice | LHDN MyInvois UBL 2.1 JSON (`lib/myinvois/`) + 72h cancel window |
| AI | Gemini Flash Lite via OpenRouter |
| Deploy | Vercel |

## Pricing (MYR)

| Tier | Price | Included |
|---|---|---|
| Free | — | 50 orders/month, all core features (store link, AI parse, recap, customer directory) |
| Top-up pack | RM 5 / 50 orders | Never expires |
| Top-up saver | RM 8 / 100 orders | 20% off per order |
| Unlimited | RM 13 / month | Unlimited orders, no MyInvois |
| **Pro — LHDN-ready** | **RM 49 / month** | Everything + one-tap MyInvois submission + SST calculation + >RM 10K individual-einvoice flag + 72h cancel window |
| Business | RM 99 / month | Franchise · API · white-label — Phase 4, not yet wired |

MDEC Digitalisation Partner grant co-funding for eligible MSMEs is planned — partnership application is pending, not yet certified.

## What's shipped (this session)

**Phase 2 — 8/8 tasks complete**

1. `InvoiceForm.tsx` rewritten: TIN/BRN/SST inputs, SST 0/6% toggle, MyInvois submit button with 2-min status polling, RM 10K warning, +60 phone
2. `InvoiceDetail.tsx` rewritten: MyInvois UUID + longId, 72h cancel modal, PDF download
3. Tax engine: `/api/tax/summary` + `/api/invoices/sst-summary` replace Indonesian PPh routes; `/tax` page with copy-for-RMCD-SST-02 helper
4. Staff accounts (migration 079): CRUD at `/settings/staff` + order assignment via `AssigneePicker`
5. Customer 1-tap reorder: `/api/public/order-history` + past-orders panel on storefront
6. `lib/efaktur/` deleted + 4 legacy routes removed
7. NPWP/NITKU cleanup: customers API, pengaturan, PDF, WA, cron all use TIN/BRN/SST
8. Private beta prep: typecheck clean, Next build green, analytics events wired

**Route rename** — `/pesanan → /orders`, `/produk → /products`, `/pelanggan → /customers`, `/persiapan → /prep`, `/rekap → /recap`, `/faktur → /invoices`, `/komunitas → /community`, `/pajak → /tax`, `/pengaturan → /settings`, `/pesan/[slug] → /order/[slug]`, plus `/baru → /new` leaf rename. Middleware 301-redirects every legacy path so WhatsApp + bookmark links survive.

**DB reset + re-migrate** — public schema dropped, 80 migrations applied via `supabase db push`, migration tracker in sync with CLI. 29 tables · 60 RLS policies · 27 stored functions · 5 storage buckets · zero legacy `tf_*`/`av_*`/`kn_*` leftovers.

**Google OAuth enabled** on Supabase auth (client id + secret in vault, not in app env — Supabase handles the flow server-side). Consent screen in Testing mode — add beta testers to the Test users list until the app is published.

## What's remaining (honest list)

### Phase 0 validation gates (your action, before launch)

- [ ] LHDN MyInvois preprod spike returns a valid `submissionUid` + `uuid`
- [ ] Billplz sandbox X-Signature round-trip passes (genuine + tamper tests)
- [ ] 10 merchant interviews — ≥7 score LHDN panic ≥7/10, ≥6 willing to pay RM 20-40/mo
- [ ] MDEC Digitalisation Partner application cleared
- [ ] Niagawan e-Invoice timeline confirmed ≥6 months away

Scripts at `scripts/phase-0/`. If any gate fails → re-evaluate the wedge before more code.

### Real-world ops (your action)

Sdn Bhd registration · Malaysian bank account · Billplz merchant KYB · MyInvois production certification · MDEC DP certification · Supabase region migration Mumbai → Singapore · populate Phase 0 service env vars in Vercel production.

### Phase 4 — post-launch growth

Komunitas group-buy finish (~28h) · TikTok Shop MY sync (~40h, exists in CatatOrder commit history, needs TS port) · Shopee MY sync (~15h after TikTok) · BM localization (~40h) · Accounting sync — SQL Account / Bukku / AutoCount (~60h) · Franchise / multi-outlet mode (~60h) · Singapore + Brunei cross-border (~40h).

## Getting started (local dev)

```bash
npm install
cp .env.example .env.local            # fill in Supabase + Billplz + MyInvois creds
npm run dev                           # http://localhost:3000
```

**Phase 0 sandbox spikes** (before going live):

```bash
cp scripts/phase-0/.env.phase-0.example scripts/phase-0/.env.phase-0
npx tsx --env-file=scripts/phase-0/.env.phase-0 scripts/phase-0/myinvois-spike.ts
npx tsx --env-file=scripts/phase-0/.env.phase-0 scripts/phase-0/billplz-spike.ts
```

**Applying migrations to a fresh Supabase project** — link the CLI, then push:

```bash
export SUPABASE_ACCESS_TOKEN=sbp_…
supabase link --project-ref <your-ref>
supabase db push --linked --yes
```

## Project layout

```
app/
├── (marketing)/      # landing, pricing, features, about, contact, blog, toko, mitra, coba-aplikasi, community/[slug]
├── (auth)/           # /login, /register, /forgot-password, /reset-password
├── (onboarding)/     # /setup — 3-step first-run
├── (public)/         # /[slug] customer order form (rewrites to /order/[slug]) · /r/[id] receipt
├── (dashboard)/      # orders, products, customers, prep, recap, invoices, community, tax, settings (+ staff), profil, laporan, pengingat, pembayaran
├── (admin)/          # internal tools
└── api/              # ~60 routes including /invoices/[id]/myinvois-{submit,status,cancel}, /staff, /orders/[id]/assign, /public/order-history, /tax/summary, /invoices/sst-summary

features/             # orders, products, customers, invoices, staff, tax, recap, referral, auth
lib/
├── billplz/          # zero-SDK adapter
├── myinvois/         # UBL 2.1 builder + OAuth client + submit/status/cancel
├── pdf/              # A4 invoice PDF with MyInvois UUID + longId reference
└── supabase/, voice/, offline/, utils/

config/               # plans, site, my-cities, business-types, navigation
scripts/phase-0/      # sandbox spikes + 10-merchant interview script
supabase/migrations/  # 000 (baseline) + 001-079
middleware.ts         # legacy-route 301 redirects
```

## Known issues

- **Vercel auto-deploy is silent.** GitHub → Vercel webhook stopped firing ~Apr 9. Manual `vercel --prod --force` is required until the GitHub App is reinstalled or the webhook redelivers.
- **Vercel production env vars** — some were empty strings when set up; syncing from `.env.local` via the Vercel REST API is more reliable than the CLI. Phase 0 service creds (`BILLPLZ_*`, `MYINVOIS_*`, `OPENROUTER_API_KEY`, `GMAIL_*`) are placeholders until the real credentials exist.
- **Google OAuth** is in Testing mode — only emails on the Test users list can sign in. Publish the consent screen before private beta.

## Documentation

- [CLAUDE.md](./CLAUDE.md) — full technical spec (stack, schema, patterns, integrations, env, known issues)
- [HANDOFF.md](./HANDOFF.md) — status, open work, Phase 0 gates, deployment checklist
- [scripts/phase-0/merchant-interview.md](./scripts/phase-0/merchant-interview.md) — 10-merchant validation script

## License

Private — all rights reserved.
