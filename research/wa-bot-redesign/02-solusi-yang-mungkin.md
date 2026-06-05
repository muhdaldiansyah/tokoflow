# 02 — Solusi yang Mungkin: WA Bot Redesign

> Evaluasi 5 opsi berdasarkan evidence, effort, dan realitas CatatOrder saat ini (13 users, 0 WA orders, sudah punya link toko working).

---

## Konteks Keputusan

Sebelum evaluasi solusi, perlu diingat **constraints** saat ini:
- 13 users total, ~5 active
- 0 orders dari WA bot (5 minggu running)
- 2 orders dari link toko (`/pesan/[slug]`) — **sudah proven**
- Meta melarang general-purpose AI chatbot sejak 15 Jan 2026
- CatatOrder langsung ke Meta API (bukan lewat BSP)
- Budget: solo builder, setiap jam development = opportunity cost

---

## 5 Opsi yang Dievaluasi

### Opsi 1: WhatsApp Flows (Form Native di WA)

**Apa:** Customer buka form terstruktur langsung di dalam WhatsApp — dropdown produk, input qty, pilih tanggal kirim. Seperti mini app.

**Bagaimana:**
- Buat Flow definition via WhatsApp Manager atau Graph API
- Flow connect ke endpoint CatatOrder untuk fetch product list
- Customer tap button → form muncul → isi → submit → order masuk DB
- Tidak perlu AI parsing — data sudah terstruktur

**Evidence:**
- Konversi 3x lipat vs free-text ([businesschat.io](https://www.businesschat.io/post/whatsapp-chatbot-ultimate-guide))
- Max 100 screens per flow, max 50 components per screen ([Meta docs](https://developers.facebook.com/docs/whatsapp/flows/reference/components/))
- Supported langsung via Graph API (tidak harus lewat BSP)
- Best practice: 3-step checkout (Select → Confirm → Done)

**Evaluasi:**

| Kriteria | Score | Notes |
|---|---|---|
| Akurasi order | 5/5 | Structured data — zero ambiguity |
| Meta compliance | 5/5 | Fitur resmi Meta |
| Development effort | 2/5 | Butuh build Flow definition + dynamic endpoint + testing |
| Cost | 4/5 | Gratis (sudah punya WA API access) |
| UX | 4/5 | Native di WA, tapi form di HP kecil bisa kurang nyaman |
| Maintenance | 3/5 | Flow harus update kalau produk berubah |
| Risk | 5/5 | Zero false orders |

**Verdict:** Solusi terbaik secara teknis, tapi **overkill untuk current scale**. Build ini masuk akal kalau sudah ada 50+ merchants yang butuh WA ordering. Sekarang = prematur.

---

### Opsi 2: Auto-Reply + Link Toko ⭐ RECOMMENDED

**Apa:** Bot cuma auto-reply setiap pesan dengan: "Pesan langsung di sini: catatorder.id/[slug]". Tidak ada session, tidak ada AI, tidak ada parsing.

**Bagaimana:**
- Simplify `handler.ts`: hapus session logic, hapus AI parsing
- Setiap message masuk → reply text + button "Pesan Sekarang" (link ke store page)
- Optional: bedakan first message vs repeat (throttle reply, max 1 reply per 10 menit per customer)
- Link toko sudah fully functional: catalog, qty, delivery date, payment

**Evidence:**
- Link toko sudah produce 2 orders (vs 0 dari bot) — **evidence paling kuat**
- Pattern "auto-reply + link" direkomendasikan untuk UMKM ([dazo.id](https://dazo.id/blog/digital-transformation/whatsapp-auto-reply/), [kirimi.id](https://kirimi.id/blog/panduan-auto-reply-whatsapp-untuk-customer-service-otomatis-di-indonesia))
- UMKM Indonesia sudah familiar dengan pattern ini (link order di bio, auto-reply)
- "Numbered options reduce customer typing effort and instantly clarify needs" ([cooby.co](https://www.cooby.co/en/post/whatsapp-auto-reply))

**Evaluasi:**

| Kriteria | Score | Notes |
|---|---|---|
| Akurasi order | 5/5 | Order lewat form — zero ambiguity |
| Meta compliance | 5/5 | Auto-reply = fully allowed |
| Development effort | 5/5 | **30 menit** — simplify handler.ts |
| Cost | 5/5 | Zero tambahan |
| UX | 4/5 | Customer klik link → form → pesan. 1 extra step vs langsung di WA |
| Maintenance | 5/5 | Zero — link toko sudah auto-update dari catalog |
| Risk | 5/5 | Zero false orders, zero Meta policy risk |

**Verdict:** Solusi terbaik untuk sekarang. Paling simple, paling proven (link toko sudah working), zero risk. Bot jadi "smart auto-reply" bukan "order taker."

---

### Opsi 3: Interactive Buttons + List Message

**Apa:** Bot kirim catalog sebagai list message WA (max 10 items). Customer tap item → bot kirim detail + qty buttons → confirm → order.

**Bagaimana:**
- Setiap message masuk → bot reply dengan list message berisi top 10 produk
- Customer tap produk → bot tanya qty (button: 1, 2, 3, 5, 10)
- Customer bisa tambah item lagi atau "Selesai"
- Bot kirim konfirmasi → customer tap "Pesan" → order masuk DB

**Evidence:**
- Interactive elements reduce friction — "every button that saves typing increases likelihood user stays in flow" ([businesschat.io](https://www.businesschat.io/post/whatsapp-chatbot-ultimate-guide))
- Max 3 reply buttons per message, max 10 items per list
- Tidak butuh AI — pure button-based flow
- Compliant dengan Meta policy (structured bot)

**Evaluasi:**

| Kriteria | Score | Notes |
|---|---|---|
| Akurasi order | 5/5 | Button-based — no free text |
| Meta compliance | 5/5 | Interactive messages = allowed feature |
| Development effort | 3/5 | Perlu rewrite handler.ts + session logic |
| Cost | 5/5 | Gratis (fitur bawaan WA API) |
| UX | 3/5 | OK untuk <10 produk. Ribet untuk 20+ produk |
| Maintenance | 3/5 | Perlu update list kalau produk berubah |
| Risk | 5/5 | Zero false orders |

**Verdict:** Good middle ground. Tapi **butuh lebih banyak development** dibanding Opsi 2, dan UX terbatas untuk merchant dengan banyak produk. Cocok sebagai upgrade dari Opsi 2 nanti.

---

### Opsi 4: Disable Bot Entirely

**Apa:** Matikan webhook. WhatsApp nomor bisnis tetap aktif untuk chat manual, tapi tidak ada bot yang merespon.

**Evidence:**
- Mayoritas UMKM Indonesia masih manual chat WA dan berhasil
- Bot yang tidak bekerja (0 orders) = wasted server resource

**Evaluasi:**

| Kriteria | Score | Notes |
|---|---|---|
| Akurasi order | N/A | Tidak ada order dari WA |
| Meta compliance | 5/5 | Tidak ada bot = tidak ada risiko |
| Development effort | 5/5 | Hapus webhook URL di Meta dashboard |
| Cost | 5/5 | Zero |
| UX | 2/5 | Customer chat → tidak ada response → frustrasi |
| Maintenance | 5/5 | Zero |
| Risk | 3/5 | Kehilangan channel, tapi channel ini produce 0 orders |

**Verdict:** Terlalu extreme. Auto-reply (Opsi 2) lebih baik — at least customer dapat link toko, bukan silent treatment.

---

### Opsi 5: Fix Current Bot (Add Intent Detection)

**Apa:** Tambah AI intent detection di awal: "Is this an order or casual chat?" sebelum start session.

**Bagaimana:**
- Setiap message masuk → Gemini classify intent: `order` vs `question` vs `complaint` vs `chat`
- Hanya `order` intent yang start session
- Lainnya → auto-reply generic atau redirect ke seller

**Evidence:**
- Intent detection memerlukan training data berkualitas untuk Bahasa Indonesia informal
- Masih menggunakan AI (Meta policy risk)
- Complexity bertambah tapi problem fundamental tetap (free-text parsing)
- 0 orders after 5 weeks → problem bukan intent detection, tapi approach

**Evaluasi:**

| Kriteria | Score | Notes |
|---|---|---|
| Akurasi order | 3/5 | Better than now, tapi AI intent ≠ 100% akurat |
| Meta compliance | 2/5 | Masih pakai AI untuk classify + parse → risiko |
| Development effort | 2/5 | Butuh prompt engineering + testing + edge cases |
| Cost | 2/5 | 2x AI calls per message (intent + parse) |
| UX | 3/5 | Better, tapi masih free-text (customer bisa bingung) |
| Maintenance | 2/5 | Prompt harus di-tune terus |
| Risk | 2/5 | Masih bisa false positive/negative pada intent |

**Verdict:** Throwing good money after bad. Problem bukan "bot kurang pintar" — problem-nya adalah **free-text ordering bukan pattern yang tepat untuk UMKM**.

---

## Perbandingan Visual

```
                    Effort ────────────────────►
                    Low                         High
           ┌───────────────────────────────────────────┐
  High     │                                           │
  Impact   │   ⭐ Opsi 2                               │
           │   Auto-Reply + Link                       │
           │   (30 menit, proven)                      │
           │                           Opsi 3          │
           │                           Buttons+List    │
           │                           (1-2 hari)      │
           │                                           │
           │                                   Opsi 1  │
           │                                   WA Flows│
           │                                   (1 minggu)
           │                                           │
  Low      │   Opsi 4        Opsi 5                    │
  Impact   │   Disable       Fix AI                    │
           │   (extreme)     (risky)                   │
           └───────────────────────────────────────────┘
```

---

## Rekomendasi: Phased Approach

### Sekarang: Opsi 2 — Auto-Reply + Link Toko
- **Effort:** 30 menit
- **Impact:** Immediate — setiap WA message → customer dapat link toko
- **Evidence:** Link toko sudah produce 2 orders, bot produce 0
- **Implementation:** Simplify handler.ts → reply with link + button

### Nanti (kalau ada 50+ merchants): Opsi 3 — Interactive Buttons
- **Trigger:** Ketika ada merchant yang report "customer saya lebih prefer pesan di WA daripada klik link"
- **Implementation:** Button-based catalog browsing di dalam WA

### Masa depan (kalau ada 200+ merchants): Opsi 1 — WhatsApp Flows
- **Trigger:** Ketika volume WA orders justify development cost
- **Implementation:** Full structured form di dalam WA

---

## Honest Assessment

### Yang kuat dari rekomendasi ini:
1. **Paling simple** — 30 menit implementation vs 1 minggu
2. **Proven** — link toko sudah working (2 orders vs 0 dari bot)
3. **Zero risk** — no false orders, no Meta policy risk
4. **Progressive** — bisa upgrade ke Opsi 3 → Opsi 1 nanti
5. **Leverage existing** — link toko sudah ada, catalog sudah ada, SEO sudah ada

### Yang belum terbukti:
1. **Apakah customer akan klik link?** — 1 extra step vs langsung di WA. Tapi evidence menunjukkan 2 orders sudah datang dari link
2. **Apakah UX cukup smooth?** — WA → klik link → browser → form → pesan. Ini 4 step vs button-based 2 step
3. **Apakah merchant prefer bot atau link?** — perlu tanya ke 10 katering target

---

## Pertanyaan untuk File 03 (Competitive Analysis)

1. **Apakah ada competitor di Indonesia** yang berhasil implement WA bot ordering untuk UMKM F&B?
2. **Bagaimana GoFood/GrabFood** handle WA — apakah mereka pakai bot atau hanya notifikasi?
3. **Case study** — ada UMKM yang switch dari WA bot ke link order dan hasilnya bagaimana?
4. **International precedent** — WhatsApp ordering di Brazil, India — pattern apa yang terbukti?

---

*Ditulis 21 Maret 2026. Evaluasi 5 opsi berdasarkan web research (Meta policy, WhatsApp Flows, UMKM patterns) + forensic code analysis + production data (0 WA orders, 2 link orders).*

Sources:
- [WhatsApp Flows official](https://business.whatsapp.com/products/whatsapp-flows)
- [Meta Flows documentation](https://developers.facebook.com/docs/whatsapp/flows/reference/components/)
- [WebMaxy: WhatsApp Flows for Restaurants](https://www.webmaxy.co/blog/whatsapp-commerce/whatsapp-flows-for-restaurants/)
- [SleekFlow: WhatsApp interactive messages](https://sleekflow.io/en-us/blog/whatsapp-interactive-message)
- [Infobip: WhatsApp interactive buttons](https://www.infobip.com/blog/how-to-use-whatsapp-interactive-buttons)
- [dazo.id: WhatsApp auto reply](https://dazo.id/blog/digital-transformation/whatsapp-auto-reply/)
- [kirimi.id: Auto reply WA untuk UMKM](https://kirimi.id/blog/panduan-auto-reply-whatsapp-untuk-customer-service-otomatis-di-indonesia)
- [Connverz: WhatsApp automation for orders](https://www.connverz.com/blog/step-by-step-guide-set-up-whatsapp-automation-for-orders-2026-complete-guide)
- [2Factor: WhatsApp Flows guide](https://2factor.in/v3/lp/blogs/Everything-You-Need-to-Know-About-WhatsApp-Flows.html)
