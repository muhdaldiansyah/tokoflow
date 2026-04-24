# WhatsApp Cloud API — Deep Dive Implementation Research

> Complete technical reference for integrating WhatsApp Cloud API into CatatOrder.
> Covers setup, pricing, webhooks, interactive messages, multi-tenant architecture, and Vercel deployment.
>
> Research date: 2026-02-13

---

## Table of Contents

1. [Setup & Configuration](#1-setup--configuration)
2. [Pricing (Indonesia, 2026)](#2-pricing-indonesia-2026)
3. [Webhook Implementation (Next.js on Vercel)](#3-webhook-implementation-nextjs-on-vercel)
4. [Sending Messages via Graph API](#4-sending-messages-via-graph-api)
5. [Interactive Messages](#5-interactive-messages)
6. [Message Templates](#6-message-templates)
7. [WhatsApp Flows](#7-whatsapp-flows)
8. [Media Handling](#8-media-handling)
9. [Session Management for Serverless](#9-session-management-for-serverless)
10. [Phone Number & Coexistence](#10-phone-number--coexistence)
11. [Multi-Tenant Architecture (Tech Provider)](#11-multi-tenant-architecture-tech-provider)
12. [Security](#12-security)
13. [Rate Limits & Scaling](#13-rate-limits--scaling)
14. [Error Handling](#14-error-handling)
15. [SDK & Libraries](#15-sdk--libraries)
16. [Implementation Roadmap](#16-implementation-roadmap)
17. [Environment Variables](#17-environment-variables)
18. [Database Schema](#18-database-schema)

---

## 1. Setup & Configuration

### Prerequisites

- **Meta Business Account** at [business.facebook.com](https://business.facebook.com) (free)
- **Meta Developer Account** at [developers.facebook.com](https://developers.facebook.com) (free)
- Phone number that can receive SMS or voice call
- HTTPS webhook endpoint (CatatOrder on Vercel has this)

### Step-by-Step Setup

1. **Create Meta Developer App** — developers.facebook.com > Create App > type "Business" > link to Business Account
2. **Add WhatsApp Product** — App dashboard > Add Products > WhatsApp > Set Up
3. **Get Test Phone Number** — WhatsApp > API Setup provides a test number + 24h temporary token
4. **Add Production Phone Number** — API Setup > Add phone number > verify via SMS/call > complete business profile
5. **Configure Webhook** — WhatsApp > Configuration > set Callback URL + Verify Token > subscribe to `messages` field
6. **Business Verification** — Meta Business Manager > Settings > Business Verification > submit docs

### Graph API Version

**Current: `v24.0`** (released October 8, 2025)

| Version | Released | Deprecation |
|---------|----------|-------------|
| **v24.0** | Oct 8, 2025 | TBD (use this) |
| v23.0 | May 29, 2025 | June 9, 2026 |
| v22.0 | Jan 21, 2025 | Feb 10, 2026 (expired) |

Base URL: `https://graph.facebook.com/v24.0/`

### What Changed in 2025-2026

- **Per-message pricing** replaced conversation-based pricing (July 1, 2025)
- **Portfolio-level messaging limits** replaced per-number limits (October 2025)
- **2K and 10K tiers being removed** — verified businesses jump to 100K (Q1-Q2 2026)
- **Portfolio Pacing** introduced (Dec 2025) — Meta batch-sends campaigns, may halt on policy violations
- **BSUID** will replace phone numbers as identifier when usernames launch (June 2026+)
- **AI chatbot restrictions** — bots must perform "concrete business tasks" (order processing allowed)

---

## 2. Pricing (Indonesia, 2026)

### Per-Message Rates

| Category | IDR Rate | USD Approx. | When Charged |
|----------|----------|-------------|-------------|
| **Service** (customer-initiated reply within 24h) | **FREE** | **$0.00** | **Never — unlimited** |
| **Utility** (order confirmation, status) | Rp 367 | ~$0.023 | **Free within 24h window**; charged outside |
| **Marketing** (promos, broadcasts) | Rp 597 | ~$0.037 | Always charged |
| **Authentication** (OTP) | Rp 367 | ~$0.023 | Always charged |
| **Auth-International** | Rp 1,951 | ~$0.121 | Rare |

### 24-Hour Customer Service Window (CSW)

1. **Opens:** When customer sends ANY message to your business number
2. **Duration:** 24 hours from customer's most recent message (resets on each customer message)
3. **Free inside:** Service messages (free-form) + Utility templates
4. **Charged inside:** Marketing templates + Authentication templates
5. **After close:** Only pre-approved template messages (all charged by category)
6. **Extended (72h):** If customer came via Click-to-WhatsApp ad — ALL message types free

### Free Tier Summary

- Service conversations: **FREE, unlimited, no cap** (since November 2024)
- Utility templates within active 24h CSW: **FREE** (since July 2025)
- Cloud API platform access: **FREE** (no setup fee, no monthly fee)
- Old "1,000 free conversations" cap: **GONE** — replaced by unlimited free service

### Volume Discounts

- ~5% (Tier 2), ~10% (Tier 3), up to ~20% (Tier 4) on Utility and Authentication
- Resets monthly on 1st of calendar month
- Marketing excluded from discounts
- Each country-category pair tracked separately

### Cost Model: Typical CatatOrder User (30 orders/day)

| Message Type | Volume/Month | Rate | Monthly Cost |
|---|---|---|---|
| Customer messages IN | 900 | FREE | Rp 0 |
| Service replies within CSW | 900 | FREE | Rp 0 |
| Utility templates within CSW | 900-1,800 | FREE | Rp 0 |
| Utility templates outside CSW (reminders) | ~150 | Rp 367 | Rp 55,050 |
| Marketing (optional promos) | ~100 | Rp 597 | Rp 59,700 |

**Best case (optimized for CSW): Rp 0 - 55,050/month (~$0-3.42)**
**Moderate case: ~Rp 114,750/month (~$7.13)**
**CatatOrder's primary flow (receive order → AI parse → confirm) costs essentially $0**

### Fonnte vs Cloud API Cost Comparison

| Factor | Fonnte (Current) | WhatsApp Cloud API |
|---|---|---|
| Monthly cost | Rp 25-175K flat | $0 platform + per-template outside CSW |
| Ban risk | HIGH (unofficial) | ZERO (Meta's platform) |
| Per-message cost | Included in subscription | Service: free; Utility: Rp 367 outside CSW |
| Interactive buttons | No | Yes |
| Template approval | Not needed | Required by Meta |

---

## 3. Webhook Implementation (Next.js on Vercel)

### Webhook Verification (GET)

Meta sends a GET request with three query parameters when you register:

| Parameter | Description |
|-----------|-------------|
| `hub.mode` | Always `"subscribe"` |
| `hub.verify_token` | The verify token you set in dashboard |
| `hub.challenge` | Random string — echo back as plain text |

### Incoming Messages (POST)

Meta sends JSON payloads for every incoming message and status update.

### Complete Implementation

```typescript
// app/api/wa/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import crypto from "crypto";

const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN!;
const APP_SECRET = process.env.WA_APP_SECRET!;

// ── GET: Webhook Verification ──────────────────────────────
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    // MUST return challenge as plain text, not JSON
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ── POST: Incoming Messages & Status Updates ───────────────
export async function POST(request: NextRequest) {
  // 1. Read raw body for signature verification
  const rawBody = await request.text();

  // 2. Verify webhook signature
  const signature = request.headers.get("x-hub-signature-256");
  if (!signature || !verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);

  // 3. Return 200 immediately — Meta expects <5s response
  // 4. Process asynchronously via next/server after()
  after(async () => {
    try {
      await processWebhook(body);
    } catch (error) {
      console.error("Webhook processing error:", error);
    }
  });

  return NextResponse.json({ status: "ok" });
}

// ── Signature Verification ─────────────────────────────────
function verifySignature(rawBody: string, signatureHeader: string): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", APP_SECRET)
    .update(rawBody)
    .digest("hex");
  const receivedSignature = signatureHeader.replace("sha256=", "");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(receivedSignature, "hex")
    );
  } catch {
    return false;
  }
}

// ── Process Webhook Payload ────────────────────────────────
async function processWebhook(body: any) {
  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;

  if (value?.messages) {
    for (const message of value.messages) {
      await handleIncomingMessage(message, value.contacts?.[0], value.metadata);
    }
  }

  if (value?.statuses) {
    for (const status of value.statuses) {
      await handleStatusUpdate(status);
    }
  }
}
```

### Webhook Payload: Incoming Text Message

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WABA_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "628xxxxxxxxx",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "contacts": [{
          "profile": { "name": "Ibu Siti" },
          "wa_id": "6281234567890"
        }],
        "messages": [{
          "from": "6281234567890",
          "id": "wamid.ABGGFlCGg0cvAgo6cHbBhfK5760V",
          "timestamp": "1703069091",
          "type": "text",
          "text": { "body": "Mbak mau pesan nastar 5 toples kastengel 3" }
        }]
      },
      "field": "messages"
    }]
  }]
}
```

### Webhook Payload: Interactive Button Reply

```json
{
  "messages": [{
    "context": {
      "from": "628xxxxxxxxx",
      "id": "wamid.ORIGINAL_MSG_ID"
    },
    "from": "6281234567890",
    "id": "wamid.REPLY_MSG_ID",
    "timestamp": "1703069100",
    "type": "interactive",
    "interactive": {
      "type": "button_reply",
      "button_reply": {
        "id": "confirm_order",
        "title": "Ya, Konfirmasi"
      }
    }
  }]
}
```

### Webhook Payload: Interactive List Reply

```json
{
  "messages": [{
    "from": "6281234567890",
    "id": "wamid.LIST_REPLY_MSG_ID",
    "timestamp": "1703069200",
    "type": "interactive",
    "interactive": {
      "type": "list_reply",
      "list_reply": {
        "id": "nasi_goreng",
        "title": "Nasi Goreng Spesial",
        "description": "Rp 25.000"
      }
    }
  }]
}
```

### Webhook Payload: Status Updates

```json
{
  "statuses": [{
    "id": "wamid.MSG_ID",
    "status": "sent",         // sent | delivered | read | failed
    "timestamp": "1703069091",
    "recipient_id": "6281234567890",
    "conversation": {
      "id": "CONVERSATION_ID",
      "origin": { "type": "business_initiated" }
    },
    "pricing": {
      "billable": true,
      "pricing_model": "CBP",
      "category": "utility"
    }
  }]
}
```

### Vercel-Specific Notes

- **Timeout:** Hobby 10s, Pro 60s. Use `after()` from `next/server` to process after 200 response
- **No persistent state:** Each invocation is isolated. All state goes to Supabase
- **Idempotency:** Meta retries for up to 7 days. Deduplicate by `message.id`
- **Cold starts:** 200-500ms — fine for webhook SLA

---

## 4. Sending Messages via Graph API

### Base URL

```
POST https://graph.facebook.com/v24.0/{PHONE_NUMBER_ID}/messages
```

### Required Headers

```
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json
```

### WhatsApp Client Module

```typescript
// lib/whatsapp/client.ts

const GRAPH_API_VERSION = "v24.0";
const PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID!;
const ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN!;
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}/messages`;

async function sendMessage(payload: Record<string, unknown>) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`);
  }
  return response.json();
}

// ── Text Message ───────────────────────────────────────────
export async function sendTextMessage(to: string, body: string) {
  return sendMessage({
    to,
    type: "text",
    text: { preview_url: false, body },
  });
}

// ── Interactive Button Message (max 3 buttons) ────────────
export async function sendButtonMessage(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>,
  headerText?: string,
  footerText?: string
) {
  return sendMessage({
    to,
    type: "interactive",
    interactive: {
      type: "button",
      ...(headerText && { header: { type: "text", text: headerText } }),
      body: { text: bodyText },
      ...(footerText && { footer: { text: footerText } }),
      action: {
        buttons: buttons.map((btn) => ({
          type: "reply",
          reply: { id: btn.id, title: btn.title },
        })),
      },
    },
  });
}

// ── Interactive List Message (max 10 rows) ─────────────────
export async function sendListMessage(
  to: string,
  bodyText: string,
  buttonText: string,
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>,
  headerText?: string,
  footerText?: string
) {
  return sendMessage({
    to,
    type: "interactive",
    interactive: {
      type: "list",
      ...(headerText && { header: { type: "text", text: headerText } }),
      body: { text: bodyText },
      ...(footerText && { footer: { text: footerText } }),
      action: { button: buttonText, sections },
    },
  });
}

// ── Template Message ───────────────────────────────────────
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string,
  components?: Array<Record<string, unknown>>
) {
  return sendMessage({
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components && { components }),
    },
  });
}

// ── Reaction ───────────────────────────────────────────────
export async function sendReaction(to: string, messageId: string, emoji: string) {
  return sendMessage({
    to,
    type: "reaction",
    reaction: { message_id: messageId, emoji },
  });
}
```

---

## 5. Interactive Messages

### Reply Buttons

Max **3 buttons**. Button title max **20 characters**. Button ID max **256 characters**.

```json
{
  "messaging_product": "whatsapp",
  "to": "628123456789",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "header": { "type": "text", "text": "Konfirmasi Pesanan" },
    "body": {
      "text": "Pesanan kamu:\n- Nastar x5 (Rp125.000)\n- Kastengel x3 (Rp90.000)\n\n*Total: Rp215.000*\n\nBetul?"
    },
    "footer": { "text": "CatatOrder" },
    "action": {
      "buttons": [
        { "type": "reply", "reply": { "id": "confirm_yes", "title": "Simpan" } },
        { "type": "reply", "reply": { "id": "confirm_edit", "title": "Ubah" } },
        { "type": "reply", "reply": { "id": "confirm_cancel", "title": "Batal" } }
      ]
    }
  }
}
```

### List Messages

Max **10 sections**, max **10 rows total**. Row title max **24 chars**, description max **72 chars**.

```json
{
  "messaging_product": "whatsapp",
  "to": "628123456789",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "header": { "type": "text", "text": "Ubah Pesanan" },
    "body": { "text": "Pilih item yang mau diubah:" },
    "footer": { "text": "CatatOrder" },
    "action": {
      "button": "Lihat Item",
      "sections": [{
        "title": "Item Pesanan",
        "rows": [
          { "id": "edit_nastar", "title": "Nastar x5", "description": "Rp125.000 — ubah jumlah atau hapus" },
          { "id": "edit_kastengel", "title": "Kastengel x3", "description": "Rp90.000 — ubah jumlah atau hapus" },
          { "id": "add_item", "title": "Tambah Item", "description": "Pesan item baru" },
          { "id": "done_editing", "title": "Selesai", "description": "Konfirmasi pesanan" }
        ]
      }]
    }
  }
}
```

### Character Limits Reference

| Element | Max Length |
|---------|-----------|
| Header text | 60 chars |
| Body text | 1,024 chars |
| Footer text | 60 chars |
| Reply button title | 20 chars |
| Reply button ID | 256 chars |
| List button label | 20 chars |
| List row title | 24 chars |
| List row description | 72 chars |
| List row ID | 200 chars |
| Max reply buttons | 3 |
| Max list rows | 10 total |
| Max list sections | 10 |

---

## 6. Message Templates

### When Templates Are Required

Templates are the **only** way to initiate conversations outside the 24h customer service window. They must be pre-approved by Meta.

### Template Categories

| Category | Pricing (Indonesia) | Use Case |
|----------|-------------------|----------|
| **UTILITY** | Rp 367 (free inside CSW) | Order confirmations, status updates, payment reminders |
| **MARKETING** | Rp 597 (always charged) | Promos, re-engagement, broadcasts |
| **AUTHENTICATION** | Rp 367 (always charged) | OTP, verification |

### Creating Templates

Via Graph API:

```typescript
// POST https://graph.facebook.com/v24.0/{WABA_ID}/message_templates
{
  "name": "order_confirmation_id",
  "language": "id",
  "category": "UTILITY",
  "components": [
    {
      "type": "HEADER",
      "format": "TEXT",
      "text": "Pesanan {{1}}",
      "example": { "header_text": ["WO-20260213-0001"] }
    },
    {
      "type": "BODY",
      "text": "Halo {{1}}, pesanan kamu sudah tercatat:\n\n{{2}}\n\nTotal: Rp{{3}}\nStatus: {{4}}\n\n_Dibuat dengan CatatOrder — catatorder.id_",
      "example": {
        "body_text": [["Ibu Siti", "- Nastar x5\n- Kastengel x3", "215.000", "Baru"]]
      }
    },
    {
      "type": "BUTTONS",
      "buttons": [
        { "type": "QUICK_REPLY", "text": "Konfirmasi" },
        { "type": "QUICK_REPLY", "text": "Ubah" },
        { "type": "QUICK_REPLY", "text": "Batalkan" }
      ]
    }
  ]
}
```

### Sending Template Messages

```json
{
  "messaging_product": "whatsapp",
  "to": "628123456789",
  "type": "template",
  "template": {
    "name": "order_confirmation_id",
    "language": { "code": "id" },
    "components": [
      {
        "type": "header",
        "parameters": [{ "type": "text", "text": "WO-20260213-0042" }]
      },
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Ibu Siti" },
          { "type": "text", "text": "- Nastar x5\n- Kastengel x3" },
          { "type": "text", "text": "215.000" },
          { "type": "text", "text": "Baru" }
        ]
      },
      {
        "type": "button",
        "sub_type": "quick_reply",
        "index": "0",
        "parameters": [{ "type": "payload", "payload": "confirm_WO-20260213-0042" }]
      }
    ]
  }
}
```

### Approval

- Variables use `{{1}}`, `{{2}}` positional format; sample values required
- Max 3 QUICK_REPLY buttons, max 2 URL buttons, max 1 PHONE_NUMBER button (total max 3)
- Approval time: usually minutes to 24 hours (automated ML review), up to 48 hours
- Max 250 templates per WABA

### Suggested Templates for CatatOrder

| Template Name | Category | Purpose |
|---|---|---|
| `order_confirmation_id` | UTILITY | Confirm new order with items + total |
| `order_status_update_id` | UTILITY | Status change notification |
| `payment_reminder_id` | UTILITY | Payment reminder with remaining amount |
| `daily_recap_id` | UTILITY | Daily stats summary |
| `receipt_id` | UTILITY | Digital receipt/struk |

---

## 7. WhatsApp Flows

Multi-screen, form-based experiences inside WhatsApp — like mini web apps.

### Capabilities

- Text inputs, dropdowns, radio buttons, checkboxes, date pickers, photo pickers
- Defined via JSON with screens and components (max 50 per screen)
- Supports dynamic data exchange with backend endpoint

### Requirements

- Verified WABA with high-quality rating
- Approved display name
- Pre-approved template to launch the Flow
- Published Flows cannot be edited (must clone)

### Verdict for CatatOrder

**Not recommended for Phase 1.** Too complex. Better for Phase 3 (500+ users) when structured order entry forms become valuable. Current unstructured chat → AI parse approach is more natural for UMKM users.

---

## 8. Media Handling

### Receiving Images (Two-Step Process)

Webhook payload for image:

```json
{
  "messages": [{
    "type": "image",
    "image": {
      "id": "1234567890",
      "mime_type": "image/jpeg",
      "sha256": "abc123...",
      "caption": "Nota hari ini"
    }
  }]
}
```

**Step 1: Get media download URL** (expires in 5 minutes):

```typescript
async function getMediaUrl(mediaId: string): Promise<string> {
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}`,
    { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
  );
  const data = await response.json();
  return data.url; // expires in 5 min
}
```

**Step 2: Download media content** (requires same Bearer token):

```typescript
async function downloadMedia(mediaUrl: string): Promise<Buffer> {
  const response = await fetch(mediaUrl, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  });
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
```

**Step 3: Upload to Supabase Storage → OCR:**

```typescript
async function processReceiptImage(mediaId: string, mimeType: string): Promise<string> {
  const mediaUrl = await getMediaUrl(mediaId);
  const buffer = await downloadMedia(mediaUrl);

  const ext = mimeType === "image/png" ? "png" : "jpg";
  const filename = `wa-receipts/${Date.now()}.${ext}`;

  await supabase.storage.from("wa-media").upload(filename, buffer, { contentType: mimeType });

  const { data } = supabase.storage.from("wa-media").getPublicUrl(filename);
  return data.publicUrl;
  // Then pass to existing Gemini OCR: /api/ocr
}
```

### Key Constraints

- Media download URLs expire in **5 minutes** — download immediately
- Download URL on `lookaside.fbsbx.com` requires same Bearer token
- Must complete within Vercel function timeout (10s Hobby / 60s Pro)

### Rich Message Types

| Type | Max Size | Caption | Notes |
|------|----------|---------|-------|
| Image | 5 MB | Yes | JPEG, PNG |
| Document | 100 MB | Yes | PDF, DOCX, XLSX |
| Video | 16 MB | Yes | MP4, 3GPP |
| Audio | 16 MB | No | AAC, AMR, MP3, OGG |
| Location | — | — | lat/lng + name/address |
| Contact | — | — | vCard format |
| Reaction | — | — | Emoji on existing message |

---

## 9. Session Management for Serverless

### The Problem

Indonesian customers send orders across 3-5 messages:

```
Message 1: "Mbak mau pesen"
Message 2: "Nastar 5 toples"
Message 3: "Kastengel 3"
Message 4: "Eh tambahin putri salju 2 juga ya"
Message 5: "Kirim ke Bekasi"
```

These arrive as separate webhook calls on separate Vercel function invocations. Need to aggregate into one order.

### Option A: Supabase Table (Recommended — Zero New Infra)

```sql
CREATE TABLE wa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  messages JSONB DEFAULT '[]',
  parsed_items JSONB,
  parsed_notes TEXT,
  status TEXT DEFAULT 'collecting'
    CHECK (status IN ('collecting', 'confirming', 'confirmed', 'cancelled', 'expired')),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wa_sessions_lookup
  ON wa_sessions(user_id, customer_phone, status)
  WHERE status IN ('collecting', 'confirming');

CREATE INDEX idx_wa_sessions_expiry
  ON wa_sessions(expires_at) WHERE status = 'collecting';
```

```typescript
// lib/wa-bot/session.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getOrCreateSession(userId: string, customerPhone: string, customerName?: string) {
  // Find active session
  const { data: existing } = await supabase
    .from("wa_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("customer_phone", customerPhone)
    .in("status", ["collecting", "confirming"])
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    // Extend TTL
    await supabase
      .from("wa_sessions")
      .update({
        last_message_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
      .eq("id", existing.id);
    return existing;
  }

  // Create new session
  const { data } = await supabase
    .from("wa_sessions")
    .insert({
      user_id: userId,
      customer_phone: customerPhone,
      customer_name: customerName,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  return data;
}

export async function appendMessage(sessionId: string, message: string) {
  const { data: session } = await supabase
    .from("wa_sessions")
    .select("messages")
    .eq("id", sessionId)
    .single();

  const messages = [...(session?.messages || []), message];

  await supabase
    .from("wa_sessions")
    .update({
      messages,
      last_message_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    })
    .eq("id", sessionId);
}

export async function confirmSession(sessionId: string) {
  await supabase.from("wa_sessions").update({ status: "confirmed" }).eq("id", sessionId);
}
```

### Option B: Upstash Redis (Lower Latency)

If session reads become a bottleneck (unlikely at UMKM scale).

```typescript
// lib/wa-bot/session-redis.ts
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const SESSION_TTL = 900; // 15 minutes

function key(userId: string, phone: string) {
  return `wa:session:${userId}:${phone}`;
}

export async function getOrCreateSession(userId: string, phone: string) {
  const existing = await redis.get(key(userId, phone));
  if (existing) {
    await redis.expire(key(userId, phone), SESSION_TTL);
    return existing;
  }
  const session = { userId, customerPhone: phone, messages: [], createdAt: new Date().toISOString() };
  await redis.set(key(userId, phone), session, { ex: SESSION_TTL });
  return session;
}
```

**Recommendation: Start with Supabase** (zero new infra). Add Redis only if latency becomes an issue.

### Session State Machine

```
COLLECTING ──(3 min silence / "selesai")──→ AI Parse ──→ CONFIRMING
     ↑                                                        │
     │ (new message)                              ┌───────────┤────────────┐
     │                                            │           │            │
     └──────────────────────(UBAH)────────── "Simpan"    "Ubah"      "Batal"
                                                  │           │            │
                                                  ↓           ↓            ↓
                                             CONFIRMED   COLLECTING   CANCELLED
```

---

## 10. Phone Number & Coexistence

### Coexistence Feature (Released May 2025)

**What it is:** Run WhatsApp Business App AND Cloud API on the **same phone number** simultaneously.

**Available in Indonesia:** YES (Indonesia was among initial beta countries).

### How It Works

- Baker keeps using WA Business App for manual chats with customers
- Cloud API handles automated messages (bot replies, order confirmations, reminders)
- Messages sync between App and API
- Up to 6 months of chat history imported

### Setup Process

1. Update WA Business App to version 2.24.17+
2. Link WA Business account to a Facebook Page
3. Initiate Embedded Signup through CatatOrder's dashboard (Tech Provider flow)
4. Select Coexistence option — system generates QR code
5. Scan QR code with WA Business App
6. Chat history syncs, both platforms active

### Coexistence Limitations

| Feature | Status |
|---------|--------|
| Manual chats via App | Works |
| Automated messages via API | Works |
| Disappearing messages | Disabled |
| View-once messages | Disabled |
| Broadcast lists | Read-only |
| Groups sync | Not supported |
| Voice/video calls via API | Not supported |
| Template messages | API only (not from App) |
| Profile management | App only (not from API) |
| Blue badge (Official Business Account) | Not eligible |
| Throughput | Reduced to 20 MPS (vs 80 MPS standard) |

### Message Routing

| Scenario | Channel | Cost |
|----------|---------|------|
| Customer initiates chat | Synced to both App and API | FREE |
| Business replies via App | Within service window | FREE |
| Business replies via API (free-form, within 24h) | Within service window | FREE |
| Business sends template via API | API-initiated | Charged per category |
| Utility template within active 24h window | API | FREE |

### Phone Number Options

| Option | Best For | Pros | Cons |
|--------|----------|------|------|
| Existing number via Coexistence | Keeping customer relationships | Same number, chat history syncs | Coexistence limitations |
| New dedicated number | Clean separation | Full API features, blue badge eligible | Customers see different number |
| Virtual/SIM-less number | Testing, businesses without extra SIM | No physical SIM needed | OTP delivery may be unreliable |

---

## 11. Multi-Tenant Architecture (Tech Provider)

### The Challenge

CatatOrder is a multi-tenant SaaS. Each user (business owner) has their OWN WhatsApp number. For Cloud API integration, each user needs their own WABA connected to their number.

### Solution: CatatOrder as Meta Tech Provider

CatatOrder registers as a **Tech Provider** with Meta, then implements **Embedded Signup** so each user can connect their WA number through CatatOrder's dashboard.

### How Embedded Signup Works

1. User clicks "Hubungkan WhatsApp" in CatatOrder's Pengaturan page
2. Facebook Login popup opens (Facebook JavaScript SDK)
3. User creates or selects their Meta Business Portfolio
4. User creates their WABA (WhatsApp Business Account)
5. User enters phone number + verifies via OTP (or Coexistence QR code)
6. CatatOrder receives `phone_number_id`, `waba_id`, and auth token
7. Token is exchanged for long-lived access token (60-day expiry)
8. Credentials stored in CatatOrder's `profiles` table per user

```javascript
// Simplified Embedded Signup flow
FB.login(function(response) {
  // On success: collect phone_number_id, waba_id, token
  // Store in CatatOrder database
  // Exchange for long-lived token
}, {
  config_id: 'YOUR_CONFIG_ID',
  response_type: 'code',
  override_default_response_type: true,
});
```

### Tech Provider Registration Process

| Step | Duration |
|------|----------|
| Business Portfolio + Developer registration | 1 day |
| Meta App creation + WhatsApp product | 1 day |
| Business Verification (NIB + NPWP) | 2-5 business days |
| Video recording + App Review submission | 1-3 days |
| App Review by Meta | 1-4 weeks |
| Partner Solution approval | ~24 hours after review |
| **Total** | **2-6 weeks** |

### Requirements

- Business verification with NIB + NPWP
- Two video recordings: (1) sending message via API (2) creating message template
- Answer data handling security questions
- Request permissions: `whatsapp_business_messaging` + `whatsapp_business_management`
- Switch app from Development to Live mode

### Per-User Data to Store

```
profiles.wa_integration_type  — 'fonnte' | 'cloud_api'
profiles.waba_id              — WhatsApp Business Account ID
profiles.wa_phone_number_id   — Cloud API phone number ID
profiles.wa_access_token      — encrypted long-lived token
profiles.wa_token_expires_at  — token refresh tracking
```

### When to Register as Tech Provider

**Not now.** CatatOrder has 1 user. Register when reaching **~50-100 users** — at that scale, ban risk from Fonnte becomes unacceptable and the investment in official integration is justified.

---

## 12. Security

### Webhook Signature Verification

Meta signs every POST with `X-Hub-Signature-256` using your **Facebook App Secret** (not the WA access token).

```typescript
function verifySignature(rawBody: string, signatureHeader: string): boolean {
  const expected = crypto.createHmac("sha256", APP_SECRET).update(rawBody).digest("hex");
  const received = signatureHeader.replace("sha256=", "");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(received, "hex")
    );
  } catch {
    return false;
  }
}
```

**Critical:**
- Must use `request.text()` for raw body BEFORE JSON parsing
- Use `crypto.timingSafeEqual()` — never `===` (timing attack vulnerable)
- Secret is **Facebook App Secret** from App Dashboard > Settings > Basic

### Access Tokens

- Use **System User permanent token** (never expires, revocable)
- Create System User in Meta Business Manager > Business Settings > Users > System Users
- Assign Admin role + Full Control on App and WABA
- Generate token with `whatsapp_business_messaging` + `whatsapp_business_management` permissions
- Store as environment variable (Vercel encrypted at rest)

### Token for Multi-Tenant (Embedded Signup)

- Each user gets their own access token via Embedded Signup
- Exchange auth code for long-lived token (60-day expiry)
- Must refresh before expiry using `GET /oauth/access_token`
- Store encrypted in database per user

---

## 13. Rate Limits & Scaling

### Messaging Limits (Unique Recipients/24h)

| Tier | Limit | How to Reach |
|------|-------|-------------|
| Unverified | 250 | Default |
| Verified | 100,000 | After business verification (2K/10K tiers being removed Q1-Q2 2026) |
| Unlimited | No limit | Sustained high quality + high volume |

**2026 change:** Limits are now **portfolio-level** (shared across all numbers in one Business Manager).

### Throughput (Messages Per Second)

| Level | MPS | Condition |
|-------|-----|-----------|
| Standard | 80 | Default Cloud API |
| Coexistence | 20 | When using Coexistence |
| High | 1,000 | Automatic at unlimited tier + green quality + 100K msg/24h |

### Quality Rating

| Rating | Impact |
|--------|--------|
| Green (High) | Eligible for tier upgrades |
| Yellow (Medium) | Maintain current tier |
| Red (Low) | Cannot move up (but no longer causes downgrades since Oct 2025) |

### Auto-Upgrade Criteria

- Maintain high quality rating
- Initiate conversations with at least **half your current limit** in unique customers in past 7 days
- Upgrade happens within **6 hours** (previously 24h)

---

## 14. Error Handling

### Common Error Codes

| Code | Title | Action |
|------|-------|--------|
| 0 | AuthException | Refresh token, check permissions |
| 2 | API Service | Retry with backoff |
| 4 | Too Many Calls | Back off, respect Retry-After |
| 100 | Invalid Parameter | Fix request payload |
| 131026 | Undeliverable | Log, notify, don't retry |
| 131047 | Re-engagement | >24h window — need template |
| 131048 | Spam rate limit | Reduce volume |
| 131051 | Invalid recipient | Phone not on WhatsApp |
| 131056 | Pair rate limit | Wait 10-30s, retry |
| 132000 | Template param mismatch | Fix template variables |

### Retry Pattern

```typescript
async function sendWithRetry(payload: object, maxRetries = 3): Promise<any> {
  const NON_RETRYABLE = [100, 131005, 131026, 131047, 131051, 132000, 133010];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    });

    if (response.ok) return response.json();

    const error = await response.json();
    const code = error.error?.code;

    if (NON_RETRYABLE.includes(code)) throw new Error(`Non-retryable: ${code}`);

    if (attempt < maxRetries) {
      const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 10000) + Math.random() * 500;
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw new Error("Max retries exceeded");
}
```

### Meta Webhook Retry Behavior

- Non-200 response = failed delivery
- Must respond within **5 seconds**
- Retries with exponential backoff for up to **7 days**
- After 7 days of failure, Meta may **disable your webhook**
- Always deduplicate by `message.id`

---

## 15. SDK & Libraries

### Official Meta SDK: ARCHIVED — Do Not Use

`whatsapp` on npm — v0.0.5-Alpha, archived June 2023, targets old Graph API v16.0.

### Recommended: Direct Graph API (No Library)

The API is simple REST + JSON. A thin typed wrapper (see Section 4) is cleaner than any library for serverless.

### If You Want a Library

| Library | Version | Maintained | Notes |
|---------|---------|-----------|-------|
| `@great-detail/whatsapp` | 8.4.0 | Yes (Feb 2026) | Fork of official SDK, ESM, no Express dep |
| `whatsapp-business` | 1.14.3 | Yes (Jan 2026) | 164 stars, Axios-based |
| `@kapso/whatsapp-cloud-api` | 0.1.1 | Newer | Zod-validated, includes verifySignature() |

**Recommendation: Direct API calls.** Libraries add complexity without much benefit in serverless.

---

## 16. Implementation Roadmap

### Phase 1: Single-Number Bot (Now — 3-5 days)

Build the bot using CatatOrder's own phone number for testing.

| Day | Task |
|-----|------|
| 1 | Create Meta Developer App, add WhatsApp product, get test number |
| 1 | Implement webhook endpoint (`GET` verify + `POST` receive) |
| 2 | Build session manager (Supabase `wa_sessions` table) |
| 2 | Wire Gemini AI parsing (reuse `/api/parse-order` logic) |
| 3 | Build order confirmation flow with interactive buttons |
| 3 | Auto-create orders in Supabase on confirmation |
| 4 | Handle edit flow, cancellation, edge cases |
| 5 | Add production phone number, test end-to-end |

### Phase 2: Replace Fonnte for Outbound (~50-100 users)

Replace Fonnte with Cloud API template messages for payment reminders, daily recaps.

| Task | Effort |
|------|--------|
| Create + submit 5 Indonesian templates for approval | 1 day |
| Migrate `lib/fonnte/client.ts` message builders to Cloud API | 2 days |
| Update DailyRecap, reminders to use Cloud API | 1 day |
| Feature flag: `wa_integration_type` in profiles | 1 day |

### Phase 3: Tech Provider + Embedded Signup (~50-100 users)

Register as Meta Tech Provider so each CatatOrder user can connect their own number.

| Task | Duration |
|------|----------|
| Meta Business Verification | 2-5 days |
| App Review (videos + submission) | 1-4 weeks |
| Implement Embedded Signup in Pengaturan | 3-5 days |
| Per-user token storage + refresh | 2 days |
| Coexistence QR code flow | 1 day |

### Phase 4: WhatsApp Flows (~500+ users)

Add structured order forms via WhatsApp Flows for power users.

---

## 17. Environment Variables

```bash
# WhatsApp Cloud API
WA_PHONE_NUMBER_ID=your_phone_number_id
WA_ACCESS_TOKEN=your_system_user_permanent_token
WA_APP_SECRET=your_facebook_app_secret          # For webhook signature verification
WA_VERIFY_TOKEN=your_chosen_verify_string        # For webhook registration
WA_WABA_ID=your_whatsapp_business_account_id

# Existing (keep)
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENROUTER_API_KEY=...
FONNTE_TOKEN=...                                 # Keep for hybrid period
```

---

## 18. Database Schema

### New Tables

```sql
-- ── wa_connections: Links WA number → CatatOrder user ──────
CREATE TABLE wa_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('fonnte', 'cloud_api')),
  phone_number TEXT NOT NULL,
  fonnte_device TEXT,
  waba_id TEXT,
  phone_number_id TEXT,
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── wa_sessions: Multi-message order aggregation ───────────
CREATE TABLE wa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  messages JSONB DEFAULT '[]',
  parsed_items JSONB,
  parsed_notes TEXT,
  status TEXT DEFAULT 'collecting'
    CHECK (status IN ('collecting', 'confirming', 'confirmed', 'cancelled', 'expired')),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── wa_messages: Message deduplication + audit log ─────────
CREATE TABLE wa_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL UNIQUE,  -- WhatsApp message ID (wamid.xxx)
  session_id UUID REFERENCES wa_sessions(id),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_phone TEXT,
  to_phone TEXT,
  message_type TEXT,                -- text, image, interactive, template
  content JSONB,
  status TEXT,                      -- sent, delivered, read, failed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────
CREATE INDEX idx_wa_connections_user ON wa_connections(user_id) WHERE is_active = true;
CREATE INDEX idx_wa_sessions_lookup ON wa_sessions(user_id, customer_phone, status);
CREATE INDEX idx_wa_sessions_expiry ON wa_sessions(expires_at) WHERE status = 'collecting';
CREATE INDEX idx_wa_messages_dedup ON wa_messages(message_id);
CREATE INDEX idx_wa_messages_session ON wa_messages(session_id);

-- ── RLS ────────────────────────────────────────────────────
ALTER TABLE wa_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own connections" ON wa_connections FOR ALL USING (user_id = auth.uid());
-- Sessions + messages accessed by service role (webhooks have no auth context)
CREATE POLICY "Service role sessions" ON wa_sessions FOR ALL USING (true);
CREATE POLICY "Service role messages" ON wa_messages FOR ALL USING (true);

-- ── Triggers ───────────────────────────────────────────────
CREATE TRIGGER update_wa_connections_updated_at BEFORE UPDATE ON wa_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_wa_sessions_updated_at BEFORE UPDATE ON wa_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Sources

### Setup & Configuration
- [WhatsApp Business Developer Hub](https://business.whatsapp.com/developers/developer-hub)
- [WhatsApp Cloud API Setup Guide — Anjok Technologies](https://anjoktechnologies.in/blog/how-to-set-up-whatsapp-cloud-api-step-by-step-in-meta-developer-business-manager)
- [WhatsApp Cloud API Permanent Access Token — Anjok Technologies](https://anjoktechnologies.in/blog/-whatsapp-cloud-api-permanent-access-token-step-by-step-system-user-2026-complete-correct-guide-by-anjok-technologies)
- [Graph API Release Notes — Releasebot](https://releasebot.io/updates/meta/graph-api)

### Pricing
- [WhatsApp Business Platform Pricing — Official](https://business.whatsapp.com/products/platform-pricing)
- [WhatsApp API Pricing Update July 2025 — YCloud](https://www.ycloud.com/blog/whatsapp-api-pricing-update)
- [WhatsApp Business API Pricing 2026 — Flowcall](https://flowcall.co/blog/whatsapp-business-api-pricing-2026)
- [WhatsApp API Pricing 2026 — respond.io](https://respond.io/blog/whatsapp-business-api-pricing)
- [WhatsApp API Pricing Indonesia — Barantum](https://www.barantum.com/blog/whatsapp-api-pricing/)

### Implementation
- [WhatsApp Webhooks Implementation — Meta](https://business.whatsapp.com/blog/how-to-use-webhooks-from-whatsapp-business-api)
- [WhatsApp Cloud API Integration Guide 2026 — Connverz](https://www.connverz.com/blog/whatsapp-cloud-api-integration-guide-for-developers-in-2026)
- [nextjs-whatsapp-cloud-api — GitHub](https://github.com/williamneves/nextjs-whatsapp-cloud-api)
- [SHA256 Webhook Signature Verification — Hookdeck](https://hookdeck.com/webhooks/guides/how-to-implement-sha256-webhook-signature-verification)

### Interactive Messages & Templates
- [WhatsApp Interactive Messages — Vonage](https://developer.vonage.com/en/messages/guides/whatsapp-interactive-messages)
- [WhatsApp Flows Complete Guide — Sanoflow](https://sanoflow.io/en/collection/whatsapp-business-api/whatsapp-flows-complete-guide/)
- [WhatsApp Template Management — Meta](https://business.whatsapp.com/blog/manage-message-templates-whatsapp-business-api)
- [WhatsApp Character Limits — Picky Assist](https://help.pickyassist.com/general-guidelines/character-limits-whatsapp)

### Coexistence & Multi-Tenant
- [WhatsApp Coexistence Guide — Wetarseel](https://wetarseel.ai/whatsapp-coexistence-whatsapp-business-app-api-together/)
- [WhatsApp Coexistence — Sanuker](https://sanuker.com/whatsapp-coexistence-business-api/)
- [WhatsApp Coexistence — Bytepaper](https://bytepaper.com/whatsapp-coexistence-2025-connect-your-app-and-api-without-changing-numbers/)
- [Becoming a Meta Tech Provider — 360Dialog](https://docs.360dialog.com/partner/get-started/tech-provider-program/becoming-a-meta-tech-provider-a-step-by-step-guide)
- [Tech Provider Program — Twilio](https://www.twilio.com/docs/whatsapp/isv/tech-provider-program/integration-guide)

### Rate Limits & Scaling
- [WhatsApp API 2026 Updates — Woztell](https://woztell.com/whatsapp-api-2026-updates-pacing-limits-usernames/)
- [WhatsApp API Rate Limits — Wati](https://www.wati.io/en/blog/whatsapp-business-api/whatsapp-api-rate-limits/)
- [Scale WhatsApp Cloud API — WuSeller](https://www.wuseller.com/whatsapp-business-knowledge-hub/scale-whatsapp-cloud-api-master-throughput-limits-upgrades-2026/)

### SDKs
- [@great-detail/whatsapp — npm](https://www.npmjs.com/package/@great-detail/whatsapp)
- [whatsapp-business SDK — GitHub](https://github.com/MarcosNicolau/whatsapp-business-sdk)
- [Official Meta WhatsApp Node.js SDK (Archived) — GitHub](https://github.com/WhatsApp/WhatsApp-Nodejs-SDK)

### Error Handling
- [WhatsApp Error Codes Guide — Heltar](https://www.heltar.com/blogs/all-meta-error-codes-explained-along-with-complete-troubleshooting-guide-2025-cm69x5e0k000710xtwup66500)
- [WhatsApp Webhook Silent Failures — Medium](https://medium.com/@siri.prasad/the-shadow-delivery-mystery-why-your-whatsapp-cloud-api-webhooks-silently-fail-and-how-to-fix-2c7383fec59f)

---

*Last updated: 2026-02-13*
