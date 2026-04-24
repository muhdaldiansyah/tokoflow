# Pain Verifikasi Pembayaran

## Masalah Inti

Masalah pembayaran UMKM **bukan** "bagaimana customer bayar" — itu sudah jalan (transfer, QRIS, cash). Masalahnya: **bagaimana seller tahu uang sudah masuk dan mencocokkannya dengan order yang benar.**

## Severity per Volume Order

| Volume order/hari | Waktu verifikasi | Severity |
|-------------------|-----------------|----------|
| 1-5 | 5-15 menit | Manageable |
| 5-10 | 15-30 menit | Annoying |
| 10-20 | 30-60 menit | Significant |
| 20-40 | 1-3 jam | Painful — butuh dedicated time |
| 40-100+ | "Kerja penuh waktu" | Breaking point — butuh hire orang atau tool |

**Threshold pain = ~20+ pesanan/hari.** Di bawah ini, manual masih OK. Di atas ini, verifikasi jadi bottleneck operasional.

## 5 Friction Points Spesifik

### 1. Cek Mutasi Manual — Repetitif dan Memakan Waktu

Seller harus:
- Buka app mobile banking
- Scroll mutasi rekening
- Cari transfer yang cocok nominal + nama pengirim
- Kembali ke WA, cari chat customer yang sesuai
- Konfirmasi

Ini diulang untuk SETIAP pesanan. Tidak ada shortcut. Tidak ada batch processing. 60% customer expect respon <10 menit — seller yang lambat kehilangan 30-50% kesempatan transaksi.

### 2. Screenshot Bukti Transfer Palsu — Ancaman Nyata

- 700-800 kasus penipuan online per hari di Indonesia
- Kerugian Rp9,1 triliun dalam 15 bulan (Nov 2024 - Jan 2026)
- Fraud AI-generated naik 1.550% (2022-2024)
- Indonesia ranking #2 paling rawan fraud global
- BI sudah keluarkan warning resmi tentang bukti transfer palsu AI

**Time pressure paradox:** Seller harus respon cepat (close transaksi) DAN verifikasi teliti (hindari fraud). Keduanya bertentangan — dan ini celah yang dieksploitasi penipu.

Modus yang terdokumentasi:
- Screenshot transfer palsu (edit gambar/AI generate)
- Transfer nyata tapi nominal berbeda (kurang Rp1-5)
- Transfer lalu dibatalkan (reversal scam — rare tapi ada)
- Claim sudah transfer padahal belum (social engineering + time pressure)

### 3. Multi-Chat Overload di WhatsApp

Pesanan dan konfirmasi pembayaran masuk di chat yang sama, bercampur dengan chat personal, chat grup, dll. Seller harus scroll, cari, cocokkan. Di volume tinggi, ini chaos.

### 4. Nominal Tidak Cocok

- Customer transfer nominal bulat (Rp100.000 untuk order Rp97.500)
- Customer transfer partial (DP)
- Customer transfer lebih (minta kembalian)
- Kesalahan ketik nominal
- Transfer dari rekening orang lain (suami/teman bayarin)

Semua variasi ini harus di-handle manual per case.

### 5. Rekonsiliasi Akhir Hari

Di akhir hari, seller yang serius perlu cocokkan:
- Total uang masuk (dari mutasi bank)
- Total pesanan yang dibayar (dari catatan manual/WA scroll)
- Cek apakah ada yang miss

>70% UMKM tidak punya sistem akuntansi formal. Rekonsiliasi ini biasanya tidak dilakukan — atau dilakukan dengan cara yang sangat kasar ("kayaknya udah pas deh").

## Data yang Belum Ada (Blind Spots)

- **Waktu tepat verifikasi per UMKM per hari** — tidak ada survey formal, hanya estimasi kualitatif
- **Berapa transaksi gagal karena verifikasi terlambat?** — tidak ada data
- **Berapa UMKM yang kirim barang TANPA verifikasi** (risk-taking karena pressure)? — tidak ada data
- **Conversion rate WA order → actual payment** — tidak ada data publik

## Sumber

- OJK/IASC fraud statistics 2024-2026 (T1)
- Bank Indonesia warning on AI-generated fake transfers (T1)
- Global Fraud Index 2025 (T2)
- LinkQu industry analysis on verification pain (T5)
- BePragma response time study (T5)
