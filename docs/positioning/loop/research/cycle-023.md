# Cycle 023 — PAYMENT_RESEARCH

> Critical finding upfront: **iOS does NOT allow third-party apps to read SMS** (cycle 12 Demo #2 needs architecture revision). Android allows via NotificationListenerService but Google Play requires default-handler designation OR special-purpose approval.

## Core finding — platform reality check

> *"iOS doesn't allow any apps downloaded from the App Store to request permission to 'Read SMS' or 'See Call History.'"* — [Android Developers](https://developer.android.com/guide/topics/permissions/default-handlers)
>
> *"Google Play imposes strict restrictions on accessing highly sensitive SMS and Call Log data. Your app must be the designated default handler for SMS, Phone, or Assistant... Usage is limited only to documented core app functionality that is absolutely essential."*

This forces an architecture pivot from cycle 12's "auto-claim QRIS SMS on lock-screen" toward platform-appropriate observation patterns.

## ID payment landscape (verified)

### QRIS — universal, free, mompreneur-fit

> Sources: [paylabs](https://paylabs.co.id/en/blog/how-to-register-a-free-indonesian-qr-code-for-your-small-business/), [hostingceria](https://www.hostingceria.com/6916/pembayaran-instan-dengan-qris-scan-barcode-ovo-gopay-dana-shopeepay-bca-mobile-linkaja/).

- One QR accepts: GoPay, DANA, OVO, ShopeePay, BCA Mobile, LinkAja, Mandiri, BRI, BNI, all participating PJP
- Mompreneur registers Static MPM via free providers (GoPay Merchant, BCA, etc.) — prints QR once, customer scans + types amount
- Notifications sent via **SMS + email + push notification** to merchant's registered contact (varies by PJP)

### Implication: 3 capture paths per payment

| Path | iOS | Android | Friction |
|---|---|---|---|
| Push notification observation | **Limited** (Communication Notifications API needs same publisher) | **Yes** (NotificationListenerService with user permission) | Lowest |
| SMS read | **No** | **Yes** (default-handler-only, Play Store approval) | High setup once |
| Manual share (user-initiated) | **Yes** (Share Sheet from any notification) | **Yes** (Share Sheet) | One gesture, no permission needed |

**Decision**: ALL three paths supported, with manual-share as the universal fallback that requires no permissions on either platform.

## MY payment landscape (verified)

### DuitNow QR — Malaysia's QRIS equivalent

> Sources: [DuitNow QR PayNet docs](https://docs.developer.paynet.my/docs/duitNow-QR/introduction/overview), [duitnow.my](https://www.duitnow.my/QR/index.html), [CIMB DuitNow QR static promotion](https://www.cimb.com.my/en/business/important-notices/2025/extension-of-static-qr-promotional-rate-2025.html).

- National QR Standard established by PayNet
- Static QR: customer enters amount manually (mompreneur-fit)
- Dynamic QR: merchant device generates per-amount (POS-fit)
- **0% MDR (Merchant Discount Rate) for Static DuitNow QR extended to 30 June 2026** — free for mompreneurs
- Interoperable across all participating banks + e-wallets (similar to QRIS)

### FPX (online bank transfer) — different layer

- 18 major MY banks support FPX (Maybank, CIMB, Public Bank, etc.)
- Used for online merchant payments, not P2P
- Customer-initiated via banking app
- Merchant gets notification via SMS/email/push (vendor-specific format, no central regulation like ID's QRIS)

### Implication for MY architecture

DuitNow QR Static is the closest analog to ID's QRIS pattern. **MY merchants should use DuitNow QR Static as the universal-payment-receipt mechanism**, not bank-specific FPX. This corrects the cycle-12 demo's portrayal of MY having "vendor-specific FPX/DuitNow notifications" — DuitNow QR static is actually as standardized as QRIS for the mompreneur use case.

**Updated mechanism asymmetry**: it's not that MY structurally lacks the QRIS pattern (DuitNow QR Static exists). The asymmetry is in **regulatory standardization of payment-notification SMS templates** — Bank Indonesia regulates QRIS notification format more rigidly than Bank Negara Malaysia regulates DuitNow notification format. So Whisper pre-classification accuracy is higher for ID notifications than MY.

## Android NotificationListenerService — viable for both markets

> Source: [Android Developers Permissions](https://developer.android.com/guide/topics/permissions/overview).

- Android 4.3+ supports `NotificationListenerService` — apps can read all incoming notifications (not just their own)
- Requires user to explicitly enable in System Settings → Notification Access
- Onboarding step: 30-second walkthrough showing Settings path (Aisyah/Sari already saw this in cycle 22 sev-7 MIUI/ColorOS critique)
- Once enabled, app sees: notification title, body, app source, timestamp
- Works for ALL banking + e-wallet apps that send notifications: DANA, GoPay, OVO, BCA, Maybank, CIMB, Public Bank
- **Privacy compliant**: app declares specific use ("read payment notifications to file in your diary"), user grants once

## iOS — no equivalent; manual-share path is universal

iOS does not expose third-party push notification content to other apps. Manual share is the only universal path:

1. Mompreneur sees DANA push notification on lock-screen
2. Long-presses notification → 3D-touch reveals actions
3. Taps "Share" → Share Sheet opens
4. Selects Tokoflow / CatatOrder
5. App receives notification text via Share Extension
6. AI extracts payment details

iOS-specific UX: lower magic but functional. iOS users get **manual-share as primary**; Android users get **NotificationListenerService + manual-share as fallback**.

## Cash architecture (both markets, both platforms)

Voice-only. "Aishah ambil 5 nasi lemak, tunai" / "Lina ambil 8 box nasi padang, cash" / "Mbak Tini bayar tunai 50 ribu". AI parses:
- payment_method = cash
- amount
- customer name
- items + quantities

2-second visual confirm before save (numbers visible). Money-event confirm always Day 1 per Aisyah cycle 6.

**No external dep needed.** Pure voice + LLM extraction.

## Bank transfer — screenshot/Share path (both platforms)

When customer transfers to merchant's bank account (not via QR):
1. Customer's banking app shows "Transfer successful"
2. Customer screenshots and WhatsApps the screenshot to merchant
3. Merchant long-presses the WA message → Share → Tokoflow
4. App receives image; Vision LLM (Gemini Flash Lite has vision) extracts: amount, sender name, bank, reference number, timestamp
5. Surfaces as claim-card or auto-links if matches a pending order

Alternative: merchant's banking app sends SMS or push → NotificationListenerService picks up (Android) or manual-share (iOS).

## Reconciliation logic — match payment to order

```
on_payment_event(amount, sender_name, method, timestamp):
  candidates = orders where:
    status = "pending_payment"
    AND total ≈ amount (±0.01 currency unit)
    AND created_within last 48h
    AND (customer.name fuzzy_matches sender OR customer.recent_session)

  if candidates.length == 1 and confidence > 0.85:
    auto_link(payment, order); mark order paid; trigger 3-sensory signature
  elif candidates.length > 0:
    surface as Now-card "claim?" with top-3 candidates inline
  else:
    surface as "no matching order" with create-new option
```

Match scoring:
- Amount exact match: +0.5
- Customer name fuzzy match (Levenshtein ≤ 2): +0.3
- Recent voice-mention within 30 min: +0.2
- Time within order delivery window: +0.1

## Refund / dispute flow

Voice intent: "Salah, Aishah refund RM 25, batalkan order tu"
- AI parses: action=refund, customer=Aishah, amount=RM 25, target=most_recent_aishah_order
- 24h soft-undo: any payment action reversible within 24h via voice "undo last payment"
- After 24h: requires explicit "ya, betul refund" confirmation (matches MyInvois/e-Faktur cancellation 72h pattern)

## Pro tier graduation (deferred per cycle 13 cut)

| Pro feature | MY | ID |
|---|---|---|
| One-tap e-invoice submit | MyInvois | e-Faktur |
| Dynamic QR per-amount | DuitNow Dynamic via PayNet API | QRIS Dynamic via BRI/Mandiri/etc. |
| Accountant export | XLSX + JSON | XLSX + JSON + DJP Coretax XML |
| Multi-outlet | future | future |

These remain Day 60-90+ for MY, Wave 2+ Day 90+ for ID.

## Implications for cycle 24 PAYMENT_HYPOTHESIZE

### What gets clarified

1. **DuitNow QR Static IS available + free for MY mompreneurs** — same architecture as QRIS for receipt-claim
2. **iOS manual-share path is universal** — no permission required on either platform
3. **Android NotificationListenerService is the magic-mode** — auto-claim works on Android with one-time onboarding
4. **Reconciliation uses fuzzy matching algorithm**, not exact-match (handles "Aisyah" vs "Aishah" misspellings)
5. **Refund flow is voice-driven with 24h soft-undo**

### What gets revised

1. **Mechanism asymmetry per market** (Demo #2): the asymmetry is regulatory-standardization-of-SMS, NOT structural-absence of QR. Both markets have universal QR; ID has more standardized notification format.
2. **iOS UX has lower magic** (manual-share required) — must be honest in positioning.
3. **Onboarding step for Android Notification Access** is the highest-friction Day 1 step — needs careful design.

## Implications for cycle 25 WORKFLOW_HYPOTHESIZE

End-to-end pipeline must specify:
- Voice → STT → LLM → entity extraction (existing)
- **Payment-event observer pipeline** (Android NotificationListenerService → parse → match → surface Now-card)
- **Manual-share pipeline** (Share Extension iOS / Share Intent Android → image OCR or text parse → match → surface)
- **Reconciliation algorithm** (fuzzy match score > threshold = auto-link)
- **24h soft-undo state** for payments
