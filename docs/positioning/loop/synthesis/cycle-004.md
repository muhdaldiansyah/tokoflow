# Cycle 004 — SYNTHESIZE

> Folded cycle-002 critique + cycle-003 research into current-best.md. Major rewrite, not patch.

## Added (specific items)

1. **Diary-IS-database architecture** — home screen is voice-note feed; orders/customers/payments are derived views. Schema-shaped UI deleted (Jobs sev-9 critique).
2. **Real-time micro-events capture** — double-tap-to-talk, 5-15s per event, scattered through the day. Replaces end-of-day batched recap fantasy (Aisyah sev-8 critique).
3. **Loud failures** — confidence chips (🟢🟡🔴) on every extraction; money events get visual 2-second confirm. Trust via visible doubt (Aisyah sev-8 + research finding A).
4. **Voice corrections** — "salah, tukar 5 jadi 3" works; typing relegated to Settings escape hatch. (Aisyah sev-8.)
5. **Daily morning voice briefing** — 8am, 30s in her own cadence, summarizing yesterday. Voice-in + voice-out closes the loop. (Jobs bonus suggestion + Clash Royale long-timer return hook.)
6. **Day 0 vs Day 1 onboarding distinction** — 60s demo is marketing; Day 1 first-session is 15-minute scaffolded with 5 micro-tutorials × 2.5 min. (Cycle-3 Clash Royale principle.)
7. **Demo close on world responding** — final beat is Pak Lee's "OK terima kasih kak" reply landing, not Bu Aisyah's send tap. (Jobs sev-7.)
8. **Shazam analog** — replaces Touch ID precedent. Asking IS solving. (Jobs.)
9. **"Tukang dengar" metaphor** — replaces "input modality" framing. Presence, not feature. (Jobs.)
10. **Negative-space moat (Apple-vs-Google parallel)** — refuse-list as durable because copying it costs competitors existing revenue. Per-competitor table. (New synthesis from Devil + research.)
11. **Cost-advantage moat** — WA Business API pricing hike Feb 2026 + click-to-WA deeplinks = real RM/month savings → funds Free tier. (Cycle-3 research.)
12. **Workflow IP re-rated 7/10** — design IP (domain vocab, context history, confidence routing) is real; Devil under-rated by conflating raw model with productized workflow. (Cycle-3 research finding B.)
13. **Distribution validation** — 4 real MY mompreneur creators named with handles. Content format defined: "POV: end-of-rush, I just talked into Tokoflow". (Cycle-3.)
14. **Realistic head-start: 12–18 months** (replaces cycle-1's optimistic 4-loop / 90-day defense).

## Deleted (mandatory ≥1; we deleted 8)

1. **Three-Tier Reality table** in current-best.md — Jobs called it training wheels. (Stays in `00-manifesto.md` as internal compass, not in positioning.)
2. **PRESERVE / KILL lists** — Jobs: "changelog, not product". Cut from positioning doc.
3. **"4 compounding loops"** investor-deck phrasing — replaced with one negative-space-moat sentence.
4. **Pricing tiers detail (RM 49 / RM 99, "API access", staff accounts, multi-outlet)** — Jobs: "SKU sheet, not positioning". Pricing belongs in `05-pricing.md` only.
5. **Refuse list 10 → 3** — Jobs: "first three are the brand, the other seven are a manifesto nobody finishes reading."
6. **"events" word** in user-facing copy — Mixpanel-speak per Jobs.
7. **"API access" Business tier item** — incongruous for solo merchants per Jobs.
8. **End-of-day batched recap fantasy** in 60s demo — replaced with scattered micro-events that stitch into a morning. (Aisyah sev-8.)

## Score deltas

| Dim | C1 | C4 | Δ | Reason |
|---|---|---|---|---|
| SimpIT | 9 | 9 | – | Stack unchanged; voice_notes-as-source-of-truth is a relabel of existing tables, not new infra |
| ZeroExt | 10 | 10 | – | Single dep preserved; click-to-WA deeplinks preserved |
| AInative | 10 | 10 | – | Diary-IS-DB makes AI more central, not less |
| JobsUX | 10 | 10 | – | Reframed (Shazam, close-on-reply); cycle-6 RED_TEAM should validate |
| RevPot | 9 | 10 | +1 | "Diary IS DB" is genuinely new mental model in MY SMB software (no competitor does this) |
| Magic | 10 | 10 | – | Held; Jobs scored 6 originally — cycle 6 must re-test |
| 60sDemo | 10 | 10 | – | Closes on world responding |
| Defense | 7 | **9** | +2 | Negative-space moat + cost-advantage + workflow IP re-rated |
| **Avg** | **9.4** | **9.75** | **+0.35** | |

## Forbidden-phrase check

Scanned new current-best.md:
- ✓ no "best-in-class", "comprehensive", "all-in-one"
- ✓ no "incremental", "fast-follower"
- ✓ no "enterprise-grade"
- ✓ no "platform" used as core noun (only used in "lock kau dalam platform" — refusal context, OK)
- ✓ no "ecosystem"
- ✓ no "synergy", "leverage", "robust", "scalable", "world-class"
- ✓ no "AI-powered" / "AI-driven"
- ✓ no "seamless", "intuitive"

**Pass.**

## Convergence check

- [x] All 8 dimensions ≥ 9 (Defense newly at 9)
- [ ] Last 3 RED_TEAM cycles: no critique scored ≥7 → only **1 RED_TEAM done** (cycle 2). Need 2 more before convergence.
- [ ] Steve Jobs Maximalist Radicalism ≥8 in last 2 RED_TEAMs → last score was **7**. Cycle 6 RED_TEAM must re-test the rewrite.
- [ ] ≥1 LATERAL_JUMP → pending **cycle 5**.
- [ ] ≥1 CONSTRAINT_HARDEN → pending cycle 9.
- [ ] ≥1 DELETE_PASS → partially executed here (8 deletions) but formal cycle 13 still pending.
- [x] Forbidden-phrase check passed.
- [ ] 60s demo unchanged across last 2 syntheses → demo just changed (closes on reply now). Need 1 more synthesis to lock stability.

**NOT yet converged.** Synthesis hits 8/10 scoreboard but procedural gates (LATERAL_JUMP, second RED_TEAM, demo stability) not met.

## Recommended next moves

- **Cycle 5 LATERAL_JUMP**: ignore current-best.md entirely. Re-derive from first principles. If lateral version scores ≥1 point higher on 3+ dims, replace. Otherwise just record insights.
- **Cycle 6 RED_TEAM**: re-spawn the 3 personas with the rewritten current-best. Specifically push Jobs Maximalist on whether the diary-IS-DB reframe moves Radicalism 7 → 8+.
- **Cycle 7 RESEARCH**: cross-domain analogy = hardware (iPod killing better-spec'd MP3 players). Plus deep-dive on Bukku's roadmap (is voice-receipt-extraction publicly hinted for next quarter?).
- **Cycle 8 SYNTHESIZE**: fold cycle 5/6/7 outputs.

## Honest weaknesses still present

- **Voice in noisy kitchen** — partially mitigated by snap-photo accent, not eliminated. Needs Phase 0 merchant validation.
- **Numerical disambiguation accuracy** — claimed but unmeasured. "RM dua puluh lima" vs "twenty-five" needs spike test.
- **Founder–creator outreach gap** — 4 creators named but none contacted. Distribution claim still partly wishlist.
- **Maxis bundling threat** — latent, not active. Watch quarterly.
- **First-time merchant trust with talking-to-phone** — onboarding ritual still unclear. Cycle 5 LATERAL_JUMP may surface fresh angle.
