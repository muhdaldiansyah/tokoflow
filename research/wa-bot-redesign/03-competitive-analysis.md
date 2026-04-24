# 03 — Competitive Analysis: WA Ordering di Indonesia & Global

> Bagaimana pemain lain handle WhatsApp ordering? Apakah WA bot ordering terbukti berhasil? Data dari Indonesia, Brazil, dan India.

---

## 1. GoFood & GrabFood: TIDAK Pakai WA Bot untuk Ordering

**Fakta:** GoFood (market leader Indonesia, 37-39% market share) dan GrabFood TIDAK menggunakan WhatsApp untuk menerima pesanan. WhatsApp hanya digunakan untuk:
- Notifikasi status pesanan
- Customer support
- Promo/broadcast

**Kenapa mereka tidak pakai WA bot ordering:**
- Mereka punya dedicated app dengan UX yang dioptimalkan untuk ordering
- WA chat = unstructured data → sulit di-operasionalize untuk kitchen display, driver assignment, payment
- Mereka butuh control atas UX (branding, payment integration, loyalty points)
- Volume terlalu tinggi untuk conversational flow

**Implikasi untuk CatatOrder:**
- Kalau pemain terbesar di Indonesia tidak pakai WA bot untuk ordering, ini bukan karena mereka tidak bisa — mereka MEMILIH tidak. Ordering butuh structured flow, bukan conversation.

Sources:
- [Campaign Asia: GrabFood vs GoFood rivalry](https://www.campaignasia.com/article/grabfood-versus-gofood-the-rivalry-only-escalates-in-indonesia/473351)
- [Suara.com: GoFood #1 di Indonesia 2025](https://www.suara.com/bisnis/2025/05/07/132311/gofood-jadi-layanan-ofd-terpopuler-versi-jakpat-2025-ungguli-shopeefood-dan-grabfood)

---

## 2. UMKM Indonesia: Manual Chat + Link Order

### Cara UMKM F&B Sebenarnya Terima Pesanan WA

Pattern dominan yang terbukti berhasil di lapangan:

```
PATTERN 1: Manual Chat (mayoritas UMKM)
  Customer chat WA → Owner baca → balas manual → catat pesanan
  Pro: Personal, fleksibel, bisa handle request custom
  Kontra: Capek, salah catat, tidak scalable

PATTERN 2: Link Order (growing trend)
  Customer chat WA → Owner reply dengan link → customer isi form → order masuk
  Pro: Terstruktur, tidak salah catat, scalable
  Kontra: 1 extra step (buka browser)
  Contoh: DOKU link order, Linktree ke Google Form, CatatOrder link toko

PATTERN 3: Keyboard Helper (Selly → QuickOrder)
  Owner tetap manual, tapi pakai keyboard app untuk quick reply + template
  Pro: Cepat reply, invoice otomatis, cek ongkir
  Kontra: Masih manual, hanya tools untuk owner bukan automation
  Contoh: Selly (tutup), QuickOrder (pengganti Selly), Kirimi

PATTERN 4: WA Business Catalog (gratis, tanpa API)
  Owner upload produk di catalog WA Business → customer browse → tap "Chat"
  Pro: Gratis, native, visual
  Kontra: Tidak ada order form — customer masih harus chat untuk pesan

PATTERN 5: WA Bot (sangat jarang untuk UMKM)
  Bot otomatis terima pesanan via chat
  Pro: 24/7, automatic
  Kontra: Mahal (BSP fee), kompleks, intent detection problem
  Contoh: FoodBuzz.id (project GitHub, bukan produk komersial)
```

**Data:**
- Pattern 1 dan 2 = **dominant** di UMKM Indonesia
- Pattern 5 (WA bot) = **sangat jarang** — hanya ditemukan sebagai project tech/demo, bukan produk UMKM yang berhasil
- Selly (keyboard helper terpopuler) **sudah tutup** — digantikan QuickOrder
- WhatsApp Business Summit 2025: fokus pada fitur gratis (catalog, auto-reply, labels), bukan bot

Sources:
- [totabuan.news: QuickOrder pengganti Selly](https://totabuan.news/2025/08/tenang-sekarang-ada-quickorder-aplikasi-keyboard-pengganti-selly-yang-bisa-bantu-seller-umkm-makin-satset-jualannya/)
- [DOKU: Link order WhatsApp](https://www.doku.com/en-us/blog/cara-membuat-link-order-whatsapp)
- [Kasir Pintar: Strategi jualan WA+IG untuk UMKM](https://kasirpintar.co.id/solusi/detail/pakai-whatsapp-instagram-ini-strategi-jualan-yang-cocok-untuk-umkm)
- [GitHub: FoodBuzz.id WA Bot UMKM](https://github.com/zharmedia386/foodbuzz)

---

## 3. International Precedent: Brazil & India

### Brazil — WhatsApp Commerce Leader

- **80% orang Brazil** pakai WhatsApp untuk purchase
- WhatsApp = platform food ordering ke-3 terpopuler di Brazil (2021)
- Meta launch **Directory** feature di Brazil — cari bisnis, tambah item, bayar di dalam app
- Pattern UMKM Brazil: kirim menu PDF via WA → customer reply → manual process
- WhatsApp Payment sudah live di Brazil (2023)

**Key insight:** Bahkan di Brazil (market WA commerce paling mature), ordering tetap **semi-manual** untuk small business. Bot bukan pattern dominan — yang dominan adalah **catalog + payment di dalam WA**.

### India — WhatsApp + JioMart

- 96% pengguna smartphone di India pakai WhatsApp
- JioMart (Reliance) launch end-to-end shopping via WA → user bisa order groceries
- Selama COVID lockdown, small businesses di India mulai pakai WA untuk terima order
- Pattern: WA catalog → customer pilih → chat untuk confirm → payment

**Key insight:** Yang berhasil di India bukan bot — tapi **catalog + checkout flow** yang ter-integrate. JioMart = structured flow (bukan free-text bot).

Sources:
- [TechCrunch: WhatsApp Pay Brazil](https://techcrunch.com/2023/04/11/whatsapp-users-in-brazil-can-now-pay-merchants-through-the-app/)
- [Wapikit: WhatsApp D2C Commerce India & Brazil 2025](https://www.wapikit.com/blog/conversational-commerce-2025-whatsapp-india-brazil-d2c)

---

## 4. Tools yang Sudah Ada di Indonesia

| Tool | Model | Target | WA Bot? | Harga |
|---|---|---|---|---|
| **Selly** | Keyboard helper | UMKM all sectors | Bukan bot — keyboard overlay | **Tutup** |
| **QuickOrder** | Keyboard helper (pengganti Selly) | UMKM seller | Bukan bot — quick reply + invoice | Gratis |
| **Kirimi** | WA API + automation | UMKM | Auto-reply + notifikasi | Freemium |
| **Cekat.ai** | AI chatbot platform | Enterprise | Ya — AI chatbot | Berbayar |
| **Mekari Qontak** | CRM + WA API | SME-Enterprise | Ya — structured flow | Rp897K/user/bln |
| **FoodBuzz.id** | WA bot (open source) | UMKM kuliner | Ya — via Watomatic | Gratis (DIY) |
| **CatatOrder** | Link toko + WA bot | UMKM F&B | Ya — free-text AI | Freemium |

**Observasi:**
- Tools yang **berhasil** di UMKM Indonesia = tools yang **simple** (keyboard helper, link order, auto-reply)
- Tools yang pakai **AI chatbot** = target **enterprise**, bukan UMKM
- Selly (paling populer untuk UMKM) = **bukan bot**, hanya keyboard helper — dan sudah tutup
- **Tidak ada evidence** WA bot ordering yang berhasil di UMKM F&B Indonesia secara komersial

---

## 5. CatatOrder vs Kompetitor

### CatatOrder Sekarang

```
WA Bot path:
  Customer → WA → bot (free-text) → AI parse → order
  Result: 0 orders in 5 weeks

Link Toko path:
  Customer → link → form → order
  Result: 2 orders in 5 weeks (100% conversion dari link)
```

### Dimana CatatOrder SUDAH Unggul

| Feature | CatatOrder | QuickOrder | Selly | Kirimi | GoFood |
|---|---|---|---|---|---|
| Link toko (order form) | ✅ | ❌ | ❌ | ❌ | ✅ (in-app) |
| Product catalog | ✅ | ❌ | ❌ | ❌ | ✅ |
| Order management | ✅ | ✅ | ❌ (tutup) | ❌ | ✅ |
| Payment tracking | ✅ | ❌ | ❌ | ❌ | ✅ |
| Rekap/laporan | ✅ | ❌ | ❌ | ❌ | ✅ |
| Piutang tracking | ✅ | ❌ | ❌ | ❌ | ❌ |
| UMKM pricing | ✅ (freemium) | ✅ (gratis) | — | ✅ | ❌ (22% fee) |

**CatatOrder SUDAH punya advantage yang kuat: link toko + order management + piutang.** WA bot bukan competitive advantage — ini distraction.

---

## 6. Pelajaran dari Kompetitor

### Pelajaran 1: Ordering ≠ Conversation

GoFood, GrabFood, JioMart — semua menggunakan **structured flow** (form/catalog/buttons), bukan conversation. Ordering butuh presisi (item, qty, harga, tanggal). Conversation = ambiguity.

### Pelajaran 2: UMKM Tools yang Berhasil = Simple

Selly berhasil karena **keyboard overlay** (simple, bukan bot). QuickOrder berhasil karena **quick reply templates** (simple). Yang gagal: chatbot AI yang kompleks.

### Pelajaran 3: Brazil & India = Catalog + Payment, Bukan Bot

Bahkan di market paling mature (Brazil 80% WA commerce), pattern yang berhasil adalah **catalog browsing + structured checkout**, bukan free-text bot ordering.

### Pelajaran 4: CatatOrder Sudah Punya Solusi yang Lebih Baik

Link toko (`catatorder.id/[slug]`) = structured order form yang sudah working. Ini LEBIH BAIK dari WA bot karena:
- Zero ambiguity (form fields, not free text)
- Product catalog visual (images, categories, stock)
- Delivery date picker
- Payment claim built-in
- SEO discoverable (Google indexing)

---

## Honest Assessment

### Yang terbukti dari competitive analysis:
1. **TIDAK ADA** WA bot ordering yang berhasil di UMKM F&B Indonesia (secara komersial)
2. **Pemain terbesar** (GoFood, GrabFood, JioMart) TIDAK pakai WA bot untuk ordering
3. **Tools UMKM yang berhasil** di Indonesia = simple (keyboard helper, link order, auto-reply)
4. **Brazil & India** membuktikan: catalog + structured checkout > bot
5. **CatatOrder link toko** sudah LEBIH BAIK dari WA bot — structured, visual, SEO-friendly

### Yang belum terbukti:
1. Apakah customer katering Indonesia akan klik link (vs prefer chat langsung)?
2. Apakah WhatsApp Flows bisa jadi middle ground yang berhasil?
3. Apakah ada niche dimana WA bot ordering BISA berhasil (misal: repeat order customer yang sudah kenal menu)?

---

## Pertanyaan untuk File 04 (Rekomendasi & Implementasi)

1. **Implementation detail:** bagaimana simplify handler.ts menjadi auto-reply + link?
2. **Message template:** apa pesan auto-reply yang optimal? Dengan atau tanpa tombol?
3. **Throttling:** berapa kali reply per customer per hari supaya tidak spam?
4. **Metrics:** bagaimana track konversi WA → link → order?
5. **Seller communication:** bagaimana beritahu merchant bahwa bot diubah jadi link redirect?
6. **Future upgrade path:** kapan dan bagaimana upgrade ke interactive buttons atau WhatsApp Flows?

---

*Ditulis 21 Maret 2026. Competitive analysis berdasarkan web research: GoFood/GrabFood strategy, UMKM Indonesia ordering patterns, Brazil/India WA commerce precedent, tool comparison (Selly, QuickOrder, Kirimi, Cekat.ai, FoodBuzz.id).*

Sources:
- [Campaign Asia: GrabFood vs GoFood](https://www.campaignasia.com/article/grabfood-versus-gofood-the-rivalry-only-escalates-in-indonesia/473351)
- [TechCrunch: WhatsApp Pay Brazil](https://techcrunch.com/2023/04/11/whatsapp-users-in-brazil-can-now-pay-merchants-through-the-app/)
- [Wapikit: WhatsApp D2C India & Brazil](https://www.wapikit.com/blog/conversational-commerce-2025-whatsapp-india-brazil-d2c)
- [totabuan.news: QuickOrder](https://totabuan.news/2025/08/tenang-sekarang-ada-quickorder-aplikasi-keyboard-pengganti-selly-yang-bisa-bantu-seller-umkm-makin-satset-jualannya/)
- [GitHub: FoodBuzz.id](https://github.com/zharmedia386/foodbuzz)
- [Kasir Pintar: Strategi UMKM](https://kasirpintar.co.id/solusi/detail/pakai-whatsapp-instagram-ini-strategi-jualan-yang-cocok-untuk-umkm)
- [Haptik: Zoop WhatsApp food ordering](https://www.haptik.ai/resources/case-study/zoop-online-food-ordering)
- [BotPenguin: Restaurant chatbot examples](https://botpenguin.com/blogs/restaurant-chatbot-examples)
- [WhatsApp Business Summit 2025](https://m.ysmc.or.id/whatsapp-business-summit-2025-transformasi-digital-umkm-indonesia-lewat-fitur-canggih-dan-ai/)
