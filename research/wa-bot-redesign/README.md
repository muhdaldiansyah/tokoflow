# WA Bot Redesign — Riset & Analisis

> Bedah masalah fundamental WA bot CatatOrder: bot tidak bisa bedakan pesanan vs chat biasa. Semua message masuk langsung jadi session collecting → potensi order salah.

**Status:** Belum dimulai — perlu diskusi per dokumen sebelum implement.

---

## Masalah Inti

Bot saat ini: **setiap message pertama dari customer langsung buat session collecting.** Tidak ada deteksi intent. Chat biasa, tanya-tanya, komplain — semua diperlakukan sebagai awal pesanan.

```
Customer: "Kak boleh tanya harga?"     → session created → collecting
Customer: "Ada rasa apa aja?"           → masuk session
Customer: "Selesai"                     → AI parse → order salah ❌
```

## Dokumen yang Perlu Ditulis

```
01-masalah-fundamental.md
   → Dokumentasi lengkap flow saat ini (handler.ts, session.ts)
   → Semua skenario gagal (chat biasa, komplain, tanya-tanya)
   → Data: 0 real orders dari WA bot, 21 messages logged, 4 sessions
   → Root cause: no intent detection, auto-session on first message

02-solusi-yang-mungkin.md
   → Opsi 1: Trigger word ("pesan", "order") — simple, aman
   → Opsi 2: AI intent detection (Gemini) — smart, mahal
   → Opsi 3: Hybrid (auto-reply link toko + manual trigger)
   → Opsi 4: Disable bot, link toko only
   → Opsi 5: 2-step confirmation (bot tanya dulu "Mau pesan?")
   → Evaluasi: effort, akurasi, UX, cost per opsi

03-competitive-analysis.md
   → Bagaimana GoFood, GrabFood, Shopee handle WA ordering?
   → Apakah ada WA bot ordering yang terbukti berhasil di Indonesia?
   → Case study: WA Business API untuk ordering di UMKM
   → Apakah WA bot ordering = proven pattern atau eksperimen?

04-rekomendasi-dan-implementasi.md
   → Pilihan final berdasarkan evidence dari 01-03
   → Technical spec untuk implementasi
   → Migration plan dari bot lama ke baru
   → Fallback strategy kalau redesign gagal

05-keputusan-final.md
   → Keputusan: keep, redesign, atau disable?
   → Kill criteria
   → Timeline
```

## Konteks

- **File bot saat ini:** `lib/wa-bot/handler.ts` (7.2KB), `session.ts` (7.3KB), `order-creator.ts` (3.5KB), `messages.ts` (2.2KB)
- **WA client:** `lib/whatsapp/client.ts`, `config.ts`, `verify.ts`, `types.ts`
- **Webhook:** `app/api/wa/webhook/route.ts`
- **DB tables:** `wa_connections` (1 active), `wa_sessions` (4), `wa_messages` (21)
- **Production data:** 25 orders total, 0 dari WA bot, 23 manual, 2 order_link
- **Session TTL:** 10 menit
- **Greeting filter:** `['hi', 'halo', 'hai', 'hello', 'hey', 'p', 'permisi', 'assalamualaikum', ...]`
- **Trigger word:** `isTriggerWord()` — customer bilang "selesai" untuk finalize
- **AI parse:** Gemini Flash + product catalog, regex fallback
- **Meta status:** Embedded Signup blocked, WABA restricted, pending Meta verification

## Prinsip

1. **Diskusi sebelum menulis** — setiap dokumen harus didiskusikan dulu
2. **Evidence over opini** — keputusan berdasarkan data dan precedent
3. **Jangan build sebelum validasi** — understand the problem fully before coding
4. **Tahu kapan berhenti** — kalau WA bot bukan pattern yang tepat, better to disable than force it

---

*Created: 2026-03-21*
