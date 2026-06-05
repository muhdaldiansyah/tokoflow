# Channel Strategy — CatatOrder

> 3 viable channels at $0 ad spend for Rp49K ARPU.

---

## Why These 3 Channels

Based on 5-company distribution audit, only channels that meet ALL criteria:
- Cost $0 in ad spend
- Work at Rp29-149K/month ARPU
- Can be executed by a solo builder
- Have proven evidence from audited companies

---

## Channel 1: WhatsApp Viral Loops (Highest Potential)

### Evidence
BukuWarung grew to 7M users primarily through WA kasbon reminders. Zero cost. Natural product behavior drives growth.

### CatatOrder Implementation

Every order confirmation CatatOrder sends is a branded WA message:

```
"Pesanan Anda dikonfirmasi!
 Kue Blackforest 2 tier, 22 cm, tulisan 'Happy Birthday Anya'
 Selesai: Sabtu 10 Feb
 — Dibuat dengan CatatOrder (catatorder.id)"
```

**The viral loop end-to-end:**
1. UMKM owner creates order in CatatOrder
2. App generates WA message with order details
3. Customer receives WA with CatatOrder branding + link
4. Customer screenshots and shares in family/friend WA group
5. Another UMKM owner in the group sees CatatOrder link
6. Clicks link → sees "Kelola pesanan WA tanpa ribet" → signs up free
7. Repeat from step 1

### Expected Impact
- 100 active users × 10 branded WA messages/month × 1% click → sign up = 10 new signups/month
- Compounds over time: 200 users → 20 signups → 220 users → 22 signups...
- Cost: Rp0

### Implementation Checklist
- [x] "Powered by CatatOrder" footer with clickable link on every receipt
- [x] wa.me/ share button on receipts and reports
- [ ] Landing page: "Juga terima pesanan via WA? Kelola gratis di CatatOrder"

---

## Channel 2: Bahasa Indonesia SEO (Biggest Long-Term Asset)

### Evidence
iReap ranked #1 for "kasir gratis" and grew to 500K downloads on $0 marketing. Bahasa Indonesia long-tail keywords have extremely low competition.

### CatatOrder Target Keywords

| Keyword | Est. Monthly Volume | Competition |
|---------|-------------------|-------------|
| "aplikasi kelola pesanan WA" | Low (emerging) | Very Low |
| "struk digital UMKM" | 200-500 | Very Low |
| "aplikasi order management" | 500-1K | Low |
| "cara terima pesanan kue WhatsApp" | Low | Zero |
| "aplikasi pesanan kue" | 200-500 | Low |
| "aplikasi order jahit" | 100-300 | Very Low |
| "nota digital gratis" | 200-500 | Low |

### Content Strategy

For CatatOrder, create:
1. **Landing page** optimized for "kelola pesanan WA" (already exists)
2. **Blog: "Cara Mengelola Pesanan WA Tanpa Ribet"** — educational → CTA
3. **Blog: "5 Masalah UMKM yang Terima Order via WA"** — pain-focused → CTA
4. **Comparison: "CatatOrder vs Catat Manual di WA"** — before/after
5. **Template: "Template Nota/Struk Digital Gratis"** — lead magnet

### Programmatic SEO (Scale)

City-specific landing pages:
- `/aplikasi-order-kue-[kota]` → "Aplikasi Order Kue Terbaik di Malang"
- `/struk-digital-[kota]` → "Struk Digital UMKM di Bandung"
- 50-100 pages = 50-100 organic entry points

### Timeline
- Month 1-3: ~100 organic visits/month (content being indexed)
- Month 6: ~500-1K organic visits/month
- Month 12: ~2-5K organic visits/month
- At 5% signup rate: 100-250 signups/month from SEO alone

---

## Channel 3: TikTok / Social Content (Fastest Initial Growth)

### Evidence
None of the 5 audited companies used TikTok (predated its rise). But TikTok has 125M users in Indonesia, and UMKM content performs well.

### Content Formats (15-60 seconds)

| Format | Hook | Content | CTA |
|--------|------|---------|-----|
| **Problem → Demo** | "Masih catat order di WA yang bertumpuk?" | 30-sec screen recording of CatatOrder | "Link di bio, gratis!" |
| **Before → After** | "Dulu: scroll WA cari pesanan" | Split screen: WA chaos vs CatatOrder dashboard | "Coba gratis: link" |
| **Relatable Pain** | "Order kue Lebaran numpuk? Jangan panik..." | Show CatatOrder managing 50+ orders | "Semua rapi, 1 klik" |
| **Tutorial** | "Cara bikin struk digital tanpa printer" | Step-by-step in CatatOrder | "Download gratis" |
| **Behind the scenes** | "Saya developer yang bikin app untuk UMKM..." | Personal story → show CatatOrder | "Kalau terima order via WA, coba ini" |

### Production
- Phone screen recording + CapCut editing (zero cost)
- Subtitle Indonesia mandatory (many watch muted)
- Cross-post all to Instagram Reels (zero extra effort)
- **Frequency:** 3-5 videos/week

### Expected Impact
- 20 videos/month × 300 avg views = 6K impressions
- At 1% click-through: 60 profile visits → 20-30 signups/month
- Viral outliers (1 in 20 videos gets 10K+ views): bonus 100-500 signups

---

## Anti-Patterns to Avoid

| Anti-Pattern | Evidence | Rule |
|-------------|---------|------|
| Paid ads at low ARPU | BukuKas: $80M → dead | No ad budget. Ever. |
| Premature field sales | Moka/Majoo: needs Rp1B/month team | WA personal onboarding instead |
| "Build and they will come" | 19 products built, $85 MRR proves this wrong | Active distribution from day 1 |
| Spreading across all platforms | Dilutes effort | Master WA + TikTok first, then SEO |

---

## Priority Order

| Phase | Channel | Timing | Why |
|-------|---------|--------|-----|
| 1 | WA Viral Loop | Immediate | Built into product. Every receipt = growth. |
| 2 | TikTok Content | Week 1+ | Fast feedback. Algorithm-driven reach. |
| 3 | DM Outreach | Week 1-2 | High conversion for first 10 users. |
| 4 | FB Group Seeding | Week 2+ | Community trust building. |
| 5 | SEO Content | Month 1+ | Long-term compound asset. |

---

## Source Files
- `kernel/research/distribution-audit/synthesis.md` — 3 viable channels, evidence from 5 companies
- `kernel/research/reference/distribution-growth-engine.md` — 3-layer system (Seeding → Content → Retention)
