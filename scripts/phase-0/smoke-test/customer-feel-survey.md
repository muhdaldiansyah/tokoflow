# Customer "Feel" Surveillance Protocol

> **Purpose**: detect whether customers noticed anything off during smoke test. **Stealth — never reveal Aldi was involved.** Done via merchant, framed as routine quality check.

> **Why critical**: Bible v1.2 [D-014](../../../docs/positioning/07-decisions.md) bets that **customers won't notice AI tone if Foreground Assist is well-tuned and merchant always sends.** This survey tests that bet.

---

## When to deploy

- **Mid-test (end of week 1)**: 3 customers
- **End-of-test (end of week 2)**: 5 customers (different from mid-test)
- **Random sampling**: prefer customers who interacted with merchant during smoke test window AND have prior history (so they have baseline to compare)

---

## Recruitment frame (merchant sends)

> "Hi [name], saya [merchant] — sorry kacau sekejap. Saya tengah cuba improve service saya, boleh tolong saya jawab 3 soalan pendek? Tak ada hadiah, but it would help me lots. Just balas yes kalau OK 🙏"

If yes, merchant sends survey. **No mention of Tokoflow, AI, tools, Aldi, or research.**

---

## The 5 surveillance questions

**Q1 (open, casual)**:
> "Macam mana experience kamu order from saya minggu ni? Anything different rasa?"

**Listen for**:
- Negative: "rasa lain," "rasa kaku," "biasanya kamu tak macam ini"
- Neutral: "biasa je," "OK," "macam selalu"
- Positive: "kamu cepat balas tau," "lebih organized," "rasa lebih professional"

**Red flag**: any "rasa lain" or hesitation. Probe gently: "Lain macam mana?"

---

**Q2 (specific to relationship)**:
> "Bila saya balas chat kamu — rasa macam saya yang balas? Atau ada moment yang rasa janggal?"

**Listen for**:
- "Macam kamu lah, biasa" → ✓ trust transfer holds
- "Kadang rasa formal sikit" → ⚠️ borderline, investigate which message
- "Honestly ada 1-2 message yang rasa bukan kamu" → ✗ red flag, identify specific message

If they identify a specific message → critical learning. Get text if possible.

---

**Q3 (response time)**:
> "Saya rasa saya balas chat kamu lebih cepat / lebih lambat / sama macam biasa minggu ni?"

**Listen for**:
- "Lebih cepat" → ✓ Background Twin removing residue → merchant has more capacity for chat
- "Sama" → neutral
- "Lebih lambat" → ⚠️ either Foreground Assist adds friction or merchant overloaded

---

**Q4 (custom request handling)**:
> "Kalau kamu pernah ada custom request minggu ni — macam mana saya handle compared to biasa?"

**Listen for**:
- Custom requests are high-context, harder for AI to handle
- "Sama je, kamu masih friendly bila saya minta tukar isi" → ✓ relationship preserved
- "Rasa terburu-buru" / "rasa generic" → ✗ Foreground Assist failing on edge cases

---

**Q5 (closing — open)**:
> "Anything yang you nak saya improve dari service saya?"

**Use this as catch-all** — they may surface things Q1-Q4 missed.

---

## Scoring

For each customer interview:

| Score | Meaning |
|---|---|
| 5/5 | All answers neutral or positive, no red flags |
| 4/5 | One mild concern, otherwise positive |
| 3/5 | Two concerns OR one specific message flagged |
| ≤2/5 | Multiple concerns, customer noticed something off |

**Aggregate threshold for PASS**:
- ≥7/8 customers (across mid + end test) score 4/5 or 5/5
- Zero customers identify a specific Foreground Assist draft as "not feeling like merchant"

**Aggregate threshold for KILL**:
- ≥2 customers identify specific Foreground Assist drafts as off
- ≥3 customers express any "rasa lain" sentiment
- Even 1 customer expressing trust degradation ("I almost stopped ordering")

---

## What we report up to bible

Append to smoke-test final report:

- 8 customer feel scores (anonymized)
- Specific quotes that flag concern (if any)
- Specific quotes that show relationship preserved (if any)
- Recommendation: trust transfer **HOLDS** / **MARGINAL** / **BROKEN**

This data informs D-018 alongside merchant interviews and Aldi's diary.

---

*Last updated: 2026-04-28 · Phase 0.5 sub-deliverable*
