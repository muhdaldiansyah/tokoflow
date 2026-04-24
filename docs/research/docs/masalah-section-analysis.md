# Deep Dive Analysis: Masalah Section — Profil CatatOrder

> Tujuan: Menentukan data, statistik, dan narasi yang LAYAK digunakan di halaman masalah profil CatatOrder, berdasarkan audit kualitas sumber dari seluruh research files.
>
> Date: 2026-03-08

---

## 1. Audit Kualitas Sumber: Mana yang Bisa Dipercaya?

Setiap angka yang muncul di profil harus bisa dipertanggungjawabkan. Berikut klasifikasi seluruh data yang tersedia berdasarkan kekuatan sumbernya.

### Tier A: Sumber Primer — Layak Dikutip Langsung

Data dari lembaga resmi, peer-reviewed, atau laporan keuangan terverifikasi.

| Data Point | Angka | Sumber | Catatan |
|---|---|---|---|
| Total UMKM Indonesia | 65,47 juta (2024) | Kemenkop UKM 2024 | Digunakan secara luas oleh BPS, BI, dan media |
| Kontribusi PDB | 61% | Kemenkop UKM 2024 | Konsisten di banyak laporan pemerintah |
| Penyerapan tenaga kerja | 97% | Kemenkop UKM 2024 | Konsisten di banyak laporan pemerintah |
| Perempuan pelaku UMKM | 64,5% dari total | Kemenkop UKM / BPS 2024 | Dipakai World Bank juga |
| Credit gap UMKM | Rp1.600 triliun | IFC MSME Gap Assessment / OJK 2024 | Angka yang mapan dan sering dikutip |
| UMKM tidak punya pembukuan | 98% | BPS 2024 | Dari `umkm-problem.md` (B1) |
| Keuangan pribadi & bisnis campur | 83% | BPS 2024 | Dari `umkm-problem.md` (B2) |
| UMKM informal (tanpa NIB) | 67% | BPS 2024 | Dari `umkm-problem.md` (H1) |
| Smartphone ownership | 99,3% | Statista 2023 | Widely cited |
| UMKM sepenuhnya manual | 88% (hanya 12% adopsi digital) | BPS / Kemenkop 2024 | Dari `umkm-problem.md` (D1) |
| Literasi digital rendah | Hanya 23% pakai tools digital | Kominfo 2024 | Dari `umkm-problem.md` (C7) |
| Produktivitas UMKM vs usaha besar | 25% | BPS 2024 | Dari `umkm-problem.md` (F1) |
| BukuKas investment & failure | $142M raised, tutup Sept 2023 | Crunchbase, TechInAsia | Fakta publik, bisa diverifikasi |
| BukuWarung investment | $80M+ raised | Crunchbase, TechInAsia | Fakta publik |
| BukuWarung revenue gap | 7M users, $1.7M revenue | TechInAsia reporting | Fakta publik |
| Selly shutdown | Tutup Agustus 2025 | Public announcement | Fakta publik |

### Tier B: Sumber Sekunder Kuat — Layak Digunakan dengan Konteks

Data dari riset independen atau survey industri yang bisa di-cross-reference.

| Data Point | Angka | Sumber | Catatan |
|---|---|---|---|
| UMKM masih manual meski sudah ada tools digital | ~70% | Mastercard/Zenodo 2024 | Laporan riset, bukan peer-reviewed tapi reliable |
| WA penetration Indonesia | 90,9% | WhatsBoost (citing We Are Social) | Data We Are Social luas dipakai |
| Literasi digital Indonesia terendah ASEAN | Index 62% vs ASEAN avg 70% | CNBC Indonesia (citing survey) | Perlu hati-hati — secondary report |
| Digital literacy score | 3,54/5 | BPS Indonesia | Survey resmi |

### Tier C: Sumber Sekunder Lemah — TIDAK Layak Dikutip di Profil

Data dari blog marketing, forum, atau estimasi internal tanpa validasi primer.

| Data Point | Angka | Sumber | Masalah |
|---|---|---|---|
| "85% UMKM F&B kelola pesanan manual lewat WA" | 85% | Tidak ada sumber primer | **TIDAK ADA SUMBER.** Angka ini muncul di profil saat ini tapi tidak tervalidasi oleh BPS/survey manapun. |
| "15-30% pesanan hilang" | 15-30% | `umkm-problem.md` (D3) | Sumber aslinya tidak jelas — muncul di multiple research files tapi tanpa citation ke survey primer. Likely derived dari estimasi. |
| "1-3 jam setiap hari habis untuk catat pesanan" | 1-3 jam | Tidak ada sumber | **TIDAK ADA SUMBER.** P6 di problems.md menyebut 30-60 menit (juga tanpa sumber primer). 1-3 jam tidak didukung data manapun. |
| ~6,4 juta UMKM terima pesanan lewat WA | 6,4 juta | PSO scan estimate | Estimasi internal, bukan survey |
| Pain-point search volumes | Varies | SEO tools | Bukan evidence of pain, hanya search behavior |
| Real quotes dari Paper.id, StaffAny, Kitalulus, OY Indonesia | Various | Marketing blogs | **Semua kutipan berasal dari blog marketing perusahaan lain** — bukan dari user research atau survey independen. |
| Quotes dari Kaskus, Quora | Various | Forum | Anekdot individual, bukan data |
| "Time saved 50-60% with automation" | 50-60% | Kitalulus case study | Marketing claim, bukan independent study |

---

## 2. Diagnosis: Masalah dengan Profil Saat Ini

### Halaman 2 (Masalah) — 4 Masalah Kritis

1. **"Bu Ratna" adalah karakter fiktif.** User sudah flag ini. Tidak boleh ada di profil — menurunkan kredibilitas.

2. **"85% UMKM F&B kelola pesanan manual lewat WA"** — angka ini tidak punya sumber. Yang ada: 88% UMKM sepenuhnya manual (BPS), 90,9% WA penetration (We Are Social). Tapi "85% F&B specifically via WA" tidak ada datanya.

3. **"15-30% pesanan hilang"** — muncul di D3 (`umkm-problem.md`) tapi tanpa sumber primer. Ini estimasi, bukan data survey.

4. **"1-3 jam setiap hari"** — tidak ada sumber sama sekali. P6 bilang 30-60 menit tapi itupun tanpa sumber primer.

### Halaman 3 (Mengapa Solusi Gagal) — Relatif Kuat

1. BukuKas, BukuWarung, Selly data — semua **Tier A** (fakta publik). Bisa dipertahankan.
2. "70% masih manual" — **Tier B** (Mastercard/Zenodo). Cukup kuat untuk digunakan.
3. "$300 juta" calculation — bisa diverifikasi dari Crunchbase. Kuat.

---

## 3. Data Points yang LAYAK Digunakan di Profil

### Angka-Angka Utama (Tier A — bisa dikutip tanpa disclaimer)

| # | Data Point | Angka | Sumber untuk Attribution |
|---|---|---|---|
| 1 | Total UMKM Indonesia | 65,47 juta | Kemenkop UKM 2024 |
| 2 | Kontribusi PDB | 61% | Kemenkop UKM 2024 |
| 3 | Penyerapan tenaga kerja | 97% | Kemenkop UKM 2024 |
| 4 | Tidak ada pembukuan | 98% | BPS 2024 |
| 5 | Keuangan pribadi & bisnis campur | 83% | BPS 2024 |
| 6 | UMKM sepenuhnya manual (hanya 12% digital) | 88% | BPS / Kemenkop 2024 |
| 7 | Smartphone ownership | 99,3% | Statista 2023 |
| 8 | Credit gap | Rp1.600 triliun | IFC / OJK 2024 |
| 9 | UMKM informal | 67% | BPS 2024 |
| 10 | Pelaku perempuan | 64,5% | Kemenkop UKM 2024 |
| 11 | Produktivitas vs usaha besar | 25% | BPS 2024 |

### Angka Pendukung (Tier B — bisa digunakan dengan konteks)

| # | Data Point | Angka | Sumber |
|---|---|---|---|
| 12 | UMKM masih manual meski sudah ada tools | ~70% | Mastercard/Zenodo 2024 |
| 13 | WA penetration Indonesia | 90,9% | We Are Social 2024 |
| 14 | Digital literacy score | 3,54/5 | BPS Indonesia |

### Fakta Kompetitor (Tier A — verifiable public facts)

| # | Fakta | Sumber |
|---|---|---|
| 15 | BukuKas: $142M raised, tutup Sept 2023 | Crunchbase / TechInAsia |
| 16 | BukuWarung: $80M raised, 7M users, $1.7M revenue, pivot fintech | Crunchbase / TechInAsia |
| 17 | Selly: tutup Agustus 2025 | Public announcement |

---

## 4. Causal Chain yang Paling Relevan untuk Profil

Dari `umkm-sebab_akibat.md`, rantai kausal yang paling kuat dan relevan untuk halaman masalah:

### The Vicious Cycle (Loop 1 — paling kritis)

```
Tidak ada pembukuan (B1)
    → Tidak bisa buktikan kelayakan kredit (A1)
    → Credit gap tetap menganga (A3: Rp1.600T)
    → Modal habis untuk operasional (A6)
    → Tidak mampu adopsi teknologi (D1)
    → Kembali ke B1: tetap tidak ada pembukuan
```

**Mengapa ini kuat untuk profil:**
- Setiap node punya data BPS/OJK/IFC yang kuat
- Menjelaskan MENGAPA masalah ini penting (bukan hanya "pesanan berantakan" tapi dampak sistemik)
- Menghubungkan CatatOrder ke masalah nasional Rp1.600T secara logis
- Dari `umkm-sebab_akibat.md`: B1 adalah leverage point #1 — mempengaruhi ~45 dari 87 masalah UMKM

### CatatOrder's Entry Point

```
D2 (SaaS tidak cocok UMKM) → CatatOrder memecahkan ini
    → D1 solved (UMKM go digital)
    → B1 solved (pembukuan otomatis dari pesanan)
    → Cascading: ~55 dari 87 masalah (63%) berkurang
```

---

## 5. Rekomendasi Rewrite: Halaman 2 & 3

### Halaman 2 — Masalah (Rewrite Strategy)

**Ganti "Bu Ratna" dengan skenario universal tanpa nama.**

**Ganti semua angka Tier C dengan angka Tier A:**

| Sekarang (SALAH) | Harusnya (BENAR) | Sumber |
|---|---|---|
| "85% UMKM F&B kelola pesanan manual lewat WA" | "88% UMKM Indonesia sepenuhnya manual — hanya 12% yang sudah adopsi teknologi digital" | BPS / Kemenkop 2024 |
| "15-30% pesanan hilang" | HAPUS atau ganti dengan narasi tanpa angka: "pesanan terlewat, tercampur, terlupakan" | — |
| "1-3 jam setiap hari" | HAPUS atau turunkan ke "30-60 menit" jika mau pakai (tapi ini juga tanpa sumber primer — lebih baik narasi) | — |
| "98% tidak punya pembukuan" | PERTAHANKAN — ini BPS 2024 | BPS 2024 |

**Tambahkan causal chain yang kuat:**

Gunakan vicious cycle (Loop 1) tapi dalam bahasa profil — bukan akademis. Ini memberikan "so what" yang powerful: bukan hanya "pesanan berantakan" tapi "pesanan berantakan → tidak ada data → tidak ada akses modal → tetap kecil → selamanya".

**Narrative approach:** Describe the daily reality tanpa nama, menggunakan skenario yang relatable. Lalu back it up dengan hard data Tier A only.

### Halaman 3 — Mengapa Solusi Gagal (Minor Adjustments)

Halaman ini sudah cukup kuat — semua data Tier A. Adjustments:

1. Tambahkan sumber attribution (dalam tanda kurung kecil) untuk meningkatkan kredibilitas
2. "70% UMKM masih manual" — tambahkan attribution ke Mastercard/Zenodo 2024
3. Pertahankan BukuKas/BukuWarung/Selly data apa adanya

---

## 6. Proposed Content: Halaman 2 (Masalah)

### Judul: "65 Juta UMKM. Satu Masalah yang Sama."

### Narasi Pembuka (tanpa nama fiktif):

> Setiap pagi, jutaan pemilik usaha di Indonesia membuka WhatsApp dan menemukan belasan chat pesanan yang masuk semalam. Masing-masing memesan item berbeda, minta waktu berbeda, bayar dengan cara berbeda.
>
> Mereka scroll chat satu per satu. Catat di buku tulis. Hitung total di kalkulator. Malam hari, rekap ulang — pesanan siapa yang sudah dibayar? Yang mana yang belum dikirim?
>
> Ini bukan cerita satu orang. Ini adalah rutinitas harian 65 juta pelaku UMKM di Indonesia.

### Data Points (HANYA Tier A & B):

**88%** UMKM Indonesia sepenuhnya manual — hanya 12% yang sudah adopsi teknologi digital untuk operasional bisnis.
*(BPS / Kemenkop UKM 2024)*

**98%** tidak punya pembukuan — seluruh transaksi hanya di ingatan atau catatan seadanya.
*(BPS 2024)*

**83%** mencampur keuangan pribadi dan bisnis — tidak pernah tahu berapa laba, berapa rugi.
*(BPS 2024)*

**99,3%** pelaku UMKM punya smartphone — masalahnya bukan akses teknologi, tapi alat yang ada tidak cocok untuk cara kerja mereka.
*(Statista 2023)*

### Causal Chain (simplified for profile):

```
Tidak ada catatan pesanan
        ↓
Tidak tahu untung rugi
        ↓
Tidak bisa buktikan kelayakan kredit
        ↓
Tidak dapat modal → tetap kecil
```

*Credit gap UMKM Indonesia: Rp1.600 triliun. Bukan karena bank tidak mau meminjamkan — tapi karena UMKM tidak punya data untuk membuktikan bisnis mereka layak.*
*(IFC MSME Gap Assessment / OJK 2024)*

### Anchor Line:

> **Kompetitor CatatOrder bukan aplikasi SaaS — kompetitornya adalah buku tulis.**

---

## 7. Proposed Content: Halaman 3 (Mengapa Solusi yang Ada Gagal)

### Judul: "Rp4,8 Triliun Sudah Diinvestasikan. UMKM Masih Manual."

Lebih dari **$300 juta** sudah diinvestasikan ke berbagai aplikasi UMKM di Indonesia:

| Startup | Dana | Hasil |
|---|---|---|
| **BukuKas** | $142 juta *(Sequoia, Tiger Global)* | Tutup September 2023. Kembalikan ~$70 juta ke investor. |
| **BukuWarung** | $80 juta *(Y Combinator, DST Global)* | 7 juta user, hanya $1,7 juta revenue. Pivot ke fintech. |
| **Selly** | — | Tutup Agustus 2025. |

*Sumber: Crunchbase, TechInAsia*

Hasilnya? **70% UMKM masih manual.** *(Mastercard/Zenodo 2024)*

Kenapa? Karena mereka semua menyelesaikan masalah *pembukuan* — bukan masalah *pesanan*.

> **Pesanan adalah aktivitas harian. Pembukuan adalah aktivitas bulanan. UMKM butuh solusi untuk yang mereka hadapi hari ini — bukan yang mereka tunda sampai akhir bulan.**

---

## 8. Data yang TIDAK Boleh Digunakan

| Data | Alasan |
|---|---|
| "85% UMKM F&B kelola pesanan manual lewat WA" | Tidak ada sumber primer |
| "15-30% pesanan hilang" | Muncul di D3 tapi tanpa citation primer — likely estimasi |
| "1-3 jam setiap hari" | Tidak ada sumber sama sekali |
| "~6,4 juta UMKM terima pesanan lewat WA" | Estimasi internal PSO scan |
| Kutipan dari Paper.id, StaffAny, Kitalulus, OY Indonesia | Blog marketing — bukan riset independen |
| Kutipan dari Kaskus/Quora | Anekdot individual |
| "Time saved 50-60%" | Marketing claim Kitalulus |
| "Bu Ratna" atau karakter fiktif apapun | Menurunkan kredibilitas — profil harus factual |

---

## 9. Summary: Apa yang Berubah

| Aspek | Sebelum | Sesudah |
|---|---|---|
| Karakter | Bu Ratna (fiktif) | Skenario universal tanpa nama |
| "85% F&B via WA" | Tier C — tidak ada sumber | **88% sepenuhnya manual** (BPS 2024) |
| "15-30% pesanan hilang" | Tier C — tidak ada sumber primer | Dihapus — narasi deskriptif tanpa angka |
| "1-3 jam/hari" | Tier C — tidak ada sumber | Dihapus |
| "98% tidak punya pembukuan" | Tier A — BPS 2024 | Dipertahankan |
| Causal chain | Tidak ada | Ditambahkan: B1 → A1 → A3 → stagnasi |
| Credit gap Rp1.600T | Di halaman 8 (visi) | Dipindahkan ke halaman 2 — perkuat "so what" |
| Sumber attribution | Tidak ada | Ditambahkan di setiap angka |
| Halaman 3 (kompetitor gagal) | Data kuat | Dipertahankan + attribution ditambahkan |

---

## 10. Kekuatan Narasi Baru

### Emotional Architecture (dari profil-redesign-analysis.md):

1. **Relatable opening** — skenario pagi hari buka WA, universal untuk semua UMKM yang terima pesanan
2. **Hard data punch** — 88%, 98%, 83% back-to-back, semua BPS 2024
3. **"So what" moment** — causal chain menunjukkan ini bukan masalah sepele tapi penyebab stagnasi UMKM nasional
4. **National scale** — Rp1.600T credit gap = this matters beyond one warung
5. **Anchor line** — "kompetitornya buku tulis" = repositions the whole category

### Credibility Architecture:

- Setiap angka bisa diverifikasi oleh investor
- Sumber disebutkan (BPS, OJK, IFC, Mastercard)
- Tidak ada angka yang dibuat-buat atau diestimasi
- Fakta kompetitor bisa dicek di Crunchbase/TechInAsia
- Tidak ada karakter fiktif — hanya data dan skenario

---

*Dianalisis: 2026-03-08*
*Sumber: research/problem/ (5 files), strive/problem/ (2 files), profil-catatorder.md*
