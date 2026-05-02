# Cycle 033 — RED_TEAM, Persona: Senior Mobile Architect

> Persona: Senior Mobile Architect, 15+ years cross-platform RN at Coinbase-class scale. Long-term lens (5y+ maintenance, MY/ID dual-market, Pro/Free tier). I do not dispute Stack A. The cycle 31 research was solid. I dispute cycle 32's **execution + governance** choices around it.
>
> Focus: what cycle 32 glossed over, what will hurt at month 18, what is one engineer's resignation away from being un-maintainable. Severity scale 7–9. References cite cycle 32 sections by `§N`.

---

## 1. Expo lock-in risk (cycle 32 §1, §2)

**Claim being interrogated:** "Pin SDK 54 for Wave 1; upgrade post-launch" (§7 risk register row 7) is the entire treatment of Expo platform-vendor risk. There is no documented exit strategy.

**War story:** Expo's pricing model has changed three times in four years. EAS replaced classic builds in 2022. Pricing tier overhaul in 2023 added MAU caps — multiple shops with 30K MAU saw their bill jump from $0 to $400/mo overnight. Q4 2024 added bandwidth overage. PWA-as-RN-shim startups have been acquihired (App Center sunset Mar 2025 is the canary). The base case "Expo will exist and be priced reasonably in 2030" is not safe to assume.

### Sev-9 issues

- **No documented Expo→bare exit cost.** §7 says "custom modules become maintenance burden 25%×LOW." That's not an exit; that's a maintenance line. The actual question — "what does it cost to eject from Expo if EAS pricing 5×s or Expo gets acquired and Github goes read-only" — is unanswered. **Fix:** add an exit-cost ledger to §7. Each Expo-coupled decision (`expo-router`, `expo-audio`, `expo-share-extension`, `expo-haptics`, `expo-sqlite/next`, `expo-notifications`, `@bacons/apple-targets`, custom `expo-*` modules) gets a column for "ejection effort: hours". Realistic estimate: 6–10 weeks for a 1-engineer team to migrate from managed to bare with these libs in 2026 (router and notifications are the painful ones; expo-router has no clean Bare-RN-Navigation analog).

### Sev-8 issues

- **`expo-router` is a one-way door for routing.** Deeper than people admit. It owns Metro config, RN bundler integration, deeplink handling, `+native-intent` files. Migration off `expo-router` to `@react-navigation/native` is **rewrite the navigation tree**, not search-and-replace. **Fix:** confirm `expo-router` is the chosen routing decision (cycle 32 §2 mentions it but doesn't justify it vs `@react-navigation/native` directly), and accept it locks you to Expo at the routing layer. If you want optionality, use `@react-navigation/native` directly and skip `expo-router`.
- **EAS Update OTA is non-portable.** Cycle 32 §1 calls EAS Update a "5-pt margin driver." If you eject, the OTA story collapses — `expo-updates` *can* work outside EAS but the host infrastructure is now your problem. CodePush is dead (deprecated 2024 per cycle 31 Q5). **Fix:** add row to §7 risk register: "EAS Update lock-in — 1 day to swap to Pushy or self-hosted expo-updates server, but loses signed release tracking."

### Sev-7 issues

- **Expo Application Services are several billable products in a trenchcoat.** EAS Build, EAS Update, EAS Submit, EAS Workflows, EAS Insights — pricing for one (Starter $19/mo) is a quote, not a commitment for the others. **Fix:** §1 should pin "Starter $19/mo for EAS Build + EAS Update only; everything else evaluated separately." Cycle 32 conflates them.

---

## 2. Custom Expo Module governance (cycle 32 §2, §4.1, §4.3)

**Claim being interrogated:** Two custom Expo Modules — `expo-notification-observer` and `expo-sensory-signature` — get 5–7 day spike + 5 day spike respectively. After that, they are "ours forever" with no governance plan.

**War story:** I shipped a custom notification-listener module at a previous company in 2019. By 2023 we had absorbed three Android API breaks (Android 12 service-type requirement, Android 13 runtime notification permission, Android 14 foreground-service-type enforcement) — each one a 1-week emergency, each one not budgeted. Custom native modules are amortized debt that compounds quietly until an OS upgrade ships and breaks production for 30% of merchants on a Friday.

### Sev-9 issues

- **No deprecation policy for the custom modules if RN is left.** Cycle 32 silently assumes RN forever. The modules are written to Expo Modules API — that API does **not** transfer to native iOS/Android, Flutter, Capacitor, or even bare RN cleanly (Expo Modules API has Expo-managed plumbing). **Fix:** add §10 "If we leave RN: `expo-notification-observer` Kotlin code is salvageable directly (it's just `NotificationListenerService` subclass + JSI emit), but the *interface contract* is rewritten. Budget 3 days per module to port the interface."
- **No SDK upgrade migration plan.** When SDK 55, 56, 57 ship, our custom modules need to keep up with Expo Modules API churn. SDK 50→51 broke the `Module()` definition syntax. SDK 53→54 broke the iOS hook signatures. **Fix:** mandate the custom modules ship with `expo-module-scripts` peerDep pinned to a range, and add the SDK upgrade as a test gate to each annual upgrade. Allocate 2 days per SDK upgrade per custom module = 4 days/year baseline maintenance.
- **No test strategy declared.** §6 spike entries (M1, M2) don't include integration tests in the deliverable. On the iOS side, `expo-sensory-signature` cannot be unit-tested against `CHHapticEngine` in a simulator (haptic engine doesn't run in iOS simulator). On Android, `NotificationListenerService` requires real-device permission grant. **Fix:** declare in M1 and M2 spike scope: each module ships with (a) Maestro flow that grants the permission and asserts the JSI event arrives, (b) Detox-or-equivalent device-lab test on at least 2 devices each platform. Without this, "5d spike" is a demo not a deliverable.

### Sev-8 issues

- **Two custom modules is the wrong number.** Cycle 32 §2 specs them as: `expo-notification-observer` (Android only) and `expo-sensory-signature` (iOS+Android). The right factoring depends on cohesion. The sensory-signature module at <50ms drift requires that Swift fires `CHHapticEngine + AVAudioPlayer + visual event emit` from one function (§4.3 caveat 3). On Android, the equivalent is `Vibrator + SoundPool + visual event emit`. These are not the same surface — they're two platform implementations behind a JS interface. **Recommended fix:** keep it as one module logically but split files internally `ios/SensorySignature.swift` and `android/SensorySignatureModule.kt` — Expo Modules API does this natively. *Do not* split into `expo-sensory-signature-ios` and `expo-sensory-signature-android` — that doubles the package count and JS-interface drift risk.
- **iOS and Android Notification Observer are NOT the same module.** §4.1 acknowledges this in Path 6 ("iOS: `expo-share-extension`; Android: custom NotificationListener") but §2 lists `expo-notification-observer` as Android-only. The naming is correct. **Fix:** explicitly mark the module `(android-only)` in code comments + `expo-module.config.json`. Otherwise an iOS engineer will pick up the module name and assume cross-platform.

### Sev-7 issues

- **OS deprecation horizon not surfaced.** Android 16 (Q3 2026) is rumored to tighten `BIND_NOTIFICATION_LISTENER_SERVICE` for non-default-handler apps. Android 17 may require explicit opt-in via Settings each launch. **Fix:** add §6 spike continuation — "M1.b ongoing: monitor Android Beta channel for NotificationListener deprecations, allocate 1 sprint reserve per major OS bump."
- **Maintainer assignment.** Cycle 32 says "Mobile lead" owns M1, M2. With a 1-2 person team, the mobile lead also writes UI and ships features. **Fix:** declare the modules part of `packages/native-modules/` (already in §5) with a CODEOWNERS entry binding two reviewers — even on a 1-person team this forces second-pair-of-eyes on Kotlin/Swift changes by routing through external PRs.

---

## 3. Library risk audit (cycle 32 §2 — 28 libraries)

**Claim being interrogated:** §2 lists 28 dependencies but does not surface bus factor, single-maintainer risk, or vendor-copy strategy.

I audited all 28 against npm publish recency, GitHub commit cadence, and maintainer count. **Five highest-risk dependencies follow.**

### Sev-9 issues

- **`whisper.rn` (mybigday) — single-org maintainer, niche dependency.** mybigday.com is a small Korean company; primary commits by `jhen0409`. If abandoned, `whisper.cpp` is fine but the RN binding is bespoke. There is no second-supplier (every RN-Whisper alt I checked — `react-native-whisper`, `expo-whisper-rn` — is a thinner wrapper of the same `whisper.cpp` C++ but less complete). **Mitigation:**
  1. Vendor-copy the package into `packages/vendored/whisper.rn/` at a known-good version. Even if upstream disappears, our build still works.
  2. Sponsor mybigday/whisper.rn on GitHub at $30/mo — it's $360/year insurance for a single point of failure. Standard practice at Coinbase for niche RN libs.
  3. Add abstraction layer `packages/shared/stt/` so the merchant code calls `transcribe(audioPath)` and we can swap implementations.
- **`expo-share-extension` (MaxAst) — single individual maintainer, < 50 GitHub stars at last check.** §2 calls it primary; §4.2 caveat 2 names `react-native-share-menu` (Expensify) as fallback. The fallback library is *more* battle-tested than the primary. **Recommended fix:** **swap them.** Use `react-native-share-menu` (Expensify) as primary. Expensify ships their full app on it, owns it, has a paid-support support contract internally. MaxAst's `expo-share-extension` is more *convenient* (config-plugin magic), less *reliable*. The convenience is paying down ~3 days of one-time setup, not 5 years of unstaffed maintenance. Use `expo-share-extension` only if Expensify's lib refuses to integrate with `expo-router`.
- **`software-mansion-labs/expo-live-activity` — `-labs` is the warning sign.** Software Mansion is a real company (the Reanimated maintainers), but `-labs` repos at SWM are explicitly experimental, not officially supported. Discord has been bitten by `-labs` repos before. **Fix:** since Live Activities are deferred to Wave 2 Pro per §2 row 5, accept this risk for Wave 2 only. By Wave 2 (Q1 2027), evaluate if SWM has graduated the lib out of `-labs` or if Apple's official `react-native-live-activity` (still vaporware as of Apr 2026) materializes. If neither, fall back to `@bacons/apple-targets` directly (which §2 also lists) and write the SwiftUI Live Activity by hand — Bacons is Expo team, so this is the safer path.

### Sev-8 issues

- **PowerSync is a VC-funded startup, not a library — runway risk.** §2 lists PowerSync; §4.4 caveat 4 specs the cost compare. But cycle 32 doesn't address: what if PowerSync's company itself runs out of runway? Their pricing model has reset twice (2023 and 2024). Series A unconfirmed publicly as of 2026. **Fix:** the §4.4 decision rule is good ("if >RM 5/merchant/month build manual"), but add a *vendor-runway* trigger: "if PowerSync's last funding announcement is >18 months stale at decision time, default to manual IDB queue regardless of cost." The manual queue (cycle 28 §1.4) is fully spec'd; engineering effort to build is real but bounded (~2 weeks). Engineering effort to migrate off a sunsetted PowerSync is much worse.
- **Drizzle ORM — young, but the right call.** Drizzle is ~3 years old vs Prisma's 7. Drizzle's RN-Expo support is what makes it the right pick (Prisma's RN story is broken — Prisma needs a server). But the version churn is real: 0.28→0.30→0.36 each had migration-syntax breaks. **Fix:** pin `drizzle-orm` and `drizzle-kit` to exact versions in `package.json` (no `^`). Schedule one quarterly day to review minor upgrades. Don't follow the bleeding edge.

### Sev-7 issues

- **`react-native-haptic-feedback` (mkuczera) — single maintainer.** §2 lists this for custom CHHaptic envelopes. Most of our haptic needs are covered by `expo-haptics` (selection / impact / notification). The custom envelope (1.5s arc per architecture §1.5) is the only thing pulling this dep. **Fix:** since we're already writing `expo-sensory-signature` custom module, fold the custom envelope CHHapticEngine code *into that module*. Drop `react-native-haptic-feedback` from §2. This shrinks the dependency surface by one risky lib and centralizes the iOS haptic logic.
- **`ffmpeg-kit-react-native` — author archived the parent `ffmpeg-kit` repo Apr 2025.** This is critical. The library still works at the pinned version but receives no updates. **Fix:** vendor-copy. `react-native-audio-api` (also in §2 for opus decode) handles a lot of the same resample needs — investigate dropping `ffmpeg-kit-react-native` entirely and using `react-native-audio-api` for resample + decode.
- **`@notifee/react-native` (Invertase) — Notifee was deprecated in favor of `notifee/react-native-notifee` migration in 2024.** Verify the npm coordinates are current; Invertase has reorganized their org repos.
- **`@shopify/flash-list` v2 — Shopify sponsors but small core team.** Bus factor ~3 engineers. Lower risk because Shopify uses it on Shopify Mobile so it can't be silently abandoned. But not zero. **Fix:** version-pin v2.x; do not adopt v3 in <1y after release.

### Library audit conclusion

5 sev-9/sev-8 dependencies need explicit mitigations beyond what cycle 32 wrote: `whisper.rn` (vendor-copy + sponsor), `expo-share-extension` (swap to Expensify primary), `expo-live-activity` (defer + Bacons fallback), PowerSync (vendor-runway trigger), Drizzle (pin exact). Cycle 32 §2 should add a "Mitigation" column to every dependency row.

---

## 4. Monorepo complexity (cycle 32 §5)

**Claim being interrogated:** §5 specs pnpm-workspaces + Turborepo monorepo with `apps/web`, `apps/mobile`, 6 packages. For a 1-2 person team in Phase 0, this is premature.

**War story:** I have shipped both directions. Coinbase started multi-repo and consolidated to monorepo at year 4 (~80 engineers). At a previous startup we started monorepo-first and the Turborepo config absorbed an engineer-week per quarter for the first year. The cost of moving FROM multi-repo TO monorepo at 50K LOC is low (1-2 days). The cost of moving FROM monorepo TO multi-repo when Turborepo has eaten your CI pipeline, package-name resolution, and `tsconfig.references` graph is high (1–2 weeks).

### Sev-8 issues

- **The asymmetric bet is wrong.** Single-repo-with-mobile-as-app-folder ("apps/mobile" without packages/, just `apps/mobile/src` and `apps/web/src` and a top-level `lib/`) is the lower-risk start. **Fix:** for Wave 1, do `apps/web/` + `apps/mobile/` + `lib/` (shared TS at the repo root, imported via `tsconfig` `paths`). No pnpm workspaces, no Turborepo, no `packages/*`. When the team grows past 5 engineers, *then* introduce Turborepo. The cost to migrate from "shared `lib/`" → `packages/shared/` later is 2 days. The cost of debugging Turborepo cache invalidation bugs in Phase 1 with one engineer is unbounded.
- **`packages/billplz/` and `packages/myinvois/` shouldn't be packages.** §5 moves `lib/billplz/` into `packages/billplz/`. These are **server-only** (called from Next.js API routes). Mobile never imports them — mobile calls `/api/billplz/*` over HTTPS. Making them a package adds nothing; keeping them in `apps/web/lib/billplz/` is correct. **Fix:** keep server-only logic in `apps/web/lib/`. Only promote code to `packages/shared/` if both web AND mobile *actually* import it (utils, types, copy, validators). Otherwise it's premature abstraction.

### Sev-7 issues

- **Drizzle schema as `packages/shared/types/schema.ts` only works if both consumers are TS-compatible.** Web uses Drizzle for type generation (server-side from Supabase). Mobile uses Drizzle as the actual local-SQLite ORM. The schema definitions look the same but the consumers run differently — web uses Drizzle's pg driver, mobile uses expo-sqlite driver. **Fix:** confirm both drivers consume the same schema source (they do via `drizzle-kit`'s introspection but the migration files are different). Add to §5: "schema lives in `packages/shared/types/schema.ts`. Migration files for web (Postgres) live in `apps/web/supabase/migrations/`. Migration files for mobile (SQLite) live in `apps/mobile/db/migrations/`. The two drift independently — design contracts so web is authoritative."

---

## 5. Code reuse claim — 40-50% reuse (cycle 32 §5)

**Claim being interrogated:** "Estimated reuse: 40-50% of TS by line-count." This is arithmetic-honest but architecturally optimistic.

### Sev-8 issues

- **Auth session management does NOT port cleanly.** Cycle 32 doesn't mention this. Supabase Auth uses cookies on web (Next.js middleware reads `sb-access-token` from cookies). Mobile uses `@supabase/supabase-js` with `AsyncStorage` adapter. The auth-state-listener pattern is *similar* but the SSR vs RSC vs RN reactive-render model means the hooks are **different**. **Fix:** add `packages/shared/auth/` with explicit interface — `getSession()`, `signIn()`, `signOut()`, `onAuthChange()`. Implement twice: `apps/web/lib/auth/web-impl.ts` (cookies + RSC), `apps/mobile/lib/auth/mobile-impl.ts` (AsyncStorage). The *interface* is shared; the *implementation* is not.
- **`features/orders/services/*` does NOT live in shared.** §5 marks them "via API" reuse. That's correct but it means the actual service-layer code is in `apps/web/features/orders/services/`. If mobile ever needs to call the service directly (e.g., for offline-first), the code has to be split into "transport" (fetch wrapper) and "logic" (validation, normalization, orchestration). Cycle 32 hasn't done this split. **Fix:** during Phase 0, port one service (`features/orders/services/create.ts`) into `packages/shared/services/` as a proof-of-concept. If the split is impossible (because services use `@supabase/auth-helpers-nextjs`), document the leakage.
- **`lib/copy/` reuse claim is the easy win, but Bahasa Malaysia/Indonesian copy is currently English-only.** `lib/copy/index.ts` is reusable; the *content* is not yet localized. By Wave 2 (ID launch Q1 2027), the copy library needs i18n. **Fix:** add to Wave 2 plan: "BM + BI localization of `packages/shared/copy/`. Decide on i18n library — likely `i18next` + `react-i18next` (which works in both Next.js and RN). Do not adopt `next-intl` (web-only)."

### Sev-7 issues

- **40–50% reuse by line-count overstates value.** UI is ~60% of an RN app's LOC; UI is 0% reuse. So the reuse number sounds large but the *engineering hours saved* is smaller. Honest framing: ~5–10% engineering hours saved on Wave 1 first build, growing to ~30% on Wave 2 (when copy/utils/types are battle-tested and just lift). **Fix:** restate in §5: "Wave 1 reuse: 5–10% engineering effort. Wave 2 reuse: 30% engineering effort (if disciplined about packages/shared/ hygiene)."

---

## 6. Phase 0 spike scope creep (cycle 32 §6)

**Claim being interrogated:** §6 adds 5 mobile spikes (M1–M5) to the existing 12. M5 is "2-3 weeks wall-clock." Critical path: "M1-M3 in parallel; M5 in background; ~3 weeks total."

### Sev-9 issues

- **M5 (Play Store policy) does not run "in background."** This is the most dangerous misframing in cycle 32. Play Store policy declaration requires (a) reviewer-facing video shot on a real device with the app substantially complete, (b) Permissions Declaration form filled with actual app behavior described, (c) Data Safety form filled with actual data flows. **None of these can be filled out before M1 lands.** You cannot declare what Notification Listener does until the module exists. The Play submission therefore happens *after* M1 (5–7d) plus another 5d to integrate it into a buildable Internal Testing AAB. Realistic critical path: **M1 (5–7d) → integrate (3–5d) → submit + iterate (2–3w) = 4–5 weeks wall-clock, not 3.**
- **M5 failing at Phase 1 sprint week 8 is catastrophic.** If Play Store rejects the NotificationListener at week 8, the Android build needs the silent-degradation fallback (cycle 28 §12) wired and tested. That fallback is real code, not a config flag. Cycle 32 §4.5 footnotes "feature degrades silently to manual-share-only" — but the manual-share Android path requires a different AndroidManifest intent-filter, different onboarding coach-marks (no notification-permission walkthrough), different empty-state copy. **Fix:** add Phase 1 sprint week 1 task: "ship M5-fallback-mode in code from Day 1." Treat the NotificationListener as a feature-flag-on enhancement, not a baseline. If M5 passes, flip the flag. If it fails, the app already ships fine without it.

### Sev-8 issues

- **Wave 1 sprint week 1 is double-blocked.** §9 says "Wave 1 sprint week 1 is blocked unless: M4 PowerSync decision documented + M5 submitted." But M5 takes 4–5 weeks per above; M4 takes 2 days. So sprint week 1 is **always** blocked by M5 unless M5 starts before sprint week 1. **Fix:** rename "Phase 0 spikes" to acknowledge two phases — "Phase 0a (pre-build, weeks -4 to 0): M5 submission scaffolding, M4 cost compare. Phase 0b (build week 1-3): M1-M3 spikes parallel with feature work." The scaffolding for M5 (privacy-only build, reviewer video script, Data Safety filling) can happen during the *current* validation cycle (interview, smoke test) without code.

### Sev-7 issues

- **M2 sequencing hazard.** §6 says "M2 (sensory signature) — 5d after M1 lands." But M1 and M2 share zero code surface — M1 is `NotificationListenerService` (Android Kotlin), M2 is `CHHapticEngine + Vibrator` (cross-platform). They can run in true parallel if you have one mobile lead doing both, just sequenced inside one engineer's calendar. **Fix:** clarify §6 critical path: "M1, M2, M3 are mutually independent. Order is: whoever owns Android writes M1 first, then M2's Android side. Whoever owns iOS writes M2's iOS side day 1." With 1 mobile engineer, sequence M1→M2-iOS→M2-Android→M3 = 3 weeks. With 2 mobile engineers, sequence in parallel = 1.5 weeks.

---

## 7. Wave 2 ID fork strategy (cycle 32 — ABSENT)

**Claim being interrogated:** Cycle 32 mentions "Wave 2 ID" 4 times but never specifies the fork architecture for CatatOrder.

### Sev-9 issues

- **Separate App Store / Play Store listing is undeclared.** CatatOrder is a separate brand per CLAUDE.md ("sister products, not a unified codebase"). A separate brand = separate iOS bundle ID = separate Apple Developer record (or at least separate App ID). **Fix:** add §11 "Wave 2 fork strategy":
  1. **Bundle IDs:** `com.tokoflow.app` (MY) + `com.catatorder.app` (ID). Two App Store listings, two Play Store listings.
  2. **Codebase:** ONE monorepo, but `apps/mobile-tokoflow/` and `apps/mobile-catatorder/` are two Expo apps sharing `packages/shared/` and `packages/native-modules/`. NOT one app with locale switch — Apple/Google reject "duplicate listings" if they detect it.
  3. **Supabase project:** Two projects (`yhwjvdwmwboasehznlfv` MY + `<new>` ID). Separate auth, separate data, separate compliance posture (PDPA MY vs UU PDP ID). Confirmed in CLAUDE.md.
  4. **Custom Expo Modules:** Both apps consume the same `packages/native-modules/expo-*` packages. Module behavior is locale-aware via JS arg, not via build-time flavor.

### Sev-8 issues

- **Divergence governance is unwritten.** Once both apps ship, MY-side wants to add Live Activities (Wave 2 Pro), ID-side wants Sahabat-AI integration (Wave 2 base). What does shared code look like at month 24 when MY-side is on SDK 56 and ID-side is on SDK 55? **Fix:** mandate "monorepo locks Expo SDK at the same version for both apps." If MY needs to upgrade for a feature, both apps upgrade together. Diverging SDKs in a monorepo is a 2-week recurring tax forever.
- **Brand assets divergence.** Tokoflow icon, splash, color = green/warm. CatatOrder icon, splash, color = different (per existing CatatOrder repo). Shared NativeModules need to render generic visuals. **Fix:** sensory signature visual keyframes parameterize on a `brandColor` prop passed from JS. NativeModule is brand-agnostic.

### Sev-7 issues

- **OTA update channels: 4 not 2.** §2 EAS row mentions "per-channel (dev / preview / prod-ios / prod-android)." For the dual-brand world: dev / preview / prod-ios-tokoflow / prod-android-tokoflow / prod-ios-catatorder / prod-android-catatorder = 6 channels. Cycle 32 should pre-declare this; channel reorganization at month 14 is painful.

---

## 8. Tooling decisions glossed over (cycle 32 §2 — Dev tooling row)

**Claim being interrogated:** §2 makes 5 tool picks with 1-line justification. Several need defending.

### Sev-8 issues

- **Maestro vs Detox — defensible but underspecified.** Cycle 32 says "Maestro preferred 2026" with no citation. The actual tradeoff: Maestro is YAML, easier to write, weaker assertions, runs flakier on real devices than Detox. Detox is JS, harder to set up, more reliable, deeply integrated with RN runtime. **Fix:** declare in §2 "Maestro for cross-platform smoke tests (login, capture, link payment, undo). Detox for module-level tests of `expo-sensory-signature` and `expo-notification-observer` because Detox has access to RN dev menu and timing assertions Maestro lacks." Use both, with Maestro as the daily-runner.
- **Sentry vs Bugsnag vs PostHog Crash — undefended.** §2 picks Sentry. Reasoning: Sentry has the best RN+Expo integration in 2026 (per cycle 31 Q5 sources), Session Replay support, and integrates with EAS dashboard. Bugsnag is older but RN integration has lagged since 2024. PostHog Crash is too new (Q4 2025 GA). **Fix:** add 1-line justification in §2.
- **Drizzle vs Prisma — Prisma's RN story is broken.** Defended in §3 of this critique already. Add citation in cycle 32 §2.
- **Zustand vs Redux Toolkit — Zustand correct.** Zustand is 2KB, no boilerplate, RN-friendly. RTK ecosystem advantage matters for shops with shared web+mobile Redux state — we don't have that. **Fix:** §2 should say "React Query for server-cached state (orders, products, customers list); Zustand for ephemeral UI state (undo stack, sensory window, capture-flow progress); no Redux." Cycle 32 mentions "Zustand or React Query" — that's a typo for "Zustand AND React Query." They serve different roles, use both.

### Sev-7 issues

- **React Query implicit but not declared.** §2 says "React Query (cached server state)" parenthetically. This needs to be a first-class row. **Fix:** add to §2 "Library: `@tanstack/react-query` v5+. Used for: server cache (`/api/orders`, `/api/customers`), optimistic mutations, refetch on app focus."
- **React Hook Form + Zod is right but config-needs-care.** Mobile keyboards are different from web. RHF on RN needs `Controller` for every input (no native `<input>` ref). **Fix:** acknowledge in §2.

---

## 9. Team capability honesty (cycle 32 §1, §6)

**Claim being interrogated:** Wave 1 budget is 8 weeks. CLAUDE.md context implies a 1-2 person team. Stack is wide.

### Sev-9 issues

- **The stack is wider than the team.** RN 0.81 + Expo SDK 54 + 28 libraries + 2 custom Kotlin/Swift modules + Drizzle + PowerSync + Whisper + Sentry + Maestro + Detox + iOS share extension + Live Activity (Wave 2) + Lock Screen widget + OTA + cron + i18n — this is a stack that Coinbase staffs with a team of 8 dedicated mobile engineers. A 1-2 person team cannot operate this surface long-term. **Fix:** declare an explicit cut list. Wave 1 ships:
  - One platform (start iOS only — fewer permission landmines) OR Android only (matches Bu Aisyah's Redmi reality)
  - No `expo-share-extension` (Path 4 deferred to Wave 1.1)
  - No `expo-sensory-signature` custom module (use `expo-haptics` + plain `<Animated.View>` + `expo-audio` 3 separate calls; accept 100ms drift; document degradation)
  - No PowerSync (manual IDB queue per cycle 28 §1.4 — known-quantity engineering, no vendor risk)
  - No Live Activity (already deferred per §2)
  - Only `expo-notification-observer` is undroppable (it's *the* feature)

  The cut list reduces 28 libs → 18, 2 custom modules → 1, and saves ~3 weeks of the 8-week Wave 1 budget for actual feature work.
- **No declared "if velocity is half-projected, what gets cut" plan.** Cycle 32 assumes 8-week Wave 1 hits. Realistic shipping: 50% of 8-week plans ship in 12-16 weeks. **Fix:** §6 should declare the cut order: "If week 6 reveals slip, cut in this order: (1) `expo-share-extension`, (2) Android NotifListener heartbeat (ship without auto-revocation detect), (3) sensory-signature multi-modal (degrade to haptic-only), (4) iOS support (ship Android-first, iOS in Wave 1.1)."

### Sev-8 issues

- **Hiring contingency.** If the 1-person team becomes a 0-person team (founder + AI agent collaboration model is fragile), the codebase needs to be approachable to a contractor at $80/hr. Drizzle is fine. PowerSync is not — niche knowledge. Custom Expo Modules are not — niche knowledge. **Fix:** maintain a "contractor ramp" doc — `docs/dev/CONTRACTOR_RAMP.md` — describing: tooling stack, where the custom modules live, how to test them, who knows the answers. Update at every cycle.

---

## 10. Things cycle 32 didn't mention but should have

### Sev-9 issues

- **Internationalization library is absent.** §2 has no i18n entry. By Wave 2 we need BM + BI. Adding i18n to a 6-month-shipped app is a 2-week refactor. Adding it from day 1 is a 1-day decision. **Fix:** §2 add row "i18n: `i18next` + `react-i18next`. Locale files in `packages/shared/locales/{en-MY,ms-MY,id-ID}/`. Default locale at app boot from device locale, override in settings."
- **Deeplink architecture is undeclared.** Universal Links iOS + App Links Android + custom-scheme deeplinks all need cohesive routing. With `expo-router` this is config-driven but the policy decisions are not made. What link opens what? `tokoflow://order/123` vs `https://tokoflow.com/order/123` — both? Auto-redirect from web to app if installed? **Fix:** §2 add subsection "Deeplinks: Universal Links via `apple-app-site-association` hosted on `tokoflow.com`. App Links via `assetlinks.json`. Scheme `tokoflow://` for in-app linking. `expo-router` handles routing. Wave 2 adds `catatorder://` + `catatorder.com/.well-known/`."

### Sev-8 issues

- **Code signing & provisioning profile management.** EAS handles this for managed Expo, but:
  - Apple Developer Program account: who is the holder? (must be a registered company per Apple's policy for $99/year Org account — Sdn Bhd registration is on the Phase 0 list, gates this.)
  - Google Play Developer account: $25 one-time, similar org-account need.
  - Code signing key custody: EAS has the option of "managed" or "BYOC" credentials. Managed is convenient but if EAS is sunset/account-locked, you need to recover the key from EAS export. **Fix:** §2 add "Apple Developer Org account holder: Sdn Bhd. Google Play Developer org: Sdn Bhd. EAS credentials: BYOC (bring your own certs). Cert backup: `~/base/vault/credentials/tokoflow-mobile-signing/` per CLAUDE.md credential pattern."
- **Localized image assets per market.** Tokoflow icon and splash for MY; CatatOrder icon and splash for ID. Each App Store / Play Store listing needs locale-specific screenshots. **Fix:** add to Wave 2 plan: "screenshot generation from production app, 6.5\" iPhone + 6.7\" iPhone + Android phone + Android tablet, en-MY + ms-MY + id-ID locales = ~36 screenshots."

### Sev-7 issues

- **Privacy: certificate pinning for `/api/*`.** Tokoflow handles money. Without cert-pinning, a network-level MITM with a rogue CA can intercept payment traffic. RN has `react-native-cert-pinner` and Expo has community plugins. **Fix:** §2 add "TLS cert pinning via `react-native-ssl-pinning`. Pin Vercel + Supabase TLS certs. Rotate quarterly. Document pin update procedure."
- **Analytics SDK undeclared.** §2 says "existing `track()` → `/api/track` endpoint — reused from web." This works for synchronous events but mobile needs offline event queueing, screen-tracking, install-attribution. **Fix:** §2 add "Analytics: PostHog RN SDK for screen tracking + offline queue + install-source detect. Continue posting to `/api/track` for cross-channel correlation. PostHog free tier covers 1M events/mo."
- **Asia/Kuala_Lumpur timezone in JS Date is fragile.** RN's `Intl` support varies by JS engine version. Hermes 0.13+ has limited Intl. **Fix:** §2 add "Date library: `dayjs` + `dayjs/plugin/timezone` with `Asia/Kuala_Lumpur` and `Asia/Jakarta` as default tz."

---

## Summary — sev-9 issues (must fix before Phase 1 sprint week 1)

1. **Document Expo→bare exit cost** per coupled lib (sec. 1) — without this, Expo lock-in is open-ended.
2. **Custom modules need OS-deprecation + SDK-upgrade governance** with budgeted maintenance hours/year (sec. 2).
3. **Custom modules need real test strategy** (Maestro/Detox device-lab, not just demo) (sec. 2).
4. **Vendor-copy + sponsor `whisper.rn`; swap `expo-share-extension` to Expensify; defer Live Activity** (sec. 3).
5. **M5 Play Store cannot run in background — re-sequence as 4–5 week wall-clock starting before sprint week 1** (sec. 6).
6. **Wave 2 fork strategy needs to be declared now** — bundle IDs, separate Supabase, dual-app monorepo (sec. 7).
7. **Cut the stack to match team size** — declare 18 libs / 1 custom module Wave 1, defer the rest (sec. 9).
8. **i18n + deeplinks need first-class slots in §2** (sec. 10).

## Sev-8 issues (must address during Phase 1)

1. `expo-router` lock-in vs `@react-navigation/native` (sec. 1).
2. EAS Update OTA portability story (sec. 1).
3. `expo-notification-observer` is Android-only — name it explicitly (sec. 2).
4. `expo-sensory-signature` is one module with two platform impls, not two modules (sec. 2).
5. PowerSync vendor-runway trigger (sec. 3).
6. Drizzle exact-version pin (sec. 3).
7. Drop `react-native-haptic-feedback` — fold into custom sensory module (sec. 3).
8. Drop monorepo for Wave 1; use single-repo with shared `lib/` (sec. 4).
9. Don't promote server-only `lib/billplz/`, `lib/myinvois/` to packages (sec. 4).
10. Auth session management does NOT port cleanly — write `packages/shared/auth/` interface (sec. 5).
11. Service-layer code reuse needs split into transport vs logic (sec. 5).
12. Phase 0a vs Phase 0b: M5 scaffolding starts pre-build (sec. 6).
13. Wave 1 sprint week 1 currently double-blocked (sec. 6).
14. Wave 2 SDK lockstep mandate (sec. 7).
15. Brand assets parameterization for shared NativeModules (sec. 7).
16. Maestro + Detox both, with declared roles (sec. 8).
17. Apple/Google developer accounts pending Sdn Bhd; EAS BYOC credentials with vault backup (sec. 10).

## Score (0-10)

| Dimension | Score | Note |
|---|---|---|
| (a) Stack-A defensibility long-term | **7** | Stack pick is right; lock-in treatment is shallow |
| (b) Library risk audit | **5** | Dependencies listed, risks not surfaced |
| (c) Custom module governance | **4** | Spike planning present; lifecycle planning absent |
| (d) Monorepo fit | **5** | Monorepo is plausible end-state, premature for Phase 0 |
| (e) Wave 2 fork strategy | **3** | Mentioned 4 times, never specified |
| (f) Overall execution readiness | **6** | Cycle 32 is a v0.7 platform doc — needs cycle 34 to fold these critiques |

**Average: 5.0/10** — below the 9.0 convergence target. Cycle 34 (MOBILE_BUILD_HYPOTHESIZE) must integrate these sev-9s and sev-8s before cycle 35 produces the canonical MOBILE.md.

---

**Word count:** ~2,950 words. Cycle 33 architect persona complete.
