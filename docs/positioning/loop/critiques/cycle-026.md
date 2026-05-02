# Cycle 026 — Consolidated INTEGRATION_RED_TEAM

> 4 personas tested cycles 21 (UX) + 24 (Payment) + 25 (Workflow) as ONE seamless experience. Each cycle internally self-scored 9.5–10. Integration scored **5.4/10 average**. The seams are the product.

## Aggregate verdict

| Persona | Integration score | Sev ≥7 issues |
|---|---|---|
| Aisyah (MY) | 4.3/10 | 12 |
| Sari (ID) | 5.75/10 | 16 |
| Jobs | 6.0/10 | 4 (deep) |
| Norman | 5.7/10 | 10 |

**Average: ~5.4/10.** Three cycles each declared themselves seamless; the seams between them are where the user falls through.

## Top sev-9 integration boundary issues (emerged ONLY in cross-cycle review)

### 1. Sync ordering race — capture/extract/reconcile collide

> Sources: Aisyah scenario C, Norman Seam 1.

Voice utterance at t=0; DANA notif at t=2s; Whisper finishes t=11s; LLM extract finishes t=13s. Reconciliation engine queries pending orders at t=2.1s and finds nothing because the order is still raw audio in IDB. Result: **two diary entries for one Rp 25,000, two 3-sensory signatures, no dedup logic in any cycle.**

> Cycle 25 I2 loops `voice_notes` for sync but doesn't spec ordering vs `payment_events` from local cache. Payment processed before its order is extracted = **unmatched forever** (no second reconciliation pass after extract completes).

**Fix direction (cycle 28):** Specify second-pass reconciliation hook on `voice_notes.llm_processed_at` set; orphan `payment_events` queued for re-match for 60 minutes; transaction-level dedup using a content hash + timestamp window.

### 2. Confidence multiplication — error compounding invisible to user

> Source: Norman Seam 2.

Extraction confidence `0.85` × match confidence `0.85` = `0.72` effective composite. But the user sees one green chip because the *match* threshold passed and rendered the LLM's own yellow-chip ask invisible. **The Aishah/Aisyah Levenshtein-1 case auto-links because two real names cross an arithmetic threshold** — the extraction was already low-confidence, but the match swallowed it.

**Fix direction (cycle 28):** Composite confidence = `min(extract_conf, match_conf)`. UI chip reflects the minimum, not the maximum. If either is yellow, the merged surface is yellow.

### 3. Schema-vs-narrative split — payment_events breaks diary-IS-DB

> Source: Norman Seam 3.

Cycle 25 §E1 introduces `payment_events` table. Cycle 21 commits to diary-IS-DB. Cycle 24 narratively claims to honor diary-IS-DB (line 244: "payment events are voice_notes too" → 10/10). All three are consistent within their own framing; **the conflict only appears when read together**. Engineering will build `payment_events` as a separate table; UI will surface them as diary entries; refactor pressure mounts.

**Fix direction (cycle 28):** Either (a) collapse `payment_events` into `voice_notes` with `source_input='payment_notification'` and a money-payload JSONB, or (b) introduce a unified `diary_entries` super-table. Decision must be made before cycle 30 ARCHITECTURE.md.

### 4. WA voice note .opus capture path unspec'd

> Source: Aisyah scenario A.

Cycle 24 path 4 covers screenshot images. Cycle 25 A2 says "text or image". Neither covers **forwarded WA audio** — which is the most common Aisyah input (customer voice-notes order in WA → Aisyah long-presses → Share → Tokoflow). The opus codec, Share Extension audio decoder, and Whisper input pipeline for forwarded audio are all undefined.

**Fix direction (cycle 28):** Add explicit Path 6 (forwarded WA voice note → Share Sheet → audio decode → Whisper → existing extract pipeline). Test on Android Share Intent + iOS Share Extension.

### 5. Voice correction target resolution ambiguous

> Source: Aisyah scenario B.

Cycle 25 H1 detects "salah" prefix. But when user says "Pak Ariff RM dua puluh lima" without an explicit "yang tadi" anchor, **target order is unresolvable when 3 pending orders mention "Pak Ariff"**. Spec doesn't say: most-recent? most-recent-with-amount-mismatch? prompt user?

**Fix direction (cycle 28):** Specify resolution heuristic: (1) prefer most recent <30min voice note matching speaker+entity, (2) if multiple, surface a 2-second peek card with top-3 candidates and tap-to-pick, (3) if ambiguous after 2s, default to "no-op + show last 3 mentions" rather than wrong-patch.

### 6. WA receipt deeplink doesn't propagate corrections

> Source: Aisyah scenario B.

If receipt for RM 250 was already auto-drafted (or worse, sent) before correction to RM 25, customer-side trust breaks: customer received "RM 250 invoice" link, then sees corrected "RM 25" version. **Audit trail is opaque to customer.**

**Fix direction (cycle 28):** Auto-draft NEVER auto-sends (already cycle 25 G1 promise — verify). On correction within 24h, mark draft as STALE and force merchant to re-confirm before any send. If sent before correction, generate explicit "correction notice" message.

### 7. Cascading correction integrity — payment_events not re-matched on voice correction

> Source: Sari scenario B.

Cycle 25 H1 patches the `voice_notes` row but doesn't re-cascade through linked `payment_events`. Sari→Saridah correction leaves the Rp 150k DANA payment linked to the wrong-name order — the link was made when the order said "Sari".

**Fix direction (cycle 28):** Voice correction triggers a cascade: re-evaluate match score for any `payment_event` linked to this voice note. If new score < threshold, demote to claim card. If still ≥0.85, keep linked.

### 8. ID payment regex coverage <40% Day 1

> Source: Sari scenario A.

Cycle 24 names BCA only for ID. Mandiri, BRI, BNI, BTN, Jago, Jenius, Permata, DANA, OVO, GoPay, ShopeePay, LinkAja all absent. **Phase 0 spike must collect 1000+ real notif samples across 5 Bandung mompreneur × 30 days before regex confidence claim is honest.**

**Fix direction (cycle 28+phase 0):** Add Phase 0 spike `payment-notif-corpus.ts`. Build 12-bank/wallet regex matrix. Target ≥85% accuracy across top 8 ID banks/wallets before Wave 2 launch.

### 9. Mechanism asymmetry narrative is half-true

> Source: Sari critique.

Cycle 16/24 narrative "BI regulates QRIS templates → ID auto-classify higher accuracy" is misleading. **BI regulates backend ISO 8583 messages, not consumer app push notification copy.** DANA, GoPay, OVO, BCA Mobile, Mandiri Livin' all render their own copy. Engineering effort for ID Day-1 coverage = 3× MY, not less.

**Fix direction (cycle 28):** Rewrite Demo #2 honestly. ID is **differently complex, not easier**. The asymmetry sells the merchant on the felt experience (one QR, all wallets), not on engineering ease.

## Theme convergence (4 personas, 1 voice)

### A. Sensory ceremony saturation under load

All 4 personas flagged this independently:
- Aisyah: 5 chimes in 5 seconds at pasar = social embarrassment
- Sari: 8× signatures in 30 min during Lebaran rush = accidental Pavlov gamification (anti-anxiety regression)
- Jobs: 6 chimes in 90 seconds at lunch rush = ceremony becomes noise
- Norman: 6 voice notes draining offline queue = 6 chimes + 3 claim cards in 6 seconds

**Fix direction (cycle 28):** Scene-aware suppression. Lunch rush detection (>3 inputs in 5 minutes) → collapse to single summary signature on completion. Offline-drain → ONE batch-summary signature, not N. Pasar/public-context signal (long quiet then burst) → ducked audio + visual-only.

### B. Gesture fragmentation across surfaces

- Jobs: 9 distinct tap/long-press affordances vs iPhone 1.0's three.
- Norman: 6 different gestures for "claim payment" across lock-screen / Now pin / iOS share / NotifListener card / offline-sync card / WA-screenshot share.
- Aisyah: WA voice note path missing entirely (mental-model gap).

**Fix direction (cycle 28):** Reduce to 3 primary gestures: **single-tap (claim/confirm), long-press (correct/disambiguate), share-from-anywhere (any external content)**. All payment surfaces use single-tap. Document the gesture grammar as a top-of-spec contract.

### C. Engineering vocab leakage risk

Norman flagged: cycle 25 names like Whisper-tiny, IDB, "🛜 sync pending", optimistic UI, eventually-consistent. Each is one PR away from leaking into copy/error states/settings.

**Fix direction (cycle 28+30):** CI lint rule. Forbidden user-facing strings list: `["Whisper", "STT", "LLM", "IDB", "optimistic", "eventually-consistent", "queue", "sync pending"]`. User-facing must use natural-language equivalents from `lib/copy/index.ts`.

### D. iOS as structural seam, not soft cost

- Jobs: "iOS = degraded product" — manual share per payment is a structural seam, reposition pricing or build Live Activity properly.
- Sari: many ID mompreneur use iPhone (status symbol). iOS lower magic = customer-facing limitation.
- Norman: text input fix from cycle 22 partially regressed; numpad-on-money-chip missing.

**Fix direction (cycle 28+29):** Either (a) build iOS Live Activities path for payment claim (Dynamic Island shows incoming claim, tap to confirm — closer to Android NotificationListener parity), or (b) honest iOS pricing tier (free, lower magic acknowledged). Decision needed for cycle 30 spec.

### E. ID treated as locale-swap, not differently complex

Sari pushed back hard: "Aldi has been over-anchoring to MY." Bahasa Bandung casual vocab, Sahabat-AI accuracy on Bandung dialect, Mandiri Livin'/Jago/Jenius notif diversity, self-reference disambig (Sari/Saridah), "Bukan Saya / Reject foreign payment" missing.

**Fix direction (cycle 28+29):** ID-specific spike list — Sahabat-AI Bandung-dialect benchmark, ID payment notif corpus, customer_name == merchant.own_name guard, ID currency post-extract guard.

## Other sev-7+ findings (not duplicated above)

| # | Source | Issue | Fix direction |
|---|---|---|---|
| 10 | Norman | NotificationListener silent revocation (MIUI battery-saver after Day 47) — no diagnostic surface | Heartbeat: every 7 days, app self-tests by recognizing its own test-payload notif. If 2 consecutive misses → coach-mark "your phone may be killing notifications" with re-permission flow |
| 11 | Norman | Composed undo undefined | Define transaction-level undo: voice "tarik balik" affects last 60s of state changes including any auto-matched payment events |
| 12 | Aisyah + Norman | Honorific-prefix name match breaks Levenshtein ("Pak Lim" vs "LIM CHEE KEONG") | Token-first-name comparison + honorific-strip preprocessing |
| 13 | Sari | Self-reference disambig (`customer_name == merchant.own_name`) | Hardcoded force-disambig: if extracted customer name matches merchant.profile.name, surface 1-tap "kamu maksud aing/saya kah?" |
| 14 | Sari | Currency post-extract guard missing — "RM 25" extracted in ID app = corrupt DB | Locale-fence: if `profile.country='ID'` and currency token is `RM` (or vice versa), reject extract + ask correction |
| 15 | Aisyah | Now-card tap = scroll-to-source (cycle 22 fix #2 not propagated to cycle 21) | Re-confirm cycle 22 fix is in cycle 21 spec; inline claim/mark-paid action ON the Now card |
| 16 | Sari | No "Bukan Saya / Reject foreign payment" action for typo-transfer scenario | Add reject-action to claim card; logs to `payment_events.status='rejected_not_mine'` |
| 17 | Aisyah | Sync state collapsed into single "🛜 sync pending" — no granular state | Three states: capturing, extracting, syncing. Tiny progress dots, not spinner |
| 18 | Norman | Mini-signature too subtle for split attention | Test multi-modal salience under split-attention; consider stronger haptic for money-events vs ambient-events |

## Jobs's 4 deliverables (cycle-defining)

1. **Delete this week:** Phase D2 money-confirm pulse (cycle 25 §D2) — the 2-second visual confirm is gear-leakage, not magic.
2. **Make iconic:** the *first* voice-note of each day. Decay signature on subsequent. Inverse of current spec.
3. **The "wait, what?" seam:** auto-claim threshold 0.85 + 24h undo creates a 3-day-later wrong-customer discovery window. Tighten threshold to 0.95 OR extend undo to 7 days.
4. **9→10 lateral move:** **delete the home screen entirely.** Lock-widget IS the product. Main app is for inspection, not daily use. Collapses gesture-economy from ~80 to ~25 across 3 days.

## What survives integration unchanged

- **Diary-IS-DB stance** (after schema unification fix #3) — all 4 personas
- **24h soft-undo** (after composed-undo fix #11) — all 4 personas
- **Optimistic UI commitment** (Phase B optimistic at 3-7s) — all 4 personas
- **Refuse-list compliance on WA receipts** — Aisyah explicit defend
- **Invisible Pro-tier graduation** (no in-app upsell pressure) — Aisyah, Sari, Norman
- **Phase H corrections + Phase I offline** — Jobs explicit "preserve as inviolable"
- **Cash voice path (Path 1)** — Aisyah explicit defend (zero permission, universal)

## Implications for cycles 27–30

### Cycle 27 UX_RESEARCH must investigate

1. **iOS Live Activities + Dynamic Island** for payment-claim (close iOS magic gap)
2. **Material You (Android 14+) adaptive theming** for Now-pin scene-awareness
3. **Optimistic UI patterns 2026** — how Linear, Notion, Cash App handle eventually-consistent state without spinners or jank
4. **Multi-sensory salience research** — when does ceremony become noise (Apple HIG + Material 3 motion guidelines)
5. **Cross-app share-target patterns 2026** — iOS 18 + Android 15 advances since cycle 22
6. **Offline sync UX 2026** — Linear's local-first sync, Figma's CRDT-style merge, what's appropriate here

### Cycle 28 SEAMLESS_SYNTHESIZE must produce

A **boundary contract document** — not new features, but seam-bound contracts:

1. **Schema unification decision** — `voice_notes` super-table OR `diary_entries` super-table OR `payment_events` separate-but-mirrored
2. **Confidence composition rule** — `min()` not `max()`; UI reflects minimum
3. **Sync ordering protocol** — second-pass reconciliation, dedup hash, orphan re-match window
4. **Gesture grammar** — 3 primary gestures, documented top-of-spec
5. **Sensory grammar** — ceremony decay rules, scene-aware suppression, batch-summary
6. **Engineering-vocab lint** — forbidden-string CI check
7. **iOS magic-parity decision** — Live Activities OR honest pricing-tier
8. **ID-specific architectural commitments** — payment notif corpus, Sahabat-AI bench, locale-fence
9. **Correction cascade rules** — voice correction → re-evaluate matches
10. **Composed undo contract** — transaction-level, 60s window for state-change bundle

### Cycle 29 ARCH_CONSTRAINT_HARDEN must validate

- Sync race scenarios (capture-payment-correct interleavings)
- Sensory-storm scenarios (offline-drain, lunch rush, Lebaran rush)
- iOS Live Activities feasibility spike (or pricing-tier reposition)
- ID payment notif corpus stub (Phase 0 carry-forward)
- Composed undo state machine
- Accessibility regression (text input on money-chip, screen-reader 6-second flow narration)

### Cycle 30 ARCHITECTURE.md must include

- The boundary contract as Section 1 (BEFORE component specs)
- Schema unification decision as Section 2
- Per-cycle specs (21, 24, 25 refined) as Sections 3-5
- Failure-mode matrix as Section 6
- Phase 0 spike list as Section 7
- Engineering-vocab lint rules as appendix

## Aldi's verdict

**No promote-to-final on any of cycles 21/24/25.** The cycles individually pass; the integration fails. Cycle 28 must be a 4th document — the boundary contract — that none of cycles 21/24/25 wrote because each owned only their slice.

**Sari's closing line preserved here as a reminder:** *"Aing in — kalo cycle 28 fix 16 ini, aing bakal demo CatatOrder ke ibu komplek Bandung. Tanpa fix, aing gak bakal demo."*
