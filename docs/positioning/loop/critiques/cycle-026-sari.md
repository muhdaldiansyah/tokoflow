# Cycle 026 — INTEGRATION_RED_TEAM critique (Mbak Sari, Bandung)

> Sari, 31, Bandung. Samsung Galaxy A14 (One UI 6) primary, Oppo A78 ColorOS 14 cadangan suami. Anak 3 tahun, suka megang HP. Nasi padang + es kepal + kue lebaran via WA + IG. ~70 pesanan/minggu peak Lebaran, 25-30 normal.
> Round ke-4 saya kasih kritik (cycle 14, 18, 22, sekarang 26). Yang sebelumnya saya bilang: "Cerita aja" terlalu Malaysia, MIUI/ColorOS bisa kill background, FAB bottom-center pegel, terlalu banyak section. Sekarang saya cek 3 dokumen arsitektur (021 UX, 024 Payment, 025 Workflow) dan jalanin **Sabtu pagi Lebaran rush** yang real. Aldi, dengerin baik-baik atuh — banyak yang pecah di seam-nya. ID bukan sekadar "MY dengan locale-id".

---

## Setup hari Sabtu (real, bukan demo)

Sabtu, 4 April 2026 (H-7 Lebaran). 14 pesanan kue masuk dari Jumat malam ke Sabtu pagi via WA. Saya bangun 05:30 subuh, masak sahur sisa, anak masih tidur. 06:45 Aira (3thn) bangun, minta susu. Saya kopi sambil mulai susun pesanan dari WA.

Tiga skenario yang saya jalanin pakai arsitektur kalian:

---

## Skenario A — Sabtu pagi 07:00–10:00 kue Lebaran spike

### A.1 — Notif DANA QRIS masuk

```
[lock-screen 07:14:33]
DANA · sekarang
"Anda menerima Rp 85.000 dari INA SETIAWATI"
```

OK ini bagus. Cycle 24 bilang `OVO_in: "Anda menerima Rp [\\d.,]+ dari ..."` — tapi **regex itu OVO bukan DANA**. DANA template asli: *"Dana Masuk Rp 85.000 dari INA SETIAWATI. Saldo: Rp ..."* atau *"Anda menerima transfer Rp 85.000 dari Ina Setiawati"* tergantung versi DANA app. Sari Setiawati bukan Ina kalau pakai full name vs nick. **Cycle 024 pattern matcher belum saya percaya** — Aldi kayaknya nyontek dari memory, bukan ngambil notif asli. Ini sev 8 spike Phase 0 wajib: minta 5 mompreneur Bandung kirim screenshot 30 hari notif DANA/GoPay/OVO/BCA/Mandiri/BRI/ShopeePay/Jago/Jenius, baru bikin regex. **Tanpa data real, regex coverage pasti <50% Day 1, dan claim-card yang dijanjikan ke Sari = ghosted.**

Tapi anggap regex jalan. Saya lihat lock-screen claim card 07:14:34. Aira lagi tarik lengan baju saya, tumpah kopi sedikit ke meja. Saya ngomong (jempol kanan masih basah lap kopi):

> *"Mbak Ina ambil 1 box kue lebaran, 85 ribu, antar Senin pagi"*

Pertanyaan 1: **lock-screen mic itu kerja gak waktu lock-screen lagi nampilin claim-card DANA?** Cycle 21 bilang *"Pegang untuk cerita"* itu long-press = mic. Cycle 22 saya udah complain MIUI lock-screen biasanya cuma 1-baris notif preview. One UI 6 (Samsung A14 saya) lebih ramah, tapi tetep — kalau widget mic Tokoflow + DANA notif tabrakan posisi lock-screen, **mana yang menang space?** Cycle 21 lock-screen layout punya *both* — mic widget di tengah + claim card di bawah. Sabtu rush, claim DANA bakal banyak (5-8 dalam 30 menit). Lock-screen overflow. **Sev 8 integration gap: cycle 21 dan cycle 24 belum disepakat siapa yang punya prime real-estate.**

Pertanyaan 2: **20 detik gap antara notif DANA dan voice "Mbak Ina"**. Cycle 24 fuzzy match scoring:
- Amount Rp 85.000 == voice "85 ribu" → +0.5
- Customer Levenshtein "INA SETIAWATI" vs "Mbak Ina" → string panjang vs nick. `levenshtein("INA SETIAWATI", "Mbak Ina") / max(13, 7) = 9/13 ≈ 0.69 → similarity 0.31` → contribution 0.31 × 0.3 = **0.09**, bukan match yang bagus
- Recent voice mention dalam 30 menit → +0.2 (tapi ini circular: voice mention-nya BARU, jadi ya jelas iya)
- Delivery window → "Senin pagi" 2 hari lagi, gak match payment timestamp → 0

**Total ≈ 0.5 + 0.09 + 0.2 = 0.79**. **Di bawah 0.85 threshold. Tidak auto-link. Surface as Now-card "claim?".**

Aing pikir... atuh ini masalah gede. Mompreneur ID pake nick name, KTP-name, full name campur. "Mbak Ina" = "Ina Setiawati" = "INA SETIAWATI" = "Bu Ina" — semua orang yang sama. **Levenshtein lurus akan miss 60% match.** Yang bener: tokenize, ambil first name token, fuzzy match itu doang. Atau pake embedding (sentence-transformer multilingual). Sev 9 fix: cycle 024 fuzzy-match algorithm tidak Indonesia-aware. Mompreneur Indonesia penyebutan nama variabel parah, jauh lebih variabel dari "Aishah/Aisyah" Malaysia kalian.

### A.2 — 5 menit kemudian, transfer Mandiri

```
[notif Samsung One UI]
Livin' by Mandiri · 07:19
"Transfer masuk Rp 150.000 dari TINI HASTUTI 
Ref: 8829..."
```

Cycle 024 punya `BCA_in` + `Maybank_MY_in` + `CIMB_MY_in` regex. **Tidak ada Mandiri, BRI, BNI, BTN, Jago, Jenius, Permata, Danamon, Bank Mega.** ID top 10 bank! Ini sev 9. Bukan oversight kecil — ini fundamental incomplete-ness. Mandiri Livin' notif format beda total dari BCA mobile. BRI BRImo lagi beda. **Pattern matcher cycle 024 untuk ID tidak akan kerja Day 1 untuk 70% mompreneur Indonesia** karena BCA bukan default-nya semua orang (banyak Mandiri-first di Bandung khususnya, BRI di kampung).

Lalu: di cycle 24 path 2 NotificationListener + path 5 voice-mention sebenarnya redundant kalo path 2 jalan. **Tapi kalo regex Mandiri belum ada, NotificationListener akan fallback ke Gemini Flash Lite vision** (cycle 24 line 112). $0.0001/notification × 30 notif/hari × 30 hari = $0.09/merchant/bulan. Itu LLM call cost, bukan biaya AI overall — tambah STT + LLM extract harian = mungkin RM 25/merchant masih on-budget. Tapi ini **engineering-internal cost**, customer experience-nya: lag 1.5-3 detik tiap notif untuk LLM disambig. Sabtu rush 8 notif dalam 5 menit = stuttering. Sev 7.

**Yang bikin saya khawatir lebih: cycle 24 line 251 ngeklaim "Avg 9.5/10. iOS-platform asymmetry is the only real deduction."** Bohong itu, atuh. Pattern matcher coverage ID = real deduction yang lebih besar dari iOS. Aldi over-confident di MY (Maybank/CIMB/Public Bank → 3 bank cover 70% market). Di ID: 10+ bank, 4+ e-wallet, harus semua coverage Day 1. Sev 8.

### A.3 — Bandung casual leak check di prompt (cycle 25 phase C1)

Saya baca prompt template cycle 25 baris 105-119:

> *"Kamu adalah ekstraktor commerce untuk mompreneur F&B Indonesia (CatatOrder). Kosakata domain (BI + Bahasa daerah optional): kue lapis, nasi padang, rendang, bika, gula, tepung..."*

OK BI sudah masuk. Tapi:

1. **"Bahasa daerah optional"** — too lazy. Bandung Sunda mix bukan optional, itu default casual. "Aing pesen tilu box kue, antar Senén isuk-isuk" — *tilu* = 3, *Senén isuk-isuk* = Senin pagi, *aing* = aku. Prompt harus eksplisit list Sunda numerals + time markers + pronouns supaya LLM bisa decode. Tanpa itu Sahabat-AI/Gemini Flash Lite akan misparse "tilu" jadi nama orang. Sev 7.

2. **Currency = Rp di prompt — bagus.** Tapi gak ada guard: "If user says RM, ASK before persisting" — kalo Aldi salah set market flag (ID merchant route ke MY prompt), prompt MY akan tulis `RM 240` ke DB seorang Sari. Hard-fail di akuntansi. Sev 8 — perlu currency-guard check post-extraction, bukan trust prompt.

3. **Time format**: prompt nggak nyebut "Asia/Jakarta WIB sebagai default; auto-detect WITA/WIT". Wait, baris 119 nyebut. OK. Tapi Bandung WIB. Catering saya pickup "Senin jam 8 pagi" — LLM harus tau jam 8 pagi = 08:00 WIB, bukan 20:00. Prompt sekarang trust LLM nge-handle. Risiko parser confusion. Saya butuh test data Indonesian voice-clip untuk WIB ambiguity sebelum trust ini.

4. **"kamu Aishah" leak check**: prompt ID nyebut nama Indonesian (Aishah disebut MY prompt). Tapi prompt belum punya negative anchor: *"NEVER write currency=MYR if market=ID. NEVER use BM-only words like 'tempah', 'pukul', 'kau'."* Tanpa negative anchor LLM bisa drift. Cycle 14 saya udah complain "boleh→bisa, pukul→jam, kau→kamu" — fix 016 udah ada. Tapi cycle 25 prompt belum eksplisit melarang BM keywords leak ke ID extraction. Re-leak risk sev 7.

**Skor skenario A:**
- Seamlessness ID-specific: **5/10** (DANA regex incomplete, Mandiri/BRI/BNI absent, Levenshtein name-match kacau)
- Multi-tasking under toddler: **6/10** (lock-screen lay-out overflow saat banyak notif)
- Anti-anxiety: **8/10** (signature pesta belum gamify, OK)
- Daily-use rhythm: **5/10** (Sabtu rush stuttering, Senin slow gak ada special handling — lihat skenario B)

---

## Skenario B — Voice misparse + sensitive correction (self-reference)

08:30 saya record:

> *"Bu Sari pesan 3 box, total seratus lima puluh ribu, antar Minggu sore"*

Ini Bu Saridah, tetangga komplek, customer regulars. Tapi YA NAMA SAYA Sari juga (kelahiran Setiawati Sari). Self-reference confusion. Saya jarang nyebut full "Saridah", biasanya "Bu Sari" panggilan kompleks.

Cycle 25 phase D1 disambiguation:

```
🔴 Aishah ke Aisyah?
   ↓
   [Modal sheet]:
     Aishah (last seen 3 days ago, 12 orders)
     Aisyah (last seen 2 weeks ago, 4 orders)
```

Untuk Sari case-nya beda. LLM extract: customer="Sari", confidence 0.92 (high karena nama jelas). Tapi merchant.profile.name = "Sari" juga. **Cycle 25 tidak punya guard "if extracted customer == merchant.own_name, force disambig regardless of confidence".** Jadi Now-pin nya:

```
▼ Now
  • Sari · 3 box · Rp 150.000 · 08:30
    pending payment
```

Saya lihat 5 detik lupa beli baby diapers, balik HP, pin ada nama saya sendiri. **Confused. App-nya bug? Self-order? Pelanggan beneran nama Sari?** Sev 8 self-reference disambig wajib hardcoded. Solusi: setiap LLM extract, kalau customer_name fuzzy-match ≥0.7 ke merchant.own_name → force 🔴 disambig modal: *"Maksud Bu Sari (Saridah, langganan) atau diri sendiri?"*

OK saya correct. Ngomong:

> *"Salah, itu Bu Saridah bukan aku"*

Cycle 25 phase H1 detection: prefix "salah" → CORRECTION intent. Phase H2 apply correction. **Tapi LLM correction extractor bisa misparse lagi**: target=last_order, field=customer_name, old="Sari", new="Saridah" — sering banget di test saya phrase "bukan aku" ditelan jadi part of new value: `new_value = "Saridah bukan aku"`. Sev 7. Prompt H2 perlu guard: strip pronouns + negation phrases dari new_value.

Lebih halus: **gimana phrase-nya kalau saya marah/frustasi correction?** "Aing salah ngomong, itu Bu Saridah weh" — Sunda interjection "weh" gak ada di prompt. LLM bisa parse "weh" sebagai stutter, atau jadi part of name "Saridahweh". Sev 7.

### Audit trail "respectful or surveillance-creepy?"

Cycle 25 H3: original extracted_json + user_corrections JSONB + diary timeline shows correction in-place + audit log accessible "View history". Aing pikir: **belum nge-feel surveillance, tapi tone-nya engineering-flavored.** "View history" kalau dibuka nampilin diff JSON? Itu creepy. Yang Sari mau: timeline soft "11:18 — saya betulin: Sari → Saridah". Bukan diff JSON, bukan timestamp UTC ISO. Manusiawi. Sev 6 (boundary, bukan blocker tapi muncul).

**Concern paling besar di skenario B**: cycle 25 H2 "patch the existing voice_note's extracted_json (don't create new entity)". Kalau saya correct 5 menit kemudian, fine. Tapi kalau correct 3 jam kemudian, sementara antara 0830 dan 1130 ada **payment Bu Saridah Rp 150k yang udah masuk DANA** (NotificationListener auto-link ke order salah-nama "Sari" tadi), reconcile-nya bisa double-count. Voice note correction patch nama, tapi payment_event masih punya match_confidence ke order original. **Sev 9 cascading correction integrity**: ketika voice_note di-patch, payment_events yang reference order itu harus di-recompute dengan nama baru, fuzzy match rerun. Cycle 25 phase E2 atomic transaction tidak handle re-cascade pasca-correction. Sev 9 architectural gap.

**Skor skenario B:**
- Seamlessness ID-specific: **6/10** (Sunda interjection + self-reference bug)
- Multi-tasking: **7/10** (correction phrase OK, balance acceptable)
- Anti-anxiety: **7/10** ("View history" view bisa creepy)
- Daily-use rhythm: **6/10** (cascade integrity broken weeks 2+)

---

## Skenario C — Toddler chaos + payment confusion

09:42. Saya naruh HP di meja kopi sambil ambil rendang dari panci. Aira (3thn) gerak cepat, ambil HP, long-press tombol home (One UI = Bixby maybe? atau swipe gesture). Layar hidup, dia liat icon Tokoflow yang kemarin saya pinned. Tap. App buka. Lock-screen widget mic = long-press. **Aira long-press di mana aja.** Mic on. Nge-record:

> *"aaaa mama mama mau cookie aaa"*

5 detik. Lepas tangan. Audio captured ke IndexedDB. Whisper-tiny on-device run di A14 (Snapdragon 685, 4GB RAM — slow). 8 detik LLM tuning. Sementara itu saya balik, GoPay notif masuk:

```
[09:42:20]
Gojek · sekarang
"Pembayaran Rp 45.000 dari RIO PRATAMA berhasil"
```

NotificationListener nyaplok, payment_event masuk. Reconciliation jalan: pending orders cocok? Tidak ada Rio Pratama dalam 48h. Score < 0.5. **Surface as unmatched payment Now-card: "Rp 45.000 dari Rio Pratama — claim?"**

09:42:30 saya ambil HP balik. Liat:

```
▼ Now
  • [🔴 Sari? Aisyah?] (8 pending orders today)
  • Rp 45.000 dari Rio Pratama — claim?
  • aaaa mama mama mau cookie aaa  [🔴 invalid]
  ▼ Today (8)
  ...
```

**Sekarang saya stress.** Ada noise voice note (pollute Now), claim card baru yang gak ada konteks (siapa Rio?), 8 pending. Aira masih narik baju. Toddler chaos = real. Cycle 25 phase D1 untuk noise-voice: **gak ada handling.** LLM extract output `{is_noise: true}` atau `confidence_overall: 0.05` — fine, tapi cycle 21 Now-pin algorithm gak ada exclusion rule "skip noise voice notes". Now-pin = "smart-derived: pending payments + today's pickups + briefing", tapi failed-extract voice_notes masuk juga? Spec ambiguous. Sev 8.

**Recovery path untuk noise voice note:**
- Long-press card → Delete? Cycle 25 gak nyebut.
- Voice "tarik balik" → Phase H2 UNDO intent. Tapi which one? Last 1? Last 5? Aira's noise + Rio's payment + 8 lainnya — "tarik balik" akan target last_voice_note = noise card. OK that works. Tapi kalau saya ngomong sambil panik "tarik balik tuh anak" — LLM bisa parse "tuh anak" jadi part of intent atau target. Sev 7.
- Trash/spam button per-card. **Tidak ada di cycle 21 spec**, FAB-only + tap-card. Sev 7 — recovery tidak dapat 1-tap.

**Recovery untuk Rio's payment:**
- Saya gak kenal Rio. Sabtu rush saya gak tahu siapa Rio. Cycle 24 line 87 "surface as Now-card 'claim Lina Rp 240.000? → top-3 candidate orders inline'" — kalau gak ada candidate orders >0.5 confidence, top-3 candidates apa? Random recent orders? Atau empty? Empty = saya gak punya petunjuk siapa Rio.

Kemungkinan: **Rio salah transfer ke saya** (tipikal ID, customer typo nomor rekening). Atau ini customer baru via WA yang belum nge-record voice. **Cycle 24 dan 25 tidak punya path "ini bukan punya saya, bouncer / refund / abaikan"**. Action options: Claim / [tidak ada]. Sev 8 architectural gap untuk unmatched-but-foreign payments. Need an explicit "Reject / Abaikan" action with note "saldo masuk tapi bukan order saya — perlu refund manual ke Rio?"

**Toddler chaos rate score**: kalau saya pakai app sehari-hari dengan Aira aktif, **3-5 noise voice/minggu** realistic. Cycle 21 Now-pin auto-pruning of noise voice belum di-spec. Bakal pollute Now-pin terus-terusan. Sev 8.

### Anti-anxiety preservation under chaos

Cycle 21 line 125-130:
- NO streak counters ✓
- NO badge progress ✓
- NO comparison metrics ✓
- YES gentle absence ✓

OK list-nya solid. **Tapi cycle 24's 3-sensory signature pada payment auto-link** — mainan suara + haptic + visual — kalau **8x DANA notif Sabtu rush**, sensory signature firing 8x in 30 menit = **achievement-flavored**. Pavlov-coded. Mompreneur akan mulai *suka* dengar chime ("ka-ching!" effect), then jadi anxious kalau hari sepi gak ada chime. **Itu gamification by accident.** Sev 8.

Solusi: throttle sensory signature. Pertama hari = full signature. 5 berturut-turut dalam 30 min = mute sound, keep haptic only. 10+ = mute haptic juga, visual pulse only. Atau: signature jadi quieter on rapid-fire — opposite of Pavlov reward. Cycle 25 F1-F3 spec belum punya throttling. Sev 8 anti-anxiety regression.

**Skor skenario C:**
- Seamlessness ID-specific: **5/10** (noise voice pollute Now, foreign payment no-action)
- Multi-tasking under toddler: **4/10** (recovery path missing)
- Anti-anxiety: **5/10** (rapid-fire signature = accidental Pavlov gamification)
- Daily-use rhythm: **5/10** (Lebaran rush 8x signature/30min stress, normal Senin sepi gak ada handling)

---

## Mechanism asymmetry — engineering-internal trivia atau felt experience?

Cycle 16/24 cluttering "BI structurally regulates QRIS notif templates → ID auto-classify higher accuracy than MY DuitNow". Klaim premium di cycle 24 line 251 "9.5/10".

**Aing pikir: itu HALF TRUE.** QRIS template **sebagian** standard, tapi:
1. **Bank-side notif beda dari e-wallet notif.** QRIS scan itu sebenernya backend rail; UI notif depan bisa beda format. BCA mobile QRIS notif: *"Telah diterima IDR 85,000 dari INA SETIAWATI Ref/Kode 882..."* — itu bank-format BCA, bukan QRIS-rail-format. DANA app: *"Anda menerima Rp 85.000 dari Ina Setiawati"* — DANA-format, gak ada Ref/Kode. **Beda 2 template padahal sama-sama "QRIS payment"** karena ditampilin oleh app yang beda.

2. **BI regulasi** di backend message structure (ISO 8583 / NACS), bukan di consumer app push notification text. App developer DANA/GoPay/BCA mobile kebebasan tweak copy. Dapat update OS, copy bisa berubah. **Mechanism asymmetry overstated.**

3. Felt experience-nya: untuk Sari, **gak peduli mechanism asymmetry, peduli accuracy actual.** Kalau MY 70% accuracy karena 3 bank doang dan ID 60% accuracy karena 10 bank padahal "regulated", merchant ID dapet pengalaman lebih buruk dari MY. **Cycle 24 line 251 9.5/10 score is MY-biased.** Sev 8 honest re-score: ID = 7/10 actual after pattern coverage gap.

**Aldi: stop bilang ID lebih mudah karena BI regulation. Bilangin: "ID mechanism = 10 bank pattern matchers wajib Day 1; MY mechanism = 3 bank pattern matchers Day 1." Itu lebih jujur, dan engineering effort untuk ID = 3x MY. **Itu real cost untuk Wave 2 ID launch yang harus di-budget Phase 0.** Sekarang cycle 12 / 16 / 24 narasi "ID lebih easy karena BI" itu budget-trap.

---

## Sev ≥7 integration boundary issues (ringkas)

| # | Severity | Boundary | Issue |
|---|---|---|---|
| 1 | 9 | C24 → C25 cascade | Voice correction patch tidak re-cascade ke payment_events fuzzy-match — payment can stay linked to old-name order |
| 2 | 9 | C24 ID coverage | Pattern matchers Mandiri/BRI/BNI/BTN/Jago/Jenius/Permata absent; only BCA listed. Day 1 ID coverage <40%. Phase 0 spike wajib pakai 5 mompreneur Bandung sample notif 30 hari |
| 3 | 8 | C24 fuzzy match | Levenshtein lurus tidak handle ID name variants ("INA SETIAWATI" vs "Mbak Ina" vs "Bu Ina"). Tokenize first-name + embedding wajib |
| 4 | 8 | C25 self-reference | Customer == merchant.own_name not force-disambig regardless of confidence. Sari/Saridah collision real |
| 5 | 8 | C21 ↔ C24 lock-screen | Sabtu rush 5-8 claim cards + mic widget = lock-screen overflow. Prime-real-estate priority not specified |
| 6 | 8 | C25 noise voice handling | Now-pin algorithm allows noise voice_notes to surface; pollutes feed during toddler chaos. No auto-prune rule |
| 7 | 8 | C24 unmatched foreign payment | No "Reject / Abaikan / This is not mine" action. Stuck-claim state for typo-transfer scenario |
| 8 | 8 | C24/25 currency guard | Prompt has Currency=Rp but no post-extract guard "reject if currency=MYR for ID merchant". Mis-route market = corrupt DB |
| 9 | 8 | C25 sensory signature throttling | 8x rapid-fire chime in 30 min = accidental gamification. Anti-anxiety violation. F1-F3 needs rate-limit |
| 10 | 8 | C24 cycle-251 score | "9.5/10 ID" overstated — bank diversity in ID = 3x MY, accuracy 7/10 actual. Mechanism asymmetry narrative misleading |
| 11 | 7 | C25 Sunda casual prompt | "Bahasa daerah optional" lazy. Need explicit Sunda numerals (hiji, dua, tilu, opat) + interjections (weh, atuh, euy) + time markers (isuk-isuk, peuting). Bandung is largest ID market for kue Lebaran |
| 12 | 7 | C25 BM keyword leak guard | Prompt ID lacks negative anchor against BM keywords (tempah, pukul, kau). Re-leak risk |
| 13 | 7 | C25 H2 correction parser | "bukan aku" / "weh" interjections leak into new_value field. Phrase guard needed |
| 14 | 7 | C21 noise card recovery | No 1-tap delete / dismiss on noise voice card. FAB+tap only insufficient |
| 15 | 7 | C24 cost stuttering | Gemini Flash Lite vision fallback for un-regex'd notif = 1.5-3s lag per notif. 8x in 30 min = visible UI stutter |
| 16 | 7 | C25 audit trail tone | "View history" presents diff JSON / UTC timestamps. Engineering-flavored, not warm. Need humanized timeline rendering |

**16 sev ≥7 integration issues** at cycles-21+24+25 boundary. Aldi, ini lebih banyak dari cycle 22 yang juga 14. Berarti integration belum solid. Cycle 28 SYNTHESIS wajib address semua.

---

## Fix directions

### Phase 0 spike additions (sebelum lock convergence)

1. **Notif corpus collection**: 5 mompreneur Bandung × 30 hari × screenshot semua incoming-payment notif (DANA, GoPay, OVO, ShopeePay, BCA mobile, Mandiri Livin', BRI BRImo, BNI Mobile, Jago, Jenius). Target 1000+ notif samples. Build regex from real data, bukan memory. **2-week task before cycle 28.**

2. **Fuzzy-match algorithm bench**: 50 ID merchant orders dengan nama variant. Levenshtein vs token-first-name vs embedding (multilingual MiniLM). Pick mechanism with >85% recall on real data. **1-week task.**

3. **Sahabat-AI ID extraction accuracy**: 100 voice clips (BI + Sunda mix + BI dengan harga "ribu/rebu/k" variant + waktu "isuk/pagi/jam 8"). Compare Gemini Flash Lite vs Sahabat-AI. **1-week task.**

### Architectural fixes (cycle 28 SYNTHESIS must fold)

A. **Cascading correction**: voice correction → patch voice_note → recompute all reference payment_events fuzzy-match → if any payment_event match invalidated, revert auto-link to "claim?" state. Atomic transaction wrap.

B. **Self-reference disambig**: hardcoded rule — if extracted customer_name fuzzy ≥0.7 to merchant.own_name → force 🔴 disambig modal "Bu Sari (langganan) atau diri sendiri?".

C. **Lock-screen real-estate priority**: claim card priority >> mic widget when ≥1 unclaimed payment in 30 min. Mic widget collapse to small badge. When all paid/claimed, mic widget expands back.

D. **Noise voice auto-prune**: confidence_overall < 0.3 OR transcript matches noise pattern (length <2 words AND no recognizable entity) → voice_note flagged `is_noise=true`, excluded from Now-pin, retained in diary feed greyed-out. 1-tap dismiss available.

E. **Reject foreign payment action**: payment_events Now-card gets 3 actions: Claim / Bukan Saya / Refund Pengirim. "Bukan Saya" marks payment_event status='foreign' + suggests user contact bank for reversal. Diary records as informational entry.

F. **Currency post-extract guard**: after LLM extract, if extracted.currency != merchant.market.currency → reject extraction + log market-misroute alert. Force re-extract with correct prompt.

G. **Sensory signature throttle**: rate-limit 3-sensory signature to max 1 full-signature per 90s, 1 haptic-only per 30s, 1 visual-only per 10s. Beyond that = silent. Especially during detected lunch-rush state.

H. **ID prompt enrichment**: add to cycle 25 prompt:
- Sunda numerals: hiji=1, dua=2, tilu=3, opat=4, lima=5, genep=6, tujuh=7, dalapan=8, salapan=9, sapuluh=10
- Sunda time: isuk-isuk=pagi, beurang=siang, sore=sore, peuting=malam
- Sunda interjections (ignore as filler): weh, atuh, euy, geuning, atos
- Manglish-equivalent for ID: "ribu" / "rebu" / "k" / "rb" all = thousand multiplier
- Negative anchors: NEVER output currency=MYR; NEVER use "tempah/pukul/kau"; NEVER output state=Selangor
- Self-reference guard: if customer_name matches merchant.own_name → output `disambiguation_required: true`

I. **ID Demo #2 honest-rewrite**: cycle 16 current-best.md Demo #2 says "BI regulation creates standardized SMS templates" — refresh to honest: "ID mechanism = more banks/wallets so more pattern matchers, more LLM fallbacks during bootstrap, but Day 90+ post-corpus = same magic. ID is not 'easier than MY' — it's 'differently complex'." Honest positioning > false-flatter.

J. **Audit trail humanize**: replace JSON diff view with timeline narrative render: "Kamu betulin 11:18 — Sari → Saridah" not `{old: "Sari", new: "Saridah", ts: "2026-04-04T04:18:00Z"}`.

---

## Pesan terakhir untuk Aldi

Aldi, aing kasih tau jujur: **Indonesia bukan Malaysia dengan locale berbeda.** Kalau lo treat ID sebagai Wave 2 afterthought yang "tinggal swap currency + locale + Sahabat-AI", lo bakal kena hard di Q1 2027 launch CatatOrder. Bank diversity 3x MY. Name variation pattern 5x MY. Sunda/Jawa/Batak campur BI = 4x prompt complexity. Toddler reality (most ID mompreneur ada anak balita di rumah) = recovery path harus iron-clad. Anti-anxiety di ID lebih sensitif karena Shopee/Tokopedia gamification trauma sudah baked in — apalagi accidental Pavlov dari sensory signature kalian bakal stand-out.

3 dokumen kalian solid arsitektur, tapi **boundary antara 21+24+25 belum direview dari ID end-user lens.** Yang aing temuin barusan = 16 sev ≥7. Itu bukan "polish later", itu **structural — kalau gak fix sebelum convergence, CatatOrder Wave 2 launch akan kelihatan setengah-jadi vs Tokoflow MY yang polished.**

Untungnya semua bisa fix di cycle 28 SYNTHESIS kalo Aldi ngomong jujur "ID is differently complex, not easier" dan budget engineering effort 2-3x lebih besar daripada MY. Jangan over-anchor ke bisnis case "biar Aisyah happy doang"; budget Sari juga.

Aing in — kalo cycle 28 fix 16 ini, aing bakal demo CatatOrder ke ibu komplek Bandung. **Tanpa fix, aing gak bakal demo. Itu honest.**

— Sari · Bandung · Sabtu 4 April 2026 jam 22:14 WIB (anak udah tidur, akhirnya bisa nulis ini)

---

**Skor agregat 4-dimensi:**

| Dimension | Skor | Catatan |
|---|---|---|
| Seamlessness ID-specific | **5.3/10** | Pattern coverage gap dominates |
| Multi-tasking toddler interrupt | **5.7/10** | Recovery path absent |
| Anti-anxiety preservation | **6.7/10** | Sensory throttle missing → accidental Pavlov |
| Daily-use Sabtu rush + Senin slow | **5.3/10** | Rush stuttering, slow no special-case |

**Avg: 5.75/10** untuk integration. Cycle 28 must lift to ≥8 across all 4 sebelum CONVERGE-ulang.
