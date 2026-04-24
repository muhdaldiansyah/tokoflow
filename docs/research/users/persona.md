# User Persona — CatatOrder Target UMKM

> Demographics, behavior, and digital literacy of Indonesian UMKM owners who receive orders via WhatsApp.

---

## Primary Persona: UMKM Owner with WA-Based Orders

### Demographics

| Attribute | Estimated Range | Basis |
|-----------|----------------|-------|
| Age range | 25-55 years old | Typical UMKM owner profile |
| Gender split | ~60% female, 40% male | Warung/home-based often run by women |
| Education | SD-SMA (elementary to high school) | Rural UMKM profile |
| Location | 60% urban/peri-urban, 40% rural | Digitally active UMKM skew urban |
| Business tenure | 1-20+ years | Mix of new and established |
| Employees | 0-5 (mostly family/informal) | Micro business category |
| Primary device | Android phone (entry-level to mid-range) | 99.3% smartphone ownership |
| Monthly revenue | Rp3-30 million | Micro to small UMKM |
| Net profit | Rp500K-5 million/month | 10-15% of omzet |

### Business Types in CatatOrder Target

| Type | Example | Order Volume |
|------|---------|-------------|
| Home baker | Kue custom, kue kering | 20-200+ orders/month (peak Lebaran) |
| Tailor/penjahit | Baju custom, konveksi | 30-500 orders/month (peak Lebaran) |
| Katering | Event catering, daily catering | 20-100 orders/month |
| Warung/toko | Kelontong, sembako | Daily transactions |
| Servis HP | Phone/laptop repair | 50-300 service orders/month |
| Fotocopy | Print/copy services | 50-200+ daily transactions |

---

## Digital Literacy & Behavior

### Key Stats

| Metric | Value | Source |
|--------|-------|--------|
| Indonesia digital literacy index | 62% (lowest in ASEAN, avg 70%) | CNBC Indonesia |
| Digital literacy score (1-5 scale) | 3.54 | BPS Indonesia |
| UMKM with basic digital skills | ~18% | Kompasiana/Kominfo |
| Smartphone ownership (16+ internet users) | 99.3% | Statista 2023 |
| Average daily phone usage | 6 hours | DataReportal |
| WhatsApp penetration | 90.9%, 98% open rate | WhatsBoost |
| Mobile e-commerce traffic share | 80%+ | DataReportal |
| Cash share of transactions (2025) | 51% (down from 70% in 2020) | Market Research Indonesia |

### Digital Tools They Already Use

| Tool | Usage | Significance |
|------|-------|-------------|
| WhatsApp | Primary business communication, order intake | 90.9% penetration |
| Instagram | Product showcase, order intake | Growing adoption |
| TikTok | Product discovery, viral marketing | 125M Indonesian users |
| Facebook | Community groups, marketplace | Older UMKM demographic |
| QRIS | Digital payments | 15M micro-merchants joined in 2024 |
| Google Play | App discovery | Primary app store |

### Key Insight

> **Smartphone ownership is near-universal, but digital literacy for business tools is the bottleneck — not device access.**

Even after training programs, UMKM struggle with "simple recording":
> "Banyak UMKM yang telah mengikuti pelatihan mengaku masih kesulitan menerapkan pencatatan sederhana karena kurangnya bimbingan lanjutan."
> *(Government training report — Dinas Koperasi Kepri)*

---

## How UMKM Discover Tools (Ranked by Trust)

1. **Word-of-mouth / peer recommendations** (most trusted)
2. **WhatsApp groups** (community sharing)
3. **Social media** (Instagram, TikTok, Facebook)
4. **Google Play Store search**
5. **Google Search** (Bahasa Indonesia)
6. **Field sales reps** (higher-priced products only)
7. **Government programs** ("UMKM Go Digital")

### What Convinces UMKM to Pay

- Solves an immediate, painful, recognized problem
- Simplicity (usable with minimal training)
- Free tier that demonstrates clear value first
- Social proof from peers in similar businesses
- WhatsApp-based support (instant access to a human)
- Monthly billing (they think in monthly cash flow cycles)

---

## UX Requirements (Based on Persona)

| Requirement | Rationale |
|-------------|-----------|
| 100% Bahasa Indonesia | Informal/conversational tone |
| Minimal typing, large buttons | Low digital literacy |
| Phone number signup (no email) | Many don't use email regularly |
| < 2 minute onboarding | Time-to-value must be instant |
| Works on mid-range Android | Entry-level phones with limited storage |
| High contrast UI | Readability in bright conditions |
| WhatsApp-based support | Most comfortable channel |

### The Persona in One Sentence

> Ibu 35-45 tahun, punya bisnis kue/jahit/warung rumahan, terima orderan via WA, catat di kepala atau buku tulis, punya HP Android, aktif di WA/IG/TikTok, budget ketat tapi mau bayar kalau jelas manfaatnya.

---

## Source Files
- `kernel/memory/research/warungstrive-02-user-pain-validation.md` — Demographics, digital literacy 3.54/5, smartphone 99.3%
- `kernel/research/distribution-audit/synthesis.md` — How UMKM discover tools, what convinces them to pay
