# Cycle 003 — RESEARCH

> 6 parallel WebSearch queries · competitor scan + cross-domain analogy (Gaming UX) + Devil-targeted validation queries.

## Half 1 — Competitive scan (real moves, last 12 months)

### Move 1: Bukku ships WhatsApp receipt upload + auto-extraction (CONFIRMED THREAT)

> *"Receipts can be uploaded via WhatsApp, and Bukku will automatically extract pertinent information, reducing manual data entry."*
> Source: [caltrix.asia — Introducing Bukku: A Smarter Way to Manage Your E-invoice](https://www.caltrix.asia/blog/introducing-bukku-a-smarter-way-to-manage-your-e-invoice/)

**Takeaway**: Devil's "Bukku ships voice-receipt-capture in 60 days" prediction is **half-shipped already** (photo route via WA forward). Voice extension is trivial. **This is the most concrete 90-day copy threat.**

**Implication**: Tokoflow's voice diary must be DIFFERENT in mental model, not just modality. Bukku is bookkeeping-OUT (upload to fix taxes). Tokoflow is daily-life-IN (live, books emerge).

### Move 2: Vocalis — Malaysia-native AI voice platform exists

> *"Vocalis: Malaysia's next-generation AI voice platform, built on Asterisk with native Bahasa Melayu support, real-time conversational AI, and full local deployment. PDPA-compliant data sovereignty."*
> Source: [orencloud.com — Vocalis](https://www.orencloud.com/vocalis-malaysias-next-generation-ai-voice-platform/)

**Takeaway**: A MY-native voice AI player exists. Vertical-different (enterprise telephony, IVR replacement) — but the BM-voice + PDPA + local-deploy positioning is **uncomfortably close to our wedge angle**. They could pivot down-market.

**Implication**: We should claim solo-merchant SMB territory faster than they can pivot. Wedge narrowness is a defense (Vocalis chases enterprise contracts; we chase home F&B).

### Move 3: WhatsApp Business API — new "AI Providers" pricing (Feb 2026)

> *"As of April 1, 2026, MYR added as billing currency. New pricing policy for AI Providers leveraging WhatsApp Business Platform effective February 16, 2026."*
> Sources: [developers.facebook.com WA pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing), [forwardchat.my — WA API Cost Malaysia](https://forwardchat.my/blog/whatsapp-api-cost-malaysia)

**Takeaway**: WA Business API is becoming MORE expensive for AI agent flows. Every competitor that builds on WA Business API now has a higher cost floor.

**Implication**: Tokoflow's "click-to-WA deeplinks only, no API integration" is now a **measurable cost advantage**, not just a refusal stance. Frame as positive: "Setiap RM kita jimat dari WA API, kita pulangkan ke kau dalam Free tier."

### Move 4: Newo.ai raises $25M Series A for "voice AI backbone of SMB front-desk operations"

> Source: [techfundingnews.com](https://techfundingnews.com/newo-ai-raises-25m-series-a-voice-infrastructure/)

**Takeaway**: VC validates voice-first SMB category at $25M+ post. Different vertical (front-desk receptionist), but signals: voice-first SMB is being capitalized. Time pressure is real.

### Move 5: StoreHub creates "Head of Human + AI Performance" role + AI-first culture pivot

> Source: [entrepreneur.com — StoreHub AI-first culture](https://www.entrepreneur.com/en-au/technology/storehubs-head-of-human-ai-performance-on-dealsclub-and/501034)

**Takeaway**: StoreHub is building AI culture proactively, not reactively. Devil's "3-engineer pod kills Tokoflow" is **operational risk if Tokoflow trends**. They have the talent and incentive structure to ship voice-add in one sprint.

### Move 6: Maxis Hotlink Biz — bundling kill scenario NOT YET TRIGGERED

> Searched: no specific voice-bookkeeping bundle in Hotlink Biz as of May 2026.
> Source: [business.maxis.com.my SME](https://www.business.maxis.com.my/en/SME/)

**Takeaway**: Devil's kill scenario #3 (Maxis bundles free voice-bookkeeping) is hypothetical, not active. **But the platform exists** (Maxis SME Mobile + IoT) — the bundling vector is one partnership announcement away. Watch quarterly.

## Half 1.5 — Voice-first failure modes (Aisyah's "noisy kitchen" critique validation)

### Finding A — Silent degradation is THE retention killer

> *"Voice AI experience degrades quietly, then shows up loudly in the renewal cycle. A B2B SaaS team audited 30 days of voice transcripts and found 47 cancellation-intent calls that never triggered a human handoff."*
> Source: [thecscafe.com — Voice AI Renewal Surprises](https://www.thecscafe.com/p/voice-ai-governance-renewal-surprises)

**Implication**: Tokoflow MUST surface AI confidence loudly. When the model is uncertain ("Aishah ke Aisyah?"), it asks visibly — not silently picks one. **Loud failure > silent degradation.** Add: per-extraction confidence flag, single-tap correction.

### Finding B — "Most failures are DESIGN failures, not model failures"

> *"The STT gets the words wrong because nobody added domain vocabulary. The agent forgets context because nobody passed message history."*
> Source: [thecscafe.com](https://www.thecscafe.com/p/voice-agents-renewal-surface-silent-trust-debt)

**Implication**: even with foundation models that "already speak Manglish" (Devil's critique on the corpus moat), the design moat is real: domain vocabulary (`Aishah`, `kek lapis`, `RM`, `tepung`, `transfer dah masuk`), context history (Aishah is a known repeat customer), confidence routing. **Workflow IP score should be 6-7/10, not 3/10.** Devil under-rated it because he conflated raw model capability with productized workflow.

### Finding C — Context-retention is solved by "passing message history"

**Implication**: Tokoflow voice-diary should pass last 30 days of merchant's voice context to the LLM on every parse. Names, products, regular customers, payment patterns — all become disambiguation context. This is implementable in Day 1.

## Half 2 — Cross-domain analogy: Clash Royale onboarding (gaming UX)

### Principle 1 — First 15 minutes = sticky window, NOT 60 seconds

> *"Clash Royale's first 15 minutes are considered a spectacular example of how to create a sticky UX. Onboarding divides into FIVE short tutorials introducing one new mechanic each."*
> Source: [Matt Le on Medium](https://medium.com/@Matthewwspencerr/clash-royale-creating-a-sticky-first-time-user-experience-113e17b18f36)

**Implication for Tokoflow**: Day 0 = 60s demo (marketing). Day 1 (first session) = 15-minute scaffolded onboarding with 5 micro-tutorials:
1. **Tap-to-talk** one event ("Aishah just paid")
2. **See it auto-filed** (visible filing animation, the Shazam moment)
3. **Ask a query** ("Cerita pesanan minggu ni")
4. **Send first receipt** (1-tap WA deeplink)
5. **Correct an AI mistake** (voice correction: "salah, tukar 5 jadi 3")

Each ≤2 min. Total 15 min. Each ends with a micro-reward (entity card materializes, count goes up, customer card created).

### Principle 2 — Time-locked reveals create anticipation

> *"Chests for each training match are time-locked for 15 seconds — creating a system that says 'go explore, we'll have rewards waiting.'"*

**Implication**: when AI parses a voice note, **don't render instantly**. Show 1-2s of visible processing — like Shazam listening, then revealing the song. The processing IS the magic moment surface. This was missing in cycle 1's positioning.

### Principle 3 — Short timers (Day 1) → long timers (steady-state)

> *"Short timers in training keep the player engaged through the first 15 minutes; long hour timers give players a reason to return on their own schedule."*

**Implication**: Day 1 = many micro-rewards (every voice note files satisfyingly). Steady-state retention hook = **daily morning briefing in HER OWN voice**: "Pagi tadi, kau ada 3 pesanan masuk: Aishah, Pak Lee, Mak Cik Ros. Total RM 145. Tepung dah nak habis." Her words played back to her, restitched as next-day briefing. **Voice-in + voice-out = "the shop talks back"** — Jobs's bonus suggestion validated by Clash Royale's return-hook design.

### Principle 4 — Onboarding seeds return-motivation, not just teaches

> *"Onboarding builds investment to entice players to return."*

**Implication**: Day 1 must END with a concrete artifact she'll want to come back for. Suggested final beat: "Pukul 8 pagi besok, kau dapat satu cerita ringkas pasal hari ni — dalam suara kau sendiri. Setuju?" One-tap consent. Hook the return.

## Half 3 — Distribution reality (Devil's "name 3 creators" challenge)

**Real MY mompreneur TikTok creators identified:**

- **@syimaeima** (Elformula Malaysia) — day-in-life mompreneur content, 7.5M+ views on Mompreneur day-in-life video. [tiktok.com/@syimaeima](https://www.tiktok.com/@syimaeima/video/7527943911831063816)
- **@christine_cantada** — mompreneur lifestyle content. [Instagram](https://www.instagram.com/christine_cantada/)
- **@chynesee** — explicitly self-titled "MOMPRENEUR" with YouTube + IG presence.
- **Farah Wen** — named in [Modash MY influencer list](https://www.modash.io/find-influencers/tiktok/malaysia), young mother + mompreneur content.

**Found content format gold**:
> *"Food remains powerful on Malaysian TikTok. Viewers enjoy watching how cafés open for the day, how stalls prepare ingredients, how business owners set up before customers arrive."*
> Source: [wargabiz.com.my — TikTok Trends MY 2026](https://wargabiz.com.my/2026/01/15/tiktok-trends-in-malaysia-2026-15-ideas-that-actually-work-for-businesses/)

**Implication**: the natural TikTok format is **"POV: end of lunch rush, I just talked into Tokoflow and watched 5 orders + 3 receipts file themselves"**. Process content + AI-magic-reveal. This is shippable as creator content even pre-launch. Distribution claim moves from wishlist → actionable plan.

**Devil's deeper challenge unaddressed**: has founder talked to any creator? Still no. Phase 0 must include creator outreach.

## Implications for SYNTHESIZE (cycle 4)

The research clarifies 8 specific changes the next synthesis should consider:

1. **Differentiation from Bukku**: position as daily-life-IN, not bookkeeping-OUT. Mental model is diary, not accounting tool.
2. **Workflow IP moat is REAL** (vs Devil's 3/10) — domain vocabulary + 30-day context history is design IP, hard to clone in <90 days. Re-score Defense.
3. **Cost-advantage moat (new)**: zero WA Business API spend = real RM/month savings vs competitors. Frame as "we pay nothing for messaging, you pay nothing for Free tier."
4. **Loud failures, not silent**: confidence flags + single-tap voice corrections. Trust is built by showing AI doubt visibly.
5. **Onboarding is 15 min, not 60s**: Day 0 = 60s demo (marketing). Day 1 = 5 micro-tutorials × 2 min each. Don't conflate.
6. **Filing animation = the magic moment surface**: Shazam-style 1-2s processing reveal. Borrow time-lock-anticipation pattern.
7. **Daily morning voice briefing**: voice-in + voice-out closes the loop Jobs asked for, AND is the long-timer return hook from Clash Royale principle 3.
8. **TikTok content format defined**: "POV: end-of-rush, I just talked into Tokoflow" — shippable creator-content brief, not vague channel claim.
