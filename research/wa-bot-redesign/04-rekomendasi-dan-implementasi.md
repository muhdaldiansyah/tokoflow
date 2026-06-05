# 04 — Rekomendasi & Implementasi

> Dari 3 dokumen riset sebelumnya: masalah fundamental (01), 5 opsi solusi (02), competitive analysis (03) — keputusannya jelas. Dokumen ini berisi implementasi teknis.

---

## Keputusan Final

### Implementasi: Auto-Reply + Link Toko

**Kenapa ini bukan opsi tapi keputusan:**
1. **0 orders dari bot** vs 2 dari link toko — data production tidak bisa dibantah
2. **Meta melarang** general-purpose AI chatbot sejak 15 Jan 2026 — risiko akun
3. **Tidak ada precedent sukses** WA bot ordering di UMKM F&B Indonesia
4. **GoFood/GrabFood/JioMart** semua pakai structured flow, bukan free-text bot
5. **Link toko sudah exist dan working** — zero development untuk ordering flow

---

## Technical Spec

### Apa yang berubah

**SEBELUM (190 lines, 4 files aktif):**
```
handler.ts (234 lines) — session management, AI trigger, button handler
session.ts (250 lines) — session CRUD, AI parsing, Gemini call
order-creator.ts (92 lines) — order creation from parsed items
messages.ts (79 lines) — 8 message template functions
```

**SESUDAH (~50 lines, 1 file aktif):**
```
handler.ts (~50 lines) — auto-reply with link, throttle, log
messages.ts (~15 lines) — 1 message template
session.ts — NOT USED (keep file, don't delete)
order-creator.ts — NOT USED (keep file, don't delete)
```

### File yang diubah: `handler.ts`

**New flow:**
```
Incoming message (any type: text, image, voice, location)
  ↓
Find WA connection (same as before)
  ↓
Log inbound message (same as before)
  ↓
Mark as read (same as before)
  ↓
Throttle check: sudah reply customer ini dalam 10 menit terakhir?
  ├─ YES → skip (jangan spam)
  └─ NO → continue
       ↓
Fetch merchant profile (business_name, slug)
  ↓
Send auto-reply:
  "Halo! Terima kasih sudah menghubungi *{businessName}* 👋

   Untuk memesan, langsung klik di sini ya:
   👉 catatorder.id/{slug}

   Pilih menu, isi jumlah, dan pesanan langsung masuk ke kami.

   _Dibuat dengan CatatOrder — catatorder.id_"
  ↓
Log reply di wa_messages (direction: outbound)
  ↓
Done
```

### Auto-Reply Message Design

**Prinsip:**
1. **Singkat** — customer tidak mau baca paragraf panjang
2. **Link jelas** — URL harus prominent dan tappable
3. **Tidak menggurui** — bukan "silakan ikuti langkah berikut", tapi "langsung klik di sini"
4. **Ada greeting** — personal touch, bukan bot feel

**Template:**

```
Halo! Terima kasih sudah menghubungi *{businessName}* 👋

Untuk memesan, langsung klik di sini:
👉 catatorder.id/{slug}

Pilih menu, isi data, selesai! ✅

_Dibuat dengan CatatOrder — catatorder.id_
```

**Variasi kalau merchant TIDAK punya slug (belum setup link toko):**

```
Halo! Terima kasih sudah menghubungi *{businessName}* 👋

Kami akan segera membalas pesan kamu. Mohon tunggu ya!

_Dibuat dengan CatatOrder — catatorder.id_
```

### Throttle Logic

**Problem:** Kalau customer kirim 5 pesan berturut-turut, bot tidak boleh reply 5 kali.

**Solution:** Simple throttle per customer phone — max 1 auto-reply per 10 menit per nomor.

```typescript
// In-memory throttle map
const replyThrottle = new Map<string, number>(); // phone → lastReplyTimestamp
const THROTTLE_MS = 10 * 60 * 1000; // 10 minutes

function shouldReply(phone: string): boolean {
  const lastReply = replyThrottle.get(phone) || 0;
  if (Date.now() - lastReply < THROTTLE_MS) return false;
  replyThrottle.set(phone, Date.now());
  return true;
}
```

### Metrics Tracking

**Track di `events` table:**
```typescript
// Setiap auto-reply yang terkirim
await supabase.from('events').insert({
  user_id: connection.user_id,
  event: 'wa_auto_reply_sent',
  properties: {
    customer_phone: customerPhone,
    slug: profile?.slug,
    has_slug: !!profile?.slug,
  },
});
```

**Track di `page_views` (sudah ada):**
- Kalau customer klik link → page view tercatat di `/pesan/[slug]`
- Referrer = `wa.me` atau blank (WA in-app browser)

**Conversion funnel:**
```
wa_auto_reply_sent → page_views (slug) → public_order_received
```
Ini bisa di-track di admin analytics.

---

## Implementasi Step by Step

### Step 1: Rewrite handler.ts (~30 menit)

```typescript
// lib/wa-bot/handler.ts — SIMPLIFIED
import { createServiceClient } from '@/lib/supabase/server';
import { sendTextMessage, markAsRead } from '@/lib/whatsapp/client';
import { resolveToken } from '@/lib/utils/encryption';
import type { IncomingMessage, WaConfig, WaConnection, WebhookContact } from '@/lib/whatsapp/types';

const BRANDING = '\n\n_Dibuat dengan CatatOrder — catatorder.id_';

// Throttle: max 1 reply per 10 minutes per customer phone
const replyThrottle = new Map<string, number>();
const THROTTLE_MS = 10 * 60 * 1000;

function shouldReply(phone: string): boolean {
  const lastReply = replyThrottle.get(phone) || 0;
  if (Date.now() - lastReply < THROTTLE_MS) return false;
  replyThrottle.set(phone, Date.now());
  return true;
}

export async function handleIncomingMessage(
  message: IncomingMessage,
  phoneNumberId: string,
  contacts: WebhookContact[] | undefined
): Promise<void> {
  const supabase = await createServiceClient();

  // 1. Find connection
  const { data: connection } = await supabase
    .from('wa_connections')
    .select('id, user_id, wa_phone_number_id, access_token')
    .eq('wa_phone_number_id', phoneNumberId)
    .eq('is_active', true)
    .single();

  if (!connection) return;

  const conn = connection as WaConnection;
  const config: WaConfig = {
    accessToken: resolveToken(conn.access_token),
    phoneNumberId: conn.wa_phone_number_id,
    apiVersion: process.env.WA_API_VERSION || 'v24.0',
  };

  const customerPhone = message.from;

  // 2. Log inbound message (dedup via unique wa_message_id)
  const { error: logError } = await supabase
    .from('wa_messages')
    .insert({
      connection_id: conn.id,
      wa_message_id: message.id,
      direction: 'inbound',
      from_phone: customerPhone,
      to_phone: phoneNumberId,
      message_type: message.type,
      content: message.text
        ? { body: message.text.body }
        : message.interactive
          ? { interactive: message.interactive }
          : { type: message.type },
    });

  if (logError?.code === '23505') return; // duplicate

  // 3. Mark as read
  markAsRead(message.id, config).catch(() => {});

  // 4. Throttle check — don't spam
  if (!shouldReply(customerPhone)) return;

  // 5. Fetch merchant info
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name, slug')
    .eq('id', conn.user_id)
    .single();

  const businessName = profile?.business_name || 'Toko Kami';
  const slug = profile?.slug;

  // 6. Build and send auto-reply
  let replyText: string;
  if (slug) {
    replyText =
      `Halo! Terima kasih sudah menghubungi *${businessName}* 👋\n\n` +
      `Untuk memesan, langsung klik di sini:\n` +
      `👉 catatorder.id/${slug}\n\n` +
      `Pilih menu, isi data, selesai! ✅` +
      BRANDING;
  } else {
    replyText =
      `Halo! Terima kasih sudah menghubungi *${businessName}* 👋\n\n` +
      `Kami akan segera membalas pesan kamu. Mohon tunggu ya!` +
      BRANDING;
  }

  await sendTextMessage(customerPhone, replyText, config);

  // 7. Track auto-reply event
  await supabase.from('events').insert({
    user_id: conn.user_id,
    event: 'wa_auto_reply_sent',
    properties: {
      customer_phone: customerPhone,
      has_slug: !!slug,
    },
  }).catch(() => {}); // fire-and-forget
}
```

### Step 2: Keep old files (jangan delete)

File lama (`session.ts`, `order-creator.ts`, `messages.ts` yang lama) **TIDAK dihapus**. Alasan:
- Kalau nanti mau upgrade ke button-based flow, session logic bisa dipakai lagi
- Git history sudah cukup — tidak perlu delete lalu recreate
- Tapi handler.ts tidak import mereka lagi

### Step 3: Test

1. Kirim WA ke nomor bot → harus terima auto-reply dengan link
2. Kirim 3 pesan berturut-turut → hanya reply 1 kali (throttle)
3. Tunggu 10 menit → kirim lagi → harus reply lagi
4. Kirim foto/voice/location → harus tetap reply (bukan hanya text)
5. Klik link di reply → harus buka store page
6. Buat order via store page → harus tercatat dengan source="order_link"

### Step 4: Update CLAUDE.md

```
### WA Cloud API
- Bot mode: Auto-reply with link toko (simplified from AI-based ordering)
- Every incoming message → reply with catatorder.id/[slug] link
- Throttle: max 1 reply per 10 minutes per customer phone
- No session management, no AI parsing, no order creation from chat
- Messages still logged in wa_messages for analytics
```

---

## Migration Plan

### Hari 1: Deploy new handler.ts
- Replace handler.ts content
- Deploy to Vercel
- Existing sessions (4 in DB) will be ignored — handler doesn't check sessions anymore

### Cleanup (optional, not urgent):
- Active sessions in wa_sessions table → leave as-is (only 4, will naturally become irrelevant)
- wa_messages table → keep all data (useful for analytics)
- session.ts, order-creator.ts, messages.ts → keep files, remove unused imports from handler

### Rollback plan:
- If auto-reply doesn't work → git revert → old bot is back
- Risk: near zero (auto-reply is simpler than old bot)

---

## Future Upgrade Path

### Phase 2: Interactive Buttons (when 50+ merchants)

**Trigger:** Merchant feedback "customer saya lebih suka pesan langsung di WA"

**Implementation:**
```
Customer kirim pesan
  ↓
Bot reply: "Mau pesan atau tanya?"
  → Button 1: "Pesan Sekarang" → link toko
  → Button 2: "Lihat Menu" → list message (top 10 produk)
  → Button 3: "Hubungi Penjual" → forward ke owner
```

**Effort:** ~1 hari. Reuse `sendButtonMessage()` yang sudah ada.

### Phase 3: WhatsApp Flows (when 200+ merchants)

**Trigger:** Volume WA orders justify development cost

**Implementation:**
- Build Flow definition dengan product catalog dari DB
- Customer tap → form native di WA → select items → submit → order masuk
- Full structured ordering tanpa AI

**Effort:** ~1 minggu.

---

## Kill Criteria

| Milestone | Check | Action |
|---|---|---|
| 2 minggu setelah deploy | Berapa auto-reply terkirim? Berapa yang klik link? | Jika 0 klik → review message copy |
| 1 bulan setelah deploy | Berapa orders dari link setelah WA auto-reply? | Jika 0 orders → WA bukan channel yang tepat untuk UMKM ini |
| 3 bulan setelah deploy | Trend: apakah WA → link → order meningkat? | Jika flat → focus ke channel lain (IG, Google, direktori) |

---

## Honest Assessment

### Yang kuat:
1. **30 menit implementation** — dari deploy bisa langsung live
2. **Zero risk** — auto-reply tidak bisa create false orders
3. **100% Meta compliant** — auto-reply = explicitly allowed
4. **Leverage existing** — link toko sudah working, catalog sudah ada, SEO sudah ada
5. **Measurable** — event tracking → conversion funnel
6. **Reversible** — git revert kalau ada masalah

### Yang belum terbukti:
1. **Apakah customer mau klik link?** — 1 extra step (WA → browser). Tapi evidence: 2 orders sudah datang dari link
2. **Apakah throttle 10 menit cukup?** — bisa adjust kalau terlalu lama/pendek
3. **Apakah message copy optimal?** — perlu A/B test (tapi prematur dengan 13 users)

### Yang sengaja TIDAK dilakukan:
1. **Tidak delete old bot code** — keep sebagai reference/fallback
2. **Tidak implement WhatsApp Flows** — prematur untuk current scale
3. **Tidak add button-based menu** — extra complexity tanpa proven demand
4. **Tidak fix AI intent detection** — wrong approach (evidence from 01, 02, 03)

---

## Pertanyaan untuk File 05 (Keputusan Final)

1. **Apakah setuju implement sekarang?** — 30 menit, zero risk, reversible
2. **Apakah perlu informasikan ke merchant?** — saat ini hanya 1 WA connection (milik admin)
3. **Kapan review pertama?** — 2 minggu setelah deploy?
4. **Apakah perlu admin dashboard untuk WA metrics?** — track auto-reply sent, link clicks, conversions

---

*Ditulis 21 Maret 2026. Implementation spec berdasarkan forensic code analysis (handler.ts, session.ts, messages.ts, client.ts) + evidence dari dokumen 01-03.*
