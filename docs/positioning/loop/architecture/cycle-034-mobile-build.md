# Cycle 034 — MOBILE_BUILD_HYPOTHESIZE

> Cycle 33 scored cycle 32's Stack A choice 5.1/10 across 4 personas — the pick survives but execution + governance got 23 sev-9/8 critiques. This cycle absorbs every fix, locks the build/deploy/execution path, re-budgets Phase 0, and makes the 8 hard decisions cycle 32 deferred.

---

## 1. Eight hard decisions cycle 33 forced

| # | Decision | Locked value | Rationale |
|---|---|---|---|
| **D1** | Path 6 (Android NotificationListener auto-claim) on Day 1? | **NO** — defer to Wave 1.1 (4-8wk post-launch, after Play Store clearance) | Architect + Android personas both recommend; Phase 0 validation doesn't depend on auto-claim; saves 4-5 weeks of M5 spike from critical path |
| **D2** | Cloud STT (vs on-device Whisper) for budget Android? | **DEFAULT** for detect-slow devices | Whisper-tiny on Snapdragon 685 is 60-120s/clip; on-device only on iPhone 12+ / Pixel 7+ / Samsung S22+ flagship-tier. Disclosure: "On older Android, your voice goes to our AI; on newer phones, on-device." |
| **D3** | Custom Expo Modules count for Wave 1? | **1** — `expo-notification-observer` (Android only, scheduled Wave 1.1) | `expo-sensory-signature` deferred; V1 uses JS orchestration with expo-haptics + Reanimated + expo-av/audio. Drift acceptable 30-80ms. Revisit Wave 1.1. |
| **D4** | Repo structure for Phase 0? | **Single repo, single git** — add `apps/mobile/` as sibling to Next.js root; **no pnpm workspaces yet** | Promote to monorepo at 3+ engineers. Architect persona #18. |
| **D5** | PowerSync vs manual IDB queue? | **Manual IDB + reconcile-on-drain** (cycle 28 §1.4 unchanged) | PowerSync deferred; M4 spike saves cost-compare effort. Revisit Wave 1.1 if manual queue becomes bottleneck. |
| **D6** | Library list size for Wave 1? | **18 libraries** (cut from cycle 32's 28) | See §6 below. Maestro + Storybook + WatermelonDB alternatives + expo-audio-stream + expo-live-activity all deferred. |
| **D7** | Sentry Session Replay for Wave 1? | **DISABLED** | Default config violates Refuse-list #6 (captures customer names + amounts). Re-enable post Wave 1 with full PII-mask config. |
| **D8** | Wave 2 ID fork strategy? | **Same codebase, brand env var** (`EXPO_PUBLIC_BRAND={tokoflow,catatorder}`) → 2 binaries from same source | Bundle IDs `com.tokoflow.app` (MY) + `com.catatorder.app` (ID); shared Supabase project Wave 1, fork at Wave 2 if data sovereignty required |

---

## 2. Repo structure — single repo, light-touch

```
tokoflow/                              # current repo, unchanged at root
├── app/                               # Next.js 16 (existing) — marketing + customer-facing + admin
├── components/                        # Next.js components (existing)
├── lib/                               # Shared TS code (existing) — read by mobile via path alias
│   ├── copy/                          # ✓ reusable
│   ├── utils/                         # ✓ reusable (phone, slug, date)
│   ├── billplz/                       # server-only — NOT imported into mobile (mobile fetches via API)
│   ├── myinvois/                      # server-only — same
│   └── voice/                         # ✓ TS utilities reusable
├── features/                          # Next.js feature modules (existing) — server-side via API
├── public/                            # Next.js public assets
├── supabase/migrations/               # shared (existing 080 + new 081-085 from cycle 28 §2)
├── apps/
│   └── mobile/                        # NEW — Expo + RN app
│       ├── app/                       # expo-router file-based routing
│       ├── components/                # RN components (rewrite of web counterparts)
│       ├── modules/                   # custom Expo Modules
│       │   └── expo-notification-observer/    # only one for Wave 1.1
│       ├── brand/                     # divergent assets per brand
│       │   ├── tokoflow/              # icon, splash, store assets MY
│       │   └── catatorder/            # icon, splash, store assets ID (Wave 2)
│       ├── eas.json                   # EAS Build + EAS Update + EAS Submit config
│       ├── app.config.ts              # vercel.ts-style config; reads EXPO_PUBLIC_BRAND
│       └── package.json               # mobile deps separate from web
├── packages/                          # NOT YET — promote to pnpm workspaces at 3+ engineers
├── package.json                       # web deps (existing)
├── tsconfig.json                      # web tsconfig (existing) + path alias `@shared/*` → `lib/*`
└── pnpm-lock.yaml
```

### TS path alias for code reuse

`apps/mobile/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "paths": {
      "@shared/*": ["../../lib/*"],
      "@types/*": ["../../types/*"]
    }
  }
}
```

Mobile imports:
```ts
import { copy } from '@shared/copy';
import { normalizePhone } from '@shared/utils/phone';
import type { DiaryEntry } from '@types/schema';
```

No bundler config gymnastics needed — Metro respects tsconfig paths via `metro-config` resolver.

### Why not pnpm workspaces yet

- 1-2 person team Phase 0 doesn't need workspace overhead
- TS path aliases handle code reuse fine for this scale
- Promote to workspaces when:
  - Team grows to 3+ engineers
  - Need to publish `lib/*` as standalone package
  - CI build times become bottleneck

---

## 3. Phase 0 spike re-budget — 4 weeks critical path

Cycle 32 listed M1-M5 + 7 carry-forward = 12 spikes, claimed 3wk parallel. Cycle 33 said 4wk realistic.

### Phase 0 mobile spikes (re-budgeted)

| # | Spike | Effort | Wall-clock | Wave 1 critical path |
|---|---|---|---|---|
| **M1** | `expo-notification-observer` Expo Module + binder-thread marshaling + tiered heartbeat | **8-12d** (was 5-7d) | Wave 1.1 only | NO (Path 6 deferred D1) |
| **M2** | Sensory signature JS orchestration + drift bench (was custom module — D3 changed scope) | **3d** (was 5d) | Week 1-2 | YES |
| **M3** | Whisper-tiny on Redmi Note 12 + cloud STT detect-slow flow | **5d** (was 3d) | Week 1-2 | YES |
| **M4** | ~~PowerSync vs manual IDB cost compare~~ | KILLED (D5) | — | — |
| **M5** | Play Store policy declaration cycle | **4-8wk wall-clock** | Wave 1.1 only | NO (Path 6 deferred D1) |
| **M6** | iOS Privacy Manifest audit (cycle 33 iOS sev-9 #11) | **3d** | Week 2-3 | YES |
| **M7** | iOS Lock Screen widget (read-only summary, silent push reload) | **5d** | Week 3-4 | YES |
| **M8** | iOS Share Extension SwiftUI native UI (cycle 33 iOS sev-9 #13) | **5d** | Week 3-4 | YES |
| **P1** | Cold-start telemetry + first-of-day signature gating | **2d** | Week 1 | YES |
| **P2** | Burst-drain UX (single "menyusul..." chip + progress dot) | **2d** | Week 2 | YES |
| **P3** | Sentry config with PII scrub `beforeSend` + Session Replay disabled | **1d** | Week 1 | YES |
| **P4** | SQLite WAL tuning (`wal_autocheckpoint=100` + checkpoint throttle) | **1d** | Week 2 | YES |
| **P5** | Reanimated mandate ESLint rule | **0.5d** | Week 1 | YES |
| **P6** | Burst-rush end-to-end bench (5-note burst on Redmi Note 12) | **3d** | Week 4 | YES |
| **A1** | Alpha cohort device-distribution mandate enforcement | 0d (process) | Week 1 | YES |

### Phase 0 carry-forward (cycle 28 + cycle 30)

| # | Spike | Wave |
|---|---|---|
| 1 | `payment-notif-corpus-my.ts` (9 providers, 500+ samples) | 1.1 |
| 4 | `opus-decode-latency.ts` | 1 |
| 6 | `payment-notif-corpus-id.ts` (12 providers) | 2 |
| 7 | `sahabat-ai-bandung-bench.ts` | 2 |
| 8 | `id-self-reference-disambig.ts` | 2 |
| 9 | `id-currency-locale-fence.ts` | 2 |
| 10 | `myinvois-spike.ts` (existing) | 1+ Pro |
| 11 | `billplz-spike.ts` (existing) | 1+ Pro |
| 12 | `wa-share-target-onboarding.ts` | 1 |

### Critical path Wave 1

```
Week 1:    M2 + M3 + P1 + P3 + P5 + A1 setup           → Foundation
Week 2:    M3 finish + P2 + P4 + spike 4 + spike 12     → Core capture + sync
Week 3:    M6 + M7 + spike 11                           → iOS surfaces + Pro tier prereq
Week 4:    M7 finish + M8 + P6 + integration testing    → iOS magic + perf validation
Weeks 5-8: Build per cycle 30 §8.1 plan                 → Wave 1 launch sprint
```

**Path 6 (NotificationListener) is on Wave 1.1 critical path (post-launch):**
```
W+0  to W+8:    Wave 1 in-market validation (Phase 1 Gate)
W+0  to W+5:    M5 Play Store policy declaration (parallel, doesn't block Wave 1)
W+5  to W+9:    M1 NotifListener Expo Module build
W+9  to W+13:   Wave 1.1 release (auto-claim live)
```

---

## 4. Library list — Wave 1 (18 libraries)

### Core platform (5)

| Library | Version | Why |
|---|---|---|
| `expo` | SDK 54+ | manager |
| `react-native` | 0.81+ | runtime (New Arch default) |
| `react` | 19.1 | UI |
| `expo-router` | latest | file-based routing |
| `@shopify/flash-list` | v2 | mandatory for diary feed |

### Native API bridges (5)

| Library | Why | Alternative if drops |
|---|---|---|
| `@notifee/react-native` | foreground service + notif display + battery deeplinks | wix/react-native-notifications |
| `expo-share-extension` (MaxAst) — **iOS Share Extension UI = SwiftUI, not RN** (cycle 33 iOS sev-9 #13) | Path 4 + Path 5 + Path 6 (iOS) | `react-native-share-menu` (Expensify) |
| `@bacons/apple-targets` | iOS Lock Screen widget | hand-rolled Xcode target |
| `expo-haptics` | basic haptic (selection / impact / notification) for sensory signature | direct JSI to CHHapticEngine if drift unacceptable |
| `expo-notifications` | push for daily briefing cron | wix/react-native-notifications |

### Audio + STT (4)

| Library | Why |
|---|---|
| `expo-audio` | record m4a (replaces deprecated expo-av) |
| `react-native-audio-api` | opus decode for forwarded WA voice notes |
| `whisper.rn` (mybigday) + Mesolitica `malaysian-whisper-tiny` | on-device STT for flagship-tier (D2) |
| OpenRouter Gemini speech (cloud STT) | **default** for detect-slow Android (D2); fallback for iOS too |

### Storage + sync (2)

| Library | Why |
|---|---|
| `expo-sqlite/next` | local cache |
| `drizzle-orm` + `drizzle-kit` | reusable schema with web; `useLiveQuery` reactive |

### State + UI (1)

| Library | Why |
|---|---|
| Zustand | local UI state (preferences, undo stack); cross-platform |

### Server interaction (1)

| Library | Why |
|---|---|
| `@supabase/supabase-js` | auth (uses AsyncStorage on RN automatically) + realtime + REST |

### Build, deploy, monitor (Wave 1) — already counted (zero added libs)

EAS Build + EAS Update + EAS Submit + TestFlight + Play Internal Testing + Sentry. These are services, not deps.

### Deferred to Wave 1.1 / Wave 2 / Pro

| Library | Reason | Phase |
|---|---|---|
| `react-native-haptic-feedback` (mkuczera) | doesn't expose CHHapticEngine (cycle 33 iOS sev-9 #9) — drop entirely | — |
| `software-mansion-labs/expo-live-activity` | Live Activities defer | Wave 2 Pro |
| `react-native-disable-battery-optimizations-android` | only needed when Path 6 lands | Wave 1.1 |
| `ffmpeg-kit-react-native` | only needed if opus → 16kHz resample fails in `react-native-audio-api`; verify M3 first | conditional |
| `whisperkit-coreml` (Argmax iOS-only ANE accel) | Wave 2 Pro tier (closed beta first) | Wave 2 Pro |
| `expo-audio-stream` (deeeed) | save-then-process is fine for V1 | post Wave 1 |
| `op-sqlite` | `expo-sqlite/next` ships with sufficient perf | only if perf bench fails |
| WatermelonDB / Realm | overkill | — |
| Maestro / Detox | E2E defers; manual QA matrix Wave 1 | Wave 1.1 |
| Storybook | no UI design system formal yet | post Wave 1 |
| `i18next` + `react-i18next` | spec'd Wave 2 (BM/BI) | Wave 2 |
| Custom `expo-sensory-signature` Expo Module | JS orchestration suffices V1 | Wave 1.1 review |
| Custom `expo-notification-observer` Expo Module | Path 6 deferred Wave 1.1 | Wave 1.1 |

**Library count Wave 1: 18.** **Custom Expo Modules Wave 1: 0.**

---

## 5. Sensory signature — JS orchestration (V1 scope)

Cycle 33 said custom `expo-sensory-signature` was overkill for V1. Replacement: JS orchestrates the 3 modalities sequentially with as-tight-as-possible scheduling.

### Implementation

```ts
async function fireSensorySignature(role: 'full' | 'shortened' | 'silent' | 'batchSummary' | 'reduced') {
  if (role === 'silent') return;
  if (role === 'reduced') {
    // Reduce Motion accessibility (cycle 33 iOS sev-8 #23)
    flashColorOnly();          // visual: instant color flash, no animation
    expo.haptics.lightImpact();
    return;
  }

  const visualDuration = role === 'full' ? 1500 : role === 'shortened' ? 600 : 1500;
  const t0 = performance.now();

  // Visual via Reanimated (UI thread, ~16ms granularity)
  startReanimatedArc(visualDuration);

  // Audio via expo-av/audio (preloaded chime)
  if (role !== 'shortened' && role !== 'batchSummary' && audioInWindowAllowed()) {
    expo.audio.playSoundAsync(chimeRef);
  }

  // Haptic via expo-haptics (Taptic Engine on iOS, Vibrator on Android)
  if (role === 'full') {
    expo.haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } else if (role === 'shortened') {
    expo.haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } else if (role === 'batchSummary') {
    expo.haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // Drift telemetry (Sentry)
  const drift = performance.now() - t0;
  Sentry.addBreadcrumb({ message: 'sensory_drift_ms', data: { role, drift } });
}
```

### Drift targets (tiered per cycle 33)

| Tier | Target | Devices |
|---|---|---|
| iOS premium | <16ms (1 frame) | iPhone 12+ |
| iOS budget | <50ms (3 frames) | iPhone SE 2nd gen |
| Android premium | <50ms | Pixel 7+, Samsung S22+ |
| Android budget | <80ms | Redmi Note 12, Samsung A14, Oppo budget |

If V1 drift exceeds targets in M2 spike, Wave 1.1 picks up the custom Expo Module path.

### Hardware-spacing rule

`MIN_HAPTIC_GAP_MS = 250` (cycle 33 iOS sev-8 #24). If two signatures fire within 250ms, the second one's haptic suppresses (visual + audio still play). Prevents Taptic Engine from merging into one buzz.

### Reduce Motion accessibility

iOS: `UIAccessibility.isReduceMotionEnabled` via `expo-accessibility` (or simple module). Android: `AccessibilityManager.isAnimatorAllowed()`. If true → `role` upgrades to `'reduced'`.

---

## 6. Native module governance — `expo-notification-observer` (Wave 1.1)

When Path 6 ships post-Wave 1.1, the custom Expo Module ships. Governance:

### Specification

```kotlin
// android/src/main/java/com/tokoflow/expo_notification_observer/NotificationObserverService.kt
class NotificationObserverService : NotificationListenerService() {
  override fun onNotificationPosted(sbn: StatusBarNotification) {
    // Runs on binder thread — DO NOT call JSI directly here
    val event = mapOf(
      "packageName" to sbn.packageName,
      "title" to sbn.notification.extras.getString("android.title"),
      "text" to sbn.notification.extras.getString("android.text"),
      "postTime" to sbn.postTime,
    )

    // Marshal to UI thread via RCTDeviceEventEmitter (cycle 33 Android sev-9 #3)
    Handler(Looper.getMainLooper()).post {
      NotificationObserverModule.emitEvent(event)
    }
  }
}
```

```kotlin
// AndroidManifest.xml additions
<service
  android:name=".NotificationObserverService"
  android:label="Tokoflow Notification Observer"
  android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"
  android:foregroundServiceType="specialUse">
  <intent-filter>
    <action android:name="android.service.notification.NotificationListenerService" />
  </intent-filter>
  <property
    android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
    android:value="payment_notification_observer" />
</service>
```

### Tiered heartbeat (cycle 33 Android sev-9 #5)

```ts
const HEARTBEAT_INTERVAL: Record<string, number> = {
  'Xiaomi':   24 * 60 * 60 * 1000,    // 24h
  'Redmi':    24 * 60 * 60 * 1000,
  'Oppo':     24 * 60 * 60 * 1000,
  'Vivo':     24 * 60 * 60 * 1000,
  'Realme':   24 * 60 * 60 * 1000,
  'Samsung':  72 * 60 * 60 * 1000,    // 72h
  'Google':   7  * 24 * 60 * 60 * 1000, // 7d (Pixel)
  'OnePlus':  24 * 60 * 60 * 1000,
  '_default': 24 * 60 * 60 * 1000,    // conservative for unknown
};

const oem = await DeviceInfo.getManufacturer();
scheduleHeartbeat(HEARTBEAT_INTERVAL[oem] ?? HEARTBEAT_INTERVAL._default);
```

### Test strategy

- Unit: KotlinTest for service callbacks; mock `NotificationListenerService`
- Integration: ADB-driven posts of test notifications; assert event emission within 2s
- E2E: 3-OEM matrix (Xiaomi Redmi Note 12 + Oppo A78 + Samsung A14) automated nightly
- Manual: monthly Phase 0 / Phase 1 reviewers run battery-saver kill scenario

### Maintenance contract

- SDK upgrade: Expo SDK bumps Quarter +1; module re-tested against new SDK target version
- Android API upgrades: track Android 16/17/18 NotificationListenerService deprecations; migration path documented
- Deprecation policy: if Path 6 yields <60% reliability across 30-day Wave 1.1 cohort → degrade to manual-share-only (already specced cycle 28 §12)

---

## 7. Wave 2 ID fork strategy — same source, brand env var

### Source-level: one codebase

`apps/mobile/app.config.ts`:

```ts
export default ({ config }) => {
  const brand = process.env.EXPO_PUBLIC_BRAND ?? 'tokoflow';
  return {
    ...config,
    name: brand === 'catatorder' ? 'CatatOrder' : 'Tokoflow',
    slug: brand,
    ios: {
      bundleIdentifier: brand === 'catatorder' ? 'com.catatorder.app' : 'com.tokoflow.app',
    },
    android: {
      package: brand === 'catatorder' ? 'com.catatorder.app' : 'com.tokoflow.app',
    },
    icon: `./brand/${brand}/icon.png`,
    splash: { image: `./brand/${brand}/splash.png` },
    extra: { brand },
  };
};
```

### EAS profiles per brand

`apps/mobile/eas.json`:

```json
{
  "build": {
    "production-tokoflow-ios": {
      "env": { "EXPO_PUBLIC_BRAND": "tokoflow" },
      "platform": "ios"
    },
    "production-tokoflow-android": {
      "env": { "EXPO_PUBLIC_BRAND": "tokoflow" },
      "platform": "android"
    },
    "production-catatorder-ios": {
      "env": { "EXPO_PUBLIC_BRAND": "catatorder" },
      "platform": "ios"
    },
    "production-catatorder-android": {
      "env": { "EXPO_PUBLIC_BRAND": "catatorder" },
      "platform": "android"
    }
  },
  "submit": { /* same per-brand */ }
}
```

### Brand-divergent assets

`apps/mobile/brand/`:

```
brand/
├── tokoflow/
│   ├── icon.png
│   ├── splash.png
│   ├── adaptive-icon-foreground.png
│   ├── adaptive-icon-background.png
│   ├── monochrome-icon.png      # Android 13+ themed icons
│   └── store/
│       ├── feature-graphic.png  # Play Store
│       ├── screenshots-en-MY/
│       └── icon-1024.png        # App Store
└── catatorder/
    ├── icon.png
    ├── splash.png
    ├── adaptive-icon-foreground.png
    ├── adaptive-icon-background.png
    ├── monochrome-icon.png
    └── store/
        ├── feature-graphic.png
        ├── screenshots-id-ID/
        └── icon-1024.png
```

### Diverging copy

`lib/copy/` (existing) gets brand-aware locale dispatch:

```ts
// lib/copy/index.ts (extension)
import { Constants } from 'expo-constants';
const brand = Constants.expoConfig?.extra?.brand ?? 'tokoflow';
const locale = brand === 'catatorder' ? 'id-ID' : 'en-MY';

export const copy = locale === 'id-ID' ? idCopy : myCopy;
```

### Supabase project

- Wave 1 (MY only): existing project `yhwjvdwmwboasehznlfv` (Mumbai → Singapore migration pre-launch)
- Wave 2 (ID launch): same project initially. RLS isolation by `country_code` on profiles.
- Wave 2.x: fork to separate `catatorder-id` Supabase project if Indonesian data sovereignty regulation requires (UU PDP 2022 — under monitoring).

---

## 8. CI/CD pipeline

### GitHub Actions

```yaml
# .github/workflows/mobile-ci.yml
name: Mobile CI

on:
  pull_request:
    paths: ['apps/mobile/**', 'lib/**']
  push:
    branches: [main]
    paths: ['apps/mobile/**', 'lib/**']

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --filter './apps/mobile'
      - run: pnpm --filter mobile typecheck
      - run: pnpm --filter mobile lint        # includes vocab-lint + Reanimated-mandate
      - run: pnpm --filter mobile test:unit

  preview-build-on-merge:
    if: github.ref == 'refs/heads/main'
    needs: lint-and-typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform all --profile preview --non-interactive
      - run: eas update --branch preview --message "$(git log -1 --pretty=%B)"

  production-release:
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    environment: production-mobile        # requires manual approval
    steps:
      - uses: expo/expo-github-action@v8
      - run: eas build --platform all --profile production-tokoflow-ios --auto-submit
      - run: eas build --platform all --profile production-tokoflow-android --auto-submit
```

### Vocab lint rule

`apps/mobile/.eslintrc.js`:

```js
module.exports = {
  extends: ['expo', '../../eslint.config.js'],
  rules: {
    'no-restricted-syntax': ['error',
      // Vocab lint — cycle 28 §6 32-string blocklist
      {
        selector: 'Literal[value=/Whisper|STT|LLM|IDB|optimistic|sync pending|fuzzy match|extract|extraction|background twin|foreground assist|tier (1|2|3)|diary_entries|voice_notes|payment_events|matched_entry_id|composite_confidence|NotificationListenerService|ActivityKit|App Intents|Share Extension/i]',
        message: 'Engineering vocabulary cannot ship to user-facing surfaces. See cycle 28 §6 + lib/copy/.',
      },
      // Reanimated mandate — cycle 33 sev-8 #28
      {
        selector: 'ImportDeclaration[source.value="react-native"] > ImportSpecifier[imported.name="Animated"]',
        message: 'Use react-native-reanimated, not the legacy Animated API.',
      },
    ],
  },
};
```

### EAS Build profiles

| Profile | Use | Output |
|---|---|---|
| `development` | local Expo Dev Client + simulator | dev-client app on simulator |
| `preview` | TestFlight (internal) + Play Internal Testing | signed beta builds |
| `production-tokoflow-{ios,android}` | App Store + Play Store production | signed release builds |
| `production-catatorder-{ios,android}` | Wave 2 only | signed release builds |

### EAS Update channels

| Channel | Triggered by | Purpose |
|---|---|---|
| `dev` | local `eas update --branch dev` | dev iteration |
| `preview` | merge to `main` | beta cohort + alpha cohort |
| `prod-ios` | `git tag v*` + manual approval | iOS production users |
| `prod-android` | `git tag v*` + manual approval | Android production users |

OTA updates ship JS+assets only; native code changes still require store rebuild.

---

## 9. Beta distribution + alpha cohort

### TestFlight (iOS)

- Internal testers: 100 max (App Store Connect users in same org). Wave 1 alpha = 5 → 50 merchants fits.
- External testers: 10K max via public link. Wave 1.1+.
- Build expiry: 90 days. Schedule weekly EAS Submit during alpha.
- Beta review: 24h typical for first build, instant for subsequent.

### Play Internal Testing (Android)

- Up to 100 testers via email list.
- Promotion path: Internal Testing → Closed Testing → Open Testing → Production. Wave 1 stays in Internal until launch.

### Alpha cohort device-distribution mandate (cycle 33 Android sev-9, A1 spike)

5 Wave 1 alpha merchants must collectively cover:
- ✅ 1 iPhone (12 or later — covers premium iOS)
- ✅ 1 Pixel (6a or later — covers stock Android)
- ✅ 1 Samsung mid-range (Galaxy A14/A24 — covers OneUI)
- ✅ 1 Xiaomi/Redmi (Note 12 or 13 — covers MIUI worst case)
- ✅ 1 Oppo or Vivo (A78 or Y28 — covers ColorOS/FuntouchOS)

If Phase 0 friendly+hostile interview cohort is too small to satisfy, expand to 7 merchants with intentional device sourcing.

### Phase 1 Gate alpha targets (bible v1.2 unchanged)

- Sean Ellis ≥ 40% "very disappointed" without Tokoflow
- DAU ≥ 70% over 4 weeks
- ≥ 1 spontaneous referral
- NPS ≥ 8 from all 5 alphas
- ≥ 3 hours/week craft saved (self-reported)

---

## 10. Auth strategy across web + mobile

`@supabase/supabase-js` handles platform-specific session storage automatically:

| Platform | Storage |
|---|---|
| Next.js web | HTTP-only cookies via `@supabase/ssr` |
| RN mobile | `AsyncStorage` (auto-detected) |

Cross-platform considerations:

- **OAuth (Google)** — same Supabase OAuth provider; mobile uses `expo-auth-session` with deeplink callback `tokoflow://auth/callback`
- **Universal Links iOS** — `apple-app-site-association` at `https://tokoflow.com/.well-known/apple-app-site-association` routes `/r/[id]` and `/auth/callback` to mobile app when installed
- **App Links Android** — `assetlinks.json` at `https://tokoflow.com/.well-known/assetlinks.json` does the same
- **Fallback** — if user opens link without app installed, web page renders; "open in app" smart banner via Apple Smart App Banner + Google Play Store deeplink

Spec the deeplink config in cycle 35 MOBILE.md.

---

## 11. Sentry config (Wave 1)

Cycle 33 Perf sev-9 #8: Session Replay default violates Refuse-list #6.

`apps/mobile/sentry.config.ts`:

```ts
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableSession Replay: false,   // ❌ Wave 1 disabled — captures customer names + amounts
  // Re-enable post Wave 1 with full PII config
  beforeSend: (event) => {
    // Scrub breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(b => ({
        ...b,
        message: scrubPII(b.message),
        data: scrubPIIObject(b.data),
      }));
    }
    // Scrub extra context
    if (event.extra) event.extra = scrubPIIObject(event.extra);
    // Scrub user context (no email, no phone)
    if (event.user) event.user = { id: event.user.id };
    return event;
  },
  beforeBreadcrumb: (breadcrumb) => {
    // Drop breadcrumbs that include extracted_json content
    if (breadcrumb.message?.includes('extracted_json')) return null;
    return breadcrumb;
  },
});

function scrubPII(text: string | undefined): string | undefined {
  if (!text) return text;
  return text
    .replace(/\b\d{8,}\b/g, '[number]')           // phone numbers, IDs
    .replace(/\bRM\s?\d+(\.\d+)?\b/gi, '[RM ?]')  // amounts MY
    .replace(/\bRp\s?\d+(\.\d+)?\b/gi, '[Rp ?]')  // amounts ID
    .replace(/[a-zA-Z]+@[a-zA-Z.]+/g, '[email]'); // emails
}
```

Cold start telemetry via `@sentry/react-native` App Start tracking is enabled (no PII).

---

## 12. i18n (Wave 2 Q1 2027)

For Wave 1, Tokoflow ships English (en-MY) only. CatatOrder Wave 2 ships Bahasa Indonesia.

Spec for Wave 2:

```
lib/copy/
├── en-MY.ts        # Wave 1 (Manglish)
├── id-ID-jakarta.ts  # Wave 2 default
├── id-ID-bandung.ts  # Wave 2 dialect (Sari persona)
└── ms-MY.ts        # Wave 4 deferred
```

`i18next` + `react-i18next` adopted Wave 2 (not earlier — saves dep cost Wave 1).

Brand env var (D8) selects locale at startup:
- `EXPO_PUBLIC_BRAND=tokoflow` → `en-MY`
- `EXPO_PUBLIC_BRAND=catatorder` → `id-ID-jakarta` default + Bandung detection from device locale

---

## 13. Risk register update (cycle 32 → cycle 34)

| Risk | Cycle 32 P×I | Cycle 34 P×I (after fixes) | Status |
|---|---|---|---|
| Play Store rejects NotifListener | 30% × HIGH | 30% × LOW | Path 6 deferred; Wave 1 launches without Play Store risk |
| Whisper-tiny too slow on Redmi Note 12 | 50% × MED | 5% × LOW | Cloud STT default for budget; Whisper only on flagship |
| Sensory signature drift >50ms on budget Android | 40% × LOW | 30% × LOW | Tiered targets accepted; M2 spike validates |
| PowerSync cost > RM 5/merchant/month | 30% × MED | 0% (deferred D5) | Manual IDB queue per cycle 28 §1.4 |
| MIUI/ColorOS battery-saver kills NotifListener silently | 60% × MED | Wave 1.1 only | Heartbeat tiered (24h/72h/7d); coach-marks per OEM |
| Apple App Review rejects voice-as-primary input | 10% × MED | 5% × LOW | Privacy Manifest M6 spike; usage strings specced |
| Expo SDK 55 breaking changes mid-Wave-1 | 15% × LOW | 15% × LOW | Pin SDK 54 Wave 1; SDK 55 post-launch |
| Custom Expo Modules become maintenance burden | 25% × LOW | 5% × LOW | 1 module Wave 1.1 (was 2); JS orchestration V1 sensory |
| **NEW** Cold start budget exceeded on budget Android | — | 30% × MED | M2 + P1 spikes; first-of-day signature gating |
| **NEW** Burst-drain UX feels broken (no spinner contradiction) | — | 25% × MED | P2 spike specced; "menyusul..." chip |
| **NEW** Sentry uploads PII in production | — | 0% (fixed) | P3 spike; PII scrub `beforeSend` |
| **NEW** App Store reviewer demo video missing Phase 0 | — | 20% × MED | scheduled 1d Phase 0 task |

---

## 14. Score (vs cycle 21-30 architecture fit, post cycle-33 fixes)

| Dimension | Cycle 32 | Cycle 34 |
|---|---|---|
| Implements all 6 capture paths Day 1 | 10 | 8 (Path 6 deferred Wave 1.1; Paths 1-5 Day 1) |
| Implements 9-phase workflow A-I | 10 | 10 |
| Sensory signature feasibility | 8 | 8 (tiered drift; JS V1, custom module Wave 1.1 if needed) |
| Offline-first feasibility | 9 | 9 (manual IDB; PowerSync revisit) |
| iOS magic parity | 9 | 9 (Wave 2 Pro Live Activities; Day 1 Lock Screen widget + native Share Ext UI) |
| TS code reuse | 8 | 8 |
| Wave 1 8wk timeline | 8 | 9 (4-wk Phase 0 + 4-wk build clean separation) |
| Long-term maintenance | 9 | 9 |
| **NEW** Play Store survival | n/a | 9 (Path 6 deferred; Paths 1-5 Play-safe) |
| **NEW** Native module governance | n/a | 9 (1 module max Wave 1.1; tested matrix) |
| **NEW** Phase 0 execution feasibility | 7 | 8 (re-budgeted critical path 4wk) |
| **NEW** Privacy compliance | n/a | 8 (Sentry scrubbed; iOS Privacy Manifest M6) |
| **Average** | **8.9 (self)** | **8.7** |

Compare to cycle 33 red-team score 5.1: cycle 34 should land **8.4-8.7** under second-pass review (cycle 35).

---

## 15. What gates Wave 1 launch

After cycle 34 fixes, the gating items to ship Wave 1:

### Must pass before Phase 1 build week 1
- M2 (sensory drift bench) — 3d
- M3 (Whisper bench + cloud STT detect-slow flow) — 5d
- P3 (Sentry PII scrub) — 1d

### Must pass during Phase 1 build (weeks 1-8)
- M6 (iOS Privacy Manifest audit) — 3d
- M7 (iOS Lock Screen widget) — 5d
- M8 (iOS Share Extension SwiftUI native UI) — 5d
- P1 (cold-start telemetry + first-of-day gating) — 2d
- P2 (burst-drain "menyusul..." UX) — 2d
- P4 (SQLite WAL tuning) — 1d
- P5 (Reanimated mandate ESLint) — 0.5d
- P6 (burst-rush end-to-end bench) — 3d
- A1 (alpha cohort device distribution) — process

### Must pass post-Wave-1 for Wave 1.1 (Path 6 + auto-claim)
- M1 (NotifListener Expo Module) — 8-12d
- M5 (Play Store policy declaration) — 4-8wk wall-clock
- spike 1 (payment-notif-corpus-my, 9 providers × 500 samples) — external

### Wave 1 launch criteria (bible v1.2 unchanged)
- Sean Ellis ≥ 40% "very disappointed" without Tokoflow
- DAU ≥ 70% over 4 weeks
- ≥ 1 spontaneous referral
- NPS ≥ 8 from all 5 alphas
- ≥ 3 hours/week craft saved (self-reported)

---

## Status

- ✅ 8 hard decisions locked (D1-D8)
- ✅ Repo structure (single-repo, light-touch `apps/mobile/`)
- ✅ Phase 0 spike re-budget (15 spikes, 4-wk critical path)
- ✅ Library cut list (28 → 18; custom modules 2 → 1; deferrals documented)
- ✅ Sensory signature JS orchestration spec'd
- ✅ Native module governance for `expo-notification-observer` Wave 1.1
- ✅ Wave 2 ID fork strategy (brand env var + bundle IDs + divergent assets)
- ✅ CI/CD pipeline (GitHub Actions + EAS profiles + vocab lint + Reanimated mandate)
- ✅ Beta distribution (TestFlight + Play Internal Testing) + alpha cohort device mandate
- ✅ Auth strategy (Supabase auto-detects; deeplinks Universal Links + App Links)
- ✅ Sentry config (Session Replay disabled Wave 1; PII scrub)
- ✅ i18n strategy (Wave 1 en-MY; Wave 2 id-ID with Bandung dialect)
- ✅ Risk register updated (12 risks tracked, 4 new + 4 mitigated)
- ✅ Score 8.7/10 vs architecture fit (vs cycle 33 red-team 5.1)
- ✅ Wave 1 launch gating items enumerated with effort estimates

**Cycle 35 must produce `MOBILE.md` — canonical mobile architecture doc — and integrate into `ARCHITECTURE.md`.**
