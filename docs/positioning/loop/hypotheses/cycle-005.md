# Cycle 005 — LATERAL_JUMP (first-principles re-derivation)

> Mode: LATERAL_JUMP — ignored current-best.md entirely, re-derived from physics.
> Outcome: voice-diary core validated. 2 refinements added (WA Share-target + lock-screen widget). Current-best NOT replaced.

## Method

Stripped to:
- **Hardware**: phone camera, mic, screen, touch, network
- **Intelligence**: AI only
- **Merchant**: Bu Aisyah, F&B mompreneur, 80 orders/mo, 3 kids, scattered day, hands greasy
- **JTBD**: reduce Tier 3 mental load (Tier 1 craft + Tier 2 customer off-limits per Refuse list)
- **Daily commerce events her phone witnesses**: WA messages, cash transactions, bank transfer notifications. Just 3 types.

Derived natural input modes ranked by fit to mompreneur day:
1. Voice (10× faster than typing, hands-free, scattered-day compatible)
2. Photo (instant snapshot, hands-busy fallback)
3. Tap-to-share (long-press existing WA → Share → done)
4. Text (last-resort escape hatch)

## 6 lateral mechanisms tested

### W — Share-Target-as-OS (long-press WA → Share → AI files)

**Score**: SimpIT 10 / ZeroExt 10 / AInative 9 / JobsUX 8 / RevPot 8 / Magic 8 / 60sDemo 9 / Defense 6 → **Avg 8.5**

**Verdict**: inferior as primary core (less magical demo, lower defense), but **excellent as third input mode** in current-best. Adds value because it leverages an existing WA habit with zero new behavior.

### U — Lock-Screen Widget (mic button always 1 tap away)

**Score**: SimpIT 9 / ZeroExt 10 / AInative 10 / JobsUX 9 / RevPot 8 / Magic 9 / 60sDemo 9 / Defense 7 → **Avg 8.9**

**Verdict**: refinement, not replacement. Solves the "hands greasy + phone locked" reality that double-tap-home doesn't. Goes into next synthesis.

### T — SMS Bot + AI (Tokoflow as phone number)

**Score**: SimpIT 8 / ZeroExt 6 / AInative 9 / JobsUX 7 / RevPot 7 / Magic 7 / 60sDemo 8 / Defense 6 → **Avg 7.3**

**Verdict**: Twilio dep kills ZeroExt. The "feed view for queries" still requires an app. Skip.

### R — Apple Notes / Google Keep AI extension

**Score**: SimpIT 6 / ZeroExt 9 / AInative 8 / JobsUX 5 / RevPot 6 / Magic 6 / 60sDemo 7 / Defense 4 → **Avg 6.4**

**Verdict**: iOS permission model blocks third-party AI on Notes content. Workflow devolves to Option W (Share-target). Skip as separate option.

### V — Hardware button phone case (BLE → mic)

**Score**: SimpIT 4 / ZeroExt 8 / AInative 9 / JobsUX 7 / RevPot 6 / Magic 7 / 60sDemo 6 / Defense 5 → **Avg 6.5**

**Verdict**: hardware adds inventory + distribution + BLE complexity. Fails simplicity test instantly.

### S — WhatsApp-Native (no app, forward to Tokoflow WA number)

**Score**: SimpIT 6 / ZeroExt 4 / AInative 9 / JobsUX 7 / RevPot 8 / Magic 7 / 60sDemo 8 / Defense 5 → **Avg 6.8**

**Verdict**: needs WA Business API. ZeroExt collapses. Skip.

## Comparison vs current-best

| Dim | current-best (cycle 4 = Diary-Is-DB) | Best lateral (W or U) | Δ |
|---|---|---|---|
| SimpIT | 9 | 10 (W) / 9 (U) | 0 / +1 |
| ZeroExt | 10 | 10 | 0 |
| AInative | 10 | 9 (W) / 10 (U) | -1 / 0 |
| JobsUX | 10 | 8 (W) / 9 (U) | -2 / -1 |
| RevPot | 10 | 8 (W) / 8 (U) | -2 / -2 |
| Magic | 10 | 8 (W) / 9 (U) | -2 / -1 |
| 60sDemo | 10 | 9 (W) / 9 (U) | -1 / -1 |
| Defense | 9 | 6 (W) / 7 (U) | -3 / -2 |

**No lateral version scores ≥1 higher on 3+ dimensions.** Per LOOP_INSTRUCTIONS rule for LATERAL_JUMP: **do NOT replace current-best.**

## What this validates

The lateral jump produced a strong robustness signal: under independent first-principles re-derivation, voice-diary as core mechanism remains optimal. Anchoring was the failure mode this cycle was designed to detect; the absence of a superior lateral indicates the cycle-4 synthesis is genuinely well-grounded, not just a comfortable convergence.

## What goes into the next synthesis (cycle 8)

Two refinements to fold:

### Refinement 1 — WhatsApp Share-target as a 3rd input mode

Long-press any customer WA message → Share menu → Tokoflow → AI files (transcript + extracted entities, equivalent to a voice note).

Why better than "snap WA chat" photo:
- One gesture (long-press → share) vs two (open app → snap)
- Captures full text, no OCR
- Works on multiple messages at once

### Refinement 2 — Lock-screen widget for one-tap mic

iOS 16+ Lock Screen widget OR Android 12+ Quick Settings tile = mic button without unlocking. Voice queues to a stack, processed when phone unlocks.

Why this matters for Aisyah:
- "Tangan berminyak dengan santan" — Aisyah cycle-2 critique
- "Anak menjerit tarik baju" — Aisyah cycle-2 critique
- Lock-screen + biometric is a 1.5-second motion vs unlock + open + double-tap (5+ seconds)

## Updated input modality stack (for cycle 8 synthesis to merge)

| Priority | Mode | Surface | When |
|---|---|---|---|
| 1 | Voice — double-tap home screen | Home | Phone unlocked, hands free |
| 1b | Voice — lock-screen widget | Lock screen | Phone locked, hands greasy |
| 2 | Share-target | OS Share menu (WhatsApp) | Reading customer WA messages |
| 3 | Photo | Camera in-app | Bank SMS / WA chat hands-busy / quiet env needed |
| 4 | Text | Settings → Manual entry | Last resort |

## Verdict

LATERAL_JUMP gate satisfied. Convergence checklist updated.
