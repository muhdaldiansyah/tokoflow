# Cycle 014 — Consolidated Red-Team Round 4 (Regional MY+ID)

> 4 personas: Bu Aisyah (MY R4) + Ibu Sari (ID R1, NEW) + Steve Jobs Maximalist (R4) + YC Devil (R4)

## Score arc

| Persona | Metric | R1 | R2 | R3 | R4 |
|---|---|---|---|---|---|
| **Aisyah (MY)** | Want | 5 | 8 | 9 | **9** |
| | Trust | 3 | 8 | 8 | **9** |
| | 6mo | 4 | 7 | 8 | **8** |
| | Switch | NO | MAYBE | YES | **YES** |
| **Sari (ID, NEW)** | Want | – | – | – | **8** |
| | Trust | – | – | – | **6** |
| | 6mo | – | – | – | **7** |
| | Switch | – | – | – | **YES** (from Excel+notebook) |
| **Jobs** | Radicalism | 7 | 8 | 9 | **9** |
| | Gasp | 6 | 8 | 9 | **9** |
| | Verdict | REWORK | REWORK | SHIP | **SHIP** |
| **Devil** | YC | 5 | 6 | 7 | **8** |
| | Series A | 3 | 3 | 4 | **5** |
| | Bootstrap | 6 | 7 | 8 | **8** |
| | Moat (mo) | 6 | 8-10 | 10-14 | **12-16** |

## 11 critiques ≥7 severity (the regional layer reopened the surface)

### From Ibu Sari (new ID persona)

| # | Sev | Critique | Action for cycle 16 |
|---|---|---|---|
| 1 | **8** | BI vocab leak — current-best uses "boleh tempah", "pukul", "kau" (Melayu, not Bahasa Indonesia). Natural BI: "ceritain aja", not "Cerita aja"; "boleh pesan" not "boleh tempah"; "jam 11" not "pukul 11"; "kamu" not "kau". | Hire native BI copy editor for ID-locale strings. Demo #2 vocab pass. Tagline reconsider: "Cerita aja" works but verify with real Bandung mompreneurs. |
| 2 | **8** | Privacy disclosure (on-device STT) must be VISIBLE in Day 1 onboarding tutorial 1, not buried in T&C. Indonesian users have higher privacy sensitivity post-Sahabat-AI government adoption. | Add explicit "audio kamu disimpan di HP, bukan di server kami — kamu bisa hapus kapan saja" slide in Day 1 tutorial 1. |
| 3 | **7** | Demo #2 prices unrealistic — 8 box nasi padang Rp 160k (~Rp 20k each) is below market. Realistic Rp 200-240k (Rp 25-30k each). Plus name "Mbak Sari" conflicts with merchant Ibu Sari (confusing). | Rename customer: "Mbak Lina" or "Bu Wati". Update price to Rp 240k (8 × Rp 30k). |
| 4 | **7** | QRIS deeplink — dynamic QRIS (per-amount, requires PJP partner integration) vs static QRIS (single QR, customer types amount, zero value-add). Current-best ambiguous. ID launch blocker if not clarified. | Cycle 16: explicit choice. Static QRIS Day 1 (zero integration; merchant shows existing personal QR), dynamic QRIS Pro tier Wave 2+. |
| 5 | **7** | Brand "Tokoflow" too English/corporate for ID ear. Recommend keep "CatatOrder" as ID brand explicitly. Sister-brand strategy confirmed. | Cycle 16: re-affirm CatatOrder ID brand identity in current-best. "Tokoflow" stays MY-only; positioning narrative unified, brands localized. |

### From Jobs Maximalist

| # | Sev | Critique | Action |
|---|---|---|---|
| 6 | **7** | Demo #2 is symmetric translation of Demo #1 — performs sameness, not difference within identical mechanism. Regional positioning earns its keep only if mechanism takes different SHAPE per market. | Cycle 16: rewrite Demo #2 to leverage QRIS bank-SMS auto-ingest (MY structurally has no universal-rail equivalent). The mechanism shape demonstrably different. |
| 7 | **7** | "Day 30 text-input escape hatch" reads as pre-apology. Cut it. Don't ship apologies. | Cycle 16: remove "Day 30 text-input" line from post-launch roadmap. If text input is needed, just ship it Day 1 in Settings. Or actually delete it entirely. |

### From YC Devil

| # | Sev | Critique | Action |
|---|---|---|---|
| 8 | **7** | GoTo / Mokapos defensive counter-attack is thesis-killer. Refuse-list defense fragile if GoTo ships "Mokapos Lite Voice" with their distribution + Sahabat-AI infra. | Cycle 16: explicit "GoTo response scenario" mitigation: speed-to-market in MY (window) + voice-corpus head start + brand-love compounding + channel orthogonality (TikTok creator vs Gojek merchant network). Acknowledge as latent risk, not solved. |
| 9 | **7** | Sahabat-AI dependency = "primary ID LLM built by largest ID competitor" — strategically poor optics for VC diligence. | Cycle 16: reframe — Sahabat-AI is OPEN-SOURCE Llama 3 8B fine-tune, public good. Tokoflow uses it like Apple uses Linux. Plus OpenRouter Gemini fallback. NOT a dependency on a competitor's proprietary infra. Strengthen this narrative. |
| 10 | **7** | Sister codebase = "hedging" unless reframed as Stripe-style per-country compliance shells around unified voice-corpus product. | Cycle 16: explicit Stripe parallel — "two compliance shells, one voice-corpus core". Ship shared `voice-core` package by Day 60 to make this real. |
| 11 | **7** | 0 ID interviews logged. Survivable at YC, fatal at Series A. | Cycle 16: add Phase 0.5 gate — 5 friendly + 5 hostile ID interviews (Bandung + Jakarta + Surabaya) before Wave 2 launch. Same gate that exists for MY (per CLAUDE.md). |

### From Bu Aisyah

| # | Sev | Critique | Action |
|---|---|---|---|
| 12 | 6 | Confidence-chip (Day 1) vs trust-mode (Day 60) ambiguity in cycle-013 cut. If all money events flag yellow Day 1, lunch rush has 30 confirms. | Cycle 16: clarify: 🟢 fires Day 1 on high-confidence per-utterance scores. Trust-mode (Day 60) auto-promotes PATTERNS to permanent green. Two distinct mechanics; chip works Day 1. |

## Personas' final one-liners

- **Aisyah (MY R4)**: *"OK, regional pun aku tetap pakai. Asal hari aku tak terganggu dengan benda Indonesia."*
- **Sari (ID R1)**: *"Konsep keren, tapi bahasa demo-nya kerasa banget Tokoflow MY ngarang aja. Kalau bisa benerin vocab + brand pakai CatatOrder, baru aku in."*
- **Jobs**: *"Regional adds reach, not magic. Ship MY first, ship ID with mechanism-takes-different-shape (QRIS pre-unlock auto-ingest), or you've translated instead of expanded."*
- **Devil**: *"YC interview: yes. Series A: not yet. Validate ID transfer + GoTo non-response over 6 months post-Wave-2-launch, then re-pitch."*

## Regional convergence verdict — cycle 16 synthesis must address all 11

**The regional expansion reopened the surface.** Sari's 5 ID-specific critiques are real and load-bearing. Jobs's "demo-symmetric" critique is correct — sameness performs translation, not regional defensibility. Devil's GoTo + Sahabat-AI optics are diligence-killers.

**Cycle 16 must execute 11 fixes** before cycle 18 RED_TEAM round 5 can verify zero ≥7 critiques.

## Convergence checklist update

- [x] All 8 dims ≥ 9 (held at 10/10 since cycle 13)
- [x] Jobs Radicalism ≥8 last 3 RED_TEAMs (cycle 6=8, 10=9, 14=9)
- [x] LATERAL_JUMP ✓ (cycle 5)
- [x] CONSTRAINT_HARDEN ✓ (cycle 9)
- [x] DELETE_PASS ✓ (cycle 13 formal + cycle 4 + 8 + 12 = 14+12 = 26 cumulative deletes)
- [x] Forbidden-phrase check passed
- [ ] **Last 3 RED_TEAMs no critique ≥7** — cycle 14 surfaced 11 ≥7 critiques. Must fix in cycle 16, verify in cycle 18.
- [ ] 60s demo unchanged across last 2 syntheses — Demo #2 will be rewritten in cycle 16 (Jobs sev-7); stability gate resets.
