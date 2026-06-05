# Viral Loop — CatatOrder

> WA branding loop mechanics: how every digital receipt drives growth at Rp0 cost.

---

## The Core Loop

```
1. UMKM owner signs up free → adds first customer order
2. Owner confirms order → CatatOrder generates WA message with order details
3. Customer receives WA:
   "Pesanan Anda dikonfirmasi!
    Kue Blackforest 2 tier, 22 cm, tulisan 'Happy Birthday Anya'
    Selesai: Sabtu 10 Feb
    — Dibuat dengan CatatOrder (catatorder.id)"
4. Customer screenshots and shares in family WA group:
   "Kue ultah udah di-order!"
5. Family member (who is also a home baker/UMKM owner) sees CatatOrder link
6. Clicks link → catatorder.id → "Kelola pesanan WA tanpa ribet" → signs up free
7. New user sends their own receipts → Repeat from step 1
```

---

## Evidence: BukuWarung's Kasbon Loop (Proven Model)

BukuWarung grew to 7M users primarily through this exact mechanic:

```
Merchant records debt (kasbon) in BukuWarung
    → App sends WA reminder to debtor customer
    → Customer sees "BukuWarung" branding in message
    → Customer (who is also a small merchant) downloads app
    → Repeat
```

**Key stats:**
- WA viral loop = 60-70% of ALL BukuWarung growth
- Cost per acquisition: effectively Rp0
- WhatsApp: 90.9% penetration in Indonesia, 98% open rate

---

## CatatOrder vs BukuWarung Loop Comparison

| Dimension | BukuWarung Loop | CatatOrder Loop |
|-----------|----------------|-----------------|
| Trigger action | Record debt (kasbon) | Confirm order |
| WA message type | Debt reminder | Order confirmation + receipt |
| Branding | "BukuWarung" | "Dibuat dengan CatatOrder" |
| Recipient relevance | Debtor (may be merchant) | Customer (may be UMKM owner) |
| Shareability | Low (debt is private) | **HIGH** (order receipt shared in groups) |
| Frequency | Monthly reminders | **Every order** (daily for active users) |

**CatatOrder advantage:** Order receipts are shared publicly and proudly (customers screenshot and share in family groups). Debt reminders are private and embarrassing. CatatOrder's loop is inherently more shareable.

---

## Loop Mathematics

### Conservative Scenario

| Variable | Value |
|----------|-------|
| Active users | 100 |
| Branded WA messages per user/month | 10 |
| Total branded impressions/month | 1,000 |
| Click-through rate on link | 1% |
| Signups from clicks | 50% |
| **New signups/month** | **5** |

### Compound Growth

| Month | Active Users | WA Messages | New Signups | Total Users |
|-------|-------------|-------------|-------------|-------------|
| 1 | 100 | 1,000 | 5 | 105 |
| 3 | 115 | 1,150 | 6 | 121 |
| 6 | 140 | 1,400 | 7 | 147 |
| 12 | 200 | 2,000 | 10 | 210 |

This is JUST the WA viral loop. Add TikTok + SEO + DM outreach = faster growth.

### Optimistic Scenario (with receipt sharing in groups)

If customers share receipts in family WA groups (5+ people see each receipt):

| Variable | Value |
|----------|-------|
| Active users | 100 |
| Receipts shared in groups/month | 200 |
| People seeing each shared receipt | 5 |
| Total impressions/month | 1,000 direct + 1,000 group = 2,000 |
| **New signups/month** | **10** |

---

## Loop Optimization Checklist

### Is the branding visible enough?
- [ ] "Dibuat dengan CatatOrder" is in every WA receipt
- [ ] Link (catatorder.id) is clickable in WA
- [ ] Font size is readable (not tiny footer)
- [ ] Positioned above "order details" so it's not cut off

### Does the landing page convert?
- [ ] Landing page headline matches WA message context
- [ ] "Juga terima pesanan via WA? Kelola gratis di CatatOrder"
- [ ] Sign up flow is < 60 seconds
- [ ] Google OAuth (1-click signup)

### Is the loop end-to-end?
- [ ] New user signs up → guided to create first order → sends first receipt → branding visible
- [ ] Time from signup to first branded WA message: < 5 minutes

---

## Kill Switch v3: Viral Loop Trace (Validated)

From the v3 competition kill switch, CatatOrder's viral loop was traced end-to-end and **PASSED**:

> **Step 1:** User creates order (specific: cake details, date, price)
> **Step 2:** Output goes to customer via WhatsApp
> **Step 3:** Customer sees "Dibuat dengan CatatOrder (link)" branding
> **Step 4:** Customer is often another UMKM owner (home bakers know home bakers) — YES, recipient needs same tool
> **Step 5:** Signs up at catatorder.id

**Verdict: LOOP WORKS** — WA-native business with strong peer-to-peer spread.

---

## Additional Viral Mechanics

### 1. Share Button on Receipts
Every receipt has a "Bagikan via WA" button → one-tap sharing with branding intact.

### 2. Daily Recap as Social Proof
"Hari ini: 15 pesanan, Rp2.3M total" — users screenshot and post to IG Stories → indirect brand awareness.

### 3. Referral Incentive (Future)
"Share CatatOrder ke 1 teman → dapat 1 bulan gratis"
- User forwards link to WA contact
- Friend signs up → user gets credit
- Trigger points: after aha moment, after first payment, in monthly report

---

## Source Files
- `kernel/research/35b-competition-kill-switch/kill-switch-v3.md` — End-to-end viral loop tracing for KueStrive (same mechanics)
- `kernel/research/distribution-audit/synthesis.md` — BukuWarung kasbon loop model, WA penetration stats
- `kernel/research/reference/distribution-growth-engine.md` — Referral loop mechanics
