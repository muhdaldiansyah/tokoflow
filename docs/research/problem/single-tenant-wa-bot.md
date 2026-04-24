# P10: WA Bot Single-Tenant — User Baru Tidak Punya Bot

> CatatOrder WA Bot hanya bisa dipakai 1 user (owner). User baru yang daftar tidak bisa connect nomor WA bisnis mereka sendiri — value proposition CatatOrder langsung jatuh.

**Severity:** CRITICAL
**Affected:** Semua user CatatOrder selain owner
**Status:** Research complete, solution identified (Meta Embedded Signup)
**Research:** `research/wa-embedded-signup.md`

---

## Kondisi Saat Ini

CatatOrder WA Bot **single-tenant** — hanya 1 nomor, 1 user:

```
Semua customer --> pesan ke +6285776158689 (nomor owner)
                           |
                  Meta Cloud API Webhook
                           |
      Lookup wa_connections by phone_number_id
                           |
          Dapat user_id --> pesanan masuk ke akun owner
```

- Nomor `+6285776158689` terdaftar di Meta Cloud API milik owner
- Di tabel `wa_connections`, nomor itu di-link ke `user_id` owner
- **User baru yang daftar CatatOrder TIDAK punya WA Bot**
- Mereka hanya bisa pakai fitur manual (catat pesanan via web, share via `wa.me/` deep link)

### Flow User Baru (Tanpa Bot)

```
1. User daftar di catatorder.id (Google OAuth)
2. Isi profil + nama bisnis + nomor HP bisnis
3. Catat pesanan MANUAL (ketik / paste chat WA ke form)
4. Share ke customer via wa.me/ deep link (buka WA app)
   --> Pesan include branding "Dibuat dengan CatatOrder"
5. TIDAK bisa terima pesanan otomatis via WA Bot
```

---

## Mengapa Ini Problem

### 1. Value Proposition Jatuh

WA Bot adalah fitur pembeda CatatOrder — customer chat, pesanan otomatis tercatat. Tanpa bot, CatatOrder "cuma" form catat pesanan manual. Tidak ada alasan kuat user bayar Rp49-99K/bulan untuk form.

### 2. Brand Identity Hilang

Jika pakai shared number (nomor Strive), customer pesan ke nomor asing — bukan nomor toko mereka. UMKM Indonesia sangat peduli brand identity di WA karena WA = etalase utama mereka.

### 3. Tidak Scalable

1 nomor = 1 user. Model bisnis SaaS butuh multi-tenant. Sekarang CatatOrder secara teknis hanya tool pribadi owner, bukan produk yang bisa dijual.

### 4. Competitive Disadvantage

Platform lain (WATI, Gallabox, Respond.io, Qontak) sudah menawarkan per-user WA bot. Meskipun mereka jauh lebih mahal ($49+/bulan), fitur "connect nomor sendiri" adalah ekspektasi dasar untuk WA SaaS.

---

## Dampak Finansial

| Aspek | Tanpa Multi-Tenant Bot | Dengan Multi-Tenant Bot |
|-------|----------------------|------------------------|
| User yang bisa pakai bot | 1 (owner) | Unlimited |
| Revenue dari bot | Rp0 (hanya owner) | Rp49-99K/user/bulan |
| Conversion free --> paid | Rendah (value lemah) | Tinggi (bot = killer feature) |
| Marginal cost per user | N/A | ~Rp0 (Meta host gratis, service messages gratis) |
| Churn risk | Tinggi (cuma form manual) | Rendah (bot = sticky) |

### Unit Economics Jika Multi-Tenant

Untuk 100 user Plus (Rp49K):
- Revenue: Rp4.9M/bulan
- Meta messaging cost: ~Rp33-51K/user (mayoritas gratis karena customer-initiated)
- Infra cost: Rp0 (Meta host webhook, Supabase free tier)
- **Margin: ~Rp0-16K/user = break even atau untung tipis**

Untuk 100 user Pro (Rp99K):
- Revenue: Rp9.9M/bulan
- Meta messaging cost: ~Rp33-133K/user
- **Margin: ~Rp0-66K/user = profitable**

---

## Root Cause

Bukan technical limitation — **~80% backend sudah multi-tenant ready:**

| Komponen | Status |
|----------|--------|
| `wa_connections` table (multi-tenant) | Sudah ada |
| Webhook routing by `phone_number_id` | Sudah ada |
| Session management per connection | Sudah ada |
| Order creation linked to `connection.user_id` | Sudah ada |
| Bot messages per tenant | Sudah ada |

Yang belum ada: **cara user connect nomor WA mereka sendiri dari dalam CatatOrder.** Ini butuh Meta Embedded Signup — flow resmi Meta untuk SaaS platform onboard user WA Business.

---

## Solusi yang Diidentifikasi

**Meta Embedded Signup** — solusi resmi, zero ban risk, gratis infra.

User klik "Hubungkan WhatsApp" di Settings --> popup Meta login --> pilih/buat WABA --> input nomor --> verifikasi OTP --> bot aktif di nomor user. Proses 5-10 menit, tidak perlu technical knowledge.

### Alternatif yang Ditolak

| Opsi | Alasan Ditolak |
|------|---------------|
| Shared single number | Brand identity hilang (fatal untuk UMKM) |
| Fonnte/Wablas (unofficial API) | Ban risk tinggi, Meta makin agresif enforcement |
| Virtual numbers per tenant | Terlalu mahal (Rp30-80K/tenant/bulan), margin habis |
| QR code scanning (Baileys) | Unofficial, ban risk, session instability |
| Status quo (tanpa bot untuk user baru) | Value proposition terlalu lemah, tidak scalable |

### Effort Estimate

- Coding: ~3-4 hari
- Elapsed time: ~1-2 minggu (termasuk menunggu Meta approval)
- Detail implementasi: `research/wa-embedded-signup.md`

---

## Hubungan dengan Problem Lain

| Problem | Hubungan |
|---------|----------|
| P1 (Orders scattered di WA) | Bot menyelesaikan P1 secara otomatis — tapi hanya untuk 1 user sekarang |
| P2 (Manual recording) | Bot = zero manual input. Tanpa multi-tenant, user baru tetap manual |
| P8 (Tools terlalu mahal) | CatatOrder bisa jadi WA bot termurah (Rp49K vs $49+) — tapi hanya jika multi-tenant |
| P9 (No tool after WA orders) | Bot + multi-tenant = solusi P9 yang scalable |

---

## Next Step

Implementasi Meta Embedded Signup sesuai plan di `research/wa-embedded-signup.md` Section 15.

*Last updated: 2026-02-15*
