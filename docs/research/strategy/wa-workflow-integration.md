# Solving the "Wrong Location in Workflow" Problem

> CatatOrder lives in the browser. The baker's orders live in WhatsApp. How do we bridge this gap?

*Research date: 2026-02-13*
*Updated: 2026-02-13 — Deep dive with Fonnte webhook details, Cloud API pricing, implementation sketches*

---

## The Core Problem

The honest gap analysis scored CatatOrder's **UX fit at 5/10** for home bakers. The root cause:

```
Baker's actual workflow:
  WA chat → read order → reply customer → next chat → repeat 200x

CatatOrder's expected workflow:
  WA chat → copy text → open browser → paste → save → go back to WA

The app-switch tax kills adoption during peak season.
```

During Lebaran, a baker handling 200+ WA chats won't context-switch to a browser app for each order. The cognitive overhead is too high when the pain is most acute — which is exactly when we need them to adopt.

This is **Gap 1 (workflow friction)** and **Gap 3 (order intake)** from the assessment. They're the same root issue: CatatOrder is in the wrong location.

---

## 3 Architectures Compared

### Architecture A: Fonnte Inbound Bot (FASTEST — 3-5 days)

Use Fonnte's existing webhook to receive incoming customer messages, pipe through Gemini 3 Flash for AI parsing, auto-create orders.

```
Customer WA msg → Fonnte → POST catatorder.id/api/wa/incoming
                                    ↓
                            Session Manager (in-memory/Supabase)
                                    ↓ (3-5 min aggregation)
                            Gemini 3 Flash AI Parse
                                    ↓
                            Confirmation msg → Fonnte → Customer
                                    ↓ (customer replies YA)
                            Supabase INSERT → Order created
                                    ↓
                            Confirmation + order number → Customer
```

| Attribute | Detail |
|-----------|--------|
| **Build time** | 3-5 days |
| **Cost/user** | Rp 66-175K/month (Fonnte plan) |
| **Ban risk** | Medium (Fonnte uses unofficial WA Web) |
| **Confirmation** | Text-based ("reply YA") |
| **Existing code reuse** | High — Fonnte client + Gemini parse already exist |

**Why fastest:** CatatOrder already has Fonnte integrated for outbound (`lib/fonnte/client.ts`) and Gemini for AI text parsing (`lib/ai/ocr.ts`). This is mostly wiring existing pieces together.

---

### Architecture B: WhatsApp Cloud API Bot (BEST LONG-TERM — 2-3 weeks)

Official Meta API. Zero ban risk. Interactive buttons (tap to confirm, not type "YA"). Free for inbound service messages.

```
Customer WA msg → Meta Cloud API → POST catatorder.id/api/wa/webhook
                                           ↓
                                    Same session + AI logic
                                           ↓
                                    Interactive buttons → Customer
                                    [✅ Simpan] [✏️ Ubah] [❌ Batal]
                                           ↓ (tap ✅)
                                    Order saved
```

| Attribute | Detail |
|-----------|--------|
| **Build time** | 2-3 weeks (including Meta verification wait) |
| **Cost/user** | Rp 10-50K/month (mostly free inbound) |
| **Ban risk** | Zero |
| **Confirmation** | Interactive buttons (tap, not type) |
| **Blocker** | Meta Business Verification needs NIB/NPWP (2-7 days) |

---

### Architecture C: Hybrid — Fonnte Now, Cloud API Later (RECOMMENDED)

Ship Fonnte bot in 3-5 days. Start Meta verification in parallel. Migrate to Cloud API once verified.

| Phase | Timeline | What |
|-------|----------|------|
| 1 | Days 1-5 | Fonnte inbound bot MVP |
| 2 | Days 5-14 | Meta verification (parallel) |
| 3 | Days 14-21 | Cloud API integration with interactive buttons |

---

## Cost Comparison

| | Fonnte Bot (A) | Cloud API Bot (B) | Hybrid (C) |
|---|---|---|---|
| **Build time** | 3-5 days | 2-3 weeks | 3-5 days to ship, 3 weeks total |
| **Cost/user/month** | Rp 66-175K (Fonnte plan) | Rp 10-50K (Meta charges) | Rp 66-175K then Rp 10-50K |
| **Ban risk** | Medium | Zero | Medium then Zero |
| **Rich messages** | Text only | Buttons, lists, flows | Text then buttons |
| **User setup** | Scan QR code (Fonnte) | Meta verification + dedicated number | QR code then upgrade |
| **Reliability** | Good (WA Web) | Enterprise (Meta-hosted) | Good then Enterprise |
| **Interactive confirm** | Type "YA" | Tap button | Type then tap |

---

## WhatsApp Cloud API — Detailed Pricing (Indonesia, 2026)

Since July 1, 2025, WhatsApp uses **per-message pricing** (replacing old conversation-based model):

| Message Type | Cost (Indonesia) | When Charged |
|---|---|---|
| **Service** (free-form replies within 24h window) | **FREE** | Never — unlimited |
| **Utility** (order confirmations, shipping updates) | **~Rp 357/message** | Only outside 24h window |
| **Marketing** (promotions, re-engagement) | **~Rp 764/message** | Always |
| **Authentication** (OTP) | **~Rp 357/message** | Always |

**Critical insight for CatatOrder:** Since the core use case is **inbound** (customer messages first, business replies), **virtually all messages would be FREE**. The 24-hour window resets every time the customer sends a new message.

**Cost estimate for a typical user (30 orders/day):**
- Inbound parsing + reply: FREE (service messages in 24h window)
- 5 payment reminders/day outside window: 5 x Rp 357 = Rp 1,785/day
- 1 daily recap: Rp 357/day
- **Monthly total: ~Rp 64,000 ($4)** for paid portions only

### Rate Limits

- New WABA: 250 messages/24h (business-initiated)
- After quality rating: 1,000 → 10,000 → 100,000/24h
- Customer-initiated (service) messages: **no rate limit**

### Setup Requirements

1. **Meta Business Account** — create at business.facebook.com
2. **Meta Business Verification** — NIB + NPWP + website with matching domain email (2-7 days)
3. **WhatsApp Business Account (WABA)** — created within Meta Business Suite
4. **Phone Number** — dedicated number not currently on WA personal/business
5. **Webhook Endpoint** — HTTPS URL for incoming message notifications
6. **App on Meta Developer Platform** — Facebook App with WhatsApp product enabled

CatatOrder already has domain (catatorder.id) and email (hello@catatorder.id) — meets website/email requirement.

---

## Fonnte Inbound — Technical Details

### Can Fonnte Receive Incoming Messages?

**Yes.** Fonnte supports webhook-based incoming message handling.

### Setup

1. In Fonnte dashboard → Device → Edit
2. Set **webhook URL** to `https://catatorder.id/api/wa/incoming`
3. Enable **autoread** (required for webhook to fire)
4. **Important:** Enabling webhook **disables** Fonnte's built-in autoreply. Your webhook handles ALL responses.

### Webhook Data Fields

Fonnte sends POST with these fields:

| Field | Description |
|---|---|
| `device` | Device ID that received the message |
| `sender` | Phone number of sender (e.g., `6281234567890`) |
| `message` | Message text content |
| `name` | Contact name (if available) |
| `text` | Button text (if applicable) |
| `member` | Group member (for group chats) |
| `url` | Attachment URL (Super+ plans only) |
| `filename` | Attachment filename (Super+ plans) |

### Fonnte Pricing

| Plan | Price/month | Message Quota | Webhook | Attachments |
|---|---|---|---|---|
| Free | Rp 0 | 1,000 | Yes | No |
| Lite | Rp 25,000 | Limited | Yes | No |
| Regular | Rp 66,000 | 10,000 | Yes | No |
| Regular Pro | Rp 110,000 | 25,000 | Yes | No |
| Master | Rp 175,000 | Unlimited | Yes | No |
| Super | ~Rp 250,000+ | 10,000 | Yes | **Yes** |

**For CatatOrder:** Regular (Rp 66K/month) handles ~30 orders/day user. Regular Pro (Rp 110K) for more headroom.

### Key Limitation

Fonnte uses WhatsApp Web protocol (unofficial). Meta periodically updates anti-automation detection. Accounts can get banned. GitHub issues for Baileys (underlying library) show increasing ban reports in 2025-2026.

---

## Multi-Message Order Handling

Indonesian customers send orders across 3-5 messages:

```
Message 1: "Mbak mau pesen"
Message 2: "Nastar 5 toples"
Message 3: "Kastengel 3"
Message 4: "Eh tambahin putri salju 2 juga ya"
Message 5: "Kirim ke Bekasi"
```

### Session-Based Aggregation

```typescript
interface OrderSession {
  userId: string;        // CatatOrder user (business owner)
  customerPhone: string; // Customer's WA number
  messages: string[];    // Accumulated messages
  lastMessageAt: Date;
  status: 'collecting' | 'confirming' | 'confirmed';
  parsedOrder?: ParsedOrder;
}

// Session timeout: 3-5 minutes of silence = auto-parse and confirm
// New message within window = append to session, reset timer
```

### State Machine

1. First message from new customer / no active session → Create session, start 3-min timer
2. Subsequent messages within 3 min → Append to session, reset timer
3. Timer expires or customer sends "selesai"/"udah" → AI parses all accumulated messages, sends confirmation
4. Customer replies "YA" → Save order to Supabase
5. Customer replies "UBAH" → Re-enter collection mode
6. Customer replies "BATAL" → Delete session

### Error Handling When AI Misparses

```typescript
// After sending confirmation, if customer says "UBAH" or sends corrections:
// "Bukan kastengel 3, tapi 4"

// Re-parse with correction context:
const correctedParse = await extractItemsFromText(
  `Pesanan awal: ${originalMessages.join('\n')}
   Koreksi: ${correctionMessage}`
);
```

---

## Conversational Flow

```
CUSTOMER: "Mbak nastar 5 kastengel 3 eh kastengel 4 deh kirim ke rumah
           tante yg di Bekasi ya tapi jangan Senin soalnya ga ada orang"

BOT (AI parse → confirmation):
"Pesanan baru dari Kak [name]:
• Nastar x5
• Kastengel x4
Catatan: Kirim ke Bekasi, jangan hari Senin

Betul? Balas:
✅ YA - simpan pesanan
✏️ UBAH - perbaiki pesanan
❌ BATAL - batalkan"

CUSTOMER: "YA"

BOT: "Pesanan WO-20260213-0042 tersimpan! ✅
Total: [calculated if prices known]
Status: Baru

_Dibuat dengan CatatOrder — catatorder.id_"
```

---

## Implementation Sketch — Fonnte Inbound Bot

### New Files Needed

| File | Purpose |
|------|---------|
| `app/api/wa/incoming/route.ts` | Fonnte webhook endpoint |
| `lib/wa-bot/session.ts` | Multi-message session manager |
| `lib/wa-bot/handler.ts` | Parse + confirm + save flow |
| Migration: `wa_connections` table | Links Fonnte device → CatatOrder user |
| Migration: `wa_sessions` table | Stores active order sessions |

### Webhook Endpoint Sketch

```typescript
// app/api/wa/incoming/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extractItemsFromText } from '@/lib/ai/ocr';
import { sendWhatsAppMessage } from '@/lib/fonnte/client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// In-memory sessions (use Supabase table or Vercel KV for production)
const sessions = new Map<string, {
  userId: string;
  customerPhone: string;
  customerName: string;
  messages: string[];
  lastMessageAt: number;
  timer: NodeJS.Timeout;
  status: 'collecting' | 'confirming';
  parsedItems?: any[];
}>();

export async function POST(request: NextRequest) {
  const body = await request.formData(); // Fonnte sends form data
  const sender = body.get('sender') as string;
  const message = body.get('message') as string;
  const device = body.get('device') as string;
  const name = body.get('name') as string;

  if (!sender || !message) {
    return NextResponse.json({ status: 'ignored' });
  }

  // Look up which CatatOrder user owns this device
  const { data: connection } = await supabase
    .from('wa_connections')
    .select('user_id')
    .eq('fonnte_device', device)
    .single();

  if (!connection) return NextResponse.json({ status: 'no_connection' });

  const sessionKey = `${connection.user_id}:${sender}`;
  const existing = sessions.get(sessionKey);

  // Handle confirmation responses
  if (existing?.status === 'confirming') {
    const normalized = message.trim().toUpperCase();
    if (normalized === 'YA' || normalized === 'Y' || normalized === 'OK') {
      await saveOrder(existing, connection.user_id);
      sessions.delete(sessionKey);
      return NextResponse.json({ status: 'saved' });
    } else if (normalized === 'BATAL' || normalized === 'TIDAK') {
      sessions.delete(sessionKey);
      await sendWhatsAppMessage(sender, 'Pesanan dibatalkan.');
      return NextResponse.json({ status: 'cancelled' });
    }
  }

  // Append to or create session
  if (existing) {
    clearTimeout(existing.timer);
    existing.messages.push(message);
    existing.lastMessageAt = Date.now();
  } else {
    sessions.set(sessionKey, {
      userId: connection.user_id,
      customerPhone: sender,
      customerName: name || sender,
      messages: [message],
      lastMessageAt: Date.now(),
      timer: null as any,
      status: 'collecting',
    });
  }

  const session = sessions.get(sessionKey)!;

  // Set 3-minute timeout for parsing
  session.timer = setTimeout(async () => {
    await parseAndConfirm(sessionKey);
  }, 3 * 60 * 1000);

  return NextResponse.json({ status: 'collecting' });
}
```

### AI Prompt Enhancement for Bot Context

The existing `extractItemsFromText()` should be enhanced for the bot:

```typescript
export async function extractOrderFromChat(messages: string[]): Promise<BotParseResult> {
  // ... existing OpenRouter/Gemini setup ...
  const prompt = `Ekstrak pesanan dari rangkaian chat WhatsApp berikut.

Kembalikan dalam format JSON:
{
  "items": [{ "name": "Nama Item", "price": 25000, "qty": 1 }],
  "customer_name": "Nama Pelanggan",
  "delivery_address": "Alamat pengiriman",
  "delivery_date": "2026-02-15",
  "notes": "Catatan khusus",
  "confidence": 0.95
}

Aturan:
- Jika harga TIDAK disebutkan, set price: 0 dan confidence rendah
- "25rb", "25k" = 25000; "@25rb" = harga satuan 25000
- "2x", "x2", "2 pcs", "2 toples" = qty 2
- Gabungkan semua pesan menjadi satu konteks pesanan
- confidence: 0.0-1.0, rendah jika banyak ambiguitas
- Jika pesan hanya sapaan tanpa pesanan, kembalikan items: []

Chat WhatsApp (urut waktu):
${messages.map((m, i) => `[${i + 1}] ${m}`).join('\n')}`;
}
```

---

## WhatsApp Cloud API — Interactive Buttons

```typescript
// Replace "reply YA" with tappable buttons
await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messaging_product: 'whatsapp',
    to: customerPhone,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: `Pesanan kamu:\n${itemsText}\n\nTotal: Rp${total.toLocaleString('id-ID')}`
      },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'confirm_yes', title: 'Simpan' } },
          { type: 'reply', reply: { id: 'confirm_edit', title: 'Ubah' } },
          { type: 'reply', reply: { id: 'confirm_cancel', title: 'Batal' } },
        ]
      }
    }
  }),
});
```

---

## Cloud API Webhook Payload

Meta sends incoming messages as:

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
          "phone_number_id": "PHONE_ID"
        },
        "contacts": [{
          "profile": { "name": "Ibu Siti" },
          "wa_id": "6281234567890"
        }],
        "messages": [{
          "from": "6281234567890",
          "id": "wamid.xxx",
          "timestamp": "1234567890",
          "text": { "body": "Mbak nastar 5 kastengel 3" },
          "type": "text"
        }]
      },
      "field": "messages"
    }]
  }]
}
```

---

## Database Changes (All Architectures)

```sql
-- wa_bot.sql

-- Store WA connections (Fonnte or Cloud API)
CREATE TABLE wa_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('fonnte', 'cloud_api')),
  phone_number TEXT NOT NULL,
  fonnte_device TEXT,              -- Fonnte device ID
  waba_id TEXT,                    -- WhatsApp Business Account ID (Cloud API)
  phone_number_id TEXT,            -- Cloud API phone number ID
  access_token TEXT,               -- Encrypted Cloud API token
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store bot sessions for multi-message aggregation
CREATE TABLE wa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  messages JSONB DEFAULT '[]',
  parsed_items JSONB,
  parsed_notes TEXT,
  status TEXT DEFAULT 'collecting'
    CHECK (status IN ('collecting', 'confirming', 'confirmed', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wa_sessions_lookup
  ON wa_sessions(user_id, customer_phone, status);
CREATE INDEX idx_wa_sessions_expiry
  ON wa_sessions(expires_at) WHERE status = 'collecting';

-- RLS
ALTER TABLE wa_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own connections" ON wa_connections
  FOR ALL USING (user_id = auth.uid());

-- Sessions accessed by service role only (webhook has no auth context)
CREATE POLICY "Service role full access on sessions" ON wa_sessions
  FOR ALL USING (true);

-- Triggers
CREATE TRIGGER update_wa_connections_updated_at
  BEFORE UPDATE ON wa_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_wa_sessions_updated_at
  BEFORE UPDATE ON wa_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Alternative Approaches — Evaluated and Rejected

### PWA Share Target

Register CatatOrder as PWA with `share_target` in manifest. User selects WA chat → Share → CatatOrder → auto-parse.

**Verdict:** Useful **complement** to the bot, not a replacement. Still 3-4 taps. Good for batch-importing old chats. Effort: 1-2 days.

### WhatsApp Flows (Meta)

Meta's interactive forms inside WA chat. Structured, multi-step forms — customer selects from catalog, enters quantities.

**Verdict:** Excellent for the **confirmation step** after AI parsing. But requires official WA Business API. Not suitable for unstructured "messy WA chat" — structured-first. Build as Phase 3 enhancement.

### Baileys / whatsapp-web.js (Direct WA Web Automation)

**Verdict: DO NOT USE.** High ban risk, ToS violation, supply chain attacks (malicious npm forks). Fonnte abstracts this risk somewhat.

### Telegram Bot

**Verdict: Not viable.** Only 4% of Indonesian internet users use Telegram vs 88.7% WhatsApp.

### Android Notification Listener

**Verdict: Too invasive.** Scary permissions, Play Store policy issues, Android-only.

### Chrome Extension (Woowa CRM Pattern)

**Verdict: Wrong platform.** Target users don't use desktop WA Web. Woowa CRM already dominates this niche at Rp179K/month.

### Keyboard Overlay (Selly Pattern)

**Verdict: Dead pattern.** Selly shut down August 2025. Market proved the form factor doesn't work.

---

## Case Studies

### Indonesian WA Commerce Ecosystem

| Player | What | Pricing | Relevance |
|--------|------|---------|-----------|
| **Qiscus** | Official WA BSP, omnichannel + chatbot | ~Rp 500K+/month | Too expensive for UMKM |
| **Kata.ai** | AI chatbot platform, WA partner | ~Rp 2-5M/month | Enterprise only |
| **Mekari Qontak** | Official WA BSP + CRM | ~Rp 200K-1M/month | Mid-market |
| **Dazo.id** | AI chatbot for UMKM WA orders | 14-day trial, pricing unclear | Direct competitor |

### Open Source References

1. **[whatsapp-chatgpt-bot-restaurant](https://github.com/wassengerhq/whatsapp-chatgpt-bot-restaurant)** — Wassenger + ChatGPT. Auto webhook, AI conversation.
2. **[n8n Restaurant Order System](https://n8n.io/workflows/7298-restaurant-order-and-delivery-system-for-whatsapp-with-gpt-4o-and-supabase/)** — WA Business API + GPT-4 + Supabase. Most relevant reference for CatatOrder.
3. **[WhatsFood](https://github.com/cshubhamrao/WhatsFood)** — WA chatbot for group food ordering.

### KFC India Case Study

WA ordering bot: 115,000 orders in first 6 months. 30% lower bounce vs website. 18% higher repeat orders. Proves WA-native ordering >> web-based.

---

## Recommendation: Action Plan

### Immediate (This Week)

1. Build Fonnte inbound webhook (Architecture A) — 3-5 days
2. Add "Hubungkan WhatsApp Bot" to Pengaturan page
3. Upgrade Fonnte plan to Regular (Rp 66K/month) for test user

### Next 2 Weeks (Parallel)

1. Register Meta Business Account
2. Submit NIB/NPWP for Meta Business Verification
3. Polish Fonnte bot (multi-message handling, edge cases)

### Week 3-4

1. Once Meta-verified, build Cloud API integration (Architecture B)
2. Add interactive button confirmations
3. Offer migration path from Fonnte → official API

---

## The Key Insight

The home baker during Ramadan chaos will never leave WhatsApp to open a browser. By meeting her inside WhatsApp with an AI-powered bot that understands messy Indonesian text, CatatOrder transforms from "another app to check" into an invisible backend that just works.

The existing AI parsing (`extractItemsFromText`) and Fonnte integration already provide 80% of the building blocks. The remaining 20% is the inbound webhook, session management, and confirmation flow.

**Before:** Customer WA → baker reads → opens browser → pastes → saves → goes back to WA → types reply
**After:** Customer WA → bot auto-parses → sends confirmation → customer taps YA → done. Baker checks dashboard for recap.

---

## Sources

- [WhatsApp API Pricing Update (July 2025)](https://www.ycloud.com/blog/whatsapp-api-pricing-update)
- [WhatsApp API Pricing 2026 — respond.io](https://respond.io/blog/whatsapp-business-api-pricing)
- [WhatsApp Business API Pricing 2026 Country Rates](https://flowcall.co/blog/whatsapp-business-api-pricing-2026)
- [WhatsApp Business Platform Pricing — Official](https://business.whatsapp.com/products/platform-pricing)
- [Fonnte Documentation — Webhook Reply Message](https://docs.fonnte.com/webhook-reply-message/)
- [Fonnte Documentation — English](https://docs.fonnte.com/language/en/)
- [Fonnte Official Site](https://fonnte.com/)
- [Fonnte Pricing Overview — Skrol.id](https://skrol.id/whatsapp-api-non-official/fonnte)
- [WhatsApp Flows Complete Guide](https://sanoflow.io/en/collection/whatsapp-business-api/whatsapp-flows-complete-guide/)
- [WhatsApp Flows 101 — Official](https://business.whatsapp.com/blog/whatsapp-flows-101)
- [Baileys Ban Issues — GitHub](https://github.com/WhiskeySockets/Baileys/issues/1869)
- [WhatsApp Node.js SDK — Receiving Messages](https://whatsapp.github.io/WhatsApp-Nodejs-SDK/receivingMessages/)
- [Official WhatsApp Node.js SDK — GitHub](https://github.com/WhatsApp/WhatsApp-Nodejs-SDK)
- [n8n Restaurant Order System for WhatsApp + Supabase](https://n8n.io/workflows/7298-restaurant-order-and-delivery-system-for-whatsapp-with-gpt-4o-and-supabase/)
- [WhatsApp ChatGPT Bot Restaurant — GitHub](https://github.com/wassengerhq/whatsapp-chatgpt-bot-restaurant)
- [Qiscus — WhatsApp Bot Indonesia](https://www.qiscus.com/id/blog/membuat-whatsapp-bot-indonesia/)
- [Qontak — WhatsApp API Indonesia](https://qontak.com/en/features/whatsapp-api/)
- [Meta Business Verification Indonesia](https://qontak.com/blog/cara-membuat-whatsapp-business-verified/)
- [PWA Share Target — MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target)
- [Web Share Target API — Chrome Developers](https://developer.chrome.com/docs/capabilities/web-apis/web-share-target)
- [WhatsApp Cloud API Setup Guide 2026](https://chatarmin.com/en/blog/how-to-set-up-the-whats-app-api)
- [WhatsApp Flows — Infobip Docs](https://www.infobip.com/docs/whatsapp/whatsapp-flows)
- [Dazo.id](https://dazo.id/)
- [Woowa CRM](https://woowacrm.com/)

---

*Last updated: 2026-02-13*
