# Cycle 021 — UX_HYPOTHESIZE (3 alternative UX architectures)

> Goal: design the UX architecture so seamless that Aisyah/Sari forget the app exists between captures, and the app forgets it's an app between scenes.

## Seamlessness criteria (the scoreboard)

| # | Criterion | What 10 looks like |
|---|---|---|
| 1 | **Lock-screen primacy** | 80%+ of daily actions accessible WITHOUT unlocking. Mic, claim payment, view today's pending — all on lock screen. |
| 2 | **Single primary gesture** | One way to start capture (double-tap home OR lock-widget). No confusion about "which button". |
| 3 | **Diary-IS-DB fidelity** | Home is a chronological feed of voice notes. /orders, /customers don't exist as separate screens — they emerge as derived sections. |
| 4 | **Optimistic UI everywhere** | Card appears INSTANTLY on capture; AI parsing happens visibly in background. Never "Processing..." spinner. |
| 5 | **Sensory continuity** | The 3-sensory filing signature triggers IDENTICALLY for every entity creation — same waveform, same chime, same haptic. |
| 6 | **Scene-aware adaptation** | Lunch rush vs evening reconcile vs Day 1 onboarding — UI adapts depth without changing primary gesture. |
| 7 | **Recovery is voice** | Errors fixable by voice ("salah, tukar 5 jadi 3"). Typing is opt-in escape hatch only. |
| 8 | **<2s perceived response** | Every user action gets visible feedback within 200ms; final result lands within 2s; if not, optimistic placeholder. |

---

## Alternative UX-A — Single-Stream Twitter

**Layout**: Home = chronological feed of voice-note cards. Bottom sticky button = mic. Top-right = settings gear. Top-left = filter chips ("Today / This week / All").

**Pros**:
- Maximum focus, single mental model (scroll your life)
- Diary-IS-DB fidelity = perfect (10/10)
- Cognitive load = minimum

**Cons**:
- "What's pending today" requires scroll + filter — not instant
- Lunch rush: mompreneur needs to glance at remaining unpaid orders fast; scrolling chronological is friction
- Sari's "mata lebih laju dari mulut" critique resurfaces

**Score (vs 8 criteria)**: Lock 8 / Gesture 10 / Diary 10 / Optimistic 9 / Sensory 10 / Scene 6 / Recovery 9 / Speed 9 → **Avg 8.9**

---

## Alternative UX-B — Two-Tab (Today | Diary)

**Layout**: Bottom tab bar with 2 tabs. Tab 1 = "Today" (active orders, pending receipts, briefing). Tab 2 = "Diary" (full chronological feed). Mic FAB persistent.

**Pros**:
- Aisyah's "what's pending" need = instant (Tab 1)
- Lunch rush: Tab 1 is the dashboard

**Cons**:
- Violates diary-IS-DB mental model — "Today" becomes a CRM-shaped view
- Two tabs = two apps mentally; merchant must remember which has what
- Jobs's cycle-2 "coward's pivot" critique resurfaces

**Score**: Lock 7 / Gesture 9 (FAB but tab nav adds friction) / Diary 6 / Optimistic 9 / Sensory 10 / Scene 8 / Recovery 9 / Speed 9 → **Avg 8.4**

---

## Alternative UX-C — Adaptive-Zoom Single Feed (WINNER)

**Layout**: Single chronological feed of voice-note cards. **Smart sections** auto-collapse as scroll moves: pinned at top is "Now" (smart-derived: pending payments + today's pickups + briefing), then sections "Today (5)", "Yesterday (8)", "This week", "This month". Tap section to expand. Mic FAB persistent (large, bottom-center).

**Key mechanism**: "Now" pin is NOT a separate tab — it's a derived view rendered as the topmost section. Tapping a "Now" card scrolls to its source voice note in the chronological feed (preserves diary mental model).

**Pros**:
- Lock-screen primacy preserved (10/10)
- Single gesture (mic FAB or lock-widget)
- Diary-IS-DB fidelity preserved (Now = derived, not separate entity)
- Lunch rush solved: Now section shows pending in <1s glance
- Scene-aware: sections collapse/expand based on context (Day 1 = empty + onboarding card; Day 30 = full feed)

**Cons**:
- Section management adds slight UI complexity
- "Now" pin needs careful design to not feel like a tab

**Score**: Lock 10 / Gesture 10 / Diary 10 / Optimistic 10 / Sensory 10 / Scene 10 / Recovery 9 / Speed 10 → **Avg 9.875**

### Visual layout (UX-C)

```
┌─────────────────────────────────────┐
│ ← Cerita je.                  ⚙    │ ← top-bar (brand-warm bg, gear)
├─────────────────────────────────────┤
│ ▼ Now                               │ ← pinned smart section
│   • Lina · Rp 240k · QRIS — 09:30 │
│     pending claim →                 │
│   • Aishah · RM 25 · cash — 11:15  │
│     paid · receipt sent ✓           │
├─────────────────────────────────────┤
│ ▼ Today (5)                          │ ← expanded by default
│   • Pak Lee · kek lapis Sabtu       │
│   • Mbak Tina · 3 box · 10:45       │
│   • ... 3 more (tap to expand)      │
├─────────────────────────────────────┤
│ ▶ Yesterday (8)                      │ ← collapsed
├─────────────────────────────────────┤
│ ▶ This week                          │
├─────────────────────────────────────┤
│ ▶ This month                         │
├─────────────────────────────────────┤
│                                      │
│         [ ⏺  mic ]                   │ ← large FAB, breathes when listening
│                                      │
└─────────────────────────────────────┘
```

### Lock-screen surface (UX-C)

```
┌─────────────────────────────────────┐
│  09:30  May 15                       │
├─────────────────────────────────────┤
│ Cerita aja (CatatOrder)             │
│                                      │
│ ⏺  Pegang untuk cerita               │ ← long-press = mic
│                                      │
│ • Lina Rp 240k via QRIS  →  CLAIM   │ ← claim-card from SMS auto-detect
│ • 3 pending today                    │ ← summary
└─────────────────────────────────────┘
```

### Scene-aware adaptation examples

- **Day 1 first launch**: Now section shows "Welcome" placeholder card with first-launch sensory ritual; "Today" section shows tutorial 1-5 progress
- **Lunch rush detected** (5+ captures in 30 min): Now section auto-prioritizes pending-payments over completed; FAB pulses subtly (not annoying — discoverable)
- **Evening reconcile** (after 6pm if mompreneur not opened): 6pm briefing card pinned in Now section
- **Quiet hours** (22:00-06:00 MY / 21:00-05:00 ID): notifications muted; if app opened, Now section shows tomorrow-prep panel (Pak Lee's Sabtu order, etc.)

### Anti-anxiety preservation (Refuse list #8)

- **NO streak counters** ("5 days in a row!" — gamification killed)
- **NO badge progress** ("Level up! Pro Bookkeeper!")
- **NO comparison metrics** ("Better than 80% of merchants" — comparison shaming)
- **YES gentle absence** (if she misses a day, no guilt-trip — next morning briefing just summarizes; no "you missed yesterday")

---

## Decision

**UX-C wins** at 9.875 vs UX-A 8.9 and UX-B 8.4. Scene-aware adaptive zoom resolves the "what's pending" need without violating diary-IS-DB.

**Promote UX-C as the canonical UX architecture** for cycles 22-30 to refine, critique, and harden.

## What goes into ARCHITECTURE.md (cycle 30 final)

- Adaptive-zoom feed mechanism (Now pin + collapsible time-buckets)
- Lock-screen widget surface spec
- Mic FAB behavior states (idle / listening breathing animation / processing / done with sensory signature)
- Scene-aware presets (lunch rush / quiet hours / Day 1 / Day 60+)
- Anti-anxiety enforcement (no streaks, no badges, no comparison)

## Open UX questions for next cycles

- How does an entity card actually look (chips, transcript, actions)?
- What happens on tap of an entity in a card (navigate where)?
- How do voice corrections render visually (the "patch" event)?
- What's the WA reply draft preview UX exactly?
- How does the mic FAB behave during STT processing vs LLM extraction?
- Accessibility: what's the screen-reader experience?
