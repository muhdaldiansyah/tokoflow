# TAM / SAM / SOM — CatatOrder Market Sizing

---

## Total Addressable Market (TAM)

### Indonesian UMKM Universe

| Metric | Value | Source |
|--------|-------|--------|
| Total UMKM in Indonesia | 64.2 million | Ministry of Cooperatives and SMEs 2024 |
| UMKM contribution to GDP | 61% | Kemenkop |
| UMKM workforce | 117 million (97% of total) | Ministry data |
| Total warung/kelontong | 3.94 million | Euromonitor 2022 / Niaga.Asia |
| % of all retail outlets | 98.78% | Mendag data |

### Digital Readiness

| Metric | Value | Source |
|--------|-------|--------|
| UMKM digital adoption (2025) | 63% | DataReportal / Market Research Indonesia |
| UMKM still using manual methods | 70% | Mastercard / Zenodo 2024 |
| UMKM with basic digital skills | 18% | Kominfo 2024 |
| Cash share of transactions | 51% (down from 70% in 2020) | We Are Social |
| WhatsApp penetration | 90.9%, 98% open rate | WhatsBoost |
| Smartphone ownership (16+ internet users) | 99.3% | Statista 2023 |
| 15M micro-merchants joined QRIS (2024) | Growing digital payment | Industry data |

**TAM calculation:** 64.2M UMKM, of which ~70% (44.9M) still manage orders/receipts manually.

---

## Serviceable Addressable Market (SAM)

### UMKM with Significant WhatsApp Orders

| Segment | Size | Basis |
|---------|------|-------|
| UMKM receiving significant WA orders | ~6.4 million | ~10% of 64.2M (PSO scan estimate) |
| Home-based food businesses (kue, katering) | Millions | Home baker communities massive post-COVID |
| Tailors/konveksi | 200-300K+ | PSO v3 scan |
| Warung/kelontong | 3.94 million | Euromonitor |

**SAM calculation:** ~6.4M UMKM actively receiving orders via WhatsApp with no management tool.

### Revenue Profile of Target Segment

| Warung Type | Monthly Omzet | Net Profit (~10-15%) |
|-------------|--------------|---------------------|
| Small warung | Rp5-9 million | Rp500K-1.35M |
| Medium warung | Rp15-30 million | Rp1.5-4.5M |
| SRC-assisted warung | Rp15-17 million | Rp1.5-2.5M |
| Home baker (active) | Rp3-15 million | Varies |
| Small penjahit | Rp5-20 million | Rp1-4M |

---

## Serviceable Obtainable Market (SOM)

### CatatOrder Penetration Scenarios

| Scenario | Penetration | Users | Price | MRR |
|----------|------------|-------|-------|-----|
| Conservative (0.01%) | 0.01% of 6.4M | 640 | Rp49K avg | Rp31.4M |
| Base (0.1%) | 0.1% of 6.4M | 6,400 | Rp49K avg | Rp313M |
| Optimistic (1%) | 1% of 6.4M | 64,000 | Rp49K avg | Rp3.14B |

### Indonesian SaaS Market Context

| Metric | Value | Source |
|--------|-------|--------|
| Indonesian SaaS market (2025) | ~$400M | Statista |
| Indonesian SaaS market (2030 projected) | ~$1.3B | Statista |
| UMKM SaaS adoption rate | 19-25% | Market Research Indonesia |

### Micro SaaS Reality Check (Global Benchmarks)

| Metric | Value |
|--------|-------|
| Products making <$1K/month | 70% |
| Products at $1-5K MRR ("sustainability zone") | 18% |
| Products exceeding $50K/month | 1-2% |
| Average monthly churn | 3.5% |
| Average time to profitability | 8 months |

**Strive's SOM target:** Reach the $1-5K MRR sustainability zone. At Rp49K/month average, that's 130-650 paying users total.

---

## Key Takeaway

CatatOrder's market is massive (6.4M+ UMKM with WA orders) but conversion will be low (1-2% free-to-paid at Indonesian price sensitivity). The path: capture broadly with free tier, convert the most active users at Rp49-99K/month.

---

## Source Files
- `kernel/research/distribution-audit/synthesis.md` — 57-64M UMKM stats, SaaS market data
- `kernel/memory/research/warungstrive-02-user-pain-validation.md` — 3.94M warungs, omzet ranges
- `kernel/memory/research/pso-indonesia-markets-scan-2026-01-29.md` — 6.4M UMKM with WA orders, Rp313M MRR
- `kernel/memory/research/strukku-validation-research-2026-01-25.md` — 66M MSMEs, 70% still manual
