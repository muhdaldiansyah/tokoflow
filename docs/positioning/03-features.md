# 03 · Features

> Apa yang Tokoflow lakukan, dan dengan disiplin apa yang **tidak** dilakukan.

---

## Feature Philosophy

Setiap fitur harus lulus **Test 0** dulu (mendahului 5 tests lain):

> **Test 0**: Apakah ini hit salah satu dari [Three-Tier Reality](./00-manifesto.md#the-three-tier-reality)?
> - Mengembalikan waktu untuk **Pure Craft** (Tier 1), atau
> - Melindungi & mengamplifi **Customer Relationship** (Tier 2), atau
> - Menghapus **Mechanical Residue** (Tier 3) invisibly

Gagal Test 0 → potong. Tanpa pengecualian.

Lalu lulus [5 tests lain](./00-manifesto.md#the-5-tests):
1. Apakah ini melayani kebutuhan manusia yang nyata?
2. Apakah ini terasa intuitif tanpa penjelasan?
3. Apakah ini menciptakan momen empati?
4. Apakah ini menghilangkan friction, bukan menambah?
5. Apakah ini memuliakan user?

Gagal salah satu = **potong atau rancang ulang**.

---

## 3-Tier Feature Classification

Setiap fitur Tokoflow masuk ke salah satu dari 3 tier — dan tier menentukan **autonomy level + trust risk + AI cost profile**:

| Tier | Layer | Autonomy | Customer sees? | Trust risk | AI cost |
|---|---|---|---|---|---|
| **3 — Mechanical Residue** | Background Twin | Fully autonomous | NO (invisible) | Low | Low (background ops) |
| **2 — Customer Relationship** | Foreground Assist | Suggests, merchant decides + sends | NO (merchant face) | Medium-managed | Medium (drafts + judgment) |
| **1 — Pure Craft** | Tokoflow doesn't enter | None | N/A | None — sacred | Zero |

**Rule of thumb**: setiap feature placement DILEMMA → default ke Tier yang lebih konservatif (Tier 3 → Tier 2 → eject). Better small autonomous than big risky.

---

## Architecture: Web + Mobile

### Web App (`tokoflow.com`)

**Primary use**: Buyer storefront (customer order link)
**Secondary use**: Seller alternative (untuk batch operations, desktop work)

| Use case | Web app role |
|---|---|
| Buyer click link from IG/TikTok bio | ✅ Primary—zero install friction |
| Buyer order, pay, track | ✅ Primary |
| Seller manage from desktop | ✅ Available—untuk multi-staff or batch work |
| Seller daily driver | ⚠️ Acceptable but mobile is better |

### Mobile App (Tokoflow App)

**Primary use**: Seller daily driver (immersive, Apple-grade experience)
**Secondary use**: None (no buyer mobile app)

| Use case | Mobile app role |
|---|---|
| Seller 1-photo onboarding | ✅ Primary—native camera optimal |
| Seller voice ask | ✅ Primary—native mic |
| Seller pesanan vibrate | ✅ Primary—native haptic |
| Seller daily summary | ✅ Primary—push notif reliable |
| Buyer order | ❌ Not built—web is enough |

### NEVER Build

- ❌ Buyer mobile app (forever; web is the buyer experience)
- ❌ Desktop app for seller (web responsive is enough)
- ❌ Wearable app (Apple Watch, etc.)—Phase 5+ at earliest

---

## Features by User Journey

### A. Setup — "The Photo Magic" (60 detik) [TIER 3 — extraction only]

> **Refined 2026-04-28**: Photo Magic v1 reframed dari "AI generate beautiful product photo + beautify" → "AI **extract** inventory metadata, leaves photo untouched." Kitchen line preserved — photo IS part of merchant's craft and brand, we don't enter it.

| Fitur | Tier | Description |
|---|:---:|---|
| **1-Photo Inventory Extraction** | 3 | Foto dapur/dagangan → AI parse: produk apa, harga estimasi peer-benchmark, kategori. **Photo itself stays untouched and merchant's.** |
| **Voice Setup Fallback** | 3 | Tap mic kalau prefer ngomong: "Saya jual nasi goreng RM 12, mie ayam RM 10" |
| **Smart Defaults from Context** | 3 | Lokasi (GPS), waktu, foto → AI infer business type, jam buka, currency |
| **One-Tap Share** | 3 | Setelah toko jadi, share ke IG/TikTok/WA dengan 1 tombol |

**Anti-features (sengaja TIDAK ada):**
- ❌ Multi-step setup wizard
- ❌ "Pilih business type" (AI yang infer dari foto)
- ❌ Setup checklist "lengkapi profil 70%"
- ❌ "Verifikasi email/phone first"
- ❌ Domain/slug customization manual (auto-generated)
- ❌ ~~AI photo beautification/regeneration~~ — **REMOVED (kitchen-protection)**: foto IS part of merchant's craft. Tokoflow extracts metadata, doesn't replace visuals.

---

### B. Sell — "The Storefront" (link yang manusiawi)

| Fitur | Lulus 5 tests | Description |
|---|:---:|---|
| **Beautiful Shop Page** | ✅ | Foto pemilik + cerita 2-3 kalimat + menu visual |
| **AI Hybrid Order Flow** | ✅ | Visual menu default, conversational AI untuk Q&A & custom request |
| **Personal Story Block** | ✅ | "Saya Aisyah, sudah 5 tahun bikin kek lapis. Resep nenek." |
| **Instant Payment** | ✅ | DuitNow QR / FPX / cards (MY) / QRIS (ID later)—satu link, 30 detik |
| **Reorder One-Tap** | ✅ | Returning customer: "Pesen yang sama seperti minggu lalu?" |
| **Customer Notification (auto)** | ✅ | "Pesanan kamu sudah siap, kurir on the way" |
| **Customer Reorder Tracking** | ✅ | Phone-based (no signup), lihat past 5 orders + 1-tap reorder |

**Anti-features:**
- ❌ Customer signup wajib
- ❌ Cookie banner besar
- ❌ Newsletter pop-up
- ❌ "Sign in to save your address" (cookie-based saja)
- ❌ Discount banner nyolok ("10% off!")
- ❌ Spam upsell di order flow
- ❌ Heavy theme customization (curated 3-5 themes saja, Apple-style)

**Cuts dari spec sebelumnya:**
- ⛔ **Smart Bundling auto-detect** — terlalu clever, observe dulu sebelum ship
- ⛔ **Multi-Inlet day 1** — WA Coexistence defer ke Phase 3, focus link-first dulu

---

### C. Fulfill — "Invisible Mode" (owner masak, Tokoflow urus)

**Important refinement (2026-04-28):** previously "AI Customer Assistant" claimed AI auto-replies chat customer. **Refined to Tier 2 (Foreground Assist):** AI **suggests** replies, merchant **sends**. Customer-facing layer stays merchant-controlled. Trust transfer protected.

| Fitur | Tier | Description |
|---|:---:|---|
| **Customer Reply Suggestions** (Tier 2 — refined) | 2 | AI draft replies untuk Q&A standar. Merchant tap "send" (in-app, copy-to-WA hybrid Phase 1). Bukan auto-send. |
| **Pattern Surfacing** | 2 | "Pak Andi balik lagi (5x)"—AI notice, merchant decide what to do |
| **The Vibrate** | 2 | Pesanan masuk → HP getar halus 1x (no sound default). Tier 2 awareness. |
| **The Swipe Forward** | 2 | Swipe kanan = advance status (1 gesture per langkah). Tier 2 maintenance. |
| **Status Update Sending** | 3 | Background Twin auto-send "siap untuk pickup" sekali merchant swipe forward (status update is mechanical, not relational nuance) |
| **Quiet Hours by Default** | — | 22:00-06:00 MYT default. Background Twin respects this. |
| **Status Workflow (5 stages)** | 2 | Diterima → Mulai masak → Siap → Antar → Selesai |
| **Stock Auto-Decrement** | 3 | Background Twin (already shipped) |

**Anti-features:**
- ❌ Sound notif default ON—jangan, ganggu flow masak
- ❌ Multi-staff phone+PIN — defer ke Phase 3
- ❌ Banner "complete profile" / "verify" persistent
- ❌ Push notif marketing dari Tokoflow
- ❌ "Streaks" / gamification yang membuat owner anxious kalau skip hari
- ❌ Required action prompts setiap login

---

### D. Companion — "The Voice Ask" (AI sebagai presence)

| Fitur | Lulus 5 tests | Description |
|---|:---:|---|
| **Conversational Backend** | ✅ | Tap mic, ngomong: "Tambah menu ayam crispy 27 ringgit" → AI eksekusi |
| **Voice or Text Toggle** | ✅ | Owner pilih, default voice |
| **Inventory Photo Tracking** | ✅ | Foto restock → AI track stok, no manual entry |
| **Smart Reminders (gentle)** | ✅ | "Ayam tinggal sedikit, mau saya ingatkan ke supplier?"—optional, dismissable |
| **Pricing Whisper** | ✅ | 1x/minggu max: "Peer di Shah Alam jual kuih lapis RM 6, kamu RM 5. Mungkin masih bisa naik."—gentle, optional |

**Cuts dari spec sebelumnya:**
- ⛔ **Customer Insights data-y dashboard** — terlalu data-y, ganti jadi "Weekly Story"
- ⛔ **Pricing Compass dengan traffic light merah-kuning-hijau** — bisa bikin anxious, ganti "whisper" tone
- ⛔ **Health Score 0-100** — feels like grading, ganti "Cerita Pertumbuhanmu" (narrative)

**Anti-features:**
- ❌ Dashboard penuh angka & chart
- ❌ "Insights" yang menyalahkan ("kamu kehilangan RM 200 minggu ini karena lambat balas")
- ❌ Comparison yang shaming ("kamu di bawah rata-rata peer")
- ❌ Voice yang require "Hey Tokoflow" wake word

---

### E. Grow — "The Evening Embrace" (dignifying analytics)

| Fitur | Lulus 5 tests | Description |
|---|:---:|---|
| **Daily Summary (Sore Hari)** | ✅ | Notif setelah jam tutup: cerita hari ini dengan tone hangat |
| **Weekly Story** | ✅ | Sekali seminggu: "Minggu ini 3 customer pertama kali, semua suka." |
| **Customer Recognition** | ✅ | "Pak Andi sudah order 5x, mau saya kirim 'thank you' message?" |
| **Seasonal Awareness** | ✅ | "Ramadan dalam 2 minggu. Mau saya bantu siapkan menu takjil?" |
| **Anniversary Recognition** | ✅ | 1 tahun, 3 tahun, 5 tahun—dignifying milestone |

Sample copy & full empathy moments di [`02-product-soul.md`](./02-product-soul.md#the-7-empathy-moments).

**Anti-features:**
- ❌ Negative comparison ("kamu di bawah X peer")
- ❌ Streaks yang bikin guilty kalau libur sehari
- ❌ "You missed your goal" notifications
- ❌ Push notif setiap 2 jam dengan stat
- ❌ Detailed analytics dashboard (charts, graphs)
- ❌ Export to Excel default (defer to Pro/Business if asked)

---

### F. Silent Superpower — "Compliance & Money" (di balik layar) [TIER 3]

Ini fitur yang **tidak diiklankan**, tapi membuat Tokoflow defensible. **Semua Tier 3 (Background Twin, fully autonomous, invisible).** Lulus Test 0 dengan menghapus Mechanical Residue.

> **Refined 2026-04-28**: Tax/LHDN demoted from Phase 1 hero → Pro/Business tier feature, gated to merchants who approach threshold. SST RM 500K threshold means most home F&B mompreneur Year 1 don't hit. Don't pre-build tax UI for merchants who'll never use it.

#### Phase 1 (Background Twin, all tiers)

| Fitur | Tier | Description |
|---|:---:|---|
| **Auto Invoice Numbering** | 3 | Setiap order → invoice generated silently. Background Twin. |
| **Auto Payment Matching** | 3 | Bank notification → matched ke order. Background Twin. |
| **Receipt PDF Generation** | 3 | Auto-generate beautiful PDF receipt. Background Twin. |
| **Stock Auto-Decrement** | 3 | Already shipped. Background Twin. |
| **Customer Relationship Memory** | 3 | Auto-tag pelanggan setia, custom request history. Background Twin. |

#### Pro/Business tier only (gated, surface when merchant approaches threshold)

| Fitur | Tier | Gating logic |
|---|:---:|---|
| **LHDN MyInvois Auto-Submit** | 3 | Surfaced only when merchant approaches LHDN threshold OR explicitly enables. Free tier merchants never see this. |
| **SST/PPN Auto-Calculator** | 3 | Surfaced only when merchant approaches SST RM 500K threshold. |
| **Tax Reminder (Soft)** | 3 | Active for Pro+ merchants who registered SST. |
| **e-Faktur Coretax Indonesia** | 3 | Phase 5 (Indonesia migration). Same gating logic. |

**Anti-features:**
- ❌ Compliance checkbox wizard yang scary
- ❌ TIN/BRN/SST input form yang besar di hero
- ❌ "Verify your tax info to continue" gates
- ❌ Compliance jadi pilar marketing (silent superpower, bukan hero)

---

## Comprehensive Anti-Features List

Sama pentingnya dengan fitur. Apple bilang "no" ke 1000 hal. Berikut yang Tokoflow secara sadar **tidak akan pernah** bangun:

### Engagement & Marketing Anti-features
- ❌ Streaks (hari ke-X jualan tanpa libur)
- ❌ Gamification (badges, points, levels)
- ❌ Push notif marketing dari Tokoflow
- ❌ "Refer & earn RM 50" yang nyolok di dashboard (referral OK, tapi subtle)
- ❌ Email marketing weekly newsletter ke seller (mereka udah cukup notif)

### Anxiety-Inducing UI
- ❌ Red badges / counters yang nyolok
- ❌ "47/50 orders used" warning
- ❌ Comparison shaming ("you're below average")
- ❌ Negative trending arrows
- ❌ "You missed your goal" notifications
- ❌ Countdown timer untuk trial expiration

### Friction
- ❌ Multi-step setup wizard
- ❌ Email verification gates
- ❌ Customer signup untuk order (zero friction!)
- ❌ Cookie banner mengganggu
- ❌ Newsletter pop-up
- ❌ "Complete your profile" prompt persistent

### Technical Jargon di User-facing UI
- ❌ "Slug," "API," "webhook," "domain"
- ❌ "Merchant ID," "transaction code"
- ❌ "TIN," "BRN," "SST" muncul sebelum dibutuhkan
- ❌ Error codes ("Error 404") tanpa human translation

### Disrespecting Time
- ❌ Notif di luar quiet hours
- ❌ Auto-bill renewal tanpa reminder
- ❌ "Required action" interruption setiap login
- ❌ Forced tutorial walkthrough

### Heavy Customization
- ❌ Custom CSS untuk shop page
- ❌ Plugin/extension marketplace
- ❌ White-label option (kecuali enterprise B2B Phase 5+)
- ❌ 50 theme options (curated 3-5 saja)

### Buyer-side Anti-features
- ❌ Buyer signup
- ❌ Buyer mobile app
- ❌ Buyer "saved cards"—handled di payment provider (Billplz/Midtrans)
- ❌ Buyer review system (Phase 3+ if ever)

---

## Roadmap Notes

Phase mapping per fitur—detail di [`06-roadmap.md`](./06-roadmap.md):

- **Phase 0-1 (now-Jul 2026)**: Web app polish, 1-photo onboarding (PWA-grade), AI customer assistant, beautiful shop page
- **Phase 2 (Aug-Oct 2026)**: Mobile app native (port from catatorder-app), voice ask, vibrate, swipe forward
- **Phase 3 (Nov 2026-Mar 2027)**: WA Coexistence (optional inlet), Pricing Whisper, advanced empathy moments
- **Phase 4 (Apr-Dec 2027)**: SEA expansion, voice phone AI inlet (optional)
- **Phase 5 (2028+)**: Indonesia migration, Western pre-pilot

---

## Cross-references

- Why these features (philosophy): [`00-manifesto.md`](./00-manifesto.md)
- Who these features serve: [`01-positioning.md`](./01-positioning.md)
- Soul of the product (5 iconic interactions): [`02-product-soul.md`](./02-product-soul.md)
- Visual & motion specs: [`04-design-system.md`](./04-design-system.md)
- Pricing tiers: [`05-pricing.md`](./05-pricing.md)

---

*Versi 1.2 · 28 April 2026 · Setiap fitur baru harus pass Test 0 (Three-Tier hit) + 5 tests + tidak melanggar anti-features list.*

*Changelog 1.1 (earlier same day):* Added Test 0 (Three-Tier Reality gate). Added 3-Tier Feature Classification table. Refined "AI Customer Assistant" from Tier 3 (autonomous reply) → Tier 2 (Foreground Assist: suggests, merchant sends). Trust transfer issue resolved by scope reduction. See `07-decisions.md` D-014.

*Changelog 1.2:* Photo Magic v1 reframed extraction-only — AI parses inventory/pricing from photo, **leaves photo untouched** (kitchen-protection). LHDN MyInvois demoted from Phase 1 hero to Pro/Business gated feature (SST RM 500K threshold means most Year 1 mompreneur don't hit). Added "Auto Beautify Photos" to anti-features list explicitly. Critique-driven 2026-04-28.
