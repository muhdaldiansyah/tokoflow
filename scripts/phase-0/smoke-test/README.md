# Phase 0 Smoke Test — Manual Twin Role-Play

> **Purpose**: Cheap architectural validation BEFORE committing to expensive Phase 1 build. Aldi himself acts as Background Twin for 1 volunteer merchant for 2 weeks. Tests **trust transfer** (will customer notice?) and **Three-Tier value** (does removing Tier 3 actually return craft time?) without writing any code.

> **Cost**: ~30 hours of Aldi's time over 2 weeks. **Insight**: validates whole thesis or kills it.

---

## Why this test matters

Bible v1.2 ([D-014](../../../docs/positioning/07-decisions.md)) bets on a **2-layer twin architecture** — Background Twin (autonomous Tier 3) + Foreground Assist (Tier 2 suggest, merchant sends). Two architectural risks:

1. **Trust transfer brittleness (Attack #2 in red-team)** — customer might notice AI tone in Tier 2 → relationship moat broken
2. **Tier 3 value question (Attack #1)** — Bu Aisyah might actually love some "residue" we plan to automate (e.g., personally hand-writing receipts as connection)

The smoke test exposes both risks **WITHOUT building anything.** Aldi *manually* impersonates Background Twin for 2 weeks via 1 merchant's WA + dashboard.

---

## Pass / Fail

### PASS (proceed to Phase 1 build)

- ✓ Merchant rates manual twin **>7/10 helpfulness** at end of week 2
- ✓ **Zero customer complaints** about "feel" change (proactive surveillance)
- ✓ Merchant self-reports **≥3 hours/week** craft time saved (qualitative diary)
- ✓ Merchant says: *"I'd want this if it was an app"* unprompted at debrief
- ✓ Aldi can sustain operation in **≤2 hours/day** of manual work (proves AI scope is realistic)

### KILL (refine architecture or rethink)

- ✗ Customer notices anything off → reduce Foreground Assist scope further
- ✗ Merchant uncomfortable with Aldi seeing chat → trust model wrong, can't even handle one trusted human
- ✗ Aldi takes >4 hours/day handling residue → AI cost projection definitely unsustainable
- ✗ Merchant rates <5/10 helpful → Three-Tier value framing wrong

---

## Recruit the merchant

**Profile**: 1 friendly merchant from Phase 0 interviews who:
- Has ≥30 orders/month (enough volume to test)
- Uses WhatsApp Business or normal WA for orders
- Comfortable letting Aldi observe + assist via WA admin access (huge trust ask)
- Will commit to: 2-week test + weekly 30-min debrief + final 1-hour debrief

**Compensation**: 3 months free Tokoflow Pro at launch (worth RM 147–237 depending on final pricing) + RM 200 cash upfront for time. Frame as *"membership of pioneer cohort, your input shapes the product."*

**Consent + transparency**:
- Aldi will see all incoming customer chats during test window
- Aldi will draft replies for merchant approval before sending (Foreground Assist)
- Aldi will execute admin tasks (payment match, invoice, status update) silently (Background Twin)
- Aldi will NOT see private/family chats — only business numbers
- Test stops anytime merchant requests
- Customer-facing: NO disclosure that Aldi is involved (testing exactly what real twin would feel)

---

## What Aldi does (the role-play)

### Background Twin scope (Aldi acts autonomously)

For 2 weeks, Aldi handles these **without checking with merchant first**:

| Task | Trigger | Action |
|---|---|---|
| Payment matching | Bank notif (merchant forwards screenshots) | Update spreadsheet linking payment to order |
| Invoice generation | Order confirmed | Generate invoice PDF, send to merchant for forwarding (or directly if customer requested) |
| Status update sending | Merchant says "siap" via private chat to Aldi | Send "siap untuk pickup" to customer via merchant's number |
| Stock tracking | Each order | Update spreadsheet, alert merchant when stock ≤ 3 |
| Customer relationship memory | All interactions | Maintain notes: "Pak Andi: 5x order, suka kek lapis tanpa kismis, biasa hantar Selasa" |

### Foreground Assist scope (Aldi suggests, merchant sends)

For these, Aldi sends **DRAFT** to merchant via separate private chat. Merchant reads, approves/edits, then sends to customer themselves:

| Task | Trigger | Aldi action |
|---|---|---|
| New order Q&A | Customer asks "berapa harga?" "ada lagi?" "boleh hantar?" | Draft reply with customer's name, send to merchant |
| Pattern surfacing | Pak Andi back for 3rd time | Tell merchant: "Pak Andi balik lagi (3x), suggest: ucap terima kasih sebagai pelanggan setia" |
| Complaint draft | Customer expresses dissatisfaction | Draft calm-solutif response, send to merchant for review |

### What Aldi DOES NOT do

- ❌ Reply to customer directly without merchant approval (relationship is merchant's)
- ❌ Set prices (merchant's call)
- ❌ Make pricing decisions ("kasih diskon ke?") — flag to merchant
- ❌ Touch private/family chats
- ❌ Auto-post to social media
- ❌ Handle anything outside business hours (respect quiet hours)

---

## Daily protocol

### Aldi's daily tracking (use `tracking-template.md`)

Each day Aldi logs:
- Hours spent: total + per-task breakdown
- Background Twin actions (count + which type)
- Foreground Assist drafts (count + approved-without-edit % + edited % + rejected %)
- Errors / things Aldi got wrong
- Trust signals (merchant questions, customer questions)
- Surprise observations

### Merchant daily check-in (5 min)

Brief WhatsApp voice note:
- "Macam mana hari ini?"
- "Ada yang Aldi handle yang kamu rasa salah?"
- "Ada moment kamu rasa lega?"

### Weekly debrief (30 min)

End of week 1 + end of week 2:
- Walk through quantitative diary
- Open questions: what felt good / what felt off
- Adjustments for next week

### Final debrief (1 hour)

End of week 2:
- Sean Ellis test: "Kalau ini tutup esok, kamu rasa: sangat kecewa / agak kecewa / tak peduli?"
- Helpfulness rating 1-10
- Self-report craft time saved per week
- Customer-side investigation: "Did anyone seem to notice?"
- "I'd want this as an app?" — capture answer + intensity
- Wave 2 friend referrals

---

## Data outputs

After 2 weeks, produce:

1. **Aldi's manual hours diary** — proves scalability projection
2. **Merchant's helpfulness ratings** — week 1 + week 2 trend
3. **Customer surveillance notes** — any signals customer noticed anything?
4. **Three-Tier validation** — did merchant feel admin disappear? Did relationship stay theirs?
5. **Trust progression observation** — did merchant trust Aldi more by week 2?
6. **Architectural learnings** — what did Aldi struggle to do that AI also will?

Synthesize into **smoke-test-report.md** for D-018 input alongside interviews.

---

## Critical: this is NOT user research

This is **architectural validation**. The merchant is helping us test if the 2-layer twin pattern even works for ONE person. If it fails for 1 carefully-chosen, friendly, high-trust merchant — it definitely fails at 50.

Don't optimize for merchant's specific needs. Optimize for learning whether the **pattern** works.

---

*Last updated: 2026-04-28 · Phase 0.5 deliverable · See [`docs/positioning/06-roadmap.md` Phase 0](../../../docs/positioning/06-roadmap.md#phase-0--validation-first-foundation-aprjul-2026-3-months)*
