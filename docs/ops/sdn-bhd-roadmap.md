# Panduan Penubuhan Syarikat & Payment Gateway — Tokoflow
**Disediakan untuk:** Danial  
**Daripada:** Aldi  
**Tarikh:** 22 Mei 2026

---

## Latar Belakang

Tokoflow adalah platform SaaS untuk peniaga kecil Malaysia (F&B, kraftangan, perkhidmatan). Product dah siap dan live di tokoflow.com. Masalah sekarang: **kami tidak boleh aktifkan payment gateway** sebab semua gateway Malaysia (Billplz, CHIP, dll) memerlukan syarikat Malaysia yang berdaftar (Sdn Bhd).

Tanpa payment gateway, peniaga terpaksa guna cara manual — pelanggan kena 10 langkah lebih untuk bayar. Ini menjejaskan pengalaman pengguna dan pertumbuhan platform.

**Matlamat dokumen ini:** Panduan langkah demi langkah untuk tubuhkan Sdn Bhd dan aktifkan payment gateway sepenuhnya.

---

## Gambaran Besar

```
MDEC MD Status → Sdn Bhd → Akaun Bank → Payment Gateway → Tokoflow live sepenuhnya
```

Seluruh proses mengambil masa lebih kurang **4–5 bulan** jika bermula sekarang.

---

## Langkah 1 — Mohon MDEC MD Status (Minggu Ini)

### Apa itu MDEC MD Status?

MDEC (Malaysia Digital Economy Corporation) memberi status khas kepada syarikat teknologi digital Malaysia. Status ini memberikan faedah besar kepada Tokoflow:

| Tanpa MD Status | Dengan MD Status |
|---|---|
| Modal berbayar RM 500,000 (syarikat milik asing) | Modal berbayar **RM 1,000 sahaja** |
| Cukai standard | Pengecualian cukai 10 tahun |
| Tiada visa khas | Visa MTEP untuk pengasas |

### Cara Mohon

1. Layari **mdec.com.my** → daftar akaun
2. Pilih: **Malaysia Digital (MD) Status**
3. Isi borang permohonan online
4. Lampirkan dokumen berikut:

**Dokumen yang diperlukan:**

| Dokumen | Status |
|---|---|
| Pelan perniagaan (1–3 muka surat) | Aldi akan sediakan |
| Unjuran kewangan 3 tahun (spreadsheet) | Perlu disediakan |
| Profil pengasas (Aldi) | Aldi akan sediakan |
| Tangkapan skrin / demo product | Ada — tokoflow.com |

### Nota Penting

> Adalah sangat disyorkan untuk melantik **setiausaha syarikat (company secretary)** yang berpengalaman dengan permohonan MDEC. Mereka tahu cara isi borang dengan betul dan elak kelewatan.
>
> Kos anggaran: **RM 500–1,000** untuk bantu permohonan MDEC.

**Masa proses:** 6–8 minggu untuk kelulusan.

---

## Langkah 2 — Tubuhkan Sdn Bhd (Selepas MDEC Lulus)

Selepas dapat surat kelulusan MDEC:

1. Serahkan surat kelulusan kepada setiausaha syarikat
2. Pilih nama syarikat (cadangan: **Tokoflow Sdn Bhd**)
3. Daftar dengan **SSM (Suruhanjaya Syarikat Malaysia)**
4. Bayar modal berbayar **RM 1,000**
5. Tentukan struktur:
   - Pengarah: [perlu bincang — boleh guna pengarah nominal jika diperlukan]
   - Pemegang saham: Aldi + [struktur yang dipersetujui]

**Masa proses:** 2–4 minggu selepas MDEC lulus.

**Dokumen yang akan diterima:**
- Memorandum & Artikel Persatuan (M&A)
- Borang 9 (Sijil Pemerbadanan)
- Borang 24 (Senarai Ahli)
- Borang 49 (Senarai Pengarah)

Simpan semua dokumen ini — perlu untuk langkah seterusnya.

---

## Langkah 3 — Buka Akaun Bank Perniagaan

Selepas Sdn Bhd berjaya didaftarkan:

1. Pergi ke **Maybank Business** atau **CIMB Business**
2. Bawa dokumen Sdn Bhd (semua borang SSM di atas)
3. Buka akaun semasa perniagaan

**Masa proses:** 1–2 minggu.

> Syorkan Maybank Business — liputan ATM dan perkhidmatan meluas di seluruh Malaysia.

---

## Langkah 4 — Daftar Payment Gateway (Buat Dua Serentak)

Selepas ada akaun bank perniagaan, daftar **dua gateway ini pada masa yang sama**:

### A) Billplz — Pembayaran Segera untuk Peniaga

- **Apa:** Peniaga guna akaun Billplz sendiri untuk terima bayaran (FPX, DuitNow QR)
- **Kenapa:** Boleh aktif dalam 1–3 hari selepas KYB
- **Cara daftar:** billplz.com → daftar merchant → upload dokumen Sdn Bhd + maklumat bank
- **Kos:** Tiada yuran bulanan (Basic plan), 1.25% per transaksi FPX
- **Masa proses:** 1–2 minggu

### B) CHIP — Sistem Sub-Pedagang (Matlamat Jangka Panjang)

- **Apa:** Tokoflow daftar sebagai *platform operator*. Peniaga **tidak perlu daftar mana-mana gateway sendiri** — cukup masukkan nombor akaun bank sahaja.
- **Kenapa ini lebih baik:** Pengalaman paling lancar untuk peniaga (Bu Aisyah hanya masuk nombor bank, terus boleh terima bayaran)
- **Cara daftar:** chip-in.asia → hubungi sales untuk *marketplace operator* account
- **Masa proses:** 1–3 minggu untuk kelulusan

> **CHIP adalah matlamat sebenar jangka panjang.** Ini sama cara Shopify Payments dan Square bekerja — peniaga tidak perlu urus gateway sendiri.

---

## Langkah 5 — Integrasi Teknikal (Aldi akan handle)

Selepas CHIP diluluskan sebagai marketplace operator:

- Aldi akan bina integrasi sub-pedagang (anggaran 6–8 minggu kerja teknikal)
- Hasilnya: peniaga masuk nombor akaun bank sahaja → terus boleh terima bayaran dari pelanggan
- Bayaran terus masuk ke akaun bank peniaga — Tokoflow tidak pegang wang langsung

---

## Ringkasan Timeline

| Langkah | Tindakan | Siapa | Masa |
|---|---|---|---|
| 1 | Mohon MDEC MD Status | Danial + company secretary | Minggu ini |
| 2 | Tubuh Sdn Bhd | Company secretary | +6–8 minggu |
| 3 | Buka akaun bank | Danial + Aldi | +2–4 minggu |
| 4A | Daftar Billplz | Danial | +1–2 minggu |
| 4B | Daftar CHIP marketplace | Danial | +1–3 minggu |
| 5 | Integrasi teknikal | Aldi (coding) | +6–8 minggu |
| ✅ | Payment gateway penuh live | — | ~5 bulan dari sekarang |

---

## Tindakan Segera yang Diperlukan daripada Danial

- [ ] Cari dan hubungi **setiausaha syarikat** yang berpengalaman dengan permohonan MDEC
- [ ] Sahkan nama syarikat: **Tokoflow Sdn Bhd** (atau cadangan lain)
- [ ] Maklumkan kepada Aldi tentang struktur pengarah dan pemegang saham yang dicadangkan
- [ ] Minta Aldi hantar pelan perniagaan dan profil pengasas untuk dilampirkan dalam permohonan MDEC

---

## Soalan?

Hubungi Aldi di WhatsApp untuk sebarang pertanyaan teknikal berkaitan product atau integrasi.

---

*Dokumen ini disediakan sebagai panduan umum. Sila dapatkan nasihat undang-undang dan kewangan daripada profesional yang berkelayakan sebelum membuat sebarang keputusan perniagaan.*
