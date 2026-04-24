# 08 · Risk Register

> Strategic + execution + macro risks untuk MY expansion, dengan mitigasi.

**Versi:** 1.0 · **Diperbarui:** 2026-04-17

---

## 1. Prinsip risk scoring

Setiap risiko diberi score dengan 2 dimensi:

- **Probability (P):** Low / Med / High — peluang terjadi dalam 12 bulan
- **Impact (I):** Low / Med / High / Critical — dampak kalau terjadi
- **Severity = P × I** — yang paling critical harus di-mitigate first

Kita juga menggunakan **mitigasi gating** — daripada hanya "mengurangi" risiko, kita cari **kondisi verifikasi** sebelum commit deeper ke MY.

---

## 2. Strategic Risks (top-level, shape the decision)

### R1 · Market size insufficient untuk sustain dedicated team

- **P:** Medium · **I:** High · **Severity:** 6/9
- **Thesis:** MY TAM micro-SME realistic ~40-60K paying customers. 5% capture × ARPU RM30 = ARR RM720K-1.08M. Cukup untuk lifestyle business, tidak cukup untuk scale ambisius (>RM5M ARR).
- **Signal:** Kalau setelah 12 bulan di MY, MRR <RM50K, market size hypothesis confirmed too small.
- **Mitigasi:** 
  - Treat MY sebagai **secondary market**, bukan primary. Indonesia tetap main market.
  - Kalau MY traction muncul, use it as gateway ke SEA expansion (SG, TH, PH) — spread fixed costs.
  - **Gate:** Jangan dedicate full-time MY team sampai MRR >RM30K.

### R2 · Orderla.my aggressive defensive response

- **P:** Low-Medium (revised down) · **I:** Medium · **Severity:** 3-4/9
- **Thesis (revised after deep research):** Research agent menemukan Orderla jauh lebih lemah dari asumsi awal:
  - **Zero external funding** — tidak punya war chest untuk defensive pivot
  - **~800 Instagram followers** — tidak ada marketing muscle
  - **~RM 1,400 GMV/merchant/year** average = mostly dormant users
  - Founder April 2025 blog admits architectural limits + rebuilding "Orderla Commerce"
  - Small team (founder + small team, tidak ada C-suite disclosed)
- **Signal:** Pricing Orderla turun signifikan atau feature bookkeeping masuk roadmap.
- **Mitigasi:**
  - **Hindari head-on competition** tetap — positioning Opsi B lebih sulit mereka tiru.
  - Build moat data (parsing BM, customer history).
  - **Jangan raise awareness** di media umum — grow underground.
- **Real concern:** Bukku's bank partnership (UOB, Funding Societies) lebih formidable dari Orderla direct competition. Lihat R15 baru.

### R3 · Product-market fit di ID belum solid, distraksi ke MY memperburuk

- **P:** High · **I:** Critical · **Severity:** 8-9/9 — **#1 RISK**
- **Thesis:** Founder attention adalah constraint terbesar pre-PMF. Split focus = neither market achieves PMF = runway habis.
- **Signal:**
  - ID MRR stagnan 3 bulan berturut-turut
  - ID retention drop di bawah 70% monthly
  - MY takes >20% founder time sebelum ID PMF validated
- **Mitigasi:**
  - **Rule:** 80% founder time ID, 20% MY reconnaissance only, sampai ID PMF validated (definisi: MRR >IDR 30M + retention >80% + 50+ paying customer).
  - Ariff jadi MY advisor (0.5-1% equity, 2-year vest, 6-month cliff), bukan co-founder. Co-founder only kalau ID PMF + MY Gate 2 passed.
  - Setiap MY activity harus direct answer: "apa yang kita pelajari?" — not "apa yang kita build?"

### R4 · LHDN threshold changes force premature MyInvois build

- **P:** Low-Medium · **I:** High · **Severity:** 4-6/9
- **Thesis:** Kalau LHDN turunkan threshold e-invoice dari RM1M ke RM500K atau lebih rendah, segmen CatatOrder suddenly affected → harus build MyInvois integration urgently.
- **Signal:** Budget 2027 announcement atau gazette amendment.
- **Mitigasi:**
  - Monitor LHDN announcements quarterly.
  - Pre-scope MyInvois integration — estimate engineering effort, identify Peppol access points, budget.
  - Kalau threshold drops, have 6-month response window before enforcement.

### R5 · Domain verification dependency (solved)

- **P:** Solved ✓
- **Status:** `catatorder.id` diverify di Meta Business (2026-04-17). WA Business l.wl.co wrapper bypass aktif.
- **Catatan:** Monitor ulang kalau launch `catatorder.my` — butuh separate verification.

---

## 3. Execution Risks (operational, how we run it)

### R6 · CAC/LTV ratio tidak sehat

- **P:** High · **I:** High · **Severity:** 7/9
- **Thesis:** MY digital ad CAC 2-3x lebih tinggi dari ID (RM400-1,000 per paying customer vs IDR 500K-2M). Kalau ARPU MY hanya 2-3x ID, LTV/CAC ratio roughly sama. Tapi cold start di market baru biasanya jauh lebih mahal.
- **Signal:** Setelah 3 bulan paid acquisition, CAC >RM600 atau payback period >9 bulan.
- **Mitigasi:**
  - **Organic-first** — grow via Ariff's network + komunitas WA organic, BUKAN paid ads di 6 bulan pertama.
  - Referral program: existing user refer new user, both get RM30 credit.
  - Content marketing Bahasa Melayu (TikTok, FB Reel) — organic reach untuk home-biz tinggi.
  - Target CAC <RM300 (payback 6 bulan at RM50 ARPU).

### R7 · Ariff commitment collapse / divergent incentives

- **P:** Medium · **I:** High · **Severity:** 6/9
- **Thesis:** Partnership/nominee structures failing karena misalignment incentive. Kalau Ariff tidak di-structure dengan proper vesting + clear deliverable, bisa:
  - Lose interest setelah 3-6 bulan tanpa obvious traction
  - Ask untuk equity yang terlalu besar → founder dilution
  - Diverge ke opportunity lain (job baru, MBA, dll)
- **Signal:** Ariff missed commitment 2 minggu berturut-turut; tidak respond pada MY activity untuk 10+ hari.
- **Mitigasi:**
  - **Structured equity:** 0.5-1% sebagai advisor (initial), 2-year vesting, 6-month cliff. Kalau MY gate passed, promote ke 3-5% Sdn Bhd shareholder dengan separate 4-year vest.
  - **Clear 90-day deliverable:** Ariff commits to recruit 15 MY tester + 10 user interview + 5 video testimonial.
  - **Written advisor agreement** (bukan verbal) — protects both sides.
  - **Alternative path:** Kalau Ariff drop, local freelance community manager (~RM3,000/bulan) untuk sustain MY presence.

### R8 · Multilingual operational burden

- **P:** High · **I:** Medium · **Severity:** 5/9
- **Thesis:** MY butuh support dalam 3 bahasa (BM, English, Chinese). Customer support, onboarding, marketing copy, legal/T&C semua triple-effort. Indonesia single-language operation jauh lebih simple.
- **Signal:** Support ticket volume MY lebih besar dari ID per-user; response time deteriorate.
- **Mitigasi:**
  - **Launch BM-only** di Phase 1. Add English setelah 500 users. Chinese setelah 2,000 users.
  - Ariff atau community manager cover BM support. AI chatbot + help docs untuk English.
  - **Jangan** start translate seluruh UI day 1 — translate incrementally sesuai demand.

### R9 · Payment gateway onboarding friction

- **P:** Medium · **I:** Medium · **Severity:** 4/9
- **Thesis:** Payment gateway MY punya KYC ketat untuk foreign entity. CatatOrder berbasis Indonesia → mungkin tidak qualify untuk beberapa gateway (Billplz, iPay88) tanpa Sdn Bhd MY.
- **Signal:** Billplz/iPay88 reject onboarding; hanya bisa pakai Stripe/CHIP (yang fee-nya tinggi).
- **Mitigasi:**
  - Start dengan **Toyyibpay** (paling lenient) atau **CHIP** (Stripe-like, foreign-friendly).
  - Prioritize **Sdn Bhd setup** di Phase 2 — unlocks Billplz/iPay88.
  - Alternatif: acting-as-agent structure dengan partner MY yang sudah punya Sdn Bhd + gateway.

### R10 · Regulatory compliance overhead (PDPA, SSM, SST)

- **P:** Medium · **I:** Low-Medium · **Severity:** 3-4/9
- **Thesis:** MY regulasi multiple: PDPA compliance, SSM registration, SST (kalau revenue >RM500K), employment pass kalau Aldi physically di MY.
- **Mitigasi:**
  - **Lean compliance** di awal: pakai Indonesian entity + Ariff sebagai representative di MY (bukan full Sdn Bhd).
  - PDPA: server di Indonesia (data transfer clause di T&C), minimal personal data retention.
  - SST: revenue MY <RM500K = exempt. Monitor saat approach threshold.
  - Sdn Bhd + PDPA full compliance hanya kalau Phase 2 triggered.

### R11 · Product localization debt

- **P:** Medium · **I:** Low-Medium · **Severity:** 3/9
- **Thesis:** Quick-and-dirty MY localization (currency format, date, phone) tanpa proper i18n architecture → tech debt yang balloon kalau expand ke SG/TH.
- **Mitigasi:**
  - Invest di **proper i18n architecture** (next-intl or similar) di awal.
  - Extract strings ke locale files day 1.
  - Currency + date format via `Intl.NumberFormat` + `Intl.DateTimeFormat` dengan locale param.

### R15 · Supabase Mumbai PDPA adequacy + Bukku bank partnership moat (NEW — from research)

- **P:** Medium · **I:** Medium · **Severity:** 4/9
- **Two related risks surfaced by research agents:**

**R15a — Supabase Mumbai PDPA compliance gap:**
- CatatOrder current Supabase instance di Mumbai (India). India adequacy vis-à-vis MY PDPA **UNCONFIRMED** by MY Commissioner.
- Per PDPA 2024/2025 amendment, cross-border transfer butuh adequacy atau TIA (Transfer Impact Assessment).
- **Mitigasi:** Migrate MY user data ke **Supabase Singapore region** sebelum Phase 2 launch (engineering ~1-2 sprints).

**R15b — Bukku's bank partnership moat:**
- Bukku has UOB Business Banking (6-mo Pro free worth RM 1,080) + Funding Societies partnership (embedded lending, RM 1M facilitated by mid-2025).
- Ini 2-3 year partnership moats yang lebih formidable dari Orderla direct competition.
- **Mitigasi:** Phase 3 partnership play dengan Bank Islam / Bank Rakyat / BSN untuk match motion. Juga consider MDEC ecosystem partners.

---

## 4. Macro / External Risks

### R12 · MY SME digital adoption stall

- **P:** Low-Medium · **I:** High · **Severity:** 4-5/9
- **Thesis:** MY SME digitalization sudah slow (77% di basic stage). Kalau ekonomi MY memburuk atau subsidy program (SME Digitalisation Grant) berakhir, adoption bisa stagnan.
- **Signal:** SME Corp Digital Readiness Index menurun; MDEC cut subsidy; news about SME closures meningkat.
- **Mitigasi:**
  - Pricing yang accessible (RM19-39) tetap viable di recession.
  - Free tier generous — grab mindshare bahkan kalau bisnis tidak upgrade.
  - Monitor BNM + DOSM SME indicators quarterly.

### R13 · Geopolitical / FX risk

- **P:** Low · **I:** Medium · **Severity:** 2-3/9
- **Thesis:** IDR-MYR exchange rate fluctuate. Kalau rupiah crash, MY revenue lebih valuable (upside); kalau ringgit crash, MY revenue less valuable dalam IDR.
- **Mitigasi:**
  - Keep MY revenue di MYR account (Sdn Bhd kalau ada), reinvest locally.
  - Natural hedge: MY revenue cover MY operational cost (local hire, payment gateway fee).

### R14 · Meta / WhatsApp platform policy change

- **P:** Low-Medium · **I:** Critical · **Severity:** 4-5/9
- **Thesis:** Meta bisa:
  - Charge businesses per-message (sudah mulai di WABA)
  - Restrict third-party tools dari WA integrations
  - Launch native ordering tool yang compete langsung
- **Signal:** Meta Q/earnings calls mention "monetize business messaging"; policy update restrict API access.
- **Mitigasi:**
  - **Jangan 100% depend pada WA Cloud API.** CatatOrder sekarang pakai web-based sharing (wa.me links) — bukan API — jadi lebih resilient.
  - Build direct channel: web link (catatorder.my/slug), PWA, native app.
  - Diversify: SMS fallback, email, Telegram (bukan priority, tapi optionality).

---

## 5. Risk Heatmap

| Code | Risk | P | I | Severity | Priority |
|---|---|---|---|---|---|
| R3 | Distraksi pre-PMF ID | H | C | 9 | 🔴 #1 |
| R1 | TAM insufficient | M | H | 6 | 🟠 |
| R2 | Orderla defensive | M-H | H | 7 | 🟠 |
| R6 | CAC/LTV unhealthy | H | H | 7 | 🟠 |
| R7 | Ariff commitment | M | H | 6 | 🟠 |
| R8 | Multilingual burden | H | M | 5 | 🟡 |
| R4 | LHDN threshold drop | L-M | H | 4-6 | 🟡 |
| R12 | Digital adoption stall | L-M | H | 4-5 | 🟡 |
| R14 | Meta policy change | L-M | C | 4-5 | 🟡 |
| R9 | Payment gateway friction | M | M | 4 | 🟢 |
| R10 | Regulatory overhead | M | L-M | 3-4 | 🟢 |
| R11 | Localization debt | M | L-M | 3 | 🟢 |
| R13 | FX risk | L | M | 2-3 | 🟢 |
| R5 | Domain verification | ✓ | — | Solved | — |

---

## 6. Early warning system — 5 signals to watch

Kalau **2 dari 5** signal ini trigger dalam 3 bulan, **pause MY, reassess**:

1. **ID MRR stagnan 2 bulan berturut-turut** → PMF ID belum solid, jangan tambah kompleksitas
2. **MY user interview <10 dari 15 express WTP RM15+/bulan** → segmen Opsi B tidak valid
3. **Orderla.my release bookkeeping feature major update** → competitive window closed
4. **Ariff commitment drop >2 minggu** → no local presence = no MY entry
5. **CAC MY >RM600 setelah 3-month pilot** → unit economics broken

---

## 7. Go/No-Go decision framework

Setelah Phase 1 (6 bulan), evaluate dengan criteria:

| Criteria | Weight | Pass Threshold |
|---|---|---|
| ID PMF validated | 30% | MRR >IDR 30M, retention >80%, 50+ paying |
| MY WTP validated | 20% | 10/15 interviews confirm WTP RM15+ |
| Ariff commitment strong | 20% | Ariff delivered on 90-day goals, still engaged |
| CAC model healthy | 15% | MY CAC projection <RM300, payback <6mo |
| Competitive window open | 15% | Orderla not launched bookkeeping; Bukku not doubled down on micro |

**Score:**
- **>80%:** Go to Phase 2 (Sdn Bhd, paid pilot, Ariff → co-founder)
- **60-80%:** Extend Phase 1 by 3 months, revalidate
- **<60%:** Pause MY, consolidate ID

---

**Cross-references:**
- Strategic recommendation dengan phases → [09-rekomendasi.md](./09-rekomendasi.md)
- Positioning Opsi B detail → [07-positioning.md](./07-positioning.md)
- Kompetitor analisis → [03-lanskap-kompetitif.md](./03-lanskap-kompetitif.md)
