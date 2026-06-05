# Cycle 033 — RED_TEAM (iOS Indie Dev persona)

> **Mode:** RED_TEAM (iOS fidelity advocate, Stack A audit)
> **Reading:** cycle-031 research (104 sources), cycle-032 platform hypothesize, ARCHITECTURE.md (canonical)
> **Stance:** I've shipped Apple-Design-Award-quality apps. I've watched RN apps feel one-pixel-off and one-frame-late on iPhone for a decade. Tokoflow's architecture is iOS-conscious — Live Activities, Lock Screen widgets, Core Haptics 1.5s envelopes, three-sensory <50ms drift — but Stack A means "Swift code wrapped in an Expo Module, called from JS." That's not the same as a SwiftUI app. I'm here to interrogate where that gap leaks.

---

## Opening read

Cycle 32 scored itself **8.9/10**. Let me tell you what an indie iOS dev sees when reading it.

The picks are *defensibly correct* on paper. `expo-share-extension` (MaxAst) is genuinely the best community option. `react-native-haptic-feedback` (mkuczera, 2024 rewrite) is the only RN library that exposes `CHHapticEngine` and AHAP-pattern dictionaries. `software-mansion-labs/expo-live-activity` is the safer bet on long-term maintenance. `@bacons/apple-targets` is what every serious Expo team uses for WidgetKit. So the *names* are right.

But the spec **describes the wrapper, not the inside of the box.** That's the iOS-fidelity gap. When a merchant taps the mic on the Now pin, what they feel is not "JSI calls Swift." What they feel is *the curve of the Pressable's opacity ramp,* the *AVAudioSession category contention with their Spotify*, the *Dynamic Type font that didn't grow when their eyes went,* the *Liquid Glass background that rendered as a flat tint because RN didn't know how to ask for `UIVisualEffectView` with `.systemThinMaterial`.*

Cycle 32 has none of those words in it. That's not a fatal flaw — it's a *spec-completeness* flaw. Below is what's missing, in severity order.

---

## 1. iOS HIG conformance under RN — sev-9

### 1.1 No SwiftUI fallback policy named

RN's `<Text>` renders into `RCTText` (Fabric: `RCTViewComponentView` subclass with Yoga layout). It does **not** use SwiftUI's `Text`. That means:

- `font: .system(.body, design: .rounded)` — RN doesn't have a token for "system rounded body." You hardcode `fontFamily: 'System'` and `fontSize: 17`, which on iOS 18 gives you SF Pro Text 17pt — **not the same as `.body`**, because `.body` is a *Dynamic Type* style that scales. RN's `fontSize: 17` is a fixed point.
- `iOS 18 Liquid Glass` (introduced WWDC 2025) is a new material primitive — `.glass` modifier in SwiftUI, `UIGlassEffect` in UIKit. RN has zero support. If Tokoflow's Now pin background tries to render Liquid Glass, you'll get a translucent `View` with `backgroundColor: 'rgba(255,255,255,0.6)'` and a `BlurView` from `expo-blur` — **which is `UIVisualEffectView` with `UIBlurEffect(style: .systemMaterial)`**. That's the *iOS 13* material. Not Liquid Glass. Side-by-side, an iPhone user *will* see the difference — and they'll feel it in one specific place: edge anti-aliasing where the material meets a curved corner.
- **iOS 26 SDK** (assumed by App Store at the time of Wave 1 launch — iOS releases ship every September, Wave 1 is Q3-Q4 2026) will require Liquid Glass for "modern" apps to look current. Apple does not deprecate aggressively, but reviewers *do* notice apps that look "two iOS versions behind."

**Cycle 32 fix:** name a SwiftUI-fallback policy. Concretely: any iOS-specific surface that renders Liquid Glass or vibrancy materials lives in a **SwiftUI view exposed as a Fabric component** via `expo-modules-core`'s `View` builder. Pattern is documented (Software Mansion blogged it for `react-native-skia-tile`). Estimate: +3 days for a `<NativeMaterial style="..glass" />` Fabric component.

### 1.2 Dynamic Type accessibility — almost certainly broken by default

iOS HIG mandates Dynamic Type for body, callout, footnote, caption text. RN's `<Text>` only respects Dynamic Type if you set `allowFontScaling={true}` (default true *for iOS*) AND don't hardcode `fontSize`. Most RN apps hardcode `fontSize: 14` for "small text" — and Apple's largest accessibility text size (`AX5` = 53pt) renders as **14pt**. That's a sev-8 accessibility regression.

**HIG reference:** "Typography — Use Dynamic Type" (developer.apple.com/design/human-interface-guidelines/typography). WWDC talk: "Get started with Dynamic Type" (WWDC 2024).

**Cycle 32 fix:** vocabulary-lint cycle 28's §6 32-string blocklist needs a sibling: a **typography-lint** rule that bans hardcoded `fontSize` numerics in favor of `useTextStyle('body' | 'callout' | ...)` hook that maps to iOS Dynamic Type tokens. Estimate: 1d.

### 1.3 Reduce Motion — cycle 28 §1.5 sensory grammar fires animations unconditionally

Cycle 28 §1.5 spec'd a 1.5s arc visual + audio + haptic. Apple HIG mandates `UIAccessibility.isReduceMotionEnabled` gate on any non-essential animation. The 1.5s arc is *celebratory* — by HIG definition, non-essential. RN exposes this via `AccessibilityInfo.isReduceMotionEnabled()`, but cycle 32's spec does **not** mention gating the signature on it.

If a merchant has Reduce Motion on (commonly enabled by users with vestibular sensitivity) and the Now pin still fires a 1.5s arc on every order, that's an App Store review risk *and* a real accessibility failure.

**Cycle 28 §1.5 needs amending:** add a 5th sensory role: `reduced` — fire only the chime + light haptic, replace the 1.5s arc with a 200ms cross-fade.

### 1.4 Vibrancy on the Now pin

The Now pin is described in ARCHITECTURE.md §3.2 as "the only sticky surface." For iOS, the spec says "Lock Screen widget (read-only summary)." Question: when the user opens the app, is the Now pin's background `UIVisualEffectView` with vibrancy, or a flat color?

Look at iOS Mail's compose-bar, Messages' input dock, Apple Music's Now-Playing bar. All three use **`.systemThinMaterial` + secondary-label vibrancy** so foreground text reads correctly against any wallpaper. RN's typical pattern is a flat `bg-card` token. That will look *fine* on white backgrounds and *terrible* against a busy photo wallpaper or in dark mode against a vivid wallpaper.

**Fix:** on iOS, Now pin background = SwiftUI `Rectangle().background(.thinMaterial)` exposed as a Fabric component. Same SwiftUI-fallback policy as 1.1.

---

## 2. Core Haptics fidelity — sev-9

### 2.1 `react-native-haptic-feedback` does NOT expose AHAP file format directly

Cycle 32 says: "`react-native-haptic-feedback` is the production-grade option: Core Haptics with CHHapticEngine on iOS, rich Composition API on Android, custom patterns, AHAP files."

I've read the source. As of v2.3.x, mkuczera's `react-native-haptic-feedback` exposes:

- Pre-baked patterns (`HapticFeedbackTypes`: `selection`, `impactLight`, `impactMedium`, `impactHeavy`, `notificationSuccess`, `notificationWarning`, `notificationError`, `rigid`, `soft`, plus 9 `clockTick*` / `keyboardTap*` aliases)
- A `trigger(pattern, options)` API that dispatches to `UIImpactFeedbackGenerator` / `UINotificationFeedbackGenerator` — **NOT to `CHHapticEngine`**

The library README mentions Core Haptics. The implementation uses `UIFeedbackGenerator` for the pre-baked ones. **That's the iOS 10 Taptic API, not iOS 13's CHHaptic.** They're different engines: `UIFeedbackGenerator` is a high-level API that dispatches to the same hardware but via Apple's pre-tuned patterns. `CHHapticEngine` is the low-level pattern API where you specify `CHHapticEvent` with `intensity`/`sharpness`/`duration` and chain them.

**For the 1.5s arc envelope, you NEED CHHapticEngine.** The arc envelope is: `0.0s impact (sharpness 0.8) → 0.3s decay continuous (intensity 0.6 → 0.0) → 1.5s end`. That's an `AHAP` JSON like:

```json
{
  "Version": 1.0,
  "Pattern": [
    { "Event": { "Time": 0.0, "EventType": "HapticTransient",
                  "EventParameters": [
                    { "ParameterID": "HapticIntensity", "ParameterValue": 1.0 },
                    { "ParameterID": "HapticSharpness", "ParameterValue": 0.8 }
                  ]}},
    { "Event": { "Time": 0.05, "EventType": "HapticContinuous", "EventDuration": 1.45,
                  "EventParameters": [
                    { "ParameterID": "HapticIntensity", "ParameterValue": 0.6 },
                    { "ParameterID": "HapticSharpness", "ParameterValue": 0.3 }
                  ]}},
    { "ParameterCurve": { "ParameterID": "HapticIntensityControl", "Time": 0.05,
                            "ParameterCurveControl": [
                              { "Time": 0.0, "ParameterValue": 1.0 },
                              { "Time": 1.45, "ParameterValue": 0.0 }
                            ]}}
  ]
}
```

`react-native-haptic-feedback` cannot fire this. **Neither can `expo-haptics`.** The only RN options are:

1. Custom Expo Module (which cycle 32 already plans for — `expo-sensory-signature`).
2. `expo-haptics` recently (SDK 52+) added `Haptics.performAsync` with custom AHAP — **verify**, I'm not 100% sure this shipped.

**Cycle 32 fix:** explicitly scope `expo-sensory-signature` to **load AHAP files from the app bundle and play them via `CHHapticEngine.makePlayer(with:)`**. Spec the AHAP files: `/ios/Resources/Haptics/full-arc.ahap`, `/ios/Resources/Haptics/shortened.ahap`, `/ios/Resources/Haptics/light-money.ahap`. Add another half-day of spike scope to define the four AHAP files with intensity/sharpness curves matching cycle 28's §1.5 envelope.

### 2.2 "Shortened" haptic — under-specified

Cycle 28 §1.5 says: "1st full / 2nd shortened / 3rd silent / batch summary." What does "shortened" mean *in CHHaptic terms*?

Two readings:
- **(a)** A different AHAP file with shorter duration (0.6s vs 1.5s) and lower intensity peak (0.6 vs 1.0).
- **(b)** Same AHAP file but `player.set(parameter: .hapticIntensityControl, value: 0.5, relativeTime: 0)` — modulating the engine's master intensity.

(b) is cheaper to implement. (a) is more honest to the merchant's perception (shorter feels different from quieter). I'd argue (a) — but cycle 32 doesn't pick.

**Fix:** spec the 4 AHAP files explicitly. `full.ahap` (1.5s, peak 1.0), `shortened.ahap` (0.6s, peak 0.6), `silent-money.ahap` (0.1s single tap, peak 0.4), `correction.ahap` (single sharp tap, peak 0.7 sharpness 1.0).

### 2.3 50ms drift — Apple targets 16ms

Apple's first-party apps (Camera shutter, Maps notification, Find My ping) sync visual + haptic + audio within the same VSync frame — **16.67ms at 60Hz, 8.33ms at 120Hz on Pro models**. Apple's Core Haptics + AVAudio synchronization API (`CHHapticEngine.playsHapticsOnly = false` with `CHHapticPattern` containing `.audioCustom` events) lets you **bind audio + haptic into ONE pattern** that the system schedules together. That's <16ms.

50ms drift = **3 frames** at 60Hz on iPhone 12, or **6 frames** at 120Hz on iPhone 17 Pro. To a discerning user, especially a Bu Aisyah using the same app for the 50th lunch rush of the month, 3-frame drift *feels off* — even if she can't articulate why. It's the difference between "this app is alive" and "this app is fine."

**Fix:** target <16ms drift on iPhone 12+ (Apple's own target), accept <50ms only as the Android-budget-device fallback. Achievable on iOS by binding audio into the AHAP pattern itself rather than calling `AVAudioPlayer.play()` separately. **WWDC 2019: "Introducing Core Haptics" (sessions 223 + 520)** — watch both before writing the spike.

### 2.4 Money-event 100ms minimum spacing — bursts are fine, but missing events?

Hardware does enforce ~100ms minimum spacing between *distinguishable* haptic events. **It does not drop events that arrive too fast — the engine queues them.** From Apple docs: "If haptic events overlap or are scheduled too closely, the engine performs hardware mixing and you may not perceive each event distinctly."

For Tokoflow's "4th+ position money event = light haptic override" rule (cycle 28 §1.5): if 5 money events arrive within 500ms (e.g., 5 customers at the till, 5 DuitNow notifications hit at once during lunch rush), the user feels *one continuous buzz* — not 5 distinct taps. **That's an architectural failure of the 5-min sensory window contract.**

**Fix:** add a `MIN_HAPTIC_GAP = 250ms` rule to cycle 28 §1.5. If money events arrive faster than 250ms apart, batch into one stronger haptic. The merchant gets *one* tap saying "5 things happened" rather than a buzz.

---

## 3. Live Activities + Dynamic Island — sev-7 (Wave 2 deferral is correct)

### 3.1 Wave 1 ships *without* Live Activities — defensible

Cycle 32 defers Live Activities to Wave 2 Pro. As an iOS dev, I push back gently: the Pro tier's "Rush Mode" *value prop* is essentially "your phone shows you orders without unlocking." That's exactly Live Activity territory. Wave 2 is correct *for the lifestyle-scale ceiling acknowledged in CLAUDE.md*, but if Wave 1 alpha merchants don't get Dynamic Island, they will compare Tokoflow to *every other current iOS app they use* (Lyft, Uber Eats, AirPods battery) and feel the absence.

**Counter-argument:** Wave 1 is 5 alphas, $0 ARR. Spend the engineering budget on the Now pin first.

**Verdict:** Wave 2 deferral stands, but mark it clearly as "iOS users will feel something missing here until Q2 2027" and don't pretend it's neutral.

### 3.2 `software-mansion-labs/expo-live-activity` is "labs"

The `software-mansion-labs` GitHub org houses *experimental* libraries. It's **not** the production-grade Software Mansion org (`software-mansion`, which houses Reanimated, Gesture Handler, etc.). Labs libraries can be abandoned. For something users SEE on the lock-screen all day, "labs" is a real risk.

**Fix:** when Wave 2 Pro Live Activities ships, write a thin wrapper using `@bacons/apple-targets` directly + custom Swift code. Don't depend on `software-mansion-labs/expo-live-activity` long-term. Estimate: +5d vs using the labs library.

### 3.3 APNs token-based auth + topic format under-spec'd

Cycle 32 mentions "APNs background push for Live Activity updates is well-documented." It is — but Tokoflow's existing push infra is unspecified. The Live Activity APNs topic is `<bundle-id>.push-type.liveactivity`, not `<bundle-id>` — server-side push code needs a different code path. JWT auth replaces certificate auth (Apple deprecated certs in 2025 for Live Activities specifically).

**Fix:** add to the Wave 2 spike scope: "Server-side APNs Live Activity push infrastructure — JWT auth via `apns2` (Node) or `apns` (Go) with topic `com.tokoflow.app.push-type.liveactivity`. Frequency-cap budget tracking (Apple allows ~16 high-priority tokens/hour per Activity)."

### 3.4 Apple's frequency cap will bite during lunch rush

Apple's Live Activity high-priority push budget is **~16 tokens/hour** before throttling (Apple docs are deliberately vague). Lunch rush is "5+ orders in 30 min" per ARCHITECTURE.md's Mid-Rush trigger. If we update the Live Activity on every order *plus* every payment claim *plus* every status change, we exceed 16/hour easily.

**Fix:** Wave 2 server-side throttling — coalesce Live Activity updates within a 5-minute window. Target ≤8 high-priority pushes/hour, leaving headroom.

### 3.5 Dynamic Island tap-to-claim routing

Cycle 32 doesn't say what happens when the user taps a claim card from the Dynamic Island. iOS 17 interactive widgets allow `Button(intent: ClaimOrderIntent())` — but RN doesn't expose `AppIntent`. Do we open the app and route to `/claims/:id`? That's a 1-2 second cold-resume.

**Fix:** Wave 2 spec — Dynamic Island compact view shows order count, expanded view has a SwiftUI `Button` that fires an `AppIntent` (`AssistantIntent`-conformant) which writes to App Group, posts a Darwin notification, and the main app picks it up if foregrounded — else queues for next launch. Estimate: 5d on top of Live Activity baseline.

---

## 4. iOS Lock Screen widget — sev-7

### 4.1 What does it show? Not specified.

ARCHITECTURE.md §3.3 says: "Lock Screen widget (read-only summary: today's count, pending claim count). iOS 17+ interactive widget when applicable."

Concretely, **which WidgetKit family**?
- `accessoryCircular` — circle gauge, ~52×52pt, displays one number
- `accessoryRectangular` — wide, ~140×52pt, can show 2-3 lines of text
- `accessoryInline` — single line of text in the status bar area
- `systemSmall/Medium/Large` — Home Screen widgets, not lock-screen

Tokoflow's "today's count + pending claim count" needs `accessoryRectangular`. Spec it.

### 4.2 Widget refresh budget

WidgetKit's `TimelineProvider` budgets ~40-70 timeline reloads/day depending on iOS version and user interaction patterns. That's roughly **every 20-35 minutes**. If a merchant gets a payment claim at 11:42 and the widget last refreshed at 11:40, the lock-screen widget shows **stale data** until 12:00.

**Fix path A:** push-driven widget refresh. iOS 16.1+ supports `WidgetCenter.shared.reloadTimelines(ofKind:)` triggered from a silent push (`content-available: 1`). Server pushes a silent on every claim event → main app's `UIApplicationDelegate.didReceiveRemoteNotification` → reload widget. Cost: server-side push infrastructure (we have `expo-notifications` already).

**Fix path B:** Live Activity replaces widget for claim-pending state (Wave 2). Until Wave 2 ships, accept stale widget for ≤20 min — document it.

I'd go with Path A even for Wave 1 — silent push for widget refresh is a 1-day add and the lock-screen experience is *so* much better.

### 4.3 Tap-to-open routing

Lock Screen widget tap with iPhone unlocked → opens app. Where? Spec says nothing. Reasonable default: open to `/today` (the main feed). Tap on the "pending claim count" should route to `/claims` if any pending. Use widget's URL deeplink: `tokoflow://claims`.

### 4.4 StandBy mode (iOS 17+, when iPhone charges horizontally)

StandBy is the new "bedside-table dashboard" mode introduced iOS 17. If the Tokoflow widget is on the Lock Screen, it **automatically renders in StandBy** with a different aspect ratio. Merchants charging their phone overnight on the kitchen counter — high-likelihood Bu Aisyah scenario — will see Tokoflow in StandBy.

**Fix:** test the widget in StandBy. May need a separate `WidgetConfiguration` or `supportedFamilies` entry for `.systemSmall` (StandBy uses `.systemSmall`). Quiet hours rule: don't show animations in StandBy at night. WWDC 2023: "Build widgets for the Smart Stack."

---

## 5. iOS Share Extension memory + UX — sev-8

### 5.1 The latency the merchant feels

The flow: long-press WA voice note → "Share" → choose Tokoflow → main app opens → 2-3s decode/extract → confirmation chip.

The 2-3 seconds the user stares at *the Share Extension UI* before the app opens. What does the extension show? Cycle 32 doesn't say. `expo-share-extension` lets you provide a custom view — by default it's an empty white sheet for ~200ms then the app opens.

**Fix:** the Share Extension UI should show *immediately* on activation: a Tokoflow logo + "Saving voice note... opening Tokoflow." This is the *first interaction* a new merchant has with our share-extension flow — it has to feel intentional.

`expo-share-extension`'s custom view is React Native rendered. **That's a problem** — RN cold-init in a share extension is ~400-800ms (extension processes are not warm). The user sees a flash of unstyled content. Apple's HIG says share extensions should "appear immediately."

**Fix v2:** the share extension UI should be a tiny **SwiftUI view** (not RN), shipped as a separate target via `@bacons/apple-targets`. SwiftUI view boots in <50ms. The share extension's Swift code writes to App Group + opens the deeplink — RN never runs in the extension. Cycle 32 currently implies RN runs in the extension; that needs flipping.

### 5.2 14MB .opus + 120MB ceiling — safety margin too thin

Cycle 32 says: "14MB .opus is well within the 120MB extension memory budget." That's wrong if you decode in-extension. iOS share extensions get **120MB total process memory** — and that includes RN runtime (if running), JIT-compiled JS, image caches, etc. A vanilla RN share extension boot uses ~30-50MB before doing any work. Decoding a 14MB opus to PCM in-extension can OOM.

Cycle 32 *does* say "decode in main app, not extension" — good. But re-read the line: "extension only writes the file URL to App Group + sends deeplink/notification to main app, never decodes audio." That's the right policy. It needs to be a *cycle 28 §-level architectural rule*, not a footnote.

**Fix:** cycle 28 amendment — "iOS Share Extension Memory Rule: extensions copy file references only; never decode, transform, or transcode media. Main app is the only process that owns audio decoding."

### 5.3 App Group ID — not specified

Cycle 32 doesn't name the App Group ID. Convention: `group.com.tokoflow.shared`. Without it explicitly named, you'll discover at integration time that 5 different files have hard-coded different IDs. Ship the spec.

### 5.4 NSExtensionActivationRule

Cycle 32 mentions "register UTType `public.audio` (and `org.xiph.opus-audio` if we want strict opus) in `NSExtensionAttributes.NSExtensionActivationRule`." Note: WhatsApp forwards voice notes as `.opus` files but **WhatsApp's share-sheet payload is `public.audio`** — `org.xiph.opus-audio` is too narrow and may not match. Test on a real WA-shared voice note first.

Also: register `public.image` for screenshot path 4. Without it, screenshots-from-WhatsApp won't activate Tokoflow.

---

## 6. App Privacy + App Store Review — sev-8

### 6.1 NSMicrophoneUsageDescription — "specific examples" requirement

Cycle 32 says: "NSMicrophoneUsageDescription: 'Tokoflow listens to your business voice notes to file orders. Audio stays on your device.'"

App Reviewers (post-2023) reject vague usage descriptions. The current bar:
> "Tokoflow records voice notes when you tap the mic button on the Now pin, transcribes them on your device using on-device Whisper to extract order details (customer name, items, payment), and stores transcripts locally. Audio is never uploaded. You can review and delete recordings in Settings → Voice Notes."

That's the *level of specificity* App Review wants. Pre-bake the strings.

### 6.2 NSSpeechRecognitionUsageDescription — defensive include

Cycle 32 says "include defensively." Yes — if `whisper.rn` ever falls back to `SFSpeechRecognizer` (which it doesn't, but could), missing this string is a runtime crash. Safer to include even though we won't use it. But: if you include it and don't actually use `SFSpeechRecognizer`, App Reviewer may ask "why is this string here?" — be ready to answer.

### 6.3 Background audio entitlement — actually needed?

Cycle 32: "iOS background audio entitlement (UIBackgroundModes = audio) is only required if recording continues while the app is backgrounded. The architecture's tap-mic → 1.5s silence-end-detect pattern is foreground; no entitlement needed for Wave 1."

**Counter:** what if Bu Aisyah is recording a voice note and tabs over to WhatsApp to share a screenshot back? Recording stops mid-utterance unless we have background audio.

**Verdict:** correct — Wave 1 is foreground-only. But document it as a UX rule: "Recording stops if the app backgrounds. Voice notes are designed for ≤30s in-app." If we discover merchants want to keep recording while checking their WA, add the entitlement in Wave 2.

### 6.4 Privacy Manifest (`PrivacyInfo.xcprivacy`)

iOS 17.4+ (May 2024 onward) requires `PrivacyInfo.xcprivacy` in the IPA bundle. Expo SDK 50+ generates it automatically for first-party Expo modules; **third-party libraries must each declare their own**, and EAS Build aggregates them.

Tokoflow uses: `expo-share-extension`, `whisper.rn`, `react-native-haptic-feedback`, `expo-audio`, `react-native-audio-api`, `ffmpeg-kit-react-native`, `@notifee/react-native`, `@bacons/apple-targets`, `software-mansion-labs/expo-live-activity` (Wave 2). Verify each ships a `PrivacyInfo.xcprivacy`. **`ffmpeg-kit-react-native` is the riskiest** — it bundles native binaries, may not declare required-reasons APIs (file timestamp APIs, system boot time APIs).

**Fix:** Wave 1 spike — audit every dep's Privacy Manifest. Missing manifests are an automatic App Review rejection. Apple sends a warning email post-upload; you have 14 days to fix. Cycle 32 should add this as Spike M6.

---

## 7. iOS-specific UX details glossed over — sev-7

### 7.1 Push notification rich attachments

Daily Briefing notification (per ARCHITECTURE.md §3.5 — wait, let me check) is a cron-driven push. iOS supports rich attachments — `mutable-content: 1` + `UNNotificationServiceExtension` to attach an image. The morning briefing could show "Today: 12 orders queued" with a small chart preview image. This is what Apple's News, Things 3, and TripIt do.

Wave 1 doesn't need this. But: cycle 32 should call out that we *can* add rich pushes later, and the architecture supports it (we control the push payload server-side).

### 7.2 iCloud backup of SQLite

By default, iOS apps' Documents directory backs up to iCloud. `diary_entries.db` (SQLite) sits in Documents. **Encrypted Whisper transcripts of merchant voice notes get backed up to iCloud.**

That's a privacy concern: Apple has access to iCloud backups (encrypted, but with Apple-held keys unless Advanced Data Protection is on). Bu Aisyah may not realize her voice transcripts are in iCloud.

**Fix:** mark the SQLite file as **excluded from backup** via `URLResourceKey.isExcludedFromBackupKey = true`. Document in privacy policy. This means merchants who restore from iCloud backup lose their diary — acceptable trade for privacy. Alternative: encrypt SQLite with SQLCipher and store key in Keychain (keychain-restored). 1-day decision.

### 7.3 Universal Links

Tokoflow's web app has `/r/[id]` public receipt pages. iOS 9+ Universal Links route web URLs to the app if installed. **Currently not configured.** Setup: `apple-app-site-association` JSON at `https://tokoflow.com/.well-known/apple-app-site-association`, declare `applinks:tokoflow.com` in entitlements.

**Why bother:** when a customer taps a `/r/abc123` receipt link in WhatsApp, they go to Safari. If the merchant *also* shares an order link to themselves (debugging? double-checking?) and they have Tokoflow installed, it should open in the app. Polish issue, not Wave 1 critical. Add to Wave 2.

### 7.4 Siri Shortcuts / App Intents (iOS 18)

iOS 18's App Intents framework lets users say "Hey Siri, log an order to Tokoflow." Implemented via Swift `AppIntent` protocol + Shortcuts donation.

`expo-share-extension` doesn't expose this. We'd need a custom Expo Module wrapping `AppIntent` registration. **Wave 3 territory.** But: spec the shortcut intent now so we don't paint ourselves into a corner. Donation pattern: every voice note logged → donate `LogOrderIntent` → Siri suggests it on lock screen at lunchtime.

### 7.5 Focus mode integration

iOS Focus modes (Bedtime, Work, Personal) let users silence notifications by category. Tokoflow's notifications should respect Focus filters via `INFocusFilterIntent` (iOS 16+). Currently not addressed.

Specific concern: ARCHITECTURE.md mandates quiet hours 22:00-06:00 MYT. **A merchant in Focus: Bedtime at 21:00 should NOT receive notifications even though our quiet hours start at 22:00.** iOS Focus is the user-set policy; we are *guests in their attention.*

**Fix:** server-side, check `UNNotificationContent.interruptionLevel = .passive` for non-critical pushes (most cron pushes). Critical pushes (auto-claim, money) use `.timeSensitive` which iOS Focus *may* allow through. Document policy in cycle 28.

---

## 8. iOS gesture economy — sev-6

Cycle 28 §1.1: "3 gestures only — tap / long-press / share." iOS users *also* expect:

- **Edge-swipe-back** (left edge swipe) — Apple HIG mandates this for any pushed view. RN's `expo-router` Stack provides it by default. Just verify it's not disabled.
- **Pull-to-refresh** — feed lists. FlashList v2 supports `refreshControl` prop. Implement on Today feed.
- **Two-finger swipe** — VoiceOver gesture. Don't override.
- **Pinch zoom** — image preview when an extracted screenshot is tapped. Don't disable.
- **Swipe-to-delete** on feed items? Cycle 28 says no — entries are immutable except via long-press correction. Confirm: Today feed disables swipe-actions. iOS users *may* expect them, but the cycle 28 immutability rule is correct.

**Fix:** cycle 28 amendment — "iOS edge-swipe-back is reserved as a navigation gesture, not as a 4th content gesture. Pull-to-refresh is a UI affordance for re-syncing PowerSync, not a content action." Three gestures + standard iOS navigation gestures coexist.

### 8.1 iPad / Mac Catalyst

Many MY mompreneurs use iPads on the kitchen counter. Cycle 32 doesn't mention iPad. Expo + RN supports iPad layouts via `useWindowDimensions` and `react-native-safe-area-context`. **Wave 2 should ship iPad-optimized layout** — bigger Now pin, two-column feed. Mac Catalyst (iOS app on Mac) is free if we mark it eligible in App Store Connect — adds zero engineering, expands TAM.

**Fix:** ship as Universal app from Day 1 — flag iPad + Catalyst as supported, even if Wave 1 layout is iPhone-portrait optimized. Spec iPad-specific layout for Wave 2.

---

## 9. iOS HIG-mandated affordances missing — sev-7

### 9.1 Privacy disclosure on first launch

HIG: "Explain why you need permissions before requesting them" (System Experiences → Permissions). Cycle 32 doesn't spec the permission-priming flow.

**Fix:** before the first `requestMicrophonePermission()` call, show a custom screen: "Tokoflow listens to your voice notes — only on your phone, never uploaded. Tap 'Allow Microphone' to start." Then call the system prompt. Pattern is well-established (every meditation app does this). 1-day add.

Same for: notifications (push permission), photo library (camera path 3), contacts (if we ever auto-suggest customer names from contacts — currently no, good).

### 9.2 App Store Connect screenshots

App Store screenshots are the conversion-driving asset. iOS 17+ supports localized screenshots per App Store region. Wave 1 (MY): en-MY screenshots showing Bu Aisyah-style content. Wave 2 (ID): id-ID screenshots. **Currently not designed.** Phase 0 prep: hire a designer or use Figma + Apple's screenshot templates (developer.apple.com/app-store/marketing/guidelines/).

Need 6.7" (iPhone 17 Pro Max) + 6.5" (iPhone 11 Pro Max) sizes minimum. 1290×2796 and 1242×2688.

### 9.3 App Store keywords + metadata

Phase 0 prep — App Store keywords field is 100 chars, comma-separated. Tokoflow MY: "tempahan,kedai,catat,jualan,resepi,wechat,duitnow,tepung,dapur,nasi" (rough). Localized per region. App Store SEO is real — wrong keywords = 0 organic discovery.

### 9.4 Launch screen ≠ splash screen

Apple HIG: launch screens render *immediately* from a storyboard or asset, before the app's code runs. They should look like the app's *first frame*, not a brand splash. Expo supports this via `expo-splash-screen` config. Specifically:

- **Don't** show Tokoflow logo for 2 seconds
- **Do** show the empty Now pin skeleton + nav, fade to filled state on hydration

If Tokoflow does the first, App Reviewers will note it (per recent rejection patterns).

---

## 10. The Apple-grade vs RN-feel gut-check — 5 surfaces

| Surface | RN-feel risk | Cost to Apple-grade |
|---|---|---|
| **Voice mic button on Now pin** | Default `Pressable` opacity ramp is 0.2 fade — Apple uses a *spring scale 0.95 + opacity 0.7*. 80% of RN apps get this wrong. | 0.5d — write a `<HapticPressable>` component using `react-native-reanimated` spring + `expo-haptics` selectionAsync on press-in. Use everywhere. |
| **3-sensory signature on auto-claim** | If JS-thread-triggered, 30-80ms drift on Redmi Note 12, ~15-30ms on iPhone 12. Below Apple's 16ms target. | 5d — `expo-sensory-signature` Module already scoped. Add: AHAP files spec, audio-in-haptic-pattern binding for <16ms iOS drift. |
| **Lock Screen widget refresh** | Default 20-35min staleness → user sees old data. | 1d — silent push (`content-available: 1`) → `WidgetCenter.shared.reloadTimelines(ofKind:)`. |
| **Share Extension activation + extraction** | RN cold-init in extension = 400-800ms flash of unstyled content. | 2d — replace RN-rendered extension UI with SwiftUI view (via `@bacons/apple-targets` extension target). Extension never runs RN; it writes file URL to App Group + opens deeplink in <50ms. |
| **Settings page layout** | RN `<View>` + `<Text>` doesn't render iOS Form/Section grouping correctly (rounded inset cells, subtle dividers, Dynamic Type). Looks "RN-feel." | 3d — write `<Form>` + `<Section>` + `<Cell>` components matching iOS's `UICollectionViewListLayout.appearance(.insetGrouped)`. Or use `react-native-ios-list-view` (community lib). |

**Total fidelity uplift cost:** ~12d on top of cycle 32's plan. **All achievable in Wave 1 8wk budget.**

---

## Sev-ranked issues

### Sev-9 (must-fix Wave 1 launch)

1. **`react-native-haptic-feedback` does NOT expose AHAP / `CHHapticEngine`** — cycle 32's library pick is partially wrong. The 1.5s envelope cannot be fired via this lib alone. Custom `expo-sensory-signature` Module must load AHAP files via `CHHapticEngine.makePlayer(with:)`. *(§2.1)*
2. **Sensory signature drift target should be <16ms on iOS, not <50ms.** 50ms = 3 frames at 60Hz, perceptible. Bind audio into the AHAP pattern via `CHHapticPattern` + `audioCustom` events for sample-accurate sync. WWDC 2019 sessions 223 + 520. *(§2.3)*
3. **No SwiftUI-fallback policy for iOS-specific surfaces.** Liquid Glass, vibrancy materials, Dynamic Type don't exist in RN. Specific iOS-only views (Now pin background, Share Extension UI, Lock Screen widget) must use SwiftUI exposed as Fabric components or Apple-target views. *(§1.1, §1.4, §5.1)*

### Sev-8

4. **Reduce Motion gate missing on 1.5s sensory arc.** Cycle 28 §1.5 must add a 5th `reduced` role (chime + light haptic + 200ms cross-fade). HIG-mandated. *(§1.3)*
5. **Dynamic Type accessibility almost certainly broken** — RN's `<Text>` with hardcoded `fontSize` ignores user font size. Add a `useTextStyle()` hook + typography-lint rule. *(§1.2)*
6. **Privacy Manifest audit missing from Phase 0 spikes.** `ffmpeg-kit-react-native` and other native deps need `PrivacyInfo.xcprivacy` declared. Add as Spike M6. *(§6.4)*
7. **Share Extension UI runs RN by default = 400-800ms cold-init flash.** Replace with SwiftUI view via `@bacons/apple-targets` extension target. Extension never runs RN. *(§5.1)*

### Sev-7

8. **Lock Screen widget refresh budget = 20-35 min staleness without push.** Add silent push → `WidgetCenter.shared.reloadTimelines` for Wave 1. *(§4.2)*
9. **WidgetKit family + tap-to-open routing under-spec'd.** Pick `.accessoryRectangular`. Tap → `tokoflow://today` or `/claims`. *(§4.1, §4.3)*
10. **iCloud backup of SQLite includes voice transcripts.** Set `isExcludedFromBackupKey = true` OR encrypt with SQLCipher. *(§7.2)*
11. **Live Activity APNs frequency cap (~16/hour) will throttle in lunch rush.** Server-side coalesce within 5-min window for Wave 2. *(§3.4)*
12. **Permission-priming screens before system prompts** — HIG-mandated, currently not specced. *(§9.1)*

---

## Concrete fix directions (named APIs + WWDC sessions)

| Fix | Apple API / Session |
|---|---|
| AHAP pattern dictionaries for sensory signature | `CHHapticEngine`, `CHHapticPatternPlayer`, `CHHapticPattern(dictionary:)`. WWDC 2019 §223 + §520. |
| Audio + haptic sample-sync | `CHHapticEvent.EventType.audioCustom` inside same `CHHapticPattern`. |
| Liquid Glass / vibrancy on Now pin | SwiftUI `.glass` modifier (iOS 26+) / UIKit `UIGlassEffect`; fallback `UIVisualEffectView` with `.systemThinMaterial`. WWDC 2025: "Get to know the new design system." |
| Dynamic Type | `UIFont.preferredFont(forTextStyle: .body)` + `UIFontMetrics` for custom fonts. WWDC 2024: "Get started with Dynamic Type." |
| Reduce Motion | `UIAccessibility.isReduceMotionEnabled` + `NotificationCenter.default.observer(forName: UIAccessibility.reduceMotionStatusDidChangeNotification)`. |
| Lock Screen widget silent refresh | `WidgetCenter.shared.reloadTimelines(ofKind:)` triggered from `application(_:didReceiveRemoteNotification:fetchCompletionHandler:)` with `content-available: 1`. WWDC 2022: "Complications and widgets: Reloaded." |
| WidgetKit families | `.accessoryRectangular` (lock-screen), `.systemSmall` (StandBy fallback). WWDC 2023: "Build widgets for the Smart Stack." |
| Live Activity | `ActivityKit` + `ActivityAttributes` + APNs token-auth (JWT) + topic `<bundle>.push-type.liveactivity`. WWDC 2022: "Live Activities" + WWDC 2023: "Update Live Activities with push notifications." |
| Dynamic Island AppIntent | `AppIntent` + `LiveActivityIntent` + Darwin notifications via `CFNotificationCenter`. WWDC 2023: "Bring widgets to new places." |
| App Privacy Manifest | `PrivacyInfo.xcprivacy` per dep + aggregated by EAS Build. Apple: "Required reasons API." |
| Share Extension SwiftUI | `@bacons/apple-targets` → custom SwiftUI target + App Group + Darwin notification → main app pickup. |
| Universal Links | `apple-app-site-association` JSON + `applinks:tokoflow.com` entitlement. WWDC 2019: "What's new in Universal Links." |
| Focus filter | `INFocusFilterIntent` + `UNNotificationContent.interruptionLevel = .passive / .timeSensitive`. WWDC 2022: "Meet Focus filters." |
| Siri Shortcuts (Wave 3) | `AppIntent` + `IntentDonationManager.shared.donate()`. WWDC 2024: "What's new in App Intents." |

---

## Scores (0-10)

| Dimension | Cycle 32 self-score | iOS-dev red-team score | Delta |
|---|---|---|---|
| **(a) iOS HIG fidelity** | 8 (implied) | **5** | -3 — no SwiftUI fallback, Dynamic Type/Reduce Motion gaps, Liquid Glass absent |
| **(b) Core Haptics fidelity** | 8 | **5** | -3 — wrong library API picked, 50ms drift target too loose, AHAP files unspec'd |
| **(c) Live Activities readiness** | 9 (Wave 2) | **6** | -3 — labs library risk, APNs topic + frequency cap unspec'd, Dynamic Island routing missing |
| **(d) Lock Screen widget completeness** | 9 (Wave 1) | **4** | -5 — family + refresh + tap-routing all unspec'd; staleness unaddressed |
| **(e) App Store review prep** | 7 (Phase 0 ready) | **5** | -2 — Privacy Manifest audit missing, usage strings under-detailed, screenshots not designed |
| **(f) Apple-grade gut-check** | 8.5 | **6** | -2.5 — RN-feel risks present in 5 surfaces; ~12d total uplift cost identified |
| **Average** | **8.25** | **5.2** | **-3.05** |

Cycle 32's self-score of 8.9 reflects *architecture fit* (it does map cycle 28 contracts to RN). My 5.2 reflects *Apple-grade fidelity* on the resulting iOS app. **Both can be true.** Cycle 32 picked the right stack and named the right libraries; the gap is in the *next layer of spec* — concrete iOS-fidelity rules that aren't in the cycle 28 boundary contract because cycle 28 was platform-neutral.

---

## The ONE thing Stack A risks losing vs going dual native iOS

**The 1.5s sensory arc on auto-claim — Apple-grade vs RN-feel.**

Going dual native iOS, you write one Swift function:

```swift
func fireFullArc(orderID: UUID) async {
    let pattern = try CHHapticPattern(contentsOf: ahapURL("full-arc"))
    let player = try engine.makePlayer(with: pattern)  // includes audioCustom event
    UIView.animate(withDuration: 1.5, delay: 0, options: [.curveEaseOut]) {
        chipView.transform = .identity
        chipView.alpha = 1.0
    }
    try player.start(atTime: CHHapticTimeImmediate)  // <16ms drift, audio + haptic sample-locked
}
```

That's **one function, one timeline, sample-accurate sync, zero JS-thread, zero bridge**. iPhone 17 Pro at 120Hz: <8ms drift. iPhone 12 at 60Hz: <16ms drift. Apple's own first-party fidelity.

Going Stack A, you write a custom `expo-sensory-signature` Module — same Swift code under the hood — but the *trigger* originates in JS:

```ts
await SensorySignature.fire('full', { orderID })
```

The JS-side trigger goes through JSI sync call → Swift function → CHHapticEngine. JSI sync is fast (~1ms) but the *visual keyframe* runs on the RN UI thread (Reanimated + Yoga), which is **a different thread from the iOS render server**. A frame-perfect sync between RN's animation pulse and Swift's CHHapticEngine.start() is *theoretically* achievable on iPhone 12+ with New Arch's bridgeless architecture, but the field reports — Shopify, Discord, Coinbase — all describe "20% load-time regression on complex components" before tuning. *Tuning to <16ms drift is a research project, not a Wave 1 deliverable.*

**Realistic Stack A iOS drift: 16-30ms on iPhone 12+, 30-80ms on Redmi Note 12.** Apple's own apps: <16ms. The merchant who uses Tokoflow alongside Apple Wallet (which fires Face ID + haptic + visual within 8ms) will *feel* the difference, even if she can't articulate why. It's the "alive vs fine" gap.

**Mitigation paths if we want to close this gap on iOS without going dual native:**

1. **Move the visual trigger into the same Swift function.** `expo-sensory-signature` Module's `fireSignature()` returns synchronously after starting the visual via UIView.animate. Bypass Reanimated for this one animation. Cost: 1d.
2. **Bind audio into the AHAP pattern** so haptic + audio are guaranteed sample-locked. Cost: AHAP file spec work, 0.5d.
3. **Accept that the visual is NOT in the AHAP pattern** (visual is RN-thread) and target <30ms drift — half Apple's bar but acceptable for Wave 1 alpha. Cost: 0d, document trade-off.

Stack A wins on cycle 31's 8 dimensions. It loses on dimension 9 — *the un-named one* — Apple-grade signature fidelity. **That's the one thing.**

If Tokoflow's Wave 1 alpha cohort includes one iPhone 17 Pro user who also uses Apple Wallet, Lyft Live Activities, AirPods battery widgets — they will sense Tokoflow's signature is *almost* there but not quite. They won't unsubscribe over it. They might not even mention it in feedback. But it costs us the chance at "alpha tells another merchant unprompted" (one of the 5 Phase 1 Gate criteria from CLAUDE.md) — because the apps you tell friends about are the ones that feel *alive*, not *fine*.

---

## Recommendation to cycle 34 (synthesize)

Stack A stays. The 12 sev-9/8/7 issues above must land in the cycle 32 spec as *amendments* before Phase 1 sprint week 1. Add:

- **Spike M6:** Privacy Manifest audit (1d).
- **Spike M2 expansion:** AHAP file spec + iOS <16ms drift target + SwiftUI-fallback policy for vibrancy/Liquid Glass surfaces (+3d on top of existing 5d).
- **Cycle 28 §1.5 amendment:** add `reduced` sensory role + `MIN_HAPTIC_GAP = 250ms` rule.
- **Cycle 28 §-iOS amendment:** "Share Extension Memory Rule" + "iCloud backup exclusion rule" + "Dynamic Type rule" + "Reduce Motion gate."
- **Wave 2 spike list:** Live Activity infrastructure (frequency cap, Dynamic Island AppIntent), iPad layout, Universal Links, Focus filter integration.
- **Wave 1 fidelity uplift:** 12d total — write 5 components (`HapticPressable`, `NativeMaterial`, `Form/Section/Cell`, AHAP files, silent-push widget refresh).

If cycle 34 chooses to bank the 12d and ship a "fine" iOS app instead of an "alive" one, that's a defensible product call — but be honest about it in the architecture: name it "Stack A iOS fidelity is one tier below dual-native. Wave 2 Pro tier closes the gap."

---

*Written by: iOS indie dev red-team persona, Cycle 33 RED_TEAM, Tokoflow positioning loop.*
