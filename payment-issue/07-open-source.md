# 07 — Open Source Tools

> Library dan scraper open source yang bisa dipakai atau dijadikan referensi.

## Bank Mutation Scrapers

| Repo | Language | Banks | Deskripsi |
|---|---|---|---|
| [lugassawan/mutasi](https://github.com/lugassawan/mutasi) | PHP/Laravel | BCA, Mandiri, BNI, BRI | Paling comprehensive. Laravel package. |
| [ryuzein/Mutasi-Scrapper](https://github.com/ryuzein/Mutasi-Scrapper) | Node.js | BCA, BRI, Mandiri, Danamon | Active. Puppeteer-based. |
| [apriady/nodejs-bca-scraper](https://github.com/apriady/nodejs-bca-scraper) | Node.js | BCA | Via KlikBCA personal. |
| [kadekjayak/bca-parser](https://github.com/kadekjayak/bca-parser) | PHP | BCA | Simple scraper. |
| [ijortengab/ibank](https://github.com/ijortengab/ibank) | PHP | Multiple | Internet banking client library. |

### Cara Kerja

Semua scraper ini bekerja dengan cara:
1. Login ke iBanking (KlikBCA, Mandiri Online, dll) menggunakan credential user.
2. Navigate ke halaman mutasi.
3. Scrape HTML → parse transaksi.
4. Return structured data (tanggal, nominal, deskripsi, saldo).

### Risiko

- **Bank detect automated login** → akun bisa di-lock.
- **Website iBanking berubah** → scraper break. Perlu maintenance.
- **Credential storage** → liability jika data leak.
- **Terms of Service** → kemungkinan melanggar ToS bank.

## QRIS Libraries

| Repo | Language | Fungsi |
|---|---|---|
| [nicollash/qris-js](https://github.com/nicollash/qris-js) | JavaScript | Parse & generate QRIS string |
| [nicollash/qris-php](https://github.com/nicollash/qris-php) | PHP | Parse & generate QRIS string |

### Cara Pakai untuk Dynamic QRIS

```javascript
// Parse Static QRIS yang sudah ada
const qris = QRIS.parse(staticQrisString);

// Modify: tambah amount
qris.setTransactionAmount(150000);

// Generate Dynamic QRIS string
const dynamicQrisString = qris.toString();

// Render sebagai QR code image
const qrImage = QRCode.toDataURL(dynamicQrisString);
```

**Catatan**: Ini generate QRIS secara lokal tanpa payment gateway. Customer bisa scan dan bayar, uang masuk ke rekening seller. **TAPI tidak ada notification ke CatatOrder.** Ini pure UX improvement, bukan payment detection.

## SMS/Transaction Parsers

| Repo | Language | Bank Support |
|---|---|---|
| [saurabhgupta050890/transaction-sms-parser](https://github.com/saurabhgupta050890/transaction-sms-parser) | TypeScript | India only (HDFC, ICICI, SBI, dll) |

Tidak ada parser untuk bank Indonesia. Perlu build custom jika pakai approach notification parsing.

## Payment Gateway SDKs (Official)

| Gateway | Language | Repo |
|---|---|---|
| Xendit | Node.js | `npm install xendit-node` |
| Xendit | PHP | `composer require xendit/xendit-php` |
| Xendit | Python | `pip install xendit-python` |
| Midtrans | Node.js | `npm install midtrans-client` |
| Midtrans | Go | `github.com/midtrans/midtrans-go` |
| Midtrans | PHP | `composer require midtrans/midtrans-php` |
| Midtrans | Java | `io.midtrans:java-library` |
