# Pricing Compass — Fitur Utama Berikutnya

> Dari mirror ("berapa pesanan hari ini") ke compass ("harga kamu terlalu murah").

**Basis riset:**
- `value/catatorder/2026-03-25-scan.md` — pricing intelligence = priority #1
- `research/reality/012-umkm-pricing-margin/` — >70% UMKM tanpa akuntansi, net margin 0-15%
- `research/reality/013-pricing-compass-behavioral/` — formula + behavioral design + delivery mechanism

---

## Kenapa Ini Penting

- **>70% UMKM** tidak punya sistem akuntansi. Mereka tidak tahu margin riil mereka.
- **Gross margin tampak 50-70%** (harga jual minus bahan baku). Net margin RIIL: **0-15%**. Gap 40-55% = overhead invisible (gas, listrik, kemasan, waktu, waste).
- **Tidak ada pricing tool untuk micro-enterprise di seluruh dunia.** Bukan cuma Indonesia — ini gap global.
- GoFood ambil **22.2% efektif** per transaksi. Kalau margin UMKM cuma 5-10%, platform fee bisa **menghapus seluruh profit**.

## Formula yang Terbukti

```
Info harga SAJA → GAGAL
  (RML India: RCT, zero impact. World Bank pulled back.)

Info harga + collective action → BERHASIL
  (Esoko Ghana: +9-15% income. Abalobi South Africa: $2M+ ke communities.)
```

CatatOrder punya KEDUA: data pricing (dari orders) + community (dari fitur komunitas).

---

## 2 Fase: Sekarang + Nanti

### Fase 1 — Tanpa Tunggu Community Scale

4 fitur yang bisa dibangun dari data yang SUDAH ADA:

#### 1. HPP Visibility — Margin Riil per Produk

Saat ini CatatOrder hanya tunjukkan food cost (jika diisi). Yang dibutuhkan: margin RIIL setelah overhead.

```
Sekarang:
  Nasi box Rp20.000 | Food cost Rp7.000 (35%)
  → User pikir margin 65%

Seharusnya:
  Nasi box Rp20.000 | Food cost Rp7.000 (35%)
  + Overhead estimate Rp8.000 (40%)  ← dari config per business type
  = Margin riil: Rp5.000 (25%)
  💡 Jika kamu masak 4 jam: Rp1.250/jam (UMR kotamu: Rp12.000/jam)
```

**Implementasi:**
- Tambahkan overhead estimate per business type di `config/business-types.ts`
- Katering: overhead 40-50% (gas, listrik, kemasan, waste)
- Bakery: overhead 35-45%
- Frozen food: overhead 30-40% (packaging lebih besar)
- Tampilkan di halaman produk + order detail
- User bisa adjust overhead estimate ke angka aktual mereka

#### 2. Traffic Light saat Input Harga

Saat user set/edit harga produk, tampilkan indikator:

```
🟢 Margin >15% — Sehat
🟡 Margin 5-15% — Hati-hati: naik bahan baku sedikit bisa bikin rugi
🔴 Margin <5% — Bahaya: kamu hampir tidak untung setelah semua biaya
⚫ Margin negatif — Kamu RUGI di setiap porsi yang terjual
```

**Implementasi:**
- Hitung margin: `(harga - food_cost - overhead_estimate) / harga`
- Tampilkan dot/badge di sebelah field harga saat edit produk
- Threshold bisa di-config per business type

#### 3. Cost Trend Alert di Morning Brief

Morning brief sudah ada (cron 06:00 WIB). Tambahkan insight biaya:

```
Selamat pagi! 🌅
📊 Kemarin: 12 pesanan, Rp2.4 juta
🔴 Food cost kamu naik 8% dari bulan lalu
   Margin tergerus: 12% → 7%
💡 Pertimbangkan naikkan harga Rp2.000 atau kurangi 1 item lauk
```

**Implementasi:**
- Compare average food cost % bulan ini vs bulan lalu (dari data order)
- Trigger alert jika delta >5%
- Include di morning brief push notification

#### 4. Loss Framing di Semua Insight

Ubah framing dari netral ke loss:

```
Sekarang (netral):
  "Margin kamu 5%"

Seharusnya (loss frame):
  "Kamu kehilangan Rp1.2 juta/bulan karena harga di bawah biaya sebenarnya"

Sekarang (netral):
  "Food cost naik 8%"

Seharusnya (loss frame):
  "Kenaikan bahan baku menggerus Rp360.000 dari profit kamu bulan ini"
```

**Basis:** Loss aversion (Kahneman) — kerugian terasa 2x lebih berat dari keuntungan. "Kamu kehilangan X" → 2x lebih motivating dari "Kamu bisa dapat X."

**Implementasi:** Copy changes di AI recap, morning brief, dan insight cards. Bukan fitur baru — reframing fitur existing.

---

### Fase 2 — Butuh ~20 User per Cluster

3 fitur yang butuh aggregate data dari sesama user:

#### 5. Peer Benchmark

```
"Katering nasi box di Bandung (23 member CatatOrder):"
- Harga rata-rata: Rp25.000/porsi
- Range: Rp18.000 - Rp35.000
- Kamu: Rp20.000 (di bawah rata-rata)
- Median food cost: 32%
- Kamu: 38% ← lebih tinggi dari median
```

**Syarat:** Minimum ~20 UMKM di kategori + kota yang sama.
**Implementasi:** Aggregate query anonymized dari tabel products + orders, group by category + city.

#### 6. Social Proof Alert

```
"3 dari 5 katering di komunitasmu sudah naikkan harga minggu ini"
"Member dengan harga Rp25.000+ punya margin 3x lebih sehat dari yang di bawah Rp20.000"
```

**Basis:** Cialdini social proof — behavior berubah ketika tahu peers sudah melakukan. Peer harus relatable (sesama katering, sesama kota).
**Syarat:** Community feature aktif, member >10.

#### 7. Collective Pricing (Abalobi Model)

Community set minimum price bersama:
```
"Komunitas Katering Bandung Selatan sepakat:
 Minimum harga nasi box: Rp22.000
 Berlaku mulai: 1 April 2026
 15 dari 18 member setuju ✅"
```

**Basis:** Abalobi (South Africa) — fisher collective set minimum price → $2M+ langsung ke communities. Power dynamics bergeser dari buyer ke seller.
**Syarat:** Community matang, trust tinggi, organizer aktif.
**Risiko:** Bisa dianggap kartel/price fixing. Perlu legal review. Frame sebagai "harga minimum yang fair" bukan "harga yang dipaksakan."

---

## Behavioral Design Principles

### 5 Barrier Psikologis & Cara Bypass

| Barrier | Kenapa Terjadi | Bypass di CatatOrder |
|---------|---------------|---------------------|
| **Loss aversion** — takut hilang pelanggan | Kehilangan terasa 2x lebih berat dari keuntungan | Frame: "Kamu KEHILANGAN Rp1.5 juta/bulan" bukan "Kamu bisa DAPAT Rp1.5 juta" |
| **Fairness norms** — merasa naikkan harga = tamak | Internalized belief bahwa harga harus tetap | Frame: "Bahan naik 10%. Wajar harga naik 5%." Kasih REASON |
| **Anchoring** — terpaku harga lama | Harga pertama yang di-set = anchor | Reanchor ke peer benchmark: "Rata-rata Rp25.000. Kamu Rp20.000" |
| **Status quo bias** — lebih mudah tidak ngapa-ngapain | Default = tidak berubah | Default ke suggestion: saat input produk baru, suggest harga dari benchmark (bukan field kosong) |
| **Gender gap** — women underprice 28-43% | Self-perception + cultural conditioning | Data normalize: "Rata-rata di kategorimu Rp26.000/jam" — data menghilangkan doubt |

### Gender-Sensitive Design

64% UMKM milik perempuan. Research menunjukkan women entrepreneurs underprice 28-43% (FreshBooks, UK data). Bukan hanya tekanan eksternal — **internalized self-perception**.

Implikasi design:
- Jangan hanya bilang "naikkan harga" — bisa terasa confrontational
- **Gunakan data sebagai validator:** "Harga kamu wajar di Rp25.000 berdasarkan data 23 katering sejenis"
- **Normalize melalui peers:** "Member lain dengan pengalaman serupa charge Rp28.000"
- **Fokus pada keberlanjutan:** "Dengan harga ini, bisnis kamu bisa bertahan lebih lama"

---

## Delivery: 3 Layer

| Layer | Channel | Timing | Format | Priority |
|-------|---------|--------|--------|----------|
| **1. Contextual** | In-app, saat edit harga produk | Real-time | Traffic light + 1 kalimat | **Utama** — just-in-time, saat keputusan dibuat |
| **2. Morning brief** | Push notification | 05:00-06:00 WIB | Max 3 insight, personalized | **Kedua** — daily rhythm, sudah ada infra |
| **3. Voice note** | WhatsApp | Weekly | 30 detik, bahasa sederhana | **Experimental** — untuk segment low-literacy |

**Basis:**
- Layer 1: JITAI framework (Just-In-Time Adaptive Intervention) — nudge paling efektif saat decision point
- Layer 2: Push notification proven (CatatOrder sudah punya cron infra)
- Layer 3: Voice > SMS untuk low-literacy (Esoko 10+ tahun data)

---

## Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|---------|
| Overhead estimate salah → margin calculation misleading | Mulai dengan range (bukan angka pasti). Ajak user refine: "Berapa biaya gas + listrik per bulan?" Progressive accuracy |
| User lihat margin kecil → demotivasi, bukan motivasi | Frame positif: "Margin kamu bisa naik dari 5% ke 15% dengan satu perubahan harga" |
| Peer benchmark dari sample terlalu kecil | Jangan tampilkan benchmark jika <10 data points. Tampilkan: "Belum cukup data di kotamu" |
| Collective pricing dianggap kartel | Legal review dulu. Frame sebagai "rekomendasi," bukan "kewajiban." Opt-in per member |
| Nudge effect size kecil (~1.4pp real-world) | Expect small changes. Stack multiple nudges. Measure rigorously |

---

## Status Implementasi

```
✅ Sprint 1: Loss framing (copy changes)
✅ Sprint 2: Traffic light 🟢🟡🔴⚫ saat edit harga + overhead estimate
✅ Sprint 3: HPP visibility + config overhead per business type
✅ Sprint 4: Cost trend alert di morning brief
✅ Sprint 5: Peer benchmark (gated ≥10 users/cluster) — API + UI web + mobile
✅ Sprint 6: Social proof alert (gated ≥2 members)
✅ Sprint 7: Kesehatan Bisnis / credit readiness (gated ≥3 bulan)
✅ Sprint 8: Saran harga saat buat produk baru (dari benchmark)
```

Semua termasuk web + mobile.

---

**Catatan:** Tidak ada RCT yang pernah menguji pricing nudge untuk small business owners. CatatOrder akan jadi yang pertama. Measure: apakah user yang lihat traffic light BENAR-BENAR naikkan harga? Berapa selisih margin sebelum/sesudah? Data ini = valuable research contribution.
