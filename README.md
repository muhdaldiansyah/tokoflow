# Tokoflow

> **From snap to sold.** The simplest way for anyone to start selling — one photo to launch your shop. AI handles the conversation, payment, and paperwork so the merchant can focus on what they make.

**Status:** Repositioned 2026-04-27 from "LHDN-ready WhatsApp storefront" to an Apple-grade selling layer. Phase 1 + Phase 2 code complete · 80 migrations applied · Google OAuth wired (testing mode) · pre-launch.

**Strategic compass:** [`docs/positioning/`](./docs/positioning/) — read [`00-manifesto.md`](./docs/positioning/00-manifesto.md) before product decisions. Every feature must pass the 5 tests.

**Target Year 1:** Malaysia, hyperlocal Shah Alam — home F&B mompreneur (Bu Aisyah persona). Concentric expansion: Klang Valley → SEA → global.

**Codebase:** ~45K LOC across ~330 TS/TSX files · ~100 API routes · 5 cron jobs · zero commission · 0% platform fee · merchants own their customers.

## What it does

A merchant takes one photo of their kitchen, counter, or dagangan. In seconds they have a shop link they can share to WhatsApp / IG / TikTok. Customers self-order, DuitNow QR settles payment, every order lands tidy in the merchant's dashboard. AI handles routine customer chat. The dashboard runs warm and quiet — no streaks, no anxiety counters, no "X/50 used" banners. Compliance (LHDN MyInvois e-Invoice) is *built-in* on the Pro tier as a silent superpower, not the pitch.

## The four wedges

1. **The Photo Magic** *(Phase 1, planned — see [`P4-photo-magic-plan.md`](./docs/positioning/P4-photo-magic-plan.md))*: one photo → toko muncul. The iconic interaction.
2. **AI-native** *(shipped)*: paste WhatsApp chat → order, voice → order, screenshot → order. Gemini Flash Lite via OpenRouter. MY SMB vocab, +60 phones, Asia/Kuala_Lumpur.
3. **Community data** *(shipped, density-gated)*: peer benchmark live at `/api/benchmark` (≥10 users/cluster gate). Group-buy pooling deferred to Phase 4.
4. **Silent superpower — LHDN MyInvois** *(shipped, demoted to Pro tier)*: one-tap submit at `/invoices`. Not the pitch. RM 1M–5M relaxation runs through 31 Dec 2026, full enforcement 1 Jan 2027.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 · React 19 · TypeScript |
| Styling | Tailwind CSS 4 · shadcn/ui |
| Database | Supabase (Mumbai region — Singapore migration planned) · 81 migrations |
| Auth | Supabase Auth (email + Google OAuth in testing mode) |
| Payment | Billplz — FPX / DuitNow QR / cards (`lib/billplz/`, zero-SDK adapter) |
| Tax / e-Invoice | LHDN MyInvois UBL 2.1 JSON (`lib/myinvois/`) + 72h cancel window |
| AI | Gemini Flash Lite via OpenRouter |
| Microcopy | `lib/copy/` — voice canon templates per [`docs/positioning/04-design-system.md`](./docs/positioning/04-design-system.md) |
| Deploy | Vercel (auto-deploy on push to `main`) |

## Pricing (MYR)

Three tiers per [`docs/positioning/05-pricing.md`](./docs/positioning/05-pricing.md) (D-008):

| Tier | Price | Included |
|---|---|---|
| **Free** | RM 0/mo | 50 orders/month, all core features (store link, AI parse, recap, customer directory, basic invoices) |
| **Pro** | **RM 49/mo** | Unlimited orders + voice/photo order parsing + pricing whisper + one-tap LHDN MyInvois submit + SST 0/6% reporting + receivables tracking |
| **Business** | RM 99/mo | Pro + multi-staff (2 included, +RM 15/extra) + advanced (still dignifying) analytics + priority support |

The legacy RM 5 / 8 / 13 quota top-up packs are `@deprecated` in `config/plans.ts` — kept for API + DB compat for any grandfathered users; not surfaced in current UI.

## Recent reposition pass (2026-04-27)

Five commits, all live (`10bc895` → `6fa38c3`). Highlights:

- **"From snap to sold"** marketing reposition across 11 pages; LHDN demoted from hero to silent superpower
- **Anti-anxiety sweep** — deleted `BeresCelebration` (3.5s green-wash), reframed `OnboardingChecklist` (no count, no strikethrough), collapsed `TrialBanner` to a single quiet line at exhausted, simplified `getNudgeLevel` to two states
- **Compliance gating** — TIN/BRN/SST inputs only render for Pro merchants or those with tax info already entered
- **Microcopy library** at `lib/copy/index.ts` with templates for empty states, errors, loading, confirmations, success, and the 7 empathy moments. Wired into 4 list views.
- **Empathy moments shipped** — Hari Sepi (morning-brief), Customer Returns + Anniversary + Pre-Ramadan (engagement), Mid-Rush (realtime toast)
- **Cron copy rewrite** — removed comparison shaming, robotic factoids, pressure language, Indonesian leaks
- **Vercel auto-deploy restored** — GitHub App access + `vercel git disconnect/connect` flushed the stale link state

Full history in `docs/positioning/07-decisions.md` and the commit log.

## What's remaining

### Phase 0 validation gates (your action, before launch)

- [ ] LHDN MyInvois preprod spike returns a valid `submissionUid` + `uuid`
- [ ] Billplz sandbox X-Signature round-trip passes (genuine + tamper tests)
- [ ] 10 merchant interviews — ≥7 score LHDN panic ≥7/10, ≥6 willing to pay RM 20–40/mo
- [ ] MDEC Digitalisation Partner application cleared
- [ ] Niagawan e-Invoice timeline confirmed ≥6 months away

Scripts at `scripts/phase-0/`. If any gate fails → re-evaluate the wedge before more code.

### Real-world ops (your action)

Sdn Bhd registration · Malaysian bank account · Billplz merchant KYB · MyInvois production certification · MDEC DP certification · Supabase region migration Mumbai → Singapore · populate Phase 0 service env vars in Vercel production · publish Google OAuth consent screen.

### Big code ticket

**Photo Magic v1** per [`docs/positioning/P4-photo-magic-plan.md`](./docs/positioning/P4-photo-magic-plan.md) — 8–12 days. Phase 1 deliverable; the only iconic interaction the codebase still contradicts.

### Phase 4 — post-launch growth

Komunitas group-buy finish (~28h) · TikTok Shop MY sync (~40h) · Shopee MY sync (~15h) · BM localization (~40h) · Accounting sync (SQL Account / Bukku / AutoCount, ~60h) · Franchise / multi-outlet mode (~60h) · Singapore + Brunei cross-border (~40h).

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

**Applying migrations to a fresh Supabase project**:

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
├── (onboarding)/     # /setup — current 3-step (replaced by Photo Magic when P4 ships)
├── (public)/         # /[slug] customer order form (rewrites to /order/[slug]) · /r/[id] receipt
├── (dashboard)/      # orders, products, customers, prep, recap, invoices, community, tax, settings (+ staff), profil, laporan, pengingat, pembayaran
├── (admin)/          # internal tools
└── api/              # ~100 routes including /invoices/[id]/myinvois-{submit,status,cancel}, /staff, /orders/[id]/assign, /public/order-history, /tax/summary, /invoices/sst-summary

features/             # orders, products, customers, invoices, staff, tax, recap, referral, auth
lib/
├── billplz/          # zero-SDK adapter
├── myinvois/         # UBL 2.1 builder + OAuth client + submit/status/cancel
├── copy/             # microcopy library — empty/error/loading/confirm/success/empathy + jargon-free labels
├── pdf/              # A4 invoice PDF with MyInvois UUID + longId reference
└── supabase/, voice/, offline/, utils/

config/               # plans, site, categories, category-defaults, navigation
docs/positioning/     # strategic compass — manifesto, positioning, product soul, design, pricing, roadmap, decision log, P4 plan
scripts/phase-0/      # sandbox spikes + 10-merchant interview script
supabase/migrations/  # 000 (baseline) + 001-080
middleware.ts         # legacy-route 301 redirects
```

## Known issues

- **Vercel production env vars** — some were empty strings when the project was set up; sync from `.env.local` via the Vercel REST API (not `vercel env add` stdin piping, which silently stored empties). Phase 0 service creds (`BILLPLZ_*`, `MYINVOIS_*`, `OPENROUTER_API_KEY`, `GMAIL_*`) are placeholders until the real credentials exist.
- **Google OAuth** in Testing mode — only emails on the Test users list can sign in. Publish the consent screen before private beta.
- **Supabase region** is Mumbai — move to Singapore (`ap-southeast-1`) before public launch for MYT latency.

(Vercel auto-deploy was silent ~Apr 9 to Apr 27; resolved by re-granting the GitHub App access to this repo + `vercel git disconnect && vercel git connect` to flush the stale link.)

## Documentation

- [`docs/positioning/`](./docs/positioning/) — strategic compass (start with `00-manifesto.md`)
- [CLAUDE.md](./CLAUDE.md) — full technical spec (stack, schema, patterns, integrations, env, known issues)
- [HANDOFF.md](./HANDOFF.md) — status, open work, Phase 0 gates, deployment checklist
- [scripts/phase-0/merchant-interview.md](./scripts/phase-0/merchant-interview.md) — 10-merchant validation script

## License

Private — all rights reserved.
