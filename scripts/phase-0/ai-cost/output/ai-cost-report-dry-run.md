# Phase 0 AI Cost Measurement Report

**Mode**: DRY RUN (token estimates, no API calls)
**Model**: google/gemini-3.5-flash
**Scenarios run**: 16
**Total monthly events per merchant**: 284.5
**Generated**: 2026-06-04T07:26:15.047Z

## Verdict

✅ PASS_AMPLE — Pro RM 49 viable with ≥69% margin (locked tier)

**Total monthly cost per merchant**: $0.5634 USD = RM 2.65 MYR

## Per-type breakdown

| Type | Count | Avg Input Tokens | Avg Output Tokens | Avg Cost (USD) | Monthly Freq | Monthly Cost (USD) | Monthly Cost (RM) |
|---|---|---|---|---|---|---|---|
| reply_draft | 4 | 485 | 98 | $0.001605 | 170 | $0.2728 | RM 1.28 |
| complaint_draft | 1 | 526 | 200 | $0.002589 | 2 | $0.0052 | RM 0.02 |
| pricing_whisper | 1 | 410 | 100 | $0.001515 | 4 | $0.0061 | RM 0.03 |
| payment_match | 2 | 373 | 60 | $0.001099 | 25 | $0.0275 | RM 0.13 |
| customer_memory | 1 | 402 | 150 | $0.001953 | 5 | $0.0098 | RM 0.05 |
| pattern_detection | 3 | 348 | 110 | $0.001512 | 26.5 | $0.0401 | RM 0.19 |
| order_parse_image | 1 | 1442 | 300 | $0.004863 | 15 | $0.0729 | RM 0.34 |
| order_parse_voice | 1 | 131 | 300 | $0.002896 | 10 | $0.0290 | RM 0.14 |
| recap_analyze | 1 | 159 | 400 | $0.003838 | 15 | $0.0576 | RM 0.27 |
| receipt_triage | 1 | 1465 | 150 | $0.003548 | 12 | $0.0426 | RM 0.20 |

## Sensitivity analysis

| Scale | Multiplier | Monthly Cost (RM) |
|---|---|---|
| 50 orders (baseline) | 1× | RM 2.65 |
| 100 orders (Pro heavy) | 2× | RM 5.30 |
| 200 orders (Business) | 4× | RM 10.59 |
| Peak Ramadan (5×) | 5× | RM 13.24 |

## Pricing tier recommendation

- **Pro**: RM 49/mo — margin ≥69%, ample buffer
- **Business**: RM 99/mo — comfortable margin
- **Free**: cap at 50 orders/mo (subsidy ~RM 5/mo per Free user)
- **No re-spec needed**. Phase 0 Gate #3 cleared.

---

*See [README.md](./README.md) for methodology. Update [`05-pricing.md`](../../../docs/positioning/05-pricing.md) tentative tiers based on this verdict.*