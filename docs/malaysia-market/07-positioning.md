# 07 · Positioning Strategi

> Di mana CatatOrder bisa menang di Malaysia, dan di mana tidak.

**Versi:** 1.0 · **Diperbarui:** 2026-04-17 · **Status:** Strategic hypothesis

---

## 1. Pertanyaan inti

> *"Kenapa micro-SME Malaysia harus pakai CatatOrder alih-alih Orderla.my (ordering) atau Bukku (bookkeeping) atau WhatsApp Business polos (status quo)?"*

Kalau kita tidak bisa jawab ini dalam **satu kalimat yang kredibel**, entry MY tidak feasible. Dokumen ini adalah proses menjawab pertanyaan itu.

---

## 2. Positioning map: 2 sumbu

**Sumbu 1 — Fokus fungsional:** Bookkeeping-first ↔ Ordering-first
**Sumbu 2 — Kompleksitas:** Simple (untuk non-akuntan) ↔ Complex (untuk akuntan/SME yang sudah besar)

```
                          BOOKKEEPING-FIRST
                                 │
              Xero · QuickBooks · AutoCount Cloud
                                 │
                    Bukku · Financio · QNE · SQL
                                 │
                                 │
  SIMPLE ───────────────────────┼─────────────────────── COMPLEX
                                 │
                  ↓ CatatOrder  │
                      Orderla.my  │
                                 │
                  Wabot · SalesHeroAI · WATI
                                 │
                                 │
                         ORDERING/COMMS-FIRST
```

**Sweet spot hipotesis CatatOrder:** pojok kiri-tengah — **simple, sedikit miring ke ordering tapi dengan bookkeeping built-in**.

Masalah: **Orderla.my duduk sangat dekat.** Ini bukan blue ocean yang kosong.

---

## 3. Tiga opsi wedge yang layak diuji

Saya akan analyse 3 wedge berbeda — bukan pick one now, tapi identify mana yang paling defensible.

### Opsi A — "WhatsApp-native untuk bisnis yang terima order via chat"

**Framing:** "Kamu terima order di WA? Biar CatatOrder yang rapikan."

- **Audience:** Semua micro-SME yang sudah pakai WA Business (estimasi 388K di MY)
- **Value prop:** One-tap capture chat → structured order → auto-bookkeeping
- **Kompetitor langsung:** Orderla.my (ordering form) + Bukku (bookkeeping add-on WA)
- **Risiko:** Terlalu luas. Orderla.my sudah mature di sini. Ini adalah **head-on competition** dengan incumbent yang 3 tahun head start.
- **Probabilitas menang:** 20-30%

### Opsi B — "Home F&B / hobbyist seller yang belum butuh e-invoice"

**Framing:** "Untuk bisnis yang jual dari rumah. Catat pesanan tanpa ribet."

- **Audience:** Narrower — home kitchen, kuih seller, frozen food, home baker, reseller — di bawah RM1M revenue (exempt dari MyInvois)
- **Value prop:** Ultra-simple, no accountant needed, no e-invoice concern, bilingual BM/English
- **Kompetitor langsung:** Tidak ada yang sharp di segment ini. Orderla.my lebih tech-savvy. Bukku lebih akunting-tilted. WA polos adalah status quo.
- **Risiko:** Segmen mungkin tidak punya budget. "Sebelum butuh bayar" adalah segmen termurah.
- **Probabilitas menang:** 40-50%
- **Catatan:** Ini paling dekat dengan positioning CatatOrder di Indonesia. Transferable learnings tinggi.

### Opsi C — "Post-Orderla upgrade untuk yang sudah graduate dari form ordering"

**Framing:** "Sudah pakai Orderla? Waktunya tambah catatan keuangan."

- **Audience:** Orderla.my user yang sudah 6-12 bulan pakai dan butuh bookkeeping layer
- **Value prop:** "Integrasi dengan order tool kamu + bookkeeping otomatis"
- **Kompetitor langsung:** Bukku (yang punya WA receipt feature)
- **Risiko:** Tergantung pada bisa/tidaknya integrate dengan Orderla (butuh API/webhook mereka, yang belum tentu ada). Juga, ini positioning "complement" bukan "replacement" — margin lebih sempit.
- **Probabilitas menang:** 25-35%

**Pilihan yang direkomendasikan:** **Opsi B** (home F&B / hobbyist exempt dari MyInvois).

Alasan:
1. Transferable dari experience Indonesia (segmen yang sama sudah CatatOrder solve)
2. Under-served — competitor MY menarget kelas di atas ini
3. Regulatory tailwind — LHDN exempt <RM1M, jadi tidak perlu build MyInvois
4. WhatsApp Business adoption tertinggi di segmen ini (home biz usually start di WA)

**Risiko diakui:** Low ARPU segment. Butuh volume. Mungkin tidak support scale ambisius.

---

## 4. Defensible moats — apa yang bisa protect?

Setelah landing, apa yang keep user di CatatOrder 12+ bulan?

| Moat | Strength | Catatan |
|---|---|---|
| **Data lock-in** | Medium-High | Kalau sudah 3 bulan record orders + customers, exit cost tinggi. Export tool harus disediakan (GDPR-friendly) tapi tetap ada switching friction. |
| **WhatsApp parsing accuracy** | Medium | Kalau parsing dari chat → order structured lebih baik dari competitor, ini defensible tech. Butuh investasi di Bahasa Melayu NLU. |
| **Community/network effects** | Low-Medium | CatatOrder has community feature. Bisa jadi moat kalau adopt di MY (UMKM MY suka grup WA komunitas). |
| **Brand / distribution** | Low (initial) | Brand CatatOrder tidak dikenal di MY. Butuh 12-24 bulan build. |
| **Integration ecosystem** | Low | Orderla.my sudah integrate Zapier, 9 payment gateway. CatatOrder start dari nol. |
| **Pricing** | Medium | Free tier 50 pesanan/bulan = very generous. Sudah di-price untuk mass-micro. |

**Kesimpulan:** Moat terkuat = **data + parsing quality**. Butuh investasi di BM-language NLU.

---

## 5. Implikasi messaging

Kalau pilih **Opsi B (home F&B wedge)**, messaging harus:

**Do:**
- "Untuk bisnis rumahan yang terima pesanan di WhatsApp"
- "Tanpa accountant, tanpa ribet"
- "Gratis sampai 50 pesanan sebulan"
- Bahasa Melayu-first, English secondary
- Visual: ibu rumah tangga, home kitchen, kuih, snack, frozen — bukan office setting

**Don't:**
- "Accounting software" (triggers Bukku comparison, loses)
- "E-invoice compliant" (tidak relevan untuk segmen, dan kita tidak compliant)
- "Replace your POS" (segmen ini tidak punya POS)
- Corporate/B2B tone

---

## 6. Implikasi produk

Kalau Opsi B, prioritas build untuk MY:

**Harus ada (launch blockers):**
1. Bahasa Melayu UI lengkap (bukan Google Translate)
2. Currency MYR + RM formatting
3. Phone format MY (+60)
4. Date format MY convention
5. Minimal 1 payment gateway — **Billplz** (FPX + DuitNow QR + cards, lihat [05-pembayaran.md](./05-pembayaran.md))
6. WA parsing yang understand Bahasa Melayu informal ("nak order 2 keping kuih")
7. **Supabase Singapore migration** untuk MY data (PDPA compliance — lihat [04-regulasi.md](./04-regulasi.md#5-pdpa--major-20242025-overhaul-attention-required))

**Boleh skip di launch:**
1. MyInvois integration (segmen exempt)
2. SST reporting (segmen di bawah threshold SST RM500K)
3. Multi-currency (pricing simpl MYR only)
4. Advanced inventory (segmen home-biz punya simple stock)
5. Delivery integration (EasyParcel dll) — nice-to-have, bukan blocker

**Build nanti (post-PMF MY):**
1. MyInvois (kalau user mulai grow past RM1M)
2. Integration dengan e-wallet MY (TnG, GrabPay, Boost)
3. DuitNow QR native
4. Customer segmentation lebih advanced

---

## 7. Kompetitive response — apa kemungkinan reaksi Orderla/Bukku?

**Orderla.my** — Kalau CatatOrder launch di segmen home-biz:

Data dari deep research (lihat [03-lanskap-kompetitif.md](./03-lanskap-kompetitif.md#2-orderlamy--deep-dive-kompetitor-paling-direct)) menunjukkan Orderla jauh lebih lemah dari yang diasumsikan awal:
- **Zero external funding** (Tracxn)
- **~800 Instagram followers** untuk 14K claimed accounts
- **~RM 1,400 GMV/merchant/year** = most merchants dormant
- Founder public admission April 2025: architectural limits reached (rebuilding "Orderla Commerce")
- Small team, no marketing muscle

Implikasi:
- Mereka punya tech tapi **tidak punya resource untuk aggressive defensive pivot**
- Add bookkeeping butuh 6-12 bulan engineering — mereka tidak punya team size untuk itu sambil maintain ordering product
- **Probabilitas respons aggressive: 25%** (revised down from 40%)
- Mitigasi: Move fast tapi tidak panik. Kalau 12 bulan sudah 1,000+ paying user, Orderla kemungkinan ignore atau partner.

**Bukku.my** — Kalau CatatOrder launch:
- WhatsApp receipt mereka adalah add-on, bukan core. Unlikely to aggressively pivot.
- Respons: Maybe improve their WA feature marketing. Low threat.
- Probabilitas respons aggressive: **15%**

**WhatsApp / Meta sendiri:**
- Meta bisa build WA Business-native ordering tools (mereka sudah ada Catalog). Ini adalah **existential risk** jangka panjang (3+ tahun).
- Mitigasi: Build data + bookkeeping layer yang Meta tidak akan build (they don't care tentang accounting).

---

## 8. Gate untuk validate positioning

Sebelum invest berat di MY, positioning di atas perlu diuji dengan **hard evidence**. 3 gate:

**Gate 1 — Qualitative validation (8-12 weeks)**
Ariff atau local tester interview **15 home-biz WA users** di MY:
- "Kalau ada tool ini, akan kamu pakai?"
- "Berapa kamu mau bayar per bulan?"
- "Apa yang kamu benci dari tool sekarang?"

Pass kriteria: 10 dari 15 express clear need + willingness-to-pay RM15+/bulan.

**Gate 2 — Landing page conversion (4 weeks)**
Deploy landing `catatorder.my` dengan Opsi B messaging. Drive 500 clicks via FB/TikTok ads BM.
Pass kriteria: email signup rate ≥12% (healthy for B2B SaaS landing).

**Gate 3 — Paid pilot (12 weeks)**
Onboard 20 MY users, charge RM19/bulan dari bulan pertama (no free trial lebih dari 7 hari).
Pass kriteria: 70% retention week-4, 50% retention week-12.

Kalau 2 dari 3 gate pass → proceed ke Phase 2. Kalau tidak → pause MY, fokus ID.

---

## 9. Kesimpulan

**Positioning terpilih:** **"WhatsApp-first catatan pesanan untuk home F&B & reseller — tanpa e-invoice, tanpa akuntan."**

**Wedge defensibility:** Medium. Moat utama = data + parsing quality, bukan network effect.

**Competitive risk:** Medium. Orderla sudah di-space tapi segmen yang lebih "techy". Bukku di space yang lebih "akunting".

**Recommended action:** Jalankan 3 gate di atas sebelum commit lebih dari RM50,000 untuk MY launch.

---

**Cross-references:**
- Kompetitor detail → [03-lanskap-kompetitif.md](./03-lanskap-kompetitif.md)
- Regulatory context (MyInvois exemption) → [04-regulasi.md](./04-regulasi.md)
- Pricing strategy → [06-harga-ekonomi-unit.md](./06-harga-ekonomi-unit.md)
- Risk register → [08-risiko.md](./08-risiko.md)
