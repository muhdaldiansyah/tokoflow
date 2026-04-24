# Tokoflow

**LHDN-ready WhatsApp storefront for Malaysian SMBs.** Share an order link, customers self-order, every paid order becomes a MyInvois-compliant e-Invoice automatically.

**Status:** Phase 1 + MyInvois/Billplz scaffold complete. Pre-launch — awaiting Phase 0 sandbox validation and ~80-120h of Phase 2 code (InvoiceForm UI + tax engine + staff/customer accounts). See [HANDOFF.md](./HANDOFF.md).

**Target market:** Malaysia — RM 1M–5M turnover merchants facing the LHDN e-Invoice Phase 4 mandate (enforcement 1 Jan 2027).

**Codebase:** ~44.4K LOC across 319 TS/TSX files. 0 user-visible Bahasa Indonesia strings.

## What it does

Malaysian small businesses take orders on WhatsApp — chat piles up, orders slip, LHDN deadlines loom. Tokoflow gives merchants a **store link** — customers order themselves, every order lands tidy, and (on the Pro tier) auto-submits a UBL 2.1 JSON e-Invoice to MyInvois. DuitNow QR settles payment. No commission. Customers stay yours.

## Core wedge

1. **Compliance (urgent, dated):** native LHDN MyInvois integration. Orderla.my has zero e-Invoice support; Niagawan is building but not shipped. RM 10K individual-invoice rule live 1 Jan 2026; Phase 4 enforcement 1 Jan 2027.
2. **AI-native:** paste WhatsApp chat → order, voice → order, screenshot → order (Gemini Flash Lite via OpenRouter).
3. **Community data (Phase 4):** merchant group-buy + peer benchmarks — defensible moat, ported from CatatOrder after beachhead.

MVP for launch = wedge 1 only. 2–3 are post-beta differentiators.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 · React 19 · TypeScript |
| Styling | Tailwind CSS 4 · shadcn/ui |
| Database | Supabase (Singapore region planned) · 77 migrations |
| Payment | Billplz — FPX / DuitNow QR / cards (`lib/billplz/`, zero-SDK) |
| Tax / e-Invoice | LHDN MyInvois UBL 2.1 JSON (`lib/myinvois/`) |
| AI | Gemini Flash Lite via OpenRouter |
| Deploy | Vercel |

## Pricing (MYR)

| Tier | Price | Included |
|---|---|---|
| Free | — | 50 orders/month, all core features |
| Top-up pack | RM 5 / 50 orders | Never expires |
| Top-up saver | RM 8 / 100 orders | 20% off per order |
| Unlimited | RM 13 / month | Unlimited orders, no MyInvois |
| **Pro — LHDN-ready** | **RM 49 / month** | Everything + MyInvois e-Invoice + auto SST + >RM 10K rule |
| Business | RM 99 / month | Franchise · API · white-label (Phase 4) |

MDEC Digitalisation Partner grant (RM 5,000 matching) halves Pro cost for eligible MSMEs.

## Getting started (local dev)

```bash
npm install
cp .env.example .env.local      # fill in Supabase + Billplz + MyInvois creds
npm run dev                     # http://localhost:3000
```

### Phase 0 sandbox spikes (before first deploy)

```bash
cp scripts/phase-0/.env.phase-0.example scripts/phase-0/.env.phase-0
# Fill in LHDN preprod + Billplz sandbox creds, then:
npx tsx --env-file=scripts/phase-0/.env.phase-0 scripts/phase-0/myinvois-spike.ts
npx tsx --env-file=scripts/phase-0/.env.phase-0 scripts/phase-0/billplz-spike.ts
```

Both must pass before Phase 2 implementation. Also interview 10 merchants using `scripts/phase-0/merchant-interview.md`. See [HANDOFF.md](./HANDOFF.md) for full validation gates.

## What's remaining

### Launch-blocking (Phase 2 — ~80-120h)

| # | Task | Scope |
|---|---|---|
| 1 | `features/invoices/components/InvoiceForm.tsx` rewrite | 353 lines — replace NPWP/NITKU/PPN with TIN/BRN/SST + "Submit to MyInvois" button |
| 2 | `features/invoices/components/InvoiceDetail.tsx` rewrite | 383 lines — MyInvois UUID/QR/longId + cancel (72h window) |
| 3 | Tax engine refactor | 3 routes (`pph-calculation`, `rekap`, `omzet-summary`) — drop PPh monthly, add SST annual |
| 4 | Staff accounts + assignment | New feature, 0 existing files. Orderla complaint #1. |
| 5 | Customer accounts + 1-tap reorder | New feature, 0 existing files. Orderla founder-admitted gap. |
| 6 | Delete `lib/efaktur/` | Unblocked after tasks 1 + 2 (3 files still import) |
| 7 | Clean 20 NPWP/NITKU references | Service-layer cleanup after migration 078 drops cols |
| 8 | Private beta prep | Analytics, onboarding, Pro tier gates |

### Route rename (separate risky PR — ~20-30h)

42 internal link sites + 9 directory renames (`/pesanan` → `/orders` etc.) + 301 redirects + grep audit.

### Phase 4 deferred (post-launch — ~320h total)

Komunitas/group-buy port (40h) · AI order parsing port (16h) · peer benchmark port (24h) · TikTok Shop MY sync (40h) · BM localization (40h) · native accounting sync (60h) · franchise mode (60h) · Singapore + Brunei expansion (40h).

### Real-world ops (your action — code can't do)

Sdn Bhd registration · Malaysian bank account · Billplz merchant KYB · MyInvois production certification · MDEC DP certification · 10 merchant interviews · Domain + Vercel deployment.

## Project layout

```
app/
├── (marketing)/      # Landing, pricing, features, about, contact, blog, toko, mitra
├── (auth)/           # /login, /register, /forgot-password, /reset-password
├── (onboarding)/     # /setup — 3-step first-run
├── (public)/         # /[slug] customer order form, /r/[id] receipt
├── (dashboard)/      # pesanan, produk, pelanggan, faktur, pengaturan, komunitas, pajak, profil
├── (admin)/          # Internal tools
└── api/              # ~60 routes inc. /invoices/[id]/myinvois-{submit,status,cancel}

lib/
├── billplz/          # Zero-SDK adapter (types, client, verify)
├── myinvois/         # UBL 2.1 builder + OAuth client + submit/status/cancel
├── efaktur/          # LEGACY — delete after Phase 2 task 1+2
└── supabase/, voice/, offline/, pdf/, utils/

features/             # orders, products, customers, invoices, recap, referral, auth
config/               # plans, site, my-cities, business-types, navigation
scripts/phase-0/      # Sandbox spikes + merchant interview script
supabase/migrations/  # 001–077 (077 = MY tax schema)
```

## Documentation

- [CLAUDE.md](./CLAUDE.md) — full technical spec (stack, schema, patterns, env vars, remaining work)
- [HANDOFF.md](./HANDOFF.md) — status, open work, Phase 0 gates, deployment checklist
- [scripts/phase-0/merchant-interview.md](./scripts/phase-0/merchant-interview.md) — 10-merchant validation script

## License

Private — all rights reserved.
