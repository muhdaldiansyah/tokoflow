# Wrong Location in Workflow — Problem Definition & Resolution

> The single biggest barrier to CatatOrder adoption: orders happen INSIDE WhatsApp, but CatatOrder lives OUTSIDE WhatsApp.
>
> Status: **SOLVED** (WA Cloud API Bot — tested end-to-end, Development mode)
>
> Last updated: 2026-02-13

---

## The Problem

### One Sentence

> Orders happen inside WhatsApp, but CatatOrder lives outside WhatsApp — forcing 20-50 app switches per day during peak season.

### The Workflow Gap

```
BEFORE (without CatatOrder):
Customer sends WA → Baker reads → Baker remembers → Lost in chat

WITH CatatOrder (but WITHOUT WA Bot):
Customer sends WA → Baker reads → Baker SWITCHES to Chrome → Opens catatorder.id
    → Taps "Baru" → Copy-pastes WA text → AI parses → Saves
    → Baker SWITCHES BACK to WA → Replies to customer
    = 20-50 app switches/day during Lebaran

WITH CatatOrder + WA Bot:
Customer sends WA to bot number → Bot collects messages → Customer says "selesai"
    → AI auto-parses → Confirmation with buttons (Simpan/Ubah/Batal)
    → Customer taps Simpan → Order auto-created → Done
    = 0 app switches. Everything happens inside WhatsApp.
```

### Why This Matters

During Lebaran (peak season), home bakers handle **50-200+ active WA conversations**. Each order requires:

1. Read customer message in WA
2. Mentally parse items, quantities, prices
3. Switch to Chrome browser
4. Navigate to catatorder.id (or find bookmark)
5. Wait for page load (slow connection)
6. Tap "Baru", paste text, wait for AI
7. Review and save
8. Switch back to WA to reply

**Each switch costs 30-60 seconds** of context-switching for a user with 18% digital literacy (Kominfo 2024). Multiply by 20-50 orders/day = **10-50 minutes of pure friction** per day.

The product helps with storage and tracking (the last 30% of pain), but the hardest part — extracting structured data from unstructured WA chat (70% of pain) — still fell on the baker.

### Pain Distribution

```
[||||||||||||____] Order Intake (parsing WA messages)  — 70% of pain
[||||____________] Status Tracking (remembering state)  — 15% of pain
[|||_____________] Payment Collection (who paid DP?)    — 10% of pain
[|______________] Daily Recap (manual counting)         —  5% of pain
```

CatatOrder was strongest at the last 30%. The WA Bot addresses the first 70%.

---

## The Evidence

### From Product Relevance Audit

> "CatatOrder solves a real, validated problem. But it solves it at the **wrong point in the workflow**. The baker needs help inside WhatsApp; CatatOrder lives outside WhatsApp in a browser."
> — `research/problem/product-relevance.md`

Score breakdown:
- Problem relevance: 9/10
- Feature fit: 7/10
- **UX fit for audience: 5/10** (web app + manual entry + 18% digital literacy = high friction)

### From Baker Case Studies

| Baker | Scale | Problem |
|-------|-------|---------|
| Pawon Kue | Small | "menggunakan buku untuk mencatat pesanan... mengalami kesulitan" |
| Arum Cookies | Medium | "kewalahan dan telah menolak banyak orderan" |
| Farah Tri | Medium | 3,000 toples by mid-Ramadan — "membuat kewalahan" |
| Rosidah | Large | Rejected 30% of orders worth Rp300-400M |

### From Competitor Analysis

Dazo.id — a direct competitor — already solved this with a WA bot + order management SaaS for UMKM. CatatOrder needed the WA Cloud API integration to remain competitive.

---

## The Solution: WA Cloud API Bot

### Architecture

```
Customer WA Message
    → Meta Cloud API
    → Webhook (POST /api/wa/webhook)
    → Signature verification (HMAC-SHA256)
    → Background processing (after() from next/server)
    → Session management (Supabase wa_sessions table)
    → AI Parse (Gemini 3 Flash via extractItemsFromText())
    → Interactive buttons (Simpan/Ubah/Batal)
    → Order auto-created (source: 'whatsapp')
    → Customer gets confirmation with order number
```

### How It Works

1. **Customer sends message** to WA Business number
2. **New session created** — welcome message sent, collecting mode starts
3. **Multi-message aggregation** — customer sends items across multiple messages
4. **Trigger word** ("selesai", "udah", "itu aja", etc.) finalizes collection
5. **AI parsing** — Gemini 3 Flash extracts items, quantities, prices, customer name
6. **Confirmation** — interactive button message with order summary (Simpan/Ubah/Batal)
7. **Simpan** — order auto-created in Supabase, customer notified with order number
8. **Ubah** — session reset to collecting, customer sends corrections
9. **Batal** — session cancelled

### What Was Built

| Component | File | Purpose |
|-----------|------|---------|
| Webhook endpoint | `app/api/wa/webhook/route.ts` | GET verify + POST receive messages |
| Signature verification | `lib/whatsapp/verify.ts` | HMAC-SHA256 via X-Hub-Signature-256 |
| Graph API client | `lib/whatsapp/client.ts` | Send text, buttons, mark as read |
| TypeScript types | `lib/whatsapp/types.ts` | Webhook payload, message, session types |
| Message handler | `lib/wa-bot/handler.ts` | Core orchestration — routing, state machine |
| Session manager | `lib/wa-bot/session.ts` | Create, collect, parse, confirm, complete, cancel |
| Order creator | `lib/wa-bot/order-creator.ts` | Server-side order creation with customer upsert |
| Message builders | `lib/wa-bot/messages.ts` | Indonesian message templates with CatatOrder branding |
| Database tables | `supabase/migrations/014_wa_bot.sql` | wa_connections, wa_sessions, wa_messages |

### Session State Machine

```
COLLECTING ──(trigger word)──→ AI Parse ──→ CONFIRMING
     ↑                                          │
     │ (new message)                 ┌──────────┼──────────┐
     │                               │          │          │
     └────────────(Ubah)────── "Simpan"    "Ubah"    "Batal"
                                     │          │          │
                                     ↓          ↓          ↓
                                COMPLETED   COLLECTING  CANCELLED
```

### Cost

| Item | Cost |
|------|------|
| Cloud API platform | $0 (free) |
| Service conversations (customer-initiated) | $0 (free, unlimited) |
| Utility templates within 24h window | $0 (free) |
| AI parsing (Gemini 3 Flash via OpenRouter) | ~$0.001/order |
| **Total per order** | **~$0** |

---

## Current Status

| Item | Status |
|------|--------|
| Code | Complete, deployed to Vercel |
| Webhook | Live at `catatorder.id/api/wa/webhook` |
| End-to-end test | Passed (order WO-20260213-6283 created via bot) |
| Token | System User token (never-expire), stored in wa_connections |
| App mode | **Development** (test number +1 555 179 6373) |
| Production | Pending: buy Indonesian SIM + register WA Business number + App Review |

### Production Checklist

- [ ] Buy new Indonesian SIM card
- [ ] Add phone number in Meta Dashboard (WhatsApp → API Setup → Add phone number)
- [ ] Update `wa_connections` row with new `wa_phone_number_id`
- [ ] Submit App Review to switch from Development → Live mode
- [ ] Set Vercel env vars (`WA_VERIFY_TOKEN`, `WA_APP_SECRET`)

---

## What This Does NOT Solve (Yet)

| Gap | Description | Priority | When |
|-----|-------------|----------|------|
| Image/photo orders | Customer sends photo of handwritten order — bot can't process images yet | MEDIUM | Phase 2 |
| Voice note orders | Customer sends voice note — bot can't transcribe yet | LOW | Phase 3 |
| Replace Fonnte outbound | Payment reminders + daily recaps still use Fonnte (unofficial, ban risk) | MEDIUM | ~50-100 users |
| Multi-tenant (Tech Provider) | Each CatatOrder user connects their own WA number via Embedded Signup | HIGH | ~50-100 users |
| WhatsApp Flows | Structured order forms inside WhatsApp (mini web apps) | LOW | ~500+ users |

---

## MECE Mapping

This problem maps to **A1: Order Capture** in the MECE analysis (`mece-analysis.md`):

```
A1. Capture: Orders fragmented in WA + manual recording [P1, P2] — CRITICAL
```

The WA Bot transforms A1 from manual capture (copy-paste from WA → browser) to automatic capture (message → AI → order), eliminating the workflow location mismatch entirely.

---

## Cross-Reference

| Document | Relevance |
|----------|-----------|
| `research/problem/product-relevance.md` | Gap 1 identification — "Wrong Location in Workflow" |
| `research/problem/mece-analysis.md` | A1 (Order Capture) — the MECE category this problem belongs to |
| `research/problem/problems.md` | P1 (scattered orders) + P2 (manual recording) — underlying pain points |
| `research/problem/wa-integration-solutions.md` | Technical solutions research — all options evaluated |
| `research/distribution/wa-cloud-api-deep-dive.md` | Implementation reference — API, pricing, webhooks, sessions |
| `research/distribution/wa-cloud-api-interactive-messages.md` | Interactive messages reference — buttons, lists, templates |

---

*Created: 2026-02-13*
