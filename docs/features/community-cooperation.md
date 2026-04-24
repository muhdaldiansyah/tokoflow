# Community Cooperation — Dari Discovery ke Collective Action

> Community bukan fitur. Community bukan network effect. Community = **cooperation infrastructure** yang deliver 20-35% cost savings.

**Basis riset:**
- `value/catatorder/2026-03-25-scan.md` — cooperation = priority #2
- `value/catatorder/2026-03-25-diagnose.md` — connectivity (#3) + feedback loops (#6) + threshold (#9) = 3 absent conditions
- `research/reality/013-pricing-compass-behavioral/` — Abalobi model: collective action + pricing = $2M+ ke communities

---

## Kenapa Cooperation, Bukan (Hanya) Network Effect

| | Network Effect | Cooperation |
|---|---|---|
| Butuh berapa user? | Ratusan-ribuan | **10-20 per cluster** |
| Value per member | Marginal (sedikit lebih banyak traffic) | **20-35% cost savings** (SMERU) |
| Kapan deliver value? | Setelah scale | **Sekarang** |
| Defensibility | Tinggi (jika tercapai) | Medium |

Network effect = long game. Cooperation = immediate value. Build cooperation dulu → prove community value → members stay → THEN network effects emerge.

---

## 3 Model Cooperation

### 1. Group Purchasing — "Bareng Lebih Murah"

10 katering di komunitas yang sama → aggregate kebutuhan bahan baku → negosiasi dengan supplier.

```
Contoh:
- 10 katering masing-masing beli tepung 25kg/minggu
- Individual: Rp12.000/kg (harga eceran)
- Bersama (250kg): Rp9.500/kg (harga grosir)
- Saving: Rp2.500/kg × 25kg × 4 minggu = Rp250.000/bulan per member
```

**Data:** 15-25% raw material premium individual vs bulk (SMERU 2023).
**Syarat:** Minimum ~10 UMKM di kategori + lokasi yang sama. Trust mechanism (siapa yang collect uang? siapa yang pesan?).
**CatatOrder role:** Tahu apa yang di-order (dari data produk) → bisa aggregate kebutuhan → suggest group buy.

### 2. Shared Capacity — "Penuh? Lempar ke Teman"

Katering A capacity penuh → redirect overflow ke Katering B di komunitas yang sama.

```
Contoh:
- Katering A: capacity 50 porsi/hari, dapat order 65 porsi
- Auto-redirect 15 porsi ke Katering B (capacity tersedia)
- Katering A: tidak kehilangan pelanggan (tetap dapat trust)
- Katering B: dapat order tambahan tanpa marketing
```

**CatatOrder role:** Sudah punya daily capacity limits + auto-decline. Tinggal tambah: redirect ke member komunitas yang available (bukan cuma decline).
**Syarat:** 5+ UMKM per cluster. Standar kualitas yang disepakati.

### 3. Collective Intelligence — "Info Bareng"

Share informasi yang berguna antar member:

```
"Supplier X terlambat kirim 3x bulan ini" (warning)
"Harga telur di Pasar Y turun 10% minggu ini" (opportunity)
"Member baru: ada reseller minyak goreng Rp13.000/liter, siapa mau?" (deal)
```

**CatatOrder role:** Organizer bisa post announcement ke semua member. Bukan full chat — one-way atau moderated.
**Syarat:** 3+ UMKM per cluster. Organizer aktif.

---

## Abalobi Model — Gold Standard

Abalobi (South Africa) = contoh terbaik cooperation + pricing yang BEKERJA:

1. Fishers **record data**: apa ditangkap, kapan, di mana, harga jual
2. Data jadi **transparency tool**: semua fisher lihat harga pasar
3. Fisher **set minimum price bersama** sebelum jual
4. Marketplace **direct**: buyer beli langsung dari fisher, bukan middleman

**Impact:** $2M+ langsung ke fishing communities, 7% market value retained locally, 8,000+ fishers, 38 collectives.

**Applicable ke CatatOrder:**
- Step 1-2 sudah ada (UMKM record orders, data bisa di-aggregate)
- Step 3 = collective pricing (Fase 2, butuh community matang)
- Step 4 = community page sudah ada (marketplace embryo)

---

## Koneksi ke Diagnose: 3 Absent Conditions

| Absent Condition | Cooperation Feature yang Address |
|-----------------|--------------------------------|
| **#3 Connectivity** — users isolated | Group purchasing + shared capacity → users HARUS interact |
| **#6 Feedback loops** — zero user↔user | Collective intelligence → info flows between members |
| **#9 Threshold crossing** — community belum critical mass | Cooperation value (20-35% savings) = reason to stay → retention → growth → threshold |

---

## Status Implementasi

```
✅ Phase 1: Collective Intelligence
   - Pengumuman koordinator (4 tipe: Info, Supplier, Harga, Deal)
   - Feed chronological di halaman komunitas
   - Migration 071 + API + UI
   → Gate: organizer only bisa post, semua member bisa baca

✅ Phase 2: Group Purchasing Suggestions
   - Auto-detect kategori produk yang shared ≥3 member
   - "X dari Y member jual [kategori]. Beli bahan bareng bisa lebih murah."
   - API /api/communities/group-buy
   → Gate: ≥5 member per community

⬜ Phase 3: Shared Capacity (belum — butuh user riil)
   - Overflow redirect to available member
   - Quality standard agreement
   → Butuh: 5+ member, quality parity, consent mechanism

⬜ Phase 4: Collective Pricing (belum — butuh community matang + legal)
   - Community minimum price agreement
   - Voting/consensus mechanism
   → Butuh: community matang, high trust, legal review
```

---

## Next: Reality Capture RC-B

Klaim 20-35% savings dan model cooperation belum di-verify dengan reality data. Perlu reality capture:
- Siapa yang sudah coba cooperation model UMKM di Indonesia?
- Model mana yang berhasil/gagal?
- Minimum cluster size yang terbukti?
- Trust mechanism apa yang work?

Lihat `value/catatorder/next-research.md` — RC-B.

Lihat `value/catatorder/next-research.md` — RC-B.
