# 06 · Roadmap

> Phased execution dari now sampai global. 5 phase, 5+ tahun horizon.

---

## Roadmap Philosophy

Apple-grade ambition + hyperlocal start. Tidak pernah day-1 global. Setiap phase punya gate yang harus passed sebelum lanjut.

**Aturan emas**: jangan ekspansi sebelum kategori sebelumnya **dominant** (>60% segment share di area itu).

---

## Wave Hypothesis (mission-wedge altitude bridge)

> Critique 2026-04-28 yang valid: "global AI leverage" mission vs "Shah Alam mompreneur F&B" wedge — jarak besar tanpa jembatan ekspansi explicit. Lock hipotesis di sini.

| Wave | Year | Segment | Same-pattern justification |
|---|---|---|---|
| **Wave 1** | Year 1 (2026-2027) | Home F&B mompreneur Shah Alam | Acute pain, dense cluster, Ariff distribution access |
| **Wave 2** | Year 2 (2027) | **Vertical-first within MY**: kosmetik reseller, modest fashion home seller, jasa lokal (catering, daycare, beauty service) | Same WA-driven commerce pattern + same Bahasa-first UX + same dense mompreneur clusters |
| **Wave 3** | Year 2-3 | **Geographic**: KL Selangor luas → Penang → Johor → Singapore | Same SEA mompreneur archetype, English-comfortable for SG bridge |
| **Wave 4** | Year 3-4 | **Cross-pattern**: creator economy, freelancer (designer/dev), B2B service solo | Different commerce patterns (TikTok/IG, contracts) — requires Background Twin abstractions to be re-tuned |
| **Wave 5+** | Year 4+ | Indonesia migration (CatatOrder users) → Vietnam/Philippines → Western pilot | Naval framework extension globally |

**Implication for Phase 1 architecture**:
- Background Twin abstractions harus **generic enough untuk Wave 2 vertical port** (payment matching, status update, invoice gen = pattern-agnostic)
- WA-conversational UX = pattern-agnostic dalam SEA
- Tax/LHDN integration = MY-specific (justify regional, not generic)
- Don't over-engineer for Wave 4 patterns yang belum validated

**Wave 2 trigger**: Phase 3 gate passes (500 paying Klang Valley) → start Wave 2 vertical pilots Q3 2027 with 1-2 segment additions.

**Decision rule**: never add Wave N+1 segment sebelum Wave N achieves >60% segment dominance dalam target geo.

---

## Phase 0 — Validation-First Foundation (Apr–Jul 2026, ~3 months)

**Goal**: Validate root problem (Three-Tier Reality) + solution architecture (Background Twin + Foreground Assist) **before** committing to full Phase 1 build. Lock partnership + start ops chain in parallel.

> **Refined 2026-04-28**: Phase 0 is no longer just observation — it's adversarial validation. Phase 0 must DISPROVE thesis if thesis is wrong, not just confirm if confirmable. See [`07-decisions.md`](./07-decisions.md) D-013 + D-014.

### Milestones

#### Strategy lock
- [x] Positioning bible v1.1 updated dengan Three-Tier Reality + 2-layer Twin (2026-04-28)
- [ ] Tokoflow.com landing reposition ke "Less admin. More making." (post bible lock)

#### Partnership lock
- [ ] Kopi 2 jam dengan Ariff Danial → decide partnership tier (advisor 1.5% / co-founder 5–10%)
- [ ] Sign formal partnership agreement (SAFE/MOU)
- [ ] **No casual mode** — Ariff in or out

#### Adversarial persona validation
- [ ] **5 friendly interviews** (via Ariff warm intro): test 3-tier framework, observe real day, document Tier 1/2/3 split
- [ ] **5 hostile interviews** (cold outreach): hostile question first ("Apa bagian dari jualan yang kamu paling enjoy?"), then "why might Tokoflow NOT work for you?"
- [ ] All 10 documented as profiles
- [ ] Synthesize: does Three-Tier Reality match real merchant experience?

#### Smoke test (NEW)
- [ ] **Manual Twin test**: Aldi himself acts as Background Twin for 1 volunteer merchant for 2 weeks via WA admin (with explicit permission)
- [ ] Track: which Tier 3 ops actually saved time? Did customer notice anything? Trust transfer real?
- [ ] **Cost cheap (~30 jam Aldi time), insight high (validates whole thesis architecturally)**

#### AI economics measurement (NEW)
- [ ] Build real prompts for Background Twin (payment match, invoice, status, complaint draft)
- [ ] Run against simulated 50-order/month merchant load
- [ ] Measure: actual cost per active merchant in $/month
- [ ] Decide: pricing tier adjustments needed?

#### Real-world ops critical path
- [ ] Sdn Bhd registration submitted (SSM)
- [ ] Bank account application drafted (post Sdn Bhd)
- [ ] Billplz KYB application prepared (waiting Sdn Bhd)
- [ ] MD Status (MDEC) application started
- [ ] **Accept: 6-12 month realistic timeline, not 12-16 weeks**

### Success criteria (Phase 0 Gate, end Jul 2026)

- ✓ 7/10 interviews resonate with Three-Tier framework (specifically: agree mechanical residue is distinct from valued relationship + craft)
- ✓ Smoke test merchant rates manual twin >7/10 helpfulness AND no customer complaint about "feel" change
- ✓ AI cost measured ≤ RM 25/merchant/month at projected scale
- ✓ Ariff formal partnership locked (signed)
- ✓ Sdn Bhd in SSM queue (12+ weeks lag accepted)
- ✓ 5 alpha merchants identified for Phase 1 hand-install

### Failure criteria

- ✗ <5/10 interviews resonate → reframe root problem, **don't push through**
- ✗ Smoke test reveals customer noticed AI tone OR trust transfer felt off → reduce twin scope further
- ✗ AI cost >RM 30/merchant → adjust pricing OR scope
- ✗ Ariff casual mode → execute Plan B distribution (Aldi solo + slower)
- ✗ Sdn Bhd or KYB blocked structurally → reassess legal structure (sole prop interim?)

---

### Kill Criteria — Phase 0 (pre-committed, no rationalization)

> **Pre-commit principle**: Kill triggers ditulis SEKARANG, sebelum sunk cost bias kicks in. Saat trigger hit, kita TIDAK rasionalisasi. Kita kill atau pivot.

5 explicit kill triggers. **Any single trigger hit → kill or pivot:**

1. **AI cost** per active merchant > **RM 30/month** at RM 79 max price point → unit economics broken → kill
2. **<5/10 interviews** resonate with Three-Tier framework → root problem wrong → reframe or kill
3. **Smoke test**: customers consistently feel AI tone OR merchant reports trust degradation > 1 incident → relationship moat broken → reduce twin scope OR kill
4. **Ariff** declines formal partnership AND Plan B distribution unproven within 4 weeks → kill
5. **Sdn Bhd structurally blocked** (e.g., legal structure incompatible) AND sole-prop alternative makes Pro tier non-viable → kill

**Pre-commitment authority**: signed by Aldi 2026-04-28. Triggers can only be relaxed via formal D-XXX entry in `07-decisions.md` with reasoning logged.

---

## Phase 1 — Minimum Viable 2-Layer Twin (Aug-Oct 2026, ~3 months)

**Goal**: Ship **only** Photo Magic + Background Twin (Tier 3) + Foreground Assist (Tier 2). 5 alphas hand-installed. Refuse all scope expansion.

> **Refined 2026-04-28**: Previously this phase was "1-Photo Onboarding shipped." Now expanded to include Background Twin + Foreground Assist — but scope held by removing other features (no autonomous customer-facing AI, no mobile app, no advanced empathy moments).

### Milestones

#### Month 1 (Aug 2026) — Photo Magic v1
- [ ] Photo Magic v1 ships: foto → AI auto-generate shop (per [P4-photo-magic-plan.md](./P4-photo-magic-plan.md))
- [ ] Visual identity + inventory parsing + peer-priced products
- [ ] Manual fallback at `/setup/manual` preserved
- [ ] Voice extension (3 questions for personality) DEFERRED to v2 if v1 lands well

#### Month 2 (Sep 2026) — Background Twin (Tier 3)
- [ ] Background Twin: payment matching (bank notif → order)
- [ ] Background Twin: invoice auto-generation
- [ ] Background Twin: status update auto-send (after merchant Swipe Forward)
- [ ] Background Twin: stock auto-decrement (already shipped)
- [ ] Background Twin: customer relationship memory (auto-tag pelanggan setia)
- ~~LHDN MyInvois auto-submit~~ — **DEFERRED** (Pro/Business tier, gated, surfaced only when merchant approaches threshold; refined 2026-04-28 — see [03-features.md](./03-features.md))

#### Month 3 (Oct 2026) — Foreground Assist (Tier 2)
- [ ] Suggested replies (in-app, copy-to-WA hybrid Phase 1)
- [ ] Pattern surfacing ("Pak Andi balik lagi (5x)")
- [ ] Complaint draft helper
- [ ] Daily review screen (necessary UX, not iconic — supplements The Disappearing Work feeling)
- [ ] 5 alphas hand-installed by Aldi+Ariff

### NOT shipped Phase 1 (deferred, no exceptions)

- ❌ Photo Magic v2 (voice personality bootstrap) → Phase 2
- ❌ Autonomous customer chat → never (Tier 2 protected)
- ❌ Mobile app native → Phase 2
- ❌ Multi-staff → Phase 3
- ❌ BM/Mandarin localization → Phase 4
- ❌ Marketplace integration → Phase 4
- ❌ Public marketing campaign → Phase 2 (post Gate 1)
- ❌ Charts/dashboards/engagement gamification → never

### Success criteria (Phase 1 Gate, end Oct 2026) — "Love" operationally defined

> **Pre-committed metrics**: "5 alphas love it" defined precisely SEBELUM Phase 0 dimulai. Kalau metric tidak hit, **tidak rasionalisasi**.

**ALL of these must hit (≥4 of 5):**

| # | Metric | Threshold | Source |
|---|---|---|---|
| 1 | **Sean Ellis test** | ≥40% answer "very disappointed" without Tokoflow | Survey week 4 |
| 2 | **DAU consistency** | ≥70% daily active over 4-week window per merchant | Telemetry |
| 3 | **Spontaneous referral** | ≥1 alpha tells another merchant unprompted | Tracked manually |
| 4 | **NPS** | ≥8 from all 5 alphas | Survey week 4 |
| 5 | **Self-reported craft hours saved** | ≥3 hours/week (median across alphas) | Weekly diary |

**Plus operational guardrails:**
- ✓ Background Twin error rate < 5%
- ✓ Foreground Assist suggestions approved-without-edit > 70%
- ✓ No customer complaint reported about "feel" change
- ✓ Demo video produced (Phase 2 marketing)

**< 4/5 main metrics hit** → Phase 1 fails, iterate or kill.

### Failure criteria

- ✗ Onboarding takes >5 minutes consistently → Photo Magic v1 needs iteration
- ✗ Merchants don't use product daily → not magic enough, investigate
- ✗ NPS <7 → fundamental issue
- ✗ Twin error rate >10% → STOP autonomous, back to shadow mode
- ✗ Customer complaints about AI-feel → reduce twin scope further

---

## Phase 2 — Validate Retention + CAC + Referral (Nov 2026 – Mar 2027)

**Goal**: Phase 2 BUKAN "get 50 paying merchants" sebagai vanity number. Phase 2 menjawab **3 underlying questions** dengan N=50 sample.

> **Refined 2026-04-28**: Critique valid — "50 merchants" tanpa underlying question = vanity. 50 adalah sample size untuk validate retention/CAC/referral, bukan goal itself.

### The 3 Phase 2 Questions

| # | Question | Target metric | Why it matters |
|---|---|---|---|
| **Q1** | Does retention hold beyond hand-installed alphas? | 90-day retention ≥70% | Hand-installed bias removed; product must self-sustain |
| **Q2** | Does CAC payback work? | <3-month payback at projected pricing | Unit economics validated for Phase 3 expansion |
| **Q3** | Is there organic referral? | K-factor ≥0.3 (each merchant brings 0.3 new) | Distribution flywheel forming |

**N=50 paying merchants** is the sample size to answer these questions with reasonable confidence.

### Milestones

- [ ] Sdn Bhd registration completed
- [ ] Billplz live (KYB approved)
- [ ] Pricing live: Free / Pro RM 49 / Business RM 99
- [ ] 50 paying merchants Shah Alam (dari free → paid conversion)
- [ ] Port catatorder-app → tokoflow-app (3-4 minggu effort)
- [ ] Mobile app ship Play Store + App Store
- [ ] Ariff full distribution mode (warm intro 30+ merchants)
- [ ] First merchant testimonials documented (video, photo, story)

### Success criteria

- 50 paying merchants
- Mobile app live both stores
- Free → Paid conversion >20%
- Daily active rate >70% for paying users
- Word-of-mouth referrals starting (>10% new users from referral)

### Failure criteria

- <30 paying merchants by end Oct → distribution issue, reassess
- Free → Paid <10% → value prop unclear
- DAU <50% → product not sticky enough

---

## Phase 3 — Klang Valley + Ramadan Window (Nov 2026-Mar 2027)

**Goal**: Ekspansi ke Klang Valley luas. Capture Ramadan 2027 traction window.

### Milestones

- [ ] Ekspansi ke Petaling Jaya, USJ, Subang, Damansara
- [ ] 200-500 paying merchants Klang Valley
- [ ] WA Coexistence inlet shipped (optional, untuk merchants yang mau dual-channel)
- [ ] Pricing Whisper feature shipped
- [ ] Customer Care Reminder shipped
- [ ] Voice Ask shipped (mobile)
- [ ] Pre-Ramadan campaign Januari 2027: "Siap Ramadan tanpa lupa pesanan"
- [ ] Hire 1 local sales/ops di KL (jika revenue justify)

### Success criteria

- 500 paying merchants Klang Valley
- Ramadan 2027 (Feb-Mar) menunjukkan order volume spike (validate seasonal value)
- MRR RM 25-30K
- 20%+ users via word-of-mouth (organic flywheel)

### Failure criteria

- <200 paying by end Phase 3 → growth model broken
- Ramadan tidak spike → seasonal hypothesis wrong, reassess
- Churn >15%/month → product not sticky

---

## Phase 4 — SEA Expansion (Apr-Dec 2027)

**Goal**: Geographic ekspansi ke Penang, Johor, Singapore. Laying foundation untuk SEA.

### Milestones

- [ ] Penang, Johor, Sabah, Sarawak ekspansi
- [ ] Singapore pilot (English-friendly, similar profile)
- [ ] 1,000-3,000 paying merchants SEA
- [ ] Tokoflow community launch (merchant network, knowledge sharing)
- [ ] Mompreneur ambassador program
- [ ] Bahasa Melayu localization (BM as separate language)
- [ ] LHDN MyInvois full production (post Sdn Bhd verification)

### Success criteria

- 2,000+ paying merchants
- MRR RM 80-120K
- 3-month retention cohort >65%
- Singapore pilot dengan 50+ merchants

### Failure criteria

- Singapore pilot fail (<20 merchants) → reassess SEA expansion approach
- MY growth plateau → focus more, don't expand prematurely

---

## Phase 5 — Indonesia Migration + Pre-Global (2028+)

**Goal**: CatatOrder Indonesia migrate ke Tokoflow. Western pre-pilot.

### Milestones

- [ ] Tokoflow Indonesia launched (rebrand dari CatatOrder)
- [ ] Existing CatatOrder users migrated (gradual, 12-month transition)
- [ ] Vietnam, Philippines pilot
- [ ] Australia pilot (English-speaking Western entry point)
- [ ] 5,000-10,000 paying merchants total
- [ ] Series A funding raise (jika scale justify)

### Success criteria

- 5,000+ paying merchants
- MRR $200K-500K
- 4 markets active (MY, ID, SG, AU)
- Brand recognition SEA-wide

---

## Phase 6+ — Global (2030+)

**Goal**: True global ambition.

### Milestones

- [ ] US, UK, EU pilots
- [ ] Multi-currency, multi-language full
- [ ] Apple-grade brand recognition global
- [ ] $1M+ MRR
- [ ] Strategic decision: continue VC scale, or sustainable lifestyle, or exit

---

## Decision Gates Summary (revised 2026-04-28)

| Gate | When | Pass criteria | If fail |
|---|---|---|---|
| Gate 0 → 1 | End Jul 2026 | 7/10 interviews validate Three-Tier + smoke test passes + AI cost ≤ RM 25 + Ariff locked | Reframe root problem, do not push through |
| Gate 1 → 2 | End Oct 2026 | 5 alphas NPS 8+ + daily use + ≥1 referral + twin error <5% | Iterate magic moment, do not scale |
| Gate 2 → 3 | End Mar 2027 | 50 paying + 20% conversion + twin silent >50% + churn <8% | Fix retention, don't expand to KL |
| Gate 3 → 4 | End Sep 2027 | 500 Klang Valley + Ramadan validated | Focus, don't expand to SEA |
| Gate 4 → 5 | End Dec 2027 | 2K paying + Singapore proven | Stay SEA, don't go global |
| Gate 5 → 6 | End 2029 | 5K paying + 4 markets stable | Reassess global ambition |

**Note on timeline shift**: Gate 1 moved from end Jul → end Oct (Phase 0 expanded to 3 months for proper validation). Gate 2 moved from end Oct → end Mar 2027. Adds ~3 months total but dramatically reduces "build wrong thing" risk. Ramadan 2027 (Feb–Mar) still capturable IF Gate 1 passes by end Oct 2026.

---

## What's NOT in Roadmap (intentional)

Kategori atau fitur yang **tidak akan dibangun** sampai ada signal kuat:

- ❌ Buyer mobile app (forever)
- ❌ Heavy theme customization
- ❌ Plugin marketplace
- ❌ White-label / enterprise B2B
- ❌ Wearable apps (Apple Watch, dll)
- ❌ Voice phone AI inlet (defer to Phase 4+ if at all)
- ❌ Cross-merchant marketplace ("Discover local UMKM")
- ❌ Lending / financial services (defer to Phase 6+)

Setiap "tidak" ini adalah disiplin. Kalau temptasi muncul untuk bangun, baca [`00-manifesto.md`](./00-manifesto.md) dulu.

---

## Continuous Activities (across all phases)

- Customer interview ongoing (5/bulan minimum)
- Product iteration weekly
- [`07-decisions.md`](./07-decisions.md) update setiap major decision
- Monthly review terhadap [`00-manifesto.md`](./00-manifesto.md) tests
- Quarterly review terhadap whole positioning archive

---

## Distribution Hypothesis (Year 1)

> **Refined 2026-04-28**: Critique valid — "Where does Bu Aisyah live online" tidak articulate. Lock channel strategy.

### Year 1 channels (where mompreneur Shah Alam are)

| Channel | Why | Action |
|---|---|---|
| **FB groups** | Mommies Daily MY, Ibu-Ibu Bisnes Online MY, regional KL/Selangor mompreneur groups — high density, organic | Aldi/Ariff lurk first (Phase 0), seed organic mentions Phase 1 from alpha referrals |
| **TikTok** | Mompreneur creator MY (small-mid tier) — visual, demo-friendly | Demo video produced Phase 1 → seed Phase 2 |
| **WhatsApp komuniti** | School moms WA group, mosque jemaah, neighborhood — Bu Aisyah's existing network | Alpha merchants share organically; Ariff warm intro pipeline |
| **Direct (warm)** | Ariff's network, alpha merchant referrals, Aldi's circle | Phase 0 + Phase 1 primary |

### Anti-channels (explicit — wrong fit)

- ❌ **LinkedIn** — wrong demographic (B2B/professional, bukan mompreneur)
- ❌ **Twitter/X** — wrong demographic (tech/news/Western)
- ❌ **Paid Google Ads** — wrong cost structure (CAC blows up at SMB pricing)
- ❌ **Corporate sales** — wrong segment (D-006: B2B excluded Year 1)
- ❌ **PR / press launch** — premature; Phase 2+ post 50 paying

### Channel cadence

- **Phase 0**: lurk + listen di FB groups + WA komuniti (no pitch). Document what mompreneur talk about, complain about, share.
- **Phase 1**: Aldi+Ariff hand-install 5 alphas (warm direct). Phase 1 alpha demo video produced.
- **Phase 2**: organic from alpha referrals + lightweight FB group mentions + 1-2 TikTok demo videos. **NO paid acquisition Year 1.**
- **Phase 3+**: paid acquisition acceptable kalau CAC payback validated (Q2 from Phase 2).

---

## Cross-references

- Why this roadmap (mission): [`00-manifesto.md`](./00-manifesto.md)
- Who we serve per phase (target user): [`01-positioning.md`](./01-positioning.md)
- What we ship per phase (features): [`03-features.md`](./03-features.md)
- Decision history: [`07-decisions.md`](./07-decisions.md)

---

*Versi 1.2 · 28 April 2026 · Roadmap is a hypothesis, not a contract. Update as we learn.*

*Changelog 1.1 (earlier same day):* Phase 0 expanded to 3-month validation-first phase (5 friendly + 5 hostile interviews + manual twin smoke test + AI cost measurement). Phase 1 expanded to 3 months Photo Magic + Background Twin + Foreground Assist (instead of just Photo Magic). Gate timing pushed ~3 months. Honest acceptance: Sdn Bhd → Billplz → LHDN ops chain realistic 6-12 months. See `07-decisions.md` D-013, D-014, D-015.

*Changelog 1.2:* Added Wave 1-5 expansion hypothesis (mission-wedge altitude bridge). Added explicit Phase 0 kill criteria (5 pre-committed triggers). "Love" operationally defined (Sean Ellis + DAU + referral + NPS + craft hours). Phase 2 reframed from milestone (50 paying) to underlying questions (retention, CAC, referral). Added Distribution Hypothesis section (FB groups, TikTok, WA komuniti — anti-channels: LinkedIn, Twitter). LHDN deferred from Phase 1 hero → Pro/Business gated. Photo Magic v1 reframed extraction-only (kitchen-protected). All in response to 2026-04-28 critique.
