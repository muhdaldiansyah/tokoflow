# Cycle 026 — INTEGRATION_RED_TEAM (Bu Aisyah)

> Persona: Bu Aisyah, 34, Shah Alam. Nasi lemak + kek lapis, ~50 orders/week, baby-on-hip MIUI Redmi Note 12. Same voice that called out scroll-to-source friction (cyc 2), FAB thumb-zone (cyc 6), quiet-hours auto-pin pressure (cyc 14), MIUI battery-saver killing notifications (cyc 18, 22).
> Reading: cyc 21 UX-C (adaptive zoom) + cyc 24 payment (5 paths) + cyc 25 workflow (capture → STT → LLM → confidence → persist → signature → side effects → corrections → offline).
>
> **Verdict in one line: cantik atas kertas, tapi sambungan antara dia masih bocor di 7 tempat. Kalau Aldi ship macam ni, hari Rabu pukul 12 tengahari aku akan bagi balik HP dengan tangan berminyak dan cakap "Aldi, app kau halau aku."**

---

## Scenario A — Lunch rush 11:30, 18 orders, baby menangis

### Apa yang patut jadi (ikut docs)

T+0 — Kak Ros voice note in WA. Aku long-press → Share → Tokoflow. Cyc 25 A2: share_received (audio). STT Whisper-tiny 3-7s. LLM 800ms-2s. Card materialize, 3-sensory signature fire. Now pin updated dengan "Kak Ros · 3 nasi lemak · 12:30 pickup · pending payment".

T+90s — Nazri datang, cash. Aku tap mic FAB, cakap "Nazri ambil 5 nasi lemak, tunai RM 50". Cyc 24 Path 1. Card siap, signature fire kali kedua.

T+210s — DuitNow QR notif: "DuitNow QR — RM 27.00 from FATIMAH BINTI ABDUL". Cyc 24 Path 2 NotificationListener tangkap. Cyc 25 A3 skip STT/LLM. Reconciliation engine. Tapi takde order RM 27 pending — Fatimah baru — confidence rendah → surface as Now-card "claim RM 27.00 dari Fatimah?". Signature fire kali ketiga.

T+420s (7 minit aku tak buka app) — aku buka app, milk dah tumpah, skrin licin. Aku lap baju, tengok Now pin.

### Mana aku tergelincir (severity dengan score)

**[SEV-9] Share → Tokoflow untuk WA voice note tu — flow ni belum disahkan dan dia BEZA dari capture biasa.**

Cyc 25 A2 cakap "share_received (text or image)". Voice note WA tu BUKAN text, BUKAN image — dia .opus audio file. Cyc 24 Path 4 cover image (vision LLM). Path 1 cover voice mic FAB (Whisper-tiny on-device). Tapi voice note dari WA — nak masuk pipeline mana? STT on-device boleh proses .opus? Atau kena upload ke server Whisper-large?

Kalau on-device, latency 3-7s tapi MIUI Redmi Note 12 aku tu Snapdragon 685, RAM 6GB, Whisper-tiny boleh ambil 10-15s untuk clip 20 saat. Selama 15 saat tu aku tengok apa? Cyc 25 D1 takde keadaan untuk share-target audio. Card placeholder confidence chip "🛜 sync pending"? Tapi aku ONLINE — bukan offline. Confidence chip color kena beza.

**Fix direction**: cyc 24 Path 6 baru (atau extend Path 4) — "WA voice forward". Spec: terima .opus dari Share Sheet → upload server (Whisper-large lebih accurate untuk audio mampat) → sambung pipeline LLM extract → optimistic placeholder card "📥 Kak Ros tengah didengar..." (BUKAN "🛜 sync pending" — keliru). Atau tegaskan dalam doc: WA voice fallback ke on-device Whisper, tunjuk progress bar real bukan placeholder kosong.

**[SEV-8] 3 signature dalam 7 minit semasa baby menangis = sensory overload di ear yang dah penat.**

Cyc 25 F2 cakap chime 0.3s spike. Cyc 21 criterion 5 puji "sensory continuity 10/10". Tapi continuity DAN frequency dua benda berbeza. 18 order lunch rush = potentially 18 chime + 18 haptic dalam 90 minit. Tambah baby crying, tambah customer cakap depan muka, tambah notif WA dari pelanggan lain — chime jadi noise bukan signature.

Cyc 25 I2 batched-sync ada throttle "one signature per second" tapi tu untuk offline reconnect je. Online lunch rush takde throttle.

**Fix direction**: cyc 21 scene-aware lunch rush mode (5+ captures dalam 30 min) — TURUNKAN signature ke visual-only + haptic light, drop chime audio. Atau gabung beberapa signature jadi satu "rush summary chime" setiap 5 minit. "Felt absence of work" tu jadi anxiety amplifier kalau bunyi 18 kali. Bayi bangun tu cost real — RM 0 in feature spec, RM 50 in lost order time semasa aku pujuk dia balik tidur.

**[SEV-8] "Tap a Now card scrolls to its source voice note in chronological feed" — semasa lunch rush, scroll = tangan kedua.**

Cyc 21 mechanism para 60: "Tapping a 'Now' card scrolls to its source voice note in the chronological feed". Aku ada satu tangan. Sebelah lagi pegang baby. Bila aku tap card Kak Ros nak edit (sebab dia just whatsapp "Aisyah maaf tukar ayam jadi sotong"), Now scroll ke source voice note 7 minit lalu — sekarang aku kehilangan Now pin (dah scroll jauh). Nak balik atas, scroll lagi.

Cyc 2 aku dah complain pasal "scroll-to-source friction" — refinement sepatutnya guna **inline expand atau sheet modal**, bukan scroll. Cyc 21 still pakai scroll. Belum ditangani.

**Fix direction**: card tap = bottom sheet modal (peek 60%, swipe up untuk full). Scroll-to-source jadi long-press, bukan tap. Tap = edit. Long-press = navigate (untuk power user yang mencari context). Default semua orang tak nampak source — aku tak peduli source voice note 7 minit lalu, aku peduli order Kak Ros yang sekarang.

**[SEV-7] Confidence chip 🟢🟡🔴 takde untuk payment_event — keliru bila Fatimah surface tanpa label.**

Cyc 25 D cover voice→entity confidence routing. Cyc 24 surface payment "claim?" Now card. Tapi cyc 24 takde 🟡 vs 🔴 distinction — semua "low-conf" jadi sama-sama "claim?". Aku tengok 3 Now cards: Kak Ros 🟢 (paid pending pickup), Nazri 🟢 (paid cash), Fatimah ❓ (RM 27 unmatched). Visual hierarchy kabur. Kalau Fatimah punya score 0.4 (mungkin match dengan order Faridah RM 27 last week), tu BERBEZA dari Fatimah punya 0.0 (tiada candidate langsung). Cyc 24 cuma cakap "surface_with_candidates (top 3)" vs "surface_unmatched". UI render sama.

**Fix direction**: chip untuk payment-event:
- 🟢 auto_linked (>0.85)
- 🟡 surface_with_candidates ("Fatimah RM 27 — match 2 order? tap nak pilih")
- 🔴 surface_unmatched ("RM 27 dari Fatimah — tak jumpa order. Reserve atau buang?")

Color konsisten dengan voice extraction confidence. Sekali tengok aku tahu severity.

### Score Scenario A (0-10)

| Dimension | Score | Catatan |
|---|---|---|
| Seamlessness across surfaces | 5 | WA→share (1), mic FAB (2), notif listener (3) = 3 tempat masuk berbeza dengan UX yang berbeza. Sambungan ada border. |
| Cognitive load while overwhelmed | 4 | 3 signature + scroll-to-source + tangan licin = aku letak HP dan ambik kertas |
| Trust under failure | 6 | Voice WA share unspecified. Aku tak tahu app dengar Kak Ros ke tak |
| Daily-use across all 3 scenarios | 5 | Hari Rabu macam ni 5 hari seminggu. Kalau pattern ni kekal, aku akan turun semula ke Maybank app + buku |

---

## Scenario B — "Pak Ariff RM 250" tapi maksud RM 25

### Apa yang patut jadi (ikut docs)

T+0 — Aku voice mic: "Pak Ariff dah bayar transfer RM 250 Maybank". Cyc 24 Path 5 voice-mention. Cyc 25 D2 money-event 2-second confirm — "🟢 RM 250 · transfer". Aku dah laju, tak nampak 2-saat pulse. Tap continue, signature fire, Now pin updated.

T+30 minit — aku tengok Now: "Pak Ariff · RM 250". Eh, RM 25 lah. Cyc 25 H1 detect prefix. Aku voice: "Salah, Pak Ariff RM dua puluh lima". Cyc 25 H2 patch. Mini-signature subdued 0.5s.

### Mana aku tergelincir

**[SEV-9] Voice correction "Salah, Pak Ariff RM dua puluh lima" — LLM target last_aishah_order tapi takde "Aishah" dalam utterance. Target = last Pak Ariff entry — tapi macam mana kalau Pak Ariff ada 3 order pending? Last by timestamp? Last by relevance? Doc tak cakap.**

Cyc 25 H2 contoh: target=last_aishah_order. Itu sebab utterance ada "Aishah". Utterance aku ada "Pak Ariff" — match. Tapi kalau aku cakap "Salah, RM dua puluh lima" je, takde nama, target = last money-event aku? Last edited entity? Cyc 25 H1 cuma listed prefix detection, bukan resolution rules.

Real-world: aku memang malas sebut nama dalam correction — "Salah, dua puluh lima" je. Kalau LLM target salah entity (mungkin Nazri yang kebetulan masuk lepas tu RM 50 — patch jadi RM 25 untuk Nazri pulak), aku rosak 2 order, bukan 1.

**Fix direction**: correction MUST require explicit reference. Kalau utterance takde nama atau identifier, prompt "Yang mana? Pak Ariff RM 250 ke Nazri RM 50?" — bottom sheet pilih. Kalau ada nama tapi multiple match, sama. Implicit "last" = anti-pattern, terlalu ambiguous.

**[SEV-9] WA reply auto-draft pre-populated dengan RM 250 — selepas correction, draft tu reset atau stale?**

Cyc 25 G1: "construct deeplink: wa.me/{customer.phone}?text={url_encoded_message}" — present in card UI as [Send WA receipt] button. Doc tak sebut apa jadi pada deeplink lepas correction.

Skenario: aku dah tap [Send WA receipt] sebelum sedar salah. WA buka pre-populated "Total: RM 250". Aku takut, close WA tanpa send. Lepas 30 minit, aku correction voice. Lepas tu — kalau aku tap [Send WA receipt] semula, nampak RM 25 ke RM 250?

Atau lebih teruk: aku TIDAK perasan pre-populated salah. Aku tap Send dalam WA. Pak Ariff terima "RM 250" via WA, aku terima RM 25 cash, aku correction app, tapi WA dah hantar "RM 250" ke Pak Ariff. Pak Ariff confused. Aku perlu hantar message kedua minta maaf, ralat. Trust transfer broken di customer side, bukan app side.

**Fix direction**: deeplink construct mesti realtime (bukan cached) — setiap kali tap [Send WA receipt], regenerate dari current state. Kalau message dah dihantar (track via "receipt_sent_to" event), tunjuk warning "Receipt RM 250 dihantar 11:32. Hantar pembetulan?" — generate text correction message: "Salah pula. Total betul: RM 25. Maaf ya 🙏". User tap untuk hantar. Refuse-list compliance maintained (user tap, app tak auto-send), tapi ada safety net untuk correction propagation.

**[SEV-8] Reconciliation re-match selepas correction — kalau payment event dari Maybank notif RM 250 dah link, lepas correction RM 25, link masih wujud?**

Scenario: bila Pak Ariff transfer betul RM 25, MaybankSMS atau MaybankApp notif fire "Credit RM 25.00 from ARIFF". Cyc 24 reconciliation engine cari pending order yang match RM 25 — voice-mention yang aku cakap "RM 250" punya order awal taklah match. Tapi LEPAS aku correction kepada RM 25, order tu jadi pending RM 25, dan Maybank notif RM 25 BARU pada T+45min match. Best case.

Tapi kalau Maybank notif RM 250 (ada TYPO from Pak Ariff ikut suara aku — sebenarnya Pak Ariff tidak hantar 250, dia hantar 25, voice notif aku salah), tiada notif fire. Order tetap unpaid sehingga aku correction. Bila aku correction, status revert ke pending_payment? Atau langsung masuk paid?

Cyc 24 doc cakap voice-mention Path 5 = "amount parsed from voice content" — aku declare paid sendiri. Bila correction, struktur "voice_note edit" — tapi payment_event row dah dicipta. Patch the payment_event amount field? Atau cipta payment_event baru dengan reverse?

**Fix direction**: payment correction = create reversal payment_event (negative amount RM -250, reason="user_correction") + new positive payment_event (RM 25). Audit trail clear. Reconciliation engine kemudian boleh re-match new payment_event RM 25 against open orders. UI hide reversal pair dari diary chronological (audit-only via long-press history). Kalau kemudian Maybank notif benar-benar masuk RM 25 dari Pak Ariff, dia sees existing voice-payment RM 25 already linked — duplicate detection (same amount + same sender + within 10 min) auto-skip.

**[SEV-7] Mini-signature lepas correction — visually obvious yang ada perubahan?**

Cyc 25 H2 cakap mini-signature subdued 0.5s + card UI shows "edited 11:18 (was 5)". Cyc 21 criterion 5 cakap signature "IDENTICALLY for every entity creation". Correction = NOT creation. Sub-signature 0.5s vs full 1.5s = perceptual difference subtle.

Real-world: kalau aku correction semasa lunch rush dengan baby crying, mini-signature 0.5s tak naik dalam attention. Aku tak akan sedar correction berjaya. Tiada confirmation, aku akan voice lagi sekali. Double-correction, sekarang RM 25 jadi RM 0 (kalau LLM interpret "dua puluh lima" sekali lagi as delta?).

**Fix direction**: correction signature MESTI distinct (different chime tone — minor third bukan major), HAPTIC double-tap (vs creation single-tap), VISUAL diff badge "✏️ edited" yang persist 5 saat (bukan 1.5s) atas card. Dan slip toast bawah "Pak Ariff: RM 250 → RM 25 ✓ Tarik balik?" dengan undo button untuk 10 saat.

### Score Scenario B (0-10)

| Dimension | Score | Catatan |
|---|---|---|
| Seamlessness across surfaces | 4 | Voice correction → DB patch → WA draft → reconciliation, semua kena update tapi rules tak spec'd. Border merentang 4 surface. |
| Cognitive load while overwhelmed | 5 | 30 minit kemudian aku perasan typo, aku perlu trust voice correction kerja betul-betul |
| Trust under failure | 3 | Kalau WA dah hantar receipt RM 250, aku tak boleh fix dari app — kena pesan kat Pak Ariff manually. Trust transfer rosak |
| Daily-use across all 3 scenarios | 5 | Money typo lazim. Kalau correction tak feel safe, aku akan revert ke double-check setiap entry — slow |

---

## Scenario C — Offline pasar 13:30, 4 voice + 1 payment, sync 14:00

### Apa yang patut jadi

T+0 to T+20min — aku di pasar Shah Alam, signal mati. Voice 4 order:
1. "Mak Cik Sue 2 nasi lemak ayam, hantar 14:30, tunai"
2. "Pak Lim 1 kek lapis hari Sabtu, deposit RM 30 transfer"
3. "Aishah 4 nasi lemak telur, ambil 15:00"
4. "Kak Yati 1 nasi lemak rendang, sekarang ambil, RM 8 tunai"

Cyc 25 I1 capture works always. Whisper-tiny on-device fire. Card placeholder "🛜 sync pending". 4 voice notes queued.

T+10min (semasa offline) — DuitNow notif fire (MIUI Notification Listener tetap tangkap walaupun offline — local cache). Notif: "DuitNow QR — RM 30.00 from LIM CHEE KEONG". NotificationListenerService capture. Cyc 24 Path 2.

Tapi RECONCILIATION engine kena run server-side (cyc 25 E2 atomic transaction = INSERT INTO orders + payment_events + reconciliation). Server tak available. Engine queued.

T+30min — signal balik. Cyc 25 I2 sync. Queue process 4 voice + 1 payment_event.

### Mana aku tergelincir

**[SEV-9] Reconciliation race condition: payment_event timestamp T+10, voice-note Pak Lim deposit timestamp T+5. Order untuk Pak Lim wujud BEFORE payment event? Order belum di-extract LLM (sync queue). Server pertama proses payment_event (timestamp T+10) sebelum LLM extract Pak Lim voice-note (timestamp T+5)?**

Order matter. Cyc 25 I2 cakap:
```
queue.process():
  for each pending voice_note:
    POST to /api/extract
    receive entity JSON
    update voice_note row, materialize entities, reconcile payments
```

Dia loop voice_notes. Tapi payment_event NotificationListener dah ada di local cache, BUKAN voice_note. Mana sequence dia? Doc tak spec urutan voice_notes vs payment_events sync. Kalau parallel, race. Kalau payment_events pertama (sebab atomic insert lebih mudah, takde LLM call), dia tak match Pak Lim (order Pak Lim belum exist) → surface_unmatched. Lepas voice_notes 4 process, Pak Lim order wujud, tapi payment_event RM 30 already marked unmatched. Tiada re-reconciliation.

**Fix direction**: sync queue mesti single linearizable timeline by `created_at`. Process by timestamp ascending, regardless of source. AND lepas semua voice_notes diextract, run reconciliation pass kedua untuk semua payment_events status='surface_unmatched' dalam tempoh sync (last 30 min). "Re-reconcile after extraction batch" = workflow doc kena tambah ini.

**[SEV-9] 5 signature dalam 2 saat — cyc 25 I2 throttle "one per second" — jadi 5 saat berturut-turut bunyi chime sebab sync. Aku di pasar tepi orang ramai. Aku malu. Atau lebih teruk, aku confused — 5 chime tu untuk 4 voice + 1 payment? Atau sebahagian gagal?**

Throttle "one per second" maksud 5 chime selama 5 saat — sembang fire-fire-fire. Pasar Shah Alam ramai, aku letak HP atas keranjang. Bunyi chime macam tukang kupas bawang. Orang pandang.

Lebih besar: 5 chime tak bagi tahu apa yang berlaku. Apa beza signature 1 vs signature 5? Semua sama. Cyc 21 criterion 5 puji "sensory continuity 10/10" — di sini kontinuiti jadi cacat.

**Fix direction**: batch-sync MESTI satu signature aggregate ("5 dah masuk" — single chime, slightly longer 0.5s, dengan toast bawah "✓ 4 orders + 1 payment dah masuk while offline"). User dapat scrollback Now pin nampak semuanya. Individual signature suppress untuk batch. Real-time mode = individual signature; batch-sync mode = aggregate signature.

**[SEV-8] "Pak Lim deposit RM 30 transfer" + Maybank/CIMB notif RM 30 dari LIM — match confidence calculation: amount 0.5 + name fuzzy ("Pak Lim" vs "LIM CHEE KEONG") + voice mention within 30 min + delivery date hari Sabtu. Levenshtein ("Pak Lim", "LIM CHEE KEONG") = jauh. Score sim ~0.3. 0.3 × 0.3 = 0.09. Total = 0.5 + 0.09 + 0.2 + 0 (delivery Sabtu, payment hari ini) = 0.79. Below 0.85 auto-link. Surface as candidates.**

Real-world: nama dalam DuitNow tu "LIM CHEE KEONG" (full IC name), nama dalam voice tu "Pak Lim" (panggilan). Levenshtein algoritma straight tak handle ni. Nama panggilan vs nama IC = pattern yang KERAP di Malaysia (Pak/Mak Cik prefix + nama panggilan). Kalau threshold 0.85, kebanyakan transfer akan stuck di "claim?" — defeats purpose Path 2 auto-claim.

**Fix direction**: name matching kena custom — tokenize, strip honorifics (Pak/Mak Cik/Abang/Kakak/Encik/Puan), kemudian Levenshtein on each token vs each token of sender_name. Match if ANY token has sim >0.7. "LIM" matches "Lim" exactly. Tambahan: simpan customer.alias_names[] (auto-populate as merchant edits — "ni Pak Lim" → store alias "Pak Lim" untuk LIM CHEE KEONG). Subsequent transfer auto-link 0.95+.

**[SEV-7] Card placeholder "🛜 sync pending" sama untuk offline-capture-not-yet-extracted DAN sync-in-progress. Aku tak boleh beza "belum cuba" vs "tengah cuba".**

Cyc 25 I1: "card shown with placeholder confidence chip '🛜 sync pending'". Cyc 25 I2: "cards animate from 'sync pending' to fully extracted state". Tapi semasa dalam state I2 process, dia sync pending JUGA? Atau berubah ke "syncing"?

Real-world: aku di pasar 14:00, signal balik. Aku buka app. Aku nampak 4 cards "🛜 sync pending". 30 saat lepas tu, masih "🛜 sync pending". 1 minit, masih sama. Adakah dia stuck? Adakah extraction failed? Aku tak tahu.

**Fix direction**: 3 state distinct:
- 🛜 queued (offline, no attempt)
- ⏳ syncing (online, extraction in progress)
- ❌ failed (3 retries failed, manual retry button)

Cyc 25 visual workflow doc mesti spec all 3.

### Score Scenario C (0-10)

| Dimension | Score | Catatan |
|---|---|---|
| Seamlessness across surfaces | 4 | Sync ordering bug + reconciliation race + chime spam = 3 surface tak coordinated |
| Cognitive load while overwhelmed | 3 | Pasar bising, 5 chime = malu. Aku akan turn off audio signature, lose trust mechanism |
| Trust under failure | 4 | Kalau Pak Lim payment surface "unmatched" dan aku tak perasan, RM 30 hilang dari accounting. Tiada bug for me to detect |
| Daily-use across all 3 scenarios | 4 | Pasar 2x seminggu (Rabu + Sabtu). Kalau setiap kali signal turun aku rasa anxious tentang sync, aku akan stop voice di pasar |

---

## Severity ≥7 integration issues — summary

| # | Severity | Issue | Boundary | Fix direction |
|---|---|---|---|---|
| 1 | 9 | WA voice note .opus share-target tak di-spec | cyc 24 Path 4 ↔ cyc 25 A2 | Tambah Path 6: WA voice forward → server Whisper-large → optimistic placeholder distinct |
| 2 | 8 | Signature spam during lunch rush (online) | cyc 21 scene-aware ↔ cyc 25 F | Lunch-rush mode: visual+haptic only, suppress chime; aggregate every 5 min |
| 3 | 8 | Now-card tap = scroll-to-source = tangan kedua | cyc 21 mechanism ↔ baby-on-hip reality | Tap = bottom sheet modal; long-press = scroll-to-source (power user) |
| 4 | 7 | Confidence chip absent for payment_events | cyc 24 surface ↔ cyc 25 D | 🟢🟡🔴 chip on payment_event consistent with voice extraction |
| 5 | 9 | Voice correction target ambiguous w/o explicit name | cyc 25 H1 ↔ multi-pending-orders reality | Mandatory disambiguation prompt if utterance lacks identifier |
| 6 | 9 | WA receipt deeplink stale post-correction | cyc 25 G1 ↔ cyc 25 H | Realtime regenerate; if already sent, generate correction message |
| 7 | 8 | Reconciliation re-match logic post-correction | cyc 24 reconcile ↔ cyc 25 H | Reversal payment_event + new event, audit-only display |
| 8 | 7 | Mini-signature too subtle for split-attention | cyc 25 H2 ↔ cyc 21 criterion 5 | Distinct chime tone + persistent edit badge + undo toast 10s |
| 9 | 9 | Sync ordering bug: payment_event vs voice_note race | cyc 25 I2 ↔ cyc 24 reconcile | Linearizable timeline by created_at; second reconciliation pass post-batch |
| 10 | 9 | Batch sync = chime spam in public | cyc 25 I2 ↔ cyc 21 sensory | Aggregate signature for batch; suppress individual; toast summary |
| 11 | 8 | Honorific-prefix name matching breaks sim score | cyc 24 Levenshtein ↔ MY naming reality | Tokenize + strip honorifics + alias learning per customer |
| 12 | 7 | Sync state visual (queued vs syncing vs failed) collapsed | cyc 25 I1+I2 | 3 distinct chip states |

---

## Apa yang **solid** — defend

Bukan semua busuk. Ini yang aku rasa kerja:

1. **Cash voice path (cyc 24 Path 1)** — paling cantik. 100% offline-capable, zero permission, voice-native. Bu Aisyah punya 60% transaksi cash, ni cover.
2. **Diary-IS-DB conceptual stance (cyc 21 UX-C)** — single mental model > dashboard. Aku faham. Aku percaya. Tapi implementation kena hati-hati (issues #3, #4 atas).
3. **24h soft-undo (cyc 24)** — penting. Kesalahan tak permanent. Trust under failure naik kalau correction senang.
4. **Optimistic UI commitment (cyc 25)** — no spinner = no anxiety. Aku setuju. Tapi "🛜 sync pending" placeholder lebih perlu detail (issue #12).
5. **Refuse-list compliance pada G1 WA receipt (no auto-send)** — correct. Customer relationship stays merchant-controlled. Kalau auto-send, aku stop pakai dalam 1 minggu.
6. **Pro-tier graduation invisible (cyc 24 final section)** — no paywall friction = no anxiety. Bagus.

---

## Verdict akhir (4-dimension average across 3 scenarios)

| Scenario | Seamless | Cog load | Trust failure | Daily use | Avg |
|---|---|---|---|---|---|
| A — Lunch rush | 5 | 4 | 6 | 5 | 5.0 |
| B — Voice correction | 4 | 5 | 3 | 5 | 4.25 |
| C — Offline + payment race | 4 | 3 | 4 | 4 | 3.75 |
| **Total avg** | **4.3** | **4.0** | **4.3** | **4.7** | **4.3** |

**4.3/10.** Cycle 21 sendiri 9.875, cycle 24 sendiri 9.5, cycle 25 sendiri 10. Tetapi sambungan antara dia 4.3. Inilah maksud INTEGRATION_RED_TEAM — masing-masing puji diri sendiri, tetapi aliran sebenar pecah.

Aldi, jangan salahkan engineer. Salahkan spec. 12 isu severity ≥7 di atas semua **boundary**, bukan "dalam" satu cycle. Sebab tiada cycle merangka dirinya bertanggungjawab untuk handoff. Cyc 21 spec UX dan tinggal "scoring 9.875". Cyc 24 spec payment dan tinggal "9.5". Cyc 25 spec workflow dan tinggal "10/10". Tiada siapa spec **the seam**.

Cycle 27 mesti **INTEGRATION_HARDEN** — bukan tambah feature baru, bukan tambah cycle baru, tapi pergi balik ke 21+24+25, **tulis seam contract antara dia**. Spec urutan event. Spec error propagation. Spec offline→online state transition explicit. Spec correction propagation across surfaces. Spec rush-mode signature suppression.

Kalau cycle 27 still "let's hypothesize a new dimension", aku akan call ini di cycle 30 review semula sebagai gold-plated. Aldi dah dengar "looks great Bu" dan dia tak help. Sekarang aku cakap: **looks great but the seams will eat you alive when the baby cries.**

Aku stop di sini. Pergi handle order Kak Ros sebenar.

— Aisyah, Shah Alam, hari Rabu, 13:47, jari berminyak.
