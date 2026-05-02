# Cycle 033 — RED_TEAM (persona 3 of 4: Android Platform Engineer)

> **Persona:** Android engineer, ~10 years on platform (KitKat → Android 16). Shipped a fintech app that used `NotificationListenerService` to read SMS-replacement bank push messages across MIUI / ColorOS / OneUI / FuntouchOS. Survived three Play Store policy purges (the 2019 SMS/CallLog purge, the 2021 AccessibilityService crackdown, the 2023 NotificationListener "minimum functionality" sweep). Not anti-RN — anti-naive-cross-platform. The Tokoflow target market is mompreneur on Redmi Note 12 / Samsung A14 / Oppo A78 / Vivo Y28 — not the Pixel 8 that the cycle 32 team probably tested on.
>
> **Cycle under review:** [`cycle-032-platform-hypothesize.md`](../architecture/cycle-032-platform-hypothesize.md) — Stack A (Expo + RN managed) lock with custom `expo-notification-observer`, Notifee foreground service, Whisper-tiny on-device, sensory-signature module, Mesolitica weights.
>
> **Defending:** the merchant in Bandung who bought a Redmi Note 12 4GB/128GB at Erafone for IDR 2.4jt, who has never heard of "battery optimization", who lives one push notification away from a churn event because MIUI's Security Center silently swept Tokoflow into the "frozen" bucket while she was sleeping.

---

## TL;DR — the punchline before the long argument

Cycle 32 reads like an iOS-engineer's tour of Android. The Android section is mostly correct in *names* (NotificationListenerService, foreground service, Doze, App Standby, MIUI battery saver) but every single one is glossed at the surface where production reliability lives. Five hard issues:

1. **`onNotificationPosted` arrives on a binder thread that has no JS runtime attached** — the JSI "synchronous from anywhere" assumption from the New Arch sales pitch is wrong here. You will block binder threads or drop notifications. Cycle 32 doesn't say which.
2. **Notifee's foreground service uses type `dataSync` by default**. Android 14+ for `NotificationListenerService`-keepalive use case requires `specialUse`, and Android 15 caps `dataSync` at 6h/24h. **You will be rejected at Play Store policy review under "foreground service type misuse"** with high probability.
3. **MIUI/ColorOS/FuntouchOS combined = ~50% of MY+ID Android market**, and cycle 32's "per-OEM coach-mark from cycle 22" is a one-line handwave. The real reliability ceiling on these OEMs at Day 30 is ~30-50% — not a tunable knob; an ecosystem reality. Cycle 28 §4.6's 7-day heartbeat means the merchant can lose **6 days of silently-revoked auto-claims** before the app even notices.
4. **Whisper-tiny on Snapdragon 685 (Redmi Note 12) at <25s for 30s audio is not realistic**. Cycle 31 Q2d cited "2-4× realtime on budget devices" = 60-120s, then cycle 32 budget magicked it to <25s with no path. The "Qualcomm AI Hub NPU acceleration" rescue is false: SD685 has no exposed Hexagon NPU for apps. Cloud STT fallback isn't optional — it's the **default path for ~50% of Android merchants**.
5. **Play Store NotificationListener policy in 2026 is post-CRED, post-Money-Lover, post-Rocket-Money pivot**. Three years of reviewer training to reject "passive payment observation" use cases. M5's 2-3 week wall-clock is wishful — plan for a 4-8 week back-and-forth, and Wave 1 should not depend on it.

Score floor for Android UX readiness as currently spec'd: **4/10**. With the fixes below: **7/10**.

The ONE thing that should be deferred or shipped only on an OEM allowlist: see §11.

---

## 1. NotificationListenerService — what cycle 32 didn't address

Cycle 32 §4 spike M1 calls it "5-7 day spike — wrap NotificationListenerService + Notifee foreground service". Five days of work to do all of the below correctly is aggressive; here is what's actually in scope.

### 1.1 The lifecycle the cycle didn't write down

`NotificationListenerService` lifecycle on Android 14+ (API 34) is **system-managed, not app-managed**:

- Declared in `AndroidManifest.xml` with `android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"` and `<intent-filter><action android:name="android.service.notification.NotificationListenerService" /></intent-filter>`.
- Bound by `NotificationManagerService` (system) only after the user toggles **Notification Access** for Tokoflow in Settings. Until then, the service does not run.
- Once bound, the system keeps the process alive *unless* it crashes, is force-stopped, or the OEM's battery saver kills it (see §2). The app process does not have to be in the foreground.
- `onListenerConnected()` fires when the binding becomes active; `onListenerDisconnected()` fires when revoked or rebooted.
- `onNotificationPosted(StatusBarNotification)` fires on the system's binder thread inside our process — **not the RN JS thread, not the RN UI thread, not even one of our app's threads in the conventional sense**. Cycle 32 spec of "JSI EventEmitter" must clarify this.

### 1.2 The binder-thread → JS-thread handoff

This is the silent landmine. JSI calls from JS to native are synchronous, but pushing data from native (especially from a binder thread) into the RN JS runtime is **not symmetric** and **not always safe**.

- Correct pattern: in Kotlin, marshal the `StatusBarNotification` to a plain Bundle (extract `packageName`, `postTime`, `notification.extras.getString(EXTRA_TITLE)`, `EXTRA_TEXT`, `EXTRA_BIG_TEXT`, `EXTRA_SUB_TEXT`), then `runOnUiThread { reactContext.getJSModule(RCTDeviceEventEmitter::class.java).emit(...) }`.
- Wrong pattern (which cycle 32's "JSI EventEmitter" hand-wave invites): call into JSI runtime directly from the binder thread. The JS runtime is single-threaded; concurrent access from a binder thread will corrupt heap and crash the process under load (10-20 notifs in 5 seconds, e.g., during a Hari Raya rush).
- Notifee documents this exact pattern: native event → main thread → JS event emitter. Confirm `expo-notification-observer` follows it.
- Backpressure: if JS thread is busy (Whisper inference, Gemini fetch, FlashList scroll), notifications can queue. Spec a bounded ring buffer (last 50 notifications) on the native side; drop oldest if full and emit `notif_dropped` event so we can monitor.

**Action:** Add to M1 scope:
- "Bundle-marshal on binder thread, emit on UI thread" pattern, with explicit mention that JSI cross-thread is forbidden.
- Bounded ring buffer (50 entries, configurable), drop-oldest semantics, emit `notif_dropped_due_to_backpressure` for telemetry.
- Crash test: post 100 notifications in 1 second to a dev build, verify no native crash, no missed notifications under burst (or graceful drop with telemetry).

### 1.3 Permission grant flow — the deeplink intent

Cycle 32 says "permission deeplink to Settings → Notification Access". The actual intent on stock Android:

```kotlin
val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
context.startActivity(intent)
```

Stock Android (Pixel) lands on the consolidated list. **OEM divergence:**

| OEM | Behavior on `ACTION_NOTIFICATION_LISTENER_SETTINGS` |
|---|---|
| Pixel / stock | Opens "Device & app notifications" → list of apps with toggle. Direct. |
| Samsung OneUI 6 | Opens Settings → Notifications → Advanced settings → Device & app notifications. One extra tap. |
| Xiaomi MIUI 14 / HyperOS | Opens "Notification access" but on some HyperOS builds the list is empty until you grant Autostart first — chicken-and-egg. |
| Oppo ColorOS 13 / 14 | Opens Settings → Notification & status bar → Notification access. Works. |
| Vivo FuntouchOS / OriginOS 4 | Documented to silently fail on some OriginOS builds; merchant sees Settings home page, not the access list. |
| Realme RealmeUI 5 (ColorOS fork) | Same as ColorOS most of the time. |

**Action:** Add to M1 scope a per-OEM fallback ladder:
1. Try `Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS`.
2. If `resolveActivity()` returns null (Vivo edge case), try `ComponentName("com.android.settings", "com.android.settings.Settings$NotificationAccessSettingsActivity")`.
3. If still null, fall back to `Settings.ACTION_SETTINGS` and show a coach-mark with screen-shotted directions.

### 1.4 Foreground service type — Notifee's default is wrong for our use case

Android 14 (API 34) mandates `android:foregroundServiceType` on `<service>` in `AndroidManifest.xml` AND in the `startForeground(id, notification, type)` call. Allowed values:

- `dataSync` — generic background sync. Capped at 6h per 24h on Android 15 (API 35).
- `specialUse` — escape hatch. Requires `<property android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE" android:value="..." />`.
- Others (`mediaPlayback`, `location`, `connectedDevice`, `health`, `remoteMessaging`, `phoneCall`, `mediaProjection`, `camera`, `microphone`) — domain-specific.

**Tokoflow's foreground service is keepalive for NotificationListener heartbeat. None of the domain-specific types fit.** It is not `dataSync` (we are not syncing) — using `dataSync` is misuse and risks rejection at Play review. Correct type: `specialUse`.

`AndroidManifest.xml`:
```xml
<service
    android:name=".NotificationObserverForegroundService"
    android:exported="false"
    android:foregroundServiceType="specialUse">
  <property
      android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
      android:value="payment_notification_observer_keepalive" />
</service>
```

And in code:
```kotlin
startForeground(
    NOTIFICATION_ID,
    notification,
    ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
)
```

**Notifee currently defaults the foreground service type to `dataSync`** for its `registerForegroundService()` API. We need to override it via Notifee's `types` param (added in Notifee 7.x for Android 14 compliance) or wrap our own service. Cycle 32 doesn't mention this and will trip on it during M1 day 3.

`AndroidManifest.xml` permission:
```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
<uses-permission android:name="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"
    tools:ignore="ProtectedPermissions" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

`POST_NOTIFICATIONS` is runtime-grant on Android 13+ — separate prompt from notification access. Cycle 32 doesn't mention; needs to be in onboarding.

### 1.5 Play Store policy declaration form for `specialUse`

Per Play Console policy (Aug 2024), apps using `FOREGROUND_SERVICE_SPECIAL_USE` must complete a declaration explaining why none of the other types fit. This form is **separate from the Permissions Declaration** for NotificationListener. M5 spike must include both.

Sample justification (workable, defensible):

> "Tokoflow operates a `NotificationListenerService` that observes payment notifications from Malaysian banking apps (Maybank, CIMB, Public Bank, Hong Leong, RHB, Bank Islam, Touch'n Go, GrabPay, Boost) on behalf of small-business merchants who manually run a single-person F&B operation. The foreground service is required to keep the listener responsive between system-initiated unbinds (battery saver, Doze maintenance windows). It does not transfer media, sync data, communicate with a connected device, or fall under any other defined `foregroundServiceType`. Subtype: `payment_notification_observer_keepalive`."

---

## 2. MIUI / ColorOS / OneUI / FuntouchOS — the 50% of the market cycle 32 skipped

`dontkillmyapp.com` ratings (DontKillMyApp Foundation, maintained continuously since 2018):

| Vendor | Rating | OEM customizations that kill background work |
|---|---|---|
| Google (Pixel) | A | None beyond AOSP Doze + App Standby |
| Sony | A | Stamina mode is opt-in, transparent |
| Samsung (OneUI) | B | "Sleep apps", "Deep sleep apps", "Adaptive battery", "Put unused apps to sleep" toggle on by default |
| Xiaomi (MIUI/HyperOS) | F | Autostart off by default, MIUI Optimization aggressive kill, "Battery saver" tier system, Lock app in Recents required |
| Oppo (ColorOS) | F | "Allow background activity" off by default, "Auto-launch" off by default, App Cleanup auto-kills idle apps |
| Realme (RealmeUI) | F | Same as ColorOS (shared parent) |
| Vivo (FuntouchOS / OriginOS) | F | "High background consumption" requires manual whitelist, iManager inconsistent across builds |
| Huawei (EMUI / HarmonyOS) | F | "Protected apps" list, "Manage manually" required |
| OnePlus (OxygenOS post-2021 = ColorOS) | F | Same as ColorOS post-merge |

**Combined MY+ID market share** (Counterpoint MY 2025 + IDC ID 2025):

| OEM | MY share | ID share | Combined approx |
|---|---|---|---|
| Samsung | 35% | 19% | ~25% (B-tier) |
| Apple | 21% | 8% | ~13% (N/A — iOS) |
| Xiaomi | 18% | 17% | ~17% (F-tier) |
| Oppo | 11% | 21% | ~17% (F-tier) |
| Vivo | 7% | 17% | ~12% (F-tier) |
| Realme | 4% | 6% | ~5% (F-tier) |
| Huawei | 3% | <2% | ~2% (F-tier) |
| Other | ~1% | ~10% | ~5% |

**~50-55% of Tokoflow's combined Android target lives on F-tier battery savers.** This is the structural reality. No amount of foreground-service or specialUse compliance will fix it. The merchant action is the only fix, and merchants do not perform multi-step settings dives spontaneously.

### 2.1 The actual settings paths — to be embedded in onboarding

Cycle 32 says "per-OEM coach-mark from cycle 22 fix #9". Cycle 22 §9 isn't reproduced in cycle 32 so I'll write the canonical version.

**MIUI 14 / HyperOS (Xiaomi, Redmi, POCO):**
1. Settings → Apps → Manage apps → Tokoflow → **Battery saver** → "No restrictions"
2. Settings → Apps → Permissions → **Autostart** → toggle Tokoflow on
3. Recent apps view → long-press Tokoflow card → **lock icon** (Memory protection, prevents swipe-kill)
4. Settings → Notifications → Tokoflow → ensure "Show on lock screen" + "Floating notifications" on (for daily briefing)
5. (Optional, HyperOS only) Settings → Battery → App battery saver → Tokoflow → "No restrictions"

Deeplinks that work on MIUI:
- `Intent("miui.intent.action.APP_PERM_EDITOR")` with `extra_pkgname` — opens Autostart screen on MIUI 11+. **Not officially supported, can break per-build.**
- `ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity")` — same target, fragile. Wrap in try/catch.
- For battery saver: `ComponentName("com.miui.powerkeeper", "com.miui.powerkeeper.ui.HiddenAppsConfigActivity")`.

**ColorOS 13 / 14 (Oppo, Realme, OnePlus):**
1. Settings → Battery → **Power saving** → Tokoflow → "Allow background activity"
2. Settings → Apps → App management → Tokoflow → **Allow Auto-launch**
3. Recent apps → swipe Tokoflow card down → lock icon (prevents swipe-kill)
4. Phone Manager → Privacy permissions → Startup manager → Tokoflow on

ColorOS deeplinks:
- `ComponentName("com.coloros.safecenter", "com.coloros.privacypermissionsentry.PermissionTopActivity")` — opens permission center on ColorOS 11+.
- `ComponentName("com.coloros.safecenter", "com.coloros.safecenter.startupapp.StartupAppListActivity")` — auto-launch list, ColorOS 13.
- `ComponentName("com.oplus.battery", "com.oplus.powermanager.fuelgaue.PowerUsageModelActivity")` — battery management on ColorOS 14.

**OneUI 6 / 7 (Samsung):**
1. Settings → Apps → Tokoflow → Battery → **Unrestricted**
2. Settings → Battery → Background usage limits → **Sleeping apps** → remove Tokoflow from list
3. Settings → Battery → Background usage limits → **Deep sleeping apps** → remove Tokoflow
4. Settings → Battery → More battery settings → **Adaptive battery** → toggle off OR add Tokoflow to "Apps not put to sleep"

OneUI deeplink:
- `Intent("android.settings.APP_BATTERY_USAGE")` with `Uri.parse("package:" + packageName)` — opens Tokoflow's per-app battery page on OneUI 5+. Works.

**FuntouchOS 14 / OriginOS 4 (Vivo):**
1. iManager → App manager → Autostart manager → Tokoflow on
2. Settings → Battery → Background power consumption management → Tokoflow → "Allow high background power consumption"
3. iManager → Privacy permission → Background app refresh → Tokoflow on

Vivo deeplink: **none reliable across OriginOS builds.** Document fallback to manual navigation with screenshots.

### 2.2 Heartbeat cadence — 7 days is too long

Cycle 28 §4.6 sets the heartbeat at every 7d at 04:00 local. Cycle 32 inherits this. **This is wrong for F-tier OEMs.**

Scenario: MIUI's Security Center sweep runs at 03:00 local on idle apps. Tokoflow gets killed. Background bucket drops to RARE the next day. The 7-day heartbeat fires at 04:00 on day 7. By the time the merchant is told "I lost notification access", **she has missed up to 6 full days of payment auto-claims** — every WhatsApp transfer, every DuitNow QR, every Touch'n Go was a manual share or a missed match.

A merchant who relied on this for trust will not stay through a week of silent failure. That's a **churn-by-MIUI** event.

**Action:** Tiered heartbeat:
- **24h** for F-tier OEMs (Xiaomi, Oppo, Vivo, Realme, Huawei). Detect OEM via `Build.MANUFACTURER` at install.
- **72h** for B-tier (Samsung).
- **7d** for A-tier (Pixel, Sony).

Tradeoff: 24h heartbeat means an extra wakelock per day (+ ~1-3 mAh), but the alternative is 6 days of silent failure. Battery cost is acceptable.

Also: don't only fire heartbeat on a schedule. Fire on `onListenerDisconnected()` callback (system tells us we got unbound) and on `BOOT_COMPLETED` (post-reboot we may have lost binding). Cycle 32 doesn't mention either.

### 2.3 Expected reliability ceiling at Day 30

Realistic Day-30 retention of NotificationListener-bound state, by OEM, with optimal coach-marks:

| OEM | Day 30 reliability % (estimated) |
|---|---|
| Pixel / stock | 95% |
| Samsung OneUI (post-coach-mark) | 80% |
| Xiaomi MIUI / HyperOS | 40-50% |
| Oppo ColorOS | 35-45% |
| Vivo FuntouchOS | 30-40% |
| Realme | 35-45% |
| **Combined Android weighted** | **~55-65%** |

This means **30-45% of Android merchants will experience at least one NotificationListener revocation in the first 30 days, even with the best onboarding we can ship**. The product must treat this as the norm, not the exception.

---

## 3. Doze + App Standby Buckets

Cycle 32 doesn't mention Doze or App Standby. Both are core Android API 23+ / API 28+ behaviors that affect every Tokoflow background path.

### 3.1 Doze mode (API 23+)

When the device is unplugged + screen off + stationary for ~30 minutes, system enters **Doze**. Effects:
- Network access suspended
- WakeLocks ignored
- AlarmManager alarms (`set`, `setExact`) deferred to next maintenance window (every 1-2 hours, then 4h, 9h on extended Doze)
- JobScheduler / WorkManager jobs deferred
- Sync adapters do not run

**`NotificationListenerService` is exempt from Doze suspension** — the system can still bind/unbind it because it's a system-managed binding. Notifications still fire `onNotificationPosted`. Good.

**The 04:00 heartbeat is NOT exempt from Doze.** A 04:00 alarm (the merchant is asleep, phone on charger sometimes / not / face-down on dresser) needs:
- `setExactAndAllowWhileIdle()` AlarmManager API — required to fire during Doze
- `SCHEDULE_EXACT_ALARM` permission (Android 12+) — granted by default on Android 12-13 for `setExactAndAllowWhileIdle`, but **denied by default on Android 14+ unless the app declares `USE_EXACT_ALARM` (Play Store-restricted to alarm/calendar/messaging apps) OR `SCHEDULE_EXACT_ALARM` (user-grant required)**.

Tokoflow doesn't qualify for `USE_EXACT_ALARM` (it's not an alarm app). It needs `SCHEDULE_EXACT_ALARM` user-grant — yet another permission prompt. Or: drop the precision and use `setAndAllowWhileIdle()` with ±15min jitter, which is what we should do (the heartbeat doesn't need second-precision; "sometime around 04:00" is fine).

**Action:** Use `WorkManager` with `setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)` for the heartbeat, not raw AlarmManager. WorkManager handles Doze + App Standby + reboot correctly.

### 3.2 App Standby Buckets (API 28+)

Buckets: **ACTIVE → WORKING_SET → FREQUENT → RARE → RESTRICTED**.

Bucket determines:
- How often jobs can run
- How often alarms fire
- How often network access is permitted

| Bucket | Job freq | Alarm freq | Behavior |
|---|---|---|---|
| ACTIVE | unlimited | unlimited | currently used |
| WORKING_SET | every 2h | every 6 min | used daily |
| FREQUENT | every 8h | every 30 min | used weekly |
| RARE | every 24h | every 2h | infrequent |
| RESTRICTED | every 24h | every 24h | OEMs (e.g., Samsung "Deep sleep apps") drop here |

**Scenario:** merchant goes on Hari Raya leave for 5 days. Doesn't open Tokoflow. App drops from WORKING_SET to FREQUENT to RARE. The 7-day heartbeat — even if scheduled — fires at most once in 24h. Combined with MIUI auto-kill, the heartbeat may not run for the entire 5 days.

**Action:**
- Tokoflow must **train the system to keep us in WORKING_SET** by ensuring at least daily user-initiated launch — but we cannot rely on this. The daily briefing notification at 06:00 MYT helps (merchant taps notif → app opens → bucket promotes).
- For background work that genuinely matters (heartbeat, payment match reconciliation), use **WorkManager `setExpedited`** which gets quota-bounded high-priority execution regardless of bucket. Quota is small but adequate for our needs.
- Document that on Samsung's "Sleep apps" list, Tokoflow cannot run any background work at all. Coach-mark removal is mandatory.

---

## 4. Whisper-tiny on Snapdragon 685 — the budget reality

Cycle 31 Q2d: "**2-4× realtime on budget devices** (which means our 30s WA voice note → 60-120s wait on Redmi Note 12)". Cycle 32 §4.2 budget: "<25s end-to-end for 30s audio". **These two numbers are inconsistent.** Cycle 32 silently revised the research finding without saying how.

### 4.1 The chips

| Tokoflow target device | SoC | NPU exposed to apps? |
|---|---|---|
| Redmi Note 12 (4G) | Snapdragon 685 | No. Hexagon DSP exists but not exposed via Qualcomm AI Engine Direct SDK to third parties. |
| Redmi Note 12 5G | Snapdragon 4 Gen 1 | No. Same story. |
| Samsung Galaxy A14 4G | Helio G80 (MediaTek) | No. APU exists, not exposed for apps without MediaTek partnership. |
| Samsung Galaxy A14 5G | Dimensity 700 | No. |
| Oppo A78 4G | Snapdragon 680 | No. |
| Oppo A78 5G | Dimensity 700 | No. |
| Vivo Y28 / Y28s | Dimensity 6020 / 6300 | No. |

**None of the Wave 1 worst-case devices have an app-accessible NPU.** Whisper.cpp on these is pure CPU, fp16 or int8 quantized.

The Qualcomm AI Hub `whisper-tiny` model is **only deployable to Snapdragon 8 series flagship chips** (8 Gen 1, 8 Gen 2, 8 Gen 3, 8 Elite) where the Hexagon NPU is exposed via QNN SDK to third-party apps. Those chips are in flagship Samsung Galaxy S, OnePlus 11+, Xiaomi 13/14 — not in the Tokoflow target market. Cycle 32's "Qualcomm AI Hub fallback" is a false rescue.

### 4.2 Realistic latency on SD685

Pure-CPU whisper.cpp `tiny` (39MB, fp16) on SD685:
- Audio resample (ffmpeg-kit, 30s opus → 30s 16kHz mono PCM): **2-4s** on SD685 (ffmpeg is well-optimized but JNI overhead is non-zero on a 4-Cortex-A73 + 4-Cortex-A53 chip).
- Whisper inference: **30-60s** for 30s audio. The whisper.cpp Discussion #3567 numbers ("5× slower than realtime on budget devices") align with 60-150s on SD685; assuming Tokoflow's transcripts are short (5-10s of useful speech embedded in 30s of silence + ambient kitchen noise), 30s is the realistic target with VAD slicing.
- LLM extract (network round-trip to OpenRouter Gemini Flash Lite from MY/ID with non-Wi-Fi 4G): **2-5s** depending on cell signal.

**Realistic end-to-end: 35-70s, not <25s.**

The merchant's UX during this: "saya dengar..." chip animating for ~40s. Acceptable? Maybe — but we have to **say this is the reality**, not budget for <25s and quietly miss it.

### 4.3 Quantization options

Mesolitica's `malaysian-whisper-tiny` on Hugging Face is published as **fp32 PyTorch checkpoint**. To run via whisper.cpp we must convert to GGML int8 (or Q5_0). Conversion tooling (whisper.cpp's `convert-pt-to-ggml.py`) supports this; Phase 0 spike M3 must include the conversion step or pre-shipped GGML weights.

Quantization int8 reduces weight size to ~25MB and inference latency by ~30% on CPU. Accuracy drop on Bahasa Malaysia is uncharacterized — needs eval on Tokoflow's 50-utterance corpus before commit.

### 4.4 Cloud STT fallback — privacy disclosure required

Cycle 32 §4.2 mentions "OpenRouter cloud Whisper for budget Android (with merchant opt-in)". On 50-55% of Android devices, cloud STT will be the **default path**, not fallback. This needs to be reframed:

- Merchant onboarding: explicit screen on first voice capture if device is detected slow (>20s for a calibration 5s utterance). Copy: "Suara kamu akan dikirim ke server kami untuk dipahami lebih cepat. Kamu boleh pilih simpan di HP saja (lebih lambat ~1 minit). Pilihan ini boleh diubah di Settings."
- This is a **Data Safety form change**. We must declare audio recording → server transmission → server processing → not retained. This is what cycle 32 didn't mention in M5 spike scope. Play Store will flag this if we declare cloud audio processing; we must defend the use case.
- Cycle 32's "voice as primary input" magic moment depends on <3s feedback. **On budget Android with cloud STT round-trip 2-5s + Whisper cloud inference 3-8s = 5-13s**. The 1.5s arc sensory signature should fire on capture-end (not transcript-end), because we cannot afford to delay the felt confirmation by 13s.

---

## 5. Play Store policy survival 2026

### 5.1 Recent precedent reviewer-side

- **Money Lover** (expense tracker, ID/SEA): NotificationListener for SMS/notification-based txn parsing for years. Forced removal in 2023 under Play Store's 2023 sweep on "passive financial data observation". Pivoted to manual entry + receipt scan.
- **CRED** (India, fintech): pivoted from NotificationListener to AccountAggregator (regulated bank webhook integration via India's RBI sandbox) in 2022. Decision was Play Store-forced.
- **Walnut** (India, expense tracker): killed by 2019 SMS purge. Did not survive.
- **Truebill / Rocket Money** (US, subscription tracker): never used NotificationListener; uses user-uploaded screenshots + Plaid (regulated bank API). Their tech leadership has publicly said NotificationListener was rejected during Play Store review in 2021.
- **Mokapos / Olsera / GoBiz** (ID SMB POS): all native, none use NotificationListener. The Indonesian SMB ecosystem **does not rely on notification observation** because the policy risk is well-known.

### 5.2 The Play Console reviewer model in 2026

- Reviewer is an AI-pre-screen + human escalation. Approval p95 is ~3 days for small-update apps; **policy declarations can stretch 2-6 weeks**.
- 2024-2025 saw Play Console roll out "**Sensitive Data Use Declaration**" form (form ID 16558241) which adds review burden on top of the per-permission declaration.
- For NotificationListener: required reviewer-facing video must be ≤30 seconds, MP4, H.264, max 100MB, showing **end-to-end permission grant + use case demo**. Cycle 32 §4.5 mentions this but doesn't budget the production effort — that's another 1-2 days of M5 work.
- The "minimum functionality" justification ("essential for primary purpose") is the test. **Tokoflow's primary purpose is "diary entry tool for SMB merchants" — NotificationListener as one of six capture paths is not "essential", it's "convenient".** This framing is exactly what Play reviewers use to reject. Defense: declare it as "essential to the auto-claim feature, which is one of the documented core features of the Pro tier offering".

### 5.3 The 4-8 week reality

Cycle 32 M5 spike: "2-3w wall-clock". My read of 2025-2026 reviewer turnaround for NotificationListener-using apps in fintech-adjacent space:

- Initial submission to Internal Testing: 3-7 days approval (faster lane).
- If flagged for declaration: 1-2 weeks for first reviewer feedback.
- Iteration cycle (revise video, revise declaration text, resubmit): 1-2 weeks per round, typically 1-3 rounds.
- **Realistic total: 4-8 weeks wall-clock.**

**Action:** Re-budget M5 to 6 weeks. Wave 1 sprint must not block on M5 — if it does, ship Wave 1 manual-share-only on Android and switch on NotificationListener in a Wave 1.1 update once policy clears.

### 5.4 Data Safety form interactions

Tokoflow's Data Safety declarations get progressively heavier with each feature:
- Audio recording: yes (Path 1, 5, 6).
- Audio shared with third parties: yes if cloud STT (≥50% of Android merchants per §4 above).
- Audio retained off-device: ambiguous (OpenRouter retains 30d for moderation per their TOS). **Must clarify with OpenRouter.**
- Customer names, phone, payment amounts: yes, on-device + Supabase backup.
- Data sold/shared for ads: no.

Each of these affects the Data Safety pill on the Play Store listing. "Audio recording shared with third parties" is a **prominent yellow flag** on the listing. Marketing/positioning consequence: Tokoflow's "we never share your data" tagline has to be carefully scoped to **business data**, not audio-in-flight.

---

## 6. Android-specific UX gaps in cycle 32

### 6.1 Predictive Back Gesture (Android 14+)

Android 14 introduced predictive back: long-pressing back gesture shows a preview of where back will navigate. Apps must **opt in** via `<application android:enableOnBackInvokedCallback="true">` in manifest, AND handle `OnBackInvokedDispatcher` in their navigation stack.

`expo-router` has predictive back support since v3, but only on Fabric (New Arch). Cycle 32 mandates New Arch — good. But the explicit manifest flag is needed and is not default in the Expo template. Add to the M1/M2 setup checklist.

### 6.2 Material You (Android 12+) and themed icons (Android 13+)

Cycle 32 doesn't address visual identity for Android. Material You allows (does not require) the app to inherit user's wallpaper-derived color palette. For Tokoflow, the warm-paper palette is intentional and brand-tied — **opt out of Material You dynamic colors**, do not apply the user's wallpaper palette. This is a deliberate choice consistent with the canonical sensory signature.

Themed app icons (Android 13+) require a monochrome layer in the adaptive icon. Without it, Android 13+ users with "Themed icons" turned on will see a muted, system-stylized icon. Provide:
- Adaptive icon: foreground (transparent, 108dp safe zone) + background (solid color).
- Themed icon: monochrome SVG/PNG at the same canvas.

### 6.3 Edge-to-edge and Android 15 mandate

Android 15 (API 35) **mandates edge-to-edge** layouts when targeting SDK 35. Apps not handling system bar insets will have content drawn under the status bar / navigation bar.

`expo-router` and React Native 0.81+ handle this via `react-native-safe-area-context`. Verify all Tokoflow screens use `<SafeAreaView>` or `useSafeAreaInsets()` correctly. Cycle 32 doesn't list this; add as a code-review checklist for Wave 1.

### 6.4 Notification channels (Android 8+)

Required for any push or local notification. Spec the channels:

| Channel ID | Importance | Use |
|---|---|---|
| `payment_observer_keepalive` | LOW | Foreground service notification (always on, low-priority) |
| `daily_briefing` | DEFAULT | Cron 06:00 daily |
| `auto_claim_silent` | MIN | Foreground update for new auto-claimed payment (optional, off by default to avoid spam) |
| `heartbeat_revoked_warning` | HIGH | Listener access lost, action required |
| `system_alerts` | DEFAULT | Stock low, capacity, etc. |

Channel names + descriptions need to be in Bahasa Melayu for MY users (not BM Indonesia, not English). Cycle 32 says BM is Phase 4; **for notification channels we cannot wait** because they're surfaced in Settings → Apps → Notifications.

### 6.5 App shortcuts and adaptive icons

Long-press the Tokoflow icon should expose:
- **Quick voice** — opens directly to voice capture screen
- **View today** — opens today's diary feed
- **Last receipt** — re-opens most recent payment claim card

Android shortcuts API (`ShortcutManagerCompat`). Useful, low effort (<1d), missing from cycle 32 spec.

### 6.6 Tablet / split-screen / freeform

A non-trivial number of MY/ID merchants use cheap 7-8" Android tablets (Samsung Tab A7 Lite, Realme Pad mini, Xiaomi Redmi Pad SE) in the kitchen as a fixed display. Tokoflow should:
- Lock to portrait OR support landscape with adaptive grid layout
- Handle split-screen mode (Android 12+ allows arbitrary resize)
- Spec at minimum: don't crash on resize, gracefully reflow

Cycle 32 doesn't address tablets. Wave 1 minimum: lock to portrait (`android:screenOrientation="portrait"` in manifest), add a visible-but-quiet "tablet mode coming" message if device width >600dp. Phase 4 handle properly.

### 6.7 Phone call interruption

If merchant is recording voice (Path 1) and a phone call comes in, Android pauses microphone access. `expo-audio` should handle this correctly via `AudioFocusRequest` on Android, but cycle 32 doesn't spec the recovery: do we save partial audio? Discard? Ask merchant?

Recommended: save partial as draft, surface as "interrupted recording" in feed, tap to resume.

### 6.8 Bluetooth headset audio routing

Bu Aisyah may use Bluetooth earphones during cooking. `expo-audio` records from current input device, which may be the BT mic. BT mic quality on cheap earphones is **8 kHz mono with HFP/SCO codec** — way below Whisper's 16 kHz expectation. ffmpeg upsample is fine, but the source audio is lossy.

Spec: detect BT input, warn merchant ("voice quality may be lower with Bluetooth — tap mic to switch to phone speaker").

### 6.9 Wear OS, RTL, accessibility

Out of scope for Wave 1 but spec now:
- Wear OS: not Day 1, not Phase 2. Phase 4+ if at all.
- RTL: Wave 5 (Arabic merchants). Spec layout direction handling now via `I18nManager.isRTL`; do not hard-code `marginLeft`/`marginRight`.
- Android accessibility: `TalkBack` is the screen reader. RN's `accessibilityLabel`, `accessibilityRole`, `accessibilityLiveRegion` map to TalkBack. Cycle 28 §1.11 mandates VoiceOver narration; equivalent TalkBack pass needed.

---

## 7. Build, signing, AAB size

### 7.1 AAB size budget

Whisper-tiny GGML int8: ~25-39MB depending on quantization. Plus:
- React Native 0.81 + Hermes: ~7MB Android runtime
- Expo SDK 54 native modules (Expo SDK base, expo-audio, expo-camera, expo-haptics, expo-router, expo-sqlite, etc.): ~15-20MB
- Notifee + react-native-haptic-feedback + ffmpeg-kit-react-native: **ffmpeg-kit-android-full is 50MB+** (this is the elephant). Use `ffmpeg-kit-react-native-min-gpl` (audio-only): ~10-15MB.
- Custom Expo Modules (notification-observer + sensory-signature): ~1MB
- App code (JS bundle compiled to Hermes bytecode): ~2-5MB
- Mesolitica Whisper weights (bundled): 25-39MB
- Drawable resources, fonts (Indonesian/Malay-aware): ~3-5MB

**Estimated AAB total: 80-110MB.** Below the 150MB Play Store hard cap, but above the 100MB warning threshold (Play Console flags AABs >100MB for download size impact on slow connections).

### 7.2 ABI splits

Redmi Note 12 / SD685 = arm64-v8a. Most modern budget devices are 64-bit. Older Samsung A series (A03 from 2022) may still be armeabi-v7a (32-bit). Tokoflow should ship arm64-v8a only if we drop pre-2023 32-bit budget devices, or arm64-v8a + armeabi-v7a if not.

EAS Build defaults to arm64-v8a + armeabi-v7a + x86_64 (latter for emulator). With Whisper weights, this multiplies the bundled native lib size by ABI count. **Use Play App Signing's ABI splits** — Play Store will deliver the right ABI to each device, AAB stays single binary at upload.

### 7.3 Signing key

EAS-managed key is fine for Wave 1 but creates a vendor-lock cost if we later move off Expo. Decision: accept EAS-managed for Wave 1; export the keystore + upload to a vault before any production submission so we own a backup. Document the export procedure.

Play App Signing (Google holds the upload key, you provide a signing key for upload-side proof) is mandatory for new apps since 2021. Set up at first Play Console upload.

### 7.4 Dynamic Feature Modules (DFM)

Whisper weights are 25-39MB, ABI-multiplied. **Dynamic delivery (Play Feature Delivery)** lets us defer the model download to first voice capture: install-time AAB is small (~50MB), Whisper module fetched on demand. EAS Build's support for DFM is limited (some manual config plugins required). Worth Phase 0 spike effort — saves ~30-50MB in the install-time download, which is the difference between "works on 4G in Bandung kampung" and "merchant uninstalls during 90s download".

---

## 8. iOS-RN-vs-Android-RN parity gaps cycle 32 didn't flag

Cycle 32 treats iOS and Android symmetrically for most native modules. They are not symmetric in implementation cost.

| Capability | iOS effort | Android effort | Cycle 32's treatment |
|---|---|---|---|
| Voice recording start/stop | Trivial (expo-audio) | Trivial | Equal |
| Sensory signature (visual + audio + haptic <50ms) | Manageable (CHHapticEngine + AVAudioPlayer + UIView animation, all from one Swift call) | **Hard** (Vibrator + SoundPool + native View animation; SoundPool prep latency 100-300ms on first play; haptic-audio sync drift on F-tier OEMs is 80-150ms) | Equal — wrong |
| Notification observation | N/A (Path 6 alternative manual share) | NotificationListenerService (custom Expo Module, 5-7d) | Asymmetric — correct |
| Share extension | expo-share-extension (mature) | AndroidManifest intent-filter (trivial) | Equal — Android cheaper, correct |
| Whisper inference | iPhone 12+ runs in 6-10s; iPhone SE2 has 3GB RAM → tiny only | SD685 runs in 30-60s; need cloud fallback for ~50% | Asymmetric — flagged but understated |
| Push notification | APNs via expo-notifications (well-trodden) | FCM via expo-notifications (well-trodden); also OEM pushes Mi Push, ColorOS Push, Vivo Push for highest reliability — **not addressed** | Equal — wrong |

**Mi Push / Huawei Push / ColorOS Push / Vivo Push.** On F-tier OEMs, FCM delivery in background is unreliable because the FCM service itself can be killed by the OEM. The mature SMB/fintech apps in ID/MY use **dual-channel push**: FCM as primary, OEM-specific push (HMS Push for Huawei devices without GMS) as fallback. Tokoflow Wave 1 punts on this — Huawei is <3% market share — but needs to be on the Phase 4 list, not invisible.

---

## 9. Sensory signature on budget Android — the 50ms drift claim

Cycle 32 §4.3: "Pass criteria: <50ms drift on iPhone 12 + Pixel 6a; <80ms on Redmi Note 12 / Samsung A14 acceptable."

This understates the problem. Specifically:

- Android `Vibrator.vibrate()` has a **measured first-fire latency of 30-90ms** on budget devices (cold start of the vibration motor driver). Subsequent fires drop to ~10-20ms.
- `SoundPool.play()` has a **30-150ms latency on first play** if the sound isn't preloaded. Solution: preload at app launch. But on cold-start with low memory, the OS may reclaim SoundPool buffers.
- Visual frame timing on a 60Hz display: ±16ms quantization. On 90Hz/120Hz panels (some Redmi Note 12 variants are 120Hz): ±8ms.

**Total drift budget on cold sensory-signature fire: 60-180ms on F-tier OEMs.** The "<80ms" target is achievable on warm fires only. Spec must be:
- Warm fire (subsequent fires within 5s): <80ms acceptable, achievable
- Cold fire (first fire in a session): <200ms acceptable, downgraded experience

Define "felt signature" semantics: all three modalities fire, sequence may drift up to 200ms on cold path, fine. The architecture's "pristine sync" claim should explicitly only apply to flagship devices.

---

## 10. The 5 alpha cohort device distribution problem

If the 5 Wave 1 alpha merchants are 4 iPhones + 1 Pixel, **the launch validates almost nothing about Android reliability** — yet Android is 80%+ of Tokoflow's Year 1 target market.

Cycle 32 doesn't specify the device target for the alpha cohort. **Mandatory cohort composition:**

- 1 iPhone 13/14 (modern iOS validation)
- 1 iPhone SE 2 (3GB RAM, Whisper-tiny memory floor validation)
- 1 Samsung Galaxy A14 / A24 (B-tier, OneUI battery saver real-world test)
- 1 Redmi Note 12 / 13 (F-tier, MIUI/HyperOS coach-mark test)
- 1 Oppo A78 / Reno 11 OR Vivo Y28 (F-tier, ColorOS or FuntouchOS — whichever we have least data on)

This is a hard constraint, not a preference. If we cannot recruit a Vivo merchant in Shah Alam, the Wave 1 cohort is incomplete and Wave 2 expansion to ID will hit Vivo's 17% ID market share blind.

---

## 11. Final sev list, score, and the ONE thing

### Issues by severity

| ID | Sev | Issue | Fix direction |
|---|---|---|---|
| A1 | **9** | NotificationListener `onNotificationPosted` binder-thread → JS-thread handoff unspecified; high crash risk under burst | Bundle-marshal on binder thread, emit via `RCTDeviceEventEmitter` on UI thread; bounded ring buffer; M1 day 2 add explicit JSI-cross-thread prohibition test |
| A2 | **9** | Foreground service type wrong (`dataSync` default in Notifee, must be `specialUse`); risks Android 14+ misuse rejection at Play review | Override Notifee `types` to `specialUse`; add `<property name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE" />`; declare in M5 Play Console form |
| A3 | **9** | 7-day heartbeat is 6 days too long for F-tier OEMs (~50% of MY+ID Android); merchant churns silently before discovering revocation | Tiered heartbeat: 24h F-tier, 72h B-tier, 7d A-tier; also fire on `onListenerDisconnected()` + `BOOT_COMPLETED` |
| A4 | **8** | Whisper-tiny <25s budget on SD685 conflicts with cycle 31's 60-120s research; "Qualcomm AI Hub NPU" rescue is false (no NPU exposed on SD4-class) | Cloud STT as default path on detect-slow-device, not fallback; reframe sensory signature to fire on capture-end not transcript-end; Data Safety form must reflect cloud audio |
| A5 | **8** | Play Store NotificationListener policy survival: post-CRED, post-Money-Lover, post-2023 sweep; 2-3w M5 budget is 4-8w realistic | Re-budget M5 to 6w wall-clock; Wave 1 ships Android manual-share-only if M5 not cleared; switch on NotifListener in Wave 1.1 |
| A6 | **8** | Per-OEM permission deeplinks unspecified for MIUI/ColorOS/FuntouchOS; cycle 32 cycle 22 §9 reference is a handwave | Document fallback ladder per §2.1 above; per-OEM coach-mark with screenshots; detect OEM via `Build.MANUFACTURER` |
| A7 | **7** | Doze + App Standby Bucket interactions not addressed; heartbeat on `setExact` requires `SCHEDULE_EXACT_ALARM` user-grant on Android 14+ | Use `WorkManager` `setExpedited` not raw AlarmManager; ±15min jitter on heartbeat; bucket-aware UX (briefing notification at 06:00 promotes app to WORKING_SET) |
| A8 | **7** | Foreground service type declaration form (separate from Permissions Declaration) for `specialUse` not in M5 scope | Add to M5 spike: write specialUse justification; allocate 1d for Play Console form |
| A9 | **7** | AAB size 80-110MB; ffmpeg-kit-android-full (50MB) overspecced for audio-only use | Use `ffmpeg-kit-react-native-min-gpl` audio-only; investigate Play Feature Delivery for Whisper weights |
| A10 | **7** | Sensory signature <50ms drift on Redmi Note 12 unrealistic on cold fire (60-180ms); SoundPool first-play latency 100-300ms | Distinguish warm vs cold fire; preload SoundPool at app launch; spec "felt" signature with up to 200ms cold drift on F-tier acceptable |
| A11 | **6** | Predictive back, edge-to-edge, themed icons, notification channels, Material You opt-out unspecified | Code-review checklist before Wave 1 ship; channels must be BM-localized despite BM=Phase 4 |
| A12 | **6** | Alpha cohort device distribution unspecified; risk of validating only flagship/iOS reliability | Mandatory 5-device mix per §10; recruit cohort with this constraint up-front |
| A13 | **5** | OEM-specific push (Mi Push, HMS Push, ColorOS Push, Vivo Push) not addressed; FCM unreliable on F-tier in deep background | Phase 4 task; Wave 1 accept FCM-only; document expected ~30-40% push delivery loss on F-tier with battery saver active |
| A14 | **5** | Tablet support unspec'd; some MY/ID merchants use 7-8" Android tablets in kitchen | Wave 1 lock portrait, gracefully degrade on tablet width; Phase 4 proper support |
| A15 | **4** | Bluetooth headset audio routing, phone call interruption, BT mic 8kHz HFP unhandled | Detect BT input → quality-warning UX; pause-resume on call interrupt with draft save |

### Scores (0-10)

| Dimension | Score | Note |
|---|---|---|
| (a) NotificationListener viability | **6** | API itself viable; lifecycle + binder-thread handoff + foreground-service-type problems are fixable but currently unaddressed |
| (b) MIUI / ColorOS / FuntouchOS reliability | **4** | Fundamental ecosystem ceiling ~30-50% Day-30 retention; coach-marks help but cannot fix; tiered heartbeat narrows the window of silent failure |
| (c) Whisper budget-device viability | **3** | <25s budget is unrealistic on SD685; cloud STT is default path on ~50% of Android, not fallback; cycle 32 misrepresents this |
| (d) Play Store policy survival probability | **5** | Possible but not 2-3w; expect 4-8w iteration; risk of forced removal of NotifListener is non-trivial; Wave 1 must not block on this |
| (e) Foreground service compliance (Android 14+) | **5** | Notifee defaults to wrong type; specialUse declaration missing; specialUse Play Console form missing — all fixable in M1 |
| (f) Overall Android UX readiness | **4** | Comprehensive picture: cycle 32 is iOS-thinking with Android labeled on. With the §11 fixes applied: 7. Without them: 4. |

### The ONE thing — defer or ship on allowlist

**Defer Android NotificationListener auto-claim (Path 6) to Wave 1.1, NOT Wave 1.**

- Wave 1 ships on Android with Path 1 (voice), Path 2 (text), Path 3 (image), Path 4 (WA screenshot share), Path 5 (forwarded WA voice). All five are policy-safe, ecosystem-safe, and reliable across all OEMs.
- Path 6 (NotificationListener) ships in Wave 1.1, ~4 weeks post-Wave-1, after M5 Play Store clearance is confirmed AND the per-OEM coach-mark UX has been validated on the cohort's Redmi + Oppo devices.
- Until Wave 1.1, the marketing copy does NOT claim "auto-claim on Android". It claims "auto-claim on iOS coming, on Android we observe via WhatsApp share". This is honest and consistent with the cycle 28 §4.6 silent-degradation principle.

If we cannot defer NotificationListener — i.e., if the product strategy says auto-claim is core and Wave 1 must ship it — then **Wave 1 alpha is OEM-allowlisted**: Pixel + Samsung only, 0 F-tier devices. This is a real choice but it cuts the Year 1 Indonesia TAM by ~50%. The team should consciously make this tradeoff, not stumble into it.

The third option — ship Wave 1 to F-tier with NotificationListener "best effort" — is the worst path. It looks like it works on launch day and silently degrades over weeks 1-4 as MIUI/ColorOS strangle the listener. Merchants churn quietly. The Sean Ellis "very disappointed" signal goes flat because the merchants who would have given it never get the magic; they get a half-broken auto-claim that intermittently fails and feel mildly disappointed instead. **That's the actual death scenario for this product on Android, and cycle 32 walks straight toward it.**

---

## What to forward to cycle 34 SYNTHESIZE

Three concrete action items for the synthesis:

1. **Re-write cycle 32 §4.1 (M1 spike)** to include the §1-2 fixes: binder-thread handoff, `specialUse` foreground service type, tiered heartbeat, per-OEM deeplink ladder, Play Console specialUse form. M1 effort: revise from 5-7d to **8-12d** (still parallelizable with M2, M3).
2. **Re-write cycle 32 §4.2 (M3 spike)** to acknowledge cycle 31's 60-120s on SD685 finding; include cloud STT as default path for detect-slow-device, with Data Safety form impact documented. M3 effort: 3d → **5d** (adds quantization + cloud-STT toggle UX).
3. **Add to cycle 32 §6 critical path:** alpha cohort device distribution constraint (§10 above) + Wave 1 ships Android manual-share-only if M5 not cleared by sprint week 4 (§5.3 above).

The right outcome of this red team isn't to abandon Stack A — Stack A is still the right answer. The outcome is for the synthesis to honestly price the Android tax, defer NotificationListener if needed, and ship Wave 1 to a cohort that proves Android reliability rather than averaging it out with iOS.

— Android Platform Engineer, signing off
