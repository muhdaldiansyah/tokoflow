# Cycle 029 — ARCH_CONSTRAINT_HARDEN

> Stress-test the cycle 28 boundary contract under failure modes. Every "happy path" architecture passes; this cycle finds where the contract actually breaks.

## Method

Walk 12 failure scenarios through the integrated stack (cycles 21+24+25 as constrained by cycle 28). For each: identify which contract section governs, predict the outcome, mark **PASS / TIGHTEN / SPIKE / DEFER**. Aggregate at the end.

| Scenario | What fails | Section governing | Verdict |
|---|---|---|---|
| 1. Offline 4 hours, 8 captures + 2 payments queue, then sync | sync ordering, dedup, signature spam | S3, S5 | PASS |
| 2. NotificationListener silently revoked (MIUI battery-saver Day 47) | observability of permission loss | S12 | PASS |
| 3. Whisper-tiny mishears `Aisyah` as `Aishah` (Levenshtein-1 from another customer) | confidence composition, fuzzy-match | S2, S9 | TIGHTEN |
| 4. iOS user, no Pro tier, customer pays via DuitNow QR | platform parity gap | S7 | PASS (honest) |
| 5. Toddler grabs phone, records 8s of "aaaa mama" voice note + accidental WA send | noise filtering, side-effect blocking | S5, S9 | TIGHTEN |
| 6. Customer transfers Rp 1,500,000 (typo: meant Rp 150,000) to merchant | over-amount, claim card vs auto-link | S2, S9 | PASS |
| 7. Voice correction "salah Pak Lim, RM 25" with 3 active Pak Lim orders | target resolution ambiguity | S9 | TIGHTEN |
| 8. Lebaran rush — 35 captures + 18 payments in 90 min | sensory storm, batch summaries | S5 | PASS |
| 9. Merchant uses VoiceOver, screen-reader narrating Now pin update | a11y regression | S14 | PASS |
| 10. Bandung user says "aing pesen 3 box atuh" — Sahabat-AI extracts wrong | LLM accuracy on dialect | S8 | SPIKE |
| 11. WhatsApp voice note 2 minutes long, 14MB, opus codec | decode + transcribe latency budget | S13 | PASS |
| 12. Wrong-customer auto-claim discovered Day 4 of merchant's week off | undo window vs threshold | S2, S10 | PASS |

---

## Scenario walkthroughs

### 1. Offline 4h drain — PASS

Aisyah at pasar 09:00–13:00, no signal. Captures: 8 voice notes + 2 NotificationListener-cached DuitNow notifs. Reconnects at 13:05.

**Predicted flow:**
- Sync queue drains in `created_at` order (S3)
- 8 voice notes → Whisper transcribe → LLM extract → `diary_entries` rows inserted; reconciliation deferred until batch complete
- 2 payment_notification rows enter `pending_match_queue` (S3)
- After batch sync completes, second-pass reconciliation runs once: matches both payments to their orders (amount + customer name)
- ONE batch-summary signature fires: "10 things filed, 2 paid" + 1 chime + 1 tap (S5)
- Now pin shows count badge "+10", no per-row ceremony spam

**Pass criteria met:** content-hash dedup prevents duplicate insertion if user also did manual-share for one of the 2 payments while at pasar (the share would have been queued offline too; dedup catches when both row-attempts hit on sync). Single batch-summary, no flooding.

**Risk:** 8 LLM calls in rapid succession on reconnect = OpenRouter rate-limit hit if free tier. **Mitigation:** Phase 0 spike must measure burst-rate; Pro tier upgrade has higher rate limit; queue throttles to 1 LLM call per 500ms regardless.

### 2. NotificationListener silent revocation — PASS

MIUI battery-saver killed listener at Day 47. Day 48: 3 DuitNow notifs land, listener doesn't fire. Day 54 (7 days later): heartbeat self-test posts internal notif, doesn't observe it. Day 55: 2nd heartbeat miss → coach-mark fires.

**Predicted flow:**
- Day 48-54: feature degrades silently to manual-share. Merchant may notice missing claims if they expect them, or not.
- Day 55 04:00 local: coach-mark "your phone may be stopping notifications" + per-OEM screenshot guide for MIUI re-enable
- Merchant fixes; subsequent 3-day audit shows listener restored

**Pass criteria met:** S12 spec is sufficient. **Risk:** the 7-day discovery window means up to 7 days of missed auto-claims. Manual-share fallback is always available (S7), so claims can still be manually-shared during that window — no data loss.

**Tighten consideration:** add **per-claim-card "pernah klaim auto-claim?" / "did this come via auto-claim before?"** retrospective check — if user manually shares 3+ payments in a row, prompt the heartbeat early.

### 3. Whisper mishears name → wrong fuzzy-match — TIGHTEN

Aisyah voices "Aisyah box 3 RM 75". Whisper hears "Aishah box 3 RM 75" (real customer named Aishah is in DB). LLM extracts customer="Aishah". Reconciliation engine fuzzy-matches against DB; finds Aishah Hassan (real customer). extract_conf=0.7 (Whisper noted ambiguity); match_conf=0.95 (exact name match).

**Composite (S2):** `min(0.7, 0.95) = 0.7` → 🟡 chip → 2-second peek with implicit-tap-to-fix.

**Predicted flow:** chip surfaces yellow; merchant has 2s to spot "Aisyah" vs "Aishah" before signature fires; if merchant taps within window, correction flow opens.

**Risk:** 2s is too short for a baby-on-hip mompreneur to read. AND the rule was "🟡 = 2-second peek with implicit-tap-to-fix" — but the user might miss it.

**TIGHTEN:** Yellow chip extends peek to **5 seconds** when the field is a customer-name (high-stakes) AND the candidate's name is Levenshtein-1 from merchant.profile.name OR from any other recent customer. This is a hard-coded "two-similar-names trap" detector. Cycle 30 ARCHITECTURE.md must add this to S2.

### 4. iOS user, no Pro tier, DuitNow received — PASS (honest)

Bu Aisyah's iPhone receives DuitNow notif at lock-screen. No Live Activity (Free tier). No NotificationListener (iOS structural). She must:

1. Long-press notification on lock-screen
2. Choose Share from action menu
3. Select Tokoflow from share sheet
4. Tap "claim" on the resulting card

**Predicted flow:** 4-tap manual-share. Compared to Android NotificationListener's 0-tap auto-claim, iOS Free is structurally lower-magic.

**Pass criteria met:** S7's "no silent degradation" rule is honored — onboarding and pricing make this explicit. Free-iOS user knows what they're getting.

**Risk:** Free-iOS user may churn due to felt-friction. **Mitigation:** Pro upgrade prompt is **gentle and contextual** — after manual-sharing 3+ payments in a week, the app shows ONE quiet line on the settings page: "Auto-claim available on Pro." No nag toast (S6 anti-anxiety).

### 5. Toddler chaos — TIGHTEN

Toddler grabs phone, records 8s of "aaaa mama mau cookie", releases. App is open; voice note enters capture queue.

**Predicted flow:**
- Whisper transcribes "aaaa mama mau cookie" — confidence very low (no recognizable words)
- LLM extract returns null or near-null structured data; extract_conf < 0.3
- Composite_confidence < 0.3 → 🔴 disambiguation card on Now pin
- Merchant sees "I didn't catch that — delete?"

**Risk:** the 🔴 card still **exists in the feed**. Even if merchant deletes it, it briefly polluted the diary. Also: if toddler grabs phone and triggers `mark-as-paid` on a Now pin (single-tap S4 grammar), they could accidentally confirm something.

**TIGHTEN:**
1. Voice notes with extract_conf < 0.3 AND no recognizable money-words / customer-words are auto-archived (not deleted, but hidden from Now pin) after 30 seconds. Settings → "things I couldn't understand" surfaces them for review.
2. Single-tap on **money-bearing** Now pins requires the tap to be sustained 200ms (not instant) — too quick = registered as scroll. This is a low-cost change in S4 gesture grammar.
3. Toddler-mode (settings opt-in) requires biometric on every money-bearing single-tap.

Cycle 30 must specify these 3 in S4/S5/settings.

### 6. Customer pays Rp 1,500,000 (typo, meant 150,000) — PASS

Customer transfers Rp 1.5M instead of Rp 150K. Notification arrives. Reconciliation runs:
- Pending order from this customer: Rp 150K
- Payment: Rp 1.5M
- Amount mismatch: 10× over → match_conf < 0.5 (amount-mismatch dominates)
- Composite: 🔴 → claim card with "Rp 1,500,000 from RIO PRATAMA — match to order #X (Rp 150,000)? Refund difference?"

**Predicted flow:** merchant taps claim card; chooses "this is for order X" (matches 150K, marks 1.35M as overpayment); voice "refund Rio 1 koma 35 juta" → outgoing refund tracked in diary.

**Pass criteria met:** S2's threshold + S9's correction cascade handle this. Auto-link does NOT fire because match_conf is below threshold.

### 7. "Salah Pak Lim, RM 25" with 3 active Pak Lim orders — TIGHTEN

Aisyah voices "salah Pak Lim, RM 25". Three active orders mention "Pak Lim".

**Per S9 + cycle 26 fix #5:** resolution heuristic: (1) prefer most recent <30min voice note matching speaker+entity, (2) if multiple, surface 2-second peek card with top-3 candidates and tap-to-pick, (3) if still ambiguous, default to "no-op + show last 3 mentions".

**Risk:** 2-second peek for a 3-candidate disambiguation in a busy moment is short.

**TIGHTEN:** disambiguation cards stay **until tapped** (no auto-dismiss). 2-second peek applies to single-candidate auto-corrections only. Multi-candidate disambiguation is a sticky claim card, not ephemeral. Cycle 30 must specify in S9.

### 8. Lebaran rush — PASS

09:00-10:30 in Bandung, 35 captures + 18 payments. Sensory grammar S5:

- 5-minute windows: ~6 events per window in peak
- Window 1 (09:00-09:05): full→shortened→silent→silent→silent→silent (6 events) → batch-summary at 09:05 close
- Subsequent windows similar

**Predicted flow:** ~18 batch-summary signatures fire across 90 min. ~6/hour ≈ one chime every 10 min average. Far less than cycle 26's "8 in 30 min" antipattern.

**Pass criteria met:** S5 decay envelope handles this. **Risk:** batch summary at window close says "5 things filed, 2 paid" but if the 5 things are visually overwhelming on the Now pin, the count alone isn't enough information. **Mitigation:** Now pin renders top-3 most recent + "+N more" — already in cycle 21 spec.

### 9. VoiceOver narration of auto-claim flow — PASS

Sari uses VoiceOver. Auto-claim fires: customer Pak Andi paid Rp 50K via QRIS. S14 collapses related events into one announcement: "Order from Pak Andi, Rp 50,000, paid via QRIS DANA, filed."

**Predicted flow:** single `aria-live="polite"` announcement, ~3.5s narration. No interruption of in-progress focus.

**Pass criteria met:** S14 is sufficient. **Risk:** during the announcement, if another auto-claim fires, the second announcement preempts. **Mitigation:** queue announcements with 1s gap; if 3+ pending, collapse to "3 more orders filed."

### 10. Bandung dialect Sahabat-AI accuracy — SPIKE

Sari voices "aing pesen 3 box weh, atuh anter Senin". S8 mandates Phase 0 spike `sahabat-ai-bandung-bench.ts` BEFORE Wave 2 launch.

**Predicted flow without spike data:** unknown. Sahabat-AI is Llama 3 8B fine-tune on Indonesian — Bandung dialect coverage is **untested**.

**Verdict:** **SPIKE required. Block Wave 2 launch on this gate.** If Sahabat-AI < Gemini accuracy on Bandung utterances, fall back to Gemini for ID despite the open-source narrative loss.

**Cycle 30 must include this as a Wave-2 launch gate, not a Phase-1 issue** (Wave 1 = MY = Gemini Flash Lite, no Sahabat-AI dependency).

### 11. 14MB 2-min WhatsApp voice note — PASS

Customer sends 2-min voice note ordering 12 items. Aisyah long-presses, shares to Tokoflow.

**Predicted flow:**
- iOS Share Extension / Android Share Intent receives `.opus` URI (S13)
- Decode opus → 16-bit PCM ≈ 4MB
- Whisper-tiny on-device transcribes ≈ 8-12 seconds (CPU-dependent; iPhone 12 Pro: ~10s; Redmi Note 12: ~15s)
- LLM extract on transcript ≈ 2-3s
- Total: ~15-18s before result on Now pin
- During wait: optimistic transcript chip "saya dengar..." (S6 vocab)

**Pass criteria met:** S13 + cycle 25 §B optimistic-transcript handles latency. **Risk:** 18s on a slow Android = merchant may close the share sheet thinking it didn't take. **Mitigation:** Share completion confirmation toast within 2s ("got it, processing"), then optimistic transcript at ~5s.

### 12. Wrong-customer auto-claim discovered Day 4 — PASS

Bu Aisyah goes on vacation Tue-Mon. On Wed (Day 1 of vacation), an auto-claim fires linking RM 100 from "Lim Chee Wei" to an order from "Lim Chee Wee" (wrong customer, Levenshtein-1 same household). Composite_conf was 0.91 (extract 0.95, match 0.96 — bad luck combo). Below new 0.92 threshold → did NOT auto-link → claim card sticky.

**Wait, S2 raised money-bearing threshold to 0.92.** So this case **doesn't auto-link**; it surfaces as a claim card.

**Predicted flow:** claim card stays on Now pin for the entire vacation. Bu Aisyah returns Mon, sees it, taps "Bukan saya / not for this order" → routes to correct order via long-press.

**Pass criteria met:** S2 (threshold raise) + S10 (7-day undo for money-bearing) handle this. The claim card is the safety net.

**Edge case:** if conf had been 0.93 (above threshold), it would auto-link, signature fire, merchant return Day 8 finds it linked wrong, **soft-undo expired**. **Mitigation:** the 0.92 threshold was specifically calibrated to make this near-impossible. But if it does happen: hard-undo (manual edit) is always available; the audit trail in `user_corrections` JSONB documents the change.

**Cycle 30 should spec hard-undo UX** for the post-window case.

---

## Aggregate verdict

| Status | Count |
|---|---|
| PASS | 7 |
| TIGHTEN | 4 |
| SPIKE | 1 |
| DEFER | 0 |

**4 TIGHTENS for cycle 30 ARCHITECTURE.md to incorporate:**

1. **S2:** yellow-chip peek extended 2s→5s when candidate name is Levenshtein-1 from another known name (two-similar-names trap)
2. **S5/S4:** voice notes with extract_conf < 0.3 + no money/customer words auto-archived after 30s; single-tap on money-bearing Now pins requires 200ms sustain; optional toddler-mode biometric
3. **S9:** multi-candidate disambiguation cards are sticky (not auto-dismissed); 2-second peek only for single-candidate
4. **VoiceOver queue:** announcement queue with 1s gap; 3+ pending collapses to "N more orders filed"

**1 SPIKE for Phase 0 / pre-Wave-2:**

- `sahabat-ai-bandung-bench.ts` — Wave-2 launch gate

**0 DEFERS.** All scenarios resolve within the contract.

---

## Failure modes the contract does NOT yet handle

These are deferred to **post-launch hardening** (not Day 1, not Wave 2):

1. **Multi-device** — merchant uses phone + tablet. Diary sync across devices via Supabase Realtime. CRDT not needed (single-merchant), but device-conflict resolution UX. **Defer to Phase 4.**
2. **Account recovery / device-loss** — Whisper-tiny audio is on-device; if device lost, transcripts on-server but raw audio not. **Defer to Phase 4** (auto-cloud-backup for Pro tier).
3. **Multi-staff** — `staff` table exists in DB (migration 079). Boundary contract assumes single user. **Defer to Phase 3** when multi-outlet ships.
4. **Dispute / chargeback flow** — Billplz dispute, customer claims they didn't pay. **Defer to Pro tier Phase 3.**
5. **Tax-event side effects** — when SST-eligible invoice is auto-generated from a paid order, what's the timing? **Defer to Pro tier flow; not in Day-1 contract.**

---

## Phase 0 spike list (carry to cycle 30 + roadmap)

| Spike | Owner | Gate |
|---|---|---|
| `payment-notif-corpus.ts` (12 banks/wallets, 1000+ samples) | Phase 0 ID | Wave 2 launch |
| `sahabat-ai-bandung-bench.ts` (200 utterances) | Phase 0 ID | Wave 2 launch |
| `whisper-burst-rate.ts` (8 LLM calls in 5s) | Phase 0 MY | Phase 1 launch |
| `notification-listener-heartbeat-test.ts` (MIUI/ColorOS/OneUI) | Phase 0 MY | Phase 1 launch |
| `opus-decode-latency.ts` (Redmi Note 12 baseline) | Phase 0 MY | Phase 1 launch |
| `live-activity-rush-mode-spike.ts` (iOS 17, webhook→push) | Phase 0 MY | Wave 2 Pro launch |
| `id-self-reference-disambig.ts` (50 utterances) | Phase 0 ID | Wave 2 launch |
| `id-currency-locale-fence.ts` (100 mixed utterances) | Phase 0 ID | Wave 2 launch |

8 spikes total. 5 block Phase 1 MY launch; 3 block Wave 2 ID launch.

---

## Score after hardening

| Persona | Cycle 26 | Cycle 28 (projected) | Cycle 29 (after tightens) |
|---|---|---|---|
| Aisyah | 4.3 | 9.0 | 9.3 |
| Sari | 5.75 | 9.0 | 9.0 (gated on SPIKE) |
| Jobs | 6.0 | 9.0 | 9.5 |
| Norman | 5.7 | 9.0 | 9.5 |
| **Average** | **5.4** | **9.0** | **9.3** |

Cycle 30 ARCHITECTURE.md folds: cycle 21 (UX surface), cycle 24 (payment), cycle 25 (workflow), cycle 28 (boundary contract), cycle 29 (4 tightens + 8 Phase 0 spikes).
