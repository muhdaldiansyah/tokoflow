# Research: Nominal Unik / Unique Amount Payment Method in Indonesia

> Riset teknik "Nominal Unik" (Kode Unik) untuk auto-matching pembayaran transfer bank ke order.
> Tanggal riset: 2026-03-27

---

## Table of Contents

1. [Apa itu Nominal Unik?](#1-apa-itu-nominal-unik)
2. [Siapa yang Menggunakan?](#2-siapa-yang-menggunakan)
3. [Cara Kerja Teknis](#3-cara-kerja-teknis)
4. [Implementasi di Platform Indonesia](#4-implementasi-di-platform-indonesia)
5. [SaaS & Tools untuk Implementasi](#5-saas--tools-untuk-implementasi)
6. [Open Source Implementations](#6-open-source-implementations)
7. [Kombinasi dengan Mutation Monitoring](#7-kombinasi-dengan-mutation-monitoring)
8. [SaaS Khusus UMKM](#8-saas-khusus-umkm)
9. [Limitasi dan Risiko](#9-limitasi-dan-risiko)
10. [Perbandingan: Kode Unik vs Virtual Account vs QRIS](#10-perbandingan-kode-unik-vs-virtual-account-vs-qris)
11. [Aspek Hukum](#11-aspek-hukum)
12. [Implikasi untuk CatatOrder](#12-implikasi-untuk-catatorder)

---

## 1. Apa itu Nominal Unik?

**Nominal Unik** (juga disebut **Kode Unik**) adalah teknik menambahkan 3 digit angka kecil (Rp 1-999) ke nominal pembayaran, sehingga setiap transaksi memiliki jumlah yang unik dan bisa dicocokkan secara otomatis dengan order tertentu.

### Contoh

```
Total belanja:      Rp 150.000
Kode unik:          +Rp    037
Yang harus ditransfer: Rp 150.037
```

Ketika sistem mendeteksi mutasi masuk sebesar Rp 150.037, ia tahu persis itu untuk order mana -- tanpa perlu bukti transfer screenshot atau konfirmasi manual.

### Kenapa 3 Digit?

- Range 001-999 = **999 kemungkinan kombinasi** per nominal dasar
- Tambahan maksimal Rp 999 -- cukup kecil untuk tidak memberatkan customer
- Cukup besar untuk membedakan transaksi concurrent dengan nominal dasar sama

### Cara Kerja Inti

```
1. Customer checkout → sistem generate kode unik 3 digit
2. Total pembayaran = harga asli + kode unik
3. Customer transfer TEPAT sesuai nominal unik
4. Sistem cek mutasi bank → temukan mutasi = nominal unik
5. Match ditemukan → order otomatis dikonfirmasi
```

---

## 2. Siapa yang Menggunakan?

### Marketplace Besar

| Platform | Implementasi | Detail |
|----------|-------------|--------|
| **Tokopedia** | Kode unik pada transfer bank | 3 digit ditambahkan ke total. Verifikasi 1x24 jam (sesama bank), 2x24 jam (antar bank). Kode unik juga sebagai anti-fraud |
| **Bukalapak** | Kode unik pada checkout | 3 digit otomatis dari sistem. Contoh: total Rp 172.000 → bayar Rp 172.772. Verifikasi maks 1x24 jam |
| **Blibli** | Kode unik transfer | Sistem serupa, 3 digit terakhir |
| **Jakmall** | Kode unik + berita transfer | Kombinasi kode unik di nominal + keterangan transfer |

### Platform Lain

| Platform | Konteks |
|----------|---------|
| **Kitabisa** | Donasi -- kode unik 3 digit untuk auto-verifikasi donasi masuk |
| **OY! Indonesia** | Fintech -- kode unik di fitur Manual Transfer, bisa ditarik kembali ke saldo OY! |
| **DomaiNesia** | Hosting -- kode unik untuk pembayaran layanan via BCA/Mandiri |
| **Jetorbit** | Hosting -- kode unik pada invoice pembayaran |
| **IsidIisini** | Top-up -- kode unik untuk verifikasi otomatis |
| **Kasir Pintar** | POS -- kode unik untuk top up coin/PPOB |
| **Flip** | Fintech -- kode unik untuk transfer ke rekening Flip |
| **Fazz/Payfazz** | Agen -- kode unik untuk top up saldo agen |

### Software Akuntansi

| Software | Fitur |
|----------|-------|
| **Accurate Online** | Fitur "Kode Unik Pembayaran" bawaan. Auto-generate kode unik pada faktur penjualan. Auto-match dengan mutasi bank via Smartlink e-banking. Otomatis buat transaksi Penerimaan Penjualan ketika mutasi masuk cocok |

---

## 3. Cara Kerja Teknis

### 3.1 Generating Kode Unik

**Metode 1: Random (Paling Umum)**
```php
$kode_unik = rand(1, 999);  // atau rand(0, 999) jika termasuk 0
$total_bayar = $subtotal + $kode_unik;
```

**Metode 2: Dari Order ID (Deterministic)**
```php
$kode_unik = substr($order_id, -3);  // 3 digit terakhir dari ID order
$total_bayar = $subtotal + intval($kode_unik);
```

**Metode 3: Dari Grand Total (Self-derived)**
```php
$grand_total = $subtotal + $shipping + $tax;
$kode_unik = substr($grand_total, -3);  // 3 digit terakhir dari total
```

**Metode 4: Time-based (WooCommerce snippet)**
```php
// Menggunakan menit saat checkout sebagai kode unik
$_SESSION['unik'] = date('i');  // 00-59
$woocommerce->cart->add_fee('Unique Code', $_SESSION['unik']);
```

### 3.2 Collision Prevention

Masalah utama: bagaimana kalau 2 order punya nominal + kode unik yang sama?

**Strategi anti-collision:**

1. **Time window**: Kode unik hanya valid per hari. Jadi `Rp 150.037` hari ini dan `Rp 150.037` besok = 2 transaksi berbeda
2. **Active order check**: Sebelum assign kode unik, cek apakah kombinasi (nominal_dasar + kode_unik) sudah aktif di order lain yang belum dibayar
3. **Expiry**: Kode unik punya masa berlaku (3-14 hari). Setelah expired, bisa dipakai lagi
4. **Range partitioning**: Bagi range 001-999 per bank account atau per payment channel

### 3.3 Matching Logic (Pseudocode)

```
ON new_bank_mutation(amount, date, description):

  # Extract possible kode_unik from amount
  kode_unik = amount % 1000  # 3 digit terakhir

  # Find matching unpaid order
  order = SELECT * FROM orders
          WHERE status = 'unpaid'
          AND kode_unik = kode_unik
          AND DATE(created_at) = date
          ORDER BY created_at ASC
          LIMIT 1

  IF order AND order.total_with_unique == amount:
    UPDATE orders SET status = 'paid' WHERE id = order.id
    NOTIFY seller "Order #{order.id} auto-confirmed"
  ELSE:
    LOG "Unmatched mutation: {amount}"
```

### 3.4 Database Schema Requirements

```sql
-- Minimal fields yang diperlukan
ALTER TABLE orders ADD COLUMN kode_unik SMALLINT;        -- 0-999
ALTER TABLE orders ADD COLUMN total_with_unique INTEGER;  -- total + kode_unik
ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN kode_unik_expires_at TIMESTAMPTZ;

-- Index untuk matching cepat
CREATE INDEX idx_orders_payment_match
  ON orders(kode_unik, payment_status, created_at)
  WHERE payment_status = 'unpaid';
```

---

## 4. Implementasi di Platform Indonesia

### 4.1 Tokopedia

- Menambahkan 3 digit unik ke total belanja saat checkout via transfer bank
- Contoh: Total Rp 100.000 → bayar Rp 100.535
- Verifikasi otomatis berdasarkan kode unik
- Waktu verifikasi: 1x24 jam sesama bank, 2x24 jam antar bank
- Kode unik juga berfungsi sebagai anti-fraud: memastikan dana tidak disalahgunakan
- **Kode unik TIDAK dikembalikan** (menjadi revenue Tokopedia)

### 4.2 Bukalapak

- Sistem serupa: 3 digit otomatis ditambahkan ke total
- Contoh: Invoice Rp 172.000 → bayar Rp 172.772
- Harus transfer TEPAT termasuk kode unik
- Verifikasi maks 1x24 jam
- Jika tidak sesuai: harus upload bukti pembayaran manual

### 4.3 OY! Indonesia

- Kode unik pada fitur Manual Transfer
- 3 digit ditambahkan ke jumlah transfer
- **Kode unik DIKEMBALIKAN** ke saldo deposit OY! user
- Bisa ditarik setelah terkumpul Rp 10.000 (maks deposit Rp 100.000)
- Alasan: user experience -- customer tidak merasa rugi

### 4.4 Accurate Online (Software Akuntansi)

- Fitur bawaan "Kode Unik Pembayaran" pada faktur penjualan
- Bisa menambahkan atau mengurangi nilai faktur
- Integrasi dengan Smartlink e-banking: tarik rekening koran otomatis
- Auto-match: jika ada mutasi masuk = nilai faktur + kode unik → otomatis buat Penerimaan Penjualan
- Target user: bisnis menengah-besar yang sudah pakai Accurate

---

## 5. SaaS & Tools untuk Implementasi

### 5.1 Mutation Monitoring Services (Inti dari Sistem)

Untuk kode unik bekerja otomatis, kamu butuh **layanan yang membaca mutasi bank**. Tanpa ini, kode unik tetap harus dicek manual.

| Service | Harga | Banks | Interval | Fitur Kode Unik | Integrasi |
|---------|-------|-------|----------|-----------------|-----------|
| **Moota.co** | Rp 100K/bulan flat (unlimited transaksi) | BCA, BRI, BNI, Mandiri, BSI, dll | Configurable | Webhook filter by kode unik range (start-end). Konfigurasi range di dashboard | API, Webhook, WooCommerce plugin, Laravel package |
| **Mutasibank.co.id** | Rp 1K/hari/rekening (~Rp 30K/bulan) | BCA, BRI, BNI, Mandiri, Permata, BSI | 15 min default (bisa 3-10 min) | Callback URL per mutasi. Module auto update order status berdasarkan total + kode unik | API, Callback, WHMCS, WordPress |
| **MesinOtomatis.com** | Rp 0.9K/hari/rekening | BCA, BRI, BNI, Mandiri, BSI | 90-360 detik | API + Webhook push | API, Webhook, WhatsApp gateway, SMS gateway |
| **Mutasi.co.id** | Deposit mulai Rp 50K (~Rp 1K/hari/rek) | BCA, BRI, BNI, Mandiri, BSI, Permata | Default 15 min (bisa 3 min) | Callback URL, auto order status update | WHMCS, HostBill, API |
| **alMutasi.com** | (Varies) | Multi-bank | Configurable | Verifikasi pembayaran berbasis nominal unik otomatis | API, Webhook |
| **Billingotomatis** | (Varies) | BCA, BRI, BNI, Mandiri, BSM, Danamon, Sinarmas | Configurable | Plugin WooCommerce khusus dengan kode unik generator | WordPress/WooCommerce plugin, WHMCS |

### 5.2 Payment Gateways dengan Virtual Account

Alternatif yang lebih "proper" dari kode unik -- menggunakan Virtual Account (nomor rekening unik per transaksi):

| Gateway | Fee per VA | Banks | Auto-confirm | Registrasi |
|---------|-----------|-------|-------------|------------|
| **TriPay** | Rp 4.250/txn | BRI, BNI, BCA, Mandiri, Permata, Maybank VA | Ya (instant webhook) | KTP saja, mudah untuk UMKM |
| **Midtrans** | Rp 4.000-4.500/txn | 10+ bank VA | Ya (instant webhook) | Perlu badan usaha |
| **Xendit** | Rp 4.000-4.500/txn | 7+ bank VA | Ya (instant webhook) | Perlu badan usaha |
| **Duitku** | Rp 3.500-4.500/txn | Multi-bank VA | Ya (instant webhook) | KTP untuk individual |
| **iPaymu** | Varies | BCA, BRI, BNI, Mandiri, BSI, dll VA | Ya (real-time) | Mudah, cocok UMKM |

### 5.3 Moota Webhook Configuration Detail

Moota adalah yang paling banyak digunakan untuk kode unik + auto-matching:

**Webhook API:**
```
POST /api/v2/integration/webhook
{
  "url": "https://yourapp.com/api/webhook/moota",
  "bank_account_id": "optional-filter",
  "kinds": "credit",           // hanya uang masuk
  "secret_token": "your-secret",
  "start_unique_code": 1,      // range kode unik mulai
  "end_unique_code": 999       // range kode unik akhir
}
```

**Webhook Payload (tiap mutasi masuk):**
- Moota POST JSON berisi detail transfer (amount, description, timestamp)
- Header contains `Signature` untuk validasi

**Signature Verification:**
```php
$signature = hash_hmac('sha256', $payload_json, $secret_token);
// Bandingkan dengan header 'Signature'
```

**Kode Unik Range Filter:**
- Set range 300-500: hanya proses mutasi dengan 3 digit terakhir 300-500
- Set range 1-999: proses semua mutasi berkode unik
- Set range 0-999: proses SEMUA mutasi termasuk tanpa kode unik

---

## 6. Open Source Implementations

### 6.1 WooCommerce Kode Unik Snippet

**Repo:** [selampemayat/snippet-kode-unik-woocommerce](https://github.com/selampemayat/snippet-kode-unik-woocommerce)

```php
// Simplified version -- adds unique fee to WooCommerce cart
function woo_add_cart_fee() {
    global $woocommerce;
    $_SESSION['unik'] = date('i'); // menit sebagai kode unik
    $woocommerce->cart->add_fee(__('Unique Code', 'woocommerce'), $_SESSION['unik']);
}
add_action('woocommerce_cart_calculate_fees', 'woo_add_cart_fee');
```

**Catatan:** Implementasi sangat sederhana. Hanya pakai menit (00-59) -- range terlalu kecil untuk production. Perlu dimodifikasi.

### 6.2 Moota WooCommerce Plugin

**Repo:** [mootaco/moota-woocommerce](https://github.com/mootaco/moota-woocommerce)

Plugin resmi Moota untuk WooCommerce. Fitur:
- Payment gateway WooCommerce terintegrasi Moota
- Auto konfirmasi pembayaran
- Kode unik otomatis per order

### 6.3 Laravel Moota Package

**Repo:** [otnansirk/laravel-moota](https://github.com/otnansirk/laravel-moota)

```bash
composer require otnansirk/laravel-moota
```

Fitur kode unik:
```php
$data = [
    'with_unique_code' => 1,
    'start_unique_code' => 10,
    'end_unique_code' => 999,
    'increase_total_from_unique_code' => 1
];
MootaPay::contract($data)->save();
```

Webhook management:
```php
MootaWebhook::store(['url' => 'https://app.com/webhook']);
MootaWebhook::list();
MootaMutation::webhook($mutationId); // test push
```

### 6.4 Moota PHP SDK (Official)

**Repo:** [moota-co/moota-php-sdk](https://github.com/moota-co/moota-php-sdk)

```bash
composer require moota-co/moota-php-sdk
```

PHP 8.0+. Fitur: auth, bank management, mutation handling, webhook, tagging, topup.

### 6.5 Unofficial Laravel Moota

**Repo:** [yugo412/moota](https://github.com/yugo412/moota) (arvernester/moota)

### 6.6 TriPay Laravel Client

**Repo:** [nekoding/tripay](https://github.com/nekoding/tripay)

PHP client untuk TriPay payment gateway, termasuk Virtual Account yang secara fungsional menggantikan kebutuhan kode unik.

### 6.7 Billingotomatis WordPress Plugin

**Plugin:** [Billingotomatis Payment Gateway Indonesia](https://wordpress.org/plugins/billingotomatis-payment-gateway-indonesia/)

WooCommerce plugin dengan fitur:
- Kode unik otomatis dari Order ID (configurable digit count)
- Masa berlaku kode unik (configurable hari)
- Tampil sebagai line item atau diskon
- Key berita transfer untuk identifikasi di mutasi
- Auto set status order saat match ditemukan
- Toleransi kelebihan bayar (configurable)

### 6.8 Go Payment (Multi-gateway)

**Repo:** [imrenagi/go-payment](https://github.com/imrenagi/go-payment)

Payment connector Go untuk Midtrans dan Xendit. Bisa digunakan untuk Virtual Account approach.

---

## 7. Kombinasi dengan Mutation Monitoring

### Flow: Kode Unik + Moota = Auto-Match

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│  Customer    │     │  Bank        │     │  Moota         │
│  Checkout    │     │  Account     │     │  (Monitoring)  │
│              │     │              │     │                │
│ Total:150.000│     │              │     │                │
│ +Unik:   037│     │              │     │                │
│ =Bayar:  037│     │              │     │                │
│   150.037   │     │              │     │                │
└──────┬──────┘     └──────┬───────┘     └───────┬────────┘
       │                   │                     │
       │  Transfer         │                     │
       │  Rp 150.037       │                     │
       │──────────────────>│                     │
       │                   │                     │
       │                   │  Mutasi masuk       │
       │                   │  Rp 150.037         │
       │                   │────────────────────>│
       │                   │                     │
       │                   │                     │  POST webhook
       │                   │                     │  {amount:150037}
       │                   │                     │──────────────┐
       │                   │                     │              │
       │                   │                     │              v
       │                   │                     │  ┌───────────────┐
       │                   │                     │  │  Your App     │
       │                   │                     │  │               │
       │                   │                     │  │  Match:       │
       │                   │                     │  │  150037 % 1000│
       │                   │                     │  │  = 037        │
       │                   │                     │  │               │
       │                   │                     │  │  Find order   │
       │                   │                     │  │  with kode=037│
       │                   │                     │  │  today, unpaid│
       │                   │                     │  │               │
       │                   │                     │  │  → MATCH!     │
       │                   │                     │  │  → Auto-paid  │
       │                   │                     │  └───────────────┘
```

### Tutorial Implementation (CodeIgniter/Laravel + Moota)

Sumber: [virtualkoding.blogspot.com](https://virtualkoding.blogspot.com/2020/09/tutorial-pembayaran-otomatis.html)

**Step 1: Generate kode unik saat checkout**
```php
$kode_unik = rand(0, 999);
// Atau lebih aman: substr($grand_total, -3)
```

**Step 2: Simpan di database**
```php
// Fields: kode_unik, total_pembayaran, status_pembayaran, tanggal_checkout
```

**Step 3: Setup Moota webhook**
- Daftar di Moota, tambah akun bank, topup point
- Set webhook URL ke endpoint app kamu
- Set secret token untuk security

**Step 4: Handle webhook**
```php
// Controller menerima POST dari Moota
$data = $request->all(); // JSON mutation data
$amount = $data['amount'];
$kode_unik_received = $amount % 1000;

// Cari order yang match
$order = Order::where('kode_unik', $kode_unik_received)
    ->where('payment_status', 'unpaid')
    ->whereDate('created_at', today())
    ->first();

if ($order && $order->total_with_unique == $amount) {
    $order->update(['payment_status' => 'paid']);
    // Notify seller
}
```

**Catatan penting dari tutorial:**
- Gunakan waktu expired untuk menghindari kode unik yang sama
- Validasi berdasarkan kode unik + tanggal checkout yang sama
- Sandbox Moota tersedia untuk testing

---

## 8. SaaS Khusus UMKM

### 8.1 Layanan Cek Mutasi + Auto-Confirm

| Layanan | Target | Harga/bulan | Fitur UMKM |
|---------|--------|-------------|------------|
| **Moota.co** | UMKM, toko online | ~Rp 100K flat | Uang masuk utuh tanpa potongan. API + webhook. WooCommerce plugin |
| **MesinOtomatis.com** | UMKM, bisnis online | ~Rp 27K/rek | Bank gateway + WA gateway + SMS gateway. Interval 90-360 detik |
| **Mutasibank.co.id** | Hosting, toko online | ~Rp 30K/rek | Histori 365 hari. Unlimited rekening. OpenCart integration |
| **Mutasi.co.id** | Hosting (WHMCS) | ~Rp 30K/rek | WHMCS + HostBill native integration |
| **Billingotomatis.com** | WooCommerce stores | Varies | WordPress plugin resmi. Kode unik built-in |

### 8.2 Payment Gateways Mudah untuk UMKM

| Gateway | Cocok UMKM? | Alasan |
|---------|-------------|--------|
| **TriPay** | Sangat cocok | KTP saja, fee rendah (Rp 4.250), banyak channel |
| **iPaymu** | Cocok | Mudah daftar, VA + e-wallet, real-time notif via WA/email |
| **Duitku** | Cocok | Individual account available |
| **Midtrans** | Kurang cocok mikro | Perlu badan usaha untuk fitur lengkap |

### 8.3 Platform Toko Online dengan Auto-Confirm Bawaan

| Platform | Fitur Payment |
|----------|--------------|
| **Halado.id** | Integrasi Moota untuk auto-confirm donasi/pembayaran. Support multiple payment gateway (Ipay88, Midtrans, Doku, iPaymu) |
| **AdminCerdas** | Integrasi cekmutasi.co.id untuk toko online UMKM |

---

## 9. Limitasi dan Risiko

### 9.1 Masalah Teknis

| Masalah | Deskripsi | Severity |
|---------|-----------|----------|
| **Collision** | 2 order dengan nominal dasar sama + kode unik sama pada hari yang sama | HIGH -- bisa salah match |
| **Salah transfer** | Customer transfer nominal TANPA kode unik atau kode unik salah | HIGH -- transaksi tidak terdeteksi, perlu manual intervention |
| **Duplikat nominal** | Di volume tinggi, range 001-999 bisa habis untuk satu nominal dasar tertentu | MEDIUM -- perlu manajemen range |
| **Delay matching** | Mutasi bank dicek per interval (3-15 menit), bukan real-time | MEDIUM -- customer menunggu |
| **Pembulatan bank** | Beberapa metode transfer membulatkan nominal | LOW -- jarang terjadi |
| **Cross-day** | Customer transfer keesokan harinya, kode unik sudah expired | MEDIUM -- perlu grace period |

### 9.2 Masalah UX

| Masalah | Deskripsi |
|---------|-----------|
| **Customer bingung** | Harus transfer TEPAT Rp 150.037, bukan Rp 150.000. Banyak yang salah |
| **Siapa yang tanggung?** | Kode unik Rp 37 -- ditanggung customer atau dikembalikan? Tidak ada standar |
| **Nominal ganjil** | Customer curiga kenapa nominal "aneh" -- trust issue |
| **Multipayment** | Kalau order dipecah jadi 2 transfer, sistem tidak bisa match |

### 9.3 Masalah Keamanan

| Masalah | Deskripsi |
|---------|-----------|
| **Credential sharing** | Moota/mutation checker butuh credential iBanking untuk scrape mutasi |
| **Scraping fragile** | Bank bisa ubah UI iBanking → scraping broken → auto-confirm mati |
| **Replay attack** | Jika validasi lemah, satu mutasi bisa dipakai untuk confirm 2 order |

### 9.4 Kasus Error yang Terjadi di Lapangan

Dari data customer support berbagai platform:

1. **Deposit masuk ke akun orang lain** -- karena kode unik yang ditransfer kebetulan cocok dengan order user lain (Kasir Pintar, Fazz)
2. **Verifikasi gagal, harus manual upload bukti** -- karena nominal tidak tepat (Bukalapak)
3. **Pengembalian kode unik sulit** -- platform tidak punya e-money system untuk refund Rp 37 (banyak platform)
4. **Transfer tanpa kode unik = stuck** -- transaksi tidak bisa diproses otomatis (Flip)

---

## 10. Perbandingan: Kode Unik vs Virtual Account vs QRIS

| Aspek | Kode Unik | Virtual Account | QRIS |
|-------|-----------|-----------------|------|
| **Biaya** | Gratis (hanya bayar mutation checker Rp 30-100K/bulan) | Rp 3.500-4.500/transaksi | 0-0.7% MDR |
| **Setup** | Mudah (DIY) | Perlu payment gateway partner | Perlu payment gateway |
| **Registrasi** | Tidak perlu (pakai rekening sendiri) | KTP atau badan usaha | Badan usaha/UMKM |
| **Auto-confirm** | Ya (via mutation checker + matching) | Ya (instant via webhook gateway) | Ya (instant via webhook) |
| **Latency** | 3-15 menit (interval cek mutasi) | Real-time (push notification) | Real-time |
| **Akurasi match** | 95-98% (tergantung customer transfer tepat) | ~100% (nomor VA unik per transaksi) | ~100% |
| **UX customer** | Harus transfer TEPAT nominal ganjil | Transfer ke nomor VA (familiar) | Scan QR |
| **Customer bank** | Semua bank (137 bank transfer) | Hanya bank yang didukung gateway | Semua e-wallet/bank |
| **Skalabilitas** | Terbatas 999 kode per nominal dasar | Unlimited (nomor VA unik) | Unlimited |
| **Risiko** | Salah nominal = tidak match | Hampir tidak ada | Hampir tidak ada |
| **Cocok untuk** | UMKM mikro, low volume, butuh zero cost | UMKM kecil-menengah | Semua ukuran |

### Verdict

```
Volume rendah (<20 txn/hari) + zero budget → Kode Unik + Moota
Volume menengah (20-100 txn/hari) → Virtual Account (TriPay/Duitku)
Volume tinggi (>100 txn/hari) → VA + QRIS combo via payment gateway
```

---

## 11. Aspek Hukum

### Penelitian Akademis

Paper: **"Ketidakpastian Hukum Penggunaan Kode Unik Dalam Sistem Pembayaran E-Commerce"**
- Jurnal Penelitian Hukum DE JURE, Vol. 19 No. 4, Desember 2019, hal 503-516
- [ResearchGate](https://www.researchgate.net/publication/338192939)

**Temuan utama:**
1. Ada **ketidakpastian hukum** karena kode unik muncul SETELAH perjanjian jual-beli dibuat (bukan bagian dari harga yang disepakati)
2. Tidak semua e-commerce punya sistem e-money → kode unik yang ditransfer **tidak dikembalikan** → kerugian bagi pembeli
3. Tidak ada regulasi khusus yang mengatur mekanisme pengembalian dana kode unik
4. Secara hukum, kode unik menambah/mengurangi nominal yang seharusnya dibayar → berpotensi melanggar prinsip kepastian harga

### Implikasi Praktis

- Tokopedia: kode unik **TIDAK** dikembalikan (jadi revenue platform)
- OY! Indonesia: kode unik **DIKEMBALIKAN** ke saldo deposit user
- Tidak ada standar industri -- masing-masing platform beda kebijakan
- Untuk UMKM: sebaiknya kode unik diperlakukan sebagai **pengurang** (total - kode unik) daripada penambah, untuk menghindari kesan "membebankan biaya tambahan"

---

## 12. Implikasi untuk CatatOrder

### Konteks CatatOrder

Dari riset sebelumnya (`payment-issue/`):
- Flow dominan: Customer transfer via bank → screenshot WA → seller cek mutasi manual
- Pain utama: **Matching mutasi dengan ORDER** (gap terbesar)
- CatatOrder sudah punya data order (order_number, total, customer)
- Yang kurang: **koneksi ke data mutasi** untuk auto-match

### Apakah Kode Unik Cocok untuk CatatOrder?

**Pro:**
- Zero cost bagi seller (pakai rekening sendiri, tidak perlu payment gateway)
- Low barrier: tidak perlu registrasi badan usaha
- Familiar: banyak marketplace sudah pakai → customer mengerti
- Bisa implementasi tanpa integrasi bank API yang berat
- Cocok untuk segmen UMKM mikro yang jadi target CatatOrder

**Kontra:**
- Butuh mutation checker (Moota ~Rp 100K/bulan) -- tambahan cost bagi UMKM mikro
- Akurasi <100% -- customer bisa salah transfer
- Delay 3-15 menit -- bukan real-time
- Range collision di volume tinggi
- Credential iBanking harus dishare ke mutation checker

### Opsi Implementasi untuk CatatOrder

**Opsi A: Kode Unik + Moota (DIY Auto-Match)**
```
Cost: Rp 100K/bulan (Moota) -- ditanggung seller
Latency: 3-15 menit
Akurasi: ~95%
Setup: Seller input credential bank di Moota → CatatOrder setup webhook
```

**Opsi B: Virtual Account via TriPay (Managed)**
```
Cost: Rp 4.250/transaksi -- ditanggung seller atau customer
Latency: Real-time
Akurasi: ~100%
Setup: CatatOrder integrate TriPay API → generate VA per order
```

**Opsi C: Hybrid (Kode Unik sebagai fallback)**
```
Primary: QRIS / Virtual Account via payment gateway
Fallback: Kode unik + manual transfer untuk customer yang prefer rekening langsung
```

**Opsi D: Kode Unik Tanpa Mutation Checker (Minimal)**
```
Generate kode unik per order → tampilkan ke customer
Seller masih cek mutasi manual → tapi matching JAUH lebih mudah
  karena nominal unik = identifier yang jelas
Cost: Rp 0
Akurasi: Manual tapi faster (seller tinggal match angka, bukan screenshot)
```

### Rekomendasi

Untuk CatatOrder fase sekarang, **Opsi D** adalah starting point paling realistis:

1. Generate kode unik per order (3 digit, range 001-999)
2. Tampilkan ke customer: "Transfer Rp 150.037 ke BCA 1234567890"
3. Seller buka mutasi → cari Rp 150.037 → langsung tahu itu order mana
4. Klik "Confirm" di CatatOrder → done

Ini sudah **menyelesaikan masalah utama** (matching mutasi ke order) tanpa perlu integrasi mutation checker. Mutation checker (Moota) bisa ditambahkan nanti sebagai upgrade path.

---

## Sources

### Platform & Company Pages
- [Tokopedia Blog - Manfaat Kode Unik](https://www.tokopedia.com/blog/manfaat-kode-unik-untuk-keamanan-pembayaran/)
- [Bukalapak - Kode Unik](https://utekno.com/memahami-kode-unik-bukalapak-12527/)
- [OY! Indonesia - Kode Unik Transaksi](https://www.oyindonesia.com/en/blog/kode-unik-transaksi-di-oy)
- [Kitabisa - Apa itu Kode Unik](https://kitabisa.zendesk.com/hc/en-us/articles/360000367973-Apa-itu-kode-unik)
- [Jetorbit - Fungsi Kode Unik](https://www.jetorbit.com/panduan/mengenal-fungsi-kode-unik-pada-pembayaran/)
- [DomaiNesia - Kode Unik BCA](https://www.domainesia.com/panduan/pembayaran-kode-unik-bank-bca/)
- [Jakmall - Kode Unik dan Berita Transfer](https://help.jakmall.com/en/pembayaran/kode-unik-dan-berita-transfer)
- [Accurate Online - Kode Unik Pembayaran](https://account.co.id/fitur-kode-unik-pembayaran/)
- [Kasir Pintar - Salah Kode Unik](https://help.kasirpintar.co.id/knowledge-base/saya-salah-atau-lupa-memberi-kode-unik-saat-mengisi-deposit-coin-premium-ppob-kasir-pintar/)
- [Flip - Transfer Tanpa Kode Unik](https://help.flip.id/article/7303-bagaimana-jika-saya-transfer-tanpa-kode-unik-ke-rekening-flip)
- [Fazz - Salah Kode Unik](https://support-agen.fazz.com/hc/en-us/articles/7467724885657-Bagaimana-Jika-Saya-Salah-Memasukan-Kode-Unik-saat-Top-Up-Saldo)

### SaaS & Services
- [Moota.co](https://moota.co/)
- [Moota - Kode Unik Webhook](https://moota.co/kb/apa-itu-kode-unik/)
- [Moota - Webhook Docs](https://moota.gitbook.io/technical-docs/untitled)
- [Moota - API Reference](https://app.moota.co/developer/docs)
- [Mutasibank.co.id](https://mutasibank.co.id/)
- [MesinOtomatis.com](https://mesinotomatis.com/)
- [Mutasi.co.id](https://mutasi.co.id/harga/)
- [alMutasi.com](https://almutasi.com/)
- [TriPay](https://www.tripay.co.id/)
- [iPaymu](https://ipaymu.com/)
- [Halado - Payment Gateway](https://halado.id/payment-gateway/)
- [Billingotomatis WordPress Plugin](https://wordpress.org/plugins/billingotomatis-payment-gateway-indonesia/)

### GitHub / Open Source
- [snippet-kode-unik-woocommerce](https://github.com/selampemayat/snippet-kode-unik-woocommerce)
- [mootaco/moota-woocommerce](https://github.com/mootaco/moota-woocommerce)
- [otnansirk/laravel-moota](https://github.com/otnansirk/laravel-moota)
- [moota-co/moota-php-sdk](https://github.com/moota-co/moota-php-sdk)
- [yugo412/moota (unofficial)](https://github.com/yugo412/moota)
- [nekoding/tripay](https://github.com/nekoding/tripay)
- [imrenagi/go-payment](https://github.com/imrenagi/go-payment)

### Tutorials
- [Tutorial Pembayaran Otomatis Moota + CodeIgniter/Laravel](https://virtualkoding.blogspot.com/2020/09/tutorial-pembayaran-otomatis.html)
- [PHPMu - 3 Kode Unik Total Belanja](https://members.phpmu.com/forum/read/3-kode-unik-total-belanja-toko-online)
- [Billingotomatis WooCommerce Tutorial](https://www.domosquare.com/tutorial/billingotomatis/pembayaran-otomatis-bank-indonesia-di-woocommerce-dengan-billingotomatis.html)

### Academic / Legal
- [Ketidakpastian Hukum Kode Unik E-Commerce - ResearchGate](https://www.researchgate.net/publication/338192939)
- [Jurnal Penelitian Hukum DE JURE](https://ejournal.balitbangham.go.id/index.php/dejure/article/view/662)

### Payment Ecosystem
- [PayRequest - Automatic Payment Matching](https://payrequest.io/features/payment-matching)
- [Stripe - Automatic Reconciliation](https://docs.stripe.com/invoicing/automatic-reconciliation)
- [Xendit - Payment Methods Indonesia](https://www.xendit.co/en-id/blog/7-most-popular-payment-methods-in-indonesia/)
- [Duitku API Reference](https://docs.duitku.com/api/en/)

---

*Riset ini bagian dari CatatOrder payment issue exploration. Lihat juga: `payment-issue/README.md` untuk context lengkap.*
