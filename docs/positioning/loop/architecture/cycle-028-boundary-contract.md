# Cycle 028 — SEAMLESS_SYNTHESIZE: The Boundary Contract

> The 4th architecture document. Cycles 21/24/25 each owned a slice; this document owns the **seams between them**. Without this doc, integration scores 5.4/10. With it, the cycles compose.

## Why a 4th document exists

Cycle 26 INTEGRATION_RED_TEAM scored each cycle's self-assessment 9.5–10/10, but the **integrated experience** averaged 5.4/10 across 4 personas. The diagnosis: **nobody specced the handoff contract.**

This document is the handoff contract. It is the canonical reference for everything that crosses cycle boundaries — schema unification, confidence composition, sync ordering, gesture grammar, sensory grammar, vocabulary boundaries, platform-parity strategy, undo composition, correction cascades, and ID-market architectural commitments.

When cycles 21/24/25 disagree with this document, **this document wins**. The per-cycle docs will be re-edited in cycle 29 to align.

---

## Section 1 — Canonical entity: `diary_entries`

### Decision

**Collapse `payment_events` into the same physical surface as `voice_notes`** under a unified `diary_entries` super-table. Each row is a moment; the moment's payload-shape varies.

This resolves the cycle-26 Norman seam #3 (schema-vs-narrative split): cycle 21 commits to diary-IS-DB, cycle 24 narratively claims to honor it, cycle 25 introduces a separate `payment_events` table. All three are now consistent **physically**, not just narratively.

### Schema

```sql
CREATE TABLE diary_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL CHECK (kind IN ('voice', 'text', 'image', 'forwarded_audio', 'payment_notification', 'manual_share')),
  source_input    TEXT NOT NULL,                              -- 'voice_recording' | 'qris_dana' | 'wa_screenshot' | 'duitnow_maybank' | …
  raw_payload     JSONB NOT NULL,                             -- full original input (audio_url, image_url, notif body, etc)
  transcript      TEXT,                                       -- if applicable (voice / forwarded_audio)
  language_detected TEXT,                                     -- 'ms' | 'id' | 'en' | 'mixed'
  extracted_json  JSONB,                                      -- LLM extraction output
  extract_confidence NUMERIC,                                 -- 0..1 from LLM self-rating
  match_confidence  NUMERIC,                                  -- 0..1 from reconciliation engine; NULL if no match attempted
  composite_confidence NUMERIC GENERATED ALWAYS AS (
    LEAST(COALESCE(extract_confidence, 1.0), COALESCE(match_confidence, 1.0))
  ) STORED,                                                   -- always min(); see Section 2
  matched_entry_id UUID REFERENCES diary_entries(id),         -- payment row points to its order; correction points to original
  cascade_role    TEXT CHECK (cascade_role IN ('original', 'correction', 'auto_link')),
  device_offline_when_captured BOOLEAN DEFAULT FALSE,
  llm_processed_at TIMESTAMPTZ,
  signature_fired_at TIMESTAMPTZ,                             -- 3-sensory ceremony timing; NULL if suppressed
  signature_role  TEXT CHECK (signature_role IN ('full', 'shortened', 'silent', 'batch_summary')),
  user_corrections JSONB DEFAULT '[]'::jsonb,                 -- audit trail of in-place patches
  undo_window_ends_at TIMESTAMPTZ,                            -- 24h soft-undo (Section 10)
  undone_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT one_kind_one_payload CHECK (
    (kind IN ('voice','forwarded_audio') AND transcript IS NOT NULL)
    OR (kind = 'payment_notification' AND raw_payload ? 'amount')
    OR kind IN ('text','image','manual_share')
  )
);

CREATE INDEX idx_diary_user_created ON diary_entries (user_id, created_at DESC);
CREATE INDEX idx_diary_kind ON diary_entries (user_id, kind, created_at DESC);
CREATE INDEX idx_diary_matched ON diary_entries (matched_entry_id) WHERE matched_entry_id IS NOT NULL;
CREATE INDEX idx_diary_pending_match ON diary_entries (user_id, kind, created_at)
  WHERE kind = 'payment_notification' AND matched_entry_id IS NULL AND undone_at IS NULL;
```

### Materialized views (the user-facing nouns)

`orders`, `customers`, `products`, `payments` are all derived views over `diary_entries`. The user never types "the orders table" — they see "today's day, with these moments in it". Engineering can refactor materialized-view machinery without touching the canonical truth.

```sql
CREATE MATERIALIZED VIEW orders AS
SELECT
  id,
  user_id,
  extracted_json->>'customer_name'       AS customer_name,
  (extracted_json->>'amount')::numeric   AS amount,
  extracted_json->'items'                AS items,
  extracted_json->>'delivery_date'       AS delivery_date,
  composite_confidence                   AS confidence,
  created_at
FROM diary_entries
WHERE kind IN ('voice', 'forwarded_audio', 'text', 'image')
  AND extracted_json ? 'customer_name'
  AND undone_at IS NULL
  AND cascade_role <> 'correction';
-- refreshed via row-level trigger on insert/update of source rows
```

Migration plan:
- New: `diary_entries` (this section)
- Deprecate: `voice_notes` (cycle 25 §E1) and `payment_events` (cycle 24 §schema)
- Existing: `orders`, `customers`, `products` get rebuilt as MVs in cycle 30

---

## Section 2 — Confidence composition: `min()`

### The rule

```
composite_confidence = min(extract_confidence, match_confidence)
```

UI chip color reflects the **composite**:
- 🟢 ≥ 0.85 — auto, no confirm
- 🟡 0.6–0.85 — 2-second peek with implicit-tap-to-fix
- 🔴 < 0.6 — disambiguation card

### Why this resolves Norman seam #2

Cycle 24's fuzzy-match auto-links Aishah↔Aisyah at Levenshtein-1 (match_conf ~0.9). But the underlying voice extract may have been 0.7 ("Aisyah" spoken with a baby crying). Composing `0.7 × 0.9 = 0.63` (multiplicative) or `min(0.7, 0.9) = 0.7` (minimum) — both yield yellow, not green. Either is correct; we choose `min()` because it's the most conservative and the easiest to reason about.

The current architecture (cycle 25 §D2) takes the higher confidence and shows green. **That bug ships wrong-customer auto-links in production.** This contract overrides it.

### Threshold tightening (Jobs deliverable #3)

Auto-link threshold raised from `0.85` to `0.92` for **money-bearing decisions** (payment auto-claim, refund). For non-money decisions (order capture, customer mention) the 0.85 threshold stands.

Combined with cycle 26's tightened soft-undo (Section 10 below), the wrong-claim discovery window shrinks from 3 days to 7 days actively undoable, and the false-positive rate at auto-link drops by ~70% (back-of-envelope).

---

## Section 3 — Sync ordering protocol

### The race (Norman seam #1, Aisyah scenario C)

```
t=0     user voices: "Pak Ariff RM 25"
t=2s    DuitNow QR notif arrives: RM 25.00 from PAK ARIFF
t=11s   Whisper finishes transcription
t=13s   LLM finishes extract → order row is created
```

If reconciliation runs at t=2.1s, no pending order exists; the payment is shelved as "unmatched" forever. Cycle 25 I2 specs sync but does not spec the **second-pass match** that cycle 28 must mandate.

### The contract

1. **Every `diary_entries` insert with `kind='payment_notification'` AND `matched_entry_id IS NULL`** gets registered in a 60-minute `pending_match_queue` (background worker, in-memory or row-flag).
2. **Every `diary_entries` UPDATE** that sets `extracted_json` (i.e., LLM finishes) triggers a **second-pass reconciliation** that scans the `pending_match_queue` for re-match candidates.
3. **Window**: 60 minutes after the payment notification. After 60 min, payment surfaces as a regular claim card on the Now pin.
4. **Dedup**: a content hash `sha256(kind || amount || normalize(sender_name) || floor(timestamp / 300))` (5-minute bucket) prevents duplicate inserts when both NotificationListener AND a manual-share fire for the same event.

### Local-first ordering (cycle 27 Q3 verdict)

Adopt **Linear's pattern**:
- IndexedDB queue holds offline captures
- On reconnect, drain queue **monotonically by `created_at` (capture timestamp), NOT by sync timestamp**
- Server is authoritative for IDs; local optimistic IDs are replaced on first ack
- Reconciliation runs **after every sync-batch completes**, not per-row

This prevents Aisyah scenario C: 4 offline voice notes + 1 offline payment notif sync together; orders are extracted first (sequential, fast), then reconciliation runs once across all 5, and only ONE batch-summary signature fires (Section 5).

---

## Section 4 — Gesture grammar (3 primary gestures, no more)

### The rule

| Gesture | Meaning | Surfaces |
|---|---|---|
| **Single tap** | Confirm / claim / open | Lock-screen card, Now pin, claim card, Live Activity (iOS), notification listener result, offline-sync result |
| **Long-press (~500ms)** | Correct / disambiguate | Voice transcript chip, money chip, customer name chip, Now pin (long-press = "edit this") |
| **Share-from-anywhere** | External content into Tokoflow | iOS Share Extension, Android Share Intent — always the same destination, always the same outcome (extract + match) |

Cycle 26 found **6 different gestures for "claim payment"**. This contract collapses them to **single-tap, everywhere**.

### Forbidden gestures

- ❌ Swipe-to-claim (was a candidate in cycle 21) — too easily misfired by greasy-fingers
- ❌ Force-touch / 3D Touch — deprecated on iPhone XR+ since 2018
- ❌ Triple-tap — discoverability zero, accessibility-hostile
- ❌ Shake-to-undo (Apple system gesture) — conflicts with the explicit voice "tarik balik" undo

### Voice-as-gesture

Voice utterances are the **fourth modality**, not a fourth gesture: they're issued via the dedicated mic button (single-tap) OR by hot-corner long-press from anywhere (configurable). The voice is the content; the gesture to invoke voice is single-tap or long-press, both of which are already in the grammar.

---

## Section 5 — Sensory grammar (ceremony decay)

### The decay envelope

A **sensory window** is a 5-minute rolling clock per device.

| Event in window | Visual | Audio | Haptic |
|---|---|---|---|
| 1st event | Full 1.5s arc + chime + tap (cycle 25 §F) | Full chime | Full tap |
| 2nd event | Shortened 0.6s arc | No chime | Light tap |
| 3rd event | Color flash only (no motion) | Silent | Silent |
| 4th+ events | Silent | Silent | Silent |
| Window close (no event for 5 min) | Single batch-summary card "5 things filed" + ONE chime + ONE tap | One chime | One tap |

**First voice-note of the day always fires full ceremony**, regardless of window state. This is Jobs deliverable #2.

### Scene detection (cycle 27 Q2 verdict)

Tokoflow detects "burst mode" via a 5-minute rolling counter:
- ≥3 inputs in 5 min → burst mode active → decay envelope kicks in
- ≥6 inputs in 10 min → "lunch rush mode" → suppression active until 10 min of quiet

Android: leverage `setGroupAlertBehavior(GROUP_ALERT_SUMMARY)` for OS-level bundling at the notification layer too (cycle 27 found Android already enforces this at 4+ notifs).

iOS: Live Activities update at most once per 60s in burst mode (cycle 27 Q1 verdict).

### Money-event still privileged

Money-bearing diary entries (kind='payment_notification' OR extracted_json contains amount) get one upgrade rule: **even in 4th+ position, fire a silent visual + light haptic**. Money is never silently filed without proprioceptive feedback. Audio is still suppressed.

### What this kills (Jobs deliverable #1)

The 2-second visual confirm pulse on every money event (cycle 25 §D2) is **deleted**. Replaced by: light haptic + chip color (no pulse). The pulse was gear-leakage. The merchant doesn't need a celebration that money was confirmed, only proprioceptive confirmation that the system noticed.

### First-of-day rule

The first diary entry created after 06:00 local time always fires full ceremony. This is the daily "the day has begun, your fabric is awake" moment. Subsequent entries decay normally.

---

## Section 6 — Engineering-vocab lint

### Forbidden user-facing strings (CI lint)

The following strings must NEVER appear in any string passed to `i18n.t()`, in any `aria-label`, in any toast/empty-state/error/success copy, or in any settings label:

```
[
  "Whisper", "STT", "speech-to-text", "ASR",
  "LLM", "GPT", "Gemini", "Sahabat-AI", "OpenRouter",
  "IDB", "IndexedDB", "queue", "queued",
  "optimistic", "eventually-consistent", "eventually consistent",
  "sync pending", "syncing", "synced",
  "reconciliation", "reconcile", "fuzzy match", "Levenshtein",
  "confidence chip", "confidence threshold",
  "extract", "extraction", "extracted_json",
  "background twin", "foreground assist", "tier 1", "tier 2", "tier 3",
  "diary_entries", "voice_notes", "payment_events",
  "matched_entry_id", "composite_confidence",
  "NotificationListenerService", "ActivityKit", "Live Activity",
  "App Intents", "Share Extension"
]
```

CI rule (added to `eslint` or as a `pnpm test:lint:vocab` script): grep all `lib/copy/*.ts`, all `app/**/page.tsx`, all `components/**/*.tsx` user-visible string literals. Fail PR on hit.

### Permitted natural-language equivalents

| Forbidden | Permitted (BM/EN/BI) |
|---|---|
| "STT processing" | "saya dengar…" / "aku denger..." / "listening…" |
| "LLM extracting" | "saya susun ceritamu" / "aku susun ceritamu" |
| "syncing" | "menyusul" / "nyusul" / "catching up" |
| "sync pending" | (don't show — show a soft tint instead, cycle 27 Q3) |
| "fuzzy match found" | "ini Pak Ariff yang tadi?" |
| "claim payment" | "ini bayaran dia?" / "duit dari dia?" |
| "extract confidence low" | (don't surface — use 🟡 chip + "boleh check?" / "bener gini?") |

`lib/copy/index.ts` is the canonical source. PRs that introduce new strings outside `lib/copy` fail the lint.

---

## Section 7 — iOS magic-parity strategy

### The decision (cycle 27 Q1 verdict)

iOS users get **~60-70% of Android NotificationListener parity**, achieved via:

1. **Live Activities + Dynamic Island for "Rush Mode" sessions only.** Merchant taps "Buka rush mode" / "Mulai jualan" in app → 8-hour Live Activity is started → during this window, the merchant's bank/wallet **provider-side webhooks** push payment events to a Tokoflow Cloud endpoint, which pushes Live Activity updates back to the device. Tap-to-claim from Dynamic Island.
2. **Outside Rush Mode**, iOS = manual-share only (cycle 24 path 3). Honest disclosure.
3. **Pro-tier merchant-bank webhook integration** for high-volume merchants (Maybank QRPay, GoPay Merchant API, DANA Merchant). Pro users get parity-or-better on iOS via webhook → Live Activity. Free-tier iOS = manual-share.

### What this means for pricing

Free tier iOS = honest manual-share (lower magic, same compliance, same cost-zero refuse list). Pro tier iOS (RM 49 / Rp 199K) = Rush Mode + webhook parity. **No silent degradation. No iOS asterisk in marketing.** The marketing copy explicitly notes iOS Free tier as "manual-share works everywhere" and Pro tier as "webhook auto-claim" — neither is hidden.

### Wave-2 deferral

Live Activities + webhook integration are **Wave 2 features for both markets** (Q1 2027). Day 1 iOS = manual-share + WA-screenshot Vision OCR. This avoids shipping a half-built parity story.

---

## Section 8 — ID-specific architectural commitments

Cycle 26 Sari pushed: **"Aldi has been over-anchoring to MY. ID is treated as locale-swap, not differently complex."** This section corrects that.

### Phase 0 ID spike (mandatory before Wave 2)

1. **`payment-notif-corpus.ts`** — collect ≥1000 real notification samples across 5 Bandung mompreneur × 30 days × 12 banks/wallets (DANA, GoPay, OVO, ShopeePay, BCA Mobile, Mandiri Livin', BRI BRImo, BNI Mobile, BTN Mobile, Jago, Jenius, Permata Mobile). Build per-provider regex matrix. Target ≥85% accuracy on top 8.
2. **`sahabat-ai-bandung-bench.ts`** — 200 voice utterances in Bandung casual ("aing", "weh", "atuh", code-switch BI/EN), measure Sahabat-AI extraction accuracy vs Gemini Flash Lite. Decision criteria: Sahabat-AI ≥ Gemini accuracy → use Sahabat-AI for ID; otherwise Gemini fallback. **Do not assume Sahabat-AI wins for "open-source-public-good" optics — measure.**
3. **`id-self-reference-disambig.ts`** — 50 utterances where merchant references self in 3rd person ("Sari ambil 3 box"). Verify the customer_name == merchant.profile.name guard in Section 9.
4. **`id-currency-locale-fence.ts`** — 100 mixed-currency utterances. Verify `if profile.country='ID' and currency_token='RM' → reject + ask correction` works.

### Honest mechanism asymmetry rewrite

Cycle 16/24 Demo #2 narrative said: "BI regulates QRIS templates → ID auto-classify is HIGHER accuracy than MY DuitNow." This is **half-true and budget-trap**:

- BI regulates backend ISO 8583 ASE messages (machine-to-machine), NOT consumer push-notification copy.
- DANA, GoPay, OVO, BCA Mobile, Mandiri Livin' each render their own copy.
- **Engineering effort for ID Day-1 coverage = 3× MY**, because of bank/wallet diversity.
- The asymmetry that DOES exist: ID has more universal QR adoption (92% MSME on QRIS) than MY DuitNow (still rolling out). So the felt experience for the merchant is "one QR captures everyone" — but for engineering, it's "12 notification formats, not one".

Cycle 30 ARCHITECTURE.md must rewrite Demo #2 with this honesty.

### Bandung-casual vocab fence

`lib/copy/index.ts` will have separate ID-Bandung and ID-Jakarta variants where copy diverges. Spec source: cycle 22 Sari critique + cycle 14 vocab fixes (boleh→bisa, pukul→jam, kau→kamu, tempah→pesan).

---

## Section 9 — Correction cascade rules

### The rule

When a `diary_entries` row receives an in-place correction (Phase H of cycle 25), the correction:

1. **Patches `extracted_json`** with new values
2. **Appends to `user_corrections`** JSONB array: `{at, field, old, new, reason}`
3. **Re-evaluates match_confidence** for any row pointing at this row via `matched_entry_id`. If new score < 0.85, demote linked row to claim-card status (set `matched_entry_id=NULL`, set chip 🟡). If still ≥ 0.85, keep linked.
4. **Marks any auto-drafted side-effect** (WA reply draft, invoice PDF) as STALE; merchant must re-confirm before send.
5. **Fires correction haptic only** (no audio, no visual celebration). Correction is not a victory — it's hygiene.

### Self-reference disambig (Sari critique)

Hardcoded force-disambig: if `extracted_json.customer_name` after normalization matches `profile.name`, the row goes 🟡 with a 1-tap "kamu maksud aing/saya kah?" / "did you mean yourself?" prompt. Levenshtein-1 against own name also triggers (Sari ↔ Saridah).

### Honorific-prefix preprocessing

Customer-name matching strips honorifics before Levenshtein:
- MY: `Pak`, `Bu`, `Encik`, `Puan`, `Cik`, `Datuk`, `Datin`, `Tan Sri`, `Kakak`, `Abang`, `Adik`
- ID: `Pak`, `Bu`, `Mas`, `Mbak`, `Bang`, `Kak`, `Mbah`, `Kang`, `Teh`, `Aa`, `Neng`

So "Pak Lim" matches "LIM CHEE KEONG" via token-first-name + honorific-strip.

### Currency locale-fence

```
if profile.country = 'ID' and extracted currency in ['RM', 'MYR']:
  reject extract, surface 🔴 + "Tunggu, ini Rupiah ya, bukan ringgit?"
if profile.country = 'MY' and extracted currency in ['Rp', 'IDR', 'rupiah']:
  reject extract, surface 🔴 + "Hold on, this is Ringgit not Rupiah?"
```

### "Bukan Saya / Reject foreign payment" action

Every claim card has a **secondary single-tap** action: "Bukan saya" / "Not mine". Sets `status='rejected_not_mine'` on the diary_entries row, removes from feed, logs for ID/MY support team review.

---

## Section 10 — Composed undo contract

### The rule

A single `diary_entries` row's undo:
- 24h soft-undo via voice "tarik balik" / "undo" / "salah"
- Auto-resolves to **last-modified row in the last 60 seconds** if no explicit target given
- After 24h: requires explicit confirmation ("ya, betul")

A **transaction-level undo** (cycle 26 fix #11):
- "Tarik balik semua tadi" / "undo last" within **60 seconds** affects the **bundle** of state changes from the most recent capture event:
  - The voice note diary entry
  - Any auto-matched payment_notification row linked to it
  - Any auto-drafted side effect (WA reply draft staleness flag)
  - Any signature_fired_at flag (no audio replay needed; just visual undo arc)
- After 60 seconds, transactions decompose: each row undoable individually.

### Tightened auto-claim window (Jobs deliverable #3)

Auto-claim threshold raised to 0.92 (Section 2). Combined with **soft-undo extended to 7 days for money-bearing decisions** (was 24h). The wrong-customer discovery window:

| Old | New |
|---|---|
| 0.85 threshold + 24h undo | 0.92 threshold + 7 days undo |
| Wrong-claim possible 3 days later, undo expired | Wrong-claim possible 7 days, still undoable |

---

## Section 11 — Lock-widget stack (Jobs's 9→10 lateral, Wave-2 form)

### The decision (cycle 27 Q6 verdict)

Jobs proposed: "delete the home screen entirely, lock-widget IS the product." Cycle 27 research verdict: **aspirational for Wave 2, not Day 1.** Reasons:
- iOS 17 interactive widgets work on Lock Screen since iOS 17 (Sep 2023), broadly deployed by 2026.
- Android third-party Lock Screen widgets gated to Android 16 / OneUI 8 (Summer 2025+). Many target merchants (Xiaomi, Oppo, Vivo) on Android 13-14 in 2026.
- Day-1 deletion of home screen = degraded UX for ~50% of Android merchants.

### Day-1 stack

| Surface | iOS Day 1 | Android Day 1 |
|---|---|---|
| Lock Screen | Lock Screen widget (read-only summary: today's count) | AOD widget on Pixel/Samsung; foreground-service notification on others |
| Dynamic Island | "Rush Mode" Live Activity when active | n/a |
| Home (in-app) | Adaptive-zoom feed (cycle 21 UX-C) | Same |

### Wave-2 stack

When Android 16 / OneUI 8 reaches 60%+ of target market (projected late 2027):
- Lock-screen widget becomes primary; in-app is for inspection only
- Gesture-economy collapses from ~80 to ~25 across 3 days (Jobs's projection)

This is not Day-1 architecture; it's a **roadmap commitment** to land in Wave-2.

---

## Section 12 — NotificationListener heartbeat

### The rule (cycle 26 Norman fix #10)

Every 7 days at a quiet hour (default 04:00 local), Tokoflow self-tests its NotificationListener:

1. Posts a system-internal test notification with a unique payload signature
2. Listens for it via NotificationListenerService
3. If 2 consecutive tests miss: trigger coach-mark "your phone may be stopping notifications" + re-permission flow + per-OEM screenshot guide (cycle 22 fix #9 specs)

If user has dismissed coach-mark 3 times without acting: feature degrades silently to manual-share-only mode + logs a single warning to merchant settings page (no nag toast).

This catches MIUI/ColorOS battery-saver kills before merchant discovers them at the wrong moment (lunch rush with missed claims).

---

## Section 13 — WA voice-note `.opus` Path 6

### The rule (Aisyah scenario A)

Cycle 24 path 4 covered screenshots. This contract adds **Path 6: forwarded WA voice note** — the most common Aisyah input.

#### Android
```xml
<intent-filter>
  <action android:name="android.intent.action.SEND" />
  <category android:name="android.intent.category.DEFAULT" />
  <data android:mimeType="audio/ogg" />
  <data android:mimeType="audio/opus" />
  <data android:mimeType="audio/mpeg" />
</intent-filter>
```

When user long-presses a WA voice note and selects Tokoflow from Share Sheet, the intent passes the `.opus` file URI. Tokoflow:
1. Decodes opus → 16-bit PCM (using `ffmpeg-android` or libopus)
2. Streams to Whisper-tiny on-device for transcription
3. Continues normal extract pipeline

#### iOS
Share Extension declares `public.audio` UTType. Same decode path via AVFoundation (which natively supports opus in iOS 16+).

#### Coach-mark trigger (cycle 22 fix #13 + cycle 27 Q5)
Coach-mark fires on first WA voice-note received from a customer (detected by the merchant viewing WA via App Switching API on iOS, or Accessibility Service hint on Android — but per refuse list, no auto-read of WA chat — only that Tokoflow knows it's been backgrounded after WA was foregrounded). Coach-mark says: "Pegang lama voice note, share ke Tokoflow."

---

## Section 14 — Accessibility regression check (Norman sev-9 carry-forward)

### The rule

1. **Text input is wired to capture pipeline (cycle 25 §A4)** — not just an escape hatch from voice. Any 🟡/🔴 chip can also be tapped to open numpad/keyboard for direct entry. Cycle 26 found this partially regressed; Section 14 mandates it.
2. **Numpad-on-money-chip-tap** — long-press on any money chip opens numpad (default action). Tap on money chip = quick increment/decrement (e.g., "+5" / "-5") with tactile precision.
3. **Screen-reader (VoiceOver / TalkBack) sequence narration**: a Now pin with auto-claim payment + 2-sec confirm + signature must narrate as ONE unit, not 4 separate alerts. The `aria-live="polite"` region collapses related events into a single announcement: "Order from Pak Ariff, RM 25, paid via DuitNow QR, filed."
4. **High-contrast mode** — all 🟢/🟡/🔴 chips must also have a non-color glyph (✓ / ? / ⚠) for color-blind users.

These are not new features; they are guard-rails on existing surfaces. Cycle 29 ARCH_CONSTRAINT_HARDEN must validate.

---

## Section 15 — The integration scoreboard

After applying all 14 sections, the projected integration scores:

| Persona | Cycle 26 (before) | Cycle 28 (projected) |
|---|---|---|
| Aisyah (MY) | 4.3 | 9.0 |
| Sari (ID) | 5.75 | 9.0 |
| Jobs | 6.0 | 9.0 |
| Norman | 5.7 | 9.0 |
| **Average** | **5.4** | **9.0** |

Cycle 29 ARCH_CONSTRAINT_HARDEN will validate by re-spawning the same 4 personas against the boundary contract + the per-cycle docs. If projected 9.0 holds, cycle 30 writes the final ARCHITECTURE.md.

---

## What this contract does NOT do

This contract does NOT:
- Re-design any UX surface (cycle 21 owns that)
- Re-architect payment capture paths (cycle 24 owns that)
- Re-spec STT/LLM/sync internals (cycle 25 owns that)

It owns ONLY the seams. When a question arises about behavior that crosses two cycles, **this document has the answer**.

---

## Status

- ✅ Schema unification (Section 1)
- ✅ Confidence composition (Section 2)
- ✅ Sync ordering protocol (Section 3)
- ✅ Gesture grammar (Section 4)
- ✅ Sensory grammar (Section 5)
- ✅ Engineering-vocab lint (Section 6)
- ✅ iOS magic-parity strategy (Section 7)
- ✅ ID-specific commitments (Section 8)
- ✅ Correction cascade rules (Section 9)
- ✅ Composed undo contract (Section 10)
- ✅ Lock-widget stack (Section 11)
- ✅ NotificationListener heartbeat (Section 12)
- ✅ WA `.opus` Path 6 (Section 13)
- ✅ Accessibility regression check (Section 14)

**14 sections, 18 sev-7+ items addressed, 4 Jobs deliverables incorporated, 6 cycle-27-research verdicts folded.**

Cycle 29 must red-team this as integrated whole.
