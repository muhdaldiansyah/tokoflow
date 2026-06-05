# 01 — Masalah Fundamental: WA Bot CatatOrder

> Bot memperlakukan semua pesan sebagai pesanan. Ini bukan bug — ini design flaw.

---

## Apa yang Sebenarnya Terjadi

### Data Production (per 21 Maret 2026)
- **25 total orders** — 23 manual (92%), 2 order_link (8%), **0 whatsapp (0%)**
- **21 messages logged** di wa_messages
- **4 sessions** di wa_sessions
- **0 orders tercreate** dari WA bot

Bot sudah running selama 5 minggu. Zero conversion.

### Flow Saat Ini (dari kode)

```
Customer kirim pesan APA SAJA
  ↓
Bot cek: apakah ada session aktif?
  ↓ TIDAK
Bot buat session baru (status: collecting)
Bot kirim: "Halo! Selamat datang di [Toko]. Silakan kirim pesanan..."
  ↓
Customer kirim pesan lagi
  ↓
Bot: "Oke, ditambahkan!"  ← semua text masuk raw_messages
  ↓
Customer kirim "selesai" / "ok" / "oke" / "udah" / "cukup"
  ↓
Bot parse semua raw_messages via Gemini AI
  ↓ parse berhasil
Bot kirim konfirmasi + 3 tombol: Simpan | Ubah | Batal
  ↓ customer tap Simpan
Order tercreate di database
```

---

## Dua Realitas yang Bertabrakan

### Realitas 1: Asumsi desain bot

Bot diasumsikan bahwa **setiap customer yang kirim WA ke nomor bisnis = mau pesan**. Flow langsung masuk collecting mode tanpa tanya "mau pesan atau tanya?"

### Realitas 2: Cara customer sebenarnya chat WA

Dari observasi pattern UMKM Indonesia (sumber: dazo.id, kirimi.id, HubSpot 2024):

| Intent customer | Frekuensi | Bot handle? |
|---|---|---|
| Tanya harga / menu | **Sangat sering** | ❌ Masuk collecting |
| Tanya ketersediaan | Sering | ❌ Masuk collecting |
| Chat biasa / basa-basi | Sering | ❌ Greeting filter terlalu kecil |
| Komplain pesanan lama | Kadang | ❌ Masuk collecting |
| Kirim bukti bayar (foto) | Kadang | ❌ Diignore tanpa response |
| Tanya jam operasi | Kadang | ❌ Masuk collecting |
| Order sungguhan | **Kadang** | ✅ Seharusnya ini saja |
| "Oke" / "ok" (setelah tanya) | Sering | ❌ **TRIGGER PARSE** — bahaya |

**Customer tidak membedakan channel** — WA itu tempat tanya, ngobrol, DAN pesan. Bot CatatOrder memperlakukan semua sebagai pesanan.

---

## 3 Masalah Fundamental

### Masalah 1: Zero Intent Detection

**Deskripsi:** Bot tidak punya mekanisme untuk mendeteksi apakah customer bermaksud memesan atau hanya bertanya.

**Bukti dari kode (`handler.ts` line 114-136):**
```javascript
// No active session — start new one
if (!session) {
    session = await createSession(conn.id, customerPhone, contactName);
    await sendTextMessage(customerPhone, buildWelcomeMessage(businessName), config);

    const greetings = ['hi', 'halo', 'hai', ...];
    if (!greetings.includes(text.trim().toLowerCase())) {
        await addMessageToSession(session.id, text); // LANGSUNG MASUK
    }
}
```

**Impact:** Setiap pesan yang bukan greeting langsung masuk session. "Berapa harga kue?" → session collecting → bot reply "Oke, ditambahkan!" → customer bingung.

### Masalah 2: Trigger Word "ok"/"oke" Terlalu Umum

**Deskripsi:** Kata "ok" dan "oke" adalah trigger word untuk finalize pesanan. Tapi ini kata yang sangat umum dalam percakapan sehari-hari.

**Bukti dari kode (`session.ts` line 5):**
```javascript
const TRIGGER_WORDS = ['selesai', 'udah', 'itu aja', 'sudah', 'cukup', 'done', 'ok', 'oke'];
```

**Skenario bahaya:**
```
Customer: "Kak ada rasa coklat?"
Bot: "Oke, ditambahkan!"
Customer: "Berapa harganya?"
Bot: "Oke, ditambahkan!"
Customer: "Oke" ← TRIGGER WORD
Bot: *parse "rasa coklat" + "berapa harganya"* → konfirmasi order
Customer: *tap Simpan karena bingung*
Bot: ✅ Order tercatat! → ORDER SALAH
```

### Masalah 3: Bertentangan dengan Meta Policy 2026

**Deskripsi:** Meta melarang general-purpose AI chatbot di WhatsApp Business Platform sejak 15 Januari 2026.

**Bukti:**
- [TechCrunch](https://techcrunch.com/2025/10/18/whatssapp-changes-its-terms-to-bar-general-purpose-chatbots-from-its-platform/): "Meta prohibits general-purpose AI chatbots on the WhatsApp Business Platform"
- [respond.io](https://respond.io/blog/whatsapp-general-purpose-chatbots-ban): "Structured bots for support, bookings, order tracking, notifications and sales are allowed"

**CatatOrder bot:**
- Menerima ANY text input tanpa filter
- Process via Gemini AI (third-party LLM)
- Meskipun tujuannya ordering (allowed), implementasinya menyerupai general-purpose assistant (banned)
- Risiko: akun WA Business di-restrict oleh Meta

---

## Akar Masalah: Bot Menggunakan Pendekatan yang Salah

**Bot sekarang: Free-text conversation + AI parsing**
- Customer ngomong bebas → AI coba tebak intent dan items
- Ini pattern yang TERBUKTI gagal untuk UMKM (0 orders dalam 5 minggu)
- Bertentangan dengan Meta policy
- Evidence menunjukkan structured flow outperform free-text (konversi 3x lipat)

**Yang seharusnya: Structured flow atau link redirect**

| Approach | Conversion | Complexity | Meta compliance | False order risk |
|---|---|---|---|---|
| Free-text + AI parse (sekarang) | 0% (0/21 messages) | Tinggi | ⚠️ Risiko | Tinggi |
| WhatsApp Flows (form native) | ~3x vs free-text | Sedang | ✅ 100% | Nol |
| Auto-reply + link toko | Proven (2 orders) | Sangat rendah | ✅ 100% | Nol |
| Button-based menu | Proven pattern | Rendah | ✅ 100% | Nol |

---

## Honest Assessment

### Yang kuat dari bot sekarang:
1. Infrastructure sudah ada (webhook, session, AI parsing, order creation)
2. Duplicate message protection (wa_message_id unique)
3. Session TTL (10 menit, mencegah zombie sessions)
4. Confirmation flow dengan 3 tombol (Simpan/Ubah/Batal)
5. Product catalog integration (AI dapat daftar produk untuk matching)

### Yang fundamental salah:
1. **Tidak ada intent detection** — setiap pesan = order session
2. **Trigger word terlalu umum** — "ok"/"oke" trigger false positives
3. **Free-text approach** — bertentangan dengan Meta policy + terbukti inferior vs structured flow
4. **Silent failures** — media (foto, voice, location) diignore tanpa response
5. **0 real orders** — evidence paling kuat bahwa approach ini tidak berhasil

---

## Pertanyaan untuk File 02 (Solusi yang Mungkin)

1. **Apakah WhatsApp Flows bisa digunakan di Indonesia?** — availability, BSP support, implementation effort
2. **Seberapa simple auto-reply + link toko?** — CatatOrder sudah punya link toko yang working. Apakah cukup redirect saja?
3. **Button-based menu vs form-based flow** — mana yang lebih natural untuk katering/bakery UMKM?
4. **Apakah keep AI parsing untuk structured input?** — misal customer sudah di flow terstruktur, AI parse item descriptions
5. **Migration path** — bagaimana transisi dari bot lama ke pendekatan baru tanpa downtime?
6. **Kill criteria** — kapan decide bahwa WA bot ordering bukan approach yang tepat dan disable entirely?

---

*Ditulis 21 Maret 2026. Berdasarkan forensic code analysis + web research (reality capture). Production data: 25 orders, 0 dari WA bot, 21 WA messages logged, 4 sessions.*

Sources:
- [TechCrunch: WhatsApp bars general-purpose chatbots](https://techcrunch.com/2025/10/18/whatssapp-changes-its-terms-to-bar-general-purpose-chatbots-from-its-platform/)
- [respond.io: Not All Chatbots Are Banned](https://respond.io/blog/whatsapp-general-purpose-chatbots-ban)
- [WhatsApp Flows official](https://business.whatsapp.com/products/whatsapp-flows)
- [businesschat.io: WhatsApp chatbot best practices](https://www.businesschat.io/post/whatsapp-chatbot-ultimate-guide)
- [dazo.id: Sistem otomatisasi pesanan WhatsApp](https://dazo.id/blog/chatbot/sistem-otomatisasi-pesanan-whatsapp/)
- [Infobip: WhatsApp Flows](https://www.infobip.com/blog/whatsapp-flows)
