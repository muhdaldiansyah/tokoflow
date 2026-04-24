# Research: Smart Manual Matching Approaches

> Membuat verifikasi pembayaran lebih cepat TANPA integrasi eksternal (bank API / payment gateway).
> Riset dilakukan 2026-03-27.

## Context

CatatOrder sudah punya:
- Order data lengkap (customer, total, items, status)
- `paid_amount` + `payment_status` per order
- API: `POST /api/orders/[id]/payment` (record payment) + `POST /api/orders/bulk/paid` (bulk mark paid)
- Swipe right = advance status, tapi tidak ada shortcut khusus payment
- `payment_claimed_at` (customer claim via public order page)

**Gap utama:** CatatOrder tahu order, tapi tidak tahu mutasi bank. Matching 100% manual.

---

## Approach 1: Smart Amount Matching UI

### Konsep
Seller buka app bank, lihat ada transfer masuk Rp97.500. Buka CatatOrder, ketik "97500" di search bar. CatatOrder langsung tampilkan order yang cocok nominal-nya. Satu tap → lunas.

### Implementasi Detail

```
Flow:
1. Seller buka CatatOrder → halaman "Verifikasi Pembayaran" (atau search bar di Pesanan)
2. Ketik nominal: 97500
3. CatatOrder query: SELECT * FROM orders WHERE total = 97500 AND payment_status != 'paid' AND status != 'cancelled'
4. Tampilkan list order yang match (dengan nama customer, tanggal, items preview)
5. Seller tap order → konfirmasi → paid_amount = total, payment_status = 'paid'
```

### Matching Algorithm (Multi-Criteria)

```
Priority 1: EXACT match — amount == order.total
Priority 2: PARTIAL match — amount == order.total - order.paid_amount (untuk sisa DP)
Priority 3: FUZZY match — amount within ±Rp500 of order.total (untuk pembulatan)
Priority 4: TIME-WEIGHTED — order yang delivery_date-nya hari ini mendapat skor lebih tinggi
```

### UX Variations

| Variant | Deskripsi | Effort | Impact |
|---------|-----------|--------|--------|
| **Search bar di order list** | Ketik nominal, filter order yang match | Low | High |
| **Dedicated "Verifikasi" page** | Full page dengan input nominal + order suggestions | Medium | High |
| **Smart numpad** | Numpad khusus yang langsung show matching orders saat diketik | Medium | Very High |
| **Calculator-style** | Ketik nominal, langsung muncul suggestions di bawah | Low | High |

### Edge Cases

- **Nominal sama**: 3 order @Rp50.000 → tampilkan semua, seller pilih berdasarkan nama customer
- **Nominal bulat**: Customer transfer Rp100.000 untuk order Rp97.500 → fuzzy match ±Rp5.000 + show selisih
- **Transfer dari orang lain**: Seller harus tetap pilih manual — nama di mutasi bank beda dari customer
- **Split payment**: Customer bayar 2 order sekaligus (Rp97.500 + Rp52.000 = Rp149.500) → suggest combo matches
- **DP/partial**: Amount < total → suggest sebagai partial payment

### Scoring Formula

```
score = 0
if (amount == order.total) score += 100           // Exact match
if (amount == order.remaining) score += 90          // Exact remaining
if (abs(amount - order.total) <= 500) score += 70   // Fuzzy close
if (order.delivery_date == today) score += 20       // Time relevance
if (order.status == 'new') score += 10              // Fresh orders first
if (order.payment_claimed_at != null) score += 30   // Customer already claimed
```

### Verdict
- **Feasibility:** SANGAT TINGGI — purely frontend + 1 API query
- **Impact:** HIGH — dari 5 langkah (buka bank → scroll → cari → balik CatatOrder → tandai) jadi 2 langkah (ketik nominal → tap)
- **Effort:** LOW — bisa implement dalam 1 hari
- **RECOMMENDED: YES — Implementasi pertama**

---

## Approach 2: Batch Reconciliation dari CSV/PDF Upload

### Konsep
Seller download e-statement dari mobile banking (PDF/CSV), upload ke CatatOrder, auto-match semua transaksi sekaligus.

### Technical Landscape Indonesia

**Tools parsing e-statement Indonesia yang sudah ada:**
- **Startkit.tech** — Browser-based converter, support BCA, BNI, BRI, Jenius, Bank Jago, Mandiri, Seabank, CIMB Niaga. 100% client-side processing
- **AIBankStatement.com** — AI-powered, 13 bank Indonesia, output Excel/CSV/JSON, klaim 95%+ akurasi
- **BankStatementConverter.com** — General-purpose PDF→CSV
- **Ducksheets.com** — Support BCA, BRI, Mandiri, Permata
- **bca-pdfestatement-extractor** — Open source GitHub khusus BCA (Python)

**Format e-statement Indonesia:**
- BCA: PDF, column structure bervariasi (kredit di kolom berbeda tergantung ada/tidaknya transaksi kredit)
- BRI: PDF, bisa convert ke Excel
- Mandiri: PDF
- Semua bank major sudah support download e-statement via mobile banking/internet banking

### Implementasi di CatatOrder

```
Flow:
1. Seller buka "Rekonsiliasi" page
2. Upload file CSV/PDF e-statement
3. CatatOrder parse file (client-side untuk privasi):
   - Extract: tanggal, nominal, deskripsi, kredit/debit
   - Filter hanya transaksi kredit (uang masuk)
4. Auto-match setiap transaksi kredit ke pending orders:
   - Exact amount match → auto-suggest
   - Fuzzy match → show candidates
   - No match → flag sebagai "unmatched"
5. Seller review, confirm batch → semua order di-update sekaligus
```

### Parsing Strategy

**Option A: Client-side PDF parsing (Recommended)**
- Library: `pdf.js` (extract text) + custom parser per bank format
- Pro: Data tidak keluar device, cepat, gratis
- Con: Perlu maintain parser per bank format, brittle kalau format berubah

**Option B: AI/LLM parsing (Gemini)**
- Upload PDF/screenshot → Gemini Flash extract structured data
- Pro: Format-agnostic, handle variasi layout
- Con: Data keluar ke API, latency, cost (meski Gemini Flash murah)
- **Gemini sangat bagus untuk ini** — "Gemini API emerges as the clear winner for cost-sensitive applications requiring high-volume OCR processing." Klaim 95%+ akurasi pada bank statement. Layout-agnostic (tidak perlu template per bank)

**Option C: Hybrid — try client-side first, fallback ke AI**
- Parse PDF client-side dengan template yang diketahui
- Kalau gagal/confidence rendah → kirim ke Gemini
- Best of both worlds

### Matching Algorithm untuk Batch

```
Untuk setiap transaksi kredit dari statement:
  1. Exact match (amount == order.total) → auto-match jika hanya 1 candidate
  2. Multiple exact matches → show all candidates, seller picks
  3. Fuzzy match (±Rp500) → suggest with warning
  4. Date validation → transaksi harus setelah order dibuat
  5. Combo detection → cek apakah amount = sum of 2-3 orders

Report:
  ✅ 15 transaksi matched (auto)
  ⚠️ 3 transaksi perlu review manual
  ❌ 2 transaksi tidak cocok dengan order apapun
  📋 5 order belum ada payment
```

### Verdict
- **Feasibility:** MEDIUM — parsing PDF bervariasi per bank, tapi Gemini sangat membantu
- **Impact:** VERY HIGH untuk seller volume tinggi (40+ order/hari) — dari 2-3 jam jadi 15 menit
- **Effort:** MEDIUM-HIGH — 3-5 hari development
- **RECOMMENDED: YES — Fase 2, setelah smart amount search**

---

## Approach 3: Photo/Screenshot Matching (AI Vision)

### Konsep
Seller screenshot layar mutasi di app bank → upload ke CatatOrder → AI (Gemini) extract semua transaksi → auto-match ke orders.

### Technical Implementation

```
Flow:
1. Seller buka app bank, lihat mutasi
2. Screenshot (bisa multiple)
3. Buka CatatOrder → "Scan Mutasi"
4. Upload screenshots
5. Gemini Vision API extract:
   - Tanggal setiap transaksi
   - Nominal (kredit/debit)
   - Deskripsi/nama pengirim
   - Tipe transaksi
6. Filter kredit only → match ke pending orders
7. Show results → seller confirm
```

### Gemini API for This Use Case

**Kapabilitas terkini (2025-2026):**
- Gemini Pro Vision & Flash sangat mampu extract tabel dari screenshot bank
- "Layout-agnostic AI reads each statement the way a person does—understanding that a column of dates next to a column of amounts represents transactions"
- Processing time: <30 detik per screenshot
- Cost: Gemini Flash sangat murah (CatatOrder sudah pakai via OpenRouter)
- **Veryfi bahkan punya "Screenshot Detection" khusus** — mengenali screenshot bank statement vs PDF asli

**Prompt Strategy:**
```
Extract all transactions from this bank statement screenshot.
For each transaction, return:
- date (YYYY-MM-DD)
- amount (number, positive for credit/incoming)
- type: "credit" or "debit"
- description (sender name or transaction description)
Return as JSON array.
```

### Pro vs Con vs PDF Upload

| Aspek | Screenshot | PDF Upload |
|-------|-----------|------------|
| Effort user | Rendah (screenshot saja) | Medium (download file dulu) |
| Akurasi | 90-95% (tergantung kualitas screenshot) | 95-99% (structured data) |
| Privacy | Data ke Gemini API | Bisa client-side |
| Bank support | Universal (semua bank) | Perlu parser per bank |
| Multiple pages | Perlu multiple screenshots | 1 file saja |
| Cost | Gemini API call | Gratis (client-side) |

### Verdict
- **Feasibility:** HIGH — Gemini sudah sangat capable, CatatOrder sudah pakai Gemini
- **Impact:** HIGH — universal support semua bank, user-friendly
- **Effort:** MEDIUM — 2-3 hari (Gemini integration sudah ada, tinggal prompt + matching UI)
- **RECOMMENDED: YES — Bisa jadi alternative/complement ke PDF upload**

---

## Approach 4: Keyboard Overlay / Floating Widget (Android)

### Konsep
Saat seller buka app bank dan lihat mutasi, ada floating button CatatOrder. Tap → muncul mini input → ketik nominal → langsung match + mark paid tanpa berpindah app.

### Technical Reality

**Android Floating Widget:**
- Membutuhkan `SYSTEM_ALERT_WINDOW` permission
- User harus explicitly grant permission
- Implementation: WindowManager API + custom native module
- Libraries: `Floaty` (Android native), `flutter_floatwing` (Flutter)

**React Native / Expo Feasibility:**
- Expo managed workflow: **TIDAK BISA** — Expo tidak support system-level overlays
- Bare React Native: **BISA** tapi butuh custom native module (Java/Kotlin)
- Package `rn-android-overlay-permission` — handle permission check/request
- Artikel "Mastering Overlays in React Native: Android Implementation with Java" — possible tapi significant effort

**Alternative: Custom Keyboard Extension**
- Android: Custom IME (Input Method Editor) — very complex
- iOS: Custom keyboard extension — Apple restrictions sangat ketat, tidak bisa network access
- **Tidak praktis**

### CatatOrder Context
- CatatOrder = web app (Next.js), bukan native app
- Membuat floating widget = butuh native Android app terpisah
- Atau PWA + share target (sangat terbatas)

### Verdict
- **Feasibility:** LOW untuk CatatOrder (web app, bukan native)
- **Impact:** HIGH kalau bisa diimplement
- **Effort:** VERY HIGH — butuh native Android development
- **RECOMMENDED: NO — Tidak cocok untuk arsitektur CatatOrder saat ini. Revisit kalau ada native app**

---

## Approach 5: Push Notification Auto-Reading (Android)

### Konsep
CatatOrder mobile app membaca notifikasi dari app bank (BCA Mobile, BRImo, dll). Saat ada notifikasi "Transfer masuk Rp97.500 dari BUDI", CatatOrder otomatis extract dan match ke order.

### Technical Feasibility

**Library yang ada:**
- `expo-android-notification-listener-service` — Expo module khusus untuk ini
  - Install: `npm install expo-android-notification-listener-service`
  - Requires: Expo SDK 52+
  - API: `addListener("onNotificationReceived", callback)` + `setAllowedPackages()`
  - Permission: NotificationListenerService (user harus explicitly grant di Settings)
  - **Android only** — iOS tidak bisa baca notifikasi app lain

**Indonesian Bank Notification Format:**
```
BCA Mobile: "Transfer masuk Rp97.500 dari BUDI SANTOSO ke rek ***1234 pada 27/03/2026 14:30"
BRImo: "BRImo - Uang masuk Rp97.500,00 dari BUDI SANTOSO"
Mandiri: Notifikasi via WhatsApp dari 08118414000
```

**Parsing Pattern (regex):**
```javascript
// BCA pattern
/Transfer masuk Rp([\d.,]+) dari (.+?) ke/
// BRI pattern
/Uang masuk Rp([\d.,]+),?\d* dari (.+)/
// Generic
/(?:masuk|terima|received?)\s*Rp\s*([\d.,]+)/i
```

### Architecture

```
1. User install CatatOrder native app (React Native/Expo)
2. User grant NotificationListener permission
3. App sets allowed packages: ['com.bca.mobile', 'id.co.bri.brimo', ...]
4. When bank notification arrives:
   a. Extract amount + sender name
   b. Query CatatOrder API: match pending orders
   c. Show in-app notification: "Transfer Rp97.500 dari BUDI → Order #CO-260327-001234?"
   d. User tap confirm → mark paid
5. Entire flow: 0 manual steps (auto-detect + 1 tap confirm)
```

### Security & Privacy Concerns
- NotificationListenerService = sensitive permission
- User harus trust app dengan akses ke SEMUA notifikasi
- Mitigasi: hanya listen ke bank apps yang di-whitelist + show transparency UI
- Google Play policy: harus declare use + justify di privacy policy

### Verdict
- **Feasibility:** MEDIUM — technically possible tapi butuh native app
- **Impact:** VERY HIGH — paling mendekati "fully automated" tanpa bank API
- **Effort:** HIGH — butuh React Native/Expo native app build
- **RECOMMENDED: FUTURE — Ketika CatatOrder punya mobile app. Killer feature untuk diferensiasi**

---

## Approach 6: WhatsApp Message Parsing

### Konsep
Seller forward pesan notifikasi bank dari WhatsApp ke CatatOrder bot → AI parse → auto-match.

### Bagaimana Bank Indonesia Kirim Notifikasi via WA

- **BCA**: Tidak via WA (push notification app + SMS)
- **Mandiri**: Via WA dari nomor resmi 08118414000 (Mandiri Kartu Kredit)
- **BRI**: Push notification app + SMS
- **Most banks**: Lebih banyak via push notification app, bukan WA

### Implementation Options

**Option A: CatatOrder WA Bot (Fonnte/Wablas)**
```
Flow:
1. Seller dapat notifikasi bank via WA (untuk bank yang support)
2. Seller forward ke nomor CatatOrder bot
3. Bot parse pesan:
   - Extract nominal
   - Extract nama pengirim
   - Match ke pending orders
4. Bot reply: "Ditemukan order #CO-260327-001234 (Rp97.500) dari Budi. Tandai lunas? Reply 'Y'"
5. Seller reply 'Y' → done
```

**Option B: Seller forward ke grup/nomor sendiri**
- Lebih fleksibel tapi setup lebih complex

**Option C: Parse teks yang di-copy dari WA**
- Seller copy teks notifikasi → paste di CatatOrder → auto-parse
- Simpler, no bot needed

### Limitations
- Banyak bank yang TIDAK kirim notifikasi via WA (BCA, BRI pakai push notification app)
- WA bot = biaya infrastruktur (Fonnte ~Rp100K/bulan)
- CatatOrder sudah REMOVE WA Cloud API karena 0 adoption
- Forward message = extra step (tidak lebih cepat dari ketik nominal)

### Verdict
- **Feasibility:** MEDIUM
- **Impact:** LOW-MEDIUM — terbatas pada bank yang kirim via WA
- **Effort:** MEDIUM — bot setup + message parsing
- **RECOMMENDED: NO — Coverage terlalu terbatas. Smart amount search lebih universal**

---

## Approach 7: Copy-Paste dari Bank App

### Konsep
Seller buka app bank → long press transaksi → copy detail → buka CatatOrder → paste → auto-parse amount + sender.

### Technical Reality

**Clipboard Detection:**
- Web (PWA): `navigator.clipboard.readText()` — requires user permission + HTTPS
- React Native: `Clipboard.getString()` — bisa detect saat app di-foreground
- Paytm sudah implement: copy bank account → auto-fill di transfer form
- Monzo community request: paste bank details → auto-parse sort code + account number

**Masalah:**
- Kebanyakan bank app Indonesia TIDAK support copy detail transaksi (anti-screenshot/copy measure)
- BCA Mobile, BRImo: tidak bisa copy text dari layar mutasi
- Yang bisa: beberapa bank di Livin' (Mandiri), tapi terbatas

**Alternative: Smart Paste dari Screenshot Text**
- Android: "Select text from screenshot" feature (built-in Google Lens)
- Seller screenshot mutasi → select text → copy → paste di CatatOrder
- CatatOrder parse: extract nominal dari text

**Clipboard Parsing Pattern:**
```javascript
// Detect pasted text that looks like bank transfer
const bankTransferPattern = /(?:Rp|IDR)?\s*([\d.,]+)/;
const senderPattern = /(?:dari|from)\s+([A-Z\s]+)/i;

function parseClipboard(text) {
  const amount = text.match(bankTransferPattern);
  const sender = text.match(senderPattern);
  return { amount: parseAmount(amount[1]), sender: sender?.[1]?.trim() };
}
```

### Privacy Concerns
- iOS 14+ dan Android 12+: Show notification ketika app reads clipboard
- User bisa merasa tidak nyaman
- Mitigasi: hanya parse ketika user explicitly taps "Paste" button

### Verdict
- **Feasibility:** LOW-MEDIUM — bank apps Indonesia umumnya tidak support copy
- **Impact:** MEDIUM — kalau bisa, cukup cepat
- **Effort:** LOW — clipboard reading sederhana
- **RECOMMENDED: PARTIAL — Implement sebagai "bonus" di smart amount search (detect paste, auto-parse nominal)**

---

## Approach 8: QR Code + Unique Amount (Nominal Unik)

### Konsep
Setiap order di CatatOrder tampilkan nominal unik (misal Rp97.523 bukan Rp97.500). Customer transfer persis nominal itu. Matching jadi trivial karena nominal guaranteed unik.

### Bagaimana "Kode Unik" Bekerja di Indonesia

**Sudah widely adopted:**
- Tokopedia, Bukalapak, Kitabisa, Jakmall, DomaiNesia — semua pakai kode unik
- Format: 3 digit terakhir ditambahkan ke nominal (misal total Rp97.500 → transfer Rp97.523)
- Kode unik = identifier transaksi
- "Ketika transfer sesuai kode unik, pembayaran tidak perlu konfirmasi dari seller karena otomatis terverifikasi"
- Valid period: 3-14 hari (tergantung platform)

**Cara kerja:**
```
1. Customer checkout → total Rp97.500
2. Sistem generate kode unik: +23 → nominal transfer = Rp97.523
3. Customer transfer Rp97.523
4. Seller lihat mutasi Rp97.523 → guaranteed hanya 1 order yang match
5. Auto-match + mark paid
```

**Kode unik generation:**
```javascript
function generateUniqueAmount(baseAmount, existingCodes) {
  // Generate random 1-999 yang belum dipakai hari ini
  let code;
  do {
    code = Math.floor(Math.random() * 999) + 1;
  } while (existingCodes.includes(code));

  return {
    originalAmount: baseAmount,
    uniqueCode: code,
    transferAmount: baseAmount + code,
  };
}
```

### Implementation di CatatOrder

```
Database: orders table tambah kolom:
  - unique_code (smallint, nullable)
  - transfer_amount (numeric, = total + unique_code)

Order form / order link:
  - Generate unique_code saat order dibuat
  - Tampilkan: "Transfer Rp97.523 (Rp97.500 + kode unik Rp23)"
  - PENTING: nominal Rp23 dikembalikan atau di-absorb

Smart matching:
  - Seller ketik Rp97.523 → EXACT match ke 1 order (guaranteed)
  - Batch upload CSV → setiap amount match ke exactly 1 order

Collision avoidance:
  - Pool 999 kode per hari per base amount
  - Kalau ada 2 order @Rp97.500 → satu jadi Rp97.523, satu jadi Rp97.147
  - Reset pool setiap hari
```

### Status Hukum
- Paper akademis Brawijaya Law Student Journal: "STATUS HUKUM PENGGUNAAN KODE UNIK DALAM SISTEM PEMBAYARAN OLEH MARKETPLACE"
- Marketplace besar sudah pakai selama bertahun-tahun → dianggap legal
- Yang penting: transparansi ke customer bahwa ada kode unik

### Pro & Con

| Pro | Con |
|-----|-----|
| Matching jadi trivial (exact 1:1) | Customer harus transfer nominal "aneh" |
| Tidak perlu AI/OCR/API apapun | Bisa membingungkan customer yang kurang tech-savvy |
| Sudah familiar (marketplace pakai) | Rp1-999 "hilang" (absorb atau kembalikan?) |
| Combine dengan QRIS static = powerful | Hanya works kalau customer patuh transfer persis |

### Verdict
- **Feasibility:** SANGAT TINGGI — simple math, no external dependency
- **Impact:** VERY HIGH — solve matching problem at the root
- **Effort:** LOW-MEDIUM — DB migration + UI change + order link update
- **RECOMMENDED: YES — Implement di order link / public order page. Game changer untuk matching**

---

## Approach 9: Time-Based Matching

### Konsep
Gabungkan approximate time + amount + pending orders untuk narrow down matches bahkan tanpa nominal unik.

### Algorithm

```javascript
function timeBasedMatch(payment, pendingOrders) {
  const candidates = pendingOrders
    .filter(o => Math.abs(o.total - payment.amount) <= 500) // Amount fuzzy
    .map(o => ({
      order: o,
      score: calculateScore(payment, o)
    }))
    .sort((a, b) => b.score - a.score);

  return candidates;
}

function calculateScore(payment, order) {
  let score = 0;

  // Amount exactness (0-40 points)
  if (payment.amount === order.total) score += 40;
  else score += 40 - Math.abs(payment.amount - order.total) / 100;

  // Time proximity (0-30 points) — payment biasanya setelah order dibuat
  const hoursSinceOrder = (payment.time - order.created_at) / 3600000;
  if (hoursSinceOrder >= 0 && hoursSinceOrder <= 1) score += 30;
  else if (hoursSinceOrder <= 3) score += 20;
  else if (hoursSinceOrder <= 24) score += 10;

  // Customer claim (0-20 points) — customer sudah claim di public page
  if (order.payment_claimed_at) {
    const claimToPayment = Math.abs(payment.time - order.payment_claimed_at);
    if (claimToPayment <= 600000) score += 20; // Within 10 min of claim
  }

  // Delivery date (0-10 points)
  if (order.delivery_date === today) score += 10;

  return score;
}
```

### Fuzzy Matching Best Practices (dari Riset)

**Multi-pass approach (industry standard):**
1. Pass 1: Exact match (reference + amount) — auto-reconcile
2. Pass 2: Fuzzy match (date ±1 day + amount) — suggest
3. Pass 3: AI probability (historical patterns) — suggest with lower confidence

**Confidence tiers:**
- 95-100: Auto-reconcile tanpa review
- 85-94: Auto-match, periodic sampling
- 70-84: Route ke human review
- <70: Standard exception handling

**Blocking technique:** Pre-group candidates by amount ranges before expensive matching — "reducing comparison space from millions to thousands"

### Verdict
- **Feasibility:** HIGH — purely algorithmic, no external dependency
- **Impact:** MEDIUM — helps narrow down tapi tidak solve 100% (terutama kalau ada multiple orders dengan nominal sama)
- **Effort:** LOW — algorithm only
- **RECOMMENDED: YES — Embed dalam smart amount search sebagai ranking mechanism**

---

## Approach 10: "Tandai Lunas" UX Improvements

### Current State di CatatOrder
- `POST /api/orders/[id]/payment` — record payment amount
- `POST /api/orders/bulk/paid` — bulk mark as paid
- Swipe right = advance status (tapi bukan payment)
- Tidak ada dedicated payment shortcut

### UX Improvement Options

| Improvement | Deskripsi | Effort | Impact |
|-------------|-----------|--------|--------|
| **Swipe-to-pay** | Swipe left pada order card = mark paid (Google Pay style "slide to pay") | Low | High |
| **Long-press quick action** | Long press order → quick menu: "Tandai Lunas" | Low | Medium |
| **Batch select + pay** | Checkbox mode → select multiple → "Tandai Semua Lunas" (API sudah ada!) | Low | High |
| **Voice command** | "Tandai lunas order Budi" → AI parse → confirm | Medium | Medium |
| **Double-tap** | Double tap nominal → toggle paid/unpaid | Low | Medium |
| **Payment filter view** | Default view = "Belum Bayar" → focus hanya pada yang perlu action | Low | High |
| **Notification action button** | Saat ada payment claim → notification dengan "Tandai Lunas" button | Medium | High |
| **Haptic feedback** | Vibrate saat swipe complete (like Swiggy's 70% threshold) | Low | Low |

### "Slide to Pay" UX (dari riset Google Pay)

Google Pay's gesture-based UX: "Gestures that replicate physical behaviors—like passing cash—make digital interactions feel natural and intuitive."

**Recommended implementation:**
```
Swipe right = advance status (sudah ada)
Swipe LEFT = mark payment:
  - Short swipe = show payment action button
  - Full swipe = auto mark paid (with haptic + checkmark animation)
  - Confirmation: "Tandai lunas Rp97.500 untuk [Customer]?"
```

**Swipe completion threshold:** Swiggy found users don't swipe to 100%. Set completion at 70% of swipe distance with haptic feedback at that point.

### Payment-Focused View

```
New view: "Perlu Dibayar" (tab di pesanan list)
  - Filter: payment_status IN ('unpaid', 'partial')
  - Sort: delivery_date ASC (yang paling urgent di atas)
  - Each card shows: Customer name, amount due, delivery date
  - Swipe left = mark paid
  - Long press = partial payment
  - Batch select available
```

### Verdict
- **Feasibility:** SANGAT TINGGI — purely UI changes
- **Impact:** MEDIUM-HIGH — faster existing flow, tapi tidak solve matching problem
- **Effort:** LOW — 1-2 hari
- **RECOMMENDED: YES — Quick wins, implement bersama smart amount search**

---

## Competitor Analysis

### Opaper (F&B Indonesia)
- **Model:** Integrated POS + payment via Xendit (payment gateway)
- **Payment confirmation:** Customer order via QR self-order → bayar via Xendit (credit card, e-wallet, bank transfer, QRIS)
- **Verification:** Otomatis via Xendit webhook — seller tidak perlu manual verify
- **Limitation:** Fokus dine-in/self-order, bukan WA commerce. Butuh integrasi Xendit
- **Learning:** Mereka solve verification dengan payment gateway integration, bukan smart matching. Berbeda konteks dari CatatOrder (WA commerce + transfer bank)

### BukuWarung / Tokoko
- **Model:** Warung digitization + B2B marketplace (Tokoko)
- **Payment flow:** Customer order di Tokoko → bayar ke bank account yang diinfokan via WA → kirim bukti transfer via WA ke tim BukuWarung
- **Verification:** TIM BUKUWARUNG yang verify (bukan seller individual)! Mereka punya dedicated team
- **Feature "TalanginDulu":** Buy now pay later untuk stok — BukuWarung yang advance uang, seller bayar nanti
- **Settlement:** Max 7 hari kerja setelah transaksi selesai
- **Learning:** BukuWarung juga MANUAL verification — mereka solve dengan HUMANS (dedicated team), bukan teknologi. Tidak scalable untuk seller independent

### Juragan DOKU
- **Model:** Payment acceptance platform untuk social sellers + UMKM
- **Features:** Payment link, e-katalog, QRIS, Instant Checkout (dari IG Story)
- **Payment verification:** Otomatis via DOKU payment infrastructure — customer bayar via payment link/QRIS, DOKU confirm ke seller
- **Key feature:** "Instant checkout" dari IG Story — share link, customer bayar, auto-confirm
- **Pricing:** Per transaction (DOKU standard fees)
- **Learning:** Solve verification via payment gateway. Tapi hanya untuk pembayaran VIA payment link — kalau customer transfer langsung ke rekening seller, sama manualnya

### Kasir Pintar / Kasflo / iReap
- **Model:** POS apps untuk UMKM
- **Payment:** Fokus cash + QRIS di toko fisik
- **Verification:** Untuk QRIS = auto (via aggregator). Untuk transfer bank = manual
- **Learning:** Tidak solve WA commerce payment verification sama sekali

### International: Tidio / Chatwoot (WA Commerce Tools)
- **Model:** Chat commerce + chatbot
- **Payment:** Integrate payment link (Stripe, PayPal)
- **Learning:** Semua WA commerce tool internasional solve payment dengan payment link integration, bukan manual verification. Indonesia unique karena dominasi transfer bank langsung

### Key Insight dari Competitor Analysis

```
TIDAK ADA competitor yang solve "smart manual matching" untuk transfer bank.

Semua yang solve verification = menggunakan payment gateway/link (Xendit, DOKU, Stripe).
Yang tidak pakai payment gateway = manual verification (BukuWarung pakai tim dedicated).

CatatOrder's "smart manual matching" = UNOCCUPIED TERRITORY.
Ini bisa jadi genuine competitive advantage.
```

---

## Pendekatan Lain yang Relevan

### "Kode Unik" + Smart Search = Killer Combo

```
Scenario A: Order via order link (CatatOrder generate)
  → Nominal unik otomatis (Rp97.523)
  → Seller ketik 97523 di search → 1 exact match → 1 tap → done

Scenario B: Order manual (seller input di CatatOrder)
  → Nominal bisa sama dengan order lain
  → Seller ketik nominal → multiple matches → pilih berdasarkan customer name
  → Atau: gunakan time-based scoring untuk suggest best match

Scenario C: Batch reconciliation (akhir hari)
  → Upload CSV/screenshot
  → Nominal unik: auto-match semua
  → Nominal non-unik: suggest candidates, seller confirm
```

### Payment Claim dari Customer (Sudah Ada — Bisa Enhanced)

CatatOrder sudah punya `payment_claimed_at`. Customer bisa claim "sudah bayar" di public order page.

**Enhancement:**
```
1. Customer transfer → buka halaman pesanan → tap "Saya Sudah Bayar"
2. Form: masukkan nominal yang ditransfer + nama rekening pengirim
3. CatatOrder kirim notifikasi ke seller: "Budi claim sudah bayar Rp97.523 untuk order #XYZ"
4. Seller buka mutasi bank → cari Rp97.523 → confirm
5. ATAU: combine dengan bank notification auto-read → auto-confirm
```

Ini reduce seller's effort dari "cari di chat WA siapa yang sudah bayar" ke "notification langsung bilang siapa bayar berapa".

---

## Priority Ranking & Implementation Roadmap

### Fase 1: Quick Wins (1-3 hari)

| # | Feature | Impact | Effort | Dependencies |
|---|---------|--------|--------|-------------|
| 1 | **Smart Amount Search** | HIGH | LOW | None |
| 2 | **"Perlu Dibayar" filter view** | HIGH | LOW | None |
| 3 | **Swipe-to-pay gesture** | MEDIUM-HIGH | LOW | None |
| 4 | **Batch select + mark paid UI** | HIGH | LOW | API sudah ada |

### Fase 2: Nominal Unik (3-5 hari)

| # | Feature | Impact | Effort | Dependencies |
|---|---------|--------|--------|-------------|
| 5 | **Kode unik di order link** | VERY HIGH | MEDIUM | DB migration |
| 6 | **Payment claim enhancement** | MEDIUM | LOW | Existing feature |
| 7 | **Time-based scoring** | MEDIUM | LOW | Smart search |

### Fase 3: AI-Powered (5-10 hari)

| # | Feature | Impact | Effort | Dependencies |
|---|---------|--------|--------|-------------|
| 8 | **Screenshot → Gemini → match** | HIGH | MEDIUM | Gemini integration |
| 9 | **CSV/PDF upload → match** | VERY HIGH | MEDIUM-HIGH | Parser per bank |
| 10 | **Clipboard paste detection** | LOW-MEDIUM | LOW | Smart search |

### Fase 4: Native Mobile (Future)

| # | Feature | Impact | Effort | Dependencies |
|---|---------|--------|--------|-------------|
| 11 | **Bank notification auto-read** | VERY HIGH | HIGH | Native mobile app |
| 12 | **Floating widget** | HIGH | VERY HIGH | Native mobile app |

---

## Rekomendasi Utama

### Must-Do (Fase 1 — Minggu ini)

**1. Smart Amount Search Bar**
- Seller ketik nominal → instant show matching orders
- Scoring: exact > remaining > fuzzy > time-weighted
- 1 tap confirm
- **Effort: 1 hari. Impact: Dari 5 langkah jadi 2.**

**2. Nominal Unik di Order Link**
- Setiap order via order link dapat unique amount
- Matching jadi trivial: 1 amount = 1 order
- Sudah proven di marketplace besar Indonesia
- **Effort: 2-3 hari. Impact: Solve matching problem at the root.**

### Should-Do (Fase 2-3 — 2 minggu ke depan)

**3. Screenshot → Gemini → Auto-Match**
- Universal (semua bank), user-friendly
- CatatOrder sudah pakai Gemini
- **Effort: 2-3 hari. Impact: Batch verification sekaligus.**

**4. "Perlu Dibayar" view + Swipe-to-pay**
- Faster existing flow
- **Effort: 1 hari. Impact: Quality of life improvement.**

### Skip (For Now)

- WA message parsing — coverage terlalu terbatas
- Floating widget — butuh native app
- Clipboard auto-read — bank apps Indonesia tidak support copy
- Bank notification reading — butuh native app, privacy concerns

---

## Competitive Moat Analysis

```
Saat ini:
  - Opaper, Juragan DOKU → solve via payment gateway (butuh integrasi)
  - BukuWarung → solve via dedicated human team
  - Moota → solve deteksi mutasi tapi TIDAK matching ke order
  - CatatOrder → belum solve

Setelah implement smart matching:
  - CatatOrder = SATU-SATUNYA yang solve matching mutasi↔order tanpa payment gateway
  - Combine order management + smart payment verification = unique value prop
  - Nominal unik = deterministic matching (bukan probabilistic)
  - Screenshot AI = works with ANY bank (universal)

Messaging:
  "Ketik nominal dari mutasi bank → CatatOrder langsung tahu order mana yang bayar."
  "Tidak perlu Moota. Tidak perlu payment gateway. Cukup CatatOrder."
```

---

## Data Architecture

### Perubahan Database yang Diperlukan

```sql
-- Tambahan kolom di orders table
ALTER TABLE orders ADD COLUMN unique_code smallint;
ALTER TABLE orders ADD COLUMN transfer_amount numeric;

-- Index untuk fast amount lookup
CREATE INDEX idx_orders_transfer_amount ON orders(user_id, transfer_amount)
  WHERE payment_status != 'paid' AND status != 'cancelled';

CREATE INDEX idx_orders_total_unpaid ON orders(user_id, total)
  WHERE payment_status != 'paid' AND status != 'cancelled';
```

### API Endpoints Baru

```
GET  /api/orders/match?amount=97523          → return matching orders (scored)
POST /api/orders/match-batch                  → upload parsed transactions, return matches
POST /api/orders/parse-screenshot             → upload image, Gemini extract, return matches
```

---

## Sources

### Smart Amount Matching & Reconciliation
- [Fuzzy Matching Algorithms in Bank Reconciliation](https://optimus.tech/blog/fuzzy-matching-algorithms-in-bank-reconciliation-when-exact-match-fails)
- [Smart Transaction Matching | Zone & Co](https://www.zoneandco.com/glossary/smart-transaction-matching)
- [Payment Reconciliation Process Guide](https://www.solvexia.com/blog/payment-reconciliation-process)
- [Building an Automatic Reconciliation Engine | Midday](https://midday.ai/updates/automatic-reconciliation-engine/)

### Bank Statement Parsing (Indonesia)
- [Startkit e-Statement Converter](https://startkit.tech/bank-statement-converter) — BCA, BNI, BRI, Mandiri, Jenius, Bank Jago, Seabank, CIMB Niaga
- [AI Bank Statement Indonesia](https://aibankstatement.com/indonesia) — 13 bank, 95%+ accuracy
- [BCA PDF eStatement Extractor (Open Source)](https://github.com/benedictjohannes/bca-pdfestatement-extractor)
- [Ducksheets Bank Statement Parser](https://www.ducksheets.com/)

### AI/OCR for Bank Statements
- [How OCR & AI Are Automating Bank Statement Reconciliation](https://medium.com/@webelightsolutions/how-ocr-ai-are-automating-bank-statement-reconciliation-b122e9ab0dc1)
- [Why Gemini API is Best for OCR](https://the-rogue-marketing.github.io/why-google-gemini-2.5-pro-api-provides-best-and-cost-effective-solution-for-ocr-and-document-intelligence/)
- [Gemini OCR for Bank Statements (n8n workflow)](https://n8n.io/workflows/2421-transcribing-bank-statements-to-markdown-using-gemini-vision-ai/)
- [Bank Statement OCR API | Veryfi](https://www.veryfi.com/bank-statements-ocr-api/) — includes screenshot detection

### Notification Listener (Android)
- [expo-android-notification-listener-service](https://github.com/SeokyoungYou/expo-android-notification-listener-service) — Expo SDK 52+, Android only
- [rn-android-overlay-permission](https://www.npmjs.com/package/rn-android-overlay-permission)
- [Mastering Overlays in React Native: Android](https://dev.to/prathees31/mastering-overlays-in-react-native-android-implementation-with-java-n2i)

### Nominal Unik (Kode Unik) Indonesia
- [Tokopedia: Manfaat Kode Unik untuk Keamanan Pembayaran](https://www.tokopedia.com/blog/manfaat-kode-unik-untuk-keamanan-pembayaran/)
- [Kitabisa: Apa itu Kode Unik?](https://kitabisa.zendesk.com/hc/en-us/articles/360000367973-Apa-itu-kode-unik)
- [Jakmall: Kode Unik dan Berita Transfer](https://help.jakmall.com/en/pembayaran/kode-unik-dan-berita-transfer)
- [Jetorbit: Fungsi Kode Unik Pembayaran](https://www.jetorbit.com/panduan/mengenal-fungsi-kode-unik-pada-pembayaran/)
- [DomaiNesia: Pembayaran Kode Unik BCA](https://www.domainesia.com/panduan/pembayaran-kode-unik-bank-bca/)

### UX Patterns
- [Google Pay Gesture-Based UX](https://medium.com/@kvividsnaps/why-google-pays-gesture-based-ux-feels-so-effortless-4e09f877caeb)
- [Swipe-to-Delete/Reveal Interactions](https://blog.logrocket.com/ux-design/accessible-swipe-contextual-action-triggers/)
- [Healthy Friction in UX (Swiggy)](https://medium.com/swiggydesign/healthy-friction-in-ux-a46c800cb479)
- [Payment Button Design Best Practices](https://uxplanet.org/payment-button-design-best-practices-57a9022645ca)

### Competitor Apps
- [Opaper Features](https://www.opaper.app/en/features)
- [BukuWarung / Tokoko Payment Flow](https://belajar.tokoko.id/fitur-pembayaran-talangin-dulu/)
- [Juragan DOKU](https://www.doku.com/blog/juragan-doku-solusi-terima-pembayaran-untuk-digitalisasi-umkm-terima-pembayaran)
- [WhatsApp Payment Bot (GitHub)](https://github.com/paulnegz/whatsapp-payment-bot) — Selenium + Tesseract OCR

### WA Commerce & Payment
- [WhatsApp Chatbot for Banking](https://marutitech.com/whatsapp-chatbot-for-banking/)
- [Fonnte WA API Gateway Indonesia](https://fonnte.com/)
- [Wablas WA API Gateway](https://wablas.com/)

### Clipboard & Copy-Paste
- [Paytm Auto-Fill Bank Details via Copy-Paste](https://paytm.com/blog/paytm-help/auto-fill-bank-details-on-paytm-using-copy-paste/)
- [Monzo: Paste and Parse Bank Details](https://community.monzo.com/t/paste-and-autofill-payees-bank-details/75632)

---

*Riset dilakukan 2026-03-27. Semua pendekatan dievaluasi untuk konteks CatatOrder: web app (Next.js), target UMKM Indonesia, dominasi transfer bank manual, tanpa integrasi bank API/payment gateway.*
