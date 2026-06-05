# Sleep Protection — Fitur Kesehatan yang Sudah 80% Ada

> CatatOrder sudah punya 4 dari 5 mekanisme untuk protect tidur UMKM. Yang kurang: 1 fitur baru + reframing.

**Basis riset:**
- `value/catatorder/2026-03-25-scan.md` — sleep = priority #3, effort LOW, impact medium-high

---

## Problem

- 72% food UMKM tidur <6 jam saat peak season (Unair 2022)
- Katering/bakery owner bangun 2-3 pagi
- Home-based = zero boundary antara kerja dan istirahat
- Tidak ada UMKM tool yang frame dirinya sebagai health intervention

## Yang Sudah Ada

| Fitur | Fungsi Bisnis | Fungsi Kesehatan (hidden) |
|-------|-------------|--------------------------|
| Daily capacity limits | Batasi pesanan per hari | **Cegah overwork** — tidak bisa terima lebih dari X porsi |
| Auto-decline saat penuh | Tolak pesanan otomatis | **Jaga batas** — sistem yang bilang "stop" saat kamu tidak bisa |
| Persiapan (production list) | Daftar yang harus dimasak | **Kurangi rumination** — Zeigarnik effect: task yang belum selesai ganggu tidur. List = closure |
| AI order parsing | Otomasi input pesanan | **Hemat 30-60 menit/hari** admin → bisa jadi waktu tidur |

## Yang Perlu Ditambah

### Rest Mode (Quiet Hours)

```
⏰ Mode Istirahat: 21:00 - 05:00
   ✅ Pesanan tetap masuk
   ❌ Notifikasi dimatikan
   📋 Semua pesanan baru muncul di morning brief
   👤 Pelanggan lihat: "Pesanan diterima! Akan diproses pagi."
```

**Effort:** 1 setting (jam mulai + jam selesai) + suppress notifications dalam range + customer-facing message.

## Reframing

Ubah copy di beberapa tempat:

| Sekarang | Reframe |
|----------|---------|
| "Batas pesanan harian: 50" | "Lindungi waktu istirahatmu: maks 50 pesanan/hari" |
| "Pesanan ditolak otomatis" | "Sistem menjaga kamu dari overwork" |
| "Daftar persiapan" | "Siapkan besok sekarang, tidur tenang malam ini" |

**Effort:** Copy change saja. Zero development.

## Kenapa Ini Diferensiasi

Tidak ada competitor yang frame produk sebagai health protection. Ini:
- Tidak bisa ditiru dengan fitur (bukan fitur — framing)
- Resonates dengan katering owner yang TAHU mereka kurang tidur
- Creates emotional bond, bukan transactional relationship

## Status: ✅ DONE

- Rest mode (quiet hours 21:00-05:00): migration 070 + settings UI + push suppression
- Copy reframing: capacity label, alert text, marketing page — semua sudah diubah
- Web + mobile synced
