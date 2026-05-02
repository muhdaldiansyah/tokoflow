# Cycle 032 — MOBILE_PLATFORM_HYPOTHESIZE

> Cycle 31 research scored 3 stack candidates 63 / 58 / 45. This cycle locks **Stack A (Expo + RN managed)**, picks specific 2026 libraries, addresses the 5 caveats, and maps each architecture-cycle-28 boundary contract section to a concrete RN implementation path.

---

## 1. Stack lock — Stack A (Expo + RN managed)

| Decision | Locked value |
|---|---|
| Framework | **React Native** (not Flutter, not Capacitor, not native dual) |
| Platform manager | **Expo (managed workflow with Dev Client)** — not bare RN, not pure native |
| RN version floor | **0.81+** (ships in Expo SDK 54) |
| Expo SDK floor | **SDK 54** for Wave 1 build start; **SDK 55+** by Wave 1 ship |
| Architecture | **New Architecture (Fabric + TurboModules + JSI + Bridgeless)** mandatory — no legacy bridge |
| JS engine | **Hermes** (default, no opt-out) |
| Languages | TypeScript everywhere; Kotlin for Android Expo Modules; Swift for iOS Expo Modules |

**Why stack A wins** (cycle 31 verdict re-confirmed):
- 5-pt margin over Bare RN driven by EAS Update OTA iteration speed + lower CI maintenance
- 18-pt margin over Native Dual driven by 8wk Wave 1 budget feasibility, ~50% TS code reuse from existing Next.js, single-codebase long-term maintenance
- Coinbase / Shopify / Discord / Expensify production precedent at scale; no production precedent of any ID/MY mompreneur SMB on RN, but no native-only ground truth either

**What this rejects:**
- Flutter — would force Dart port of `lib/copy/`, `lib/billplz/`, `lib/myinvois/`, `lib/utils/phone.ts`. Dead loss of ~18mo TS investment.
- Capacitor / WebView wrap — kills 3-sensory signature fidelity, Now-pin sub-second responsiveness, lock-screen widget primacy.
- Kotlin Multiplatform Mobile (KMM) — UI still native each platform; same TS-port loss as Flutter.
- Native dual (Swift/SwiftUI + Kotlin/Compose) — 16-20wk Wave 1, two codebases forever, hiring cost, no TS reuse.

---

## 2. Library stack — version-pinned 2026 picks

### Core platform

| Concern | Library | Version | Source |
|---|---|---|---|
| RN runtime | `react-native` | 0.81+ (via SDK 54) / 0.82+ (via SDK 55) | Expo SDK |
| Manager | `expo` | SDK 54+ | Expo |
| Bundler | Metro (default) | shipped with RN | RN |
| State | React 19.1 + Zustand or React Query (cached server state) | latest | — |
| Navigation | `expo-router` (file-based) | SDK 54+ | Expo |
| Lists at scale | `@shopify/flash-list` v2 | 2.x | Shopify |
| Forms | React Hook Form + Zod | latest | — |

### Native API bridges

| Capability | Library | Version | Notes |
|---|---|---|---|
| Notification observation (Android) | **Custom Expo Module** `expo-notification-observer` | written by us | **5-7d Phase 0 spike** — wraps NotificationListenerService + Notifee foreground service |
| Notification display + foreground service | `@notifee/react-native` | 9.x | for heartbeat keepalive + in-app notif rendering |
| Battery optimization | `react-native-disable-battery-optimizations-android` (or Notifee's `openBatteryOptimizationSettings`) | latest | for MIUI/ColorOS user-flow deeplink |
| iOS Share Extension | `expo-share-extension` (MaxAst) | latest | primary; `react-native-share-menu` (Expensify) fallback |
| iOS Live Activities (Wave 2 Pro) | `software-mansion-labs/expo-live-activity` | latest | not Day-1 |
| Apple targets / widgets | `@bacons/apple-targets` | latest | for iOS Lock Screen widget |
| Push notifications | `expo-notifications` | SDK 54+ | for daily briefing cron |
| Haptics (basic) | `expo-haptics` | SDK 54+ | selection / impact / notification |
| Haptics (custom CHHaptic envelopes) | `react-native-haptic-feedback` (mkuczera, 2024 rewrite) | latest | for sensory signature 1.5s/0.6s arc |
| Sensory signature (audio+visual+haptic <50ms drift) | **Custom Expo Module** `expo-sensory-signature` | written by us | **5d Phase 0 spike** |

### Audio + STT

| Capability | Library | Version | Notes |
|---|---|---|---|
| Audio record/playback | `expo-audio` | SDK 54+ | replaces deprecated `expo-av` |
| Opus decode (WA voice forwards) | `react-native-audio-api` | latest | supports m4a/mp4/aac/ogg/**opus** |
| Audio resample 16kHz mono | `ffmpeg-kit-react-native` | latest | feeds Whisper |
| On-device STT | `whisper.rn` (mybigday) + Mesolitica `malaysian-whisper-tiny` | latest + Mesolitica HF | with `RealtimeTranscriber` for streaming partials |
| iOS-specific accelerated path | `whisperkit-coreml` (Argmax) | optional Wave 2 Pro | Apple Neural Engine, iPhone 14+ only |
| Audio streaming pipeline | `expo-audio-stream` (deeeed) | optional | for streaming chunks vs save-then-process |
| LLM extract | OpenRouter (cloud) — Gemini Flash Lite (MY) / Sahabat-AI (ID) | — | unchanged from cycle 25 |

### Storage + sync

| Concern | Library | Version | Notes |
|---|---|---|---|
| Local SQLite | `expo-sqlite/next` | SDK 54+ | over `op-sqlite` for lower dep risk |
| ORM | `drizzle-orm` + `drizzle-kit` | latest | reusable schema between mobile + web |
| Reactive queries | Drizzle's `useLiveQuery` hook | — | auto re-render |
| Sync engine | **PowerSync** (vs manual IDB queue) | latest | **decision pending caveat #4 cost compare** |
| Backend | Supabase (existing) | unchanged | `yhwjvdwmwboasehznlfv` MY project; Singapore region migration pre-launch |

### Build, deploy, monitor

| Concern | Service / Tool | Tier | Notes |
|---|---|---|---|
| Build | EAS Build | Starter $19/mo (Wave 1) → Production $199/mo at 3K MAU | iOS + Android + Dev Client |
| OTA updates | EAS Update | Starter included | per-channel (dev / preview / prod-ios / prod-android) |
| App store submit | EAS Submit | Starter included | App Store + Play Store |
| Beta distribution | TestFlight (iOS) + Play Internal Testing (Android) | free | 10K external testers iOS, similar Android |
| Crash + perf | Sentry (`@sentry/react-native`) | Team plan ~$26/mo | Session Replays, source maps |
| Analytics | existing `track()` → `/api/track` endpoint | reused from web | unchanged |

### Dev tooling

| Concern | Library | Notes |
|---|---|---|
| Type-check | `tsc` | shared `tsconfig.base.json` |
| Lint | `eslint` + `@react-native/eslint-config` + custom **vocabulary lint** rule (cycle 28 §6 32-string blocklist) | new |
| Format | `prettier` | shared with web |
| Test (unit) | `jest` + `@testing-library/react-native` | shared utils |
| Test (E2E) | Maestro (preferred over Detox in 2026) | YAML flows, real-device runs |
| Storybook | `@storybook/react-native` | for component review |

---

## 3. Architecture cycle-28 boundary contract → RN implementation map

Each section of the cycle 28 boundary contract gets a concrete RN implementation path:

| Cycle 28 §  | Boundary rule | RN implementation |
|---|---|---|
| §1.1 (3 gestures) | single tap / long-press / share | `Pressable` with `onLongPress`; `expo-share-extension` for share-target |
| §1.2 (`min()` confidence) | composite_confidence | computed in service-layer TS; reused identically web + mobile |
| §1.3 (0.92 money threshold + 7d undo) | per-row threshold logic | server + client checks; client uses Drizzle query |
| §1.4 (60-min pending_match_queue) | second-pass reconciliation | server-side cron; client subscribes via Supabase Realtime |
| §1.5 (sensory decay envelope) | per-window suppression | `expo-sensory-signature` custom module + 5-min rolling window in Zustand |
| §1.6 (correction cascade) | re-evaluate matches on patch | trigger via service-layer mutation hook |
| §1.7 (composed undo) | 60s transaction window | Zustand undo stack + Drizzle transaction |
| §1.8 (two-similar-names trap) | extend yellow-chip 5s | client-side logic in chip component |
| §1.9 (toddler protection) | 200ms sustain on money tap + biometric | `expo-local-authentication` for biometric; `Pressable` `onLongPress` 200ms |
| §1.10 (sticky multi-cand cards) | no auto-dismiss | component prop `dismissable={false}` |
| §1.11 (VoiceOver narration) | `aria-live` collapse | RN's `accessibilityLiveRegion="polite"` + queue logic |
| §1.12 (refuse list) | architecture-enforced | TS lint rule against forbidden module names + APIs |

| Cycle 28 §  | Boundary rule | RN implementation |
|---|---|---|
| §2 (`diary_entries` schema) | super-table + MVs | Drizzle schema mirrored mobile + web; Supabase migrations 081-085 |
| §3 (UX surface) | adaptive-zoom feed + Now pin + Lock Screen widget | `expo-router` stack; FlashList v2 feed; `@bacons/apple-targets` widget |
| §4 (6 capture paths) | per-path implementation | see §4.1 below |
| §5 (workflow pipeline A-I) | 9-phase pipeline | see §5 below |
| §6 (12 failure modes) | per-mode handling | see cycle 35 MOBILE.md |
| §7 (12 Phase 0 spikes) | gate Phase 1 + Wave 2 | see §6 below |

### 3.1 Six capture paths — RN-specific routing

| Path | UI entry | RN library |
|---|---|---|
| 1. Voice | mic button (single tap) | `expo-audio` record m4a → ffmpeg resample → `whisper.rn` |
| 2. Text | numpad/keyboard on chip tap | `TextInput` |
| 3. Image (camera) | camera intent | `expo-camera` |
| 4. WA screenshot share | iOS Share Extension / Android Share Intent | `expo-share-extension` for iOS; `expo-router` deeplink + intent-filter for Android |
| 5. Forwarded WA voice (`.opus`) | Share intent with `audio/ogg` | iOS: `expo-share-extension` audio UTType; Android: AndroidManifest intent-filter; opus decode in main app via `react-native-audio-api` |
| 6. Android NotificationListener | passive observation | custom `expo-notification-observer` Expo Module |
| (iOS Path 6 alternative) | manual share from notif lock-screen | `expo-share-extension` |

### 3.2 Workflow pipeline — RN-specific

```
A. Capture          → expo-audio / expo-camera / expo-share-extension / expo-notification-observer
B. STT              → whisper.rn (RealtimeTranscriber, streaming partials)
C. Extract          → fetch('/api/extract', { provider: 'gemini' or 'sahabat' }) — server-side, unchanged
D. Confidence rt    → service-layer TS, identical to web
E. Persist          → Drizzle insert into local SQLite + PowerSync push to Supabase
F. Signature        → expo-sensory-signature (custom Expo Module)
G. Side effects     → existing /api/* endpoints unchanged
H. Corrections      → in-place patch in local SQLite, sync via PowerSync
I. Offline-first    → PowerSync handles queue + sync; or manual IDB if PowerSync rejected on cost
```

---

## 4. Caveat resolution — the 5 must-validates from cycle 31

### Caveat 1 — Notification Listener custom Expo Module (5-7d spike)

**Resolution path:**
1. Day 1-2: scaffold Expo Module via `npx create-expo-module expo-notification-observer`. Kotlin: subclass `NotificationListenerService`, override `onNotificationPosted`. JSI EventEmitter for JS-side subscribe.
2. Day 3-4: Notifee-backed foreground service for heartbeat. Permission deeplink to Settings → Notification Access.
3. Day 5: integrate with cycle 28 §12 heartbeat protocol (every 7d at 04:00 local, post test notif, listen for it).
4. Day 6-7: per-OEM testing: MIUI (Xiaomi Redmi Note 12), ColorOS (Oppo), OneUI (Samsung A14). Document permission UX divergence per OEM. Fallback: manual share-only mode.

**Pass criteria:** test notif observed within 2s on each OEM; heartbeat detects revocation within 1 cycle (7d).

**Failure path:** if Play Store rejects (caveat #5 separately), feature degrades silently to manual-share-only as cycle 28 §12 mandates. Existing `expo-share-extension` path covers iOS already; Android also gets share-target via intent-filter.

### Caveat 2 — Whisper-tiny on Redmi Note 12 (Phase 0 spike #2)

**Resolution path:** measure actual end-to-end latency on the worst-case target device.

| Step | Target |
|---|---|
| Audio record (m4a, 16kHz mono) | 30s clip |
| ffmpeg resample to PCM 16kHz | <1s |
| whisper.rn inference (tiny model, Mesolitica weights) | TBD — research budget says 15-30s |
| LLM extract (Gemini Flash Lite, /api/extract) | <3s |
| **End-to-end target** | **<25s for 30s audio** |

**If exceeds:**
- Try Qualcomm AI Hub NPU-accelerated whisper-tiny on Snapdragon devices
- Fall back to OpenRouter cloud Whisper (Gemini speech) for budget Android (with merchant opt-in disclosure)
- Extend optimistic-transcript chip "saya dengar..." duration in UX

**Pass criteria:** ≤25s end-to-end on Redmi Note 12 OR clean fallback path documented.

### Caveat 3 — Sensory signature custom Expo Module (5d spike)

**Resolution path:**
1. Day 1: scaffold `expo-sensory-signature` Expo Module.
2. Day 2: Swift implementation — single `fireSignature(role: 'full'|'shortened'|'silent'|'batchSummary')` function fires `CHHapticEngine` pattern + `AVAudioPlayer` chime + emits a JS event for visual keyframe trigger. All from one Swift function call.
3. Day 3: Kotlin implementation — `Vibrator.vibrate(VibrationEffect.createWaveform(...))` + `SoundPool` chime + JS event emit.
4. Day 4: measure visual+audio+haptic sync drift. Target <50ms.
5. Day 5: integrate with cycle 28 §1.5 decay envelope and §1.5.1 first-of-day rule.

**Pass criteria:** <50ms drift on iPhone 12 + Pixel 6a; <80ms on Redmi Note 12 / Samsung A14 acceptable.

**Failure path:** if RN+JSI cannot achieve <50ms, downgrade ambition for budget devices: still fire all 3 modalities, but label as "felt signature" not "synced signature". Pristine sync only on flagship devices.

### Caveat 4 — PowerSync vs manual IDB queue cost compare

**Resolution path:** request PowerSync's per-MAU pricing for our use case profile (50 Wave 1 merchants, ~50 voice notes / merchant / day, ~100KB / voice note + extracted_json, sync 5-10× / day).

| Variable | Estimate |
|---|---|
| MAU at 6mo | 50 (Wave 1) → 500 (post-launch) → 5,000 (Year 1) |
| Synced rows per merchant per day | ~150 (50 captures + 100 server-pushed updates) |
| Storage per merchant per month | ~150 MB (audio blobs + structured rows) |

**Decision rule:**
- If PowerSync ≤ RM 3 / merchant / month → **adopt PowerSync** (engineering time savings worth it)
- If PowerSync > RM 5 / merchant / month → **build manual IDB queue + reconcile-on-drain** per cycle 28 §1.4
- If RM 3-5 / merchant / month → adopt PowerSync for Wave 1 (engineering velocity), revisit at Year 1 scale

**Pass criteria:** decision documented before Phase 1 sprint week 1.

### Caveat 5 — Play Store policy declaration cycle (2-3 weeks)

**Resolution path:** submit a privacy-only build to Play Internal Testing **before** any TestFlight effort, to gauge Google's reviewer response on NotificationListener use.

1. Week 1: prepare reviewer-facing video showing:
   - Merchant grants Notification Access permission via Settings (~30s)
   - Tokoflow observes a DuitNow notification on lock-screen
   - Tokoflow files it as a payment claim card
   - What we never do (refuse list summary)
2. Week 1: complete Play Store Permissions Declaration form. Justification: "Read payment notifications to file in your business diary — never shared, never used for ads, on-device only until merchant taps to share."
3. Week 2: complete Data Safety form. Declare: audio recording, customer names, payment amounts, all on-device + Supabase backup. **Not** shared with third parties.
4. Week 2-3: submit to Play Internal Testing. Iterate on reviewer feedback if any.

**Pass criteria:** approval to publish to Play Internal Testing within 3 weeks. Internal Testing is pre-Closed Testing pre-Production — clearance here gates Wave 1.

**Failure path:** if Play forces removal of NotificationListener feature, app ships with manual-share-only on Android (Path 5 is voice-mention always works). Marketing copy adjusts: "auto-claim coming after Play Store review."

---

## 5. Code reuse strategy — monorepo

### Repo layout

```
tokoflow/
├── apps/
│   ├── web/                     # existing Next.js 16 app (marketing + customer storefront + admin)
│   └── mobile/                  # NEW — Expo + RN app (merchant primary)
├── packages/
│   ├── shared/                  # NEW — TS code reused web + mobile
│   │   ├── copy/                # ← move from web's lib/copy
│   │   ├── utils/               # ← move from web's lib/utils (phone, slug, date)
│   │   ├── types/               # cross-platform Drizzle schema + Zod
│   │   └── constants/           # plans, categories, navigation tokens
│   ├── api-client/              # NEW — fetch wrappers for /api/*
│   ├── billplz/                 # ← move from web's lib/billplz (server-only, server import)
│   ├── myinvois/                # ← move from web's lib/myinvois (server-only)
│   └── native-modules/          # NEW — custom Expo Modules
│       ├── expo-notification-observer/
│       └── expo-sensory-signature/
├── supabase/
│   └── migrations/              # shared (existing 080 + new 081-085)
└── pnpm-workspace.yaml          # NEW
```

### Code-reuse split

| Code | Lives in | Used by web | Used by mobile |
|---|---|---|---|
| `lib/copy/index.ts` | `packages/shared/copy/` | ✓ | ✓ |
| `lib/utils/phone.ts` | `packages/shared/utils/` | ✓ | ✓ |
| `lib/utils/slug.ts` | `packages/shared/utils/` | ✓ | ✓ |
| `features/orders/services/*` | `apps/web/features/orders/services/` (server-side) | ✓ | via API |
| `lib/billplz/` | `packages/billplz/` | ✓ (server-import) | via API |
| `lib/myinvois/` | `packages/myinvois/` | ✓ (server-import) | via API |
| Drizzle schema | `packages/shared/types/schema.ts` | ✓ | ✓ |
| Zod validators | `packages/shared/types/validators.ts` | ✓ | ✓ |
| API client (`fetch('/api/*')`) | `packages/api-client/` | ✓ (no-op) | ✓ |
| `app/(dashboard)/*` Next.js pages | `apps/web/app/(dashboard)/*` | ✓ | ✗ — REWRITE in mobile |
| Shadcn UI components | `apps/web/components/ui/*` | ✓ | ✗ — RN equivalents |
| Marketing pages | `apps/web/app/(marketing)/*` | ✓ | ✗ |
| Customer storefront | `apps/web/app/(public)/*` | ✓ | ✗ |

**Estimated reuse:** 40-50% of TS by line-count (utilities, types, services, copy). UI: 100% rewrite.

### Tooling

- **pnpm workspaces** for monorepo
- **Turborepo** for incremental builds across `apps/web` + `apps/mobile`
- **TypeScript project references** for cross-package type-check
- **Shared `tsconfig.base.json`** with strict mode

---

## 6. Phase 0 spike re-prioritization

Cycle 30 listed 12 spikes. Cycle 32 adds 3 mobile-specific spikes and re-prioritizes:

| # | Spike | Wave | Block | Effort | Owner |
|---|---|---|---|---|---|
| **M1** | `expo-notification-observer` Expo Module + heartbeat (3 OEMs) | 1 | Phase 1 launch | 5-7d | Mobile lead |
| **M2** | `expo-sensory-signature` Expo Module + sync-drift bench | 1 | Phase 1 launch | 5d | Mobile lead |
| **M3** | Whisper-tiny burst rate on Redmi Note 12 (real device) | 1 | Phase 1 launch | 3d | Mobile lead |
| **M4** | PowerSync cost compare + RLS interaction | 1 | Phase 1 sprint week 1 | 2d (spike call + math) | Architect |
| **M5** | Play Store Internal Testing policy declaration | 1 | Phase 1 launch | 2-3w wall-clock | Submitter |
| 1 | `payment-notif-corpus-my.ts` (9 providers, 500+ samples) | 1 | Phase 1 launch | external (5 merchants × 30d) | Phase 0 ID |
| 4 | `opus-decode-latency.ts` (RN-side, redo with `react-native-audio-api`) | 1 | Phase 1 launch | 1d | Mobile |
| 6 | `payment-notif-corpus-id.ts` (12 providers, 1000+ samples) | 2 | Wave 2 | external | — |
| 7 | `sahabat-ai-bandung-bench.ts` (200 utterances) | 2 | Wave 2 | 1w + bench data | — |
| 8 | `id-self-reference-disambig.ts` | 2 | Wave 2 | 1w | — |
| 9 | `id-currency-locale-fence.ts` | 2 | Wave 2 | 1w | — |
| 10 | `myinvois-spike.ts` (existing) | 1+ | Pro tier | done? verify | — |
| 11 | `billplz-spike.ts` (existing) | 1+ | Pro tier | done? verify | — |
| 12 | `wa-share-target-onboarding.ts` (coach-mark trigger) | 1 | Phase 1 launch | 2d | Mobile |
| ~~2 (web)~~ | ~~`whisper-burst-rate.ts` (LLM 8 calls / 5s)~~ | replaced by M3 | — | — | — |
| ~~3 (web)~~ | ~~`notification-listener-heartbeat.ts`~~ | replaced by M1 | — | — | — |
| ~~5 (web)~~ | ~~`live-activity-rush-mode.ts`~~ | deferred to Wave 2 Pro | — | — | — |

**New spike total:** 5 mobile-specific (M1-M5) + 7 carry-forward = 12 spikes blocking Phase 1 / Wave 2 / Pro tier launches respectively.

**Critical path Phase 1 launch:**
1. M1 (NotifListener Expo Module) — 5-7d
2. M3 (Whisper Redmi Note 12) — 3d in parallel with M1
3. M2 (sensory signature) — 5d after M1 lands
4. M5 (Play Store policy) — 2-3w wall-clock, **starts week 1**
5. M4 (PowerSync decision) — 2d, starts week 1

Total wall-clock for spikes: ~3 weeks (M1-M3 in parallel; M5 in background).

---

## 7. Risk register

| Risk | P × I | Mitigation |
|---|---|---|
| Play Store rejects NotifListener | 30% × HIGH | M5 spike + manual-share fallback per cycle 28 §12 |
| Whisper-tiny too slow on Redmi Note 12 | 50% × MED | M3 spike + cloud STT fallback w/ merchant consent |
| Sensory signature drift >50ms on budget Android | 40% × LOW | M2 spike + downgrade to "felt" not "synced" on budget devices |
| PowerSync cost > RM 5/merchant/month | 30% × MED | manual IDB queue per cycle 28 §1.4 |
| MIUI/ColorOS battery-saver kills NotifListener silently | 60% × MED | Heartbeat (cycle 28 §12) + per-OEM coach-mark + foreground service |
| Apple App Review rejects voice-as-primary input | 10% × MED | Microphone + Speech Recognition usage strings; precedent says safe |
| Expo SDK 55 breaking changes mid-Wave-1 | 15% × LOW | Pin SDK 54 for Wave 1; upgrade post-launch |
| Custom Expo Modules become maintenance burden | 25% × LOW | Keep modules thin (~200 LOC each); integration tests |

---

## 8. Score (vs cycle 21-30 architecture fit)

| Dimension | Score |
|---|---|
| Implements all 6 capture paths from cycle 28 §4 | 10 |
| Implements 9-phase workflow A-I | 10 |
| Sensory signature feasibility | 8 (drift TBD on budget Android) |
| Offline-first feasibility | 9 (PowerSync TBD) |
| iOS magic parity (Wave 2 Pro Live Activities) | 9 |
| TS code reuse (web codebase) | 8 (~50% reuse) |
| Wave 1 8wk timeline | 8 (with 5 spikes parallelized) |
| Long-term maintenance | 9 |
| **Average** | **8.9** |

Cycle 33 RED_TEAM must validate this score holds under hostile review.

---

## 9. What gates Wave 1 launch

Phase 1 cannot ship until **all 5 caveats resolved + 5 mobile spikes pass + 7 cross-cutting Phase 0 items**.

Concretely, Wave 1 sprint week 1 is blocked unless:
- M4 PowerSync decision documented
- M5 Play Store Internal Testing submitted

Wave 1 sprint week 4 is blocked unless:
- M1 NotifListener Expo Module functional on 3 OEMs
- M2 Sensory signature drift measured + handled
- M3 Whisper Redmi Note 12 latency measured + handled

Wave 1 launch criteria from bible v1.2 (Sean Ellis ≥40%, DAU ≥70%, NPS ≥8, ≥1 spontaneous referral, ≥3hr/week craft saved) still apply.

---

## Status

- ✅ Stack A locked (Expo + RN managed)
- ✅ Library picks pinned (28 libraries, 2 custom Expo Modules)
- ✅ Architecture cycle-28 boundary contract → RN implementation map (12 sections × 6 paths × 9 phases)
- ✅ 5 caveats → resolution paths documented
- ✅ Monorepo structure proposed (4 apps + 6 packages)
- ✅ Phase 0 spike re-prioritization (5 new mobile spikes added)
- ✅ Risk register (8 risks × P × I × mitigation)
- ✅ Score 8.9/10 vs architecture fit

**Cycle 33 must red-team this with 4 personas: Senior Mobile Architect, iOS Indie Dev, Android Platform Engineer, Performance/Reliability Engineer.**
