# Deep Dive Analysis: Halaman 4 — Pendekatan (CatatOrder)

> Tujuan: Dokumentasi workflow exact dari live app catatorder.id untuk menulis halaman Pendekatan di profil.
>
> Date: 2026-03-08
> Method: Playwright MCP browsing live production app (demo@catatorder.id)

---

## 1. Dua Jalur Terima Pesanan

CatatOrder punya **dua jalur utama** untuk menerima pesanan:

### Jalur A — Link Toko (Pelanggan Pesan Sendiri)

Pemilik usaha mendapat link: **catatorder.id/[nama-bisnis]** (contoh: catatorder.id/katering-barokah)

**Flow pelanggan:**
1. Buka link toko → lihat nama bisnis + katalog produk dengan harga
2. Isi nama + nomor WhatsApp
3. Pilih item dari katalog (tap untuk pilih, +/- untuk jumlah)
4. Tambah catatan opsional (misal: "tidak pedas, antar jam 12")
5. Tap "Kirim Pesanan"
6. **Halaman sukses** muncul:
   - "Pesanan masuk!" + nomor pesanan (WO-YYYYMMDD-XXXX)
   - Jika pemilik sudah upload QRIS: tampil QRIS + total + instruksi bayar + "Konfirmasi Pembayaran via WA"
   - Jika belum ada QRIS: otomatis buka WhatsApp ke pemilik setelah 2 detik
   - Tombol "Hubungi via WhatsApp" (kirim detail pesanan)
   - Tombol "Pesan Lagi"

**Flow pemilik:**
- Pesanan langsung masuk ke dashboard (source: "order_link")
- Muncul di daftar pesanan dengan status "Baru"
- Notifikasi realtime (toast + sound)
- Bisa langsung kelola tanpa input ulang

### Jalur B — Input Manual (Pesanan Baru)

Dari dashboard → tap tombol (+) → halaman /pesanan/baru

**Toolbar actions:** Pelanggan, Tanggal, Catatan, Diskon
**Quick-pick chips:** Produk dari daftar produk (by sort_order), lalu "Item lain"
**AI input (3 mode):**
- **Tempel Chat** — tempel teks chat WA, AI extract jadi item pesanan
- **Foto Pesanan** — foto/upload screenshot chat, AI baca jadi item
- **Dikte Suara** — bicara, AI convert jadi daftar item

**Payment status:** Lunas / DP / Belum Bayar
**Submit:** "Buat Pesanan" atau "Simpan & Buat Lagi" (batch entry)

---

## 2. Kelola Pesanan

### Daftar Pesanan (/pesanan)
- **Tab:** Hari Ini / Semua
- **Summary card:** jumlah pesanan hari ini + total omzet hari ini + jumlah belum bayar
- **Order cards:** nama pelanggan, waktu, item summary, total, status badge, payment badge
- **Swipe gestures:** geser kanan = advance status, geser kiri = buka WA
- **Source badge:** "WA" untuk pesanan dari link toko/WA bot

### Detail Pesanan (/pesanan/[id]/edit)
- **Info:** nama pelanggan, no HP, nomor pesanan, tanggal
- **Toolbar:** Pelanggan, Tanggal, Catatan, Diskon, WA, Struk
- **Item list:** dengan quick-pick chips untuk tambah item
- **Status pembayaran:** Lunas / DP / Belum Bayar (toggle)
- **Status pesanan:** Baru → Diproses → Dikirim → Selesai (toggle)
- **Actions:** Simpan Perubahan, Batalkan Pesanan, Hapus Pesanan

---

## 3. Struk Digital

Dari detail pesanan → tap "Struk" di toolbar → halaman struk

**Isi struk:**
- Nama bisnis
- Nomor pesanan + tanggal
- Nama pelanggan
- Daftar item (nama × qty = subtotal)
- TOTAL
- Status pembayaran
- "Terima kasih!" + branding catatorder.id

**3 cara kirim:**
- **Kirim WA** — kirim struk sebagai pesan WhatsApp
- **Gambar** — download sebagai gambar (PNG)
- **PDF** — download sebagai file PDF

---

## 4. Pembayaran QRIS

### Customer → Owner (Static QRIS)
- Owner upload gambar QRIS di /profil/edit
- QRIS muncul di halaman sukses setelah pelanggan pesan via link toko
- Tampil: gambar QRIS + total harga + instruksi 4 langkah + tombol konfirmasi WA
- Manual verification — owner cek sendiri di rekening

### Owner → CatatOrder (SaaS Quota)
- Tampil di /pengaturan > Kuota Pesanan
- **Gratis:** 50 pesanan/bulan
- **Isi Ulang:** Rp15.000 per 50 pesanan (tidak kadaluarsa) via QRIS Midtrans
- **Unlimited:** Rp35.000/bulan (pesanan tak terbatas) via QRIS Midtrans
- "Semua fitur gratis tanpa batas: link toko, struk, AI, rekap."

---

## 5. Data & Rekap

### Daftar Pelanggan (/pelanggan)
- Auto-tersimpan dari setiap pesanan
- Search by nama/HP
- "Total Belum Lunas" banner (jumlah + jumlah pelanggan)
- Filter: Semua / Belum Lunas
- Per pelanggan: nama, HP, jumlah pesanan, total belanja

### Rekap Harian (/rekap — tab Harian)
- Navigasi per hari
- **Pendapatan:** Total Pesanan + Terkumpul
- **Pembayaran:** Lunas / DP / Belum Bayar
- **Penggunaan Bulan Ini:** kuota pesanan
- **Kirim Rekap ke WhatsApp:** input nomor + kirim
- **Download** button

### Rekap Bulanan (/rekap — tab Bulanan)
- Navigasi per bulan
- **Pendapatan:** Total Pesanan + Terkumpul + Total Penjualan
- **Pembayaran:** breakdown Lunas/DP/Belum Bayar dengan jumlah
- **Status Pesanan:** Baru/Diproses/Dikirim/Selesai counts
- **Produk Terlaris:** ranked list (nama, qty terjual, revenue)
- **Pelanggan Teratas:** ranked list (nama, HP, spending, jumlah pesanan)
- **Rincian Harian:** tabel (tanggal, pesanan, pendapatan, terkumpul)
- **Analisis Bisnis AI:** tombol "Minta Analisis"
- **Download** (Excel)

### Daftar Produk (/produk)
- Isi nama + harga
- Drag to reorder (sort_order)
- Edit / hapus per item
- Muncul otomatis di: link toko (katalog pelanggan) + form pesanan baru (quick-pick chips)

---

## 6. Pengaturan (/pengaturan)

- **Profil bisnis:** nama, email, edit profil
- **Link Pesanan:** slug editor + toggle on/off + Salin / Bagikan via WA / Preview
- **Lengkapi toko checklist:** foto profil, alamat, no WA, QRIS, foto produk
- **Kuota Pesanan:** sisa kuota + usage bar + tombol Isi Ulang / Unlimited
- **Ganti Password / Keluar**

---

## 7. Marketing Pages (Public)

### Landing Page (catatorder.id)
- Redirects ke /pesanan jika sudah login
- Hero: CatatOrder — Link Toko & Kelola Pesanan

### Features Page (/features)
- **Terima Pesanan (4):** Link Toko, Tempel Chat WA, Suara, Foto Screenshot
- **Kelola & Kirim (8):** Daftar Produk, Status Pesanan, Lacak Pembayaran, Jadwal Pengiriman, QRIS Pembayaran, Kirim ke WhatsApp, Struk Digital, Pengingat Bayar
- **Data & Rekap (4):** Daftar Pelanggan, Rekap Harian, Laporan Bulanan, Analisis AI
- CTA: "Semua Gratis. Langsung Pakai. Bayar hanya kalau pesanan lebih dari 50/bulan."

---

## 8. Ringkasan untuk Halaman 4 Pendekatan

### Inti Pendekatan
CatatOrder memberikan setiap UMKM sebuah **link toko** — pelanggan buka link, pilih item, isi nama dan nomor HP — pesanan langsung masuk ke dashboard pemilik usaha. Tercatat rapi, tanpa salin-tempel dari chat.

### 4 Prinsip
1. **Gratis** — 50 pesanan/bulan gratis selamanya, semua fitur termasuk AI
2. **Sederhana** — 3 langkah: buat toko, bagikan link, kelola pesanan
3. **Berbasis WhatsApp** — melengkapi WA, bukan menggantikan. Konfirmasi dan struk dikirim lewat WA
4. **Fokus pesanan** — bukan POS, bukan pembukuan. Satu masalah: pesanan yang tercecer di chat

### Dua Jalur (Key Insight)
- **Link Toko:** pelanggan pesan sendiri → data langsung masuk → owner tinggal kelola
- **Manual + AI:** owner input dari chat WA (tempel/foto/suara) → AI extract → jadi pesanan

### After Order (Key Differentiator)
- Pesanan tercatat otomatis → status bisa diubah → pembayaran terlacak
- Struk digital: kirim WA / download gambar / download PDF
- QRIS: pelanggan bayar langsung setelah pesan, owner tinggal cek
- Rekap otomatis: harian + bulanan + AI insights + download Excel
- Pelanggan tersimpan otomatis dengan riwayat

---

*Dianalisis: 2026-03-08 via Playwright MCP on catatorder.id (production)*
