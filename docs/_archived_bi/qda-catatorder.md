# QDA CatatOrder — Pertanyaan yang Menentukan Arsitektur

> Analisis Question-Driven Architecture untuk CatatOrder. Dikoreksi berdasarkan code audit langsung (24 Maret 2026) — bukan dari docs yang outdated.

*Terakhir diupdate: 2026-03-24 — post reality capture*

---

## Koreksi: Docs vs Reality

Versi sebelumnya dari dokumen ini dibangun di atas `activation-support.md` (ditulis 13 Feb 2026). Code audit langsung menunjukkan **banyak fitur yang disebut "NOT SOLVED" ternyata sudah diimplementasi:**

| Klaim lama (dari docs) | Reality (dari code audit) |
|---|---|
| "Aha moment bisu — toast 2 detik" | **Celebration modal SUDAH ADA** + CTA "Kirim ke WhatsApp" |
| "`first_wa_sent` tidak dilacak" | **SUDAH DILACAK** di `profiles.first_wa_sent_at` via `activation.ts` |
| "11 WA branding tanpa URL" | **8/10 SUDAH ADA URL.** Hanya 2 gap tersisa |
| "Zero post-signup communication" | **Push notifications AKTIF** — morning brief, death valley day 1-66, milestones (mobile) |
| "0 blog posts" | **7 blog posts** dipublish + full SEO infrastructure (8.8/10) |
| "No onboarding checklist" | **6-step OnboardingChecklist** sudah ada |

**Implikasi: pertanyaannya bergeser dari "apa yang perlu dibangun?" ke "apa yang sudah dibangun tapi belum divalidasi di lapangan?"**

*Evidence: `lab/research/reality/20260324-loop-catatorder-reality-capture/synthesis.md`*

---

## Diagnosis (Dikoreksi)

CatatOrder punya 60+ fitur DAN sebagian besar arsitektur aliran sudah dibangun. Loop dari signup ke WA send sudah ada. Push return loop untuk mobile users aktif. SEO infrastructure berjalan. Quota nudge 4-tier berfungsi.

**Pola sebenarnya bukan "fitur tidak terhubung" — tapi "fitur terhubung tapi belum divalidasi dengan user nyata."**

Yang benar-benar masih gap:

1. **Web-only users tidak punya return loop** — push hanya mobile, WA drip dihapus (Meta policy), Fontte tidak terintegrasi
2. **2 WA message path tanpa branding URL** — `buildCustomerOrderMessage()` dan receipt PNG
3. **Quota notification hanya in-app** — tidak ada push/WA saat mendekati batas
4. **Belum ada data validasi** — apakah celebration modal benar-benar membuat user kirim WA? Apakah push death valley mencegah churn? Apakah blog mendatangkan traffic?

---

## Meta-Question

> **"Dari semua arsitektur yang sudah dibangun, mana yang sudah TERBUKTI bekerja di user nyata — dan mana yang baru asumsi?"**

Filter: **apakah jawaban dari pertanyaan ini menghasilkan sesuatu yang bekerja SETELAH saya berhenti mengerjakannya?**

---

## Urutan Pertanyaan: Dependensi, Bukan Prioritas

```
Q0: Apakah loop pernah bekerja sekali?
 ↓ arsitektur SUDAH ADA — butuh validasi dengan 1 user nyata
Q1: Berapa % yang kirim WA pertama dalam 24 jam?
 ↓ celebration modal + tracking SUDAH ADA — butuh data
Q2: Berapa % yang masih aktif hari ke-7?
 ↓ push drip SUDAH AKTIF (mobile) — butuh data + fix web-only gap
Q3: Apakah user yang mendekati batas tahu?
 ↓ in-app nudge SUDAH ADA — butuh out-of-app notification
Q4: Aset konten apa yang compound?
 ↓ blog + SEO SUDAH ADA — butuh volume (7 → 30+ posts)
```

---

### Q0 — Apakah Loop Pernah Bekerja Sekali?

> **"Apakah sudah ada SATU user yang menyelesaikan full loop: signup → buat pesanan → kirim WA → pelanggan melihat branding → signup baru?"**

**Status arsitektur: SIAP.** Loop secara teknis bisa bekerja end-to-end:
- Celebration modal mendorong WA send setelah order pertama ✅
- 8/10 WA message paths punya branding URL ✅
- `first_wa_sent_at` dilacak ✅
- Link toko bisa menerima pesanan publik ✅

**Yang belum ada: bukti bahwa loop pernah terjadi.**

Pertanyaan turunan:
- "Berapa user yang punya `first_wa_sent_at` terisi?" → query Supabase
- "Apakah ada signup yang berasal dari klik di WA branding?" → cek referral source / UTM
- "Di langkah mana user berhenti?" → trace: celebration shown → WA preview opened → WA actually sent?

**2 gap tersisa yang perlu di-fix:**
1. `buildCustomerOrderMessage()` di `wa-messages.ts` — pesan customer→seller dari link toko tanpa branding footer. Effort: 5 menit (tambah `${BRANDING}`)
2. Receipt PNG di `SuccessActions.tsx:274` — canvas text tanpa URL. Effort: 5 menit (tambah `— catatorder.id`)

**Aksi utama:** Cari 1 UMKM, trace full loop end-to-end. Infrastruktur sudah siap — yang dibutuhkan validasi.

---

### Q1 — Berapa Persen yang Kirim WA Pertama dalam 24 Jam?

> **"Dari 10 orang yang signup, berapa yang mengirim WA pertama dalam 24 jam?"**

**Status arsitektur: SIAP.**
- Celebration modal muncul setelah order pertama (deteksi: `ordersUsedBefore === 0 && sessionCount === 0`)
- Primary CTA: "Kirim ke WhatsApp" → WAPreviewSheet → wa.me
- Tracking: `profiles.first_wa_sent_at` via `activation.ts:trackWaSent()`
- OnboardingChecklist step 6: "Kirim konfirmasi ke pelanggan via WA" (cek `first_wa_sent_at`)
- 3 klik dari Simpan ke WA send (Simpan → "Kirim ke WhatsApp" → "Kirim")

**Yang belum ada: data.**

Query yang dibutuhkan:
```sql
-- Berapa % user yang pernah kirim WA?
SELECT
  COUNT(*) as total_users,
  COUNT(first_wa_sent_at) as sent_wa,
  ROUND(COUNT(first_wa_sent_at)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as pct
FROM profiles
WHERE orders_used > 0;
```

**Pertanyaan turunan jika rate < 50%:**
- "Apakah user melihat celebration modal tapi skip ke 'Lihat Pesanan'?"
- "Apakah user membuka WAPreviewSheet tapi tidak klik 'Kirim'?"
- "Apakah `business_name` null saat celebration muncul?" → WA message akan punya signature kosong

---

### Q2 — Berapa Persen yang Masih Aktif Hari ke-7?

> **"Dari user yang kirim WA pertama, berapa yang masih aktif hari ke-7?"**

**Status arsitektur: PARTIALLY SIAP.**

✅ Mobile users:
- Morning brief push 06:00 WIB (pesanan hari ini, top items, belum bayar)
- Death valley push 08:00 WIB (11 tipe pesan, day 1 sampai day 66)
- Milestone push (10, 50, 100, 500, 1000 pesanan)
- Monthly review push (tanggal 1 setiap bulan)
- Real-time push saat pesanan masuk dari link toko
- Tracking via `profiles.onboarding_drip` JSONB (mencegah duplikat)

❌ Web-only users:
- TIDAK ADA return loop
- Push tidak bisa di web (tidak ada service worker push)
- WA drip DIHAPUS 21 Maret 2026 (Meta policy blokir Embedded Signup)
- Fontte TIDAK terintegrasi di codebase (zero references)
- Email TIDAK ADA

**Gap kritis:** Jika user hanya pakai web (tidak install app), mereka tidak mendapat APA-APA setelah menutup browser.

**Arsitektur yang perlu dibangun:**
- Opsi A: Integrasikan Fontte untuk WA drip manual (kirim dari nomor founder, bukan WA Cloud API)
- Opsi B: Dorong semua user ke mobile app (push bekerja di sana)
- Opsi C: Tambah email collection + drip (overhead lebih besar)

**Data yang dibutuhkan:**
```sql
-- Berapa % user punya push_token (= install app)?
SELECT
  COUNT(*) as total,
  COUNT(push_token) as has_push,
  ROUND(COUNT(push_token)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as pct
FROM profiles
WHERE orders_used > 0;
```

---

### Q3 — Apakah User yang Mendekati Batas Tahu?

> **"Pada momen apa user merasakan kuota tidak cukup, dan apakah visible?"**

**Status arsitektur: MOSTLY SIAP.**

✅ In-app visibility (4-tier nudge):
- 80% (40/50): Blue banner "bisnis lagi rame bulan ini!"
- 90% (45/50): Blue banner "5 pesanan gratis tersisa"
- 96% (48/50): Amber banner "2 pesanan gratis tersisa"
- 100%+ (50+): Amber banner "kuota habis — pesanan baru menunggu"
- Settings page: progress bar + 3 purchase buttons
- "Menunggu" system: pesanan dari link toko tetap masuk, otomatis aktif setelah upgrade

❌ Out-of-app notification:
- TIDAK ADA push notification tentang kuota
- TIDAK ADA WA notification tentang kuota
- User yang jarang buka dashboard bisa miss bahwa kuota habis dan pesanan menumpuk di "menunggu"

**Arsitektur yang perlu dibangun:** Push notification saat `orders_used` mencapai `NUDGE_URGENT` (48) — "2 pesanan gratis tersisa. Pesanan dari link toko akan menunggu setelah ini." Bisa ditambahkan di cron `alerts` yang sudah ada.

---

### Q4 — Aset Konten Apa yang Compound?

> **"Aset apa yang bekerja 24/7 tanpa effort tambahan?"**

**Status arsitektur: SUDAH DIBANGUN SUBSTANSIAL.**

✅ Blog: 7 posts dipublish
- `pesanan-wa-numpuk.mdx`, `format-order-whatsapp.mdx`, `struk-digital-tanpa-printer.mdx`, dll
- Full MDX infrastructure + frontmatter metadata + featured images (WebP)
- BlogPosting JSON-LD per article

✅ Programmatic pages:
- `/toko` marketplace directory (all merchants, category filter)
- `/toko/[citySlug]` per-city pages (auto-generated)
- `/komunitas/[slug]` community pages (noindex jika < 3 member)
- `/[slug]` merchant store pages (LocalBusiness + OfferCatalog schema)

✅ SEO infrastructure:
- Dynamic sitemap (blog + merchants + cities + communities)
- robots.txt properly configured
- JSON-LD di 6 tipe halaman
- Canonical URLs + meta descriptions di semua halaman
- Estimated indexable pages: 300-800+

**Yang perlu dilakukan:** Scale volume — 7 posts → 30+. Infrastructure sudah ada, tinggal isi konten. 10 post pertama sudah direncanakan di `distribution-deep-dive.md`.

**Data yang dibutuhkan:** Google Search Console — berapa impressions/clicks dari 7 posts + programmatic pages yang sudah ada?

---

## Status Loop CatatOrder (Post Reality Capture)

```
Signup → Setup → Dashboard
  ↓
Order pertama → Celebration modal ✅ → "Kirim ke WhatsApp" ✅
  ↓
WA terkirim → Branding "catatorder.id" ✅ (8/10 paths) → [validasi: pelanggan klik?]
  ↓
Pelanggan pesan via link toko → Push notification ke penjual ✅ (mobile)
  ↓
Morning brief 06:00 ✅ → Death valley day 1-66 ✅ → Milestones ✅
  ↓
Kuota mendekati batas → In-app nudge ✅ → [gap: no push about quota]
  ↓
Blog 7 posts ✅ + Directory ✅ + City pages ✅ → [validasi: organic traffic?]
```

### Loop BEKERJA secara teknis di:
- Signup → order → celebration → WA send ✅
- WA branding dengan URL (8/10) ✅
- Push return loop mobile ✅
- In-app quota nudge ✅
- SEO compound distribution ✅

### Loop PUTUS di:
1. **Web-only users setelah sesi pertama** — no return mechanism
2. **2 WA message tanpa branding** — customer→seller, receipt PNG
3. **Quota notification out-of-app** — user harus buka dashboard untuk tahu
4. **Belum divalidasi end-to-end** — arsitektur ada, bukti belum ada

---

## Aksi Berurutan (Dikoreksi)

Bukan lagi "bangun ini" — tapi "validasi ini, fix 3 gap, lalu scale":

| # | Aksi | Effort | Tipe |
|---|------|--------|------|
| 1 | **Fix 2 WA branding yang missing** — tambah `${BRANDING}` di `buildCustomerOrderMessage()` + URL di receipt PNG | 10 menit | Fix |
| 2 | **Tambah push notification quota** di cron `alerts` — saat `orders_used >= 48` | 1 jam | Fix |
| 3 | **Cari 1 UMKM, trace full loop end-to-end** — apakah celebration → WA → branding terlihat → dampak? | 1-2 hari | Validasi |
| 4 | **Query data**: `first_wa_sent_at` rate, `push_token` rate, day-7 retention | 30 menit | Validasi |
| 5 | **Cek Google Search Console** — impressions/clicks dari 7 blog + programmatic pages | 15 menit | Validasi |
| 6 | **Tentukan return loop untuk web-only users** — Fontte manual WA, atau dorong ke app | Keputusan | Gap |
| 7 | **Scale blog** dari 7 → 30+ posts | Ongoing | Growth |

---

## Prinsip (Dikoreksi)

1. **Jangan asumsikan docs masih akurat — audit code langsung.** `activation-support.md` tertinggal beberapa versi. Reality di codebase jauh lebih maju. Sebelum memutuskan apa yang perlu dibangun, verifikasi apa yang sudah ada.

2. **Arsitektur yang sudah dibangun tapi belum divalidasi = asumsi, bukan solusi.** Celebration modal ada — tapi apakah user benar-benar kirim WA? Push death valley aktif — tapi apakah day-7 retention membaik? Blog dipublish — tapi apakah organic traffic datang? Data menentukan, bukan code.

3. **Validasi lebih berharga dari fitur baru.** CatatOrder tidak butuh fitur ke-61. Ia butuh bukti bahwa 60 fitur yang sudah ada bekerja. 1 user yang menyelesaikan full loop lebih berharga dari 10 fitur baru.

4. **Web-only gap adalah gap terbesar yang tersisa.** Push bekerja untuk mobile. WA drip mati (Meta policy). Web-only users = invisible setelah menutup browser. Ini satu-satunya gap arsitektural yang benar-benar perlu dibangun.

5. **Filter pertanyaan:** apakah jawabannya mengandung "saya harus" atau "lebih keras"? Salah. Apakah jawabannya mengandung "data menunjukkan" atau "validasi dengan 1 user"? Benar.

6. **Urutan tetap dependensi:** Loop terbukti (Q0) → WA send rate (Q1) → Day-7 retention (Q2) → Quota awareness (Q3) → Content scale (Q4). Tidak bisa di-skip.
