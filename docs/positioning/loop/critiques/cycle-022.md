# Cycle 022 — Consolidated UX Red-Team

> 4 personas critiqued UX-C: Aisyah (MY) · Sari (ID) · Jobs · Don Norman/Wroblewski-style UX researcher

## Scores summary

| Persona | Top scores |
|---|---|
| Aisyah | UX-fits-day 8, greasy-fingers 8, diary-model 9, daily-use 8 |
| Sari | UX-fits-day 8, multi-tasking 7, diary-model 6, daily-use 8 |
| Jobs | Elegance 7, Hierarchy 8, Gesture 9 — **REWORK** |
| Norman | Heuristics 6, Mental-model 5, Reach 6, **Accessibility 3**, Onboarding 6 |

## Critical findings — 13 ≥7 severity items

### Sev 9 — accessibility ship-blocker

| # | Source | Critique | Fix direction |
|---|---|---|---|
| 1 | Norman | Text input deferred Day 60 = WCAG violation + excludes noisy-kitchen / mute-context users | **Ship text input Day 1 in Settings + escape hatch on every yellow/red chip** |

### Sev 8 — UX architecture-level

| # | Source | Critique | Fix direction |
|---|---|---|---|
| 2 | Aisyah | Now card tap → scroll-to-source adds friction during lunch rush | **Inline Claim/Mark-paid action ON the Now card; scroll-to-source = long-press secondary** |
| 3 | Norman | Error recovery for number misparse (RM 25 vs RM 250) entirely unspecified | **Spec the correction UX**: voice "Salah, RM dua ratus lima puluh" → patches in place + 3-sensory mini-signature for the fix; fallback = tap chip → numpad (a11y) |
| 4 | Norman | Diary-IS-DB violates Jakob's Law without filter chip scaffolding | **Add entity filter chips above feed**: All / Orders / Payments / Customers — scopes the feed (still derived views, NOT separate tabs). Honors Jakob's Law without breaking diary mental model. |
| 5 | Sari | "Cerita aja" too Malaysia-flavored → Bandung casual is "Cerita weh" / "Catet aja" | **A/B test 3 ID tagline variants in Phase 0.5 ID interviews** (Devil cycle 18 sev-7 gate is the right venue) |

### Sev 7 — significant friction

| # | Source | Critique | Fix direction |
|---|---|---|---|
| 6 | Sari + Norman | FAB position: bottom-center violates thumb-zone (one-handed + baby) | **Move FAB to bottom-trailing arc** (Wroblewski thumb zone). Default right-handed; user can flip in Settings. |
| 7 | Aisyah | Quiet-hours auto-pin tomorrow-prep = work-after-work pressure | **Tomorrow-prep is scroll-discoverable only**, never auto-pinned. Quiet hours = silent absence, not pre-emptive pinning. |
| 8 | Aisyah + Sari | Too many sections (Today/Yesterday/Week/Month feels folder-shaped) | **Cut to 2-3**: Today / Earlier (Aisyah) OR Hari ini / Kemarin / Lebih lama (Sari). 4-section accordion overshoots diary-shape. |
| 9 | Sari | MIUI/ColorOS lock-screen widget killed by autostart + battery saver | **Onboarding walkthrough Android OEM permissions** explicit: 30s screenshot guide for Xiaomi/Oppo/Samsung. |
| 10 | Norman | "▼" disclosure triangle is dev-convention, not folk-convention | **Use chevron + label**: "Show earlier ▾" not bare "▼". Signifier strength matters for non-power users. |
| 11 | Norman | Lock-screen long-press vs in-app FAB tap = two gestures, same intent (inconsistency) | **Make in-app gesture also long-press** (or both tap). Consistency > novelty. **Decision: both = single tap** (long-press reserved for Share-target on WA). |
| 12 | Norman | 15-min onboarding too long (~40% abandon by minute 8 for child-interrupted demo) | **Cut to 5 min** total: voice tutorial only (1 min) + first-launch sensory ritual (10s) + privacy disclosure (30s) + send-first-receipt (1 min) + correction-by-voice (1 min) + return-hook consent (30s). The other tutorials (Share-target, query) become coach-marks discovered in real use, not Day 1 tutorials. |
| 13 | Norman | Share-target near-zero default discovery | **Coach-mark on first relevant context**: when user opens app from a WA-share-failure state OR after Day 3, show one-time tooltip "Pegang lama mesej WA → Share → CatatOrder". Self-dismissing after first use. |

### Jobs's 9→10 move (also ≥7 priority)

| # | Source | Critique | Fix direction |
|---|---|---|---|
| 14 | Jobs | "Delete top-bar entirely. Feed starts at status bar." | **Confirm: no top-bar.** Brand identity lives in lock-screen widget + first-launch only. In-app feed is pure content. Settings access = scroll-up gesture from feed top reveals minimal action sheet. |

## What survives unchanged

- **Lock-screen claim-card primacy** — Aisyah + Sari both validated, Jobs called it "the *real* primary gesture"
- **Now pin as section** (not separate tab) — Aisyah + Jobs validated; Sari needed visual hint (animation when scrolled-to)
- **Anti-anxiety enforcement** (no streaks/badges/comparison) — Aisyah + Sari both validated as "lega", Sari "precisely apa yang ibu rumah tangga 2 anak butuhkan"
- **Adaptive zoom mechanism** — accepted as architecture-correct; section count needs trimming

## Implications for cycles 23-30

**Cycle 23 PAYMENT_RESEARCH** must address:
- ID payment SMS template parsing reliability (DANA/GoPay/OVO/banks)
- MY DuitNow/FPX vendor-specific notification handling
- Cash voice-only flow

**Cycle 25 WORKFLOW_HYPOTHESIZE** must specify:
- Error recovery UX for number misparses (Norman sev-8)
- Voice correction state machine
- Optimistic UI rollback when LLM disagrees with optimistic placeholder

**Cycle 28 SEAMLESS_SYNTHESIZE** must fold all 14 ≥7 fixes into integrated spec.

**Cycle 29 ARCH_CONSTRAINT_HARDEN** must validate:
- Text input Day 1 (Norman sev-9 ship-blocker)
- A11y screen-reader experience
- MIUI/ColorOS OEM testing
- 5-minute onboarding cognitive load
