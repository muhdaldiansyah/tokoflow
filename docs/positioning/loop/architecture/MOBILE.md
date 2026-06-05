# Tokoflow / CatatOrder — Mobile Architecture Spec

> **Audience:** the engineer building Phase 1 mobile apps. Companion to `ARCHITECTURE.md`.
> **Output of cycles 31-35** of the positioning loop. Locks Stack A (Expo + RN managed) and the build/deploy/execution path.
> **When this doc and ARCHITECTURE.md disagree on platform-specific implementation, this doc wins.** When they disagree on product behavior, ARCHITECTURE.md wins.

---

## Table of contents

1. [Stack lock + 8 hard decisions](#1-stack-lock--8-hard-decisions)
2. [Repo structure](#2-repo-structure)
3. [Library list — Wave 1 (18 libraries)](#3-library-list--wave-1-18-libraries)
4. [Architecture cycle-28 boundary contract → mobile implementation map](#4-architecture-cycle-28-boundary-contract--mobile-implementation-map)
5. [Six capture paths — mobile implementation](#5-six-capture-paths--mobile-implementation)
6. [Sensory signature — JS orchestration (V1) + custom module (Wave 1.1+ if needed)](#6-sensory-signature--js-orchestration)
7. [Auth + deeplinks](#7-auth--deeplinks)
8. [Sentry / observability](#8-sentry--observability)
9. [CI/CD pipeline](#9-cicd-pipeline)
10. [Wave 2 ID fork strategy](#10-wave-2-id-fork-strategy)
11. [Phase 0 spike list (re-budgeted, 4-week critical path)](#11-phase-0-spike-list)
12. [Wave 1 → Wave 1.1 → Wave 2 progression](#12-wave-1--wave-11--wave-2-progression)
13. [Forbidden patterns](#13-forbidden-patterns)
14. [Wave 1 launch gates](#14-wave-1-launch-gates)

---

## 1. Stack lock + 8 hard decisions

### Stack

| Layer | Pick |
|---|---|
| Framework | **React Native 0.81+** (New Architecture mandatory: Fabric + TurboModules + JSI + Bridgeless) |
| Manager | **Expo SDK 54+** (managed workflow with Dev Client) |
| JS engine | Hermes (default) |
| Languages | TypeScript everywhere; Kotlin (Android Expo Modules); Swift (iOS Expo Modules) |
| Build | EAS Build |
| OTA | EAS Update |
| Submit | EAS Submit |
| Beta | TestFlight (iOS) + Play Internal Testing (Android) |

### Eight decisions cycle 33 forced (cycle 34 D1-D8)

| # | Decision | Locked value |
|---|---|---|
| **D1** | NotificationListener auto-claim Day 1? | **Wave 1.1** (post-launch); Wave 1 Android uses Paths 1-5 only |
| **D2** | Cloud STT for budget Android? | **Default** for detect-slow devices; on-device Whisper only on iPhone 12+ / Pixel 7+ / Samsung S22+ flagship-tier |
| **D3** | Custom Expo Modules in Wave 1? | **Zero.** Wave 1.1 may add `expo-notification-observer` for Path 6. JS orchestrates sensory signature in V1. |
| **D4** | Repo structure? | **Single repo, single git** — `apps/mobile/` sibling to existing Next.js root; no pnpm workspaces yet |
| **D5** | PowerSync sync engine? | **Manual IDB queue** per cycle 28 §1.4; PowerSync deferred |
| **D6** | Library count Wave 1? | **18 libraries** (cut from 28) |
| **D7** | Sentry Session Replay Wave 1? | **Disabled** (re-enable post Wave 1 with PII-mask config) |
| **D8** | Wave 2 ID fork? | **Same codebase**, brand env var (`EXPO_PUBLIC_BRAND={tokoflow,catatorder}`) → 2 binaries; bundle IDs `com.tokoflow.app` (MY) + `com.catatorder.app` (ID) |

### Tiered drift target (cycle 33 iOS sev-9 #10)

| Tier | <Visual+Audio+Haptic drift> | Devices |
|---|---|---|
| iOS premium | <16ms (1 frame) | iPhone 12+ |
| iOS budget | <50ms | iPhone SE 2nd gen |
| Android premium | <50ms | Pixel 7+, Samsung S22+ |
| Android budget | <80ms | Redmi Note 12, Samsung A14, Oppo budget |

If V1 drift exceeds targets, custom Expo Module path lands Wave 1.1.

---

## 2. Repo structure

```
tokoflow/                              # current repo, unchanged at root
├── app/                               # Next.js 16 (existing) — marketing + customer-facing + admin
├── components/                        # Next.js components (existing)
├── lib/                               # Shared TS code (existing) — read by mobile via path alias
│   ├── copy/                          # ✓ reusable
│   ├── utils/                         # ✓ reusable
│   ├── billplz/                       # server-only — NOT imported into mobile
│   ├── myinvois/                      # server-only — same
│   └── voice/                         # ✓ TS utilities reusable
├── features/                          # Next.js feature modules (existing) — server-side via API
├── supabase/migrations/               # shared (existing 080 + new 081-085 from cycle 28 §2)
├── apps/
│   └── mobile/                        # NEW — Expo + RN app
│       ├── app/                       # expo-router file-based routing
│       ├── components/                # RN components (rewrite of web counterparts)
│       ├── modules/                   # custom Expo Modules (none Wave 1; 1 Wave 1.1)
│       ├── brand/                     # divergent assets per brand
│       │   ├── tokoflow/
│       │   └── catatorder/
│       ├── eas.json                   # EAS Build + EAS Update + EAS Submit config
│       ├── app.config.ts              # reads EXPO_PUBLIC_BRAND
│       └── package.json               # mobile deps separate from web
└── package.json                       # web deps (existing)
```

### TS path alias

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

Metro respects tsconfig paths; no extra bundler config.

**Estimated TS reuse from web codebase: 40-50%** (utils, types, copy, services, schema). UI: 100% rewrite.

---

## 3. Library list — Wave 1 (18 libraries)

### Core platform (5)

| Library | Why |
|---|---|
| `expo` | manager (SDK 54+) |
| `react-native` | runtime (0.81+) |
| `react` | UI (19.1+) |
| `expo-router` | file-based routing |
| `@shopify/flash-list` v2 | mandatory for diary feed |

### Native API bridges (5)

| Library | Why |
|---|---|
| `@notifee/react-native` | foreground service (Wave 1.1 NotifListener heartbeat) + notif display + battery deeplinks |
| `expo-share-extension` (MaxAst) — **with SwiftUI extension UI, NOT RN** | Path 4 + Path 5 (iOS) |
| `@bacons/apple-targets` | iOS Lock Screen widget (read-only summary, silent-push reload) |
| `expo-haptics` | basic haptic for sensory signature V1 |
| `expo-notifications` | push for daily briefing cron |

### Audio + STT (4)

| Library | Why |
|---|---|
| `expo-audio` | record m4a (replaces deprecated `expo-av`) |
| `react-native-audio-api` | opus decode for forwarded WA voice notes |
| `whisper.rn` (mybigday) + Mesolitica `malaysian-whisper-tiny` weights | on-device STT for flagship-tier (D2) |
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

### Server (1)

| Library | Why |
|---|---|
| `@supabase/supabase-js` | auth (auto-detects AsyncStorage on RN) + realtime + REST |

**Total: 18 libraries.** **Custom Expo Modules Wave 1: 0.**

### What's deferred

- `software-mansion-labs/expo-live-activity` — Wave 2 Pro tier (Rush Mode)
- `react-native-haptic-feedback` (mkuczera) — **dropped** (doesn't expose CHHapticEngine; replaced by `expo-haptics` + future custom module if needed)
- `ffmpeg-kit-react-native` — conditional (only if `react-native-audio-api` opus → 16kHz resample insufficient; verify in M3 spike)
- `react-native-disable-battery-optimizations-android` — Wave 1.1 (only when Path 6 lands)
- `whisperkit-coreml` (Argmax iOS-only ANE accel) — Wave 2 Pro tier
- `expo-audio-stream` (deeeed) — save-then-process is fine for V1
- `op-sqlite`, WatermelonDB, Realm — `expo-sqlite/next` ships with sufficient perf
- Maestro / Detox E2E — manual QA matrix Wave 1
- Storybook — no UI design system formal yet
- `i18next` + `react-i18next` — Wave 2 (BM/BI)
- PowerSync — D5 deferred; manual IDB queue per cycle 28 §1.4

---

## 4. Architecture cycle-28 boundary contract → mobile implementation map

| Cycle 28 § | Rule | Mobile implementation |
|---|---|---|
| §1.1 (3 gestures) | tap / long-press / share | `Pressable` with `onLongPress` 200ms; `expo-share-extension` |
| §1.2 (`min()` confidence) | composite | computed in TS service layer (shared with web) |
| §1.3 (0.92 money + 7d undo) | per-row threshold | server + client checks; client uses Drizzle query |
| §1.4 (60-min pending_match queue) | second-pass reconciliation | server-side cron; client subscribes via Supabase Realtime |
| §1.5 (sensory decay envelope) | per-window suppression | Zustand 5-min rolling window; JS orchestrates `expo-haptics` + Reanimated + `expo-audio` |
| §1.6 (correction cascade) | re-evaluate matches | service-layer mutation hook |
| §1.7 (composed undo) | 60s transaction window | Zustand undo stack + Drizzle transaction |
| §1.8 (similar-names trap 5s peek) | extend yellow chip | client-side chip component |
| §1.9 (toddler 200ms sustain + biometric) | money tap | `Pressable` `onLongPress={200}`; `expo-local-authentication` for Toddler Mode |
| §1.10 (sticky multi-cand cards) | no auto-dismiss | component prop |
| §1.11 (VoiceOver narration) | `aria-live` collapse | RN's `accessibilityLiveRegion="polite"` + queue |
| §1.12 (refuse list) | architecture-enforced | TS lint + ESLint rule (forbidden libraries + APIs) |
| §2 (`diary_entries` schema) | super-table + MVs | Drizzle schema mirrored mobile + web; Supabase migrations 081-085 |
| §3 (UX surface) | adaptive-zoom feed + Now pin + Lock Screen widget | `expo-router` stack; FlashList v2 feed; `@bacons/apple-targets` widget |
| §4 (6 capture paths) | per-path | see §5 below |
| §5 (workflow A-I) | 9-phase pipeline | see workflow ladder in §5 below |
| §6 (12 failure modes) | per-mode handling | see ARCHITECTURE.md §6 + this doc §11 spikes |

---

## 5. Six capture paths — mobile implementation

| Path | UI entry | Wave 1 mobile implementation |
|---|---|---|
| **1. Cash voice** | mic button (single tap) | `expo-audio` record m4a → ffmpeg or `react-native-audio-api` resample 16kHz → `whisper.rn` (flagship) or cloud STT (budget Android, D2) → `/api/extract` |
| **2. Text** | numpad / keyboard on chip tap or long-press mic | `TextInput`; sends straight to `/api/extract` |
| **3. Image (camera)** | camera intent | `expo-camera`; uploads to Supabase Storage; `/api/extract` Vision LLM OCR |
| **4. WA screenshot share** | iOS Share Extension / Android Share Intent | iOS: `expo-share-extension` (SwiftUI UI, writes URL to App Group, deeplinks main app). Android: `intent-filter` for `image/*` in AndroidManifest. |
| **5. Forwarded WA voice (`.opus`)** | Share intent with `audio/ogg` | iOS: `expo-share-extension` audio UTType; Android: `intent-filter` for `audio/ogg`, `audio/opus`. Decode in main app via `react-native-audio-api`. |
| **6. Android NotificationListener auto-claim** | passive observation | **WAVE 1.1** — custom `expo-notification-observer` Expo Module (D1) |

### Workflow pipeline mobile-specific (cycle 30 ARCHITECTURE.md §5 + mobile)

```
A. Capture     → expo-audio / expo-camera / expo-share-extension / (Wave 1.1) expo-notification-observer
B. STT         → whisper.rn (flagship) OR OpenRouter cloud STT (budget Android default per D2)
C. Extract     → fetch('/api/extract', { provider: 'gemini' or 'sahabat' }) — server unchanged
D. Confidence  → service-layer TS, identical to web (composite = min())
E. Persist     → Drizzle insert into expo-sqlite; manual IDB queue per cycle 28 §1.4
F. Signature   → JS orchestration (§6 below)
G. Side-effect → /api/* endpoints unchanged (WA draft NEVER auto-sends per refuse list)
H. Corrections → in-place patch in local SQLite; sync via Supabase
I. Offline     → manual IDB queue + reconcile-on-drain per cycle 28 §1.4
```

### Cloud STT detect-slow flow (D2)

```ts
// At first launch, benchmark on a 3s test clip
const benchmark = await whisper.rn.benchmarkInference(testClipUrl, 'tiny');
const isSlowDevice = benchmark.totalTimeMs > 5000; // >5s for 3s clip = >1.66x realtime

if (isSlowDevice) {
  await SecureStore.setItemAsync('use_cloud_stt', 'true');
  showOnboardingDisclosure({
    bahasa: 'Hp kamu agak lambat untuk dengar suara di-device. Suara kamu nanti dikirim ke AI Tokoflow untuk ditranskrip — tidak disimpan di server.',
    english: 'Your phone is a bit slow for on-device transcription. Your voice is sent to Tokoflow AI for transcription — never stored on our servers.',
  });
}
```

Disclosure is **mandatory before first cloud STT call**; user can opt to use slower on-device path instead.

### Audio recording specifics

```ts
// expo-audio Wave 1 spec
const recording = new Audio.Recording();
await recording.prepareToRecordAsync({
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 16000,    // Whisper-friendly
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
  },
});
```

End-of-utterance: 1.5s silence detection via `expo-audio`'s `getStatusAsync()` polling, OR explicit user tap-end.

---

## 6. Sensory signature — JS orchestration

```ts
// apps/mobile/lib/sensory-signature.ts
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-audio';
import { runOnUI } from 'react-native-reanimated';

const MIN_HAPTIC_GAP_MS = 250;       // cycle 33 iOS sev-8 #24
let lastHapticAt = 0;

export async function fireSensorySignature(role: SignatureRole) {
  if (role === 'silent') return;

  // Reduce Motion accessibility
  if (await isReduceMotionEnabled() && role !== 'reduced') {
    role = 'reduced';
  }

  if (role === 'reduced') {
    runOnUI(flashColorOnly)();
    if (canFireHaptic()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      lastHapticAt = Date.now();
    }
    return;
  }

  const visualDuration = role === 'full' ? 1500 : role === 'shortened' ? 600 : 1500;
  const t0 = performance.now();

  // Visual: Reanimated UI thread (16ms granularity)
  runOnUI(startReanimatedArc)(visualDuration);

  // Audio: expo-audio preloaded chime
  if ((role === 'full' || role === 'batchSummary') && audioInWindowAllowed()) {
    chimePlayer.replayAsync();
  }

  // Haptic: expo-haptics → Taptic Engine (iOS) / Vibrator (Android)
  if (canFireHaptic()) {
    if (role === 'full') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (role === 'shortened') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (role === 'batchSummary') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    lastHapticAt = Date.now();
  }

  const drift = performance.now() - t0;
  Sentry.addBreadcrumb({ message: 'sensory_drift_ms', data: { role, drift } });
}

function canFireHaptic(): boolean {
  return Date.now() - lastHapticAt >= MIN_HAPTIC_GAP_MS;
}

type SignatureRole = 'full' | 'shortened' | 'silent' | 'batchSummary' | 'reduced';
```

### Decay envelope state (Zustand)

```ts
// apps/mobile/lib/sensory-window.ts
import { create } from 'zustand';

interface WindowState {
  events: { at: number; role: SignatureRole }[];
  pruneOlder(): void;
  position(): number;            // 0 = first, 1 = second, etc
  determineRole(intent: 'full' | 'money'): SignatureRole;
}

export const useSensoryWindow = create<WindowState>((set, get) => ({
  events: [],
  pruneOlder() {
    const cutoff = Date.now() - 5 * 60 * 1000;
    set(s => ({ events: s.events.filter(e => e.at > cutoff) }));
  },
  position() {
    get().pruneOlder();
    return get().events.length;
  },
  determineRole(intent) {
    const pos = get().position();
    const isFirstOfDay = checkFirstOfDay();   // localStorage key resets at 06:00 local

    if (isFirstOfDay) return 'full';

    if (pos === 0) return 'full';
    if (pos === 1) return 'shortened';
    if (pos === 2) return intent === 'money' ? 'reduced' : 'silent';
    return intent === 'money' ? 'reduced' : 'silent';
  },
}));
```

### Wave 1.1 escape hatch

If M2 spike measures drift exceeding tier targets, custom `expo-sensory-signature` Expo Module ships Wave 1.1 — single Swift / Kotlin function fires AVAudioPlayer + CHHapticEngine + Reanimated trigger from one native call. Spec deferred until measurement.

---

## 7. Auth + deeplinks

### Supabase auth

`@supabase/supabase-js` automatically detects React Native and uses AsyncStorage for session.

```ts
// apps/mobile/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,    // mobile uses deeplink, not URL
    },
  }
);
```

### Google OAuth

Mobile uses `expo-auth-session`:

```ts
const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'tokoflow',                   // becomes tokoflow://auth/callback
});
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: redirectUri },
});
```

### Universal Links (iOS) + App Links (Android)

`https://tokoflow.com/.well-known/apple-app-site-association`:
```json
{
  "applinks": {
    "details": [{
      "appIDs": ["TEAMID.com.tokoflow.app"],
      "components": [
        { "/": "/r/*" },
        { "/": "/auth/callback" }
      ]
    }]
  }
}
```

`https://tokoflow.com/.well-known/assetlinks.json`:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.tokoflow.app",
    "sha256_cert_fingerprints": ["TEAM_FINGERPRINT"]
  }
}]
```

`apps/mobile/app.config.ts` registers schemes + entitlements.

When user opens `tokoflow.com/r/{id}` without app: web renders public receipt page. With app installed: app opens to receipt detail.

---

## 8. Sentry / observability

`apps/mobile/sentry.config.ts`:

```ts
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableSessionReplay: false,           // ❌ Wave 1 disabled (cycle 33 sev-9 #8)
  enableAutoSessionTracking: true,
  enableAppStartTracking: true,         // cold start telemetry (cycle 33 sev-9 #6)

  beforeSend: (event) => {
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(b => ({
        ...b,
        message: scrubPII(b.message),
        data: scrubPIIObject(b.data),
      }));
    }
    if (event.extra) event.extra = scrubPIIObject(event.extra);
    if (event.user) event.user = { id: event.user.id };
    return event;
  },

  beforeBreadcrumb: (breadcrumb) => {
    if (breadcrumb.message?.includes('extracted_json')) return null;
    if (breadcrumb.category === 'transaction' && breadcrumb.data?.url?.includes('/api/extract')) {
      breadcrumb.data = { url: '/api/extract', status: breadcrumb.data?.status };
    }
    return breadcrumb;
  },
});

function scrubPII(text: string | undefined): string | undefined {
  if (!text) return text;
  return text
    .replace(/\b\d{8,}\b/g, '[number]')
    .replace(/\bRM\s?\d+(\.\d+)?\b/gi, '[RM ?]')
    .replace(/\bRp\s?\d+(\.\d+)?\b/gi, '[Rp ?]')
    .replace(/[a-zA-Z]+@[a-zA-Z.]+/g, '[email]');
}
```

Telemetry hooks:
- App Start (cold + warm)
- Sensory drift (`sensory_drift_ms` breadcrumb)
- Whisper inference time
- LLM extract latency
- Battery percentage at session start/end
- Memory peak per session
- Reanimated frame drops (via `Performance.measure()`)

---

## 9. CI/CD pipeline

`.github/workflows/mobile-ci.yml`:

```yaml
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
      - run: pnpm --filter mobile lint
      - run: pnpm --filter mobile test:unit

  preview-build-on-merge:
    if: github.ref == 'refs/heads/main'
    needs: lint-and-typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: expo/expo-github-action@v8
        with: { eas-version: latest, token: '${{ secrets.EXPO_TOKEN }}' }
      - run: eas build --platform all --profile preview --non-interactive
      - run: eas update --branch preview --message "$(git log -1 --pretty=%B)"

  production-release:
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    environment: production-mobile     # requires manual approval
    steps:
      - uses: expo/expo-github-action@v8
      - run: eas build --platform all --profile production-tokoflow-ios --auto-submit
      - run: eas build --platform all --profile production-tokoflow-android --auto-submit
```

### EAS Build profiles (`apps/mobile/eas.json`)

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_BRAND": "tokoflow" }
    },
    "preview": {
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_BRAND": "tokoflow" },
      "channel": "preview"
    },
    "production-tokoflow-ios": {
      "env": { "EXPO_PUBLIC_BRAND": "tokoflow" },
      "platform": "ios",
      "channel": "prod-ios"
    },
    "production-tokoflow-android": {
      "env": { "EXPO_PUBLIC_BRAND": "tokoflow" },
      "platform": "android",
      "channel": "prod-android"
    },
    "production-catatorder-ios": {
      "env": { "EXPO_PUBLIC_BRAND": "catatorder" },
      "platform": "ios",
      "channel": "prod-ios"
    },
    "production-catatorder-android": {
      "env": { "EXPO_PUBLIC_BRAND": "catatorder" },
      "platform": "android",
      "channel": "prod-android"
    }
  },
  "submit": {
    "production-tokoflow-ios": {
      "appleId": "REDACTED",
      "ascAppId": "REDACTED",
      "appleTeamId": "REDACTED"
    },
    "production-tokoflow-android": {
      "serviceAccountKeyPath": "./google-play-key.json",
      "track": "internal"
    }
  }
}
```

### EAS Update channels

| Channel | Trigger | Audience |
|---|---|---|
| `dev` | local `eas update --branch dev` | dev team |
| `preview` | merge to `main` | TestFlight + Play Internal Testing alpha cohort |
| `prod-ios` | `git tag v*` + manual approval | iOS production users |
| `prod-android` | `git tag v*` + manual approval | Android production users |

OTA ships JS+assets only. Native code changes require store rebuild.

---

## 10. Wave 2 ID fork strategy

`apps/mobile/app.config.ts`:

```ts
import { ExpoConfig } from 'expo/config';

export default (): ExpoConfig => {
  const brand = process.env.EXPO_PUBLIC_BRAND ?? 'tokoflow';
  const isCatatOrder = brand === 'catatorder';

  return {
    name: isCatatOrder ? 'CatatOrder' : 'Tokoflow',
    slug: brand,
    version: '1.0.0',
    icon: `./brand/${brand}/icon.png`,
    splash: {
      image: `./brand/${brand}/splash.png`,
      resizeMode: 'contain',
      backgroundColor: isCatatOrder ? '#FF6B35' : '#10B981',
    },
    ios: {
      bundleIdentifier: isCatatOrder ? 'com.catatorder.app' : 'com.tokoflow.app',
      associatedDomains: [`applinks:${isCatatOrder ? 'catatorder.com' : 'tokoflow.com'}`],
    },
    android: {
      package: isCatatOrder ? 'com.catatorder.app' : 'com.tokoflow.app',
      adaptiveIcon: {
        foregroundImage: `./brand/${brand}/adaptive-icon-foreground.png`,
        backgroundColor: isCatatOrder ? '#FF6B35' : '#10B981',
      },
    },
    extra: { brand },
    plugins: [
      'expo-router',
      'expo-haptics',
      ['expo-share-extension', { /* per-brand options */ }],
    ],
  };
};
```

Brand-divergent assets in `apps/mobile/brand/{tokoflow,catatorder}/`.

`lib/copy/` extension:

```ts
import { Constants } from 'expo-constants';
import { idCopy } from './id-ID';
import { myCopy } from './en-MY';

const brand = Constants.expoConfig?.extra?.brand ?? 'tokoflow';
export const copy = brand === 'catatorder' ? idCopy : myCopy;
```

### Supabase project

- Wave 1 (MY only): existing project `yhwjvdwmwboasehznlfv`
- Wave 2 (ID launch): same project initially, RLS isolation by `country_code` on profiles
- Wave 2.x: fork to separate project if Indonesian data sovereignty regulation requires (UU PDP 2022 — under monitoring)

---

## 11. Phase 0 spike list

8 mobile-specific (M1-M8) + 6 perf (P1-P6) + 1 process (A1) + carry-forward from cycle 30.

### Mobile spikes

| # | Spike | Effort | Wave |
|---|---|---|---|
| **M1** | `expo-notification-observer` Expo Module + binder-thread marshaling + tiered heartbeat (24h F-tier / 72h Samsung / 7d Pixel) + foregroundServiceType=specialUse | 8-12d | 1.1 only |
| **M2** | Sensory signature JS orchestration + drift bench (3-tier targets) | 3d | 1 |
| **M3** | Whisper-tiny on Redmi Note 12 + cloud STT detect-slow flow + onboarding disclosure copy | 5d | 1 |
| **M5** | Play Store policy declaration cycle | 4-8wk wall-clock | 1.1 only |
| **M6** | iOS Privacy Manifest audit (28 libs) + aggregate generation | 3d | 1 |
| **M7** | iOS Lock Screen widget (read-only summary) + silent-push reload | 5d | 1 |
| **M8** | iOS Share Extension SwiftUI native UI + App Group setup | 5d | 1 |

### Perf spikes

| # | Spike | Effort | Wave |
|---|---|---|---|
| **P1** | Cold-start telemetry + first-of-day signature gating | 2d | 1 |
| **P2** | Burst-drain "menyusul..." chip UX + progress dot | 2d | 1 |
| **P3** | Sentry config — Session Replay disabled + PII scrub `beforeSend` | 1d | 1 |
| **P4** | SQLite WAL tuning (`wal_autocheckpoint=100` + checkpoint throttle) | 1d | 1 |
| **P5** | Reanimated mandate ESLint rule + vocab lint (32-string blocklist) | 0.5d | 1 |
| **P6** | Burst-rush end-to-end bench (5-note burst on Redmi Note 12, p50/p95 budgets) | 3d | 1 |

### Process

| # | Item | Effort |
|---|---|---|
| **A1** | Alpha cohort device-distribution mandate (5 merchants × 5 OEM tiers) | 0d (intentional sourcing) |

### Carry-forward (cycle 30)

| # | Spike | Wave |
|---|---|---|
| 1 | `payment-notif-corpus-my.ts` (9 providers, 500+ samples × 30d × 5 merchants) | 1.1 |
| 4 | `opus-decode-latency.ts` (`react-native-audio-api`) | 1 |
| 6 | `payment-notif-corpus-id.ts` (12 providers, 1000+ samples) | 2 |
| 7 | `sahabat-ai-bandung-bench.ts` | 2 |
| 8 | `id-self-reference-disambig.ts` | 2 |
| 9 | `id-currency-locale-fence.ts` | 2 |
| 10 | `myinvois-spike.ts` | 1+ Pro |
| 11 | `billplz-spike.ts` | 1+ Pro |
| 12 | `wa-share-target-onboarding.ts` | 1 |

### Critical path

```
Week 1:  M2 + M3 + P1 + P3 + P5 + A1 setup + spike 4         → Foundation
Week 2:  M3 finish + P2 + P4 + spike 12                       → Core capture + sync
Week 3:  M6 + M7 + spike 11                                   → iOS surfaces + Pro prereq
Week 4:  M7 finish + M8 + P6 + integration testing            → iOS magic + perf validation
Weeks 5-8: Wave 1 build sprint per ARCHITECTURE.md §8.1       → Wave 1 launch

Post-launch parallel: M5 (4-8wk) + spike 1                    → Wave 1.1 NotifListener clearance
W+5 to W+9: M1 build                                          → Wave 1.1 release
```

---

## 12. Wave 1 → Wave 1.1 → Wave 2 progression

| Wave | Timing | Mobile scope |
|---|---|---|
| **Wave 1** (Tokoflow MY) | 8wk Phase 1 build, post-Phase-0-pass | iOS + Android with Paths 1-5 (no NotifListener); Lock Screen widget iOS (read-only summary); Cloud STT default for budget Android, Whisper for flagship; JS-orchestrated sensory signature (drift 30-80ms tier-acceptable); Sentry minus Session Replay |
| **Wave 1.1** (Tokoflow MY) | 4-8wk post-Wave-1, gated on M5 Play Store clearance + 60%+ alpha NPS≥8 | Add Path 6 (NotifListener auto-claim) on Android; per-OEM coach-marks; tiered heartbeat; possibly add custom `expo-sensory-signature` if M2 drift exceeds tier targets |
| **Wave 2** (CatatOrder ID) | 12wk Q1 2027, post-Wave-1.1 | ID locale (Bandung + Jakarta variants); Sahabat-AI integration if bench passes (else Gemini); 12 ID payment provider regexes; iOS Live Activities (Pro tier Rush Mode + webhook); brand fork via `EXPO_PUBLIC_BRAND=catatorder` |
| **Wave 3+** | Year 2+ | Vertical expansion MY (kosmetik, modest fashion, jasa); Geographic (KL, Penang, SG); Lock-widget-as-primary (Android 16/OneUI 8 prevalence); Cross-pattern (creator, freelancer); Global |

---

## 13. Forbidden patterns

### Vocabulary lint (32 strings)

User-facing strings cannot contain (CI-enforced via ESLint rule):

```
Whisper, STT, speech-to-text, ASR,
LLM, GPT, Gemini, Sahabat-AI, OpenRouter,
IDB, IndexedDB, queue, queued,
optimistic, eventually-consistent,
sync pending, syncing, synced,
reconciliation, reconcile, fuzzy match, Levenshtein,
confidence chip, confidence threshold,
extract, extraction, extracted_json,
background twin, foreground assist,
tier 1, tier 2, tier 3,
diary_entries, voice_notes, payment_events,
matched_entry_id, composite_confidence,
NotificationListenerService, ActivityKit, Live Activity,
App Intents, Share Extension
```

Permitted equivalents in `lib/copy/`.

### Animation API

`Animated` from `react-native` is forbidden. Use `react-native-reanimated` (Reanimated 3+).

### Refuse-list architecture enforcement

Forbidden libraries (architecturally banned, ESLint rule):

- Any social-media SDK (no posting on merchant's behalf — refuse #4)
- Any image generation/manipulation SDK that modifies (Photo Magic v1 is extract-only — refuse #5)
- Any sentiment/auto-reply lib for customer messages (refuse #3, refuse #7)
- Any "streak" or "badge" gamification lib (refuse #8)

### Privacy

- Sentry Session Replay: `enableSessionReplay: false` Wave 1
- iCloud backup: `NSURLIsExcludedFromBackupKey` set on SQLite file (cycle 33 iOS sev-8 #25)
- Audio: never auto-uploads; Whisper on-device by default; cloud STT requires explicit disclosure
- WA reply auto-draft: NEVER auto-sends (refuse #1)

---

## 14. Wave 1 launch gates

### Phase 0 gates (must pass before Phase 1 sprint week 1)

- [ ] M2 sensory drift bench passes tier targets (or escape-hatch documented)
- [ ] M3 Whisper bench + cloud STT detect-slow flow live
- [ ] P3 Sentry PII scrub deployed
- [ ] P5 ESLint rules merged
- [ ] A1 alpha cohort sourced with mandated device distribution

### Phase 1 build gates (must pass during weeks 1-8)

- [ ] M6 Privacy Manifest aggregate complete
- [ ] M7 iOS Lock Screen widget + silent-push reload working
- [ ] M8 iOS Share Extension SwiftUI native UI working
- [ ] P1 cold-start telemetry + first-of-day signature gating
- [ ] P2 burst-drain "menyusul..." chip UX
- [ ] P4 SQLite WAL tuning
- [ ] P6 burst-rush end-to-end bench passes p50/p95 budgets

### Wave 1 launch criteria (bible v1.2)

- [ ] Sean Ellis ≥ 40% "very disappointed" without Tokoflow
- [ ] DAU ≥ 70% over 4 weeks
- [ ] ≥ 1 spontaneous referral
- [ ] NPS ≥ 8 from all 5 alphas
- [ ] ≥ 3 hours/week craft saved (self-reported)

### Wave 1.1 trigger (post-launch)

- [ ] Wave 1 Phase 1 Gate passes (4/5 above)
- [ ] M1 NotifListener Expo Module functional on 3 OEMs
- [ ] M5 Play Store policy clearance approved
- [ ] spike 1 (payment-notif-corpus-my) data complete

### Wave 2 trigger

- [ ] Wave 1.1 stable for 60+ days
- [ ] Phase 0 ID spikes 6, 7, 8, 9 all pass

---

## Status

- ✅ Stack A locked (Expo SDK 54+ + RN 0.81+ + New Arch)
- ✅ 8 hard decisions D1-D8
- ✅ Repo structure (single-repo, light-touch)
- ✅ 18 libraries Wave 1 (custom modules: 0 Wave 1, 1 possible Wave 1.1)
- ✅ Architecture cycle-28 boundary contract → mobile implementation map
- ✅ 6 capture paths spec'd with mobile libs (Path 6 deferred Wave 1.1)
- ✅ Sensory signature JS orchestration + escape hatch
- ✅ Auth + deeplinks (Universal Links + App Links)
- ✅ Sentry config (Session Replay disabled Wave 1; PII scrub)
- ✅ CI/CD pipeline (GitHub Actions + EAS profiles + vocab + Reanimated lint)
- ✅ Wave 2 fork strategy (`EXPO_PUBLIC_BRAND` env var)
- ✅ Phase 0 spike list re-budgeted (15 spikes, 4-wk critical path)
- ✅ Wave 1 → 1.1 → 2 progression
- ✅ Forbidden patterns enforced architecturally
- ✅ Wave 1 launch gates with effort estimates

**Engineering can build from this document + ARCHITECTURE.md.**

**Final mobile architecture score:** 8.7/10 (cycle 34 projection); cycle 35 closes the cycle.
