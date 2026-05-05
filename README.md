# Tokoflow

> **We handle the receipts. Not the recipes.**
> *"Resi kami urus. Resep kamu."*
>
> Tokoflow handles mechanical residue (admin, payment matching, invoicing, status updates) invisibly via Background Twin. Customer relationships stay merchant-controlled, amplified by Foreground Assist that suggests but never sends. Pure craft is protected — Tokoflow never enters the kitchen.

**Status:** Bible v1.2 locked (2026-04-28). Phase 1 + Phase 2 + Year-2 AI scaffolds code complete · 94 migrations applied to live Supabase · Google OAuth wired (testing mode) · pre-launch — gated on Phase 0 8-week adversarial validation (5 friendly + 5 hostile interviews + 14-day smoke test + AI cost measurement + distribution validation + brand resonance) + Sdn Bhd + Billplz KYB.

**Strategic compass:** [`docs/positioning/`](./docs/positioning/) — read [`00-manifesto.md`](./docs/positioning/00-manifesto.md) before product decisions. Every feature must pass **Test 0** (hits one of the Three-Tier Reality: Pure Craft / Customer Relationship / Mechanical Residue) + the 5 tests below it.

**Execution playbook:** [`docs/SYNTHESIS-2026-05-05.md`](./docs/SYNTHESIS-2026-05-05.md) — Phase 0 8-week plan, 7 pre-committed triggers (6 kill + 1 rebrand-flag), strategic analog mapping (Owner.com + Klaviyo + Substack inheritance), backup B2B playbook for scenario (c).

**Target Year 1:** Malaysia, hyperlocal Shah Alam — home F&B mompreneur (Bu Aisyah persona, **PHASE-0-UNVALIDATED**). Wave 2 (Year 2): vertical-first within MY (kosmetik, modest fashion, jasa lokal). Wave 3+: geographic + cross-pattern.

**Codebase:** ~50K LOC · ~115 API routes · 5 cron jobs · zero commission · 0% platform fee · merchants own their customers.

## What it does

A merchant takes one photo of their kitchen, counter, or dagangan. In seconds they have a shop link they can share to WhatsApp / IG / TikTok. Customers self-order, DuitNow QR settles payment, every order lands tidy in the merchant's dashboard. Background Twin matches incoming bank notifications to open orders autonomously. Foreground Assist drafts replies for the merchant to review and send — never sends on its own. The dashboard runs warm and quiet — no streaks, no anxiety counters, no "X/50 used" banners. Compliance (LHDN MyInvois e-Invoice) is *built-in* on the Pro tier as a silent superpower, not the pitch.

## The Three-Tier Reality (root product framework)

Setiap fitur Tokoflow harus hit one of these tiers (Test 0):

| Tier | What it is | Tokoflow's role | Architecture |
|---|---|---|---|
| **Tier 1 — Pure Craft** | What merchant loves (baking, design, writing) | Protect — never enter | (no surface) |
| **Tier 2 — Customer Relationship** | Loyalty, custom orders, school-mom WA threads | Amplify with suggestions, never replace | **Foreground Assist** — `/api/assist/reply-draft` (drafts only) |
| **Tier 3 — Mechanical Residue** | Admin, payment matching, invoicing, status updates | Remove invisibly | **Background Twin** — `/api/twin/payment-match` (autonomous) |

> "Background Twin", "Foreground Assist", "Tier 3" are precision terms for engineering + strategy. **Customer-facing UI never exposes these** — see internal-naming rule in [`docs/positioning/04-design-system.md`](./docs/positioning/04-design-system.md).

## The four wedges

1. **Photo Magic v1** *(shipped 2026-05-06 — see [`P4-photo-magic-plan.md`](./docs/positioning/P4-photo-magic-plan.md))*: one photo → toko muncul. AI extracts inventory + pricing metadata; **photo itself stays untouched** (kitchen-protection: foto IS part of merchant's craft).
2. **AI-native** *(shipped)*: paste WhatsApp chat → order, voice → order, screenshot → order. Plus Background Twin payment matcher + Foreground Assist reply drafter (Year-2 scaffolds shipped 2026-05-06). Gemini Flash Lite via OpenRouter. MY SMB vocab, +60 phones, Asia/Kuala_Lumpur.
3. **Community data** *(shipped, density-gated)*: peer benchmark live at `/api/benchmark` (≥10 users/cluster gate). Group-buy pooling deferred to Phase 4.
4. **Silent superpower — LHDN MyInvois** *(shipped, demoted to Pro/Business tier)*: one-tap submit at `/invoices`. Not the pitch — most home F&B mompreneur Year 1 don't hit the SST RM 500K threshold. Surfaces only when relevant.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 · React 19 · TypeScript |
| Styling | Tailwind CSS 4 · shadcn/ui |
| Database | Supabase (Mumbai region — Singapore migration planned) · 94 migrations |
| Auth | Supabase Auth (email + Google OAuth in testing mode) |
| Payment | Billplz — FPX / DuitNow QR / cards (`lib/billplz/`, zero-SDK adapter) |
| Tax / e-Invoice | LHDN MyInvois UBL 2.1 JSON (`lib/myinvois/`) + 72h cancel window |
| AI | Gemini Flash Lite via OpenRouter — production prompts in `lib/ai/twin-prompts.ts` (Background Twin + Foreground Assist) |
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

## Recent passes

### 2026-05-06 · Overnight build — Phase 0 enabling infra + Year-2 scaffolds + audit pass

Single commit `6f4d988` on main. 26 features + 11 audit-fix bugs. Full diary in [`docs/CHANGES-2026-05-06.md`](./docs/CHANGES-2026-05-06.md). Highlights:

- **Phase 0 admin tooling** — `/admin/phase-0` dashboard (12 sub-metrics → 7 SYNTHESIS triggers) + interviews/distribution/smoke-test entry forms + Markdown retrospective export with auto-decision (KILL/PASS/PARTIAL/PENDING).
- **Background Twin** — `/api/twin/payment-match` autonomous payment matcher, ESCALATE on <80% confidence.
- **Foreground Assist** — `/api/assist/reply-draft` draft-only reply suggestions; response always carries reminder *"Tokoflow drafts. You send. Customer relationship stays with you."*
- **AI test console** — `/admin/ai-test` for prompt calibration with sample DuitNow notif + WA history.
- **Photo Magic v1** — `PhotoMagicEntry` (camera capture + canvas resize) + `/api/onboarding/photo-magic/persist` (atomic INSERT-then-DELETE).
- **Repeat Order** — `/api/customers/[id]/reorder` per Klaviyo customer-ownership inheritance.
- **Migrations 089–093 live** — money-type unification, jsonb shape constraints, FK indexes, phase_0_* tracking tables, photo_magic columns. All applied to Supabase via Management API.
- **AI prompts source-of-truth in `lib/ai/twin-prompts.ts`** with `callTwinAI` helper (20s AbortController timeout, OpenRouter rankings, AI usage propagation).
- **Audit fixes** — callTwinAI timeout, Phase 0 export decision logic, OrderForm double-decode, dead `"founder"` role check, midRush restraint violation, Phase 0 entry-form network errors, PhotoMagicEntry shape guard, prompt sync.

### 2026-04-28 · Bible v1.2 lock — Three-Tier Reality + 2-Layer Twin

Strategic-only pass (no code). Root problem refined from "operations ate craft" → Three-Tier Reality. Solution architecture refined from monolithic twin → 2-layer twin (Background autonomous + Foreground suggest-only). New tagline locked: "We handle the receipts. Not the recipes." Full record in [`docs/positioning/`](./docs/positioning/) and decision log D-013/D-014/D-015/D-016/D-017.

### 2026-04-27 · "From snap to sold" marketing reposition + anti-anxiety sweep

Five commits (`10bc895` → `6fa38c3`). Anti-anxiety: removed BeresCelebration, reframed OnboardingChecklist, simplified `getNudgeLevel` to two states. Compliance gating on TIN/BRN/SST inputs. Microcopy library at `lib/copy/index.ts`. 7 empathy moments wired (Hari Sepi, Customer Returns, Anniversary, Pre-Ramadan, Mid-Rush, etc.).

Full history in `docs/positioning/07-decisions.md` and the commit log.

## What's remaining

### Phase 0 validation gates (8-week adversarial validation)

Tools to run Phase 0 are live (`/admin/phase-0` + AI cost script + smoke-test diary). What still needs to actually happen:

- [ ] **5 friendly + 5 hostile interviews** Shah Alam mompreneur — log via `/admin/phase-0/interviews`
- [ ] **Manual Twin smoke test** — Aldi as Background Twin for 1 volunteer merchant for 14 days; daily log via `/admin/phase-0/smoke-test`
- [ ] **AI cost measurement** at 50-order/month load — run `npx tsx scripts/phase-0/ai-cost/measure.ts --full` (target: ≤RM 25/merchant/month; >RM 30 is kill trigger)
- [ ] **Distribution validation** — Aldi TikTok + komuniti penetration → ≥300 followers + ≥15 inbound DM cumulative by Week 8 (or activate scenario c backup B2B); log weekly via `/admin/phase-0/distribution`
- [ ] **Brand resonance** — friction <4/10 average from 10 interviews → keep Tokoflow; ≥4/10 → trigger rebrand decision
- [ ] **Ariff partnership formal** — kopi 2 jam, decide tier (advisor 1.5% / co-founder 5–10%), sign SAFE/MOU
- [ ] LHDN MyInvois preprod spike returns a valid `submissionUid` + `uuid`
- [ ] Billplz sandbox X-Signature round-trip passes (genuine + tamper tests)
- [ ] MDEC Digitalisation Partner application cleared

If any kill trigger fires → written go/no-go memo within 7 days + formal D-XXX entry in `docs/positioning/07-decisions.md`. No rationalization when emotion arrives.

### Real-world ops (your action)

Sdn Bhd registration · Malaysian bank account · Billplz merchant KYB · MyInvois production certification · MDEC DP certification · Supabase region migration Mumbai → Singapore · populate Billplz / MyInvois / Gmail env vars in Vercel production · publish Google OAuth consent screen.

### Phase 4 — post-launch growth

Komunitas group-buy finish (~28h) · TikTok Shop MY sync (~40h) · Shopee MY sync (~15h) · BM localization full (~40h) · Accounting sync (SQL Account / Bukku / AutoCount, ~60h) · Franchise / multi-outlet mode (~60h) · Singapore + Brunei cross-border (~40h).

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
├── (onboarding)/     # /setup — Photo Magic banner above step 1 (1-photo onboarding entry)
├── (public)/         # /[slug] customer order form (rewrites to /order/[slug]) · /r/[id] receipt
├── (dashboard)/      # orders, products, customers (with Repeat button), prep, recap, invoices, community, tax, settings (+ staff), profil, laporan, pengingat, pembayaran
├── (admin)/          # phase-0 (dashboard + interviews + distribution + smoke-test), ai-test, users, registrations, lookup, mitra, analytics
└── api/              # ~115 routes — including:
                      #   /twin/payment-match (Background Twin)
                      #   /assist/reply-draft (Foreground Assist — drafts only)
                      #   /admin/phase-0/{interviews,distribution,smoke-test,export}
                      #   /onboarding/photo-magic + /persist
                      #   /customers/[id]/reorder
                      #   /invoices/[id]/myinvois-{submit,status,cancel}, /tax/summary, etc.

features/             # orders, products, customers, invoices, staff, tax, recap, referral, auth, onboarding (PhotoMagicEntry)
lib/
├── ai/twin-prompts.ts  # production prompts (PAYMENT_MATCH, CUSTOMER_MEMORY, REPLY_DRAFT, PATTERN_DETECTION) + callTwinAI helper (20s timeout, AI usage propagation)
├── billplz/          # zero-SDK adapter
├── myinvois/         # UBL 2.1 builder + OAuth client + submit/status/cancel
├── copy/             # microcopy library — empty/error/loading/confirm/success/empathy + jargon-free labels
├── pdf/              # A4 invoice PDF with MyInvois UUID + longId reference
├── utils/quiet-hours.ts  # shared MYT quiet-hours boundary check
└── supabase/, voice/, offline/, utils/

config/               # plans, site, categories, category-defaults, navigation
docs/                 # positioning/ strategic compass · SYNTHESIS-2026-05-05.md execution playbook · CHANGES-2026-05-06.md overnight diary
scripts/phase-0/      # sandbox spikes + 10-merchant interview · ai-cost measurement · distribution README · backup-b2b playbook
supabase/migrations/  # 000 (baseline) + 001-093 (94 total, all applied to live Supabase)
middleware.ts         # legacy-route 301 redirects
```

## Known issues

- **Vercel production env vars** — `OPENROUTER_API_KEY` set to canonical Tokoflow key (2026-05-06). Other Phase 0 service creds (`BILLPLZ_*`, `MYINVOIS_*`, `GMAIL_*`) are still placeholders until the real credentials exist.
- **Google OAuth** in Testing mode — only emails on the Test users list can sign in. Publish the consent screen before private beta.
- **Supabase region** is Mumbai — move to Singapore (`ap-southeast-1`) before public launch for MYT latency.

(Vercel auto-deploy was silent ~Apr 9 to Apr 27; resolved by re-granting the GitHub App access to this repo + `vercel git disconnect && vercel git connect` to flush the stale link.)

## Documentation

- [`docs/positioning/`](./docs/positioning/) — strategic compass (start with `00-manifesto.md`)
- [`docs/SYNTHESIS-2026-05-05.md`](./docs/SYNTHESIS-2026-05-05.md) — execution playbook (Phase 0 8-week plan + 7 pre-committed triggers + scenario-c backup)
- [`docs/CHANGES-2026-05-06.md`](./docs/CHANGES-2026-05-06.md) — overnight build session diary (26 features + 11 audit-fix bugs)
- [CLAUDE.md](./CLAUDE.md) — full technical spec (stack, schema, patterns, integrations, env, known issues)
- [HANDOFF.md](./HANDOFF.md) — status, open work, Phase 0 gates, deployment checklist
- [scripts/phase-0/merchant-interview.md](./scripts/phase-0/merchant-interview.md) — 10-merchant validation script (5 friendly + 5 hostile)

## License

Private — all rights reserved.
