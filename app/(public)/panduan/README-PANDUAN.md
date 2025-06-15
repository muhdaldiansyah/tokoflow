# Akadevisi Panduan Content Standards & Guidelines

## 📚 Daftar Isi

1. **Filosofi, Visi, dan Positioning**
2. **Aturan Penulisan Konten**
3. **Fitur Panduan dan Elemen Wajib**
4. **Panduan Visual & Media**
5. **Implementasi Teknis**
6. **Standar SEO & Metadata**
7. **Panduan Penulis**
8. **Standar Kualitas**
9. **Perencanaan & Kalender Konten**
10. **Metrik Performa**
11. **Continuous Improvement**

---

## 1. Filosofi, Visi, dan Positioning

### 1.1 Misi Utama

* Panduan Akadevisi adalah **platform edukasi digitalisasi bisnis** untuk UMKM Indonesia.
* **Fokus utama:** Edukasi praktis dan pemberdayaan—bukan jualan produk secara agresif.

### 1.2 Filosofi & Nilai Inti

* **Education First:** 80% edukasi, 20% brand/promo.
* **Solusi Kontekstual:** Mengacu kasus UMKM Indonesia.
* **Transparan & Otentik:** Fakta nyata, data real, cerita asli.
* **Community Driven:** Mengundang dialog, bukan sekadar satu arah.
* **Aksi Nyata:** Setiap panduan = insight yang bisa langsung diimplementasikan pembaca.

### 1.3 Positioning Panduan

* Akadevisi Panduan = **mitra digital terpercaya** untuk UMKM, bukan sekadar vendor software.
* Beda dengan panduan lain: **local insight, no hard-sell, narasi step-by-step, tone membangun**.

---

## 2. Aturan Penulisan Konten

### 2.1 Struktur Panduan Standar

1. **Title**: Judul artikel yang clear dan SEO-friendly
2. **Subtitle/Hook**: Deskripsi singkat yang engaging (1-2 kalimat)
3. **TLDR Overall**: Ringkasan keseluruhan dengan highlight poin penting
4. **Table of Contents**: Daftar isi sederhana dengan link navigasi
5. **Isi Utama**: 3-4 bagian utama dengan:
   - H2 sebagai section header
   - TLDR per section (warna hijau konsisten)
   - Konten paragraf yang flowing (bukan bullet points)
   - Data/statistik terintegrasi dalam narasi
6. **Kesimpulan**: Ringkasan final dengan TLDR
7. **CTA**: Call to action yang jelas (WhatsApp/konsultasi)
8. **NO Author Bio**: Tidak ada profil penulis/tim di akhir artikel

### 2.2 Gaya & Suara Penulisan

* **Bahasa**: Baku namun santai, mudah dipahami UMKM Indonesia
* **Tone**: Ramah, supportif, bukan menggurui
* **Paragraf**: Flowing, hindari bullet points berlebihan
* **Font**: Sans-serif, konsisten dengan design system
* **Istilah Inggris**: Oke untuk teknis, wajib diberi penjelasan singkat
* **Angka**: Format Indonesia (contoh: 10.000, bukan 10,000)
* **Konsisten "Anda"** untuk addressing pembaca
* **TLDR**: Setiap section harus memiliki TLDR berwarna hijau

### 2.3 Jenis Konten & Panjang Ideal

| Jenis           | Kata        | Fokus & Elemen Utama               |
| --------------- | ----------- | ---------------------------------- |
| Panduan How-to  | 1.500–2.000 | Langkah detail, checklist, gambar  |
| Studi Kasus     | 1.000–1.500 | Sebelum/sesudah, data, quote klien |
| Daftar/Listicle | 1.200–1.800 | Perbandingan, checklist, tabel     |
| Insight/Opini   | 800–1.200   | Data, sudut pandang, polling       |
| Review Tools    | 1.500–2.000 | Fitur, comparison, pricing         |

### 2.4 Kerangka Logika Penulisan

* **PAS:** Problem → Agitate → Solution
* **BAB:** Before → After → Bridge
* **AIDA:** Attention → Interest → Desire → Action

---

## 3. Fitur Panduan dan Elemen Wajib

### 3.1 Komponen Esensial (WAJIB di setiap panduan)

* **TLDR Overall** (warna hijau, di bagian atas)
* **Table of Contents** (sederhana dengan border kiri)
* **TLDR per Section** (warna hijau konsisten)
* **Navigation** (back to top button)
* **CTA Button** (menggunakan UI component standar)
* **NO Author Info** (tidak ada profil penulis)
* **NO Reading Time** (tidak perlu waktu baca)
* **NO Social Sharing** (bukan platform seperti Medium)

### 3.2 Trust Signal (minimal salah satu per panduan)

* Badge *fact-checked*
* Sumber/referensi data
* Tanggal update terakhir

### 3.3 Interaktivitas (maksimal 1/satu per panduan)

* Kalkulator sederhana (max 5 input)
* Checklist
* Poll/Survey singkat
* Tabel perbandingan (statis)
* Slider before/after

### 3.4 CTA (Call to Action)

* CTA jelas menuju WhatsApp untuk konsultasi
* "Konsultasi Digitalisasi Gratis" sebagai button utama
* Gunakan Button component dari UI system
* Warna hitam dengan teks putih, bentuk rounded-full
* Satu CTA utama per artikel, jangan berlebihan

---

## 4. Panduan Visual & Media

### 4.1 Gambar & Infografik

* **Hero Image**: 1200x630px (OG), <200KB, relevan topik.
* **Dalam Panduan**: <800px, <100KB, alt text jelas & SEO-friendly.
* **Foto Penulis**: 200x200px, foto asli.
* **Screenshot**: Tampilkan UI terkini, berikan keterangan/penanda jika perlu.
* **No stock photo generik** (gunakan foto UMKM asli jika bisa).

### 4.2 Video & Media Lain

* Embed (YouTube), max 1 video/panduan, durasi <5 menit.
* Wajib transcript/sari utama video.
* Infografik wajib mobile-friendly.

### 4.3 Box/Pesan Khusus

* **Info Box**: Latar biru, icon info, ringkas.
* **Warning Box**: Latar kuning, icon alert, singkat dan jelas.

---

## 5. Implementasi Teknis

### 5.1 Struktur File & Komponen

* **Struktur**: `/panduan/[slug]/page.js` (panduan), `/components/` (komponen), `/images/` (gambar)
* **Penamaan**: PascalCase.js (komponen), kebab-case.jpg (gambar)
* **Responsif**: Mobile-first, uji di min 3 device size
* **UI Components**: Gunakan komponen dari `/components/ui/` untuk konsistensi
* **Navigation**: Table of contents sederhana, back to top button
* **TLDR Styling**: Background hijau konsisten untuk semua TLDR

### 5.2 Performa & Loading

* Target load <3 detik/page.
* Gambar via Next.js Image, lazy load.
* Min JS dan client-side state.

---

## 6. Standar SEO & Metadata

### 6.1 Struktur URL & Meta

* `/panduan/[slug]` (lowercase, hyphens, kata kunci utama, max 60 char)
* Meta title <60 char, meta description <160 char, OG image, schema Article.

### 6.2 Internal & External Linking

* 2–3 link ke panduan lain, anchor relevan.
* Max 5 link keluar, hanya ke sumber kredibel (gov, edu, media besar).

### 6.3 Gambar untuk SEO

* Nama file sesuai keyword, alt text berisi kata kunci.
* OG image 1200x630px, wajib setiap panduan.

### 6.4 Schema Markup

* Article (WAJIB), FAQ/HowTo (jika relevan).
* OG tag, Twitter card.

---

## 7. Panduan Penulis

### 7.1 Content Attribution

* Artikel ditulis atas nama Akadevisi (bukan individual)
* Tidak ada author bio atau profil penulis
* Focus pada konten, bukan personal branding

### 7.2 Proses Menulis

1. Pitch topik & outline (via form/Notion)
2. Riset min 3 sumber kredibel
3. Draft sesuai template
4. Review editorial & SEO
5. Perbaiki sesuai feedback
6. Publish dengan metadata lengkap
7. Promosi di sosial media/komunitas
8. Respons komentar

### 7.3 Praktik Terbaik Penulis

* Tulis berdasarkan pengalaman/praktik
* Update panduan lama bila data berubah
* Jawab komen secara personal
* Hindari jargon teknis tanpa penjelasan

---

## 8. Standar Kualitas

### 8.1 Konten Berkualitas (WAJIB)

* **Value jelas**: Pembaca dapat ilmu/praktik baru
* **Clarity**: Bahasa mudah, tidak membingungkan
* **Flowing Content**: Paragraf yang mengalir, hindari fragmentasi
* **TLDR Integration**: Setiap section harus ada TLDR hijau
* **Originality**: Bukan copy-paste, bukan AI generated 100% tanpa editing
* **Relevansi**: Selalu terkait digitalisasi UMKM
* **Visual Consistency**: Design yang konsisten, warna hijau untuk TLDR

### 8.2 Checklist Editorial

* Grammar & ejaan benar
* Format konsisten
* Data terbaru
* Tidak ada link rusak
* Referensi/citation jelas

### 8.3 Kriteria Tolak Otomatis

* Promosi >20%
* Clickbait, janji kosong
* Plagiasi, AI output mentah
* Data usang tanpa disclaimer
* Value tidak jelas/terlalu teknis

---

## 9. Perencanaan & Kalender Konten

### 9.1 Jadwal

* Target: 4–6 panduan/bulan
* Mix: 40% tutorial, 20% studi kasus, 20% insight/tren, 10% review, 10% opini

### 9.2 Topik Prioritas

* Berdasarkan search volume, relevansi bisnis, analytics user, seasonality

### 9.3 Series/Recurring

* "Spotlight UMKM", "Review Tools", "Mistake of the Month", "Success Story"

---

## 10. Metrik Performa

### 10.1 Metrik Kunci

* **Engagement**: Waktu baca, scroll depth, bounce, share, komentar
* **SEO**: Organic traffic, ranking, CTR, backlink, snippet
* **Bisnis**: Sign up, konsultasi dari panduan, pipeline

### 10.2 Review Bulanan

* Laporan: Top panduan, apa yang berhasil/gagal, rekomendasi perbaikan

---

## 11. Continuous Improvement

* Audit bulanan (update data/link/konten)
* Update guideline setiap 6 bulan
* Buka feedback (pembaca & tim)
* Adaptasi ke perubahan market/teknologi

---

**Catatan:**
Dokumen ini **hidup**—harus selalu relevan dengan kebutuhan bisnis, perilaku pembaca, dan perkembangan teknologi.
**Konten Akadevisi = empower UMKM, bukan hanya "publish panduan".**

---

**Gunakan dokumen ini sebagai single-source-of-truth untuk seluruh proses penulisan, editing, maupun AI auto-review!**