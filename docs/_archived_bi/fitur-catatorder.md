# Fitur CatatOrder

> Daftar lengkap semua fitur — dikelompokkan per kategori
>
> **Versi:** v4.7.0 (Nominal Unik + Pricing Compass Full + Community Intelligence + Kesehatan Bisnis)
> **Terakhir diperbarui:** 2026-03-27

---

## 1. Setup & Onboarding

| Fitur | Detail |
|-------|--------|
| **Zero-friction signup** | Daftar → langsung masuk dashboard. Tidak ada setup wizard yang dipaksa. Produk, profil, link toko bisa dilengkapi sambil jalan. |
| **Daftar via Google** | 1 tap, tidak perlu isi form. Nama bisnis + slug auto-generate dari nama Google. |
| **Daftar via email** | Email + password, verifikasi opsional. |
| **Celebration modal** | Setelah pesanan pertama: layar selamat + prompt nama bisnis (jika belum diisi) + CTA "Kirim ke WhatsApp". Slug otomatis update dari nama bisnis. |
| **Onboarding checklist** | 6 langkah di dashboard/settings: daftar, produk, profil, kota+kategori, pesanan pertama, kirim WA. Hilang saat semua selesai. |
| **Smart defaults** | 27 kategori bisnis. Default mode: pre-order. Booking sebagai toggle terpisah. |
| **Claim slug dari landing** | Ketik nama link toko di landing page → klaim setelah daftar. |
| **Contextual empty states** | Setiap halaman kosong menampilkan penjelasan + CTA ke aksi berikutnya. Form pesanan tanpa produk: "Ketik Item" + "Tempel Chat WA" inline. |
| **Immersive nav** | Semua 8 menu selalu terlihat. Yang belum "terbuka" ditampilkan dimmed dengan hint ("5 pesanan"). Tidak ada yang disembunyikan. |

---

## 2. Terima Pesanan

| Fitur | Detail |
|-------|--------|
| **Link Toko** | `catatorder.id/[slug]` — pelanggan pilih item dari katalog, isi nama + HP, kirim. Pesanan masuk otomatis. |
| **Tempel Chat WA** | Copy chat WhatsApp → tempel → AI parse jadi daftar item + qty + harga. |
| **Catat Pakai Suara** | Tekan mikrofon → bicara → AI ubah jadi pesanan. Web Speech API. |
| **Foto Screenshot** | Foto/screenshot chat → AI (Gemini Flash) baca dan extract item. |
| **Input Manual** | Tap produk dari katalog → atur qty → simpan. |
| **Offline Mode** | Internet putus → pesanan disimpan lokal (IndexedDB) → sync otomatis saat online. FIFO queue + idempotency key. |

---

## 3. Kelola Pesanan

| Fitur | Detail |
|-------|--------|
| **Status pesanan** | Baru → Diproses → Dikirim → Selesai (atau Dibatalkan). Swipe kanan untuk majukan. |
| **Swipe-to-action** | Geser kanan = majukan status. Geser kiri = kirim WA konfirmasi. |
| **Lacak pembayaran** | Belum Bayar / DP / Lunas. Input jumlah bayar. Auto-derive dari paid_amount vs total. |
| **Nominal unik** | Setiap pesanan otomatis +Rp 1-999 di nominal transfer (misal Rp 150.000 → Rp 150.037). 1 nominal = 1 pesanan — cocokkan mutasi bank instan. Tampil di halaman pesanan live + pesan WA. |
| **Cari nominal transfer** | Ketik nominal dari mutasi bank di pencarian pesanan → langsung ketemu pesanan yang cocok. |
| **"Sudah Bayar" claim** | Pelanggan klik tombol di halaman pesanan live → penjual dapat notifikasi + badge. |
| **Halaman pesanan live** | `/r/[id]` — pelanggan cek status, lihat nominal transfer (copy button), bayar QRIS, hubungi penjual via WA. |
| **Foto referensi** | Upload max 3 foto per pesanan (desain kue, referensi packaging). Supabase Storage. |
| **Lindungi kapasitas & istirahat** | Set maks pesanan per tanggal kirim. Penuh? Otomatis tertutup — sistem jaga kamu dari overwork. Server-side validation. |
| **Konfirmasi WA** | Kirim konfirmasi pesanan ke pelanggan via WhatsApp. 6 template pesan branded. |
| **Pengingat bayar** | Kirim reminder pembayaran via WA untuk pesanan belum lunas. |
| **Batch actions** | Pilih beberapa pesanan → tandai lunas sekaligus atau ubah status batch. |
| **Nomor pesanan** | CO-YYMMDD-XXXXXX. Sequential per user/tahun. Atomic via DB RPC. |

---

## 4. Pengaturan Pesanan

Default: **pre-order** untuk semua user. Tidak ada mode picker — satu mode untuk semua.

| Pengaturan | Detail |
|------------|--------|
| **Booking toggle** | Aktifkan jika butuh tanggal + jam (MUA, fotografer, event). Di Pengaturan. |
| **Kapasitas harian** | Maks pesanan per tanggal kirim. Otomatis tertutup di link toko saat penuh. Label: "Lindungi waktu istirahat". Di Pengaturan. |

Mode lama (dine-in, langganan) masih berfungsi di database untuk user yang sudah menggunakannya, tapi tidak lagi ditampilkan di UI setup.

---

## 5. Produk

| Fitur | Detail |
|-------|--------|
| **Katalog produk** | Nama, harga, kategori, satuan, deskripsi, foto. |
| **10 satuan** | porsi, box, pcs, loyang, kg, pack, botol, gelas, set, paket. |
| **16 kategori bisnis** | Katering, Bakery, Kue Custom, Warung, Snack Box, Minuman, Frozen Food, Konveksi, Percetakan, Kerajinan, Furniture, Fotografer, MUA, Wedding/EO, Grosir, Lainnya. |
| **Stok tracking** | null = unlimited. Angka = tracked. Auto-decrement saat pesanan. Auto-nonaktif saat habis. |
| **Min order qty** | Minimum pesanan per produk. Enforced di link toko. |
| **HPP / Food cost + Margin Riil** | Input biaya produksi → auto hitung food cost %, estimasi overhead (per tipe bisnis), dan **margin riil** (setelah semua biaya). Traffic light: 🟢 margin >15% sehat, 🟡 5-15% hati-hati, 🔴 <5% bahaya, ⚫ negatif = rugi. Overhead estimate bisa berbeda per usaha. |
| **Peer benchmark** | "Rata-rata harga [kategori] di [kota]: RpX." Bandingkan harga kamu vs usaha sejenis. Muncul otomatis jika ≥10 usaha di kategori+kota yang sama. Loss framing: "Harga kamu RpY di bawah rata-rata." |
| **Saran harga** | Saat buat produk baru dan benchmark tersedia: "Saran harga berdasarkan X usaha di kotamu: RpY — tap untuk pakai." Membantu user yang tidak tahu harus pasang harga berapa. |
| **Toggle aktif/nonaktif** | Produk nonaktif tersembunyi dari link toko. Pattern GoFood/GrabFood. |
| **Upload foto** | Foto produk tampil di katalog dan link toko. |

---

## 6. Pelanggan

| Fitur | Detail |
|-------|--------|
| **Auto-tersimpan** | Setiap pesanan otomatis simpan data pelanggan (nama, HP). Upsert: phone match → name match. |
| **Stats per pelanggan** | Total pesanan, total belanja, pesanan terakhir. Auto-sync via DB trigger. |
| **Riwayat pesanan** | Semua pesanan per pelanggan, grouped by tanggal. |
| **Catatan** | Notes field per pelanggan ("selalu minta extra sambal"). |
| **Pencarian** | 300ms debounce, cari nama/HP. |
| **NPWP pelanggan** | Untuk pembuatan faktur formal. |

---

## 7. Faktur & Piutang

| Fitur | Detail |
|-------|--------|
| **Faktur formal** | Nomor urut INV-YYYY-XXXX. NPWP penjual + pembeli. PPN 11% otomatis. Payment terms (NET7/14/30/COD/custom). |
| **PDF A4** | Download atau share. Format profesional via jsPDF. |
| **Piutang dashboard** | Total piutang, aging per pelanggan (0-7, 8-14, 15-30, >30 hari). |
| **Laporan PPN** | DPP, PPN Keluaran, Total Bruto per bulan. Status export. |
| **SPT PPN Summary** | Ringkasan terstruktur per bulan (Masa Pajak, DPP, PPN Keluaran, Total Bruto, collected, outstanding). "Salin untuk Coretax" — 1 klik copy data untuk paste ke Coretax DJP. Tier Bisnis. |
| **e-Faktur XML** | Export ke XML Coretax DJP (TaxInvoiceBulk v1.6). Single atau batch (max 500). **Unlimited untuk tier Bisnis** (gratis 50/bulan untuk tier lain). |
| **Faktur lifecycle** | Status tracking visual: Draf → Terkirim → Lunas. Badge "e-Faktur ter-export" dengan tanggal export. Progress bar di detail faktur. |
| **Buat dari pesanan** | 1 klik dari halaman pesanan → data pembeli + item terisi otomatis. Fitur ini TIDAK ADA di kompetitor. |
| **Kirim via WA** | Ringkasan faktur + reminder jatuh tempo. |
| **Overdue cron** | Auto-mark faktur jatuh tempo setiap hari (07:00 UTC). |

Faktur, PDF, WA, piutang = gratis untuk semua. Tier Bisnis: unlimited XML + SPT Summary + lifecycle tracking.

---

## 7b. Pajak PPh Final

| Fitur | Detail |
|-------|--------|
| **Omzet YTD** | Progress bar omzet kumulatif vs threshold Rp500jt. Status badge: "Bebas PPh" (hijau) atau "Kena pajak" (kuning). Breakdown per bulan. Gratis untuk semua. |
| **PPh Final 0,5%** | Kalkulator otomatis per bulan. Hanya omzet di atas Rp500jt yang dikenakan 0,5%. Pro-rate di bulan pertama melewati threshold. Tier Bisnis. |
| **Info Billing** | KAP 411128, KJS 420 (PPh Final UMKM). Tombol "Salin Info Billing" → clipboard. Link ke coretaxdjp.pajak.go.id. Tier Bisnis. |
| **Rekap siap-CoreTax** | Rekap omzet per bulan + PPh terutang + deadline setor (tgl 15) + deadline lapor (tgl 20). Format siap copy ke CoreTax. Tier Bisnis. |
| **Ringkasan Tahunan** | Total omzet, total PPh terutang, deadline SPT Tahunan (31 Maret). Tier Bisnis. |
| **Tax reminder push** | Setiap tanggal 10: "Setor PPh Final RpX sebelum tgl 15. KAP 411128, KJS 420." Atau "Omzet YTD RpX — masih bebas PPh." Tier Bisnis. |
| **Tipe WP** | OP (permanen PPh Final), PT Perorangan (permanen), CV/PT/Firma (tidak bisa pakai PPh Final mulai 2026). |

Dasar hukum: PP 55/2022 + revisi 2026. PTKP UMKM Rp500jt/tahun (hanya WP OP). Tarif 0,5% dari omzet bruto.

Omzet YTD gratis untuk semua (hook upgrade). PPh calculation + billing info + rekap = tier Bisnis.

---

## 8. Rekap & Laporan

| Fitur | Detail |
|-------|--------|
| **Rekap harian** | Pelanggan dilayani, hasil usaha, terkumpul, belum dibayar, AOV, tingkat penagihan %, sumber pesanan, pertumbuhan vs kemarin. |
| **Laporan bulanan** | Semua metrik harian + piutang aging, pelanggan teratas, produk terlaris, pelanggan baru vs kembali, rincian harian. |
| **Analisis AI** | Gemini Flash via OpenRouter. Harian: 5 poin. Bulanan: 4 bagian (ringkasan, pelanggan, produk, saran). Gratis tanpa batas. |
| **Decision rules** | Insight cards otomatis dengan **loss framing**: stok kritis, source concentration ("waktumu habis untuk admin, bukan produksi"), piutang ("semakin lama, semakin sulit ditagih"), revenue drop ("kamu kehilangan momentum"), collection rate tinggi. |
| **Community shared context** | "Hari ini di [komunitas]: X pesanan, Y member aktif, Z member penuh." Muncul otomatis jika kamu di komunitas ≥3 member. |
| **Social proof** | "X member di komunitasmu sudah naikkan harga minggu ini." Muncul jika ≥2 member naikkan harga dalam 7 hari. Behavioral nudge berbasis peer action. |
| **Kesehatan Bisnis** | Skor internal 0-100 berdasarkan 5 metrik: lama aktif, konsistensi pesanan, tingkat penagihan, keragaman pelanggan, tren pertumbuhan. Muncul setelah ≥3 bulan aktif. Persiapan untuk akses modal di masa depan. |
| **Persiapan** | "Yang Harus Disiapkan" per tanggal kirim. Aggregate item + per-order detail + payment summary. WA + Excel export. |
| **Excel export** | Harian + bulanan. Termasuk piutang aging, customer stats, kolom pengiriman. |
| **WA Status sharing** | Tombol "Bagikan ke WA Status" — rekap harian branded untuk viral loop. |
| **Kunjungan toko** | Visitor analytics: daily/monthly views. |

---

## 9. Komunitas

| Fitur | Detail |
|-------|--------|
| **Buat komunitas** | Siapa saja bisa buat. Nama + deskripsi. Auto-generate slug + invite code (6-char). Max 3 per user. |
| **Halaman komunitas** | `/komunitas/[slug]` — public, SSR. Header dengan nama + member count + total pesanan. Grid toko member. CTA "Gabung Komunitas". |
| **Invite link** | `/join/[CODE]` — shortlink redirect. Share di WA group. 1 tap → register → auto-join. |
| **Auto-join** | Signup via invite link → otomatis jadi member + community_id di profil + organizer jadi referrer (commission). |
| **Koordinator dashboard** | My Communities page. List komunitas + member count + invite tools (salin link, kirim WA). |
| **Tipe komunitas** | Permanen (pasar, WA group) atau event (bazaar — tanggal mulai/akhir). |
| **Social proof** | Member count visible di halaman komunitas. Store page badge "Anggota Komunitas X". Insight card "X member naikkan harga minggu ini" (≥2 member). |
| **Shared context** | Insight card: "Hari ini di komunitasmu: X pesanan, Y member aktif." Muncul di rekap jika ≥3 member. |
| **Pengumuman** | Koordinator kirim pengumuman ke semua member. 4 tipe: Info, Supplier, Harga, Deal. Contoh: "Harga tepung naik 10% — pertimbangkan naikkan harga." Feed chronological di halaman komunitas. |
| **Peluang beli bareng** | Sistem deteksi otomatis: "X dari Y member jual produk [kategori]. Beli bahan bareng bisa lebih murah." Muncul jika ≥5 member dan ≥3 member di kategori sama. Potensi hemat 15-25%. |
| **Koordinator tracking** | Internal referral tracking via database. Tidak ditampilkan di UI. |
| **SEO** | JSON-LD Organization, OG metadata, sitemap inclusion (≥3 members). |

---

## 10. Notifikasi

| Fitur | Detail |
|-------|--------|
| **Push: pesanan baru** | Real-time saat pesanan masuk dari link toko. Nama + total. Via Expo Push API. |
| **Push: "Sudah Bayar"** | Saat pelanggan claim pembayaran. |
| **Push: morning brief** | Setiap 06:00 WIB. Ringkasan hari ini: berapa pesanan, top items, belum bayar. **+ Cost trend alert**: jika food cost naik ≥5pp dari bulan lalu, notif "margin tergerus". Loss framing. |
| **Push: death valley** | Hari 1, 3, 7, 14, 21, 30, 45, 66. Pesan berbeda untuk user aktif vs belum aktif. Reward "kembali setelah miss". |
| **Push: milestone** | Pesanan ke-10, 50, 100, 500, 1000. Perayaan pencapaian. |
| **Push: rekap bulanan** | Tanggal 1 setiap bulan. Rekap bulan lalu: pelanggan dilayani, hasil usaha, jumlah pelanggan. |
| **Push: tax reminder** | Tanggal 10 setiap bulan 09:00 WIB. Reminder setor PPh Final sebelum deadline tgl 15. Termasuk nominal + KAP/KJS. Tier Bisnis + NPWP wajib diisi. |
| **Push: alert stok** | Produk dengan stok ≤3. Perlu restok. |
| **Push: alert kapasitas** | Kapasitas besok ≥80%: "Tinggal X slot. Sisanya waktu istirahatmu." Penuh: "✅ Besok penuh — istirahat terjaga." |
| **Push: kuota hampir habis** | Saat 48/50 pesanan gratis terpakai. "Sisa 2 pesanan." |
| **Push: kuota habis** | Saat 50+ terpakai. "Pesanan dari link toko akan tertahan." |
| **Realtime: in-app** | Supabase subscription. Alert + getar saat pesanan baru (app terbuka). |
| **Sound** | Notification sound saat pesanan baru masuk. |
| **Mode istirahat (Quiet Hours)** | Set jam istirahat (default 21:00-05:00 WIB). Notifikasi dimatikan selama jam ini — pesanan tetap masuk, hanya tidak diganggu. Di Pengaturan. |

---

## 11. Pembayaran

| Fitur | Detail |
|-------|--------|
| **QRIS pelanggan** | Penjual upload QRIS statis. Tampil di halaman pesanan + success page. Pelanggan scan untuk bayar. |
| **Bukti pesanan** | Canvas-generated PNG: items + QRIS + receipt URL. Bisa download/share. |
| **SaaS billing** | Midtrans Snap QRIS. Isi Ulang Rp15K/50 atau Rp25K/100 + Unlimited Rp39K/bulan + Bisnis Rp99K/bulan. |
| **Menunggu status** | Over-quota orders dari link toko → status "menunggu". Aktif otomatis setelah upgrade. Pelanggan tidak tahu. |
| **3rd pack = unlimited** | Beli paket ke-3 dalam 1 bulan → otomatis unlimited sisa bulan. |

---

## 12. Distribusi & Viral Loop

| Fitur | Detail |
|-------|--------|
| **Link Toko sharing** | Salin link atau share via WA/IG/TikTok. |
| **WA branding** | 10/10 WA message paths berakhir dengan "_Dibuat dengan CatatOrder — catatorder.id_". Termasuk customer→seller messages dan receipt PNG. |
| **WA Status sharing** | Rekap harian bisa di-share ke WA Status. Pre-composed text branded. |
| **Champion kit** | "Ajak Teman UMKM" button di home screen (setelah 3+ pesanan). Pre-composed WA invite. |
| **Time-saved display** | "~X jam dihemat bulan ini dari Y pesanan via Link Toko". Visible di home screen. |
| **Trust signals** | Link toko menampilkan: "X pesanan selesai" + "Y% pelanggan repeat" (jika ≥30%, min 10 pesanan) + "Aktif sejak [bulan tahun]" (min 10 pesanan). Bukti, bukan janji. |
| **Komunitas invite** | Koordinator share invite link di WA group → halaman komunitas → register. |
| **Marketplace directory** | `/toko` — browse semua toko. Category chips filter (27 kategori). Product thumbnail per card. Quality gate (toko tanpa produk hidden). Completeness sort. Per-city pages. SEO. |
| **Referral tracking** | Auto-track via webhook. Internal only — tidak ditampilkan ke user. |

---

## 13. Immersive Navigation

Semua 8 menu **selalu terlihat** — tidak ada yang disembunyikan. Menu yang belum "terbuka" ditampilkan dengan opacity rendah + hint jumlah pesanan yang dibutuhkan.

| Kondisi | Tampilan |
|---------|----------|
| 0 pesanan | Pesanan, Produk, Pengaturan: **full**. Pelanggan, Komunitas, Persiapan, Rekap, Faktur, Pajak: **dimmed + hint** |
| 1+ pesanan | + Pelanggan: full |
| 3+ pesanan | + Komunitas: full |
| 5+ pesanan | + Persiapan, + Rekap: full |
| 10+ pesanan | + Faktur, + Pajak: full |

Menu dimmed tetap bisa diklik — contextual empty states di setiap halaman mengarahkan ke aksi berikutnya. User melihat full product dari hari pertama.

---

## 14. Aplikasi Mobile (v2.6.0)

Semua fitur web tersedia di aplikasi mobile — termasuk Pricing Compass, Community Intelligence, dan Kesehatan Bisnis.

| Fitur | Detail |
|-------|--------|
| **Zero-friction signup** | Daftar → langsung masuk dashboard. Sama seperti web — tanpa setup wizard yang dipaksa. |
| **Settings redesign** | Booking toggle. Link copy/preview. Onboarding checklist. Quota nudge banners. Profil toko inline. Mode istirahat (quiet hours 21:00-05:00). Label kapasitas: "Lindungi waktu istirahat". |
| **Home screen cards** | Time-saved display. Champion kit. Decision rule insight cards dengan **loss framing** ("semakin lama, semakin sulit ditagih"; "waktumu habis untuk admin"). **Community shared context** ("Hari ini di komunitasmu: X pesanan, Y member aktif"). **Social proof** ("X member naikkan harga minggu ini"). |
| **Peer benchmark** | Di product form: "Rata-rata RpX dari Y usaha di kotamu." Loss framing jika di bawah rata-rata. Tombol "Pakai RpX" untuk produk baru. Muncul jika ≥10 usaha di kategori+kota. |
| **Kesehatan Bisnis** | Di rekap bulanan: skor 0-100 + emoji + level + breakdown 5 metrik (lama aktif, konsistensi, penagihan, pelanggan, pertumbuhan). Muncul setelah ≥3 bulan aktif. |
| **Celebration modal** | Pesanan pertama: green check + haptic + "Pesanan pertama tercatat!" + input nama bisnis + CTA "Kirim ke WhatsApp". Match web. |
| **Contextual empty states** | Setiap halaman kosong menampilkan penjelasan + CTA. Produk: "Tambah produk supaya muncul di link toko dan pelanggan bisa pesan sendiri." Search bar hidden saat 0 orders — empty state langsung terlihat. |
| **Komunitas** | Buat, kelola, share invite via WA — langsung dari app. CTA di empty state. |
| **Push notification** | Pesanan baru, morning brief 06:00 (+ cost trend alert), death valley day 1-66, milestone, rekap bulanan, alert stok, alert kapasitas ("istirahat terjaga"), kuota hampir habis/habis. Mode istirahat mematikan notif di jam tertentu. |
| **Quick actions** | Foto, Tempel WA, Link, Faktur, Persiapan, Pengingat. |
| **Swipe gestures** | Geser kanan = majukan status. Geser kiri = kirim WA. |
| **Offline mode** | Catat pesanan tanpa internet. Sync otomatis saat online. FIFO + idempotency. |
| **Deep links** | Tap notifikasi → langsung ke detail pesanan. /join/[code] → register + join komunitas. |
| **Buat faktur dari pesanan** | 1 tap dari overflow menu di detail pesanan → form faktur terisi otomatis. |

---

## 15. Platform & Teknis

| Fitur | Detail |
|-------|--------|
| **Web** | Next.js 16 + React 19. Responsive. PWA-ready. |
| **Mobile** | Expo SDK 52 (React Native). iOS + Android. NativeWind. |
| **Database** | Supabase (Mumbai). RLS pada semua tabel. |
| **Auth** | Supabase Auth. Google OAuth + email/password. Dual auth (Bearer + cookies). |
| **AI** | Gemini Flash 3.1 Lite via OpenRouter. Order parsing + insights. |
| **CDN** | Vercel. 15 static pages. AVIF/WebP auto. 1yr immutable assets. |
| **SEO** | JSON-LD (SoftwareApplication, LocalBusiness, Organization). OG 1200x630. Dynamic sitemap. |
| **Cron jobs** | 6 scheduled: invoice-overdue, morning-brief, engagement, alerts, tax-reminder. |
| **Deep links** | iOS Universal Links + Android App Links. Notification tap → order detail. |

---

## 16. Harga

| Paket | Harga | Detail |
|-------|-------|--------|
| **Gratis** | Rp0 | 50 pesanan/bulan. Semua fitur termasuk. |
| **Isi Ulang Kecil** | Rp15.000 | +50 pesanan (Rp300/pesanan). Tidak kadaluarsa. |
| **Isi Ulang Besar** | Rp25.000 | +100 pesanan (Rp250/pesanan). Tidak kadaluarsa. |
| **Unlimited** | Rp39.000/bulan | Pesanan tak terbatas. Paling hemat. |
| **Bisnis (PKP)** | Rp99.000/bulan | Unlimited pesanan + unlimited e-Faktur XML + SPT PPN Summary + faktur lifecycle tracking + **PPh Final calculator + info billing + rekap pajak + tax reminder push**. Termurah di pasar (Kledo Rp159K, Accurate Rp333K, Jurnal Rp499K). |

Tanpa fitur yang dikunci. Tanpa kontrak. Tanpa komisi per pesanan.

---

*CatatOrder v4.6.0 — Pricing Compass Full + Community Cooperation. Traffic light margin riil, peer benchmark, saran harga, loss framing, social proof, community shared context, pengumuman koordinator, peluang beli bareng, trust signals, cost trend alert, mode istirahat, kesehatan bisnis.*
