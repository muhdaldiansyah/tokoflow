# Deep Dive Analysis: Mengapa Solusi yang Ada Gagal — Profil CatatOrder

> Tujuan: Verifikasi setiap klaim di halaman 3 profil dengan sumber primer dan exact URLs.
>
> Date: 2026-03-08

---

## 1. Audit Setiap Klaim

### BukuKas / Lummo

| Klaim di Profil | Verifikasi | Sumber & URL |
|---|---|---|
| "$142 juta" total funding | **TIDAK TEPAT.** Total terverifikasi ~$130M+ (Series A $10M + interim rounds + Series C $80M). Angka $142M tidak muncul di sumber manapun. | [TechCrunch — $10M Series A](https://techcrunch.com/2021/01/11/bukukas-raises-10-million-led-by-sequoia-capital-india-to-build-a-end-to-end-software-stack-for-indonesian-smes/) / [Crunchbase — Company Profile](https://www.crunchbase.com/organization/bukukas) |
| "Sequoia, Tiger Global" | **BENAR.** Sequoia Capital India led Series A. Tiger Global + Sequoia India led Series C. | [DealStreetAsia — $80M Series C](https://www.dealstreetasia.com/stories/bukukas-lummo-funding-series-c-278033) |
| "Tutup September 2023" | **BENAR.** App ceased May 2023. Voluntary liquidation filed September 2023. | [DealStreetAsia — Lummo liquidation](https://www.dealstreetasia.com/stories/indonesia-lummo-liquidation-360554) |
| "Kembalikan ~$70 juta ke investor" | **BENAR.** DealStreetAsia: "return over $70m to investors" | [DealStreetAsia — mulls shutdown](https://www.dealstreetasia.com/stories/lummo-may-close-operations-340722) |
| "4 pivot" | **TIDAK BISA DIVERIFIKASI** dari sumber primer. The Runway Ventures article mentions multiple pivots tapi angka "4" spesifik tidak confirmed. | [The Runway Ventures — collapse story](https://www.therunway.ventures/p/lummo) |

**Rekomendasi:** Ganti "$142 juta" → "lebih dari $80 juta" (Series C saja yang confirmed) atau "~$130 juta" (total rounds). Hapus "4 pivot" — cukup bilang "beberapa kali pivot."

---

### BukuWarung

| Klaim di Profil | Verifikasi | Sumber & URL |
|---|---|---|
| "$80 juta" funding | **BENAR.** Y Combinator page dan Crunchbase confirm $80M+ total. | [Y Combinator — BukuWarung](https://www.ycombinator.com/companies/bukuwarung) / [Crunchbase](https://www.crunchbase.com/organization/bukuwarung) |
| "Y Combinator, DST Global" | **BENAR.** Also: Valar Ventures, Goodwater Capital, Rocketship.vc, AC Ventures, etc. | [Y Combinator](https://www.ycombinator.com/companies/bukuwarung) |
| "7 juta user" | **PERLU CEK.** YC page says "60M micro-businesses" as target market, not user count. Some sources say "6.5 juta juragan." Exact current count unclear. | [BukuWarung app page](https://play.google.com/store/apps/details?id=com.nicosyahdana.bukuwarung) |
| "$1,7 juta revenue" | **BENAR.** Revenue 2023: $1.7M (up 72% from $992K). | [DealStreetAsia — BukuWarung 2023 earnings](https://www.dealstreetasia.com/stories/bukuwarung-earnings-2023-408041) |
| "Pivot ke fintech" | **BENAR.** Evolved from bookkeeping → payments, PPOB, grosir (Tokoko). | [TechCrunch — fintech pivot](https://techcrunch.com/2020/09/28/indonesian-fintech-startup-bukuwarung-gets-new-funding-to-add-financial-services-for-small-merchants/) |

**Rekomendasi:** Pertahankan data. Ganti "7 juta user" → "jutaan user" atau cek Google Play Store downloads untuk angka pasti.

---

### Selly

| Klaim di Profil | Verifikasi | Sumber & URL |
|---|---|---|
| "Tutup Agustus 2025" | **BENAR.** Multiple user reports and replacement app articles confirm shutdown. Exact date unclear but before August 2025. | [Threads — user report Selly tutup](https://www.threads.com/@army_alghifari/post/DLjUAM_SOjl) / [Totabuan News — QuickOrder pengganti Selly](https://totabuan.news/2025/08/tenang-sekarang-ada-quickorder-aplikasi-keyboard-pengganti-selly-yang-bisa-bantu-seller-umkm-makin-satset-jualannya/) |

**Rekomendasi:** Pertahankan. Sumber cukup kuat (multiple independent reports).

---

### Moka POS

| Klaim di Profil | Verifikasi | Sumber & URL |
|---|---|---|
| "Rp299K/bulan" | **BENAR.** Official pricing page confirms Rp299,000/bulan/outlet as starting price. | [Moka POS — Pricing](https://www.mokapos.com/en/pricing) |
| "Diakuisisi GoTo" | **BENAR.** Gojek acquired Moka April 2020. | [Gojek — akuisisi Moka](https://www.gojek.com/blog/gojek/gojek-akuisisi-moka/) |

---

### Majoo

| Klaim di Profil | Verifikasi | Sumber & URL |
|---|---|---|
| "Rp249K/bulan" | **PERLU UPDATE.** Official pricing page shows starting from Rp129,000/bulan (Starter). Advance package likely higher. | [Majoo — Harga](https://majoo.id/harga) |
| "BRI Ventures" investor | **BENAR.** BRI Ventures participated in Pre-Series A and Series A. | [Majoo — pendanaan](https://majoo.id/news/read/pendanaan-seri-a) |

**Rekomendasi:** Update harga ke "mulai Rp129K/bulan" dari pricing page, atau gunakan range "Rp129-249K/bulan."

---

### Mekari Jurnal

| Klaim di Profil | Verifikasi | Sumber & URL |
|---|---|---|
| "Rp300K+/bulan" | **PERLU UPDATE.** Official pricing shows starting from ~Rp499K/bulan (2024/2025). | [Mekari Jurnal — Pricing](https://www.jurnal.id/en/pricing-plans/) |

**Rekomendasi:** Update ke "mulai Rp499K/bulan."

---

### Mekari Qontak

| Klaim di Profil | Verifikasi | Sumber & URL |
|---|---|---|
| "Rp400K+/user/bulan" | **BENAR.** Official pricing confirms starting from Rp400,000/user/bulan. | [Mekari Qontak — Pricing](https://qontak.com/en/pricing/) |

---

### Accurate

| Klaim di Profil | Verifikasi | Sumber & URL |
|---|---|---|
| Disebutkan sebagai contoh "Akuntansi Cloud" | Perlu pricing verification. | Pricing not publicly listed — requires demo request. |

**Rekomendasi:** Ganti Accurate → gunakan Mekari Jurnal saja sebagai contoh (pricing terverifikasi).

---

## 2. Klaim "$300 juta" Total Investment

Ini adalah penjumlahan:
- BukuKas/Lummo: ~$130M+ (TechCrunch, Crunchbase, DealStreetAsia)
- BukuWarung: $80M+ (Y Combinator, Crunchbase)
- Selly: tidak diketahui
- Moka: $27M+ sebelum diakuisisi GoTo (Crunchbase)
- Majoo: ~$19M (Majoo press releases)
- Lainnya: BukuKas + BukuWarung saja sudah $210M+

**Verdict:** "$300 juta" sebagai angka total untuk seluruh investasi di UMKM digital tools di Indonesia **masuk akal** berdasarkan penjumlahan, tapi kita tidak punya satu sumber yang menyebut angka tepat "$300 juta." Lebih aman: "lebih dari $200 juta" (BukuKas + BukuWarung saja) yang fully verifiable.

---

## 3. Master URL List — Semua Sumber Terverifikasi

### BukuKas/Lummo
| # | URL | Informasi |
|---|---|---|
| 1 | [techcrunch.com — BukuKas $10M Series A](https://techcrunch.com/2021/01/11/bukukas-raises-10-million-led-by-sequoia-capital-india-to-build-a-end-to-end-software-stack-for-indonesian-smes/) | $10M Series A, Sequoia Capital India |
| 2 | [dealstreetasia.com — $80M Series C](https://www.dealstreetasia.com/stories/bukukas-lummo-funding-series-c-278033) | $80M Series C, Tiger Global + Sequoia |
| 3 | [dealstreetasia.com — mulls shutdown, return $70M](https://www.dealstreetasia.com/stories/lummo-may-close-operations-340722) | Considering shutdown, return >$70M |
| 4 | [dealstreetasia.com — voluntary liquidation](https://www.dealstreetasia.com/stories/indonesia-lummo-liquidation-360554) | Filed voluntary liquidation Sept 2023 |
| 5 | [crunchbase.com — Lummo](https://www.crunchbase.com/organization/bukukas) | Company profile & all funding rounds |
| 6 | [therunway.ventures — Lummo collapse](https://www.therunway.ventures/p/lummo) | Detailed story of collapse |

### BukuWarung
| # | URL | Informasi |
|---|---|---|
| 7 | [ycombinator.com — BukuWarung](https://www.ycombinator.com/companies/bukuwarung) | Company profile, $80M+ funding |
| 8 | [crunchbase.com — BukuWarung](https://www.crunchbase.com/organization/bukuwarung) | Funding rounds detail |
| 9 | [dealstreetasia.com — 2023 earnings](https://www.dealstreetasia.com/stories/bukuwarung-earnings-2023-408041) | Revenue $1.7M, losses cut 75% |
| 10 | [techcrunch.com — fintech pivot](https://techcrunch.com/2020/09/28/indonesian-fintech-startup-bukuwarung-gets-new-funding-to-add-financial-services-for-small-merchants/) | Pivot to fintech services |

### Selly
| # | URL | Informasi |
|---|---|---|
| 11 | [totabuan.news — QuickOrder pengganti Selly](https://totabuan.news/2025/08/tenang-sekarang-ada-quickorder-aplikasi-keyboard-pengganti-selly-yang-bisa-bantu-seller-umkm-makin-satset-jualannya/) | Selly telah resmi berhenti beroperasi |

### Moka POS
| # | URL | Informasi |
|---|---|---|
| 12 | [mokapos.com — Pricing](https://www.mokapos.com/en/pricing) | Rp299K/bulan/outlet |
| 13 | [gojek.com — akuisisi Moka](https://www.gojek.com/blog/gojek/gojek-akuisisi-moka/) | GoTo/Gojek akuisisi Moka |

### Majoo
| # | URL | Informasi |
|---|---|---|
| 14 | [majoo.id — Harga](https://majoo.id/harga) | Mulai Rp129K/bulan |
| 15 | [majoo.id — Pendanaan](https://majoo.id/news/read/pendanaan-seri-a) | BRI Ventures, AC Ventures, Xendit |

### Mekari Jurnal
| # | URL | Informasi |
|---|---|---|
| 16 | [jurnal.id — Pricing](https://www.jurnal.id/en/pricing-plans/) | Mulai ~Rp499K/bulan |

### Mekari Qontak
| # | URL | Informasi |
|---|---|---|
| 17 | [qontak.com — Pricing](https://qontak.com/en/pricing/) | Mulai Rp400K/user/bulan |

---

## 4. Koreksi yang Harus Dilakukan di Profil

| # | Sekarang | Harus | Alasan |
|---|---|---|---|
| 1 | BukuKas "$142 juta" | "lebih dari $80 juta" atau "~$130 juta" | $142M tidak terverifikasi. Series C $80M confirmed, total ~$130M |
| 2 | "4 pivot" | Hapus atau "beberapa kali pivot" | Angka spesifik tidak terverifikasi |
| 3 | BukuWarung "7 juta user" | "jutaan user" | Angka "7 juta" spesifik tidak confirmed |
| 4 | Majoo "Rp249K/bulan" | "mulai Rp129K/bulan" | Pricing page says Rp129K starter |
| 5 | Mekari Jurnal "Rp300K+/bulan" | "mulai Rp499K/bulan" | Pricing page updated |
| 6 | Accurate | Hapus — pricing tidak publik | Gunakan Mekari Jurnal saja |
| 7 | "$300 juta" total | "lebih dari $200 juta" | BukuKas+BukuWarung=$210M+ verifiable. $300M needs wider calc |
| 8 | "Rp4,8 Triliun" title | Hapus — ini terjemahan $300M yang sudah diubah | Judul sudah updated |

---

## 5. Proposed Catatan Kaki (with exact URLs)

¹ DealStreetAsia — [dealstreetasia.com/stories/lummo-may-close-operations-340722](https://www.dealstreetasia.com/stories/lummo-may-close-operations-340722)
² DealStreetAsia — [dealstreetasia.com/stories/bukuwarung-earnings-2023-408041](https://www.dealstreetasia.com/stories/bukuwarung-earnings-2023-408041)
³ Moka POS — [mokapos.com/en/pricing](https://www.mokapos.com/en/pricing)
⁴ Majoo — [majoo.id/harga](https://majoo.id/harga)
⁵ Mekari Jurnal — [jurnal.id/en/pricing-plans](https://www.jurnal.id/en/pricing-plans/)
⁶ Mekari Qontak — [qontak.com/en/pricing](https://qontak.com/en/pricing/)

---

*Dianalisis: 2026-03-08*
