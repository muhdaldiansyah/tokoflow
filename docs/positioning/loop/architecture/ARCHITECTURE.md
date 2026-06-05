# Tokoflow / CatatOrder — Integrated Architecture Spec

> **Audience:** the engineer (or AI agent) building Phase 1. This document is the canonical spec.
> **Output of cycles 21-29** of the positioning loop. Boundary contracts (cycle 28) win when per-cycle docs disagree.
> **Versions:** Wave 1 = MY (Tokoflow Day 1, ~8 weeks). Wave 2 = ID (CatatOrder, ~12 weeks, Q1 2027).
> **Hard rule:** if a Section 5 (forbidden vocabulary) string ever ships to a user surface, the build fails.

---

## Table of contents

1. [The seam contract (read first)](#1-the-seam-contract-read-first)
2. [Canonical schema — `diary_entries`](#2-canonical-schema--diary_entries)
3. [UX surface — adaptive-zoom feed + lock-screen + Now pin](#3-ux-surface--adaptive-zoom-feed--lock-screen--now-pin)
4. [Payment capture — 6 paths + reconciliation](#4-payment-capture--6-paths--reconciliation)
5. [Workflow pipeline — capture → STT → extract → persist → signature → side-effects](#5-workflow-pipeline)
6. [Failure-mode matrix](#6-failure-mode-matrix)
7. [Phase 0 spike list](#7-phase-0-spike-list)
8. [Roadmap — Wave 1 (MY) and Wave 2 (ID)](#8-roadmap--wave-1-my-and-wave-2-id)
9. [Appendix A — Engineering-vocabulary lint](#appendix-a--engineering-vocabulary-lint)
10. [Appendix B — Demo scripts (MY + ID)](#appendix-b--demo-scripts-my--id)
11. [Appendix C — Refuse list (Tier-1 / Tier-2 boundaries)](#appendix-c--refuse-list-tier-1--tier-2-boundaries)

---

## 1. The seam contract (read first)

These rules govern behavior **between** the UX, payment, and workflow layers. When a behavior involves only one layer, see the relevant section. When it crosses layers, this section wins.

### 1.1 Three primary gestures, no more

| Gesture | Meaning |
|---|---|
| **Single tap** | Confirm / claim / open. Any surface, same outcome shape. |
| **Long-press (~500ms)** | Correct / disambiguate / edit. Any chip, any pin, any card. |
| **Share-from-anywhere** | External content into the diary. iOS Share Extension, Android Share Intent. |

Voice utterances are content, not a fourth gesture; they're invoked via single-tap on a mic affordance or via configurable long-press on the lock-screen widget.

**Banned gestures:** swipe-to-claim, force-touch, triple-tap, shake-to-undo (system gesture conflict).

### 1.2 Composite confidence is `min()`

```
composite_confidence = min(extract_confidence, match_confidence)
```

Chip color reflects composite, not maximum. UI surfaces the most conservative state.

### 1.3 Money-bearing decisions take a tighter threshold

| Decision | Threshold | Soft-undo window |
|---|---|---|
| Auto-capture (order, customer mention) | 0.85 | 24h |
| Auto-link (payment ↔ order) | **0.92** | **7 days** |
| Refund / cancellation | 0.92 + explicit voice "ya" | 24h |

### 1.4 Sync ordering — second-pass reconciliation mandatory

Every `diary_entries` insert with `kind='payment_notification'` AND `matched_entry_id IS NULL` enters a 60-minute pending-match queue. Every `diary_entries` UPDATE that sets `extracted_json` triggers a re-scan of the queue.

Local-first ordering on reconnect: drain by `created_at` (capture timestamp), not by sync-arrival time. Reconciliation runs **once per sync batch**, not per row.

Dedup hash: `sha256(kind || amount || normalize(sender_name) || floor(timestamp / 300))` (5-minute bucket).

### 1.5 Sensory grammar — decay envelope

A 5-minute rolling window per device.

| Position in window | Visual | Audio | Haptic |
|---|---|---|---|
| 1st | Full 1.5s arc | Chime | Tap |
| 2nd | Shortened 0.6s | Silent | Light tap |
| 3rd | Color flash | Silent | Silent |
| 4th+ | Silent | Silent | Silent |
| Window-close batch | "N filed" card | One chime | One tap |

**Money-event override:** even at 4th+ position, fire silent visual + light haptic for proprioceptive feedback. Never silent-file money.

**First-of-day override:** the first capture after 06:00 local always fires full ceremony.

**Burst mode:** ≥3 inputs in 5 min activates the envelope. ≥6 inputs in 10 min activates lunch-rush mode (no audio at all until 10 min of quiet).

### 1.6 Correction cascade

When a row receives an in-place correction:
1. Patch `extracted_json`, append to `user_corrections[]` audit.
2. Re-evaluate `match_confidence` for any row pointing here via `matched_entry_id`. Demote to claim card if new score < 0.85.
3. Mark any auto-drafted side-effect (WA reply, invoice PDF) as STALE.
4. Fire correction haptic only — no audio, no visual celebration.

### 1.7 Composed undo

| Window | Scope |
|---|---|
| 0–60s | Transaction-level: voice "tarik balik" / "undo" affects the whole bundle of state changes from the most recent capture (the diary row + linked payment + drafted side-effects + signature). |
| 60s–24h | Row-level for ordinary captures. |
| 60s–7d | Row-level for money-bearing decisions. |
| > window | Hard-undo via long-press → edit, with audit trail. |

### 1.8 Two-similar-names trap (cycle 29 T1)

Yellow-chip peek window extends from 2s → **5s** when the candidate name is Levenshtein ≤ 1 from another known customer OR from `profile.name`. Hard-coded protection against `Aisyah↔Aishah`, `Sari↔Saridah`, `Lim Wei↔Lim Wee`.

### 1.9 Toddler / accidental-input protection (cycle 29 T2)

- Voice notes with `extract_conf < 0.3` AND no recognizable money/customer words auto-archive after 30s (hidden from Now pin; surfaced under Settings → "things I couldn't understand").
- Single-tap on **money-bearing** Now pins requires 200ms sustain (not instant). Quick taps register as scroll.
- Optional **Toddler Mode** in Settings: every money-bearing single-tap requires biometric (Face ID / fingerprint).

### 1.10 Multi-candidate disambiguation is sticky (cycle 29 T3)

Single-candidate yellow-chip peeks auto-dismiss after 2-5s. **Multi-candidate disambiguation cards do not auto-dismiss** — they remain on the Now pin until tapped.

### 1.11 Screen-reader narration (cycle 29 T4)

`aria-live="polite"` queue collapses related events. Auto-claim narration: "Order from Pak Andi, RM 50, paid via DuitNow QR, filed." Single utterance, ~3.5s. Queue gap: 1 second between announcements; 3+ pending collapses to "N more orders filed."

### 1.12 Refuse list (positioning weapon)

Tokoflow / CatatOrder NEVER:
- DM customer on merchant's behalf
- Set product prices
- Auto-reply complaints/reviews
- Post to social media
- Regenerate or beautify product photos
- Claim ownership of customer data
- Auto-respond to emotional content (drafts only, merchant sends)
- Gamify with streaks/badges/comparison
- Sell merchant data
- Lock merchant in (1-tap cancel, full data export always available)

These are enforced at the architecture level — no engineer-PR can introduce a feature that violates them without a positioning-bible amendment.

---

## 2. Canonical schema — `diary_entries`

Single source of truth. All other user-visible nouns (orders, customers, payments) are materialized views.

### 2.1 The table

```sql
CREATE TABLE diary_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- What kind of moment is this?
  kind            TEXT NOT NULL CHECK (kind IN (
    'voice', 'text', 'image', 'forwarded_audio',
    'payment_notification', 'manual_share'
  )),
  source_input    TEXT NOT NULL,
    -- 'voice_recording' | 'text_typed' | 'image_camera' | 'image_share'
    -- | 'wa_voice_forward' | 'qris_dana' | 'qris_gopay' | 'qris_ovo'
    -- | 'duitnow_maybank' | 'duitnow_cimb' | 'bca_mobile' | 'mandiri_livin'
    -- | 'wa_screenshot' | 'manual_share_other'

  raw_payload     JSONB NOT NULL,
    -- voice/forwarded_audio: { audio_blob_url, duration_ms, opus_bitrate }
    -- text:                  { text }
    -- image/manual_share:    { image_blob_url, mime, size_bytes }
    -- payment_notification:  { amount, currency, sender_raw, method, reference, timestamp_str }

  -- Transcription + extraction
  transcript      TEXT,
  language_detected TEXT,                              -- 'ms' | 'id' | 'en' | 'mixed'
  extracted_json  JSONB,                               -- { customer_name, items[], amount, delivery_date, ... }
  extract_confidence NUMERIC,                          -- 0..1, LLM self-rating

  -- Reconciliation
  match_confidence NUMERIC,                            -- 0..1, NULL if no match attempt
  composite_confidence NUMERIC GENERATED ALWAYS AS (
    LEAST(COALESCE(extract_confidence, 1.0), COALESCE(match_confidence, 1.0))
  ) STORED,
  matched_entry_id UUID REFERENCES diary_entries(id),  -- payment → order, correction → original
  cascade_role    TEXT CHECK (cascade_role IN ('original', 'correction', 'auto_link')),

  -- Lifecycle
  device_offline_when_captured BOOLEAN DEFAULT FALSE,
  llm_processed_at TIMESTAMPTZ,
  signature_fired_at TIMESTAMPTZ,
  signature_role  TEXT CHECK (signature_role IN ('full', 'shortened', 'silent', 'batch_summary')),
  user_corrections JSONB DEFAULT '[]'::jsonb,
  undo_window_ends_at TIMESTAMPTZ,
  undone_at       TIMESTAMPTZ,

  -- Status (terminal vs open)
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'pending_match', 'matched', 'rejected_not_mine', 'archived_low_conf', 'undone'
  )),

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
  WHERE kind = 'payment_notification' AND status = 'pending_match';
```

### 2.2 Materialized views

```sql
-- Orders: derived from voice/text/image/forwarded_audio rows that carry an order shape
CREATE MATERIALIZED VIEW orders AS
SELECT
  d.id,
  d.user_id,
  d.extracted_json->>'customer_name'       AS customer_name,
  (d.extracted_json->>'amount')::numeric   AS amount,
  d.extracted_json->'items'                AS items,
  (d.extracted_json->>'delivery_date')::date AS delivery_date,
  d.composite_confidence                   AS confidence,
  d.status,
  d.created_at
FROM diary_entries d
WHERE d.kind IN ('voice', 'forwarded_audio', 'text', 'image')
  AND d.extracted_json ? 'customer_name'
  AND d.undone_at IS NULL
  AND d.cascade_role <> 'correction';

-- Payments: derived from payment_notification rows
CREATE MATERIALIZED VIEW payments AS
SELECT
  d.id,
  d.user_id,
  (d.raw_payload->>'amount')::numeric      AS amount,
  d.raw_payload->>'currency'               AS currency,
  d.raw_payload->>'sender_raw'             AS sender_raw,
  d.raw_payload->>'method'                 AS method,
  d.matched_entry_id                       AS matched_order_id,
  d.match_confidence,
  d.status,
  d.created_at
FROM diary_entries d
WHERE d.kind = 'payment_notification'
  AND d.undone_at IS NULL;

-- Customers: derived by aggregating distinct sender names + customer mentions
CREATE MATERIALIZED VIEW customers AS
SELECT
  user_id,
  customer_name AS name,
  COUNT(*) AS total_orders,
  SUM(amount) AS total_spent,
  MAX(created_at) AS last_seen_at
FROM orders
GROUP BY user_id, customer_name;
```

Refresh strategy: row-level triggers on `diary_entries` insert/update fire `REFRESH MATERIALIZED VIEW CONCURRENTLY` on the affected MVs (or use Supabase realtime + client-side derived state — engineering-time decision; both viable).

### 2.3 Migration plan

| Step | Migration |
|---|---|
| 081 | Create `diary_entries` table + indexes |
| 082 | Create materialized views (`orders`, `customers`, `payments`) |
| 083 | Backfill from existing `orders`/`customers`/`payments` tables (one-time, dev/staging only — Phase 0 has no production data) |
| 084 | Deprecate writes to old tables (write-through to `diary_entries` only) |
| 085 | Drop legacy `orders`, `customers`, `payments` write paths after Wave 1 launch + 30 days observation |

---

## 3. UX surface — adaptive-zoom feed + lock-screen + Now pin

### 3.1 Information hierarchy

```
┌─────────────────────────────────┐
│  [no top-bar, status bar only]  │
├─────────────────────────────────┤
│  Now pin (sticky)               │
│  ─ pending claim cards          │
│  ─ in-flight transcripts        │
│  ─ multi-candidate disambig     │
├─────────────────────────────────┤
│  Today                          │
│  ─ entries 06:00–now            │
├─────────────────────────────────┤
│  Earlier (collapsed)            │
│  ─ tap to expand                │
└─────────────────────────────────┘
   [mic affordance, bottom-trailing]
```

- No top-bar (cycle 22 fix #14).
- Sections: `Now` / `Today` / `Earlier`. Only 3, max. (cycle 22 fix #8 — cut from 4-section accordion.)
- Settings access: scroll-up gesture from feed top reveals minimal action sheet.
- FAB / mic: bottom-trailing arc thumb-zone (cycle 22 fix #6). Configurable left/right in Settings.
- Filter chips above feed: All / Orders / Payments / Customers (cycle 22 fix #4 — Jakob's Law without breaking diary).

### 3.2 Now pin

The Now pin is the **only** sticky surface. It shows:
1. Pending claim cards (auto-claim ≥0.92 → directly filed; <0.92 → claim card here)
2. In-flight transcripts (3-7s optimistic chip while LLM extracts)
3. Multi-candidate disambiguation cards (sticky until tapped)
4. The first capture of the day (full ceremony anchor)

Tap on Now pin entry: inline action (claim/mark-paid). NOT scroll-to-source (cycle 22 fix #2). Long-press: edit/correct.

### 3.3 Lock-screen

- **iOS:** Lock Screen widget (read-only summary: today's count, pending claim count). iOS 17+ interactive widget when applicable. Dynamic Island Live Activity during active "Rush Mode" sessions only (Pro tier, Wave 2).
- **Android:** Foreground-service notification (always present, low priority) with summary. Lock-screen widget on Pixel + Samsung. AOD widget where supported. Lock-widget-as-primary deferred to Wave 2 (Android 16 / OneUI 8 prevalence).

Lock-screen claim gesture: **single tap on the card** — same gesture as in-app. (cycle 22 fix #11 unified.)

### 3.4 Onboarding (5-min, not 15)

Per cycle 22 fix #12:
1. Voice tutorial (1 min) — say "Tini ambil 5 nasi lemak, tunai" → see it filed
2. First-launch sensory ritual (10s) — placeholder shows the 3-sensory feel before any real capture
3. Privacy disclosure (30s) — what we never do (refuse list summary), one-screen
4. Send first receipt (1 min) — voice → WA deeplink (merchant taps Send)
5. Voice correction (1 min) — practice "salah, [name] [amount]"
6. Return-hook consent (30s) — opt into briefing notification

Other tutorials (share-target, query) are coach-marks discovered in real use, not Day-1 walkthroughs.

### 3.5 Confidence chips (visual grammar)

| Composite | Color | Glyph | UI behavior |
|---|---|---|---|
| ≥ 0.85 (auto-capture) | 🟢 | ✓ | Quiet file, sensory per Section 1.5 |
| 0.6 – 0.85 | 🟡 | ? | 2-second peek (or 5s if two-similar-names trap) — implicit-tap-to-fix |
| < 0.6 | 🔴 | ⚠ | Disambiguation card (sticky if multi-candidate) |
| Money-bearing ≥ 0.92 | 🟢 | ✓ | Same as above + soft-undo extended 7d |

High-contrast mode: all chips have non-color glyph (✓ / ? / ⚠).

### 3.6 The mic affordance

- Single-tap mic: starts recording, shows live-waveform; tap again or auto-detected silence (1.5s) ends recording.
- Long-press mic: continuous recording mode (for long voice notes).
- Lock-screen quick-record: long-press lock-widget mic icon (configurable).

### 3.7 Voice corrections (in-place)

User says "salah, [target] [new value]" → patches `extracted_json` in place (Section 1.6). Three resolution modes:
1. Single match in last 30 min → patches silently with correction haptic
2. Multi-candidate → sticky disambiguation card (Section 1.10)
3. No match → no-op + shows last 3 mentions with tap-to-pick

---

## 4. Payment capture — 6 paths + reconciliation

### 4.1 The six capture paths

| Path | Platform | Permission | UX |
|---|---|---|---|
| **1. Cash voice** | iOS + Android | None | Merchant says "Lina ambil 5 RM 25 tunai" → cash-tagged order |
| **2. Android NotificationListener auto-claim** | Android | Notification access (one-time) | DuitNow/QRIS notif observed → auto-link if >0.92 |
| **3. iOS manual-share** | iOS | None | Long-press lock-screen notif → Share → Tokoflow |
| **4. WA screenshot share** | iOS + Android | None | Customer WA-sends payment screenshot → merchant shares to app → Vision LLM OCR |
| **5. Voice-mention** | Both | None | "Tini sudah bayar" voice utterance → marks linked order paid |
| **6. WA voice-note `.opus` forward** | Both | None | Customer sends voice order via WA → merchant shares to app → opus decode → Whisper → extract |

(Path 6 added in cycle 28 S13 — was absent in cycle 24.)

### 4.2 Reconciliation algorithm

```python
def reconcile(payment_event):
    candidates = orders_where(
        status='open',
        amount=payment_event.amount ± 0.01,
        created_within_last_48h=True
    )

    for order in candidates:
        amount_score = 0.5 if exact_amount else 0.3
        name_score = customer_name_score(payment_event.sender_raw, order.customer_name)
                     # honorific-strip + token-first-name + Levenshtein
        recency_score = 0.2 if order.created_within_last_30min else 0.0
        delivery_score = 0.1 if order.delivery_date_window_active else 0.0

        match_score = amount_score + name_score + recency_score + delivery_score

    composite = min(payment_event.extract_conf, max(scores))
                # extract_conf for raw notif parse confidence
                # max(scores) is the best candidate match

    if composite >= 0.92 and unique_top_candidate:
        auto_link()
        fire_signature_per_section_1.5()
    elif composite >= 0.5:
        surface_claim_card_with_top_3_candidates()
    else:
        surface_unmatched_with_create_new_option()
```

Customer-name scoring details:
- Strip honorifics (Pak/Bu/Encik/Mbak/Mas/Kak/etc.)
- Token-first-name comparison (so "LIM CHEE KEONG" matches "Pak Lim")
- Levenshtein on remaining tokens, normalized 0-1
- Two-similar-names trap → composite caps at 0.84 (forces yellow-chip peek)

### 4.3 Per-provider regex matchers (Wave 1 MY)

Day-1 MY coverage:
- Maybank QRPay
- CIMB Click / OCTO
- Public Bank PBe
- RHB MyHome
- DuitNow QR (universal — appears in many bank notifs)
- Touch'n Go eWallet
- Boost
- GrabPay
- ShopeePay MY

Phase 0 spike `payment-notif-corpus.ts` collects samples across these 9 + tracks any new providers found in the wild. Target ≥ 90% accuracy on top 5.

### 4.4 Per-provider regex matchers (Wave 2 ID)

Day-1 ID coverage (cycle 28 S8):
- DANA
- GoPay
- OVO
- ShopeePay
- BCA Mobile
- Mandiri Livin'
- BRI BRImo
- BNI Mobile
- BTN Mobile
- Jago
- Jenius
- Permata Mobile

Phase 0 spike `payment-notif-corpus.ts` (ID variant) — same target ≥ 85% on top 8. **Wave 2 launch gated on this spike.**

### 4.5 Refund / dispute (voice-driven)

```
"Salah, Aishah refund RM 25, batalkan order tu"
→ AI parses: action=refund, customer=Aishah, amount=RM 25, target=most_recent_aishah_order
→ Within 24h: voice-only soft-undo
→ After 24h: requires explicit "ya, betul refund"
→ Within 7d (money-bearing): still undoable
→ Beyond 7d: hard-undo via long-press → edit
```

### 4.6 NotificationListener heartbeat (Android)

Every 7 days at 04:00 local:
1. App posts internal test notification with unique payload signature
2. Listens via NotificationListenerService
3. If 2 consecutive misses → coach-mark + per-OEM (MIUI/ColorOS/OneUI) re-permission flow
4. After 3 dismissals: feature degrades silently to manual-share-only + one quiet line on settings page

---

## 5. Workflow pipeline

```
A. Capture          B. STT             C. Extract           D. Confidence       E. Persist
──────────         ────────           ──────────           ───────────         ──────────
voice/text/image   Whisper-tiny       Gemini Flash Lite    composite_conf      diary_entries
forwarded_audio    on-device          (MY) / Sahabat-AI    routing             insert
share_target       3-7s optimistic    (ID) — JSON          🟢/🟡/🔴            update on extract
notif_listener     transcript                                                  reconcile second-pass
                                                                              ↓
                                                                              F. Signature  →  G. Side effects
                                                                                                  (WA draft, stock, briefing)
                                                                                              ↓
                                                                              H. Corrections (Section 1.6)
                                                                              I. Offline-first (Section 1.4)
```

### 5.1 Phase A — capture

- Voice: tap mic → record → 1.5s silence end-detect (or tap-end). Audio chunked + uploaded to Supabase Storage with 24h signed URL.
- Text: any 🟡/🔴 chip tap opens numpad/keyboard inline. Standalone text capture via long-press on mic affordance → text input mode (cycle 28 S14).
- Image: camera intent or share-target.
- Forwarded audio (Path 6): Share intent receives `.opus` URI. Decode opus → 16-bit PCM (libopus on Android, AVFoundation on iOS).
- Share target: registered `intent-filter` (Android) and Share Extension (iOS) for `text/*`, `image/*`, `audio/*`.
- NotificationListener: Android-only, parses observed notifs via per-provider regex.

### 5.2 Phase B — STT

Whisper-tiny on-device. Latency budgets:
- iPhone 12 Pro: ~10s for 30s of audio
- Pixel 6: ~12s for 30s
- Redmi Note 12: ~15s for 30s

**Optimistic transcript** appears at ~3s as Whisper streams partial output. Chip says "saya dengar..." / "aku denger..." / "listening..." (per locale). Full transcript replaces optimistic at completion.

### 5.3 Phase C — LLM extract

OpenRouter API. Per-market prompt template + JSON response schema with confidence per field.

**MY (Tokoflow) prompt template:**
```
You are extracting structured order data from a Malaysian SMB merchant's voice diary entry.
Output JSON: { customer_name, items: [{name, qty, unit, price?}], amount, currency: 'MYR',
               delivery_date?, payment_method, confidence_per_field }
Vocabulary hints: honorifics (Pak/Bu/Cik/Encik/Datuk/Datin), Manglish code-switch normal,
ringgit (RM) only, MY phone format +60.
If utterance is ambiguous, lower confidence; do not guess.
Refuse to extract: emotional sentiment, customer phone numbers (privacy).
```

**ID (CatatOrder) prompt template:**
```
Anda mengekstrak data pesanan dari voice diary mompreneur F&B Indonesia.
Output JSON: { customer_name, items: [{name, qty, unit, price?}], amount, currency: 'IDR',
               delivery_date?, payment_method, confidence_per_field }
Petunjuk vokabuler: honorific (Pak/Bu/Mas/Mbak/Kak/Aa/Teh/Neng), Bahasa casual lazim,
rupiah (Rp) only. Jika ambigu, turunkan confidence; jangan tebak.
Tolak ekstrak: sentimen emosional, nomor telepon customer (privasi).
```

Latency budget: < 3s per call. Burst-rate: max 1 call per 500ms (queue throttle on Phase A).

Locale-fence (Section 1, applied here): if `profile.country='ID'` and currency token is `RM` → reject + 🔴.

### 5.4 Phase D — confidence routing

See Section 1.2 (composite = min) and 1.3 (money-bearing threshold 0.92). Two-similar-names trap (Section 1.8) caps at 0.84.

Self-reference disambig: if extracted `customer_name` after honorific-strip + Levenshtein-1 matches `profile.name` → force 🟡 with "kamu maksud aing/saya kah?" / "did you mean yourself?"

### 5.5 Phase E — persist

Atomic transaction:
1. INSERT into `diary_entries`
2. If reconciliation found a match: UPDATE with `matched_entry_id` + `match_confidence` + `composite_confidence` (auto-computed)
3. Trigger materialized-view refresh (or push to client-side derived state)
4. Schedule signature (Section 1.5) — may be suppressed by decay envelope
5. Schedule side effects (Phase G) — but never auto-send

If insert succeeds but reconciliation second-pass enqueues: `status='pending_match'` until pass completes.

### 5.6 Phase F — signature

Per Section 1.5 decay envelope. Implementation:
- Visual: CSS keyframe animation on the row (1.5s arc / 0.6s shortened / 0s color flash / silent).
- Audio: Single `Audio` element with Tokoflow-chime.opus (256ms). Use Web Audio API on web; native on iOS (`SystemSoundID`) + Android (`SoundPool`).
- Haptic: iOS Core Haptics CHHapticEngine; Android `Vibrator.vibrate(VibrationEffect.createOneShot(...))` or HapticFeedbackConstants.
- Sync drift target: < 50ms across visual / audio / haptic.

First-of-day flag: stored client-side as `localStorage.lastFullSignatureDate`. Reset at 06:00 local.

### 5.7 Phase G — side effects (NEVER auto-send)

| Effect | Trigger | Auto-send? |
|---|---|---|
| WA reply draft | Order extracted | NO — merchant taps Send in WA |
| Receipt link | Payment auto-linked | NO — sent only when merchant taps Share |
| Invoice PDF generation | Pro-tier MyInvois flow | YES (no merchant action needed; submit to LHDN) |
| Stock decrement | Order extracted | YES (DB only; no merchant-facing change) |
| Daily briefing notification | Cron at 06:00 MYT / 07:00 WIB | YES (push notification to merchant only) |

WA draft staleness: any correction (Section 1.6) marks the draft STALE → merchant must re-confirm via WA send dialog before message ships.

### 5.8 Phase H — corrections

Per Section 1.6. Implementation:
- "Salah" / "salah" / "wait" / "wrong" prefix detected on voice utterance → correction mode
- Target resolution: most-recent-30min single-candidate auto, multi-candidate sticky disambig (Section 1.10)
- Audit trail: append `{at, field, old, new, source: 'voice'}` to `user_corrections` JSONB
- Cascade: re-evaluate matches (Section 1.6 step 2)
- Haptic only (no audio)

### 5.9 Phase I — offline-first

- IndexedDB queue holds captures when offline (`navigator.onLine === false` OR fetch fail)
- Queue drain on reconnect: monotonic by `created_at` (Section 1.4)
- Reconciliation runs once per drained batch (not per row)
- Single batch-summary signature on drain complete
- No spinners. Tint indicator only (subtle elevation/shadow change, cycle 27 Q3 verdict)

---

## 6. Failure-mode matrix

12 failure modes from cycle 29, with handling references:

| # | Scenario | Section | Status |
|---|---|---|---|
| 1 | Offline 4h, batch drain | §1.4, §1.5, §5.9 | Handled |
| 2 | NotificationListener silently revoked | §4.6 | Handled (7d heartbeat) |
| 3 | Whisper mishears name → wrong fuzzy-match | §1.8 (5s peek extension) | Handled |
| 4 | iOS Free user, no auto-claim | §3.3 (lock-screen widget summary), §4.1 path 3 | Handled (honest manual-share) |
| 5 | Toddler/accidental input | §1.9 | Handled (auto-archive + 200ms sustain + biometric mode) |
| 6 | Customer overpays | §4.2 reconciliation | Handled (claim card, no auto-link below threshold) |
| 7 | Multi-candidate correction ambiguity | §1.10 | Handled (sticky card) |
| 8 | Lebaran burst rush | §1.5 | Handled (decay + lunch-rush mode) |
| 9 | VoiceOver / TalkBack narration | §1.11, §3.5 | Handled (collapse queue + glyphs) |
| 10 | Bandung dialect → Sahabat-AI accuracy | §7 spike | **GATED — Wave 2 spike required** |
| 11 | 14MB 2-min WA voice note | §4.1 path 6, §5.2 budget | Handled (~15-18s end-to-end) |
| 12 | Wrong auto-claim Day 4 of vacation | §1.3 (0.92 threshold + 7d undo) | Handled |

### Deferred failure modes (post-launch hardening)

| # | Scenario | Defer to |
|---|---|---|
| 13 | Multi-device merchant (phone + tablet) | Phase 4 |
| 14 | Account recovery / device loss | Phase 4 (Pro-tier auto-cloud-backup) |
| 15 | Multi-staff (already in DB schema) | Phase 3 multi-outlet |
| 16 | Billplz dispute / chargeback | Pro tier Phase 3 |
| 17 | SST-eligible auto-invoice timing | Pro tier flow, separate spec |

---

## 7. Phase 0 spike list

| # | Spike | Wave | Gate |
|---|---|---|---|
| 1 | `payment-notif-corpus-my.ts` (9 providers, 500+ samples, 5 MY mompreneur × 30d) | 1 | Phase 1 launch |
| 2 | `whisper-burst-rate.ts` (8 LLM calls / 5s on Redmi Note 12 + iPhone 12 Pro) | 1 | Phase 1 launch |
| 3 | `notification-listener-heartbeat.ts` (MIUI + ColorOS + OneUI re-permission flows) | 1 | Phase 1 launch |
| 4 | `opus-decode-latency.ts` (2-min .opus → PCM → Whisper, baseline Redmi Note 12) | 1 | Phase 1 launch |
| 5 | `live-activity-rush-mode.ts` (iOS 17, server-push → Live Activity update latency) | 1+ | Wave 2 Pro |
| 6 | `payment-notif-corpus-id.ts` (12 providers, 1000+ samples, 5 ID mompreneur × 30d) | 2 | Wave 2 launch |
| 7 | `sahabat-ai-bandung-bench.ts` (200 utterances, vs Gemini Flash Lite baseline) | 2 | Wave 2 launch |
| 8 | `id-self-reference-disambig.ts` (50 utterances) | 2 | Wave 2 launch |
| 9 | `id-currency-locale-fence.ts` (100 mixed utterances) | 2 | Wave 2 launch |
| 10 | `myinvois-spike.ts` (existing — LHDN preprod accepted UUID) | 1+ | Pro tier launch |
| 11 | `billplz-spike.ts` (existing — X-Signature round-trip) | 1+ | Pro tier launch |
| 12 | `wa-share-target-onboarding.ts` (coach-mark trigger conditions) | 1 | Phase 1 launch |

5 spikes block Phase 1 MY launch (#1, #2, #3, #4, #12). 4 spikes block Wave 2 ID launch (#6, #7, #8, #9). 3 spikes are Pro-tier dependent (#5, #10, #11).

---

## 8. Roadmap — Wave 1 (MY) and Wave 2 (ID)

### 8.1 Wave 1 — Tokoflow MY (8 weeks)

**Phase 0 validation (3 months, current):** 5+5 interviews + manual-twin smoke test + AI cost measurement + Sdn Bhd + Billplz KYB.

**Phase 1 build (8 weeks, post-Phase-0-pass):**

| Week | Scope |
|---|---|
| 1 | Migration 081-082 (`diary_entries` + MVs); `lib/copy/` MY locales |
| 2 | Phase A capture — voice, text, share-target, NotificationListener |
| 3 | Phase B + C — Whisper-tiny integration; Gemini Flash Lite extract; MY prompt template |
| 4 | Phase D + E — confidence routing; reconciliation engine; second-pass match |
| 5 | Phase F + G — sensory signature; WA-draft never-auto-send; daily briefing cron |
| 6 | Phase H + I — corrections; offline-first IDB queue; sync drain |
| 7 | UX surface — adaptive-zoom feed; lock-screen widget; Now pin; onboarding 5-min |
| 8 | NotificationListener heartbeat; toddler protection; a11y pass; 5 alpha onboardings |

**Wave 1 launch criteria** (Phase 1 Gate per bible v1.2):
- Sean Ellis ≥ 40% "very disappointed" without Tokoflow
- DAU ≥ 70% over 4 weeks
- ≥ 1 spontaneous referral
- NPS ≥ 8 from all 5 alphas
- ≥ 3 hours/week craft saved (self-reported)

### 8.2 Wave 2 — CatatOrder ID (12 weeks, Q1 2027)

Wave 2 starts only after Wave 1 alphas hit 4/5 of the above criteria.

| Week | Scope |
|---|---|
| 1-2 | ID Phase 0 spikes — payment-notif-corpus, Sahabat-AI bench, locale-fence, self-ref disambig |
| 3-4 | Sister-brand fork — codebase split, shared `voice-core` Day 60 |
| 5-6 | ID locale (`lib/copy/` ID Bandung + Jakarta variants) + `id-ID` i18n |
| 7-8 | Sahabat-AI integration (or Gemini fallback per spike result) |
| 9-10 | QRIS auto-claim + 12 ID payment provider regexes |
| 11 | iOS Live Activities (Pro tier MY + ID) + Rush Mode webhook integration |
| 12 | 5 ID alpha onboardings (Bandung) — same Phase 1 Gate criteria |

### 8.3 Wave 3+ (Year 2+)

- Vertical expansion within MY (kosmetik, modest fashion, jasa lokal)
- Geographic expansion (KL, Penang, Singapore)
- Lock-widget-as-primary (Wave 2-3 dependent on Android 16 / OneUI 8 prevalence)
- Cross-pattern (creator, freelancer)
- Global

---

## Appendix A — Engineering-vocabulary lint

CI lint script: `pnpm test:lint:vocab`. Greps user-facing string literals + `i18n.t()` keys + `aria-label` attributes. Fails PR on hit.

**Forbidden strings** (32 total):

```
Whisper, STT, speech-to-text, ASR,
LLM, GPT, Gemini, Sahabat-AI, OpenRouter,
IDB, IndexedDB, queue, queued,
optimistic, eventually-consistent, eventually consistent,
sync pending, syncing, synced,
reconciliation, reconcile, fuzzy match, Levenshtein,
confidence chip, confidence threshold,
extract, extraction, extracted_json,
background twin, foreground assist,
tier 1, tier 2, tier 3,
diary_entries, voice_notes, payment_events,
matched_entry_id, composite_confidence,
NotificationListenerService, ActivityKit, Live Activity,
App Intents, Share Extension
```

**Permitted natural-language equivalents** in `lib/copy/index.ts`:

| Forbidden | MY (en-MY / Manglish) | ID (id-ID / Bandung) |
|---|---|---|
| "STT processing" | "saya dengar..." | "aku denger..." |
| "LLM extracting" | "saya susun ceritamu" | "aku susun ceritamu" |
| "syncing" | "menyusul" | "nyusul" |
| "fuzzy match found" | "ini Pak Ariff yang tadi?" | "ini Pak Ariff yang tadi?" |
| "claim payment" | "ini bayaran dia?" | "duit dari dia?" |
| "extract confidence low" | (use 🟡 + "boleh check?") | (use 🟡 + "bener gini?") |

Run-time enforcement: hot-path `lib/copy/index.ts` is the only allowed source for user-facing copy. Lint catches any `"<forbidden>"` in `app/**/*.tsx` and `components/**/*.tsx`.

---

## Appendix B — Demo scripts (MY + ID)

### Demo #1 — Bu Aisyah, Shah Alam, MY (90 seconds)

```
[Lunch rush. Phone on counter. Greasy fingers.]

Aisyah voices:        "Aishah ambil 5 nasi lemak ayam, tunai RM 50"
[Phone fires shortened sensory signature, chip 🟢, filed silently]

10s later, Aisyah:     "Pak Ariff RM 25, antar 12:30"
[Now pin shows 2 items, Pak Ariff order pending]

20s later — DuitNow QR notification on lock-screen:
                       "DuitNow QR — RM 25.00 from PAK ARIFF"
[NotificationListener observes, reconciles, composite_conf 0.94, 🟢
 — auto-link, silent visual + light haptic per Section 1.5 money-event
 — Now pin updates to "Pak Ariff order: paid"]

Aisyah finishes lunch rush at 13:00. Opens app. 18 things filed.
First-of-day full ceremony already fired at 06:30 with the morning briefing.
```

### Demo #2 — Mbak Sari, Bandung, ID (90 seconds, honest version)

```
[Sabtu pagi Lebaran rush. Toddler tugging sleeve.]

Sari voices:          "Mbak Ina ambil 1 box kue lebaran 85 ribu, antar Senin pagi"
[Shortened sensory signature, chip 🟢, filed]

15s later — DANA notification:
                      "DANA — Anda menerima Rp 85.000 dari INA SETIAWATI"
[Per-provider DANA regex parses; reconciliation: customer "Ina" matches
 "INA SETIAWATI" via honorific-strip + token-first-name (composite 0.93);
 amount exact match — auto-link 🟢]

Different flow — Mandiri bank transfer:
                      "Mandiri — Transfer masuk Rp 150.000 dari TINI HASTUTI"
[Mandiri Livin' regex parses; no pending order yet, payment_event
 enters 60-min queue (Section 1.4)]

Sari voices:          "Bu Tini ambil 2 box, total seratus lima puluh ribu, COD"
[Order extracted; second-pass reconciliation runs, finds queued payment,
 auto-links 🟢 — silent visual + light haptic]

Aisymmetry honesty: ID has 12 payment providers vs MY's 9. Engineering
effort 3× MY for Day-1 coverage. The felt experience: "one QR captures
everyone" (true). Engineering complexity: hidden behind 12-provider regex
matrix + Phase 0 spike validation.
```

---

## Appendix C — Refuse list (Tier-1 / Tier-2 boundaries)

Architecture-enforced. Any PR that introduces functionality matching any of these patterns must be rejected with reference to this appendix.

| # | Refusal | Architecture enforcement |
|---|---|---|
| 1 | DM customer on merchant's behalf | WA-draft pipeline NEVER auto-sends (Section 5.7); merchant taps Send |
| 2 | Set product prices | No price-suggest endpoint; pricing compass shows traffic-light only, never sets |
| 3 | Auto-reply complaints/reviews | No sentiment auto-response endpoint; drafts only, merchant sends |
| 4 | Post to social media | No social-media OAuth scope requested; no posting endpoints |
| 5 | Regenerate/beautify product photos | No image-generation endpoint; Photo Magic v1 = extract only |
| 6 | Claim ownership of customer data | Customer data exports always available; deletion always honored |
| 7 | Auto-respond to emotional content | Refuse-to-extract instruction in LLM prompt template (Section 5.3) |
| 8 | Gamify with streaks/badges/comparison | `getNudgeLevel` returns `none \| exhausted` only; no streaks in copy library |
| 9 | Sell merchant data | Privacy policy + RLS isolation + no third-party export endpoint |
| 10 | Lock merchant in | 1-tap cancel + full data export (CSV + JSONB) always available in Settings |

---

## Status

- Schema unification: spec'd, migration 081 ready
- Boundary contract: 12 sub-rules locked
- Per-cycle layers (UX, payment, workflow): integrated, references unified
- Failure-mode matrix: 12 handled, 5 deferred
- Phase 0 spikes: 12 listed (5 block Phase 1, 4 block Wave 2, 3 Pro-tier) — re-budgeted to 15 in [MOBILE.md §11](./MOBILE.md#11-phase-0-spike-list)
- Vocabulary lint: 32 forbidden strings
- Demos: MY honest (cycle 12 baseline) + ID honest-asymmetry-rewrite

**Cycle 30 closes the product-architecture arc. Cycles 21-30 produced one canonical spec.**

**Cycles 31-35 produce the mobile-platform spec at [`MOBILE.md`](./MOBILE.md).** Mobile is primary (native iOS + Android via Expo + RN); web Next.js retained for marketing + customer-facing storefront only.

**Integration scoreboard:**
- Product architecture (cycles 21-30): 9.3/10 (Aisyah 9.3 / Sari 9.0 SPIKE-gated / Jobs 9.5 / Norman 9.5)
- Mobile platform (cycles 31-35): 8.7/10 (4 personas: Architect / iOS Indie / Android Platform / Perf)

**Engineering can build from this document + MOBILE.md.** No layer-internal references missing. No seam-undefined. No engineering-vocab leak risk uncaught. Mobile stack locked: Expo SDK 54+ / RN 0.81+ / New Architecture / 18 libraries Wave 1 / 0 custom Expo Modules Wave 1.
