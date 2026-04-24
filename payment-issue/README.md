# Payment Issue — CatatOrder

> Dokumentasi lengkap riset pembayaran untuk CatatOrder: realitas lapangan + eksplorasi solusi teknis.

## Masalah Inti

Flow saat ini:
```
Customer pesan via WA → Seller kasih total + no rekening
  → Customer transfer → kirim screenshot bukti transfer via WA
  → Seller buka mobile banking → cek mutasi manual → cocokkan dengan order
  → Seller konfirmasi via WA
```

**Pain point**: Verifikasi pembayaran 100% manual. Di 20+ pesanan/hari = bottleneck operasional. Fraud bukti transfer palsu naik 1.550%. Tool cek mutasi otomatis baru 0,01% penetrasi.

**Temuan kunci**: Masalah bukan di sisi customer (mereka sudah bisa bayar). Masalah di sisi seller: **verifikasi + matching payment ke order.**

---

## Part 1: Realitas Lapangan (Reality Capture 2026-03-27)

Sumber: `/research/reality/20260327-umkm-payment-reality/`

| # | File | Isi |
|---|------|-----|
| 1 | [01-realitas-pembayaran.md](01-realitas-pembayaran.md) | Fakta: bagaimana UMKM sebenarnya terima bayaran. Cash >90% mikro. Transfer bank = digital dominan di WA commerce |
| 2 | [02-pain-verifikasi.md](02-pain-verifikasi.md) | Masalah inti: verifikasi manual, 5 friction points, fraud data |
| 3 | [03-qris-bukan-jawaban.md](03-qris-bukan-jawaban.md) | Kenapa QRIS saja tidak cukup. Narasi BI vs realitas |
| 4 | [04-landscape-solusi.md](04-landscape-solusi.md) | Solusi yang ada dan kenapa belum berhasil. Gap map |
| 5 | [05-implikasi-catatorder.md](05-implikasi-catatorder.md) | Apa artinya untuk CatatOrder. Pertanyaan terbuka |
| 6 | [06-data-kunci.md](06-data-kunci.md) | Angka-angka kunci (quick reference) |

---

## Part 2: Eksplorasi Solusi Teknis

| # | Solusi | File | Verdict |
|---|---|---|---|
| 1 | Payment Gateway QRIS (Xendit/Midtrans) | [01-payment-gateway-qris.md](01-payment-gateway-qris.md) | Instant webhook, 0.7% MDR — tapi terlalu kompleks untuk UMKM mikro |
| 2 | Mutation Monitoring (Moota/Mutasibank) | [02-mutation-monitoring.md](02-mutation-monitoring.md) | 15 min delay, perlu credential — 0,01% penetrasi |
| 3 | Open Banking API (Brick/Brankas) | [03-open-banking.md](03-open-banking.md) | Pull-based, enterprise pricing — tidak cocok |
| 4 | Bank-Specific APIs | [04-bank-apis.md](04-bank-apis.md) | Pull-based, perlu partnership — terbatas |
| 5 | QRIS Ecosystem & Regulasi | [05-qris-ecosystem.md](05-qris-ecosystem.md) | Context — bagaimana QRIS bekerja di balik layar |
| 6 | Notification Parsing (Android) | [06-notification-parsing.md](06-notification-parsing.md) | Experimental — gratis tapi fragile, Android only |
| 7 | Open Source Tools | [07-open-source.md](07-open-source.md) | Reference — scraper repos, QRIS libs, SDK list |
| 8 | Perbandingan Provider | [08-provider-comparison.md](08-provider-comparison.md) | Head-to-head scoring + phased decision matrix |
| 9 | Rekomendasi & Roadmap | [09-rekomendasi.md](09-rekomendasi.md) | Sprint plan, arsitektur diagram, metrik sukses |

---

## Ringkasan Satu Paragraf

Masalah pembayaran UMKM **bukan di sisi customer** (mereka sudah bisa bayar via transfer/QRIS/cash). Masalahnya di **sisi seller: verifikasi**. Flow dominan = customer transfer via bank lalu kirim screenshot bukti transfer via WA, seller buka mobile banking cek mutasi manual, cocokkan dengan order, konfirmasi ke customer. Di volume 20+ pesanan/hari, ini jadi full-time job. Fraud bukti transfer palsu naik 1.550% (AI-generated). Tool cek mutasi otomatis (Moota) baru 0,01% penetrasi. **CatatOrder sudah punya data order — yang kurang cuma koneksi ke data mutasi untuk auto-match.**

## Gap Terbesar

```
Masalah                           | Solusi yang ada        | Status
----------------------------------|------------------------|--------
Customer bayar via transfer bank  | Mobile banking manual  | SOLVED (tapi manual)
Deteksi uang masuk otomatis       | Moota (0.01%)          | SOLVED tapi adoption 0.01%
Matching mutasi dengan ORDER      | TIDAK ADA              | <<< GAP UTAMA
Fraud bukti transfer palsu        | Cek mutasi manual      | PARTIAL
Rekonsiliasi akhir hari           | TIDAK ADA (utk WA comm)| GAP
Payment + order dalam 1 flow      | Marketplace (22% fee)  | SOLVED tapi extraction
Payment + order tanpa extraction  | TIDAK ADA              | GAP
```

## Regulasi MDR QRIS (efektif Des 2024)

| Kategori Merchant | Transaksi ≤ Rp 500K | Transaksi > Rp 500K |
|---|---|---|
| Usaha Mikro | **0%** | **0.3%** |
| Usaha Kecil/Menengah/Besar | 0.7% | 0.7% |
| Pendidikan | 0.6% | 0.6% |
| SPBU | 0.4% | 0.4% |

*MDR ditanggung merchant, bukan customer.*

## Part 3: Deep Dive Research (2026-03-27)

| File | Isi |
|------|-----|
| [research-nominal-unik.md](research-nominal-unik.md) | Kode unik: Tokopedia/Bukalapak pattern, implementasi, hukum, open source |
| [research-ocr-notification.md](research-ocr-notification.md) | OCR screenshot mutasi + Android notification listener |
| [research-payment-link.md](research-payment-link.md) | Payment link direct-to-seller (Xendit xenPlatform, Midtrans, dll) |
| [research-smart-matching.md](research-smart-matching.md) | 10 pendekatan UX matching tanpa integrasi |
| [research-indonesia-tools.md](research-indonesia-tools.md) | 40+ tools Indonesia: gateway, mutation, POS, commerce |

---

## Part 4: Analisis & Strategi

**>>> [10-analisis-solusi.md](10-analisis-solusi.md) <<<** — Sintesis final. 14 pendekatan dievaluasi. Strategi berlapis.

---

## Solusi: Strategi Berlapis

```
LAYER 0 (1 hari)    Smart Amount Search — seller ketik nominal, CatatOrder show matching order
LAYER 1 (2-3 hari)  Nominal Unik — setiap order +3 digit random, matching jadi 1:1
LAYER 2 (2-3 hari)  Screenshot OCR — seller screenshot mutasi, Gemini batch-match
LAYER 3 (1-2 mgg)   Mutation API — Moota/MesinOtomatis auto-detect (premium)
LAYER 4 (future)     Payment Gateway — Xendit QRIS per order, full auto
```

**Layer 0+1 = 3-4 hari development, zero cost, zero integration, solve matching problem.**

Competitive advantage: **tidak ada tool lain di Indonesia yang combine order management + nominal unik matching untuk WA commerce seller.**

## Next Steps

- [ ] Implement Layer 0: Smart Amount Search
- [ ] Implement Layer 1: Nominal Unik
- [ ] Validate: apakah user actually pay unique amount correctly?
- [ ] Layer 2: Screenshot OCR (if demand)
- [ ] Layer 3: Mutation API as premium feature (if volume)

*Riset dilakukan 2026-03-27. Reality capture: `/research/reality/20260327-umkm-payment-reality/`*
