# Cycle 024 — PAYMENT_HYPOTHESIZE (architecture)

> Honest re-derivation given iOS SMS-read prohibition + Android NotificationListenerService availability + DuitNow QR Static MY = QRIS ID parity + manual-share universal fallback.

## Architecture summary — 4 payment capture paths, 1 reconciliation engine

```
                    [PAYMENT EVENT]
                          │
       ┌─────────┬────────┼─────────┬──────────┐
       ▼         ▼        ▼         ▼          ▼
   CASH      ANDROID    iOS     WA-IMAGE     VOICE-MENTION
  (voice)   AUTO-CLAIM  SHARE   SCREENSHOT   (catch-all)
              ↓           ↓        ↓             ↓
       ┌──────┴───────────┴────────┴─────────────┘
       │
       ▼
[NORMALIZE]: amount + customer + method + timestamp + reference
       │
       ▼
[FUZZY-MATCH ENGINE]: score against pending orders
       │
   ┌───┴────┐
   ▼        ▼
high-conf  low-conf
auto-link  surface as Now-card "claim?"
   │
   ▼
[3-SENSORY SIGNATURE TRIGGER + 24H SOFT-UNDO STATE]
```

## Path 1 — Cash (voice-only, no platform dep)

**Trigger**: voice utterance contains payment + cash signal.

**Vocabulary** (LLM prompt domain):
- BM: "cash", "tunai", "bayar tunai", "duit kau ada"
- BI: "cash", "tunai", "uang tunai", "udah bayar tunai"

**Flow**:
1. Voice utterance: *"Aishah ambil 5 nasi lemak, tunai, RM 25"*
2. STT (on-device Whisper-tiny) → transcript
3. LLM extracts: customer=Aishah, items=5×nasi_lemak, payment_method=cash, amount=RM 25
4. Money-event 2-second visual confirm (numbers + customer visible)
5. Tap to confirm or speak correction
6. Persist: order + payment(method=cash, amount=RM 25, status=paid)
7. 3-sensory signature triggers
8. Available actions on card: Send WA receipt (deeplink) · Edit · Refund

**No external dep.** No SMS, no notification access required.

## Path 2 — Android auto-claim (NotificationListenerService)

**Trigger**: payment app (DANA/GoPay/OVO/Maybank/CIMB/etc.) posts a notification matching payment-template patterns.

**Setup** (Day 1 onboarding step, with explicit user consent):
```
Tutorial slide 4:
"Untuk auto-claim pembayaran QRIS,
CatatOrder perlu lihat notifikasi
dari DANA / GoPay / OVO / bank kamu.
Audio kamu tetap di HP — hanya
notifikasi yang diobservasi.

[Buka Settings >] [Skip]"
```
Direct deeplink to System Settings → Apps → Notification Access → CatatOrder. After granting, return to app shows ✓ confirmation.

**Per-OEM walkthrough** (cycle 22 Sari sev-7):
- **Stock Android** (Pixel, OnePlus): one tap, done
- **MIUI (Xiaomi)**: also requires "Autostart" + "Battery saver: No restrictions" — show 3 screenshots
- **ColorOS (Oppo)**: requires "Background activity: Allow" — show 2 screenshots
- **One UI (Samsung)**: requires "Allow background activity" — show 1 screenshot

**Flow**:
1. Customer scans merchant's QRIS (ID) or DuitNow QR (MY), pays
2. Merchant's payment app posts notification: e.g. *"DANA: Pembayaran masuk Rp 240.000 dari Lina via QRIS — 09:30"*
3. NotificationListenerService captures: app_source=DANA, title, body, timestamp
4. **Pattern matcher** (regex + LLM disambiguation):
   - Detected provider: DANA
   - Payment direction: incoming
   - Amount: Rp 240.000
   - Sender: Lina
   - Method: QRIS
   - Timestamp: 09:30
5. Sent to fuzzy-match engine
6. If high-conf match (>0.85): auto-link to pending order, mark paid, trigger 3-sensory signature
7. If low-conf or no match: surface as Now-card "claim Lina Rp 240.000? → top-3 candidate orders inline"

**Pattern matchers (per-provider regex + LLM fallback)**:
```yaml
DANA_in:
  matches: "Pembayaran (?P<amount>Rp [\\d.,]+) (dari|diterima dari) (?P<sender>[\\w\\s]+) via QRIS"
  fields: [amount, sender, method=QRIS, timestamp]

GoPay_in:
  matches: "(?P<sender>.+) bayar (?P<amount>Rp [\\d.,]+) via GoPay"

OVO_in:
  matches: "Anda menerima (?P<amount>Rp [\\d.,]+) dari (?P<sender>.+)"

BCA_in:
  matches: "Telah diterima (?P<amount>IDR [\\d,.]+) dari (?P<sender>.+) (Ref|Kode)"

Maybank_MY_in:
  matches: "Credit RM(?P<amount>[\\d,.]+) from (?P<sender>.+) via DuitNow"

CIMB_MY_in:
  matches: "Credit MYR(?P<amount>[\\d,.]+) from (?P<sender>.+) (Ref|DuitNow)"
```

**Fallback**: when regex fails (new provider, format change, foreign template), entire notification body sent to Gemini Flash Lite with prompt *"Is this an incoming payment notification? If yes, extract: amount, sender, method, timestamp. If no, ignore."* — cost $0.0001/notification, acceptable.

## Path 3 — iOS manual-share (universal fallback)

**Trigger**: user-initiated. Mompreneur sees payment notification from DANA/GoPay/etc. on lock-screen or in-app, decides to share.

**Flow**:
1. Long-press the notification → 3D-touch reveals quick actions
2. Tap "Share" → Share Sheet opens
3. Tap CatatOrder app icon
4. Tokoflow's Share Extension receives notification text
5. Same pattern matcher runs (regex first, LLM fallback)
6. Result surfaces as Now-card with same fuzzy-match logic

**iOS-specific UX**: each share = one explicit gesture. Less magical than Android auto-claim, but works on every iPhone without permissions. Position-honestly in onboarding: *"On iOS, share each payment notification once when it lands. Android = automatic with one-time setup."*

**Optional iOS upgrade path** (Day 90+): Live Activities API integration — when merchant has an active "today" Live Activity, taps on incoming notification mention can route to CatatOrder via App Intent. Requires iOS 17+ and explicit user setup.

## Path 4 — WA-screenshot Share-target (cross-platform)

**Trigger**: customer screenshots their banking-app "Transfer successful" page, sends to merchant via WA. Merchant shares the WA message to Tokoflow.

**Flow**:
1. Long-press WA message containing image → Share → Tokoflow
2. Tokoflow Share Extension receives: image + (sometimes) caption text
3. **Vision LLM** (Gemini Flash Lite vision mode) extracts from image:
   - Amount
   - Sender (account holder name)
   - Bank name
   - Reference number
   - Timestamp
4. Sent to fuzzy-match engine

**Vision prompt template**:
```
"Extract from this banking app screenshot:
- amount (number + currency)
- sender_name (account holder)
- bank_name
- reference_number (if visible)
- timestamp
- payment_method (DuitNow QR / FPX / DANA / GoPay / etc.)

If not a payment screenshot, output: {is_payment: false}"
```

**Cost per Vision call**: ~$0.001 (Gemini Flash Lite vision). Acceptable for ~10-20 screenshots/merchant/day.

## Path 5 — Voice-mention catch-all

**Trigger**: voice utterance mentions payment without going through any other path.

**Examples**:
- *"Mbak Tini bayar dua ratus rebu cash"* (BI cash)
- *"Pak Lee dah bayar transfer Maybank, RM 80"* (MY transfer voice)
- *"Aisyah deposit 50 ringgit DuitNow"* (MY DuitNow voice)

**Flow**: same as Cash path but `payment_method` parsed from voice content (not assumed cash). LLM extracts method explicitly:
- BM keywords: "transfer", "DuitNow", "FPX", "Maybank/CIMB/Public Bank", "QRIS", "cash/tunai"
- BI keywords: "transfer", "DANA/GoPay/OVO/ShopeePay", "QRIS", "cash/tunai", "BCA/Mandiri/BRI"

## Reconciliation engine — fuzzy match

```python
def match_payment_to_order(payment, pending_orders):
    candidates = []
    for order in pending_orders:
        if not (order.created_at within last 48h): continue

        score = 0.0

        # Amount match (exact ±0.01)
        if abs(order.total - payment.amount) < 0.01:
            score += 0.5

        # Customer name fuzzy (Levenshtein normalized)
        if order.customer:
            sim = 1 - levenshtein(order.customer.name, payment.sender) / max_len
            score += sim * 0.3

        # Recent voice mention (within 30 min)
        if order.last_voice_mention_within(minutes=30):
            score += 0.2

        # Within delivery window
        if order.delivery_date and within_window(payment.timestamp, order.delivery_date):
            score += 0.1

        candidates.append((order, score))

    candidates.sort(key=lambda x: -x[1])
    if candidates and candidates[0][1] > 0.85:
        return ('auto_link', candidates[0][0])
    elif candidates and candidates[0][1] > 0.5:
        return ('surface_with_candidates', candidates[:3])
    else:
        return ('surface_unmatched', None)
```

**Threshold tuning** (Phase 0 spike test):
- 0.85 auto-link is conservative (false-positive cost = wrong customer billed)
- 0.5 surface is permissive (false-negative cost = missed match, manual claim)
- Tune via 100-merchant sample over Wave 1 month 1

## 24h soft-undo state machine

Every payment operation creates a `payment_event` row with:
- `created_at`
- `undo_window_ends_at` = created_at + 24h
- `undone_at` = NULL initially

Voice command "tarik balik / undo last payment" within 24h → sets undone_at = now(). UI shows "undone" status; affected order status reverts to pending_payment. Reversal is itself a voice_note for audit trail.

After 24h → "ya, betul refund" required. Aligns with MyInvois cancel-window 72h pattern (same UX).

## Pro tier graduation (deferred Day 60+ MY / Wave 2 Day 90+ ID)

| Feature | Trigger | Adds |
|---|---|---|
| One-tap e-invoice submit | merchant approaches SST RM 500K (MY) or PPN 4.8B Rp (ID) | MyInvois (MY) or DJP Coretax (ID) integration |
| Dynamic QR | merchant requests via voice "saya nak Dynamic QR" | PayNet API (MY) or BRI/Mandiri PJP (ID) integration |
| Accountant XLSX/JSON export | request via Settings | Server-side report generation |
| Multi-outlet | future product, not in scope | – |

**Pro tier flag**: `user.tier in ('pro', 'business')`. Free tier never sees the Pro features in UI — they don't exist for Free users. Pricing graduation is invisible promotion, not paywall friction.

## Score against seamlessness criteria (cycle 21 scoreboard)

| # | Criterion | Score |
|---|---|---|
| 1 | Lock-screen primacy | 9 — Now-card claim works from lock screen on Android (NotificationListener); iOS manual-share requires unlock |
| 2 | Single primary gesture | 9 — voice covers cash; share covers digital; per-platform consistency within market |
| 3 | Diary-IS-DB fidelity | 10 — payment events are voice_notes too |
| 4 | Optimistic UI everywhere | 10 — auto-link triggers immediate signature; surface-as-claim shows pending without spinner |
| 5 | Sensory continuity | 10 — every match triggers 3-sensory signature identically |
| 6 | Scene-aware adaptation | 9 — lunch rush rapid-fire matches batch; quiet-hour matches mute notification but still file |
| 7 | Recovery is voice | 9 — undo via voice; manual unlink via tap on payment chip |
| 8 | <2s perceived response | 10 — local pattern match <100ms; LLM disambiguation <2s; Vision OCR <3s (acceptable for screenshots) |

**Avg: 9.5/10.** iOS-platform asymmetry is the only real deduction.

## Unresolved (queued for cycle 26 INTEGRATION_RED_TEAM)

1. NotificationListener regex coverage — what % of provider notification formats covered Day 1? (Phase 0 spike test required.)
2. iOS manual-share friction quantified — does Sari's "udah masuk DANA" voice flow beat manual-share on iOS? Probably yes; iOS users may default to voice-mention path even when notification arrives.
3. Vision LLM screenshot OCR accuracy on low-quality WA forwards (compressed JPEG) — needs Phase 0 spike.
4. Reconciliation thresholds (0.85 / 0.5) need real-merchant calibration — Phase 0 task.
