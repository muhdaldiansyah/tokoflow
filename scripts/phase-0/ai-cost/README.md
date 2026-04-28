# Phase 0 AI Cost Measurement

> **Purpose**: measure ACTUAL AI cost per active merchant before locking pricing tier. Pre-committed kill criterion: **AI cost > RM 30/month at RM 79 max → unit economics broken → kill** ([06-roadmap.md](../../../docs/positioning/06-roadmap.md#kill-criteria--phase-0-pre-committed-no-rationalization)).

> **Method**: run realistic prompts (Background Twin + Foreground Assist) at projected 50-order/month merchant load via OpenRouter Gemini Flash Lite. Report cost in USD + RM with extrapolation.

---

## What we measure

Bible v1.2 architecture has 2 AI layers ([D-014](../../../docs/positioning/07-decisions.md#d-014--solution-architecture-2-layer-twin-background-autonomous--foreground-assist)):

### Background Twin (Tier 3 — autonomous)
Cost-light, mostly structured tasks:
- Payment matching (bank notif text → which order)
- Invoice generation (deterministic, minimal AI use)
- Status update sending (templated)
- Stock auto-decrement (deterministic, no AI)
- Customer relationship memory (embedding + retrieval)

### Foreground Assist (Tier 2 — suggest, merchant sends)
Cost-medium, conversational tasks:
- Customer reply suggestions (multi-turn context)
- Pattern surfacing ("Pak Andi balik lagi, suggest...")
- Complaint draft (high-context, calm tone)
- Pricing whisper (1x/week max)

### Onboarding (one-time)
Cost-burst, multimodal:
- Photo Magic v1: image parse + product extraction (per [P4-photo-magic-plan.md](../../../docs/positioning/P4-photo-magic-plan.md))
- Voice transcription if voice fallback used

---

## Method

### Realistic merchant simulation

Single Pro-tier merchant at projected scale:
- 50 orders/month = 1.6 orders/day average
- 4-5 customer interactions per order (initial Q&A, confirm, status update, follow-up) = ~225 customer chat events/month
- ~70% of customer chat → Foreground Assist draft suggestion
- Background Twin events: 50 invoices, ~40 payments matched, ~150 status updates, ~50 stock updates
- 1 onboarding event in lifetime (amortized)

Total monthly events:
- Foreground Assist: ~160 reply drafts + ~10 pattern alerts + ~3 complaint drafts = **~175 AI events**
- Background Twin: ~40 payment matches (AI for ambiguous only ≈ 20 events) + ~5 customer relationship summaries = **~25 AI events**
- Total: **~200 AI events/month per merchant**

### Cost model (Gemini Flash Lite via OpenRouter, current pricing 2026-04)

```
Input tokens:  ~$0.000075 / 1K tokens
Output tokens: ~$0.0003   / 1K tokens
```

Per-event token estimates:
| Event type | Input avg | Output avg | Cost/event |
|---|---|---|---|
| Foreground Assist reply draft | 1500 tok (history + customer msg) | 300 tok (draft) | ~$0.0002 |
| Pattern surfacing | 3000 tok (customer history) | 200 tok (alert) | ~$0.00029 |
| Complaint draft | 2500 tok (full context) | 500 tok (draft) | ~$0.00034 |
| Payment match (ambiguous) | 1000 tok (notif + open orders) | 100 tok (decision) | ~$0.000105 |
| Customer memory update | 1500 tok (interaction) | 300 tok (summary) | ~$0.0002 |

**Projected monthly AI cost**:
- 175 Foreground Assist events × $0.00025 avg = ~$0.044
- 25 Background Twin events × $0.00015 avg = ~$0.004
- **Subtotal ~$0.05/month per merchant** at this scale

> ⚠️ **This projection is too low to trust.** Real prompts will be longer (system prompts + few-shot examples + retrieval-augmented context). Real merchants will have edge cases. Voice transcription and embedding overhead not included.

### Real measurement target

We need actual numbers, not projection. Run script with:
- Production-grade system prompts (full Tokoflow voice character)
- Realistic context size (10-20 prior messages, customer profile, recent orders)
- Few-shot examples for tone matching
- Retrieval-augmented context (embeddings)

**Expected real cost**: $5-25/merchant/month based on early industry data points. Need to know which end of that range.

---

## Running the measurement

### Setup

```bash
# From repo root — copy template and add OpenRouter API key
cp scripts/phase-0/.env.phase-0.example scripts/phase-0/.env.phase-0
# Edit scripts/phase-0/.env.phase-0 and add OPENROUTER_API_KEY=sk-or-...
```

### Dry run (no API spend, validates script structure)

```bash
npx tsx --env-file=scripts/phase-0/.env.phase-0 scripts/phase-0/ai-cost/measure.ts --dry-run
```

Outputs token counts + projected cost without calling API. Use this first to sanity-check.

### Small-sample real run (~$1-2 USD spend)

```bash
npx tsx --env-file=scripts/phase-0/.env.phase-0 scripts/phase-0/ai-cost/measure.ts --sample 10
```

Runs 10 representative scenarios across AI event types, reports actual cost.

### Full simulation (~$5-15 USD spend)

```bash
npx tsx --env-file=scripts/phase-0/.env.phase-0 scripts/phase-0/ai-cost/measure.ts --full
```

Simulates 200 events at production scale. **Only run after small-sample validates prompts.**

---

## Pass / Fail thresholds

After full simulation:

### PASS — pricing tiers viable

- ✓ Cost per merchant ≤ **RM 15/month** → Pro RM 49 viable (margin 69%)
- ✓ Cost per merchant ≤ **RM 25/month** → Pro RM 79 viable (margin 68%)

### MARGINAL — adjust scope

- ⚠️ Cost RM 25-30/month → Pro tier shifts to RM 79 OR scope reduces (less Foreground Assist context)

### KILL — unit economics broken

- ✗ Cost > **RM 30/month** at RM 79 max → kill trigger #1 hits → reframe scope or kill

---

## Output deliverable

After measurement, produce `ai-cost-report.md` containing:

1. **Methodology** — prompts used, sample size, model
2. **Per-event cost** breakdown table
3. **Monthly cost projection** at 50-order load
4. **Sensitivity analysis** — at 100 orders, 200 orders, peak Ramadan 5x
5. **Pricing recommendation** — locked Pro tier price (RM 49 / 79 / 99)
6. **Free tier subsidy bound** — max orders/month before subsidy bleeds

This output → input to D-018 + locks 05-pricing.md tentative tiers.

---

## Files in this directory

- `README.md` — this file
- `measure.ts` — main measurement script
- `scenarios.ts` — realistic merchant scenarios
- `prompts/background-twin.ts` — Background Twin system prompts
- `prompts/foreground-assist.ts` — Foreground Assist system prompts

---

*Last updated: 2026-04-28 · Phase 0.6 deliverable · Cheap insurance against $X-thousand mispriced launch*
