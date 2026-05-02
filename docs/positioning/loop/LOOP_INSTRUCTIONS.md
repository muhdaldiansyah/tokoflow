# Tokoflow Positioning Loop — Per-Cycle Mandate

> **You are running ONE cycle. Read this file in full. Determine cycle number from `$LOOP_CYCLE` env var (or `cat runs/.loop-counter` + 1). Read disk state. Execute the mode for this cycle. Exit.**

---

## Mission (the only thing that matters)

Find a positioning for Tokoflow that is **radically better** than the current v1.2 bible — one that revolutionizes how solo merchants in Malaysia (Wave 1: Bu Aisyah, home F&B mompreneur, Shah Alam) sell, with all 4 hard constraints met:

| # | Constraint | Why hard |
|---|---|---|
| 1 | **AI-native UX** — AI is the entire interface, not a feature bolted on | Forces Steve-Jobs-level rethink of input modalities |
| 2 | **Simple IT system** — 2 engineers, 3 months, no exotic infra (no microservices, no event-sourcing, no proprietary protocols) | Solo founder reality, not Series A vapor |
| 3 | **Zero or near-zero external integrations** — ideal: phone camera + voice + AI + screen, full stop. WhatsApp Business API, payment gateways, e-invoice APIs all become **Pro-tier upgrades**, not core | Eliminates KYB blockers, third-party risk, integration tax |
| 4 | **Steve Jobs immersive UX** — has a named Magic Moment that makes a non-merchant gasp on demo, deletable to a 60-second pitch | Without this it's "another SMB tool" |

We are NOT optimizing for "10% better than v1.2". We are searching for **a different mountain**. If after 20 cycles we land on a refined v1.2, the loop has failed even if every dimension scored 8/10.

---

## Per-cycle invariants

1. Each `claude -p` invocation = exactly **ONE** cycle. Then exit cleanly.
2. **Disk is truth.** Conversation memory dies between cycles — write everything to disk before exit.
3. Read at start: `current-best.md`, `scoreboard.md`, last 3 lines of `CHANGELOG.md`, the most recent file under `hypotheses/`/`critiques/`/`research/`/`synthesis/`.
4. Write per-cycle artifact to the correct subdir. Filename: `cycle-NNN.md` (zero-padded to 3 digits, e.g. `cycle-007.md`).
5. End every cycle with: append 1 line to `CHANGELOG.md` (`cycle NNN | MODE | one-line summary | scoreboard delta`). Update `INDEX.md` if new artifact.
6. If convergence criteria met, write `CONVERGED.md` (sentinel). Wrapper detects and stops the loop.
7. Use **ultrathink** every cycle. Do not be lazy. Lazy cycles waste tokens worse than skipped cycles.
8. Each cycle: target <90k tokens. If approaching, write what you have, exit cleanly. Better to converge in 25 cycles than blow context in 1.

---

## Mode selection — deterministic by cycle number

| Cycle | Mode | Subdir | Purpose |
|---|---|---|---|
| 1 | HYPOTHESIZE_RADICAL | `hypotheses/` | Generate 3 radically different positionings, pick best |
| 2 | RED_TEAM | `critiques/` | 3-persona parallel critique |
| 3 | RESEARCH | `research/` | Competitor + cross-domain analogy (gaming UX) |
| 4 | SYNTHESIZE | `synthesis/` | Fold critique + research, **delete ≥1 thing** |
| 5 | LATERAL_JUMP | `hypotheses/` | Ignore current-best, re-derive from first principles |
| 6 | RED_TEAM | `critiques/` | |
| 7 | RESEARCH | `research/` | Cross-domain: hardware (iPod killing MP3 players) |
| 8 | SYNTHESIZE | `synthesis/` | |
| 9 | CONSTRAINT_HARDEN | `hypotheses/` | Force zero-external-integration version |
| 10 | RED_TEAM | `critiques/` | |
| 11 | RESEARCH | `research/` | Cross-domain: ritual / religious app stickiness |
| 12 | SYNTHESIZE | `synthesis/` | |
| 13 | DELETE_PASS | `hypotheses/` | Cut 50% of features — what survives? |
| 14 | RED_TEAM | `critiques/` | |
| 15 | RESEARCH | `research/` | Cross-domain: banking simplicity (Cash App, Revolut) |
| 16 | SYNTHESIZE | `synthesis/` | |
| 17 | LATERAL_JUMP | `hypotheses/` | Second first-principles re-derivation |
| 18 | RED_TEAM | `critiques/` | |
| 19 | RESEARCH | `research/` | Cross-domain: voice assistants (Alexa won, Siri lost) |
| 20 | SYNTHESIZE_FINAL | `synthesis/` | Final synthesis + verdict + convergence check |

**Rules of mode dispatch:**
- Read `$LOOP_CYCLE` (or fallback: cycle = `cat runs/.loop-counter` + 1).
- Look up mode in table above.
- If `CONVERGED.md` already exists, the wrapper has stopped — do not run.
- If `MAX_CYCLES` exceeded by wrapper, you won't be invoked.

---

## Mode procedures

### HYPOTHESIZE_RADICAL (cycle 1 only)

1. Read v1.2 essence: `docs/positioning/00-manifesto.md`, `01-positioning.md`, `08-the-disappearing-work.md`.
2. Generate **3 radically different alternative positionings**, each must include:
   - **Core mechanism** — the one thing the product does that's magical (not a feature list)
   - **Magic Moment** — named, ≤8 words, demo-able in <30s
   - **60-second demo script** — verbatim narration of what a user sees in 60s
   - **What this DELETES from current Tokoflow** — explicit subtractions
   - **Tech stack** — what's the simplest possible build?
   - **Why a competitor can't copy in 90 days** — moat hypothesis
3. The 3 must differ in **core mechanism**, not just framing. Examples of distinct mechanisms:
   - Voice-as-OS (entire app is a conversation)
   - Camera-as-OS (entire app is "point at thing → AI handles")
   - Receipt-screenshot-OS (merchant snaps WhatsApp chats / transfer screenshots → AI extracts everything)
   - AI-twin-as-merchant (AI runs the merchant's storefront autonomously)
   - Buyer-app-not-merchant-app (flip the polarity — give buyers the magic, merchant rides along)
4. Score each on the 8 scoreboard dimensions (1-10, see Scoreboard section).
5. **Pick the highest-scoring** as the new `current-best.md`. Write all 3 hypotheses to `hypotheses/cycle-001.md` with reasoning.
6. Update `scoreboard.md` with new baseline.

### LATERAL_JUMP (cycles 5, 17)

1. **Do NOT read current-best.md.** Anchoring kills lateral thinking.
2. Re-derive from first principles. Answer in order:
   - Who is Bu Aisyah? Read `docs/positioning/02-product-soul.md`.
   - What is the irreducible job-to-be-done? Strip to 1 sentence.
   - If you could ship only ONE feature in 4 weeks, what would it be?
   - What's the simplest tech stack that makes that ONE feature magical?
   - What's the Magic Moment of that feature?
   - What's the 60-second demo?
3. Write to `hypotheses/cycle-NNN.md`.
4. **AFTER writing**, read current-best.md and compare. Score both on 8 dimensions.
5. If lateral jump scores ≥1 point higher on **3 or more** dimensions → replace `current-best.md`. Else keep current-best, but record the lateral jump's strongest insight in synthesis next cycle.

### CONSTRAINT_HARDEN (cycle 9)

1. Read `current-best.md`.
2. Strip every feature/integration that requires:
   - External API (WhatsApp Business, Stripe, Billplz, MyInvois, FPX, Shopee, TikTok)
   - Cloud-only (force: works offline-first, syncs opportunistically)
   - Backend infra beyond a single Next.js server + Postgres or even SQLite
   - Provider keys beyond OpenRouter (the AI key is the only allowed external dep)
3. What is the minimum viable magic with only `phone camera + microphone + AI + a screen + opt-in click-to-WhatsApp deeplinks`? Click-to-WA deeplinks are allowed (user-initiated, no API integration).
4. Write to `hypotheses/cycle-009.md`. If hardened version still has Magic Moment + the merchant's day still works → **promote to current-best.md** (yes, even if it loses some features). Otherwise, identify what truly was load-bearing and add back **only** those.

### DELETE_PASS (cycle 13)

1. List every feature in `current-best.md` (exhaustive — every UI, every screen, every flow).
2. Delete 50% by line count. Keep only what produces the Magic Moment.
3. Walk Bu Aisyah's day with only the surviving features:
   - 06:00 wake — does the app do anything?
   - 09:00 first order — works?
   - 12:00 lunch rush — works?
   - 18:00 close — works?
   - 22:00 reconcile — works?
4. If yes at every checkpoint → **promote** the deleted version to current-best.md. If no, identify the genuinely load-bearing 1-2 features that broke the day and add only those back.
5. Write delta to `hypotheses/cycle-013.md`: deleted list, surviving list, day-walk verdict, decision.

### RED_TEAM (cycles 2, 6, 10, 14, 18)

Spawn **3 sub-agents in parallel** using the Agent tool. Each gets the full text of `current-best.md` plus a persona-specific system prompt.

**Persona 1 — Bu Aisyah (target merchant).**

> Agent type: general-purpose. Prompt:
> "You are Bu Aisyah, 38, home F&B mompreneur in Shah Alam, Malaysia. You sell nasi box and kuih, ~80 orders/month, work between school runs and 3 kids. WhatsApp is your everything. You don't speak engineer. You don't trust apps that change your customer relationships.
>
> Read the positioning below. Honest reaction in Malay-leaning English (code-switch OK). Answer:
> 1. Would you actually use this? Why / why not?
> 2. What confuses you?
> 3. Where does it not match your real day?
> 4. What feels too techy or too sales-y?
> 5. What would you tell your sister-in-law (also a mompreneur)?
>
> Length: ≤500 words. Score the positioning 1-10 on 'I want this'. End with one sentence: would you switch from your current way?
>
> [paste current-best.md here]"
>
> Output to: `critiques/cycle-NNN-aisyah.md`

**Persona 2 — Steve Jobs Maximalist.**

> Agent type: general-purpose. Prompt:
> "You are Steve Jobs reviewing a positioning document. You are not polite. Your bar:
> - Every feature must be magical, not useful
> - Every interaction must surprise
> - Every word must be cut to the bone
> - Software is not enough — there must be a moment that makes someone gasp
>
> Read the positioning. Brutal review:
> 1. Where is this still too timid? List specifically.
> 2. What would you DELETE? List with reasoning.
> 3. What's the Magic Moment that makes someone gasp? If unclear or absent, write 'NO GASP — REJECT' and explain why.
> 4. Score 1-10 on RADICALISM (10 = changes how merchants work; 1 = incremental).
> 5. Give ONE concrete suggestion that would make this 2x more magical.
>
> Length: ≤700 words. End with: 'My verdict: [SHIP / REJECT / REWORK]' and one-line reason.
>
> [paste current-best.md here]"
>
> Output to: `critiques/cycle-NNN-jobs.md`

**Persona 3 — YC Devil's Advocate.**

> Agent type: general-purpose. Prompt:
> "You are a YC partner reviewing this positioning for funding. You've seen 10,000 SaaS pitches. You are merciless on:
> - Unit economics
> - Moat (what stops a better-funded competitor from copying in 90 days?)
> - Wedge narrowness (is the entry point so tight that incumbents won't bother?)
> - 6-month kill scenarios (what specifically kills this by month 6?)
> - Distribution math (how does this acquire merchants without burning?)
>
> Read the positioning. Brutal review:
> 1. What kills this by month 6? List 3 specific scenarios.
> 2. Where's the moat? Be specific — not 'AI is hard'.
> 3. Why won't [Bukku, Niagahoster, Maxis Hotlink Biz, SmartBizz, Storehub, Loyverse, …] copy this in 90 days?
> 4. CAC payback — back-of-envelope at RM 49 ARPU and 30% gross margin: what does CAC need to be?
> 5. Score 1-10 on 'fundable today as a YC W26 batch'.
>
> Length: ≤600 words. End with: 'Survives YC interview: YES / NO' and one-line reason.
>
> [paste current-best.md here]"
>
> Output to: `critiques/cycle-NNN-devil.md`

After all 3 return, write a **consolidated** `critiques/cycle-NNN.md` containing:
- Top 5 strongest critiques across all 3 personas (one line each, scored 1-10 by you for severity)
- Quoted gasp / no-gasp verdict from Jobs
- Quoted survives-YC verdict from Devil
- Aisyah's "I want this" score
- Synthesis pointer: "Synthesis cycle should address: [list top 3]"

### RESEARCH (cycles 3, 7, 11, 15, 19)

Two halves: **competitive scan** + **cross-domain analogy** (rotates per cycle, see table).

**Half 1 — Competitive scan (every research cycle):**
- WebSearch 4-6 queries:
  - "AI commerce app SMB Malaysia 2026"
  - "voice first commerce app 2025 2026"
  - "WhatsApp commerce AI [country/region]"
  - "camera POS no integration"
  - One query specific to current-best's mechanism (e.g., if current-best is voice-first, "voice ordering app failure mode")
- Extract: 3 competitor moves observed (real product launches/pivots/deaths in last 12 months). Cite URL + 1-line takeaway each.
- **Forbidden in writeup:** "AI is hot", "growing market", any generic trend statement. Specific moves only.

**Half 2 — Cross-domain analogy (per-cycle, see table):**

| Cycle | Domain | Question to answer |
|---|---|---|
| 3 | Gaming UX | How do mobile games (Clash Royale, Genshin) onboard a new player to the magic moment in <60s? Extract principle for Tokoflow. |
| 7 | Hardware kills software | How did iPod (2001) kill 30 better-spec'd MP3 players? What was non-obvious? Extract principle. |
| 11 | Ritual / religious apps | Why do daily prayer apps (Muslim Pro, Athan) achieve 5-year retention with simple feature sets? Extract principle. |
| 15 | Banking simplicity | Cash App and Revolut beat legacy banking apps by deleting features. What did they delete? Extract principle. |
| 19 | Voice assistants | Why did Alexa win in homes and Siri lose in pockets? Specifically the UX pattern, not the model quality. Extract principle. |

Write `research/cycle-NNN.md` with:
- Competitive scan: 3 moves, source URL, takeaway each
- Cross-domain analogy: question, sources, extracted principle (1 paragraph)
- **Implications for current-best.md** — 3 specific changes the next synthesis should consider

### SYNTHESIZE (cycles 4, 8, 12, 16)

1. Read **all** of: latest critique consolidated file, latest research file, current-best.md, scoreboard.md.
2. Update `current-best.md`:
   - Address each critique scored ≥7 in red-team. Skip ≤6 critiques (don't optimize for noise).
   - Fold research implications. If a competitor moved in a direction we should NOT follow, write why explicitly.
   - **Mandatory delete:** delete ≥1 thing. State what was deleted at the top of current-best.md (in a `## Deleted in cycle NNN` section that grows over time).
   - Re-write Magic Moment if the answer changed. Re-write 60-second demo if it changed.
   - Run forbidden-phrases check (see below). If any found in your draft, rewrite.
3. Re-score the 8 dimensions. Write deltas.
4. Write `synthesis/cycle-NNN.md`:
   - **Added** (specific items)
   - **Deleted** (specific items, ≥1)
   - **Score deltas** per dimension
   - **Forbidden-phrase check** (pass/fail)
   - **Convergence check** — see criteria below
5. If convergence met → write `CONVERGED.md`.

### SYNTHESIZE_FINAL (cycle 20)

Same as SYNTHESIZE plus:
- **Verdict section** in synthesis log: is the final positioning genuinely radical? All 8 dimensions ≥9? If not, list gaps.
- **Compare cycle-001 hypotheses to final** — what changed, what was right initially, what was wrong.
- **Phase 1 implementation plan** — given the final positioning, what does a 4-week MVP look like? Stack, screens, magic moment shipping order.
- **If converged:** write `CONVERGED.md`. **If not:** write a clear "next steps" recommendation in the synthesis file (e.g., "extend to 30 cycles with focus on X").

---

## Scoreboard — 8 dimensions (1-10)

Maintain in `scoreboard.md` as a table with current scores + history.

| # | Dimension | What 9-10 looks like |
|---|---|---|
| 1 | **Simplicity of IT system** | Buildable by 2 engineers in 3 months. Single codebase. No exotic infra (no microservices, no event-sourcing, no proprietary protocols). Postgres or SQLite. Plain Next.js. |
| 2 | **Zero external integration** | Works with phone + AI alone. No payment gateway, no e-invoice API, no WA Business API needed for core flow. Click-to-WA deeplinks (user-initiated) allowed. Pro-tier paid features may add integrations as upgrades. |
| 3 | **AI-native depth** | AI is the UI. Removing AI = product breaks (not "loses a feature"). No traditional forms anywhere in the core flow. |
| 4 | **Steve Jobs immersive UX** | Has a named Magic Moment. Demo-able in <30s. Feels like Touch ID first time, not "another feature". |
| 5 | **Revolutionary potential** | Changes how merchants work day-to-day. Not "10% better than competitor". Demoable line: "Before X, merchants did Y. After X, merchants do Z." Z must be qualitatively different from Y. |
| 6 | **Magic moment quality** | The moment is specific (not abstract), demo-able in <30s, emotionally resonant (relief, surprise, delight). A non-merchant would say "wait, do that again" on first watch. |
| 7 | **60-second demo tightness** | A non-merchant non-engineer groks the value in 60s flat. No setup, no caveats, no "and then…" |
| 8 | **Defensibility** | Specific answer to "why won't [4 named MY/SG competitors] copy in 90 days?". Answer cannot be "AI is hard" — must be data, distribution, or proprietary loop. |

---

## Convergence criteria

Write `CONVERGED.md` only when **ALL** of these are true:

- [ ] All 8 dimensions ≥ 9 in current scoreboard
- [ ] Last **3** RED_TEAM cycles produced no critique scored ≥7 by reviewer
- [ ] "Steve Jobs Maximalist" persona scored RADICALISM ≥8 in last 2 RED_TEAM cycles
- [ ] ≥1 LATERAL_JUMP cycle has been executed (cycle 5 minimum)
- [ ] ≥1 CONSTRAINT_HARDEN cycle has been executed (cycle 9 minimum)
- [ ] ≥1 DELETE_PASS cycle has been executed (cycle 13 minimum)
- [ ] Forbidden-phrase check passed in latest synthesis
- [ ] 60-second demo script exists and was unchanged across last 2 synthesis cycles (stability signal)

`CONVERGED.md` content:
```markdown
# CONVERGED — Cycle NNN

## Final positioning
[copy current-best.md verbatim]

## Final scoreboard
[copy scoreboard.md latest column]

## Why this is the answer
[2-3 paragraph synthesis: why this beat the alternatives, why it survives all 3 personas, why it meets all 4 hard constraints]

## Phase 1 implementation plan (4-week MVP)
[stack, screens, magic moment shipping order]

## What we learned
[3-5 bullets: surprising insights from the loop]
```

---

## Forbidden phrases (regression detector)

Never let these appear in `current-best.md`:

- "best-in-class" / "comprehensive" / "all-in-one"
- "incremental improvement" / "fast-follower" / "best of breed"
- "enterprise-grade" (Tokoflow is for solo merchants, not enterprises)
- "platform" used as core noun (we are an APP, opinionated; "platform" = nothing-burger)
- "ecosystem" (we are NOT trying to be one)
- "synergy" / "leverage" / "robust" / "scalable" / "world-class" (corporate sludge)
- "AI-powered" / "AI-driven" / "powered by AI" (every product says this; meaningless)
- "seamless" / "intuitive" (claim it by demo, never by adjective)

If synthesis cycle's draft contains any → rewrite the sentence. Note the catch in `synthesis/cycle-NNN.md`.

---

## Hard rules

1. **Never run more than ONE cycle per `claude -p` invocation.** Wrapper handles the next session.
2. **Never modify v1.2 archive files** (`docs/positioning/00-manifesto.md` through `08-the-disappearing-work.md`). Those are sealed. New work goes only in `loop/`.
3. **Never call WebSearch outside of RESEARCH cycles.** Mode discipline > token waste.
4. **Never spawn agents outside of RED_TEAM cycles.** Same reason.
5. **Each cycle MUST update CHANGELOG.md** with one line: `cycle NNN | MODE | one-line summary | scoreboard delta or n/a`.
6. **Never ask the user to confirm anything mid-cycle.** Disk is truth, the wrapper is the loop driver.
7. **Never re-run a completed cycle.** If `synthesis/cycle-004.md` exists, cycle 4 is done — read `$LOOP_CYCLE` to know your number.
8. **Idempotency** — if your cycle's artifact file already exists when you start, the wrapper crashed mid-cycle. Append a `(resumed)` section rather than overwriting.
9. **Token budget per cycle** — target <90k. If approaching, cut work, write what you have, exit. The loop continues.
10. **Use ultrathink.** Every cycle. The whole point of this loop is depth, not breadth.

---

## Recovery from interruption

If you start a cycle and find `runs/.loop-counter` value N, but `synthesis/cycle-NNN.md` (or the relevant subdir's cycle-NNN.md) already exists → the previous cycle finished but the wrapper hasn't yet incremented the counter. The wrapper handles that on its next loop iteration; just exit cleanly and log "no work — cycle NNN already complete".

If you start cycle N+1 and the prior cycle's artifact is missing → the prior cycle was killed mid-flight. Do **NOT** redo it — start cycle N+1's work normally. The previous cycle's logical work is lost, but the rotation moves on. Note this in `CHANGELOG.md` as `cycle NNN | INTERRUPTED | no artifact, skipped | n/a`.

---

*This file is the brain. Update only with strong reason. The loop's quality depends on these instructions being consistently followed across 20 fresh sessions.*
