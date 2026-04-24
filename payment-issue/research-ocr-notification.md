# Research: OCR / AI / Notification Parsing for Payment Matching

> Deep research — 27 Maret 2026
> Context: CatatOrder payment verification problem for Indonesian UMKM sellers

---

## Table of Contents

1. [AI/OCR untuk Parse Screenshot Bank](#1-aiocr-untuk-parse-screenshot-bank)
2. [Indonesian Apps yang Sudah Solve Problem Ini](#2-indonesian-apps-yang-sudah-solve-problem-ini)
3. [Android Notification Listening](#3-android-notification-listening)
4. [SMS Parsing](#4-sms-parsing)
5. [Tasker/MacroDroid/Automation](#5-taskermacrodroidautomation)
6. [React Native / Expo Implementation](#6-react-native--expo-implementation)
7. [Privacy & Security](#7-privacy--security)
8. [Reliability & Maintenance](#8-reliability--maintenance)
9. [Provider Comparison Table](#9-provider-comparison-table)
10. [Verdict & Rekomendasi untuk CatatOrder](#10-verdict--rekomendasi-untuk-catatorder)

---

## 1. AI/OCR untuk Parse Screenshot Bank

### 1.1 Can AI Parse Indonesian Mobile Banking Screenshots?

**Yes, with caveats.**

Modern multimodal LLMs (Gemini Flash, Claude, GPT-4o) can parse bank transfer screenshots with high accuracy. The approach works because Indonesian mobile banking apps use relatively consistent UI layouts.

**What can be extracted:**
- Nominal transfer (amount)
- Nama pengirim / penerima
- Bank asal / tujuan
- Tanggal dan waktu transaksi
- Nomor referensi

**Accuracy expectations:**
- Gemini Flash / Gemini 3 Flash: Lowest edit distance (0.115) on OmniDocBench benchmark — better than GPT-5.1 (0.147) and Claude Sonnet 4.5
- Combined OCR+LLM approach: >95% extraction rate on challenging documents
- Standalone LLM (without dedicated OCR): Risk of hallucinated numbers. LLMs are text-understanding models, not precision OCR engines
- Best practice: Use traditional OCR for character recognition + LLM for structure understanding

**Gemini Flash specifics:**
- Supports multimodal input (image + text prompt)
- Can return structured JSON with extracted fields
- `media_resolution` parameter controls token allocation per image — medium resolution sufficient for standard documents
- Multi-language support termasuk Bahasa Indonesia
- Cost: Very cheap via free tier or OpenRouter (already used by CatatOrder for Gemini Flash 3.1 Lite)

**Implementation approach with Gemini:**
```
User uploads screenshot
  -> Send to Gemini Flash API with structured prompt
  -> Extract: {amount, sender_name, sender_bank, reference, datetime}
  -> Match against pending orders
  -> Show match for seller confirmation
```

**Key limitation:**
- Bukti transfer palsu — ChatGPT dan AI tools bisa generate/edit fake transfer screenshots yang sangat convincing
- Butuh cross-verification (unique amount, timing, sender name match)
- Ini bukan silver bullet — hanya mempercepat input, bukan menggantikan actual bank verification

### 1.2 Indonesian OCR Providers (Enterprise)

| Provider | Focus | Accuracy | Pricing |
|----------|-------|----------|---------|
| **GLAIR.ai** (Jakarta) | Bank statement OCR, rekening koran, KTP | Not publicly disclosed | Contact for quote |
| **Verihubs** (Jakarta) | KTP/SIM OCR, accounting docs | >98% on official ID docs, ~90% general | Contact for quote |
| **Simplifa.ai** (Jakarta) | Bank statement + financial report analyzer | Uses OCR + RAG | Contact for quote |
| **Fintelite.ai** | Bank statement analyzer + fraud detection | 95%+ accuracy | Contact for quote |
| **Boiva.id** | OCR bank statement | Not disclosed | Contact for quote |

**GLAIR.ai** is the most relevant — specifically built for Indonesian bank statement processing. Extracts: account holder info, account numbers, transaction details (name, destination, description, date, amount), opening/closing balances. Available as cloud, desktop, or mobile API.

**Verdict on enterprise OCR:** Overkill for CatatOrder's use case. These are built for lending/fintech companies processing thousands of bank statements. CatatOrder just needs to parse a single screenshot at a time.

### 1.3 DIY Approach: Gemini Flash for Screenshot Parsing

**Most practical for CatatOrder.** Already using Gemini Flash via OpenRouter.

Prompt template:
```
Analyze this Indonesian bank transfer screenshot. Extract:
1. Transfer amount (exact number)
2. Sender name
3. Sender bank
4. Recipient name
5. Recipient bank
6. Date and time
7. Reference number (if visible)

Return as JSON. If any field is not visible, return null.
```

**Cost:** Near-zero with Gemini Flash free tier or existing OpenRouter setup.

**Risk:** Fake screenshots. Mitigation: use as helper/accelerator, not as sole verification.

---

## 2. Indonesian Apps yang Sudah Solve Problem Ini

### 2.1 Bank Mutation Scraping Services

These services login to seller's internet banking periodically and scrape mutation data. This is the dominant approach in Indonesia.

#### Moota.co
- **Cara kerja:** Robot yang login ke internet banking secara berkala (5-15 menit) untuk membaca data mutasi
- **Supported banks:** BCA, Mandiri, BNI, BRI, Muamalat (personal + business accounts like KlikBCA Bisnis, MCM)
- **Pricing:** 1500 poin/hari per rekening (= Rp 1.500/hari = ~Rp 45.000/bulan)
- **API:** REST API lengkap, webhook/callback untuk notifikasi transaksi baru
- **Notification:** Email, Push, API, SMS
- **Status:** Sejak Nov 2025 dikelola oleh PT Kurniawan Inovasi Digital (Taut.id)
- **Limitation:** Butuh credential internet banking seller — security concern utama

#### Mutasibank.co.id
- **Cara kerja:** Sama — auto-check mutasi via internet banking, schedule 5 menit s/d 12 jam
- **Supported banks:** BCA, BRI, Mandiri, BNI, BSI, Muamalat, Bank Mega Syariah, BJB, Permata + more
- **Pricing:** Gratis 7 hari trial. Mulai Rp 2.000/hari
- **Notification:** SMS, Email, WhatsApp, Telegram, URL Callback
- **API:** REST API dengan dokumentasi Postman
- **Founded:** 2018

#### MesinOtomatis.com (Bank Gateway)
- **Cara kerja:** Sama — cek mutasi otomatis via internet banking
- **Supported banks:** 24+ bank Indonesia
- **Pricing per hari (varies by bank):**
  - BCA Klikbca Individu: Rp 900/hari
  - Most banks (BCA Bisnis, BNI, BRI CMS, Mandiri, dll): Rp 3.900/hari
  - Premium (BRI QLola, BSI CMS, regional banks): Rp 4.900-5.900/hari
- **Check frequency:** 90-480 detik tergantung bank
- **Free trial:** 7 hari
- **Notification:** Webhook, Email, Telegram
- **API:** Available
- **Since:** 2015

#### Bukubank.com
- **Cara kerja:** Robot memantau lalu-lintas akun bank, kirim notifikasi via URL/Telegram/email
- **Supported banks:** BRI Personal, Mandiri Cash Management, BNI Personal, BNI Syariah, BSI, Danamon Personal/Bisnis, Gopay, OVO
- **Pricing:** Sistem deposit, Rp 50.000 - Rp 1.000.000 per rekening per hari
- **Feature:** Auto-verifikasi pembayaran, plugin + API integration
- **Unique:** Supports Gopay dan OVO besides traditional banks

### 2.2 WhatsApp Commerce + Auto Payment

#### OrderOnline.id
- **What:** Complete order management platform untuk olshop Indonesia
- **Payment:** E-Payment integration (credit cards, OVO, Dana, ShopeePay, GoPay, Alfamart)
- **How auto-confirm works:** Through payment gateway integration (Midtrans/Xendit), bukan mutation scraping
- **Order statuses:** Pending -> Processing -> Complete / Refund
- **Tidak ada mutation scraping** — mereka solve it through payment gateway

#### Berdu.id
- **What:** Drag-and-drop website/toko online builder
- **Payment:** Via payment gateway integration (Duitku, dll)
- **Auto-confirm:** Through payment gateway webhook, bukan manual verification
- **Tidak ada mutation scraping**

#### Kirimi.id
- **What:** WhatsApp integration platform untuk bisnis
- **Feature:** Kirim bukti transfer otomatis via WhatsApp setelah customer bayar
- **Pricing:** Gratis s/d Pro Rp 99.000/bulan
- **Bukan payment verification** — ini notification tool setelah payment sudah confirmed

#### Plugin Ordero (for WooCommerce)
- **What:** WordPress/WooCommerce plugin untuk auto-confirm pembayaran
- **How:** Integrasi dengan Moota API — mutation scraping + auto-match
- **Jadi tetap butuh Moota** di backend

#### DOKU PayChat
- **What:** Pre-order automation via WhatsApp chatbot
- **How:** Chatbot handles order -> pembayaran -> konfirmasi otomatis
- **Via payment gateway** (DOKU), bukan mutation scraping

### 2.3 Lunasbos

**NOT what you think.** Lunasbos is a debt recording app (pencatat utang), bukan payment matching tool. Founded 2018 by Adjie Purbojati dan Ilham Suaib. Features: two-way debt recording synced with contacts, payment reminders, debt collection via app. **No bank mutation or auto-matching features.**

### 2.4 Lakuuu

**No significant findings.** Did not find a well-known product called "Lakuuu" for WA commerce with auto payment confirmation in search results.

### 2.5 Summary: How Indonesian Market Solves This

| Approach | Examples | How It Works |
|----------|----------|--------------|
| **Mutation scraping** | Moota, Mutasibank, MesinOtomatis, Bukubank | Login to internet banking, scrape mutations, webhook |
| **Payment gateway** | OrderOnline, Berdu, DOKU PayChat | Midtrans/Xendit/DOKU — customer pays through gateway |
| **Manual verification** | Most small olshop | Customer kirim screenshot, seller cek manual |
| **OCR/AI** | GLAIR, Verihubs (enterprise) | Parse bank statements for fintech/lending |
| **Notification parsing** | Not found in production Indonesian apps | Experimental only |

**Key insight:** The Indonesian market is split between (a) paid mutation scraping services and (b) payment gateways. There is NO widely adopted free/self-hosted alternative.

---

## 3. Android Notification Listening

### 3.1 How NotificationListenerService Works

Android provides `NotificationListenerService` — a system API that lets apps intercept ALL notifications from other apps.

**Flow:**
```
Bank app sends push notification
  -> Android system delivers to status bar
  -> NotificationListenerService.onNotificationPosted() fires
  -> App can read: package name, title, text, timestamp, extras
  -> Parse text to extract amount, sender, etc.
```

**Requirements:**
- User must manually enable "Notification Access" in Android Settings
- App declares `BIND_NOTIFICATION_LISTENER_SERVICE` permission
- No SMS permission needed (reads notification text, not SMS content)

**Data available per notification:**
- `packageName` — source app (e.g., `com.bca.android`)
- `title` — notification title
- `text` — main notification body
- `bigText` — expanded notification content
- `subText`, `summaryText` — additional text
- `extras` — full notification bundle
- `postTime` — timestamp

### 3.2 Indonesian Bank Notification Formats (Known)

```
BCA Mobile:  "Saldo Masuk Rp 150.000,00 dari ..."
BRI (BRImo): "Transfer masuk Rp150000 ..."
Mandiri (Livin): "CR Rp 150.000 ..."
```

Notification format varies by bank. Each bank has its own pattern, dan bisa berubah kapan saja saat app update.

### 3.3 Bank Package Names (Android)

| Bank | Package Name |
|------|-------------|
| BCA Mobile | `com.bca.android` |
| BRImo | `id.co.bri.brimo` |
| Mandiri Livin | `id.bmri.livin` |
| BNI Mobile | `src.bni.android` |
| Bank Jago | `id.jago.app` |
| SeaBank | `com.seabank.id` |

### 3.4 Real-World App: Bluecoins

Bluecoins (finance tracker app, Editor's Choice on Play Store) successfully uses notification listening for auto-tracking bank transactions:

**How it works:**
- User grants Notification Access permission
- App monitors notifications from configured banking apps
- When bank notification detected, shows prompt: "Possible transaction detected"
- User taps OK to record transaction without opening Bluecoins
- Extracts: amount, transaction type, account

**Supported sources:** Banking apps, SMS, digital payment providers (PayPal, Samsung Pay, WeChat), e-commerce purchase notifications.

**Known issues:**
- Some devices (Huawei, Xiaomi, Samsung) have proprietary battery optimization that kills background services
- Notification Access gets turned off automatically on some devices
- Power saving mode interferes with background detection
- Since v7+, SMS read permission removed per Google policy — only reads notification text
- **Indonesian bank support: Not specifically listed** — generic notification parsing

**Key takeaway:** Bluecoins proves this approach WORKS for finance apps on Google Play. But it's for personal expense tracking, not merchant payment matching.

---

## 4. SMS Parsing

### 4.1 SMS Banking Format Indonesia

Indonesian banks still send SMS notifications for transactions. Format examples:

**BRI SMS:** Format `TRF [NOMINAL] [BANK] [REKENING]`
**BNI SMS:** Notification via shortcode, biaya Rp 500 per SMS
**Mandiri SMS:** Via Mandiri SMS service, various transaction notification formats

### 4.2 SMS vs Push Notification

| Aspect | SMS | Push Notification |
|--------|-----|-------------------|
| Permission needed | `RECEIVE_SMS` (restricted) | Notification Access (less restricted) |
| Google Play policy | Very strict since 2019 | Moderate — needs justification |
| Reliability | High — delivered even offline | Requires app installed + background running |
| Format consistency | More consistent | Can change with app updates |
| Trend | Banks phasing out SMS in favor of push | Increasing adoption |
| Cost to user | Rp 500/SMS at some banks | Free |

**Trend:** BCA sejak 1 Jan 2026 bahkan sudah stop layanan print rekening koran di cabang — semuanya digital via e-Statement. Banks are moving to digital-first, push notification is the future.

### 4.3 Existing SMS Parser Library

**transaction-sms-parser** (npm): Only supports Indian banks (HDFC, ICICI, etc.). Zero Indonesian bank support. Can be used as template architecture.

**No Indonesian bank SMS parser library exists.** Would need to build from scratch with regex patterns per bank.

---

## 5. Tasker/MacroDroid/Automation

### 5.1 How It Could Work

Android automation apps can intercept bank notifications and forward data:

```
Bank notification received (trigger)
  -> Tasker/MacroDroid captures notification text
  -> Extract amount via regex
  -> Send HTTP request to CatatOrder API (action)
  -> CatatOrder matches with pending order
```

### 5.2 Tasker
- Most powerful Android automation since 2010
- Plugin ecosystem (AutoInput, AutoTools) for advanced parsing
- Notification trigger available
- Can make HTTP requests
- Learning curve: steep
- Price: Rp ~60.000 (one-time)

### 5.3 MacroDroid
- "Tasker for the rest of us" — simpler UI
- Notification trigger available
- Can run Tasker plugins
- Free tier available (5 macros)
- Can read notifications and perform over 100 actions

### 5.4 Practicality for CatatOrder Sellers

**Not practical.** Asking UMKM sellers to:
1. Install Tasker/MacroDroid
2. Configure notification trigger
3. Set up HTTP POST to CatatOrder API
4. Maintain regex patterns per bank

...is unrealistic. This is a developer tool, not a user-facing solution.

---

## 6. React Native / Expo Implementation

### 6.1 Can CatatOrder Mobile App (Expo) Implement Notification Listening?

**Yes, but with significant trade-offs.**

### 6.2 Library Options

#### Option A: expo-android-notification-listener-service
- **GitHub:** https://github.com/SeokyoungYou/expo-android-notification-listener-service
- **Compatibility:** Expo SDK 52+
- **Requires:** Development build (NOT Expo Go)
- **API:**
  ```typescript
  ExpoAndroidNotificationListenerService.setAllowedPackages([
    "com.bca.android",
    "id.co.bri.brimo",
    "id.bmri.livin"
  ]);

  const subscription = ExpoAndroidNotificationListenerService.addListener(
    "onNotificationReceived",
    (event: NotificationData) => {
      // Parse event.text for amount
      // Send to CatatOrder backend
    }
  );
  ```
- **Pros:** Native Expo module, TypeScript types, clean API
- **Cons:** Relatively new library, small community

#### Option B: react-native-android-notification-listener
- **GitHub:** https://github.com/leandrosimoes/react-native-android-notification-listener
- **Requires:** React Native >= 0.68, bare workflow or dev client
- **API:** Headless JS task — runs in background even when app is closed
- **Notification data structure:**
  ```json
  {
    "time": "string",
    "app": "string (package name)",
    "title": "string",
    "titleBig": "string",
    "text": "string (main body)",
    "subText": "string",
    "summaryText": "string",
    "bigText": "string (expanded content)",
    "audioContentsURI": "string",
    "imageBackgroundURI": "string",
    "extraInfoText": "string",
    "groupedMessages": [{"title": "...", "text": "..."}],
    "icon": "string (base64)",
    "image": "string (base64)"
  }
  ```
- **Critical caveat:** "Many properties depend on sender configuration so frequently will be empty"
- **Pros:** More mature, headless background execution
- **Cons:** Not Expo-native, bare workflow complexity

### 6.3 Implementation Complexity for CatatOrder

| Step | Difficulty | Notes |
|------|-----------|-------|
| Switch to dev client (from Expo Go) | Medium | One-time setup, but increases build complexity |
| Add notification listener library | Low | npm install + config |
| Build Indonesian bank notification parser | High | Need regex per bank, test with real data, maintain when formats change |
| Background service reliability | High | Battery optimization, device-specific issues (Xiaomi, Samsung, Huawei) |
| User permission flow ("Grant Notification Access") | Medium | Scary-looking system permission, needs trust-building UI |
| Backend matching logic | Medium | Match parsed amount with pending orders, handle ambiguity |
| Google Play approval | High/Unknown | Need strong justification for Notification Access permission |

### 6.4 Verdict on Expo Implementation

**Technically feasible. Practically risky.**

The `expo-android-notification-listener-service` library makes it possible within Expo SDK 52+. But the chain of dependencies is long:
1. User must have Android
2. User must have bank app installed with push notifications ON
3. User must grant Notification Access (scary permission)
4. Background service must survive battery optimization
5. Bank notification format must be parseable
6. Amount must unambiguously match a pending order
7. Google Play must approve the permission request

Any break in this chain = feature doesn't work.

---

## 7. Privacy & Security

### 7.1 Academic Research: "Walls Have Ears" (ISSTA 2025)

Paper: "Walls Have Ears: Demystifying Notification Listener Usage in Android Apps" by Deng et al.

**Key findings:**
- NLS (NotificationListenerService) is **heavily abused** in Android ecosystem
- Discovered apps that: insecurely store social media messages, exploit NLS for destructive competition or SMS credential stealing, leverage NLS to spread promotional messages or malicious links
- Found undisclosed changes in NLS usage through app updates
- Privacy policies often inadequate — don't disclose what NLS data is collected
- Proposed NLRadar tool (static analysis + LLM) to detect NLS abuse

### 7.2 Security Risks

1. **Notification data exposure:** Push notifications reveal OTPs, financial alerts, private messages — even on lock screen
2. **Data storage:** Many apps store notification data insecurely (plain text SharedPreference, local files)
3. **Credential theft:** Malicious apps use NLS to intercept OTPs and banking credentials
4. **User trust:** Granting Notification Access to a third-party app gives it access to ALL notifications, not just banking ones

### 7.3 Google Play Policy (2025-2026)

- `NOTIFICATION_LISTENER` is classified as a **sensitive permission frequently abused for financial fraud**
- Google Play Protect **automatically blocks sideloaded apps** that declare this permission
- Apps on Play Store must submit a **Permissions Declaration** explaining why they need it
- Google reviews and can reject the declaration
- Developer verification requirements expanding — Indonesia included in rollout from Sept 2026

### 7.4 Mitigation for CatatOrder

If implementing notification listening:
- Only capture notifications from whitelisted bank package names
- Never store raw notification text — only extracted structured data (amount, timestamp)
- End-to-end encryption for data sent to backend
- Clear privacy policy explaining exactly what is captured
- User can see/delete captured data anytime
- Permission can be revoked at any time from settings

---

## 8. Reliability & Maintenance

### 8.1 How Often Do Bank Notification Formats Change?

**No published data.** But based on app update patterns:
- Major banking apps update every 2-4 weeks
- Format changes are usually minor (wording, layout) but can break regex parsers
- Major redesigns (e.g., BRI to BRImo, Mandiri to Livin) completely change formats
- No bank provides a stable API for notification format
- **Every app update is a potential parser break**

### 8.2 Device-Specific Issues

| Device Brand | Issue |
|--------------|-------|
| Xiaomi/Redmi | Aggressive battery optimization kills background services |
| Samsung | "Sleeping apps" auto-disables Notification Access |
| Huawei | EMUI power management kills background processes |
| OnePlus | "Deep Clear" prevents notification delivery when app is closed |
| Oppo/Realme (ColorOS) | Similar to Xiaomi — aggressive app killing |

These are the most popular phone brands among Indonesian UMKM sellers.

### 8.3 Maintenance Burden

For mutation scraping services (Moota, Mutasibank, dll), they have dedicated teams maintaining parsers for dozens of bank formats. For CatatOrder to DIY this:
- Need to maintain regex patterns for each bank
- Need test devices with each bank app
- Need to monitor bank app updates
- Need rapid response when parsers break
- **Estimated ongoing maintenance: 4-8 hours/month minimum per bank**

---

## 9. Provider Comparison Table

### Mutation Scraping Services

| Provider | Price/day | Banks | API | Webhook | Trial | Min Interval |
|----------|-----------|-------|-----|---------|-------|-------------|
| Moota | ~Rp 1.500 | 5+ major | Yes | Yes | - | 5-15 min |
| Mutasibank | Rp 2.000+ | 12+ | Yes | Yes | 7 days | 5 min |
| MesinOtomatis | Rp 900-5.900 | 24+ | Yes | Yes | 7 days | 90-480 sec |
| Bukubank | Deposit-based | 10+ | Yes | Yes | - | Varies |

### Per-month cost for typical UMKM (1 bank account)

| Provider | ~Monthly Cost |
|----------|--------------|
| Moota | ~Rp 45.000 |
| Mutasibank | ~Rp 60.000 |
| MesinOtomatis (BCA) | ~Rp 27.000 |
| MesinOtomatis (most banks) | ~Rp 117.000 |

### DIY Approaches (Cost = Development Time)

| Approach | Dev Effort | Maintenance | Reliability | Privacy Risk |
|----------|-----------|-------------|-------------|-------------|
| Screenshot OCR (Gemini) | Low | Low | Medium (fake screenshots) | Low |
| Notification Listener | High | High | Low-Medium | High |
| SMS Parser | Medium | Medium | Medium (SMS declining) | Medium |
| Self-hosted scraping | Very High | Very High | Medium | Very High |

---

## 10. Verdict & Rekomendasi untuk CatatOrder

### 10.1 The Hard Truth

There is NO free, reliable, self-hosted solution for automatic payment verification in Indonesia. The market has converged on two paths:
1. **Payment gateway** (Midtrans, Xendit, DOKU) — most reliable, but has fees
2. **Mutation scraping service** (Moota, Mutasibank) — works, but costs Rp 30-120K/month and requires sharing iBanking credentials

### 10.2 What CatatOrder Should Actually Do

**Tier 1: Already done (keep)**
- Unique amount system (tambah Rp 1-999 ke total) for manual matching
- Manual payment claim by customer with seller confirmation

**Tier 2: Quick win — Screenshot OCR Helper**
- Let seller upload/paste bank screenshot into CatatOrder
- Use Gemini Flash (already integrated) to extract amount + sender name
- Auto-suggest matching pending order
- Seller taps to confirm
- **This doesn't verify payment** — it just speeds up the manual matching from 2 minutes to 10 seconds
- Dev effort: ~2-3 days
- Ongoing cost: Near zero (Gemini Flash free tier)
- Risk: Fake screenshots still possible, but seller is the one verifying

**Tier 3: Notification Listener (experimental, optional)**
- Offer as opt-in Android feature: "Auto-detect incoming transfers"
- Use `expo-android-notification-listener-service` (SDK 52+)
- Whitelist major bank packages
- Parse notifications, suggest matches
- **NOT auto-confirm** — always require seller tap to confirm
- Dev effort: ~1-2 weeks
- Risk: Google Play approval, device compatibility, maintenance burden
- Recommendation: Only pursue if there's strong user demand signal

**Tier 4: Mutation scraping integration (if budget allows)**
- Integrate with Moota/Mutasibank API as a premium feature
- Seller connects their bank account via the service
- Webhook delivers transactions to CatatOrder backend
- Auto-match with pending orders
- Dev effort: ~1 week for integration
- Ongoing cost: Passed to seller or absorbed in premium plan pricing

### 10.3 What NOT to Do

- Do NOT build your own internet banking scraper — legal grey area, security nightmare, massive maintenance
- Do NOT treat screenshot OCR as payment verification — it's a convenience feature only
- Do NOT auto-confirm payments from notification parsing alone — too many false positive risks
- Do NOT require Notification Access for core app functionality — it will scare users and may get rejected by Google Play

### 10.4 Recommended Priority

```
Now:     Tier 2 (Screenshot OCR helper with Gemini Flash) — highest ROI
Later:   Tier 4 (Mutation service integration) — if premium plan justifies it
Maybe:   Tier 3 (Notification listener) — only if strong demand signal
Never:   Self-hosted bank scraping
```

---

## 11. Tambahan: PaddleOCR-VL-1.5 sebagai Offline OCR Alternative (Deep Dive Session 2)

### PaddleOCR-VL-1.5 (Baidu)

- **GitHub**: https://github.com/PaddlePaddle/PaddleOCR
- **Size**: 0.9B parameters — kecil, bisa self-host
- **Accuracy**: 94.5% pada OmniDocBench (SOTA untuk document parsing)
- **Languages**: 109 bahasa termasuk Bahasa Indonesia
- **Capabilities**: Handle scans, skew, warping, screen captures — cocok untuk screenshot mutasi bank

**Kenapa relevan untuk Layer 2 (Screenshot OCR)**:
- **Offline/self-hosted**: Tidak perlu kirim data sensitif (screenshot bank) ke Google API
- **Privacy**: Data mutasi bank stay di server CatatOrder
- **Cost**: Rp 0 (self-host) vs Gemini API (technically free tier tapi rate limited)
- **Trade-off**: Lebih susah setup (Python + PaddlePaddle) dibanding Gemini API call

**Rekomendasi**: Tetap pakai **Gemini Flash** untuk MVP (lebih simple, sudah terintegrasi di CatatOrder). Kalau privacy concern naik atau volume tinggi → evaluate PaddleOCR-VL sebagai pengganti.

### Format Receipt Bank Indonesia — TIDAK Standar

Dari research, setiap bank punya layout berbeda:
- **BCA Mobile**: White background, blue accents, structured
- **Mandiri Livin'**: Layout dan field labels berbeda
- **BRI Mobile (BRImo)**: Layout lain lagi
- **BNI Mobile**: Berbeda lagi
- **E-wallets (GoPay, OVO, DANA)**: Masing-masing unik
- **ATM receipts**: Dot-matrix, low contrast

Implikasi: Traditional OCR (Tesseract) butuh regex per bank. **Gemini/LLM-based approach lebih robust** karena bisa "understand" layout apapun tanpa pattern matching per bank.

---

## Sources

### AI/OCR
- [GLAIR.ai OCR Bank](https://glair.ai/blog-posts-id/tingkatkan-efisiensi-pengolahan-rekening-koran-dengan-ocr-bank)
- [Verihubs OCR Accounting](https://verihubs.com/uses/ocr-accounting/)
- [Simplifa.ai Bank Statement Analyzer](https://simplifa.ai/en)
- [Fintelite.ai Bank Statement OCR](https://fintelite.ai/bank-statement-ocr/)
- [Boiva.id OCR Bank Statement](https://boiva.id/ocr-bank-statement)
- [Gemini Flash OCR Guide](https://blog.roboflow.com/how-to-use-gemini-for-ocr/)
- [Gemini 2.5 Flash Document Processing](https://medium.com/google-cloud/gemini-2-5-flash-the-ai-backbone-for-smarter-document-processing-6b8f4a18135a)
- [Gemini Vision API Docs](https://ai.google.dev/gemini-api/docs/vision)
- [n8n Gemini OCR Workflow](https://n8n.io/workflows/9054-automated-financial-document-processing-with-google-gemini-ocr/)
- [Koncile Bank Statement OCR Guide](https://www.koncile.ai/en/ressources/extract-data-from-bank-statements-with-ocr)

### Indonesian Mutation Services
- [Moota.co](https://moota.co/)
- [Mutasibank.co.id](https://mutasibank.co.id/)
- [MesinOtomatis.com](https://mesinotomatis.com/)
- [Bukubank.com](https://bukubank.com)
- [MesinOtomatis Pricing](https://mesinotomatis.com/harga-cek-mutasi-otomatis-bank-gateway/)
- [Moota API v2 Migration](https://moota.co/migrasi-api-moota-ke-versi-2-stabil-cepat-dan-andal-untuk-sistem-anda/)
- [Moota now under Taut.id](https://moota.co/moota-kini-dikelola-oleh-pt-kurniawan-inovasi-digital-taut-id/)

### Indonesian Commerce Platforms
- [OrderOnline.id](https://orderonline.id/)
- [OrderOnline E-Payment](https://help.orderonline.id/epayment/)
- [Berdu.id](https://help.berdu.id/id/category/payment-gateaway-1us2bgn/)
- [Kirimi.id](https://kirimi.id/blog/bukti-pembayaran-otomatis-via-whatsapp-solusi-praktis-untuk-bisnis)
- [DOKU PayChat](https://www.agenwebsite.com/cara-setup-notifikasi-whatsapp-otomatis-woocommerce/)
- [Plugin Ordero](https://salambisnis.com/plugin-ordero/)

### Android Notification Listening
- [Android NotificationListenerService API](https://developer.android.com/reference/android/service/notification/NotificationListenerService)
- [expo-android-notification-listener-service](https://github.com/SeokyoungYou/expo-android-notification-listener-service)
- [react-native-android-notification-listener](https://github.com/leandrosimoes/react-native-android-notification-listener)
- [Bluecoins Banking Notifications](https://www.bluecoinsapp.com/bank-notifications/)
- [Bluecoins v8 Banking Support](https://www.bluecoinsapp.com/banking-notification-support-v8/)
- [notification-listener GitHub Topic](https://github.com/topics/notification-listener)

### Security & Privacy
- [Walls Have Ears: NLS in Android Apps (ISSTA 2025)](https://dl.acm.org/doi/10.1145/3728898)
- [Push Notification Security Risks](https://heimdalsecurity.com/blog/push-notifications-security-risks-how-to-disable/)
- [Android Banking App Security](https://medium.com/dbs-tech-blog/develop-a-secure-banking-mobile-application-with-these-eight-security-methods-dbf126fc7979)
- [Google Play Sensitive Permissions Policy](https://support.google.com/googleplay/android-developer/answer/16558241)
- [Google Play 2025 Policy Overhaul](https://www.webpronews.com/googles-2025-android-app-policy-overhaul-safety-and-privacy-focus/)
- [Android Notification Access Policy](https://source.android.com/docs/automotive/hmi/notifications/notification-access)

### Other
- [Lunasbos (debt tracker, not payment matching)](https://www.crunchbase.com/organization/lunasbos)
- [n8n Bank Transaction Monitoring Workflow](https://n8n.io/workflows/10110-monitor-bank-transactions-with-multi-channel-alerts-for-accounting-teams/)
- [ChatGPT Fake Transfer Screenshot Warning](https://leetmedia.id/highlight/chatgpt-bisa-edit-bukti-transfer-waspadai-modus-penipuan-digital-yang-makin-canggih/)
- [BCA Digital Statement Transition (Jan 2026)](https://www.bca.co.id/en/informasi/news-and-features/2025/12/18/09/09/Akses-Mutasi-Rekening-Kini-Lebih-Praktis-dan-Mudah)
