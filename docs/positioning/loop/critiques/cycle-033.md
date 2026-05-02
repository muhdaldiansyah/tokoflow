# Cycle 033 — Consolidated MOBILE_PLATFORM_RED_TEAM

> 4 personas reviewed cycle 32's Stack A pick (Expo + RN managed). Each persona scored their domain harshly. **Stack A still wins** — but cycle 32 oversimplified or omitted enough that cycle 34 BUILD must absorb 15 sev-9 fixes before Phase 1 sprint week 1.

## Aggregate verdict

| Persona | Domain | Score (cycle 32 self-scored 8.9) | Sev-9 |
|---|---|---|---|
| Senior Mobile Architect | Long-term sustainability | 5.0 | 8 |
| iOS Indie Dev | Apple-grade fidelity | 5.2 | 7 |
| Android Platform Engineer | Reliability + Play Store | 4.5 | 5 |
| Performance / Reliability | p95 user experience | 5.7 | 3 |
| **Average** | — | **5.1** | **23 (deduped: ~15 unique)** |

The pattern matches cycle 26: section-level scores 8-10, integration-level scores 5. The remedy is the same: a 4th-document-style amendment cycle (cycle 34) that locks the seams.

## 15 sev-9 boundary issues — must fix before Phase 1 sprint week 1

### Cross-platform / architecture

1. **Whisper-tiny on Snapdragon 685 budget Android is broken** (Architect, Android, Perf — all 3 personas)
   - Cycle 32 budgets <25s for 30s audio; cycle 31 own research said "60-120s on budget devices"
   - Qualcomm AI Hub NPU rescue is false (SD4-class chips have no app-accessible NPU)
   - Thermal throttling worsens it during burst rush (15s→25s/clip)
   - **Fix:** Cloud STT (OpenRouter Gemini speech) becomes the **default path** for detect-slow devices, NOT a fallback. Whisper-tiny only on iPhone 12+ / Pixel 7+ / Samsung S22+ / flagship-tier devices. Merchant disclosure on first launch: "On older Android, your voice goes to our AI to transcribe; on newer phones, it's processed on-device."

2. **Play Store policy timeline is 4-5x underestimated** (Architect, Android)
   - Cycle 32 M5 budget: 2-3 weeks "in background"
   - Reality: 4-8 weeks wall-clock. CRED, Money Lover, Rocket Money all pivoted away from NotificationListener. Reviewer cycle is sequential, can't parallelize with Phase 1 build.
   - **Fix:** Wave 1 Android Day 1 ships **without NotificationListener auto-claim** — Paths 1-5 only (voice / text / image / WA screenshot share / forwarded WA voice). Path 6 (auto-claim) lands in Wave 1.1 (4-8 weeks post-launch) after Play Store clearance. OR: OEM-allowlist Wave 1 to Pixel + Samsung only (cuts ~50% Year 1 ID TAM but ships Day 1 with auto-claim). **Decision needed cycle 34.**

3. **NotificationListener binder thread + JSI race** (Android)
   - Cycle 32's "JSI EventEmitter" hand-wave invites cross-thread heap corruption
   - **Fix:** `onNotificationPosted(StatusBarNotification)` callback marshals via `RCTDeviceEventEmitter` on the UI thread with a bounded ring buffer (max 100 events, drop-oldest). Document explicitly in M1 spike spec.

4. **Foreground Service Type misspecified** (Android)
   - Cycle 32 + Notifee default to `dataSync`. Android 14+ requires explicit type for NotificationListener keepalive. Correct: `specialUse` + `<property name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE" value="payment_notification_observer" />` + separate Play Console declaration form.
   - **Fix:** Document in M1 spike scaffolding. Update AndroidManifest.xml template.

5. **Heartbeat 7d is 6 days too long for F-tier OEMs** (Android)
   - MIUI/ColorOS/FuntouchOS battery savers kill listener within 24-72h of app inactivity
   - **Fix:** Tiered heartbeat per OEM: **24h** for Xiaomi/Oppo/Vivo/Realme, **72h** for Samsung, **7d** for Pixel. Detect OEM via `Build.MANUFACTURER` at first launch. Update cycle 28 §12.

6. **Cold start budget optimistic** (Perf)
   - Cycle 32: <2s on Redmi Note 12. Reality: warm-cache p50 ~2s, but cold-cold p50 ~2.5s, p95 ~4.5s on Snapdragon 685.
   - First-of-day sensory ceremony (cycle 28 §1.5) fires before feed paints if not gated.
   - **Fix:** Gate first-of-day signature on first feed render complete. Add cold-start telemetry (`react-native-performance` or Sentry App Start). Spec the gating in cycle 35 MOBILE.md.

7. **Burst-drain 30-40s wall clock contradicts anti-anxiety "no spinners"** (Perf)
   - 8 offline voice notes drain in 30-40s real-world (Whisper queue + LLM HTTP + persist + signature).
   - Cycle 28 §5.9 promises "no spinners — soft tint indicator only".
   - **Fix:** During offline drain, surface a single "menyusul..." chip on the Now pin with progress dot (not spinner). Cycle 28 §1.5 batch-summary fires only at drain-complete. Document explicitly.

8. **Sentry Session Replay default violates Refuse-list #6** (Perf)
   - Default config captures customer names + amounts on Now pin. Privacy violation; ships customer data to Sentry.
   - **Fix:** Disable Session Replay for Wave 1. Configure Sentry's `beforeSend` hook to scrub PII from breadcrumbs. Mask all `<Text>` in feed components via `replayPrivacy` config.

### iOS-specific (sev-9 from iOS Indie Dev)

9. **`react-native-haptic-feedback` doesn't expose CHHapticEngine/AHAP** (iOS)
   - The library dispatches to `UIFeedbackGenerator` (iOS 10 API). The 1.5s sensory arc envelope (cycle 28 §1.5) **cannot be fired through this lib**.
   - **Fix:** Custom `expo-sensory-signature` Expo Module loads AHAP files via `CHHapticPattern(dictionary:)` + `engine.makePlayer(with:)` directly. Drop `react-native-haptic-feedback` from cycle 32 library list.

10. **<50ms drift target is 3x too loose for iOS** (iOS)
    - Apple's own apps (Wallet, Camera, Find My) sync visual+audio+haptic at <16ms (1 frame at 60Hz).
    - 50ms = 3 frames, perceptible on premium iPhone hardware.
    - **Fix:** iOS-specific drift target <16ms via binding audio into the AHAP pattern as `audioCustom` events (WWDC 2019 §223 + §520). Android tier accepts 30-50ms drift. Document tiered targets.

11. **Privacy Manifest missing from Phase 0** (iOS)
    - `PrivacyInfo.xcprivacy` required iOS 17.4+ for every dependency. `ffmpeg-kit-react-native` is the riskiest (records system APIs).
    - **Fix:** Add **Spike M6** — Privacy Manifest audit across all 28+ libraries. Generate aggregate manifest. Required for App Store submission post-May 2024.

12. **Lock Screen widget refresh 20-35min stale without push** (iOS)
    - WidgetKit timeline budget = ~4 hours per widget update. For "today's count" widget, stale data on Lock Screen is poor UX.
    - **Fix:** Silent push (`content-available: 1`) on every diary_entry insert → triggers `WidgetCenter.shared.reloadTimelines(ofKind: "TodayCountWidget")`. Document in cycle 35.

13. **Share Extension UI runs RN by default = 400-800ms cold-init flash** (iOS)
    - When user shares, the extension bootstraps RN before showing UI. Visible flash, broken expectation of native fluidity.
    - **Fix:** Replace `expo-share-extension` Custom UI with **SwiftUI extension target** (via `@bacons/apple-targets` + native Swift code). Extension never runs RN. Just writes file URL to App Group + opens deeplink to main app.

### Architect / governance (sev-9)

14. **Stack wider than 1-2 person team** (Architect)
    - 28 libraries + 2 custom Expo Modules + monorepo + Drizzle + PowerSync + custom CI is too wide for Phase 0 team capacity.
    - **Fix:** **Cut list to 18 libs + 1 custom module** for Wave 1. Defer:
      - PowerSync → manual IDB queue (cycle 28 §1.4 already specced)
      - `expo-live-activity` → Wave 2 Pro tier
      - Custom `expo-sensory-signature` → Wave 1 ships with `expo-haptics` + Reanimated visual + `expo-av` audio in JS-orchestrated flow (drift 50-80ms acceptable for V1)
      - `expo-audio-stream` → not needed, save-then-process is fine
      - Maestro → defer E2E to post-launch
      - Storybook → defer
      - WatermelonDB / op-sqlite alternatives → only `expo-sqlite/next` + Drizzle
    - **Custom modules cut to 1: `expo-notification-observer` (Android only)**. Sensory signature defers to JS orchestration in V1.

15. **Wave 2 ID fork strategy missing** (Architect)
    - Bundle IDs, separate Supabase project, dual-app monorepo, app icons, store listings — all undeclared.
    - **Fix in cycle 34:** Specify Wave 2 fork:
      - Bundle IDs: `com.tokoflow.app` (MY) and `com.catatorder.app` (ID)
      - Supabase: same project initially (RLS-isolated by `country_code` column on profiles), fork to separate project at Wave 2 Q1 2027 if data sovereignty regulation requires
      - Monorepo: `apps/mobile` parametrized by `EXPO_PUBLIC_BRAND` env var (`tokoflow` | `catatorder`); produces 2 binaries with shared codebase
      - Diverging assets: `apps/mobile/brand/{tokoflow,catatorder}/` for icons, splash, copy

## 12 sev-8 issues (must address during Phase 1)

| # | Source | Issue | Fix direction |
|---|---|---|---|
| 16 | Architect | `expo-router` lock-in (deeplink format, file-based routing assumption) | Document migration cost; abstract route paths into shared constants |
| 17 | Architect | EAS Update OTA portability — proprietary format | Note exit cost; if leave Expo, must migrate to `react-native-code-push` (deprecated) or self-host CDN |
| 18 | Architect | Monorepo premature for Phase 0 1-2 person team | **Use single-repo with shared `lib/`** in `apps/web` first; promote to monorepo at 3+ engineers |
| 19 | Architect | `lib/billplz` + `lib/myinvois` shouldn't be packages | Keep server-only in `apps/web/lib/`; mobile fetches via API |
| 20 | Architect | Auth session management doesn't port cleanly between cookies (web) and AsyncStorage (mobile) | Spec dual-strategy auth in cycle 35; supabase-js in mobile uses AsyncStorage automatically |
| 21 | Architect | i18n missing as first-class concern | Adopt `i18next` + `react-i18next` from Day 1; Bandung + Jakarta + Manglish locale files |
| 22 | Architect | Deeplink architecture undefined (Universal Links iOS + App Links Android) | Spec `apple-app-site-association` + `assetlinks.json`; `tokoflow.com/r/{id}` opens app |
| 23 | iOS | Cycle 28 §1.5 needs `reduced` sensory role for Reduce Motion accessibility | Add 5th role: visual-color-only flash + light haptic, no animation |
| 24 | iOS | `MIN_HAPTIC_GAP = 250ms` rule needed | Prevents burst-merging into one buzz on iOS Taptic Engine; coalesce events within 250ms |
| 25 | iOS | iCloud backup of SQLite must be excluded | Encrypted Whisper transcripts shouldn't sync to iCloud — privacy concern; set `NSURLIsExcludedFromBackupKey` |
| 26 | Android | Doze mode + App Standby Buckets unaddressed | Use `setExactAndAllowWhileIdle()` for heartbeat; document Bucket transition behavior |
| 27 | Perf | LLM extract p95 5-7s on Bandung 4G (not 3s budget) | Extend optimistic chip duration; add cancel-and-retry UX |
| 28 | Perf | Reanimated mandate not architecturally enforced | Add ESLint rule: animations must use `react-native-reanimated`, not `Animated` API |
| 29 | Perf | WAL checkpoint storms stutter audio chime | Configure SQLite `PRAGMA wal_autocheckpoint=100`; throttle pre-signature DB ops |
| 30 | Perf | Whisper thermal throttling 15→25s during burst rush | Detect throttle via `BatteryManager` + thermal API; switch to cloud STT mid-rush if device hot |
| 31 | iOS | App Store reviewer-facing demo recording missing from Phase 0 | Schedule 1-day Phase 0 task: record 90-sec onboarding video showing mic + share permissions |

## 5 sev-7 issues (defer-to-Phase-1-end)

| # | Source | Issue | Fix |
|---|---|---|---|
| 32 | Perf | iOS Share Extension 120MB ceiling needs ESLint enforcement | Lint rule: no audio decode in share extension code path |
| 33 | Architect | Maestro vs Detox — premature decision | Defer; Wave 1 ships with manual QA matrix, add E2E Wave 1.1 |
| 34 | Architect | Drizzle vs Prisma — premature decision | Drizzle picked; revisit if perf cliff hit |
| 35 | iOS | StandBy mode (iOS 17+) widget rendering | Defer to Wave 2 |
| 36 | Android | Material You theming + adaptive icons | Defer to Wave 2 |

## What survives unchanged

- **Stack A still wins.** All 4 personas confirmed RN + Expo is the right pick; the critique is about execution, not the stack.
- **TS code reuse strategy** (40-50%): valid but with monorepo deferred (Architect fix #18)
- **EAS Build + EAS Update**: correct (10/10 OTA iteration), no persona disputed
- **Drizzle ORM + expo-sqlite/next**: confirmed (Architect approved over op-sqlite for dep-risk reasons)
- **`expo-router`**: locked, with caveat
- **FlashList v2 mandate**: confirmed by all 4 personas
- **Phase 0 spike approach**: framework correct, scope undersized (cycle 34 must re-budget)

## Implications for cycle 34 MOBILE_BUILD

Cycle 34 must produce a **build/deployment + execution spec** that absorbs all 15 sev-9 fixes, 12 sev-8 amendments, and re-budgets Phase 0 spikes. Specifically:

1. **Defer NotificationListener Path 6 to Wave 1.1** OR **OEM-allowlist Wave 1 to Pixel+Samsung** — pick one
2. **Cloud STT as default for budget Android** with merchant disclosure flow
3. **Re-budget M1 spike** 5-7d → 8-12d (binder thread + specialUse + tiered heartbeat)
4. **Re-budget M3 spike** 3d → 5d (cloud STT detect-slow flow)
5. **Add Spike M6** Privacy Manifest audit (iOS, ~3d)
6. **Add Spike P6** burst-rush-end-to-end-bench (Perf, ~3d)
7. **Critical path Phase 0 = 4 weeks**, not 3
8. **Cut library list 28 → 18** for Wave 1
9. **Single-repo (not monorepo)** for Phase 0
10. **Drop custom `expo-sensory-signature` for V1** — use JS orchestration with `expo-haptics` + Reanimated
11. **Drop `react-native-haptic-feedback`** — does not deliver CHHapticEngine
12. **Tiered drift target**: <16ms iOS premium, <50ms Android premium, <80ms budget
13. **Mandate alpha cohort device distribution**: 5 merchants must include 1 Redmi Note 12 + 1 Oppo/Vivo + 1 Samsung mid-range + 1 iPhone + 1 Pixel
14. **Spec Wave 2 fork strategy**: bundle IDs, brand env var, divergent assets
15. **Sentry config**: disable Session Replay Wave 1; PII scrub `beforeSend`
16. **Build pipeline + monorepo deferral** + CI/CD specification

## Score after cycle 34 (projected)

If cycle 34 absorbs all 15 sev-9 + 12 sev-8 fixes:

| Persona | Cycle 33 | Cycle 34 (projected) |
|---|---|---|
| Architect | 5.0 | 8.5 |
| iOS | 5.2 | 8.5 |
| Android | 4.5 | 8.0 (Path 6 deferral; cloud STT default) |
| Perf | 5.7 | 8.5 |
| **Average** | **5.1** | **8.4** |

Cycle 35 ARCH_FINAL must validate via second-pass red-team OR proceed direct to MOBILE.md if cycle 34 cleanly addresses all sev-9.
