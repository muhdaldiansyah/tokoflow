# Financial Inclusion — Long Game

> Setiap pesanan yang dicatat = satu data point menuju akses modal.

**Basis riset:**
- `value/catatorder/2026-03-25-analyze.md` — latent value terbesar (Rp2.4T gap)
- `value/catatorder/2026-03-25-scan.md` — dropped ke priority #5, DEPENDS on pricing compass (#1)
- `research/reality/012-umkm-pricing-margin/` — 21.3% UMKM punya kredit formal, 55-60% rejection rate

---

## Kenapa Priority #5 (Bukan #1)

/analyze awalnya taruh ini sebagai priority #1. /scan menemukan **dependency:**

```
Pricing intelligence (#1)
  → Better margins
    → Better financial data
      → Better credit scoring
        → Financial inclusion (#5)
```

Tanpa pricing intelligence, UMKM yang underprice akan menghasilkan data finansial yang menunjukkan bisnis tidak viable — even though bisnisnya fine, just mispriced. Bank lihat data → "ini bisnis tidak profitable" → reject.

**Fix urutan: pricing dulu, financial inclusion kemudian.**

## Data yang Dibutuhkan

| Data | Untuk Credit Scoring | Ada di CatatOrder? |
|------|---------------------|-------------------|
| Revenue bulanan | Income proof | YA (orders) |
| Konsistensi revenue | Stability signal | YA (order history over time) |
| Payment collection rate | Cash flow health | YA (payment status per order) |
| Customer diversity | Risk diversification | YA (customers table) |
| Growth trajectory | Business viability | YA (order trend) |
| Margin / profitability | Sustainability | BELUM — butuh pricing compass dulu |

## Timeline

```
✅ Done:        Pricing compass (Sprint 1-8)
✅ Done:        Credit readiness score (API + UI, gated ≥3 bulan)
⬜ Bulan 6-12:  Start conversations dengan fintech (Amartha, KoinWorks, bank BPR)
⬜ Bulan 12+:   Pilot lending partnership dengan UMKM yang punya 6+ bulan data
```

## Angka Kunci

- 64.2 juta UMKM di Indonesia
- Hanya 21.3% punya akses kredit formal (BI 2024)
- 55-60% rejection rate di bank komersial (OJK 2024)
- 41% eligible KUR tapi TIDAK apply karena tidak percaya akan disetujui
- Gap: Rp2.4 triliun kredit UMKM yang belum terlayani

## Prediction (dari /analyze)

> "UMKM yang mendapat kredit melalui CatatOrder data akan show lower default rate dibanding UMKM yang apply tanpa data."

Deadline: 2028-12. Falsifikasi: default rate sama atau lebih tinggi.
