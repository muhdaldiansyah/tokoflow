# Cycle 036 — CatatOrder Implementation Deep Dive

> Chain-of-thought analysis: implementing cycles 21-35 in `catatorder-app` (mobile) + `catatorder-web` (backend). Both are LIVE production codebases; this is **migration**, not greenfield.
>
> **Mode:** ANALYSIS (no code yet). Output: file-level gap map + 9-phase migration plan + 5 critical decisions for user lock-in.

---

## 1. Codebase inventory (what exists today)

### `catatorder-web` — Backend (LIVE v4.6.0)

| Aspect | State |
|---|---|
| Stack | Next.js 16 + React 19 + Supabase + Tailwind CSS 4 + TypeScript |
| Domain | catatorder.id (live, paying users) |
| Supabase | `eafccoajzmanyflfidlg` (Mumbai region — should migrate Singapore) |
| Migrations | 77 applied (000-076) |
| API routes | ~60 (`app/api/*` — orders, products, customers, invoices, voice/parse, image/parse, etc.) |
| AI integration | **Gemini 3.1 Flash Lite via OpenRouter** — ✅ matches cycle 25 stack picks |
| Voice util | `lib/voice/parse-transcript.ts` + `lib/voice/speech-recognition.ts` (web Speech API only) |
| Cron jobs | `morning-brief`, `engagement`, `alerts`, `invoice-overdue`, `tax-reminder` (5 of 5 from cycle 30) |
| Offline | `lib/offline/{db,sync,useOnlineStatus}.ts` (web side) |
| Pricing | 50 free/month + Isi Ulang + Unlimited + Bisnis tiers |

### `catatorder-app` — Mobile (LIVE v1.0.0 Play Store)

| Aspect | State |
|---|---|
| Stack | **Expo SDK 52 + RN 0.76.9 + TypeScript + NativeWind + TanStack Query** |
| EAS | linked (`c4084636-...`); Google Play Console ID `8554363137282889496` |
| Files | 70+, 27 screens + 3 modals |
| Bottom tabs | Pesanan / Produk / Pelanggan / Rekap / Akun (5 tabs, folder-shaped) |
| API hooks | 12 (`src/api/*` — orders, products, customers, invoices, recap, **ai-parse**, lookup, communities, profile, reminders, tax) |
| AI capture | `PasteOrderSheet` (text/WA paste) + `VoiceOrderSheet` (**STUBBED** — `@react-native-voice/voice` not installed) + `PhotoOrderSheet` (image OCR) |
| Auth | Supabase SDK + SecureStore + token cache |
| Push | `expo-notifications` + Expo Push Service (no Firebase) |
| Offline | AsyncStorage FIFO + idempotency + 30s lock |
| Haptics | `expo-haptics` (basic) |

### Tokoflow Web (sibling, /Users/muhamadaldiansyah/base/tokoflow)

| Aspect | State |
|---|---|
| Stack | Same as catatorder-web; forked + MY localized |
| Status | Pre-launch; gated on Phase 0 validation |
| Mobile | None yet |

---

## 2. Alignment audit — cycles 21-35 vs current catatorder

### What's already aligned (no work needed)

| Cycle ref | Architecture requirement | Current state |
|---|---|---|
| §32 Stack A | RN + Expo + TypeScript | ✅ Expo 52 + RN 0.76.9 + TS — minor SDK bump only |
| §25 Phase C LLM extract | Gemini Flash Lite via OpenRouter | ✅ `app/api/voice/parse/route.ts` lines 100-110 |
| §25 prompt template ID | Bahasa parsing + honorifics | ✅ `lib/voice/parse-transcript.ts` + ai-parse fallback handles Bu/Pak/Mbak/Mas/Kak |
| §28 §9 honorific-strip | Customer name normalization | ✅ Partial in `src/api/ai-parse.ts` lines 191-194 |
| §1.12 refuse list #1 (no auto-DM) | WA reply manual | ✅ WAPreviewSheet + `openWhatsApp()` |
| §1.12 refuse list #5 (no photo regen) | Photo extract only | ✅ /api/image/parse extracts text only |
| §1.12 refuse list #6 (data export) | Customer data exportable | ✅ /api/orders + recap export endpoints |
| §1.12 refuse list #8 (no streaks) | Anti-anxiety | ⚠️ Partial — has quota tiers 40/48/50; needs simplification |
| §1.12 refuse list #9 (no data sale) | RLS isolation | ✅ Supabase RLS audited 76/63 |
| §32 capture path 2 (text) | Paste WA chat | ✅ `PasteOrderSheet` |
| §32 capture path 3 (image) | Camera/photo OCR | ✅ `PhotoOrderSheet` + /api/image/parse |
| §28 §1.4 offline-first FIFO | Queue + sync | ✅ `src/offline/` AsyncStorage + idempotency |
| §30 cron 5/5 | morning-brief, engagement, alerts, invoice, tax | ✅ All 5 in `app/api/cron/` |
| §32 Hermes default | New Architecture | ⚠️ SDK 52 has Fabric opt-in; SDK 54+ default |
| §28 §1.11 quiet hours | Push suppress | ✅ `profiles.quiet_hours_start/end` + edge function |
| §32 community features | Group buy + benchmarks | ✅ Already shipped (cycle 30 deferred) |

**Estimate: ~40% of cycles 21-35 already aligned in catatorder.**

### What's missing or needs upgrade

#### Schema (cycle 28 §2 — diary_entries super-table)

| Item | Current | Target | File |
|---|---|---|---|
| `diary_entries` super-table | ❌ Missing | Migration 077 | `supabase/migrations/077_diary_entries.sql` |
| `payment_events` table | ❌ Missing | Migration 078 (or rolled into diary_entries per cycle 28 §1) | `supabase/migrations/078_*.sql` |
| Materialized views (orders, customers, payments) | ❌ Missing | Migration 079 | `supabase/migrations/079_materialized_views.sql` |
| Backfill from existing tables | ❌ Missing | Migration 080 | `supabase/migrations/080_diary_backfill.sql` |
| Composite confidence GENERATED column | ❌ Missing | Part of 077 | — |

**Decision A1:** Schema migration approach — **incremental coexist** (recommended) means writes go to BOTH old tables AND `diary_entries` for 30-60 days; materialized views read from `diary_entries`; eventually deprecate old write paths in migration 082.

#### Voice STT pipeline (cycle 25 §B + cycle 34 D2)

| Item | Current | Target | Note |
|---|---|---|---|
| STT library | `@react-native-voice/voice` **STUBBED** (try/catch require, package not in `package.json`) | Either install OR pivot to `whisper.rn` | `src/components/VoiceOrderSheet.tsx:14-27` |
| On-device Whisper | None | `whisper.rn` flagship-only? | Cycle 34 D2 |
| Cloud STT fallback | None | OpenRouter Gemini speech | New endpoint `/api/voice/transcribe` |
| Optimistic transcript chip | None | "aku denger..." 3-7s | UX layer |
| Detect-slow flow | None | `BatteryManager` + benchmark | Cycle 34 §5 cloud-STT-default |

**Decision A2:** Voice STT picker. Two viable paths:

| Path | Pros | Cons |
|---|---|---|
| **A2-α — `@react-native-voice/voice` (native Apple Speech / Google SpeechRecognizer)** | Free; excellent Indonesian; no model bundle (zero AAB size impact); fast (~1-3s for 30s clip); already scaffolded in `VoiceOrderSheet` | Audio routes through Apple/Google servers (with user permission); refuse-list "data sale" not violated but slightly weaker privacy story |
| **A2-β — `whisper.rn` + Mesolitica fine-tune + cloud STT fallback** | Privacy-pure on-device for flagship; matches Tokoflow MY plan | 39MB bundle inflation; slower on Snapdragon 685 (60-120s — cycle 33 finding); requires cloud STT anyway for budget Android (cycle 34 D2) |

**My recommendation:** **A2-α for CatatOrder ID.** Reasons: (1) catatorder-app is RN production with v1.0.0 users — keeping APK lean matters; (2) Apple Speech / Google SpeechRecognizer treat Indonesian as first-class language with on-device modes (Android 13+ supports `EXTRA_PREFER_OFFLINE` for fully on-device transcription); (3) catatorder bible v4.6 + ID privacy norms permit Apple/Google host-based STT under "with merchant consent"; (4) existing `VoiceOrderSheet` scaffolding lifts directly. Cycle 34 D2's whisper.rn + cloud was Tokoflow-MY-specific; adapt for ID by using native Speech as primary + OpenRouter cloud fallback when permission denied.

#### Sensory signature (cycle 28 §1.5 + cycle 35 §6)

| Item | Current | Target | File to add |
|---|---|---|---|
| Decay envelope (5-min rolling window) | ❌ Missing | 1st full / 2nd shortened / 3rd silent / batch summary | `src/lib/sensory/window.ts` (Zustand store) |
| First-of-day rule | ❌ Missing | First entry after 06:00 WIB always full | `src/lib/sensory/window.ts` |
| 3-modality orchestration | ❌ Partial — basic haptics exists | visual arc + audio chime + Core Haptics synced | `src/lib/sensory/fire.ts` |
| `MIN_HAPTIC_GAP_MS = 250` | ❌ Missing | Burst-merge prevention | inside `fire.ts` |
| Reduce Motion role | ❌ Missing | iOS/Android accessibility detection | inside `fire.ts` |
| Audio chime asset | ❌ Missing | preloaded chime | `assets/audio/chime.mp3` |
| Drift telemetry | ❌ Missing | Sentry breadcrumb | needs Sentry integration |

#### Confidence routing (cycle 25 §D + cycle 28 §1.2)

| Item | Current | Target | File |
|---|---|---|---|
| Per-field confidence in /api/voice/parse response | ❌ Returns items only | Add `confidence_per_field` to JSON | `app/api/voice/parse/route.ts` line 79 prompt + line 130 mapper |
| `composite_confidence = min(extract, match)` | ❌ Missing | New service-layer fn | `src/api/diary-confidence.ts` (NEW) |
| 🟢🟡🔴 chip component | ❌ Missing | New component | `src/components/ConfidenceChip.tsx` |
| 5s peek for similar-names trap | ❌ Missing | Extend yellow chip | inside chip + Now pin |
| Money-bearing 0.92 threshold | ❌ Currently no threshold | Threshold gate at /api/diary write | service layer |
| Self-reference disambig | ❌ Missing | Hardcoded force-yellow | LLM prompt + post-processing |
| Locale-fence (Rp vs RM) | ❌ Not needed for ID | N/A | — |

#### UX surface (cycle 21/22)

**This is the biggest UX decision.** Current = 5 bottom tabs; target = adaptive-zoom feed + Now pin + Lock Screen widget.

**Decision A3:** UX migration approach.

| Approach | Description | Risk | Time |
|---|---|---|---|
| **A3-α — In-place rewrite** | Replace 5 tabs with adaptive feed; force migrate users | HIGH (v1.0.0 users retrained; churn risk) | 3-4 wk |
| **A3-β — New "Cerita" tab as 6th** | Add adaptive-zoom feed as new tab; existing 5 stay; "Cerita" becomes default in fresh installs only | LOW (additive, opt-in) | 2-3 wk |
| **A3-γ — Settings feature flag** | Toggle "experimental diary view" in Settings → replaces Pesanan tab when enabled | MED (toggle complexity, dual UI maintenance) | 3-4 wk |

**My recommendation:** **A3-β** — add "Cerita" as new primary tab. Existing users see it appear with onboarding tooltip; new installs default to "Cerita". This honors cycle 28 §3 information hierarchy without breaking existing v1.0.0 muscle memory. After 60-90 days of stable usage, evaluate cycle 28 §3 mandate "no top-bar, feed starts at status bar" — then in-place migrate the remaining tabs.

#### Payment capture paths (cycle 24 / 30 §4)

| Path | Current | Target | Library |
|---|---|---|---|
| 1. Cash voice | ⚠️ Stubbed (VoiceOrderSheet) | Wire STT (per A2 decision) | `@react-native-voice/voice` OR `whisper.rn` |
| 2. Text | ✅ DONE (PasteOrderSheet) | — | — |
| 3. Image (camera) | ✅ DONE (PhotoOrderSheet) | — | — |
| 4. WA screenshot share | ⚠️ Photo picker only | iOS Share Extension + Android Share Intent | `expo-share-extension` (MaxAst) |
| 5. Forwarded WA voice (`.opus`) | ❌ Not done | Same Share infra + audio decode | `expo-share-extension` + `react-native-audio-api` |
| 6. NotificationListener auto-claim | ❌ Wave 1.1 | Custom `expo-notification-observer` Expo Module | Wave 1.1 only — gated on Play Store policy |

#### Boundary contract enforcement (cycle 28)

| Rule | Current | Target | Enforce via |
|---|---|---|---|
| §1.1 — 3 gestures only | ❌ Tab + buttons + swipes mixed | Tap / long-press / share | `Pressable` + ESLint custom rule |
| §1.2 — `min()` confidence | ❌ Missing | Composite | `src/api/diary-confidence.ts` |
| §1.3 — 0.92 money threshold | ❌ Missing | Server enforce | /api/diary write |
| §1.5 — Sensory decay | ❌ Missing | Implement | `src/lib/sensory/` (above) |
| §1.6 — Vocab lint (32 strings) | ⚠️ NOT enforced; "tier" or "extract" might leak | ESLint rule | `apps/mobile/.eslintrc.js` |
| §1.6 — Reanimated mandate | ⚠️ NOT enforced; current uses RN `Animated` (e.g., `(tabs)/index.tsx` line 2) | Reanimated 3 only | ESLint rule |
| §1.9 — Toddler protection | ❌ Missing | 200ms sustain + biometric option | Settings + Pressable config |
| §1.12 — Refuse list quota fix | ⚠️ 40/48/50 nudges exist | Reduce to none/exhausted | `src/utils/quota.ts` (rewrite) |

#### Mobile platform upgrades (cycle 32-34)

| Library | Current | Target | Why |
|---|---|---|---|
| expo SDK | 52 | **54+** (or 55 by Wave 1) | New Arch default; precompiled XCFrameworks |
| react-native | 0.76.9 | **0.81+** | New Arch + Bridgeless |
| react-native-reanimated | 3.16.0 | ✅ aligned | — |
| react-native-paper | 5.15.0 | ✅ kept (cycles didn't mandate dropping) | — |
| @shopify/flash-list | ❌ Not installed | **v2** | Cycle 32-34 mandate for diary feed |
| drizzle-orm | ❌ Not installed | **latest** | reusable schema cycle 34 §3 |
| expo-sqlite/next | ❌ Not installed | **SDK 54+** | local cache for diary_entries |
| expo-audio | ❌ Not installed (uses none) | **SDK 54+** | replaces deprecated expo-av |
| react-native-audio-api | ❌ Not installed | **latest** | opus decode Path 5 |
| @sentry/react-native | ❌ Not installed | **latest** | crash + cold-start telemetry |
| expo-share-extension (MaxAst) | ❌ Not installed | **latest** | iOS Path 4 + 5 |
| @bacons/apple-targets | ❌ Not installed | **latest** | iOS Lock Screen widget |
| @notifee/react-native | ❌ Not installed | **9.x** | foreground service Wave 1.1 |
| @react-native-voice/voice | ❌ Stubbed (try/catch require) | **install** (A2-α) | Path 1 STT |
| Custom `expo-notification-observer` | ❌ Wave 1.1 | Wave 1.1 only | post Play Store clearance |
| Custom `expo-sensory-signature` | ❌ Cycle 34 D3 deferred | NOT needed Wave 1 | JS orchestration |

#### Cron job additions (cycle 30 §1.5 cron table)

Current vs target:

| Job | Current | Target additions |
|---|---|---|
| `morning-brief` | ✅ Today's orders + cost trend | + **Hari Sepi variant** (today revenue <30% of 7-day avg, with >Rp 50K/day baseline) |
| `engagement` | ✅ death valley + milestones + monthly review | + **Anniversary** (1y/3y/5y) + **Customer Returns** (3+ orders, drip-deduped) + **Pre-Ramadan** (14d before, hard-coded 2027-2030) |
| `alerts` | ✅ stock + capacity + quota | Simplify quota nudge to single trigger at exhausted (anti-anxiety per §1.12 refuse #8) |
| `invoice-overdue` | ✅ unchanged | — |
| `tax-reminder` | ✅ unchanged | — |

---

## 3. The 5 critical decisions (must lock before code)

### D-A1 — Schema migration approach

**Choice:** incremental coexist (writes to BOTH old + diary_entries) vs big-bang replace.

**Recommendation:** **incremental coexist for 30-60 days**. Existing v1.0.0 users keep working; materialized views unify reads; eventual deprecation when telemetry confirms 100% writes flow through diary_entries.

### D-A2 — Voice STT picker

**Choice:** `@react-native-voice/voice` (Apple/Google host) vs `whisper.rn` + cloud.

**Recommendation:** **`@react-native-voice/voice`** for CatatOrder ID. Lean APK, free, fast Indonesian. Cycle 34 D2 (whisper.rn) was Tokoflow-MY-specific; adapt for ID.

### D-A3 — UX migration approach

**Choice:** in-place rewrite vs new "Cerita" tab vs feature flag.

**Recommendation:** **new "Cerita" tab as 6th**. Additive, opt-in for v1.0.0 users, default for new installs. Migrate to "no top-bar feed-only" cycle 28 §3 mandate after 60-90d stable.

### D-A4 — Refuse-list quota nudge fix

**Choice:** keep 40/48/50 tiers (current) vs simplify to none/exhausted (bible v1.2 mandate).

**Recommendation:** **simplify to none/exhausted**. Anti-anxiety per cycles 22 + 28. Existing 40/48 banners removed in `src/components/QuotaBanner.tsx` (or wherever).

### D-A5 — Wave 1 strategy

**Choice:** (a) Wave 1 = CatatOrder ID exclusively (skip Tokoflow MY for now); (b) Wave 1 = both (parallel); (c) Wave 1 = Tokoflow MY first (original plan), CatatOrder gets Wave 2 as planned.

**Recommendation:** **(a) — Wave 1 = CatatOrder ID exclusively** since user said "implement in catatorder-app first". Tokoflow MY becomes Wave 2 fork (`EXPO_PUBLIC_BRAND=tokoflow`) once CatatOrder cycles validate the architecture. This **inverts** cycle 34 D8 — same end state, opposite order. Bible v1.2 stays valid (regional MY+ID positioning); only build sequencing changes.

---

## 4. 9-phase migration plan with file-level specifics

> Total estimated effort: 12-16 weeks for Wave 1 + 4-8 weeks for Wave 1.1 (NotifListener post Play Store clearance).

### Phase A — Backend schema foundation (1-2 wk)

**Files to create:**

```
catatorder-web/supabase/migrations/
├── 077_diary_entries.sql           # super-table per cycle 28 §2
├── 078_diary_indices.sql           # idx_diary_user_created etc
├── 079_materialized_views.sql      # orders, customers, payments derived
└── 080_diary_backfill.sql          # backfill from existing tables
```

**Files to modify:**

```
catatorder-web/app/api/voice/parse/route.ts
  → add `confidence_per_field` + `composite_confidence` to response (cycle 25 §C)
  → add `language_detected` field
  → write to diary_entries (alongside existing /api/orders write path)

catatorder-web/app/api/image/parse/route.ts
  → same confidence fields

catatorder-web/app/api/orders/route.ts
  → on order INSERT, also write a diary_entries row (incremental coexist)

catatorder-web/lib/services/diary.service.ts (NEW)
  → CRUD for diary_entries
  → computeCompositeConfidence(extract, match) = Math.min(...)

catatorder-web/app/api/diary/entries/route.ts (NEW)
  → POST /api/diary/entries — direct create
  → GET /api/diary/entries?since=... — feed query

catatorder-web/app/api/diary/reconcile/route.ts (NEW)
  → POST /api/diary/reconcile — second-pass match (cycle 28 §3)
  → cron-triggered every 60s + on-extract-finish hook
```

**Pass criteria:**
- All 4 migrations applied to staging Supabase
- Existing /api/orders, /api/customers, /api/products endpoints unchanged in behavior
- New /api/diary/entries endpoint returns last 50 entries for authenticated user
- Backfill: existing orders/customers/payments visible as diary_entries via materialized views
- Round-trip test: insert order → diary_entries row appears → materialized view updates → /api/orders/[id] still returns same shape

### Phase B — Mobile schema bridge (1 wk)

**Files to create:**

```
catatorder-app/src/db/                   (NEW)
├── schema.ts                            # Drizzle schema mirror of diary_entries
├── client.ts                            # expo-sqlite + Drizzle client
└── migrations/                          # local SQLite migrations
    └── 0001_initial.sql

catatorder-app/src/api/diary.ts          (NEW)
  → useDiaryEntries() — local SQLite + Supabase sync
  → useDiaryEntry(id)
  → useCreateDiaryEntry()
  → useReconcileDiary()
```

**Files to modify:**

```
catatorder-app/package.json
  + drizzle-orm
  + expo-sqlite
  + drizzle-kit (dev)

catatorder-app/src/api/orders.ts
  → useCreateOrder() now calls /api/diary/entries instead of /api/orders
  → useOrders() reads from /api/orders (unchanged — materialized view)
```

**Pass criteria:**
- Drizzle schema compiles + Metro bundles
- Round-trip: create order on mobile → /api/diary/entries → materialized view → useOrders() returns it
- Existing v1.0.0 users see no behavior change

### Phase C — Voice path 1 wired (1-2 wk)

**Decision A2 needed first.** Assuming A2-α (@react-native-voice/voice native):

**Files to modify:**

```
catatorder-app/package.json
  + @react-native-voice/voice (already require'd, just install)

catatorder-app/src/components/VoiceOrderSheet.tsx
  → Remove try/catch require; import directly
  → Update onSpeechResults to write to diary_entries via useCreateDiaryEntry
  → Add optimistic transcript chip "aku denger..."
  → Add confidence chip after parse

catatorder-app/src/components/ConfidenceChip.tsx (NEW)
  → 🟢🟡🔴 with non-color glyph (✓/?/⚠) for high-contrast accessibility
  → 2s peek default; 5s for similar-names trap

catatorder-app/app.json
  + iOS: NSMicrophoneUsageDescription, NSSpeechRecognitionUsageDescription
  + Android: RECORD_AUDIO permission
```

**Pass criteria:**
- VoiceOrderSheet works end-to-end on iOS + Android
- Indonesian transcription passes 50-utterance manual test
- Confidence chip surfaces 🟡 or 🔴 when LLM extract uncertain
- Voice → diary_entries → materialized view → existing orders list

### Phase D — Sensory signature (1 wk)

**Files to create:**

```
catatorder-app/src/lib/sensory/         (NEW)
├── window.ts                           # Zustand 5-min rolling window
├── fire.ts                             # 3-modality orchestration
├── decay.ts                            # determineRole logic
└── reduce-motion.ts                    # accessibility detection

catatorder-app/assets/audio/chime.mp3   (NEW — short 256ms chime)
```

**Files to modify:**

```
catatorder-app/src/api/diary.ts
  → on success of useCreateDiaryEntry, fire signature

catatorder-app/src/components/VoiceOrderSheet.tsx (and PasteOrderSheet, PhotoOrderSheet)
  → fire signature on success
```

**Pass criteria:**
- Decay envelope: 1st full / 2nd shortened / 3rd silent — measurable
- First-of-day full ceremony: works
- MIN_HAPTIC_GAP_MS=250 prevents burst-merging
- Reduce Motion accessibility honored
- Drift bench: <80ms on Redmi Note 12 acceptable; <50ms on iPhone 12+

### Phase E — Now pin + adaptive feed (2-3 wk)

**Decision A3 needed first.** Assuming A3-β (new "Cerita" tab):

**Files to create:**

```
catatorder-app/app/(tabs)/cerita.tsx    (NEW — adaptive feed + Now pin)
catatorder-app/src/components/feed/     (NEW)
├── DiaryFeed.tsx                       # FlashList v2 main feed
├── NowPin.tsx                          # sticky pending claim cards + in-flight transcripts
├── DiaryEntry.tsx                      # individual row
├── FilterChips.tsx                     # All/Orders/Payments/Customers
└── TimeSection.tsx                     # Now/Hari ini/Lebih lama collapsible
```

**Files to modify:**

```
catatorder-app/app/(tabs)/_layout.tsx
  → add 6th tab "Cerita" with first-launch onboarding tooltip
  → for fresh installs (no localStorage flag): "Cerita" becomes initial route
  → for existing v1.0.0 users: keep "index" (Pesanan) as initial; add tooltip

catatorder-app/package.json
  + @shopify/flash-list (v2)
```

**Pass criteria:**
- "Cerita" tab renders feed with Now pin + filter chips + sections
- Tap on Now-pin entry: inline action (claim/mark-paid)
- Long-press: edit
- Existing 5 tabs unchanged
- 60fps scroll on Redmi Note 12 with 200 entries

### Phase F — Payment paths 4+5 (2-3 wk)

**Files to create:**

```
catatorder-app/ios/CatatOrderShareExtension/    (NEW Xcode target)
├── ShareViewController.swift                    # SwiftUI native UI
├── Info.plist                                   # NSExtensionAttributes for image + audio MIME
└── tokoflow.entitlements                        # App Group

catatorder-app/android/app/src/main/AndroidManifest.xml
  → add intent-filter for image/* and audio/ogg, audio/opus

catatorder-app/src/api/share-handler.ts          (NEW)
  → receives shared URL from Share Extension
  → routes to /api/image/parse or audio decode pipeline

catatorder-web/app/api/payment/observe/route.ts  (NEW)
  → POST receives parsed payment event from mobile
  → runs reconciliation engine per cycle 28 §1.4
  → returns matched_order_id or pending_match status
```

**Files to modify:**

```
catatorder-app/package.json
  + expo-share-extension (MaxAst)
  + react-native-audio-api

catatorder-app/app.json
  + plugins: expo-share-extension config
  + iOS: App Group entitlement
```

**Pass criteria:**
- Long-press WA screenshot → Share → CatatOrder → image OCR → diary_entries
- Long-press WA voice note → Share → CatatOrder → opus decode → STT → diary_entries
- Reconciliation engine matches payment to order with composite ≥ 0.92 → auto-link
- < 0.92 → claim card on Now pin

### Phase G — Boundary contract enforcement (1 wk)

**Files to create:**

```
catatorder-app/.eslintrc.js              (UPDATE)
  → no-restricted-syntax rule for vocab lint (32 strings adapted to Bahasa)
  → no-restricted-imports rule banning RN's Animated (Reanimated mandate)

catatorder-app/src/utils/sentry.ts       (NEW)
  → Sentry init with PII scrub beforeSend
  → Session Replay disabled

catatorder-app/src/utils/quota.ts        (REWRITE)
  → simplify getNudgeLevel to "none" | "exhausted" only
  → remove 40/48 tiers
```

**Files to modify:**

```
catatorder-app/src/components/QuotaBanner.tsx
  → render only at "exhausted"
  → remove approaching/urgent variants

catatorder-web/lib/copy/  (already exists in lib? if not, create)
  → ensure all user-facing strings centralized
```

**Pass criteria:**
- ESLint passes with no vocab violations
- ESLint blocks PR adding RN `Animated` import
- Sentry config doesn't ship customer data
- Quota nudge surfaces only at 50/50 exhausted

### Phase H — Cron job additions (1 wk)

**Files to modify:**

```
catatorder-web/app/api/cron/morning-brief/route.ts
  → add Hari Sepi variant: today_revenue < 0.3 * avg_7d AND avg_7d > 50000

catatorder-web/app/api/cron/engagement/route.ts
  → add Anniversary trigger (1y/3y/5y from profile created_at)
  → add Customer Returns trigger (customer.total_orders >= 3, drip-deduped)
  → add Pre-Ramadan trigger (14d before hard-coded dates)

catatorder-web/lib/copy/empathy-moments.ts (NEW)
  → centralized empathy templates per cycle 28 §G + bible v1.2
```

**Pass criteria:**
- 5 alpha merchants receive Hari Sepi push when revenue dips
- Anniversary push fires on profile anniversary date
- Customer Returns push fires once per customer per 30d (drip)
- Pre-Ramadan push fires 14d before Ramadan 2027 date

### Phase I — Wave 1.1 NotificationListener (4-8 wk post-launch, gated)

**Files to create:**

```
catatorder-app/modules/expo-notification-observer/
├── android/src/main/java/.../NotificationObserverService.kt
├── android/src/main/java/.../NotificationObserverModule.kt
├── android/src/main/AndroidManifest.xml additions
├── src/index.ts                        # JS API
└── expo-module.config.json

catatorder-app/src/lib/heartbeat.ts     (NEW)
  → tiered: 24h F-tier / 72h Samsung / 7d Pixel
  → BatteryManager + thermal API

catatorder-app/src/utils/oem-detect.ts  (NEW)
  → Build.MANUFACTURER mapping
  → per-OEM coach-mark deeplink Intent
```

**Pass criteria (Wave 1.1 launch gate):**
- Module functional on MIUI + ColorOS + OneUI
- Play Store policy declaration approved (4-8wk wall-clock)
- Heartbeat detects revocation within tier interval
- Coach-mark deeplinks per OEM work

---

## 5. Migration sequencing — recommended Wave 1 timeline

```
Week 1-2:  Phase A backend schema (077-080 migrations + /api/diary/* endpoints)
Week 3:    Phase B mobile schema bridge (Drizzle + expo-sqlite + diary.ts)
Week 4-5:  Phase C voice path 1 wired (@react-native-voice/voice install + chip)
Week 6:    Phase D sensory signature (decay envelope + 3-modality)
Week 7-8:  Phase G boundary contract (ESLint + Sentry + quota fix) + Phase H cron additions
Week 9-11: Phase E Now pin + adaptive feed (Cerita tab)
Week 12-13:Phase F payment paths 4+5 (Share Extension + audio decode + reconciliation)
Week 14:   Integration testing + alpha cohort onboarding
Week 15-16:Wave 1 Phase 1 Gate validation (Sean Ellis, DAU, NPS, referrals)

Wave 1.1 — post-launch parallel:
Week 1-8:  Phase I NotifListener Expo Module + Play Store policy declaration
Week 9-13: Wave 1.1 release with Path 6 auto-claim
```

**Cumulative: ~16 weeks for Wave 1, +13 weeks for Wave 1.1 = 29 weeks total** to full architecture parity in catatorder.

---

## 6. Honest risks + open questions

### Risks

| Risk | P × I | Mitigation |
|---|---|---|
| Existing v1.0.0 users churn during migration | 25% × MED | A3-β additive Cerita tab — opt-in not forced |
| Schema migration race during Phase A | 30% × HIGH | Incremental coexist + materialized views |
| @react-native-voice/voice Indonesian accuracy on Bandung dialect | 20% × MED | Phase 0 spike: 50-utterance bench; fallback OpenRouter Gemini speech |
| Play Store rejects "Cerita" interactive widget if fancy | 10% × LOW | Defer fancy widget to Wave 1.1 |
| Phase F Share Extension breaks on iOS 18 | 15% × MED | Use `expo-share-extension` (MaxAst) actively maintained |
| Wave 1.1 Play Store NotifListener policy rejection | 30% × HIGH | Wave 1 ships without it (Path 6 deferred); fallback manual-share OK |
| Sentry PII leak via crash report | 10% × HIGH | beforeSend scrub; Session Replay disabled |
| 16-week Wave 1 timeline slips | 40% × MED | A3-β + Phase A coexist allow shipping per-phase |

### Open questions for user

1. **D-A5 Wave 1 scope**: confirm Wave 1 = CatatOrder ID exclusive (Tokoflow MY becomes Wave 2 brand fork)? Or both parallel?
2. **D-A1 Schema approach**: incremental coexist 30-60d deprecate, or big-bang?
3. **D-A2 Voice STT**: `@react-native-voice/voice` (recommended) or `whisper.rn`?
4. **D-A3 UX migration**: new "Cerita" tab (recommended) or in-place rewrite?
5. **D-A4 Quota refactor**: simplify to none/exhausted (bible v1.2)?
6. **Phase 0 validation gate**: do we run 5+5 Bandung mompreneur interviews before starting code, or skip since CatatOrder already has product-market fit signal (76 migrations + paying users)?
7. **Production data backfill**: existing real merchants — backfill into diary_entries during Phase A (live), or schedule maintenance window?
8. **EAS profiles for brand fork**: prepare `production-tokoflow-*` profiles now or defer until Wave 2?

### What this analysis does NOT settle

- Sentry pricing tier for catatorder Indonesian merchant volume
- Apple App Review reaction to NSSpeechRecognitionUsageDescription if app uses on-device STT
- Whether CatatOrder web `/api/voice/parse` Gemini Flash Lite cost ≤ Rp 5K/merchant/month (per cycle 28 §1.12 refuse list cost-economics implicit ceiling)
- Materialized view refresh strategy: row-trigger CONCURRENTLY vs client-side derived state (perf bench needed)
- Exact behavior when v1.0.0 user has 1000+ existing orders — Phase A backfill memory + time
- Whether Phase E "Cerita" tab default routing for fresh installs requires App Store re-review

---

## 7. Status

- ✅ Codebase inventory complete (web + mobile + sibling tokoflow)
- ✅ Alignment audit (~40% already aligned; 60% gap)
- ✅ File-level gap map per cycle 21-35 requirement
- ✅ 5 critical decisions framed with recommendations
- ✅ 9-phase migration plan with file paths + estimated effort
- ✅ Risk register (8 risks) + open questions (8 items)
- ⏳ User decisions D-A1 through D-A5 needed before Phase A starts
- ⏳ Phase 0 validation gate (open question)

**Pre-condition to start Phase A:** user locks D-A1 + D-A5 minimum. D-A2/A3/A4 can lock per-phase.

**Ready for next cycle:** if user agrees, cycle 037 starts Phase A backend migration code (077_diary_entries.sql + /api/diary/entries endpoint + first round-trip test).
