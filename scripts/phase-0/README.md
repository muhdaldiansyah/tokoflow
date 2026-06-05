# Phase 0 — Validation-First Foundation

> **Gate 0 master checklist.** Phase 0 must DISPROVE thesis if thesis is wrong, not just CONFIRM if confirmable. **No Phase 1 build until ALL Gate 0 criteria pass.**

> **Strategic context**: see [`docs/positioning/06-roadmap.md` Phase 0](../../docs/positioning/06-roadmap.md#phase-0--validation-first-foundation-aprjul-2026-3-months), [D-013 / D-014 / D-017](../../docs/positioning/07-decisions.md), and execution synthesis [SYNTHESIS-2026-05-05.md](../../docs/SYNTHESIS-2026-05-05.md).

---

## The 6 tracks of Phase 0

Each track has its own validation deliverable. **All 6 must complete before Gate 0 evaluation.**

| # | Track | Deliverable | Critical path |
|---|---|---|---|
| **0.1** | MyInvois sandbox spike | `myinvois-spike.ts` returns valid `submissionUid` + accepted `uuid` | Independent, low risk |
| **0.2** | Billplz sandbox spike | `billplz-spike.ts` passes X-Signature round-trip | Independent, low risk |
| **0.3** | Sdn Bhd registration | SSM application submitted | **12-16 weeks lag** — start now |
| **0.4** | Adversarial merchant interviews | 10 interviews (5 friendly + 5 hostile) documented per [`merchant-interview.md`](./merchant-interview.md) | 4-6 weeks |
| **0.5** | Manual Twin smoke test | 2-week role-play per [`smoke-test/README.md`](./smoke-test/README.md) | 2 weeks, after interview merchant identified |
| **0.6** | AI cost measurement | Real cost numbers per [`ai-cost/README.md`](./ai-cost/README.md) | 1 week of focused work |

Plus operational + distribution + brand (added 2026-05-05 per [SYNTHESIS-2026-05-05.md](../../docs/SYNTHESIS-2026-05-05.md)):

| # | Track | Deliverable / Status |
|---|---|---|
| **0.7** | Ariff partnership formal lock | Kopi 2 jam → SAFE/MOU signed |
| **0.8** | MDEC Digitalisation Partner application | Pending review |
| **0.9** | Distribution validation (TikTok + komuniti) | ≥300 followers + ≥15 inbound DM by Week 8 — see [`distribution/README.md`](./distribution/README.md) |
| **0.10** | Brand resonance test | Embedded in [`merchant-interview.md`](./merchant-interview.md) §8 — friction <4/10 keep / ≥4/10 rebrand decision |
| **0.B** | Backup B2B playbook (scenario c contingency) | Activated if 0.9 fails or distribution skill scenario c — see [`backup-b2b/README.md`](./backup-b2b/README.md) |

---

## Gate 0 pass criteria — ALL must hit

> **Pre-committed 2026-04-28. Cannot be relaxed retroactively without formal D-XXX entry.**

### From merchant interviews ([`merchant-interview.md`](./merchant-interview.md))

- [ ] **≥7/10** interviews resonate with Three-Tier framework (mechanical residue distinct from valued customer relationship + craft)
- [ ] **≥5/10** willing to pay RM 49+/month for "Tokoflow handles the receipts, not the recipes"
- [ ] **≥3/10** explicitly cite mechanical residue as top pain (not just "I'm busy generally")
- [ ] **≥2/10** mention they LOVE customer chat / relationship (validates Tier 2 protect-not-replace)
- [ ] **≥3/10** Wave 2 spillover signal (mention non-F&B mompreneur friend with similar pain)

### From smoke test ([`smoke-test/README.md`](./smoke-test/README.md))

- [ ] Merchant rates manual twin **>7/10 helpfulness** at end of week 2
- [ ] **Zero customer complaints** about "feel" change
- [ ] Merchant self-reports **≥3 hours/week** craft time saved
- [ ] Merchant says: *"I'd want this if it was an app"* unprompted at debrief
- [ ] Aldi sustains operation in **≤2 hours/day**

### From AI cost measurement ([`ai-cost/README.md`](./ai-cost/README.md))

- [ ] Cost per merchant ≤ **RM 25/month** at 50-order projected scale (Pro RM 49 locked, ≥49% margin); RM 25-30 = retest Week 6 must clear ≤RM 25; >RM 30 = kill

### From sandbox spikes

- [ ] `myinvois-spike.ts` returns `submissionUid` + accepted `uuid` from LHDN preprod
- [ ] `billplz-spike.ts` passes X-Signature round-trip (genuine + tamper tests)

### From operational

- [ ] **Ariff** formal partnership locked (SAFE/MOU signed)
- [ ] **Sdn Bhd** in SSM queue (12+ weeks lag accepted; not blocking validation)

---

## Pre-committed triggers — 7 total (6 kill + 1 rebrand-flag)

> No rationalization when emotion arrives. Triggers can only be relaxed via formal D-XXX entry in `07-decisions.md` with reasoning logged. Aligned with [SYNTHESIS-2026-05-05.md §5](../../docs/SYNTHESIS-2026-05-05.md).

1. **AI cost**: ≤RM 25 pass / RM 25-30 warning + retest Week 6 / >RM 30 → unit economics broken → kill (Pro RM 49 locked)
2. **<7/10 interviews** resonate with Three-Tier framework (kill); <5/10 = catastrophic kill, definitely no push-through
3. **Smoke test**: customers detect AI tone OR merchant trust degrades OR rates <7/10 helpfulness → relationship moat broken → reduce twin scope to Foreground Assist only OR kill
4. **Ariff** declines formal partnership AND Plan B distribution unproven within 4 weeks → kill
5. **Sdn Bhd structurally blocked** AND sole-prop alternative makes Pro tier non-viable → kill
6. **Distribution**: <300 followers + <15 inbound DM cumulative by Week 8 → distribution thesis fails → kill content-led playbook OR activate scenario (c) backup B2B
7. **Brand friction** ≥4/10 average across 10 interviews → trigger rebrand decision Week 7 (NOT kill — flag; bias-toward-keep due to 3-6 week switching cost)

---

## Files in `scripts/phase-0/`

```
phase-0/
├── README.md                       # This file — Gate 0 master checklist
├── .env.phase-0.example            # Sandbox credentials template (don't commit filled .env.phase-0)
├── billplz-spike.ts                # 0.2: payment sandbox
├── myinvois-spike.ts               # 0.1: e-invoice sandbox
├── merchant-interview.md           # 0.4 + 0.10: 10 interviews protocol (v2 adversarial) + brand resonance test
├── smoke-test/                     # 0.5: manual twin role-play
│   ├── README.md                   # Protocol overview
│   ├── tracking-template.md        # Aldi's daily diary template
│   └── customer-feel-survey.md     # Customer surveillance protocol
├── ai-cost/                        # 0.6: AI cost measurement
│   ├── README.md                   # Methodology + tiered thresholds (≤25 / 25-30 / >30)
│   ├── measure.ts                  # Main measurement script
│   ├── scenarios.ts                # Realistic merchant scenarios
│   └── prompts/
│       ├── background-twin.ts      # Tier 3 system prompts
│       └── foreground-assist.ts    # Tier 2 system prompts
├── distribution/                   # 0.9: TikTok + komuniti distribution validation (added 2026-05-05)
│   └── README.md                   # Channel mix, content calendar, weekly checkpoints
└── backup-b2b/                     # 0.B: scenario (c) backup playbook (added 2026-05-05)
    └── README.md                   # Direct B2B outreach if content-led fails
```

---

## Suggested execution order (8 weeks)

> Realistic, sustainable cadence. Solo founder + Ariff distribution.

### Week 1 (29 Apr – 5 May)
- [ ] Setup `.env.phase-0` with all keys
- [ ] Run `myinvois-spike.ts` (Track 0.1) — should succeed quickly
- [ ] Run `billplz-spike.ts` (Track 0.2) — should succeed quickly
- [ ] Run `ai-cost/measure.ts --dry-run` to validate prompts structure
- [ ] Submit Sdn Bhd via SSM (Track 0.3)

### Week 2 (6 – 12 May)
- [ ] Kopi 2 jam dengan Ariff → decide partnership tier → sign SAFE/MOU (Track 0.7)
- [ ] Recruit first 5 friendly interview candidates (via Ariff network)
- [ ] Run `ai-cost/measure.ts --sample 10` ($1-2 spend) — validate prompts work in real API
- [ ] First 2 interviews done

### Weeks 3-4 (13 – 26 May)
- [ ] Interviews 3-7 (mix friendly + hostile)
- [ ] Recruit smoke test volunteer (from interview pool, high-trust)
- [ ] Run `ai-cost/measure.ts --full` ($5-15 spend) — generate full cost report

### Weeks 5-6 (27 May – 9 Jun)
- [ ] Interviews 8-10 (final hostile interviews)
- [ ] Synthesize interview learnings
- [ ] Begin smoke test (week 1 of 2)
- [ ] Daily diary logging via [`smoke-test/tracking-template.md`](./smoke-test/tracking-template.md)

### Weeks 7-8 (10 – 23 Jun)
- [ ] Smoke test week 2 of 2
- [ ] Customer surveillance surveys (mid + end)
- [ ] Final smoke test debrief
- [ ] Synthesis report

### Week 9 (24 – 30 Jun) — Gate 0 review
- [ ] Aggregate all data: interviews + smoke test + AI cost + spikes + ops
- [ ] Compute pass/fail against all criteria
- [ ] Check kill triggers
- [ ] Decision document → D-018 in [`07-decisions.md`](../../docs/positioning/07-decisions.md)

### If Gate 0 PASS → start Phase 1 build (Aug 2026 onwards)
### If Gate 0 FAIL → reframe, iterate, or kill (no push-through)

---

## Anti-patterns to avoid

1. **Confirmation-biased interviews** — pre-selecting friends-of-Ariff who'll validate. **5 of 10 must be cold/hostile** for unbiased signal.
2. **Optimizing smoke test for merchant happiness** — this is **architectural validation**, not customer success. The merchant is helping us learn if pattern works for ONE person.
3. **Rushing AI cost measurement with toy prompts** — must use production-grade prompts (full system prompts + realistic context). Use [`prompts/`](./ai-cost/prompts/) as-is.
4. **Sunk cost rationalization at Gate 0** — kill criteria are pre-committed. If hit, kill or pivot. No "but we already invested 8 weeks…"
5. **Skipping operational tracks** — Sdn Bhd must start week 1. 12-16 weeks of lag is the binding constraint, not your code timeline.

---

*Last updated: 2026-04-28 · Phase 0 unified plan · Bible v1.2 [D-013, D-014, D-017](../../docs/positioning/07-decisions.md)*
