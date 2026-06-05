# Trust Signals — Bukti, Bukan Janji

> Ubah order data yang sudah ada menjadi trust evidence yang visible ke pelanggan, bank, dan sesama UMKM.

**Basis riset:**
- `value/catatorder/2026-03-25-scan.md` — trust = priority #4, effort LOW
- `value/catatorder/2026-03-25-analyze.md` — trust infrastructure = triple deficit (bank 55-60% rejection, platform 73% unfair, customer 52% trust)

---

## Problem

UMKM punya ZERO mekanisme untuk BUKTIKAN trustworthiness:
- Bank minta jaminan tanah, bukan track record
- Pelanggan trust brand, bukan UMKM (52% vs 78%)
- Platform trust one-directional (UMKM harus trust platform, bukan sebaliknya)

## 3 Arah Trust Signal

### 1. Customer-Facing (di Shop Page)

Data sudah ada, belum ditampilkan:

```
🏪 Katering Ibu Sari
⭐ 247 pesanan selesai
📦 98% tepat waktu
🔄 72% pelanggan repeat
📅 Aktif sejak Januari 2026
```

**Implementasi:** Query dari tabel orders (completed count, on-time rate) + customers (repeat rate). Tampilkan di public shop page (`/[slug]`).
**Effort:** Low — data sudah ada, perlu 1 komponen UI.

### 2. Bank-Facing (untuk Financial Inclusion Pathway)

Order data → creditworthiness evidence:
- Revenue consistency (monthly, apakah stabil atau volatile)
- Payment collection rate (berapa % yang bayar tepat waktu)
- Growth trajectory (naik, stabil, turun)
- Customer diversity (tergantung 1 pelanggan atau banyak)

**Status:** Belum perlu dibangun sekarang. Ini untuk financial inclusion pathway (priority #5). Tapi mulai TRACK "credit readiness score" internal:

```
Credit Readiness:
- Bulan aktif: 6 ✅
- Order consistency: 85% ✅ (tidak ada bulan kosong)
- Payment collection: 92% ✅
- Customer diversity: 15 pelanggan unik ✅
- Score: READY untuk pilot lending
```

**Effort:** Low (internal metric, tidak perlu UI dulu).

### 3. Peer-Facing (untuk Community Cooperation)

Trust antar member komunitas:
- "Member aktif sejak Januari 2026"
- "Sudah 3x group purchase bersama"
- Peer endorsement (organizer vouch)

**Status:** Butuh community matang. Phase 2+.

## Status: ✅ Customer + Bank Done, ⬜ Peer Pending

```
✅ Customer-facing: "X pesanan selesai" + "Y% repeat" + "Aktif sejak" — di shop page (web)
✅ Credit readiness: API /api/credit-readiness, skor 0-100, gated ≥3 bulan — di rekap (web + mobile)
⬜ Peer trust signals — butuh community matang (group purchase history, endorsements)
```
