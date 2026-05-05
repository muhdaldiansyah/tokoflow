# Phase 0 AI Cost Measurement Report

**Mode**: DRY RUN (token estimates, no API calls)
**Model**: google/gemini-flash-1.5-8b
**Scenarios run**: 12
**Total monthly events per merchant**: 232.5
**Generated**: 2026-05-05T16:10:21.482Z

## Verdict

✅ PASS_AMPLE — Pro RM 49 viable with ≥69% margin (locked tier)

**Total monthly cost per merchant**: $0.0083 USD = RM 0.04 MYR

## Per-type breakdown

| Type | Count | Avg Input Tokens | Avg Output Tokens | Avg Cost (USD) | Monthly Freq | Monthly Cost (USD) | Monthly Cost (RM) |
|---|---|---|---|---|---|---|---|
| reply_draft | 4 | 628 | 98 | $0.000038 | 170 | $0.0065 | RM 0.03 |
| complaint_draft | 1 | 526 | 200 | $0.000050 | 2 | $0.0001 | RM 0.00 |
| pricing_whisper | 1 | 410 | 100 | $0.000030 | 4 | $0.0001 | RM 0.00 |
| payment_match | 2 | 373 | 60 | $0.000023 | 25 | $0.0006 | RM 0.00 |
| customer_memory | 1 | 402 | 150 | $0.000038 | 5 | $0.0002 | RM 0.00 |
| pattern_detection | 3 | 348 | 110 | $0.000030 | 26.5 | $0.0008 | RM 0.00 |

## Sensitivity analysis

| Scale | Multiplier | Monthly Cost (RM) |
|---|---|---|
| 50 orders (baseline) | 1× | RM 0.04 |
| 100 orders (Pro heavy) | 2× | RM 0.08 |
| 200 orders (Business) | 4× | RM 0.16 |
| Peak Ramadan (5×) | 5× | RM 0.19 |

## Pricing tier recommendation

- **Pro**: RM 49/mo — margin ≥69%, ample buffer
- **Business**: RM 99/mo — comfortable margin
- **Free**: cap at 50 orders/mo (subsidy ~RM 5/mo per Free user)
- **No re-spec needed**. Phase 0 Gate #3 cleared.

---

*See [README.md](./README.md) for methodology. Update [`05-pricing.md`](../../../docs/positioning/05-pricing.md) tentative tiers based on this verdict.*