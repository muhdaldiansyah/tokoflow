# 07 · Decision Log

> Setiap keputusan strategis besar—dengan reasoning, alternatif yang ditolak, dan kondisi untuk revisit.

---

## Format Decision

Setiap decision punya:
- **ID + Title**
- **Tanggal diputuskan**
- **Konteks** (apa yang sedang terjadi)
- **Keputusan** (apa yang dipilih)
- **Reasoning** (kenapa)
- **Alternatif yang ditolak** (dengan alasan)
- **Kondisi untuk revisit** (kapan boleh dipertanyakan ulang)

---

## D-001 · Brand Tetap "Tokoflow" (lowercase)

**Tanggal**: 26 April 2026
**Konteks**: Diskusi panjang ttg apakah CatatOrder harus rebrand. User reveals tokoflow.com sudah dibangun sebagai Malaysia clone.

**Keputusan**: Tetap pakai "Tokoflow" sebagai brand utama. Lowercase preferred di digital (tokoflow), camelCase boleh di formal context (Tokoflow).

**Reasoning**:
1. `.com` domain sudah dimiliki—aset signifikan ($5K-50K value)
2. Pronounceable globally, tidak ada konflik phoneme aneh
3. "Toko" ada SEA flavor (warm), "Flow" universal English (smooth)
4. Brand strength comes from product strength, bukan naming sophistication
5. Apple wasn't "powerful name" di 1976—jadi powerful karena produk

**Alternatif yang ditolak**:
- "Toko" (single word)—terlalu generik, sulit trademark, SEO buruk
- "Sava" (made-up)—butuh build dari nol, tidak leverage existing
- "Lapak"—conflict dengan "Bukalapak" mental model
- "CatatOrder" untuk Malaysia—name terlalu narrow ("catat" = task-oriented), salah secara fundamental untuk vision baru

**Kondisi revisit**: Tidak akan revisit kecuali ada legal challenge atau brand damage event.

---

## D-002 · CatatOrder.id Maintenance Mode, Migrate Year 2

**Tanggal**: 26 April 2026
**Konteks**: Aldi domisili di Malaysia, tidak bisa actively work CatatOrder Indonesia. Existing user base CatatOrder sudah stagnan.

**Keputusan**: CatatOrder.id tetap live, maintenance mode (bug fixes only, no new features). Migrate ke Tokoflow Indonesia di Year 2 (sekitar 2028).

**Reasoning**:
1. Aldi physical di Malaysia → tidak bisa iterate-learn CatatOrder dari jauh
2. Cash flow CatatOrder bisa subsidize Tokoflow MY development
3. Bunuh CatatOrder sekarang = lose existing users + revenue
4. Migrate Year 2 saat Tokoflow MY proven → bawa product superior ke ID

**Alternatif yang ditolak**:
- Sunset CatatOrder sekarang—brutal, lose revenue + brand
- Hire Indonesia operator untuk active maintenance—overhead vs benefit tidak worth it Year 1
- Run kedua product paralel dengan effort sama—dilution, dilarang oleh research Aldi sendiri

**Kondisi revisit**:
- Year 2 (Q2 2028): evaluate apakah Tokoflow MY siap migrate ke ID
- Atau jika CatatOrder ID revenue drop signifikan (>30%) → consider faster sunset

---

## D-003 · Primary Market Year 1 = Malaysia (Hyperlocal Shah Alam)

**Tanggal**: 26 April 2026
**Konteks**: Aldi physical di Shah Alam Selangor. Ada partner lokal (Ariff Danial). Tokoflow infra MY sudah dibangun.

**Keputusan**: Malaysia primary, hyperlocal start di Shah Alam (segment: home F&B mompreneur). Bukan Indonesia, bukan global day 1.

**Reasoning**:
1. **Founder reality > theoretical optimization**: founder build di tempat mereka berada. Steve Jobs, Brian Chesky, Patrick Collison—semua start dari pasar lokal mereka.
2. Ariff sebagai distribusi anchor (warm intro) hanya bisa di-leverage di MY
3. Tokoflow.com infra MY sudah ada (compliance, payment Billplz, MyInvois)
4. LHDN window 2026-2027 = forced traction (Apple-grade vision dengan compliance built-in)
5. Hyperlocal pertama (50 merchants love), baru ekspansi konsentrik

**Alternatif yang ditolak**:
- Indonesia primary (TAM 30x lebih besar)—tapi Aldi tidak di sana, distribution lemah
- Global day 1—death sentence per semua precedent (bahkan Apple bertahap)
- Singapore primary—pasar terlalu kecil, kurang urgent
- Klang Valley luas day 1—belum ada PMF, terlalu broad

**Kondisi revisit**:
- End Phase 3 (Mar 2027): jika MY tidak achieve 500 paying → reassess
- Jika Indonesia opportunity yang besar muncul dan Aldi bisa relocate → reconsider

---

## D-004 · Vision = Apple-Grade Revolutionary, Bukan Compliance Wedge

**Tanggal**: 26 April 2026
**Konteks**: Tokoflow MY originally positioned sebagai "LHDN-ready WhatsApp storefront." User explicitly state vision Apple-grade revolutionary global.

**Keputusan**: Reposition Tokoflow dari "compliance wedge" → "Apple-grade selling layer with built-in compliance." Compliance jadi silent superpower, bukan hero.

**Reasoning**:
1. Compliance wedge = regional only (tidak scalable global)
2. Vision Apple-grade butuh universal need (selling), bukan regional need (LHDN)
3. Compliance silent = differentiator vs Linktree/Mayar/Wati yang tidak punya
4. Pricing tier Business (RM 99 with LHDN) jadi natural upsell

**Alternatif yang ditolak**:
- Compliance wedge sebagai hero—path B (lifestyle business 2-3 tahun, terbatas global)
- Buang compliance entirely—throw away $50K work + market urgency
- Build dua product paralel (compliance + visionary)—dilution

**Kondisi revisit**:
- End Phase 2 (Oct 2026): jika compliance feature drives >50% revenue → reconsider hero
- Jika LHDN policy berubah signifikan → reassess

---

## D-005 · Architecture: Web (Buyer Primary) + Mobile Native (Seller Primary)

**Tanggal**: 26 April 2026
**Konteks**: User questioned apakah perlu both web + mobile.

**Keputusan**:
- **Web app** (`tokoflow.com`): primary untuk buyer (link-first), secondary untuk seller (batch ops, desktop)
- **Mobile app native** (Tokoflow App, Expo): primary untuk seller (immersive, voice, haptic, push)
- **NEVER**: buyer mobile app

**Reasoning**:
1. Buyer harus zero install friction—web mandatory
2. Seller butuh immersive (camera, voice, push, haptic)—native superior
3. PWA tidak cukup untuk seller (iOS push notif unreliable, voice/haptic inferior)
4. catatorder-app sudah mature 70+ files—port saja, bukan rebuild

**Alternatif yang ditolak**:
- Web only (PWA)—immersive vision compromised
- Mobile only—buyer install friction = death
- Both with feature parity 100%—lambat ship, web jadi inferior mobile clone

**Kondisi revisit**:
- Jika PWA push notif technology mature signifikan → mungkin web alone cukup
- Jika mobile maintenance burden >25% effort → reconsider PWA-first

---

## D-006 · Initial Segment: Home F&B Mompreneur Shah Alam

**Tanggal**: 26 April 2026
**Konteks**: Need disiplin laser focus segmen awal.

**Keputusan**: Year 1 fokus laser pada **home-based F&B mompreneur Shah Alam** (kuih, kek, catering, takjil). Setelah dominasi (50 merchants in love), expand konsentrik.

**Reasoning**:
1. Pain paling akut (WA order explosion saat Ramadan/Raya)
2. Visual product = perfect untuk 1-photo onboarding
3. Network effect strong (mompreneur community dense, word-of-mouth fast)
4. Underserved oleh Bukku (accountant-heavy) + Orderla (broken)
5. Pricing power decent (RM 49-99/bulan worth it untuk merchant Rp 100-500jt/bulan turnover)
6. Seasonal urgency Ramadan 2027 = forced traction window 9 bulan dari sekarang

**Alternatif yang ditolak**:
- "UMKM Shah Alam" general—terlalu broad, tidak laser
- Online fashion reseller—segment good tapi less seasonal urgency
- Kopitiam/mamak—POS-heavy, beda kebutuhan
- B2B wholesale—different scale

**Kondisi revisit**:
- End Phase 1 (Jul 2026): jika 5 friendly merchants tidak resonate → reassess segment
- Setelah dominasi (Phase 3): expand ke fashion reseller, modest fashion, jasa

---

## D-007 · AI Tanpa Nama (Ambient, Bukan Persona)

**Tanggal**: 26 April 2026
**Konteks**: Diskusi apakah AI Tokoflow harus punya nama (mis. "Bunda," "Aira").

**Keputusan**: AI Tokoflow **tidak punya nama**. Ambient presence, bukan named persona.

**Reasoning**:
1. Apple Health tidak namanya "Hella," Apple Pay tidak namanya "Pay AI"
2. Naming = bikin user sadar "saya pakai AI" → lawan dari invisible
3. AI = part of Tokoflow's nature, bukan karakter terpisah
4. User tetap bisa address ("Tolong tampilkan...")—tapi tidak ada persona name

**Alternatif yang ditolak**:
- "Bunda" (caring mother)—terlalu specific, exclude segment laki-laki
- "Aira/Tia/etc"—butuh brand-build untuk persona, unnecessary effort
- Animated avatar—anti-Apple, terlalu game-like

**Kondisi revisit**: Jika user research menunjukkan named persona meningkatkan engagement signifikan → reconsider. Tapi default = no name.

---

## D-008 · 3-Tier Pricing (Free / Pro / Business)

**Tanggal**: 26 April 2026
**Konteks**: Existing CatatOrder pricing rumit (Rp 15K isi ulang, Rp 25K, Rp 39K, Rp 99K). Need simplify.

**Keputusan**: 3 tiers maksimum. Free / Pro RM 49 / Business RM 99 (MY). Equivalent untuk ID Year 2.

**Reasoning**:
1. Apple discipline: simple, clear, fair
2. 3 tiers = max yang bisa user comprehend dalam 5 detik
3. Compliance jadi reason upgrade ke Business (silent superpower)
4. RM 49 Pro = anchor 4 jam admin labor (clear ROI)

**Alternatif yang ditolak**:
- 5+ tiers (current CatatOrder)—confusing, paradox of choice
- Single tier (Stripe-style)—tidak ada wedge
- Per-transaction commission (marketplace model)—undignifying for merchants

**Kondisi revisit**: Annual review. Jika Free → Paid conversion <15% → reconsider tier value gates.

---

## D-009 · Anti-Linktree Positioning

**Tanggal**: 26 April 2026
**Konteks**: User asked apakah Tokoflow mirip Linktree.

**Keputusan**: Tokoflow positioning sebagai **kategori baru** ("Complete Selling Layer for Individuals"), bukan Linktree alternative. Marketing tidak compare ke Linktree di hero/landing. OK comparison di edukasi 1-on-1 atau press.

**Reasoning**:
1. Linktree = link aggregator. Tokoflow = complete selling experience. Beda kategori.
2. Compare ke Linktree = race to bottom (siapa lebih murah, lebih banyak fitur)
3. Apple way: tidak compare di marketing—show product, biar customer judge

**Alternatif yang ditolak**:
- "Linktree alternative for SEA"—too small ambition
- "Linktree but with shop"—category trap, undermine differentiation

**Kondisi revisit**: Jika Linktree expand ke complete selling experience (unlikely)→ reposition vs them lebih agresif.

---

## D-010 · Ariff Danial sebagai Local Partner (Tier TBD)

**Tanggal**: 26 April 2026
**Konteks**: User reveals Ariff Danial sebagai 1 friend MY untuk distribusi.

**Keputusan**: Formalize Ariff sebagai partner—tier (advisor 1-1.5% atau co-founder 5-10%) decided after kopi conversation. **Tidak treat sebagai casual referrer.**

**Reasoning**:
1. 1 partner = anchor distribusi Year 1, tidak boleh casual
2. Equity vest ensures committed engagement
3. 90-day deliverables konkret (interviews, testers, testimonials)
4. Ariff sudah dimention di research Malaysia Aldi (continuity)

**Alternatif yang ditolak**:
- Casual referrer—engagement collapse setelah 3-4 minggu
- Hire sebagai paid contractor—tidak align long-term incentive

**Kondisi revisit**: Setelah kopi conversation, decide tier formal.

---

## D-011 · Tagline: "From Snap to Sold"

**Tanggal**: 26 April 2026
**Konteks**: Need final tagline untuk hero landing page.

**Keputusan**: Primary tagline = **"From snap to sold."**

**Reasoning**:
1. Punchy, evocative, action-oriented
2. English-friendly untuk global ambition (MY English-comfortable)
3. Magic moment (foto → toko → terjual) jelas dalam 4 kata
4. Memorable, ownable

**Alternatif yang ditolak**:
- "Catat order rapi"—old CatatOrder tagline, anti-thesis vision
- "LHDN-ready WhatsApp storefront"—too technical, regional
- "All-in-one selling platform"—generic, anti-Apple
- "Toko, dalam satu foto"—Bahasa OK tapi kurang punchy untuk hero
- "Sell anything. Just snap."—almost as good, tetap di reserve untuk CTA

**Kondisi revisit**: A/B test setelah Phase 1 (5 merchants live). Jika alternate performs >30% better → switch.

---

## D-012 · Hyperlocal-First Distribution Strategy

**Tanggal**: 26 April 2026
**Konteks**: Diskusi geographic ekspansi.

**Keputusan**: Year 1 = 1 area (Shah Alam) dengan 50 merchants in love. Year 2+ ekspansi konsentrik (Klang Valley → Penang → SG → SEA → Western).

**Reasoning**:
1. Apple-grade move: hyperlocal first (Stripe model—Patrick Collison personal install)
2. 50 in-love > 500 mediocre
3. Word-of-mouth dalam community kecil = compounding
4. Brand jadi "Tokoflow itu yang dipakai semua mompreneur di Shah Alam" → status symbol lokal

**Alternatif yang ditolak**:
- Launch nationwide MY day 1—too thin
- Launch SEA day 1—dilution
- Klang Valley luas day 1—belum focused enough

**Kondisi revisit**: Setiap end Phase, evaluate apakah ready ekspansi konsentrik berdasarkan dominance metric.

---

## Decisions yang BELUM Diputuskan (Pending)

### P-001 · Tier Partnership Ariff (advisor vs co-founder)

**Status**: Pending kopi conversation dengan Ariff
**Decision date target**: Mei 2026 minggu 1

### P-002 · Bahasa Strategy Year 1 (English-only vs bilingual EN/BM)

**Status**: Tentative English-only Year 1 (per existing Tokoflow CLAUDE.md), BM Phase 4
**Decision date target**: Setelah Phase 0 interview—dengar preference merchant

### P-003 · Pre-Launch Beta Merchant Count Threshold

**Status**: Tentative 10 merchants in love sebelum public launch
**Decision date target**: Phase 1 milestone

### P-004 · MD Status Application Timing

**Status**: Tentative paralel dengan Sdn Bhd
**Decision date target**: Phase 0

### P-005 · Color Palette Final

**Status**: Tentative warm green retain (existing CatatOrder), refine dengan designer
**Decision date target**: Phase 1

### P-006 · CatatOrder Indonesia Migration Specific Timeline

**Status**: Tentative Year 2 Q2 2028
**Decision date target**: End Phase 4 (Dec 2027)

---

## Cross-references

- Why these decisions (philosophy): [`00-manifesto.md`](./00-manifesto.md)
- What we ship per phase: [`06-roadmap.md`](./06-roadmap.md)
- All other docs reference back here untuk reasoning

---

*Versi 1.0 · 26 April 2026 · Decisions log adalah memory institutional. Tidak ada keputusan yang dibuat tanpa dicatat di sini.*

**Update protocol**: Setiap major decision baru = create new D-XXX entry. Setiap revisit decision = update existing entry dengan revised section.
