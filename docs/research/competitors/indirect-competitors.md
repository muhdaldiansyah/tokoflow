# Indirect Competitors — CatatOrder

> POS and bookkeeping apps that overlap with order management but target different segments.

---

## Competitor Pricing Matrix

| App | Lowest Paid | Target | Downloads | Threat to CatatOrder |
|-----|------------|--------|-----------|---------------------|
| BukuWarung | Free | Warung (fintech pivot) | 10M+ | LOW — pivoting away from core |
| Kasir Pintar Pro | Rp55K/mo | UMKM broadly | 1M+ | MEDIUM — affordable, full POS |
| iReap Lite | Free | Small retail | 100K+ | LOW — POS, not order mgmt |
| iReap Pro | Rp99-150K/mo | Small retail | 100K+ | LOW — POS focus |
| OttoPay | Free | Warung (PPOB focus) | 500K+ | LOW — PPOB, not order mgmt |
| Olsera Basic | Rp128K/mo | Retail & F&B | 10K+ | LOW — different segment |
| Pawoon Pro | Rp299K/mo | Cafe, restaurant | 100K+ | NONE — enterprise pricing |
| Moka POS | Rp299K/mo | Cafe, salon, SME | 500K+ | NONE — enterprise pricing |
| Majoo Starter | Rp249K/mo | Growing SME | 100K+ | NONE — enterprise pricing |

---

## Detailed Analysis: Key Indirect Competitors

### Kasir Pintar (Closest Price Competitor)

| Attribute | Detail |
|-----------|--------|
| Price | Free (1K products, watermarked) / Pro Rp55K/mo |
| Rating | 4.8 stars, ~49.5K reviews |
| Downloads | 1M+ |
| Focus | Full POS with barcode, inventory, receipts, PPOB |

**Strengths:** Very affordable Pro tier. Large user base. PPOB integration gives additional income.

**Weaknesses for UMKM WA sellers:** Full POS complexity. Requires product database setup. Not designed for WA-native order flow.

**CatatOrder differentiation:** CatatOrder is for WA order management. Kasir Pintar is for POS transactions. Different use case.

### iReap POS (Strongest Free Alternative)

| Attribute | Detail |
|-----------|--------|
| Price | Lite: genuinely free, no limits / Pro: Rp99-150K/mo |
| Downloads | 100K+ (Lite) |
| Focus | POS + inventory with moving average costing |

**Strengths:** Free with no limits. Strong offline capability. Serious inventory features (moving average costing).

**Weaknesses for WA sellers:** Still a full POS system. Overwhelming UI for micro UMKM. Requires hardware (printer, scanner) for full use.

**CatatOrder differentiation:** CatatOrder = order capture from WA. iReap = point-of-sale cashier system.

### Moka POS (GoTo Ecosystem)

| Attribute | Detail |
|-----------|--------|
| Price | Rp299K/outlet/mo |
| Downloads | 500K-1M |
| Focus | Cloud POS for cafes, restaurants, salons |
| Owner | PT GoTo (acquired for ~$120M) |

**Why not a threat:** Rp299K is 6x CatatOrder's price. Targets upscale SME. GoTo has zero strategy for micro UMKM with WA-based orders.

### Majoo (Most Feature-Complete)

| Attribute | Detail |
|-----------|--------|
| Price | Starter Rp249K / Advance Rp499K / Prime Rp999K |
| Users | 40,000+ merchants in 600+ cities |
| Focus | Comprehensive POS + inventory + accounting + HR + CRM |

**Why not a threat:** Rp249K minimum. Built for growing SMEs, not micro-retailers. Complex UI. Hidden costs with add-ons (accounting: Rp1.7M/mo extra).

**Majoo's own problem:** Had to create "majoolite" for smaller businesses — buggy, no stock history, can't select dates for reports.

---

## App Store Competition

### Play Store Search Results

| Search Query | Top Results | CatatOrder Position |
|-------------|-------------|-------------------|
| "kelola pesanan whatsapp" | No dominant app | **Uncontested** |
| "aplikasi order WA" | Generic WA tools | **Uncontested** |
| "kasir warung" | Kasir Warung, Kasir Saku, iReap | Different category |
| "stok warung" | iReap, BukuWarung | Different category |
| "struk digital" | No dominant app | **Opportunity** |

**Key observation:** No dominant app for "kelola pesanan WA" or "order management UMKM". The search results are fragmented among generic POS and bookkeeping apps.

---

## Segment Map

```
                    WA Order Mgmt            POS / Cashier            Bookkeeping
                    ─────────────            ────────────             ────────────
Free                Manual WA                iReap Lite               BukuWarung
                    (incumbent)              Loyverse

Rp29-49K            CatatOrder               —                        —
                    (ALONE)

Rp55-150K           —                        Kasir Pintar Pro         Kledo
                                             iReap Pro

Rp200K+             Wati ($49+/mo)           Moka, Majoo, Pawoon      Jurnal, Mekari
                    Qontak (enterprise)       Olsera
```

**CatatOrder occupies an uncontested segment: WA order management at Rp49K.**

---

## Source Files
- `kernel/memory/research/warungstrive-01-competitor-analysis.md` — 9-app pricing table, gap analysis
- `kernel/research/distribution-audit/synthesis.md` — Channel comparison matrix, pricing frameworks
