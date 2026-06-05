# Cycle 026 — Norman INTEGRATION_RED_TEAM (UX-C × Payment × Workflow)

> Reviewer: Don Norman lens (DOET + *Living with Complexity*). This is **not** a within-cycle review. The question is: when cycles 21, 24, and 25 are unioned into one product, does the seam hold, or does the user trip on the boundary?
>
> Verdict up front: each cycle is internally coherent and individually scores 9–10 on its own scoreboard. **Integrated, the system scores 5.7/10 average across heuristics.** Three cycles each declared themselves seamless; the seams between them are where the user falls through.

---

## Integration-level scorecard

| # | Heuristic (at integration) | Score | Notes |
|---|---|---|---|
| 1 | Visibility of system status across boundaries | 4 | Multiple invisible states between Phase A capture (cycle 25) and Path 2 auto-claim (cycle 24). |
| 2 | Match real-world (no engineering vocab leak) | 6 | Schema names + `source_input` enum risk leaking; `pending_sync` chip tolerable but "🛜 sync pending" iconography is dev-coded. |
| 3 | User control & freedom (undo across cycles) | 4 | 24h soft-undo defined per cycle but **composition undefined**. Voice undo cannot reverse an auto-claim cleanly. |
| 4 | Consistency & standards across surfaces | 3 | Five different gestures for "claim payment" (lock-screen, Now-pin, share-extension, notif-listener auto, voice-mention). |
| 5 | Error prevention vs error correction (compounding) | 4 | Extraction confidence × match confidence are multiplied silently; user sees a single chip. |
| 6 | Recognition rather than recall (cross-mode) | 6 | Mic FAB + share-target + auto-claim each have separate affordances; nothing teaches the user the family. |
| 7 | Flexibility novice → power | 7 | Voice-first scales; share-target adds without forcing. Reasonable. |
| 8 | Aesthetic/minimalist at boundary | 5 | Sum of all chips, sounds, signatures, sync indicators is dense. Density is invisible per-cycle, visible in the union. |
| 9 | Recognize/diagnose/recover (boundary errors) | 3 | NotificationListener silent failure has no surfaced error. Whisper offline + payment auto-claim race is undefined. |
| 10 | Help & documentation (cross-cycle) | 4 | Coach-marks declared in cycle 22 only for share-target. No cross-cycle coach-mark plan. |
| A | Accessibility (sev-9 from cycle 22) | 6 | Text input *was* added (cycle 25 §A4), but as escape only — not first-class. Numpad on chip-tap absent. Screen-reader sequence undefined. |
| M | Mental-model coherence | 5 | Diary-IS-DB *competes* with payment-events-table mental object. Schema makes them sister tables, UI claims they're the same diary. |

**Integration average: 4.75/10.** Each cycle's claimed avg (9.875 / 9.5 / 10.0) is **misleading at the seam.**

---

## The three seams that fail the heuristics

### Seam 1 — Capture → Extract → Reconciliation (cycle 25 §A–E meets cycle 24 reconciliation engine)

**The race condition that nobody specified.**

Trace this scenario, step by step, against the documented timings:

1. **t=0** Aisyah taps mic FAB (cycle 25 §A1). Says: *"Aishah ambil 5 nasi lemak, tunai, RM 25"*. 4-second utterance.
2. **t=4s** Release. Audio captured (cycle 25 §A1 budget: <50ms).
3. **t=4s–11s** Whisper-tiny on-device runs (cycle 25 §B1 budget: 3–7s). Optimistic transcript shown at t≈11s.
4. **t=11s–13s** Network round-trip + Gemini Flash Lite extraction (cycle 25 §C3 budget: <3s typical, 5s hard limit). Entity card materializes.
5. **t=13s** 3-sensory signature fires (cycle 25 §F).

Now, assume Aishah pays QRIS *during the utterance*. DANA notification posts to Aisyah's phone at t=2s.

6. **t=2s** NotificationListener captures (cycle 24 Path 2). Pattern matcher runs <100ms (cycle 24 §249).
7. **t=2.1s** Reconciliation engine runs (cycle 24 lines 175–209). **Pending orders queryset does not yet contain the order being captured** — it lives only as raw audio in IndexedDB. Score against pending orders → no match → "surface_unmatched" path → Now-card "claim Aishah RM 25?" appears.
8. **t=13s** Voice extraction completes; cash-payment entity persists. Order is created with `payment.method=cash, amount=RM 25, status=paid`. **Second 3-sensory signature fires.**

**The user now sees**: one Now-card claim for an unmatched RM 25 (path 2) AND one freshly-filed cash-paid order for RM 25 (path 1 / 5). The card claims the customer paid QRIS *and* cash. The same RM 25 paid twice in the diary. **No deduplication logic exists in either spec.**

Severity **9**. This is not a hypothetical — voice utterances commonly start as the customer is mid-payment. Cycle 24's catch-all path 5 ("voice-mention") was meant exactly for this case but the reconciliation engine never reads the voice extraction's own payment claim before deciding if the notification is duplicate.

**Fix direction:**
- The reconciliation engine must check for `payment_events` AND for in-flight extractions (voice_notes with `llm_processed_at IS NULL` in last 60s) before deciding "auto_link" vs "surface".
- Add a `payment_events.dedup_key` = `(amount, sender_canonical, ±2min window)`. Inserts that violate the key get marked `status='deduped_into:<id>'` and don't trigger a second signature.
- The 3-sensory signature must fire **at most once per logical payment**, not once per source path.

---

### Seam 2 — Confidence compounds silently (cycle 25 §C2 × cycle 24 reconciliation)

Cycle 25 §C2 emits a per-field confidence (e.g., `customer_confidence: 0.92`, `confidence_overall: 0.90`). Cycle 24 line 203 thresholds the *match score* at 0.85. Both numbers exist on the screen in the user's mental model as one chip — green/yellow/red.

**The compounding the spec hides:**

> Voice extraction confidence 0.85 (yellow per §D, "1-tap confirm")
> × match-confidence on amount-and-name 0.85 (auto-link per cycle 24 line 203)
> = effective end-to-end correctness ≈ 0.72

The user sees a single 🟢 because the *match* threshold passed. But the *extraction* threshold was yellow and would have asked her to confirm. The auto-link rendered the confirm step invisible. She never saw the chip turn yellow because the moment the payment matched, the card resolved green.

This is the "Aishah ≈ Aisyah" example from the cycle 24 fuzzy-match spec (Levenshtein ratio ~0.94, sim*0.3 = 0.28; combined with 0.5 amount + 0.2 voice-mention = score 0.98 auto-link). Aisyah-the-distant-customer just got billed/credited as Aishah-the-frequent-customer because Levenshtein-1 between two real human names crossed an arithmetic threshold.

Severity **8**.

**Fix direction:**
- Composed confidence rule: chip color = `min(extraction_confidence, match_confidence)`, not `max` and not the latest.
- For payment auto-link, **require BOTH extraction ≥0.85 AND match ≥0.85** before silent link. Otherwise surface as 🟡 with explicit "Aishah or Aisyah?" disambiguation that cycle 25 §D1 already specifies.
- Money-touching events (cycle 25 §D2's 2-second confirm) should be governed by composed confidence, not just LLM confidence.

---

### Seam 3 — Offline → online drain meets payment auto-claim (cycle 25 §I × cycle 24 Path 2)

Cycle 25 §I2 specifies sync-on-reconnect: pending voice_notes POST in batches; "trigger 3-sensory signature in batched sequence (one signature per second, throttled)".

Now compose: Aisyah was offline 4 hours during a market run. She captured 6 voice notes. Meanwhile DANA notifications arrived (NotificationListenerService still works offline — it observes local notifications, doesn't need network) and were stored as pending `payment_events`.

When she reconnects:

1. Six voice_notes drain to /api/extract sequentially (cycle 25 §I2).
2. Each completes → orders materialize → reconciliation runs.
3. Six payment_events from the queue try to match against the *now-existing* orders.
4. Cycle 24's 48h reconciliation window means matches *will* fire — but **in arrival order**, not in causal order. The DANA notification from 11:32 may match against the 11:45 voice utterance because it was the first to score >0.85.

The signature throttle ("one per second") fires six chimes in six seconds while six green chips appear, plus three Now-card claim cards for un-matched leftovers, plus one or two duplicate detections (seam 1) the user must reject.

For Aisyah this is **worse than the spinner cycle 25 deleted**. It is sensory chaos disguised as optimism. *Living with Complexity* would call this complexity that is *visible to the user without being legible to them.*

Severity **8**.

**Fix direction:**
- During offline-drain, suppress the per-event signature; render a single "filed 6 captures, matched 4 payments" summary card with one signature event.
- Provide an explicit "draining…" indicator (cycle 25's §I3 "no spinner" rule needs an exception for batched drain — this is the legitimate use of progressive disclosure).
- Sort the drain queue by `audio_capture_timestamp`, not by `enqueued_at`, so reconciliation runs in causal order.

---

## Other severity ≥7 integration findings

### F4 — Five gestures for one intent ("claim payment")

Compositing all three docs:

| Surface | Gesture | Doc |
|---|---|---|
| Lock-screen Now-card | tap CLAIM (cycle 21 line 114) | UX |
| In-app Now-pin | tap claim → (cycle 21 line 84) | UX |
| iOS Share-extension | long-press notif → Share → app-pick (cycle 24 §Path 3 line 119) | Payment |
| Android auto-claim | *no gesture* — silent (cycle 24 §Path 2 line 86) | Payment |
| Voice-mention | utter "Pak Lee dah bayar transfer Maybank" (cycle 24 §Path 5 line 165) | Payment |
| WA-screenshot share | long-press WA msg → Share → app (cycle 24 §Path 4 line 134) | Payment |

That is **six** entry points for the same logical intent. Cycle 22 fix #11 promised "both = single tap" for lock-screen and in-app. The integration broke that promise the moment iOS share-extension and WA-screenshot share were added.

Jakob's Law: users will mentally model "to claim a payment, I…" as one of these and forget the others exist. Power users learn 2; novices learn 1; share-extension goes unused (cycle 22 sev-7 about discovery — still unfixed at integration).

Severity **8**.

**Fix direction:**
- One **canonical** gesture: the FAB or Now-card tap. All other paths are *automatic* (auto-claim) or *recovery* (voice "Pak Lee dah bayar" works because voice always works).
- iOS share-extension and WA-screenshot share are *legitimate* paths but should not be *taught* as primary. Surface them as suggestions only after a missed-claim event ("Lain kali boleh share terus dari WhatsApp — lagi laju").
- Coach-mark policy (heuristic 10): the same coach-mark machinery shipped for share-target (cycle 22 fix #13) must extend to all secondary paths. There is no plan for this in any of the three docs.

---

### F5 — `payment_events` table competes with diary-IS-DB mental model

Cycle 25 §E1 creates a `payment_events` table parallel to `voice_notes`. Cycle 24 line 244 says "payment events are voice_notes too" (Diary 10/10 score). The schema disagrees with the score.

Two separate insertions: voice → `voice_notes`; notification → `payment_events`. They are joined retroactively via `matched_order_id`. This is a perfectly normal database design **and a perfectly broken mental model**, because:

- The user's diary in the feed is a chronological merge of two source tables.
- Reconciliation undo (line 218) reverts a `payment_event` row → does the diary entry disappear, mutate, or stay with a strikethrough?
- Voice "tarik balik" (cycle 24 line 222) targets "last payment" — but if last payment came via notif-listener, was it ever a voice_note? If not, what does undo of a non-voice event sound like?

Severity **8** (mental-model competition + undo ambiguity).

**Fix direction:**
- Make `voice_notes` the canonical diary entity. NotificationListener captures should INSERT a `voice_notes` row with `source_input='notification_listener'` and `transcript` = the synthesized natural-language sentence ("DANA: Lina paid Rp 240,000 via QRIS — 09:30"). Then `payment_events` rows always have `voice_note_id`.
- Undo deletes the diary entry visibly, with the same animation as voice-corrections (§H2's strikethrough).
- This makes Path 2 (auto-claim) honest at the schema level: it's still a "filing", just one the merchant didn't speak aloud.

---

### F6 — Engineering vocabulary at risk of leaking

Cycle 25 is rich with terms that must never reach the user. Audit:

| Term | Document location | Leak risk |
|---|---|---|
| "STT" | §B title and budget tables | Settings copy if not careful. |
| "LLM extract" | §C title, §D title | Same — settings/error copy. |
| "Optimistic UI" | §A1 budget, scoreboard | Internal only, low risk. |
| "Eventually consistent" | implicit in §I | If error copy says "queued, will sync" it's fine. If it says "eventually consistent" — fail. |
| "IDB queue" / "IndexedDB" | §I1 | Low risk if storage failure copy uses "phone storage full". |
| `source_input` enum values | §E1 line 222 | These are dev-only; UI must never echo them. |
| "sync pending" with `🛜` | §I3 | Network-glyph icon is dev convention. Use a soft phrase: "akan terupload bila ada signal." |
| "confidence_chip" | schema line 220 | Color is fine; the word is not. |
| "Whisper-tiny / Whisper-large" | §B1, §B Quality fallback | User must never see model names. "Better accuracy on Pro" is fine. |

Severity **7** at integration (per-cycle severity is lower; the *probability* of leak grows as docs become engineering-implementable).

**Fix direction:**
- Extend `lib/copy/index.ts` (CLAUDE.md) with a "user-facing strings" lint rule. CI fails if any of these terms appear in `app/**/*.tsx` outside translation files.

---

### F7 — Screen reader sequence undefined for the canonical 6-second flow

VoiceOver/TalkBack must narrate the moment of Now-pin auto-claim + 2-second money-confirm + 3-sensory signature. None of the three docs sequence this.

Attempt at the canonical sequence (Aishah pays QRIS, voice-utterance just landed):

```
t=0    "Now section. Heading. Two pending."
t=1    "Aisyah RM 25 cash, paid 9:30 AM. Just filed. Button. Send WhatsApp receipt."
t=2    [LIVE region announces] "New entry. Lina Rp 240,000 QRIS. Pending claim. Two candidate orders. Double-tap to choose."
t=3    [HAPTIC fires; sound fires; LIVE region must NOT also re-announce]
t=4    [card resolves green if auto-link] LIVE: "Linked to order from 9:25. Done."
```

The signature firing during a screen-reader announcement is a **double-narration race** unless the live region is suppressed during the signature window. Severity **7**.

**Fix direction:**
- All sensory signatures must respect `prefers-reduced-motion` AND coordinate with `aria-live` regions (announce *or* signature, not both).
- For VoiceOver users: suppress haptic+sound, replace with a single spoken confirmation. The visual signature stays for sighted-VoiceOver users.

---

### F8 — Numpad-on-chip-tap (cycle 22 sev-8) absent in cycle 25

My cycle 22 critique #3 specified: *"tap-the-chip = inline numeric keypad (not full edit mode)"* for misparsed numbers. Cycle 25 §H "Voice corrections" describes voice-only correction. §A4 added text input but only for "Settings or as escape from yellow/red chip" — and only at the *initial-capture* stage. It does **not** specify tap-on-money-chip → numpad.

Severity **7** (regression of an already-flagged accessibility issue).

**Fix direction:**
- Add explicit affordance in cycle 25 §H: "Tap the money chip on any card → inline numpad opens, anchored to chip. Confirm = patch event same as voice correction."

---

### F9 — NotificationListener silent failure has no diagnostic surface

Cycle 24 lines 70–73 enumerate per-OEM grant flows. Nothing addresses: **what happens when Aisyah granted the permission on Day 1, then a Xiaomi MIUI update silently revoked it on Day 47?**

- No notifications arrive → no auto-claim → merchant assumes Tokoflow is broken or assumes customer didn't pay → reconciliation manual.
- The merchant has no way to discover the cause without leaving the app.

Severity **8** (silent-failure mode for the headline Android feature).

**Fix direction:**
- Heartbeat: every 24h, post a self-test notification (silent, marked "ignore") and check NotificationListenerService received it. If not received 3 days running → surface a Now-card "Auto-claim tak jalan. Tap untuk fix." with deeplink to OEM-specific permission screen.
- Same heartbeat detects MIUI battery-saver re-restriction.

---

### F10 — Composed undo chain is undefined

Cycle 24 §"24h soft-undo state machine" defines undo for `payment_event`. Cycle 25 §H defines voice corrections (patch in place) and §I defines offline-queued voice notes.

**Composed scenarios with no spec:**
- Voice utterance offline → queued → drained → matched payment → user says "tarik balik" — does undo target the voice_note or the payment_event? Both? In what order?
- Auto-claim links wrong order (Aishah/Aisyah). Voice "tarik balik last payment" — does it un-link only, or also delete the payment_event row?
- Customer screenshots and shares → Vision LLM extracts → fuzzy match auto-links → wrong customer. Undo via voice — does the share-extension record stay?

Severity **8**.

**Fix direction:**
- Single undo grammar: "tarik balik" reverts the *most recent diary entry* visible to the user. Undo is one diary-level operation, regardless of source path.
- If the diary entry is a composite (voice → order → payment in one transaction), undo reverses the whole transaction. Cycle 25 §E2 ("BEGIN; …COMMIT;") already groups them — undo must use the same grouping.

---

## Three integration-specific issues that within-cycle review would not catch

1. **The race in Seam 1** — only visible when capture-timing meets reconciliation-timing meets push-notification-timing. No single cycle's review surfaces it because each cycle assumes the others' outputs are already there.
2. **The confidence multiplication in Seam 2** — each cycle correctly defines its own confidence chip; integration is where two thresholds are silently composed and the user's mental model holds one chip while the system holds two. Within-cycle reviewers see "one chip is fine." Integration shows the chip is lying.
3. **The schema-vs-mental-model split in F5** — cycle 21 says "diary-IS-DB" (10/10). Cycle 25 schema creates `payment_events` as a separate table. Cycle 24 narrative claims "payment events are voice_notes too" (10/10). All three are consistent within their own framing; they conflict only when you read all three at once and notice the diary timeline is now a UNION query, not a single-table feed.

---

## Mental-model coherence — the core integration failure

The user has **one** mental model (diary-IS-DB) and **one** primary gesture (tap to capture, voice to describe).

The integrated system has:

- **Three primary gestures** (tap mic FAB, long-press lock-widget, long-press WA-msg → share). Cycle 22 fix #11 unified two; cycles 24–25 added two more.
- **Two diary entities** (`voice_notes` and `payment_events`), narratively claimed to be one.
- **Two confidence systems** (extraction confidence and match confidence), visually claimed to be one.
- **Three offline-online state representations** (audio in IDB, payment_event with `status='pending'`, sync indicator on card).

Each cycle, in isolation, simplifies. The integration multiplies. *Living with Complexity* §4 is precisely this: the user's mental model can absorb structural complexity if the structure is consistent across the surface; it cannot absorb *narrative complexity* where the same word ("diary", "payment", "claim") refers to different objects at different layers.

---

## Severity ≥7 ranked

| # | Issue | Sev | Fix anchor |
|---|---|---|---|
| 1 | Capture/extract/reconcile race → duplicate signature + duplicate payment row | 9 | Seam 1 |
| 2 | NotificationListener silent revocation | 8 | F9 |
| 3 | Composed extraction × match confidence shown as single chip | 8 | Seam 2 |
| 4 | Offline-drain sensory storm | 8 | Seam 3 |
| 5 | Six gestures for one intent ("claim") | 8 | F4 |
| 6 | `payment_events` ≠ diary at schema level | 8 | F5 |
| 7 | Composed undo chain undefined | 8 | F10 |
| 8 | Engineering vocab leak risk | 7 | F6 |
| 9 | Screen-reader sequence + signature double-narration | 7 | F7 |
| 10 | Numpad-on-chip-tap regression from cycle 22 | 7 | F8 |

**No new sev-9 ship-blockers were introduced** beyond cycle 22's text-input issue (now partially addressed in cycle 25 §A4, demoted to sev-7). **One new sev-9** at integration: Seam 1's race condition. Eight sev-8s. Two sev-7s.

---

## Recommendation

Do not promote any of cycles 21/24/25 as architecture-final. They are good drafts; integration has to write a fourth document — the **boundary contract** — that:

1. Defines a single canonical entity (`voice_notes`) and makes `payment_events` a *facet*, not a sibling.
2. Composes confidence with `min()`, not `max()`, for money-touching events.
3. Specifies the offline-drain visual contract (one summary signature, not N).
4. Reduces six gestures to one canonical + five recovery paths.
5. Resolves undo at the diary-transaction level, not the source-table level.
6. Adds a NotificationListener heartbeat with surfaced repair flow.
7. Wires accessibility (numpad-on-chip-tap, screen-reader sequence, signature suppression).
8. Lints user-facing strings against engineering vocabulary.

Until that boundary contract exists, the seamlessness scores from cycles 21 (9.875), 24 (9.5), and 25 (10.0) overstate the integrated experience. Honest integration score: **5.7/10**.

The architecture is recoverable. The recovery is a cycle, not a patch.
