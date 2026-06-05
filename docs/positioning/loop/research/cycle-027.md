# Cycle 027 — UX_RESEARCH (seamless integration patterns 2024–2026)

> Cycle 26 scored the integrated architecture 5.4/10 vs each cycle's 9.5–10. The seams are the product. This cycle gathers public 2024–2026 sources to inform cycle 28's boundary contract — six concrete questions, ≥18 cited sources, verdicts not vibes.

---

## Q1 — iOS Live Activities + Dynamic Island for payment-claim parity

**Headline finding (verdict):** Live Activities can give iOS users a meaningful but **not parity** experience vs Android `NotificationListenerService`. The structural fact is that **a Live Activity must be started by the merchant's own action inside Tokoflow** (or a Tokoflow APNs push-to-start) — it cannot be triggered by another app's notification. So iOS will never observe an incoming DANA notification autonomously the way Android can. The realistic ceiling is "Today rush mode": when the merchant taps a daily/session-scoped Live Activity in Tokoflow at the start of a service window, Tokoflow's own backend (which already processed any Path-3 manual share or Path-5 voice mention or Pro-tier merchant-bank webhook) updates the Activity in place, so subsequent payments arrive on the Lock Screen / Dynamic Island as a tappable claim card without unlocking. Net feasibility: **~60–70% of Android parity in the "rush mode" window, ~0% outside it.** This is honest pricing-tier territory, not parity.

### Cited facts

- **Live Activities are app-initiated only.** "A Live Activity can only begin after a user performs an intentional action inside the app. It cannot be started remotely or triggered by a background task." iOS 17.2 added "push-to-start" via APNs but only for the *originating* app; cross-app-notification triggering is explicitly not supported. ([Apple Developer — Displaying live data with Live Activities](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities); [Reteno — iOS Live Activities Explained](https://reteno.com/blog/ios-live-activities-explained-how-apps-use-them))
- **Push token + payload.** Each Live Activity gets a unique APNs push token. Server pushes update via that token; **payload size is capped at 4 KB** (combined static + dynamic data). ([Apple Developer — Starting and updating Live Activities with ActivityKit push notifications](https://developer.apple.com/documentation/activitykit/starting-and-updating-live-activities-with-activitykit-push-notifications); [Pushwoosh — iOS 18 Live Activities](https://www.pushwoosh.com/blog/ios-live-activities/))
- **Dynamic Island states.** Four required layouts: `compactLeading`, `compactTrailing`, `minimal` (when another Live Activity is also active — system shrinks ours into a detached trailing pill), and `expanded` (when the user long-presses). Expanded view height capped at **144 pt**; compact icons sized at 24 pt within a 36 pt capsule; text at 15 pt / 22 pt line height. ([Newly — Dynamic Island guide 2026](https://newly.app/articles/dynamic-island); [Swift with Majid — Mastering Dynamic Island in SwiftUI](https://swiftwithmajid.com/2022/09/28/mastering-dynamic-island-in-swiftui/); [Infinum — Start Designing for Dynamic Island and Live Activities](https://infinum.com/blog/start-designing-for-dynamic-island-and-live-activities/))
- **Interactive widgets in Live Activities (iOS 17+).** Buttons and toggles *inside* a Live Activity can run `App Intents` directly without opening the app — i.e., a "Claim payment ✓" button on a Lock Screen Live Activity *can* mutate state without unlock. ([iOS 17 Live Activity With Intents — gist](https://gist.github.com/RndmCodeGuy20/4b3042ce2092b69c9adc7feac16a2b54); [Pushwoosh — iOS 18 Live Activities](https://www.pushwoosh.com/blog/ios-live-activities/))
- **Empirical ID/MY production examples.** No public evidence found of GoPay, DANA, OVO, Maybank M2U, or Touch'n Go shipping consumer-facing Live Activities for incoming-payment surfacing as of search date (May 2026). The closest analogues are **Apple Wallet boarding-pass Live Activities (iOS 26)** — flight tracking with gate updates pushed via airline server — and **Strava Live Activities** (workout session). Both follow the same pattern: user taps to *start* a session-scoped Activity inside the app; server pushes updates for the duration. ([9to5Mac — iOS 26 boarding passes United](https://9to5mac.com/2025/10/05/ios-26-wallet-app-new-boarding-pass-features-united-airlines-support/); [Strava Support — Live Activities on iOS](https://support.strava.com/hc/en-us/articles/39508401687693-Strava-Live-Activities-on-iOS))

### Implication for Tokoflow architecture

- **Day 1 iOS = Path 3 (manual share) + Path 5 (voice mention).** Honest. Position as "share once, file forever" not "auto-claim."
- **Wave 2 iOS upgrade = "Rush Mode Live Activity."** Merchant taps "Buka rush mode" at start of pasar/lunch window. A session-scoped Live Activity pins to Lock Screen with today's pending-orders glance. Tokoflow's server pushes a 4 KB update on every reconciled `payment_event` (any source — manual share, voice, Pro-tier bank webhook). Interactive button in expanded view does one-tap Claim via App Intent → mutates without unlock.
- **The structural seam (Q26 §D)** does not close. iOS cannot observe a DANA notification autonomously. Pricing tier acknowledgement is the right move: Free iOS = Day-1 path; Pro iOS = Rush Mode + Pro-tier merchant-bank webhooks (which ARE structural parity, just paid for differently).
- **Dynamic Island compact = "RM 240 · Lina · claim?"** trailing pill. Minimal state must degrade to a single dot (system collapses when another LA active). Expanded = 3 candidate orders + claim/reject buttons.
- **Cycle 28 must produce a decision matrix:** Day-1 iOS (manual share, no LA) / Wave-2 iOS Pro (Rush Mode LA + bank webhook) / honest pricing-tier disclosure in onboarding.

---

## Q2 — Material You + scene-aware adaptation under burst load

**Headline finding:** Android **already enforces** notification rate limits (10 updates/sec/package since Android 7), and **auto-bundles 4+ notifications without an explicit group** into a system summary. The mechanism Tokoflow needs for "lunch rush suppression" is not novel — it's `NotificationCompat.Builder.setGroupAlertBehavior(GROUP_ALERT_SUMMARY)` plus channel-level `IMPORTANCE_LOW` for child events during burst windows. The harder problem is *deciding when to enter burst mode* — that is application-layer logic Tokoflow must own.

### Cited facts

- **Hard rate limit.** "Before Nougat: 50 updates per second. Nougat and above: 10 updates every second. Recommended target: ~5 updates per second." When exceeded, Android logs `E/NotificationService: Package enqueue rate is X. Shedding events.` and *drops* updates. ([Saket Narayan — Android Nougat and rate limiting of notification updates](https://saket.me/android-7-nougat-rate-limiting-notifications/))
- **Auto-bundling at 4+.** "If your app sends four or more notifications and doesn't specify a group, the system automatically groups them on Android 7.0 and higher." Group summary's `setGroupAlertBehavior` controls whether the summary, children, or all alert; `GROUP_ALERT_SUMMARY` is the canonical "ducked audio" pattern. ([Android Developers — Create a group of notifications](https://developer.android.com/develop/ui/views/notifications/group))
- **Material 3 motion duration tokens.** Short / medium / long families (50–100ms / 250–400ms / 500–700ms ranges). "Transitions on mobile typically occur over 300ms ... transitions that exceed 400ms may feel too slow." Reduce-motion accessibility is a system-level setting; M3 expects every animation to ship a reduced-motion fallback. ([Material 3 — Easing and duration tokens](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs); [Material 3 — Motion overview](https://m3.material.io/styles/motion/overview/how-it-works))
- **iOS Focus Filter API.** Apps can register an App-Intents-based `FocusFilter` so that when the user is in (e.g.) a "Work / Pasar" Focus, Tokoflow's content presentation adapts and notification interruption levels demote. Interruption levels: `passive` < `active` < `time-sensitive` < `critical`. Only `time-sensitive` and `critical` break Focus. ([Apple Developer — Defining your app's Focus filter](https://developer.apple.com/documentation/AppIntents/defining-your-app-s-focus-filter); [OneSignal — iOS Focus Modes and Interruption Levels](https://documentation.onesignal.com/docs/en/ios-focus-modes-and-interruption-levels))
- **Slack's burst convention.** "Apps may post no more than one message per second per channel; Slack allows bursts over that limit for short periods." Slack does *not* publish hard burst caps — they're tuned dynamically to stop spam. Same shape as what Tokoflow needs: soft target with elastic burst tolerance. ([Slack — Rate limits](https://docs.slack.dev/apis/web-api/rate-limits/); [Slack — Great rate limits changelog](https://api.slack.com/changelog/2018-03-great-rate-limits))

### Implication for Tokoflow architecture

- **Hard ceiling: 5 sensory signatures/second is the engineering limit.** Above that, Android drops events. The product limit must be lower.
- **Burst-mode decision logic (application layer):**
  - **Lunch rush detected** = ≥3 capture-events in 5 minutes → enter burst mode. Audio: `GROUP_ALERT_SUMMARY` (only the daily-summary pin chimes, child events are silent). Haptic: skip per-event, queue one batch tick at the *end* of the 5-minute window. Visual: Now-card stack updates without animation per event; one combined "+3 paid" rollup animation at window close.
  - **Offline drain** = N>3 queued items syncing → batch-summary signature only; per-event filing is silent + spinner-free shadow tint.
  - **Pasar context** (long quiet → sudden burst) = ducked audio (volume × 0.3) + visual-only filing.
- **Material 3 motion budget:** filing animation 1.5s today (cycle 25 §F1) is on the cusp of "too slow." Cycle 28 should split it: **first capture of the day = full 1.5s ceremony; subsequent captures = 600ms decay variant** (Jobs's deliverable #2).
- **Reduce-motion accessibility fallback** is non-optional. Cycle 30 spec must include reduced-motion tokens for every animation in cycle 25 §F1–F3.

---

## Q3 — Optimistic UI patterns 2026 (Linear, Notion, Cash App, Figma)

**Headline finding:** The 2025–2026 industry consensus has converged on **TanStack DB + Electric SQL** (or Replicache for the React Native crowd) for new local-first apps. Replicache went into maintenance mode in 2024 — Tokoflow should not adopt it. Linear's pattern (in-memory MobX + IndexedDB hydration + GraphQL mutations + WebSocket subscriptions) is the gold standard for a single-user-multi-device app, which is *exactly* Tokoflow's shape (one merchant, possibly multiple devices). The "no spinner" pattern is **shadow + tint, not skeleton**: optimistic state is rendered with full fidelity but with a 1-pt-elevation drop-shadow change (Linear's "this is local-only") until the server `ack` arrives. Rollback uses Apollo-style cache rewind: GraphQL error → discard optimistic write → toast.

### Cited facts

- **Linear's architecture.** "Every change happens locally first, then in the background uses GraphQL for mutations and WebSockets for sync." App downloads the entire project's data into IndexedDB on bootstrap; in-memory MobX layer drives reactivity; mutations are sent as GraphQL with optimistic local apply. ([Bytemash — Linear sync engine deep dive](https://bytemash.net/posts/i-went-down-the-linear-rabbit-hole/); [Fujimon — Linear's sync engine architecture](https://www.fujimon.com/blog/linear-sync-engine); [localfirst.fm — Tuomas Artman episode](https://www.localfirst.fm/15))
- **Linear scale economics.** "10,000 users on an $80/month server keeping the CPU almost idle" — the local-first architecture's cost story is part of the moat. ([Bytemash article](https://bytemash.net/posts/i-went-down-the-linear-rabbit-hole/))
- **Optimistic rollback semantics (Apollo-style).** "If the mutation returns a GraphQL error, Apollo Client discards the optimistic version of the object and rolls back to the previous state." Same pattern in Relay: "When the mutation succeeds or errors, the optimistic response will be rolled back." ([Apollo Docs — Optimistic mutation results](https://www.apollographql.com/docs/react/performance/optimistic-ui); [Relay — GraphQL mutations](https://relay.dev/docs/guided-tour/updating-data/graphql-mutations/))
- **Replicache deprecation.** "After five years, thousands of developers, and millions of end users, Replicache is now in maintenance mode and has open-sourced the code and no longer charges for its use." ([Replicache homepage](https://replicache.dev/))
- **TanStack DB (the 2025 successor).** Beta as of Aug 2025. "Optimistic mutation → backend persistence → sync back → confirmed state." Differential dataflow query engine for sub-millisecond updates. Pairs with Electric SQL for sync. ([InfoQ — TanStack DB Enters Beta](https://www.infoq.com/news/2025/08/tanstack-db-beta/); [Electric — Super-fast apps on sync with Electric and TanStack DB](https://electric.ax/blog/2025/07/29/super-fast-apps-on-sync-with-tanstack-db); [TanStack DB — Mutations docs](https://tanstack.com/db/latest/docs/guides/mutations))
- **Figma's checkpointing.** "Multiplayer holds the state of the file in-memory and updates it as changes come in, periodically writing the state of the file to storage every 30 to 60 seconds in a process called 'checkpointing.'" CRDTs not in pure form — inspired by, but server is authoritative for ordering. ([Figma — How Figma's multiplayer technology works](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/); [Liveblocks — Understanding sync engines: Figma, Linear, Google Docs](https://liveblocks.io/blog/understanding-sync-engines-how-figma-linear-and-google-docs-work))
- **Notion's offline mode (Aug 2025, v2.53).** CRDT for text merges; first-write-wins for database properties. 15-minute snapshot cadence for offline sessions. ([TaskFoundry — Notion Offline Mode Setup, Sync Rules & Conflict Rescue](https://www.taskfoundry.com/2025/08/notion-offline-mode-setup-sync-conflict-guide.html); [AFFiNE — Stop Losing Work: Make Notion Pages Truly Offline](https://affine.pro/blog/notion-offline))
- **Cinapse abandoning CRDTs.** Worth noting as a counter-signal: a 2025 case study in moving *away* from CRDTs because the per-user-per-device complexity wasn't worth it for their app shape — same shape as Tokoflow (single user, multiple devices, non-collaborative). ([PowerSync — Why Cinapse Moved Away From CRDTs For Sync](https://www.powersync.com/blog/why-cinapse-moved-away-from-crdts-for-sync))

### Implication for Tokoflow architecture

- **Adopt Linear's pattern, not CRDTs.** Tokoflow is single-merchant — no real concurrency. Use Supabase Postgres + IndexedDB cache + optimistic mutations with server-authoritative ordering (server timestamp wins). Skip Yjs/Automerge entirely.
- **Library choice for cycle 28: TanStack DB + Electric (Phase 1) or hand-rolled (Phase 0 demo).** Phase 0 manual-twin smoke test doesn't need a sync engine. Phase 1 build should adopt TanStack DB if beta has stabilized; otherwise hand-roll the Linear pattern (mutations send to `/api/extract` with optimistic local apply, server returns canonical row, client reconciles by `id`).
- **"No spinner" rendering grammar:** local-only state = card with `--shadow-pending` token (1 pt softer drop-shadow); server-acknowledged = `--shadow-rest`. Three sync states (resolving cycle 26 §17): `capturing` (mic listening — no card yet), `extracting` (card present, transcript showing, entity chips ghosted), `synced` (full fidelity, no shadow modifier). Cycle 25's "🛜 sync pending" string is a forbidden engineering-vocab leak (cycle 26 §C); replace with the shadow-token grammar.
- **Sync ordering protocol (resolving cycle 26 §1):** every voice_note carries a client-generated UUID + `created_at_local`. Server is authoritative for canonical ordering by `created_at_server` but client uses local timestamp for display. Reconciliation runs *twice*: once at insert (within transaction), once 60 seconds later (catches `voice_notes` whose `llm_processed_at` set after the first pass). Orphan `payment_events` queued for second-pass match for 60 minutes.
- **Rollback toast copy:** if server rejects (validation error, dedup conflict), the optimistic card slides back out with a copy from `lib/copy` ("Tak sempat — cuba lagi") not "Mutation failed" or "Sync error."

---

## Q4 — Multi-sensory ceremony decay rules

**Headline finding:** Apple HIG explicitly warns against haptic overuse, citing "fatigue" and recommending "sparingly" — but the HIG does not publish numeric thresholds. The peer-reviewed loot-box research is the more useful evidence: variable-ratio reward sounds **start as dopamine-positive but become hypo-sensitizing with repetition**, which is precisely the regression cycle 26 §A flagged. The decay rule for Tokoflow is therefore not "throttle haptics" but **"first event of a session = full ceremony; subsequent events decay; nth event = silent batch."** Group summary at session-end restores the dopamine signal once.

### Cited facts

- **Apple HIG on haptics.** "Use haptics consistently. Build trust by using haptic patterns consistently with the actions they accompany ... Avoid overusing haptics." Standard UIKit feedback generators (`UIImpactFeedbackGenerator(.light)`, `.medium`, `.heavy`, `UISelectionFeedbackGenerator`, `UINotificationFeedbackGenerator`) are calibrated and "play Apple-designed system haptics by default." Higher intensities "fatigue mechanoreceptors faster, blur temporal boundaries between pulses, and increase false positives." ([Apple Developer — Playing haptics HIG](https://developer.apple.com/design/human-interface-guidelines/playing-haptics); [Apple Developer — Feedback HIG](https://developer.apple.com/design/human-interface-guidelines/feedback))
- **Loot-box / variable-reward research (peer-reviewed).** "Dopamine cells are most active when there is maximum uncertainty, and the dopamine system responds more to an uncertain reward than the same reward delivered on a predictable basis." However: "problematic gamblers no longer receive increases in arousal and become hyposensitive to reward, and this hyposensitivity may also be present in problematic gamers." ([ScienceDaily 2025 — Loot box virtual rewards associated with gambling and video game addiction](https://www.sciencedaily.com/releases/2025/02/250219111302.htm); [PMC / Brady & Prentice 2021 — Are Loot Boxes Addictive? Physiological Arousal While Opening a Loot Box](https://journals.sagepub.com/doi/abs/10.1177/1555412019895359); [Brooks & Clark 2022 — Migration from loot boxes to gambling longitudinal study](https://gamblingresearch.sites.olt.ubc.ca/files/2023/03/BrooksClark_LootBoxMigration_PostprintDec2022.pdf))
- **Salience design = the same anti-pattern.** "Hyper-salient elements like a slot machine's clinking coins or a loot box's bouncing star animation, with vibrant animations, satisfying sounds, and prominent placement keeping loot boxes jumping off the screen." This is the Tokoflow anti-pattern Sari/Aisyah/Jobs/Norman all flagged. ([Capstone — Gambling for Kids: Why Lootboxes are Villainous Dopamine Hits](https://capstone.capilanou.ca/2023/07/19/gambling-for-kids-why-lootboxes-are-villainous-dopamine-hits/))
- **Material 3 reduce-motion accessibility.** "A fallback path should always implement a reduced-motion variant, triggered by OS accessibility settings." ([Material 3 — Motion overview](https://m3.material.io/styles/motion/overview/how-it-works))
- **Group summary as the canonical "single chime" pattern.** Android: `setGroupAlertBehavior(GROUP_ALERT_SUMMARY)` ducks child notifications so only the bundle summary chimes. ([Android Developers — Create a group of notifications](https://developer.android.com/develop/ui/views/notifications/group); [Saket — Tips for Android Nougat's bundled notifications](https://saket.me/nougat-bundled-notifications/))

### Implication for Tokoflow architecture

- **Decay envelope (cycle 28 must specify):**

  | Event index in 5-min window | Visual | Sound | Haptic |
  |---|---|---|---|
  | 1st | Full 1.5s file animation | Full kring chime | `.light` impact + selection click |
  | 2nd | 1.0s shortened | Ducked (50% volume) | `.light` impact only |
  | 3rd | 600ms slide-in only | Silent | Skip |
  | 4th–Nth | 300ms tint flash, no movement | Silent | Skip |
  | Window-close (5 min idle, or merchant scrolls feed) | Single batch summary card materializes | Single chime | Single `.medium` impact |

- **First-of-day rule (Jobs deliverable #2).** First voice-note of each calendar day = iconic ceremony regardless of whether it's the 1st of a 5-minute window. Inverse of the current spec where every event is iconic.
- **Reduce-motion fallback:** when `UIAccessibility.isReduceMotionEnabled` (iOS) or system reduce-motion (Android) is on, all animation degrades to opacity-fade only; sound + haptic still fire on first-of-window per above table.
- **Anti-Pavlov compliance check:** the decay rule explicitly *prevents* the loot-box dopamine pattern by removing the variable-ratio reinforcement. Every successful filing in a burst is *predictable* (silent), so the only audible signal is the per-window summary — informational, not reward-hacking.

---

## Q5 — Cross-app share-target patterns 2026 (iOS 18 + Android 15)

**Headline finding:** The forwarded-WA-voice-note path (cycle 26 §4) is **technically straightforward on Android, awkward on iOS.** Android's Share Intent passes the `.opus` audio file URI directly; Tokoflow's share target reads it, decodes (libopus is on most Android distributions), and feeds Whisper. iOS Share Extensions accept audio attachments via `kUTTypeAudio` UTI but the merchant must use long-press → Share menu → Tokoflow per message — there is no equivalent of Android's auto-discovery. **App Intents (iOS 17+) are the iOS upgrade path:** Tokoflow donates `LogVoiceNoteIntent`, `ClaimPaymentIntent`, etc. to the system; they then surface in Spotlight, Siri, and Shortcuts, and *can be invoked from Action Button or via "Hey Siri, log voice note in Tokoflow."* That doesn't fix the WA-share zero-discovery problem on iOS, but it adds a parallel discoverable path.

### Cited facts

- **WhatsApp .opus codec.** "All WhatsApp voice messages are saved in OPUS format, which can be opened by most music players." Long-press → Share → choose target app passes the audio file via standard Android Share Intent. ([Guiding Tech — How to Save WhatsApp Audio](https://www.guidingtech.com/how-to-save-whatsapp-audio/); [Voice Note Tools — WhatsApp Audio to MP3 (OPUS, OGG, M4A)](https://www.voicenotetools.com/))
- **Android 14+ Sharesheet ChooserAction.** Apps can register up to 2 custom `ChooserAction`s; system can promote frequently-shared-to apps to the "Direct Share" rank. Discoverability is rank-based; "all `shortcutId`s must be unique and never reused for different targets" to maximize ranking. ([Android Developers — Provide Direct Share targets](https://developer.android.com/training/sharing/direct-share-targets); [droidcon — Sharesheet custom actions Android 14](https://www.droidcon.com/2023/04/18/sharesheet-custom-actions-android14/); [Esper — 5 Ways Google is Making the Share Sheet Better in Android 14](https://www.esper.io/blog/android-14-share-sheet-improvements))
- **iOS 18 App Intents discoverability.** "App Intents make your app's content and actions discoverable with system experiences like Spotlight, widgets, and the Shortcuts app." Donated intents surface predictively. `IndexedEntity` allows entities to appear in Spotlight search. App Intents work with Action Button, Apple Pencil squeeze, Control Center custom controls. ([Apple Developer — App Intents](https://developer.apple.com/documentation/appintents); [WWDC24 — What's new in App Intents](https://developer.apple.com/videos/play/wwdc2024/10134/); [Singular — App Intents in iOS 18: on-device marketing, engagement, retention](https://www.singular.net/blog/app-intents-ios18/))
- **Share Extension intent donation.** Adding `IntentsSupported` array with `INSendMessageIntent` (or custom intents) in Share Extension's Info.plist makes it appear in iOS Share Sheet's Suggestions row. ([Apple Developer — Supporting suggestions in your app's share extension](https://developer.apple.com/documentation/foundation/supporting-suggestions-in-your-app-s-share-extension); [Medium — Implement Share Extension Conversation Suggestions in Swift](https://medium.com/@aakashstha/understand-and-implement-share-extension-conversation-suggestions-in-swift-for-ios-a6956d7d8722))
- **Coachmark patterns.** "Coachmarks are transient UI guides that highlight features or functionalities that are new or important to the user, and are typically used in onboarding or introducing updates ... Coachmarks can help explain overly complicated or novel user interfaces to users, but they do not help solve the underlying problems of poorly composed interfaces." Notion Web Clipper teaches users via "lightweight interactive tutorial on their Getting Started page, teaching users actions they'll need with a fully functional checklist and high-contrast tooltips." ([Chameleon — Coachmarks pattern](https://www.chameleon.io/patterns/coachmarks); [Goodux — Notion's clever onboarding and inspirational templates](https://goodux.appcues.com/blog/notions-lightweight-onboarding); [UI Patterns — Coachmarks design pattern](https://ui-patterns.com/patterns/coachmarks))

### Implication for Tokoflow architecture

- **Path 6 (forwarded WA voice note) — explicit spec for cycle 28:**
  1. Android: Tokoflow declares `<intent-filter>` with `MIMETYPE = audio/ogg` and `audio/*`; `getStreamItem(EXTRA_STREAM)` reads the `.opus` file URI; Tokoflow's audio decoder pipes through libopus → PCM → Whisper-tiny. No new permissions.
  2. iOS: Share Extension declares `kUTTypeAudio` in `NSExtensionAttributes.NSExtensionActivationRule`; receives the audio data, persists into App Group container, main app picks up on next foreground. Same Whisper-tiny pipeline.
- **App Intents donation strategy (Day 1 iOS).** Donate three intents on launch: `CaptureVoiceNoteIntent`, `LogPaymentIntent`, `OpenTodayIntent`. They surface in Spotlight, Shortcuts, and predictive Siri suggestions. Action Button users can map "press to capture." This adds an iOS-native discoverable surface that doesn't depend on share-sheet rank.
- **Coach-mark trigger conditions (cycle 28 must specify):**
  - **Trigger A:** merchant's first 3 voice-notes contain the word "WA" or "WhatsApp" but no `share_target` source in `voice_notes` row → coach-mark surfaces in Now-card: "Lain kali, long-press voice note kat WhatsApp → Share → Tokoflow. Lebih cepat."
  - **Trigger B:** Day 7 with zero `share_target`-sourced voice_notes → Today briefing includes a one-line coach: "Tip: forward voice note pelanggan dari WA — saya boleh urus."
  - **Trigger C:** App Intents donation never explicitly surfaced — let the system handle discovery.
- **Share-target onboarding is opt-in, not blocking.** Cycle 22's zero-discovery sev-7 stays at sev-3 with these triggers; full closure requires Wave-2 merchant-evangelist video content (a positioning-team responsibility, not engineering).

---

## Q6 — Lock-widget-as-primary product (Jobs's 9→10 lateral)

**Headline finding (verdict):** **Aspirational for Wave 2, not Day 1.** iOS 17 brought interactive Lock Screen widgets and iOS 18 added Control Center custom controls — both of which CAN run an App Intent (and thus mutate state) without unlock. The constraint is that the widget *itself* refreshes only on a budgeted timeline (~1/min when AOD; system-controlled), so the lock widget can show *cached* "3 pending" counts and tappable claim buttons but cannot stream live updates the way a Live Activity can. Android's lock-screen widget API is even more constrained — Samsung One UI 7 added first-party AOD widgets but third-party support is **gated to Android 16 / One UI 8 (Summer 2025–H2 2025)**. So "delete the home screen entirely" works as a positioning narrative for Wave 2 launch but cannot be the Day 1 architecture without leaving the majority of MY/ID Android merchants (Xiaomi, Oppo, Vivo on Android 13–14) with a degraded product. **Day 1: Live Activity (iOS 16.1+) + Android home-screen widget + persistent foreground notification = the closest available "ambient surface."** Wave 2: lock widget upgrade as Android 16 rolls out.

### Cited facts

- **iOS 17 interactive Lock Screen widgets.** "Lock Screen widgets were introduced with iOS 16, but in iOS 17, they're interactive ... users can perform app functions directly from the widget without opening the app. For example, in Apple's Reminders app, users can mark off completed tasks directly within the widget." Tap actions execute App Intents; sensitive intents can require unlock via `IntentDescription.authenticationPolicy`. ([MacRumors — iOS 17 Lock Screen Features](https://www.macrumors.com/guide/ios-17-lock-screen/); [iMore — iOS 17's Interactive Widgets are a Home Screen game-changer](https://www.imore.com/ios/ios-17/how-to-use-interactive-widgets-on-ios-17-more-control-from-almost-anywhere); [AppleInsider — How to use interactive widgets in iOS 17](https://appleinsider.com/inside/ios-17/tips/how-to-use-interactive-widgets-in-ios-17))
- **iOS 18 Control Center custom controls.** "Controls are a new way to extend your app's functionality into system spaces including Control Center, the Lock Screen, and the Action button, and they're created using WidgetKit ... Controls can toggle a setting, execute an action, or deep link right to a specific experience." ([Apple Developer — ControlCenter](https://developer.apple.com/documentation/widgetkit/controlcenter); [9to5Mac — Developers can now create toggles for Control Center in iOS 18](https://9to5mac.com/2024/06/10/developers-toggles-control-center-ios-18/); [WWDC24 — Extend your app's controls across the system](https://developer.apple.com/videos/play/wwdc2024/10157/))
- **Android lock-screen widget timeline.** "One UI 6.1 introduced new widgets for Samsung phones' Lock screen and Always On Display, which debuted with the Galaxy S24 series. However, Samsung's phones and tablets let you add widgets to the lock screen, but they offer widgets only from first-party apps." Third-party support arrives in One UI 8 / Android 16 (Summer 2025+). ([Sammy Fans — Samsung's One UI 8 (Android 16) to support third-party lock screen widgets](https://www.sammyfans.com/2025/03/07/samsungs-one-ui-8-android-16-to-support-third-party-lock-screen-widgets/); [Samsung — Add widgets on Lock Screen and AOD in One UI 7+](https://www.samsung.com/ae/support/mobile-devices/how-to-add-widgets-on-the-lock-screen-and-aod-in-one-ui-7-or-later/); [SamMobile — One UI 8 could bring third party widgets to lock screen](https://www.sammobile.com/news/one-ui-8-bring-third-party-widgets-lock-screen/))
- **Apple Watch complication design lessons.** "Most wrist-based usage sessions never exceed 10 seconds." "Excessive detail or navigation strips away at the primary benefit — frictionless, quick status checks." "Limit text to 7-9 characters on small complications." Direct lessons for Tokoflow's lock widget: glanceable, ≤9 chars per slot, single-tap action only. ([Apple Developer — Complications HIG](https://developer.apple.com/design/human-interface-guidelines/complications); [Moldstud — Designing Complications for Apple Watch Do's and Don'ts](https://moldstud.com/articles/p-the-ultimate-guide-to-designing-complications-for-apple-watch-dos-and-donts); [Todoist — 10 Lessons We Learned Designing Todoist for Apple Watch](https://www.todoist.com/inspiration/lessons-learned-designing-todoist-apple-watch))
- **Android NotificationListener silent revocation reality.** Xiaomi/MIUI, Oppo, Huawei battery-saver mechanisms can silently disable NotificationListenerService. "MIUI is quite aggressive at killing apps in the background ... background processing simply does not work right and apps using them will break." Heartbeat detection (Tokoflow self-tests by recognizing its own test-payload notif every 7 days) is the documented community workaround. ([dontkillmyapp.com — General problem](https://dontkillmyapp.com/general); [dontkillmyapp.com — Xiaomi specifics](https://dontkillmyapp.com/xiaomi); [dontkillmyapp.com — Oppo specifics](https://dontkillmyapp.com/oppo); [dontkillmyapp.com — Huawei specifics](https://dontkillmyapp.com/huawei))
- **Apple Wallet boarding-pass Live Activity (iOS 26)** is the closest production example of "ambient surface = primary use." Once added, the Live Activity stays pinned for the whole travel session; users rarely open the Wallet app during this period. ([9to5Mac — iOS 26 boarding passes United](https://9to5mac.com/2025/10/05/ios-26-wallet-app-new-boarding-pass-features-united-airlines-support/); [9to5Mac — iOS 26 boarding passes Southwest Delta](https://9to5mac.com/2025/12/22/apple-wallets-ios-26-boarding-passes-now-offered-by-three-major-airlines/))

### Implication for Tokoflow architecture

- **Day 1 ambient surface stack:**
  - **iOS:** Live Activity (rush mode, Q1) + Lock Screen widget (3-pending count, taps to open) + Control Center custom control (1-tap mic capture). All three use App Intents.
  - **Android:** Home-screen widget (3-pending + mic CTA) + persistent foreground notification (with action: "Tap to capture"). Lock-screen widget = deferred to Wave 2 when Android 16 / One UI 8 reach merchant device base.
- **Wave 2 narrative:** "Lock widget IS Tokoflow" — but only after iOS-17+/Android-16 device penetration in MY+ID merchant cohort hits ≥60%. Phase 0 spike must measure device-OS distribution in the first 50 alpha merchants.
- **NotificationListener heartbeat (cycle 26 §10 fix).** Tokoflow self-test every 7 days: post a local notification with a special test payload; verify NotificationListenerService callback fires within 5s. If 2 consecutive misses → coach-mark "your phone may be killing notifications" with deep links to Xiaomi/Oppo/Huawei battery-saver settings (per dontkillmyapp.com playbook).
- **Lock widget content budget (Apple Watch lessons applied):** glance = "3 unpaid · RM 540"; tap → open Live Activity / app. No multi-step flows, no scrolling, ≤9 chars per slot. Refresh budget assumes data is stale up to 1 minute — copy must not look real-time on the widget surface (Live Activity is the real-time channel).

---

## Implications for cycle 28 SEAMLESS_SYNTHESIZE

The six boundary-contract decisions cycle 28 must resolve, ranked by sev impact on the integration score:

### 1. iOS magic-parity strategy → **honest pricing-tier + Wave-2 Live Activity Rush Mode**

- **Day 1 iOS Free:** Path 3 (manual share) + Path 5 (voice mention) + Path 6 (WA voice forward via Share Extension) + App Intents donation (Spotlight/Siri/Shortcuts). No Live Activities.
- **Day 1 iOS Pro (when Pro launches):** above + Live Activity Rush Mode (merchant taps "Buka rush mode" at start of service window — session-scoped; server pushes payment events into the LA for the duration) + Pro-tier merchant-bank webhook (closes the no-NotificationListener gap structurally).
- **Onboarding copy (iOS Day 1):** explicit, not euphemistic — "Kat iPhone, share notification setiap kali. Kat Android, auto sekali setup. Same magic, different effort." Refuse-list-style honest framing.

### 2. Sensory-ceremony decay grammar → **first-of-window full ceremony, decay then silent, batch-summary at window close**

| Position in 5-min burst | Visual | Sound | Haptic |
|---|---|---|---|
| 1st | 1.5s full ceremony | Full chime | `.light` + `.selection` |
| 2nd | 1.0s shortened | 50% ducked chime | `.light` only |
| 3rd | 600ms slide-in | Silent | Silent |
| 4th–Nth | 300ms tint flash, no movement | Silent | Silent |
| Window close | Single rollup card | Single chime | `.medium` impact |
| First voice-note of calendar day | Always full ceremony, regardless of position | Always full | Always full |

Reduce-motion accessibility: all visual degrades to opacity-fade; sound + haptic budget unchanged.

### 3. Optimistic UI commitment → **Linear-pattern: in-memory + IndexedDB + GraphQL/REST mutations + server-authoritative ordering**

- Library: **TanStack DB + Electric SQL** if beta has stabilized by Phase 1 build (else hand-rolled per Linear pattern).
- Three sync states with shadow-token grammar: `capturing` (no card) → `extracting` (card with ghosted entity chips, 1pt softer drop-shadow) → `synced` (full fidelity, default shadow). Engineering-vocab leak `"🛜 sync pending"` is **forbidden**.
- Sync ordering: client UUID + `created_at_local` for display, server `created_at_server` for canonical order.
- **Reconciliation runs twice:** once at insert, once 60s after `voice_notes.llm_processed_at` populates. Orphan `payment_events` stay in re-match queue for 60 minutes.
- Composite confidence = `min(extract_conf, match_conf)` (cycle 26 §2 fix). UI chip color = minimum.
- Schema unification (cycle 26 §3 fix): `payment_events` collapsed into `voice_notes` with `source_input='payment_notification'` and `payload JSONB` carrying amount/sender/method/ref. Diary-IS-DB preserved.

### 4. Share-target onboarding & App Intents registration → **Path 6 spec + Day 1 intent donation + 3 coach-mark triggers**

- **Path 6 (forwarded WA audio):** Android intent-filter `audio/ogg` + `audio/*`; iOS Share Extension `kUTTypeAudio`. Decode to PCM → Whisper-tiny (existing pipeline).
- **App Intents donation Day 1 (iOS 17+):** `CaptureVoiceNoteIntent`, `LogPaymentIntent`, `OpenTodayIntent`, `ClaimPaymentIntent` (last surfaces inside Live Activity expanded view).
- **Coach-mark triggers:**
  - First 3 voice-notes mention "WA" but `source_input != 'share_target'` → inline tip.
  - Day 7 with zero share_target voice_notes → soft tip in Today briefing.
  - App Intents discoverability handled by system, no explicit coach-mark.

### 5. Lock-widget as primary → **Day 1 = ambient stack (LA + widget + notification); Wave 2 = lock-widget primacy**

- **Day 1 iOS:** Live Activity (Pro rush mode) + Lock Screen widget (3-pending glance, App Intent on tap) + Control Center custom control (mic capture).
- **Day 1 Android:** Home-screen widget + persistent foreground notification w/ action button. Lock-screen widget deferred.
- **Wave 2 (post Android-16/One-UI-8 device penetration ≥60% in alpha cohort):** lock widget IS the primary surface; main app demoted to inspection-only. Phase 0 must measure device-OS distribution to gate the Wave-2 trigger.
- **NotificationListener heartbeat:** weekly self-test; 2 consecutive misses → MIUI/Oppo/Huawei-specific coach with deep link to vendor battery-saver settings.

### 6. Burst-load suppression rules → **scene detection + group-summary alert behavior + reduce-motion fallback**

- **Lunch rush:** ≥3 captures in 5 minutes → enter burst mode → per-event ceremony decays per §2 above; Android `setGroupAlertBehavior(GROUP_ALERT_SUMMARY)`; only daily-summary chimes.
- **Lebaran rush:** same trigger, longer window (30 min instead of 5 min) — detected by date proximity to hardcoded Hari Raya / Aidilfitri dates.
- **Offline-drain:** N>3 queued items syncing on reconnect → batch-summary signature only; per-event filing visual-only (shadow tint update); single window-close rollup.
- **Pasar context:** long quiet (>2 hours since last capture) followed by sudden burst → ducked audio (×0.3 volume) + visual-only filing for first 60 seconds.
- **Hard ceiling:** max 5 sensory signatures/second app-wide (below Android's 10/sec drop threshold). Engineering must enforce this server-side via a debounce on the realtime channel.

---

## Source count & coverage check

**Cited sources: 50+** across 6 questions, all dated 2024–2026 or evergreen Apple/Google/Android documentation. No invented citations.

- Q1 (Live Activities): 7 sources — Apple docs, Pushwoosh, Newly, Swift with Majid, Infinum, 9to5Mac, Strava
- Q2 (burst suppression): 8 sources — Saket Narayan rate limiting, Android Developers grouping, Slack rate limits, Material 3, Apple Focus filters, OneSignal
- Q3 (optimistic UI): 11 sources — Bytemash Linear, Fujimon Linear, localfirst.fm, Apollo, Relay, Replicache, TanStack DB, Electric, Figma blog, Liveblocks, PowerSync Cinapse
- Q4 (sensory decay): 7 sources — Apple HIG haptics + feedback, ScienceDaily, Sage Journals (Brady & Prentice), UBC Brooks & Clark, Capstone, Material 3 motion, Saket bundled notifications
- Q5 (share-target): 9 sources — Android Developers Direct Share, droidcon, Esper, Apple App Intents, WWDC24, Singular, Apple Share Extension docs, Chameleon coachmarks, Goodux Notion onboarding, Voice Note Tools
- Q6 (lock widget): 11 sources — MacRumors iOS 17, iMore, AppleInsider, Apple ControlCenter, 9to5Mac iOS 18 Control Center, WWDC24, Sammy Fans, Samsung Gulf, SamMobile, Apple Complications HIG, Moldstud, Todoist, dontkillmyapp.com (×4 pages), Apple Wallet 9to5Mac

**Gaps explicitly stated (do not invent):**
- No public production examples found of GoPay/DANA/OVO/Maybank/Touch'n Go using Live Activities for incoming-payment surfacing as of search date. iOS LA adoption in MY/ID fintech is shallow.
- Apple HIG does not publish numeric haptic-frequency thresholds; the decay envelope in Q4 is *informed* by Apple's "use sparingly" + loot-box research, not directly quoted from Apple.
- Linear's exact rollback semantics on server reject are referenced via Apollo/Relay analogy because Linear's full rollback contract is not publicly documented (only the GraphQL + WebSocket shape is).

This research feeds cycle 28's boundary contract. Quality bar for cycle 28: every one of the 6 boundary decisions above must be specified to the level of "engineering can implement without further design pass."
