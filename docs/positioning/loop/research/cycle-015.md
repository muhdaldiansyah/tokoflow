# Cycle 015 — RESEARCH (Banking simplicity + Immersive UX + Critique-targeted)

> 6 parallel WebSearches. Banking simplicity (Cash App / Revolut) · Immersive UX 2026 (haptics, motion, multi-sensory) · BM/BI vocab differences (Sari sev-8) · Apple Taptic Engine patterns · QRIS static vs dynamic (Sari sev-7) · GoTo/Mokapos voice status (Devil sev-7).

## Half 1 — Banking simplicity (Cash App vs Revolut)

### Key UX insight

Cash App **minimalist, fewer taps**, zero-fee — dominates US domestic. Revolut **feature-rich** (48+ countries multi-currency) but more complex. The simplicity demographic (younger, value-driven) gravitates to Cash App. Source: [bitcompare.net](https://bitcompare.net/post/cash-app-vs-revolut), [onesafe.io](https://www.onesafe.io/blog/revolut-vs-cash-app).

### Implication for Tokoflow

**Be Cash App, not Revolut.**

1. **Free tier must be MAGICAL, not crippled.** Cash App's free domestic transfer is the entire product, not a teaser. Tokoflow's 13-feature Day 1 MVP is the magic — Free tier ships ALL 13 features, no gating.

2. **Cut to 2 pricing tiers, not 3.** Cash App has Free + Cash Card. Tokoflow currently has Free + Pro RM 49 + Business RM 99 (cycle 8). **Cut Business tier from positioning.** Two tiers: Free (forever for solo) + Pro (compliance graduation past SST RM 500K). Business rejoins when multi-outlet is real product.

3. **Frame**: *"Cash App buat kedai."* (Cash App for the kedai.) Accessible, fewer taps, financial confidence without complexity.

## Half 2 — Immersive UX 2026: multi-sensory design

### The 2026 pattern: motion + sound + haptics, synchronized

> *"Multi-Sensory UX: combination of motion with sonic feedback creates more immersive, emotionally resonant experience. Trigger haptic feedback PRECISELY when corresponding visual event or sound occurs."*
> Source: [wings.design — Multi-Sensory UX](https://wings.design/insights/multi-sensory-ux-integrating-haptics-sound-and-visual-cues-to-enhance-user-interaction), [primotech UI/UX 2026](https://primotech.com/ui-ux-evolution-2026-why-micro-interactions-and-motion-matter-more-than-ever/).

### Apple Core Haptics pattern

> *"Core Haptics is an event-based audio and haptic rendering API for iPhone. Lets you design fully customized haptic patterns with synchronized audio. Perfect coordination between sound and haptics creates the illusion of a mechanical feel — precision and harmony between what you see and hear."*
> Source: [Apple WWDC19 Audio-Haptic Experiences](https://developer.apple.com/videos/play/wwdc2019/810/), [WWDC21 Practice audio haptic design](https://developer.apple.com/videos/play/wwdc2021/10278/).

### The white-earbuds spec for Tokoflow's filing animation

Cycle 8 named the 1.5s Shazam-style filing animation as the iconic visual signature. Cycle 15 research promotes it to **multi-sensory signature** — sync 3 dimensions:

| Sense | Asset | Trigger window |
|---|---|---|
| **Visual** | Listening waveform (during STT) → entity card slides into timeline | 1.5s |
| **Sound** | Soft "kring" chime (warm for ID, slightly sharper for MY) at card-arrival peak | 0.3s spike at end of animation |
| **Haptic** | Subtle iOS Core Haptics tap (light impact + light selection feedback) precisely synced to sound spike | <50ms aligned with sound |

This is the difference between "feature works" and "feature feels magical." Apple Taptic Engine + Core Haptics is shippable Day 1 on iOS 16+. Android equivalent: VibrationEffect with predefined waveforms.

**Aisyah/Sari user-facing language**: not in current-best (Jobs cycle-2 cut "intuitive/seamless" — adjectives don't sell). Just spec it; let users feel it.

## Half 3 — BM/BI vocabulary fix (addressing Sari sev-8)

### Real linguistic differences (~20-30%)

> Sources: [Wikipedia comparison](https://en.wikipedia.org/wiki/Comparison_of_Indonesian_and_Standard_Malay), [ling-app](https://ling-app.com/blog/malay-and-indonesian/), [daytranslations](https://www.daytranslations.com/blog/facts-about-bahasa/).

| English | BM (Malaysia) | BI (Indonesia) | Origin difference |
|---|---|---|---|
| no | tak / tidak | nggak | – |
| how are you | apa khabar? | apa kabar? | spelling reform |
| towel | tuala | handuk | English vs Dutch loan |
| Christmas | Krismas | Natal | – |
| order (verb) | tempah | pesan | – |
| time/hour | pukul (jam X) | jam | – |
| informal "you" | kau / awak | kamu / lo / lu | – |
| informal "already" | dah | udah / sudah | – |
| money | duit | uang / duit | – |
| just / only | je | aja / saja | – |

### Demo #2 vocab fix list (per Sari sev-8 critique)

Current cycle-12 Demo #2 has BM-leaks. Corrected version:

| Cycle 12 (leak) | Cycle 16 (fixed BI) |
|---|---|
| "boleh tempah" | "bisa pesan" |
| "pukul 11" | "jam 11" |
| "kau" | "kamu" |
| "tempah 5 loyang" | "pesan 5 loyang" |
| "Sabtu jam 7 malam ya?" | OK (BI natural) |
| price Rp 160k for 8 box nasi padang | unrealistic — should be Rp 200-240k |
| customer name "Mbak Sari" + merchant Ibu Sari | rename customer to "Mbak Lina" or "Bu Wati" |

Tagline "Cerita aja." remains BI-natural per cycle 11 research. Sari critique noted "ceritain aja" feels more vernacular Bandung — but "Cerita aja" is closer to BM cognate, preserves cross-market recognition. Decision: keep "Cerita aja" for ID launch; A/B test "ceritain aja" in Phase 0 ID interviews.

## Half 4 — QRIS static vs dynamic (Sari sev-7 launch blocker)

### Three QRIS modes

> Source: [BRIAPI QRIS docs](https://developers.bri.co.id/en/product/qris), [doku.com QRIS CPM](https://www.doku.com/en-us/blog/kelebihan-qris-cpm), [youtap.id](https://www.youtap.id/en/blog/3-jenis-qris-solusi-pembayaran-usaha).

| Mode | Description | Fit for Tokoflow |
|---|---|---|
| **Static MPM** | Print-once QR. Customer scans + types amount. Free. Suitable for micro/small. | **YES — Day 1 / Wave 2 entry.** Mompreneur shows her existing personal QR (from GoPay Merchant or any free PJP). Zero integration. |
| **Dynamic MPM** | Per-transaction generated QR (amount embedded). Requires EDC/device or PJP API. For medium/large. | **NO Day 1.** Pro tier graduation feature, requires PJP partnership integration. |
| **CPM** | Customer's QR scanned by merchant device. | **No.** Hardware-dependent. Out of scope. |

### Decision for current-best (cycle 16)

ID Day 1 / Wave 2 entry uses **Static MPM**. Mompreneur shows her existing personal QRIS from GoPay/DANA/whatever PJP she already uses. Customer scans, types Rp amount, payment notification (SMS or push) arrives. Mompreneur says into Tokoflow: *"Lina udah bayar pakai QRIS, dua ratus empat puluh ribu masuk."* AI marks paid. Zero integration burden, zero PJP partnership needed.

**Pro tier (later) adds Dynamic MPM** = mompreneur generates per-amount QR for customer to scan. Requires PJP partnership (BRI / BCA / Bank Mandiri / DANA / GoPay Merchant API). Defer to ~Day 90 post-launch.

## Half 5 — GoTo / Mokapos voice status (Devil sev-7 thesis-killer)

### Current state (verified May 2026)

> *"GoTo introduced Dira by GoTo AI — first AI-based voice assistant in Bahasa Indonesia for fintech. Allows users to navigate GoPay app and perform tasks via voice. Currently rolled out to select users on GoPay; Gojek app rollout future."*
> Sources: [GoTo press](https://www.gotocompany.com/en/news/press/goto-launches-new-ai-strategy-with-the-introduction-of-dira-the-first-ever-ai-based-fintech-voice-assistant-in-bahasa-indonesia), [Jakarta Post](https://www.thejakartapost.com/business/2024/07/17/goto-rolls-out-new-ai-strategy-with-the-introduction-of-an-ai-based-voice-assistant.html).

**Mokapos voice features: NOT yet announced publicly.** GoTo's voice strategy focuses on Dira within GoPay (consumer-side) — not Mokapos (merchant-side POS).

### Critical timing analysis

- Mokapos voice = NOT shipped. Window exists.
- GoTo has the infrastructure (Sahabat-AI + Dira engineering team). Defensive ship feasible in **60-90 days** if Tokoflow trends in MY first.
- Therefore: Wave 1 MY launch must NOT publicly announce Wave 2 ID timing. Move quietly. ID launch is internal until Wave 1 metrics validate (Phase 1 Gate per CLAUDE.md).

### Strategic mitigation (for cycle 16)

1. **MY launch public; ID Wave 2 timing internal until Wave 1 validation passes.** Don't telegraph the full Bahasa-archipelago play to GoTo. (This is consistent with Phase 0/1 Gate framework already in CLAUDE.md.)
2. **Reframe Sahabat-AI dependency**: Sahabat-AI is Llama 3 8B fine-tune (open-source, public good). Tokoflow uses Sahabat-AI like Apple uses Linux for server backend — leveraging public infrastructure. NOT "primary ID LLM built by largest competitor." Plus OpenRouter Gemini fallback ensures provider-key resilience.
3. **GoTo defensive risk acknowledged, mitigated by**: speed-of-execution in MY (Wave 1 validation is window) + voice-corpus head-start once shipped + brand-love compounding (Cash App vs. Revolut pattern: Cash App got there with simplicity first) + channel orthogonality (TikTok creator channel ≠ Gojek merchant network).

## Implications for Cycle 16 SYNTHESIZE

The cycle-15 research delivers 8 specific changes for cycle 16:

1. **Pricing simplification**: Free + Pro only (cut Business tier from positioning).
2. **Multi-sensory signature spec**: Visual (1.5s reveal) + Sound (warm chime) + Haptic (Core Haptics tap) all synchronized. The Tokoflow "white earbuds" upgraded.
3. **Demo #2 BI vocab fix** (Sari sev-8): bisa pesan / jam / kamu / Mbak Lina / Rp 240k.
4. **QRIS clarification**: Static MPM Day 1 (mompreneur uses her existing QR), Dynamic MPM Pro tier Day 90+.
5. **Demo #2 mechanism asymmetry** (Jobs sev-7): show ID-specific QRIS+SMS auto-ingest pattern that MY structurally cannot match. Mechanism takes different shape per market.
6. **Sahabat-AI reframe** (Devil sev-7): public-good Llama 3 fine-tune, Apple-uses-Linux parallel, OpenRouter fallback. NOT competitor-infrastructure dependency.
7. **GoTo defensive risk explicit**: Wave 1 MY launch public; Wave 2 ID timing internal until validation.
8. **Drop "Day 30 text-input escape hatch" from roadmap** (Jobs sev-7): pre-apology cut. If text input is needed, ship Day 1 in Settings; otherwise delete entirely.
9. **Confidence chip Day 1 clarification** (Aisyah sev-6): 🟢 fires on per-utterance high confidence Day 1; trust-mode (Day 60) auto-promotes patterns to permanent. Two distinct mechanics.
