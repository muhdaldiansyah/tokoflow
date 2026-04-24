# 03 — Open Banking APIs (Brick, Brankas, Ayoconnect)

> Platform open banking yang baca data transaksi bank dengan consent user. Regulated, aman, tapi pull-based dan mahal.

## Verdict: TIDAK COCOK untuk use case ini.

Alasan:
1. **Pull-based** — tidak ada push notification. Harus polling.
2. **Enterprise pricing** — designed untuk lending/credit scoring, bukan real-time payment detection.
3. **Overkill** — fitur mereka jauh lebih luas dari yang dibutuhkan.

Tetap didokumentasi untuk referensi jika kebutuhan berubah.

## Brick (onebrick.io)

| Aspek | Detail |
|---|---|
| Produk | Transaction Data API — retrieve 12 bulan history |
| Cara kerja | User authenticate via Brick widget (consent-based) |
| Bank support | 7 bank terbesar (90%+ akun), 140+ total |
| Real-time webhook | **TIDAK** — pull-based, fetch transaction list |
| Pricing | Accept Payment mulai Rp 5.000/transaksi. Transaction Data: enterprise pricing. |
| Use case target | Lending, credit scoring, account verification |
| Reference | https://www.onebrick.io, https://www.onebrick.io/pricing |

## Brankas

| Aspek | Detail |
|---|---|
| Lisensi | **Pertama di Indonesia** dengan lisensi Account Information Services (AInS) dari BI |
| Produk | Account info, transaction data, balance |
| Bank support | BCA, Mandiri, BNI, BRI. 40+ bank. 100+ enterprise customers. |
| Real-time | Brankas Statement = "instant retrieval" tapi on-demand pull, bukan push |
| Pricing | Enterprise — contact sales |
| Reference | https://www.brankas.com/ |

## Ayoconnect

| Aspek | Detail |
|---|---|
| Produk | Bank transaction data, balance, assets/liabilities |
| Bank support | Direct debit dengan 7 bank terbesar |
| Real-time | Pull-based |
| Pricing | Enterprise |
| Reference | https://www.ayoconnect.com/ |

## Kapan Open Banking Bisa Relevan

- Jika CatatOrder pivot ke **credit scoring** (nilai kredit UMKM berdasarkan transaksi bank).
- Jika CatatOrder bangun **financial dashboard** (aggregate semua rekening seller).
- Jika regulasi BI **mandate** push notification ke third-party (belum ada timeline).
