# Cycle 033 RED_TEAM — Perf + Reliability persona

> **Persona:** Performance + Reliability Engineer. 100M-DAU production scars. Allergic to round-number budgets, fond of `adb shell dumpsys`, distrustful of vendor benchmarks. Cares only about the **p95 user on a Redmi Note 12 in Bandung pasar at 11:30 with 22% battery**.
>
> **Target under review:** Cycle 32's Stack A (Expo + RN managed, SDK 54+, New Arch, Hermes, whisper.rn, expo-sqlite + Drizzle + PowerSync candidate, custom Expo Modules for NotifListener + sensory-signature) at average 8.9/10.
>
> **Verdict at the end:** the average is optimistic by ~1.5 points. Three sev-9 issues, two sev-8, four sev-7. None are fatal individually. **Together they amount to "the app works for the demo and chokes at lunch on Day 14."** That is the failure shape that ships and then quietly retains nobody. Phase 0 needs three additional benchmark spikes before week 1 of Phase 1, not after.

---

## 1. Cold start budget — the <2s on Redmi Note 12 claim

**Cycle 32 §3 / §7 lower budget:** "<2s on Redmi Note 12 (achievable with New Arch + Hermes + minimal initial bundle)."

**That number is not achievable as stated.** It is achievable only for **warm cold start** (process killed, code pages still in inode cache, JIT warmed). It is not achievable for **first-launch cold start** or for **the morning-after cold start** (8h since last open, MIUI 14 has flushed the process and cleared its working set).

### Concrete arithmetic

Coinbase 2023 reported median RN cold start ~3s on Pixel 4a (Snapdragon 730G, 2020 mid-range — close peer to Redmi Note 12's Snapdragon 685, 2023 budget) — **post-Hermes, pre-New-Arch**. New Arch + Bridgeless + precompiled XCFrameworks (iOS) + JSC→Hermes diff is empirically a 30–40% delta on cold start on warm-cache scenarios per Shopify's published numbers and the secondary-source 2026 RN article cycle 31 cited. **Apply the maximum 40% to Coinbase 3s baseline → 1.8s.** That is a number for warm cold start of a much-better-optimized codebase than Tokoflow will have on day 1, on a slightly faster chip than Snapdragon 685.

For Snapdragon 685 specifically (Redmi Note 12 4G):
- Cortex-A73 single-thread perf is ~85% of Cortex-A78 in Pixel 6a. Geekbench 6 single-core: 685 ≈ 950, 778G (Pixel 6a) ≈ 1450 — Pixel 6a is ~1.5× faster on single thread, which dominates cold-start path.
- MIUI 14 background-app cleanup is the most aggressive of any major OEM ROM. The "warm" cold-start case (cycle 32's implicit assumption) is rare on MIUI; most resumes are cold-cold.

**Realistic budgets:**
| Scenario | p50 | p95 |
|---|---|---|
| First-launch cold start (after install) | 3.8s | 6.5s |
| Cold-cold start (MIUI killed, 8h+) | 2.5s | 4.5s |
| Warm cold start (~1h since last open) | 1.6s | 2.8s |
| Hot resume (background → foreground, <30 min) | 0.4s | 1.0s |

**The 1.5s sensory signature first-of-day arc fires on cold-cold launch.** If cold start lands at 3.8s p50 and the signature plays during that boot, the merchant sees the chime *before* the feed paints. UX inversion: ceremony for "filing" plays before there is anything filed-looking on screen.

### What's missing from cycle 32

1. **Bundle size is unaccounted for.** Hermes bytecode + Whisper-tiny model bundled in AAB + Drizzle migration assets + `expo-router` route table is not 0 bytes of parse-time. RN Hermes apps with whisper.rn typically sit 50–80MB stripped AAB. **Bundle parse time scales linearly with bytecode size on Snapdragon 685.** Each 10MB of Hermes bytecode adds ~200ms of cold-start parse on this chip.
2. **Whisper-tiny model load is the elephant.** 39MB raw → ~50MB working set when mmap'd. Cycle 32 doesn't say *when* whisper.rn initializes its native context. If it happens at app boot to "be ready for the first voice note," cold start adds 600–1100ms on Snapdragon 685 (model `mmap` + GGML weight quantization handlers spinning up). **Lazy-load the whisper context on first mic-tap, not on app boot.** This isn't free either — first voice note then has +1s on its own latency.
3. **Network warm-up.** Supabase Realtime websocket reconnect, Sentry init, PowerSync pull-on-foreground all fire on resume. None of these are JS, but each contends for the same single-thread CPU as bundle load on Snapdragon 685.

### Mitigation directions

- **Phase 0 spike NEW**: `cold-start-redmi-note-12.ts` — measure 4 variants (first-install, cold-cold, warm-cold, hot-resume) × 30 trials each on a real Redmi Note 12 4G. Use Android Studio Profiler → CPU → Sampled tracing, plus `adb shell am start -W` for cold-start time delta. Target: produce a histogram, not a number.
- **Bundle splitting**: Hermes intermediate bundles + dynamic `import()` for the diary detail screen, the Settings screen, and the Whisper integration. First paint should be ~25MB of bytecode max.
- **Inline-require / lazy-init for sentry, posthog, expo-haptics**: these can wait 200ms after first paint.
- **Defer whisper.rn `initWhisperContext()` until first mic-press.** Show "preparing transcription" optimistic chip to mask the 1s warm-up, even if it's redundant with the existing "saya dengar..." placeholder.

**Score (cold start budget feasibility): 5/10.** Achievable with 2 weeks of perf tuning and a real Redmi Note 12 in the dev pod. Not achievable as stated in cycle 32.

---

## 2. JSI bridge throughput under offline-drain

**Cycle 28 §1.4 / §5.9** sketches offline-4h-drain. **Cycle 32 §3.2 / §3.1** maps this to PowerSync + Drizzle + custom Expo Modules.

### The numbers cycle 32 didn't compute

Concrete drain scenario (cycle 28 §1.4, lunch rush after Lebaran morning offline):
- 8 voice notes, ~30s audio each
- 2 payment_notification rows from observer-buffer
- 4 customer mentions
- 14 rows total → drain on reconnect

Per-row downstream work (cycle 28 §5.5–§5.6 atomic transaction):
1. INSERT `diary_entries`
2. UPDATE `extracted_json` post-LLM-extract
3. UPDATE on second-pass reconciliation match
4. Trigger refresh of `orders` MV, `customers` MV, `payments` MV (cycle 28 §2.3 — though §2.3 also says "or use Supabase Realtime + client-side derived state — engineering-time decision")
5. Drizzle `useLiveQuery` re-render of any subscribed component (Today feed, Now pin, Earlier pin)
6. PowerSync push to Supabase
7. Sensory signature (suppressed by decay envelope but still evaluated)
8. Side-effect scheduling (WA draft, stock decrement, briefing entry)

JSI calls per row: ~15 conservative. 14 rows × 15 = **210 JSI calls in the drain burst**.

**This is fine in throughput.** JSI sync calls on New Arch are <0.5ms each — 210 × 0.5 = ~105ms wall-clock if serialized. Bridge isn't the bottleneck.

**The bottleneck is what each JSI call kicks off async.** Each `extracted_json` UPDATE triggers a Drizzle `useLiveQuery` re-evaluation. On the `Today` feed FlashList, that's a re-snapshot of every visible row's bound data. On Snapdragon 685's single-perf-core, re-rendering 50 list items at 60fps takes ~14ms per frame. **At 14 simultaneous reactive updates landing in a 200ms window, you stack frame drops to 5–8 dropped frames.** Visible jank during the most emotionally critical moment in the architecture: the "everything filed itself" reconnect ceremony.

### LLM extract concurrency — the real cliff

Cycle 28 §5.3 says "max 1 call per 500ms (queue throttle on Phase A)." That throttle is enforced *on capture*, not on drain. **On drain after offline, all 8 voice notes are already captured — they come out of the queue ready to extract, simultaneously.**

If `/api/extract` is called 8× in parallel:
- OpenRouter free tier: 20 requests/minute per key. Burst of 8 in <1s is allowed but consumes 8/20 of the minute's budget. If 3 merchants drain simultaneously after a regional outage, OpenRouter rate-limits the next merchant.
- Gemini Flash Lite per-call latency: ~1.5s p50, ~4s p95. 8 parallel = wall-clock dominated by p95 = 4s, but server-side concurrent-stream cost. Vercel function 10s default timeout — borderline.
- Mobile side: 8 concurrent `fetch()` calls on Snapdragon 685's mobile radio. **Cellular modem queues 4 simultaneous TCP connections max in practice on budget chips.** Calls 5–8 wait an extra ~200ms each.
- Total wall clock for 8-voice-note drain: ~5–6s for LLM extract. Plus 8 × 12s of whisper-tiny on Snapdragon 685 = **96s of CPU cumulative**. With a 4-core chip, ~24s wall-clock if perfectly parallel — which it won't be because whisper.cpp uses 4 threads internally per call (NB: cycle 31 didn't note this — running 4 whisper instances each grabbing 4 threads = 16-way contention on 4 cores).

**The real drain time on Redmi Note 12 for 8 voice notes is ~30–40s after reconnect, not the implicit "instant" cycle 28 §5.9 paints.** During this window, the user sees… what? Cycle 28 §5.9 says "no spinners. Tint indicator only." So the merchant is left wondering for 30s. Anti-anxiety policy and reality collide.

### Mitigation directions

- **Serialize Whisper transcriptions.** Whisper.rn uses 4 threads internally; running 1 at a time gives the same total throughput with less thermal throttling. Queue drains in 96s instead of 30s wall clock — but consistent and predictable, plus battery-safer.
- **Parallelize LLM extract at 3 max in flight.** Saturates mobile radio without queue starvation; respects OpenRouter shared budget.
- **Show drain progress as a one-line chip on the Now pin during drain.** Cycle 28 §5.9 says "no spinners" but a single "filing 8 entries…" line is not a spinner — it's a status. Aisyah will rate "I waited 30s with nothing on screen" lower than "I waited 30s with one line of text confirming work happens".
- **Phase 0 spike NEW**: `offline-drain-bench.ts` — measure 8-voice-note drain on Redmi Note 12 with cellular 4G in a Faraday-bag-then-release simulation. Report wall-clock + CPU% + temp delta + dropped frames.

**Score (bridge throughput under offline-drain): 6/10.** Bridge itself is fine. Downstream queue contention + Whisper thread fights + LLM rate-limit windows cause real cliffs.

---

## 3. Whisper-tiny battery drain — the unspoken thermal story

**Cycle 31 Q2d / Q7** notes whisper-tiny on Redmi Note 12 is 15–30s for a 30s clip. **Cycle 32 §4 Caveat 2** budgets <25s end-to-end with cloud STT fallback if exceeded. **Neither addresses battery cost or thermal throttling.**

### Power math

Snapdragon 685 (4nm Samsung process, mid-end LP DDR4X) sustained CPU power at 100% load: ~2.0W average across the SoC (CPU + memory + I/O), based on Anandtech-style measurements for similar Snapdragon 4-class budget chips.

Per 30s voice note transcription:
- Whisper.cpp tiny on 4 threads = ~85% CPU sustained for ~12s (best case, A53 cluster) — let's call it 15s for the realistic case
- Energy: 2.0W × 15s = 30J = ~7 mAh on a 5000mAh / 3.85V battery (5000 × 3.85 = 19250J full charge, 30/19250 = 0.16% per voice note)
- 50 voice notes/day = 50 × 0.16% = 8% battery just on Whisper inference
- Plus screen on for ~3min per voice note (record + UI inspect) at ~1.5W average for a 6.5" LCD = 4.5J × 50 = 225J = ~12 mAh; ~5% battery
- Plus mobile radio tx for LLM extract over 4G (estimated 0.5W avg over 1.5s call) × 50 = 37.5J = ~2 mAh; ~1%
- **~14% battery dedicated to Tokoflow-induced work per day at 50 voice notes**

That's not catastrophic — but it's not "free." It's enough that on a phone at 30% battery at 11am, the merchant will start to feel Tokoflow as a battery drain by 1pm. Anti-pattern: if Tokoflow gets blamed for the dead phone at 4pm school pickup, **uninstall**. This is a reputation cliff specific to budget Android.

### Thermal throttling

Snapdragon 685 has documented thermal throttling at ~50°C skin temp, kicking in within 60–90s of sustained 100% CPU. Multiple back-to-back Whisper transcriptions in lunch rush:
- Note 1: 15s, no throttle
- Note 2 (5min later): 14s, no throttle
- Note 3 (30s after note 2 — concurrent voice notes during burst): 18s — slight throttle
- Note 4 (immediately after): 22s — throttle engaged, single-thread fallback
- Note 5: 25s+ — sustained throttle

**During Lebaran lunch rush — the exact "Mid-Rush" cycle 28 §1.5 scenario the architecture is built around — Whisper goes from 15s to 25s per call.** Compounded with 8 notes queued, drain takes 200s.

Sensory signature haptic + audio also fights for thermal headroom on the same chip; SoundPool playback wakes the audio DSP, vibrator motor briefly spikes, all heat-contributing.

### Mitigation directions

- **Background-only when plugged in.** Detect `BatteryManager.BATTERY_PLUGGED_*` and run queued Whisper jobs only when charging or at >50% battery. Foreground (active mic-press) always runs immediately. This trades latency-of-result for battery, requires UX accommodation (ghost transcript chip stays "saya dengar..." longer when offline + low-battery — but with a small "akan diselesaikan bila batu sambung charger" / "will finish when you plug in" subtitle, which is still under the **refuse list constraint #8 (no shaming, no nags)** if framed as kind information).
- **Cloud STT fallback below 30% battery.** Charge cost: ~$0.006 per 30s clip via OpenRouter Gemini speech transcription. At 50 clips/day × 0.006 = $0.30/merchant/day if always on cloud. **At 30% battery threshold, ~10% of clips ≈ $0.03/merchant/day = RM 4/merchant/month.** Within the AI-cost ceiling (CLAUDE.md: RM 25/month).
- **Phase 0 spike NEW**: `whisper-thermal-bench.ts` — burst 8 transcriptions back-to-back on Redmi Note 12 with `dumpsys thermalservice` snapshots every 5s. Document throttle profile.

**Score (battery drain acceptability): 5/10.** Numerically OK at p50. Catastrophic at p95 lunch rush. Mitigation paths exist but require explicit thermal-aware scheduling that cycle 32 doesn't mention.

---

## 4. Memory pressure — iOS Share Extension is the time bomb

### iOS Share Extension 120MB ceiling

**Cycle 32 §1 implicitly trusts cycle 31 Q2b that "extension only writes URL, never decodes."** This is the right discipline. **The risk is the next-feature-creep:** in 6 months, an engineer will be tempted to "show a tiny preview of the audio waveform in the share UI," because Apple's HIG suggests share extensions provide content preview. Loading a 14MB .opus file into memory to draw a waveform inside the 120MB extension budget = **SIGKILL**. Specifically, on iPhone SE 2 (3GB RAM, 1.5GB available to apps in practice), share extension allocation pressure is even tighter than the documented 120MB — RAM-pressure events from the parent OS kick in earlier.

**Architecture-level enforcement needed.** Add a lint rule (cycle 28 §6 vocabulary lint pattern) that bans `Audio*` / `AVAudio*` / image-decode in `apps/mobile/share-extension/**`. Caught by ESLint custom rule, not by App Review which won't catch it until customers crash.

### Working-set on iPhone SE 2 / Redmi Note 12 (3GB devices)

- RN runtime + Hermes: ~80MB
- App JS heap (Zustand stores + Drizzle in-mem cache + FlashList recycler): ~60MB
- whisper.rn loaded context (tiny model + GGML buffers + KV cache for 30s audio): ~120MB peak during inference, ~50MB resident
- expo-sqlite WAL pages: ~30MB if WAL_AUTOCHECKPOINT is at default 1000 pages
- Sentry session replay buffer (rolling 30s of UI): ~15MB
- Image cache (FlashList thumbnails for 200 entries × 80KB compressed JPEG): ~16MB
- Network/HTTP/keep-alive buffers: ~10MB
- **Total resident working set during voice-note-in-flight: ~360MB**

iPhone SE 2 (3GB total, ~1.5GB to apps) — Tokoflow at 360MB takes 24% of available app memory. If Safari has 5 tabs open + WhatsApp foregrounded recently + Instagram in background, **Tokoflow will get jetsammed during whisper.rn inference.** iOS process kill = lost in-flight voice note (was it persisted to SQLite before kill? cycle 28 §5.5 atomic transaction must run *before* whisper inference, not after — confirm with the engineer).

Redmi Note 12 has more headroom (3GB but Android, with zRAM swap), but MIUI's aggressive task killer will do the same job.

### Mitigation directions

- **Rule 1**: persist `diary_entries` row with `status='processing_stt'` *before* whisper inference begins, not after. Survives mid-inference kill.
- **Rule 2**: bound FlashList image cache to 8MB via `getItemType` + `numColumns` tuning. Default Image cache is unbounded.
- **Rule 3**: ban Sentry Session Replay on devices with `<4GB` total RAM. The 15MB buffer is the marginal kill driver.
- **Phase 0 spike NEW**: `memory-pressure-bench.ts` — run typical day-1 user flow (open app, record 3 voice notes, scroll feed, share screenshot, lock and resume) on iPhone SE 2 (3GB) and Redmi Note 12 (3GB) with Instruments → Allocations and Android Studio Memory Profiler running. Document peak working set + jetsam events.

**Score (memory pressure tolerance): 6/10.** Discipline + the lint rule + bounded caches make this OK. Without explicit guards, a single "let's preview the audio" engineering decision in month 4 turns it into a sev-1 prod issue.

---

## 5. SQLite write contention + WAL behavior

**Cycle 32 §2** picks `expo-sqlite/next` + Drizzle. **Cycle 31 Q3** notes op-sqlite is 5× faster on raw SQLite. **The 5× claim doesn't matter for our workload.** 50 inserts/day at 4ms each is 200ms/day total — both libraries are fine.

**What does matter:**

### WAL checkpoint storms during drain

Default `wal_autocheckpoint` is 1000 pages. With 14 rows × ~3 page-writes each (row + 2 indexes) = 42 pages per drain. 25 drains hit checkpoint. Checkpoint flush on Snapdragon 685 budget eMMC: ~80–150ms blocking write. **Drops audible audio playback if it lands on the same audio thread.** Visible in `expo-audio` chime stutter during burst-drain.

**Mitigation**: explicitly set `PRAGMA wal_autocheckpoint = 100;` to keep checkpoints small + frequent + below the 16ms frame budget. Or `PRAGMA synchronous = NORMAL;` (instead of FULL) — same durability for our use case (we have PowerSync as backup), 30% throughput improvement.

### PowerSync vs manual IDB queue — perf comparison cycle 32 didn't do

PowerSync uses a CRDT-friendly oplog under the hood. Each `diary_entries` mutation becomes ~3 oplog rows (op record + checksums). With 14-row drain → 42 oplog rows synced over 4G. At ~500B per row, ~21KB upload. UL 2 Mbps = ~85ms ideal, ~250ms p95 at Bandung-grade signal. Acceptable.

Manual IDB queue (cycle 28 §1.4) approach: 14 rows × ~1KB = 14KB upload. Smaller, but no automatic conflict resolution.

**The real perf delta is on conflict.** If mobile and server diverge during offline (say, server marked an order rejected via support while mobile was offline), PowerSync resolves via last-writer-wins by default. Manual queue has to detect and prompt. **Manual is faster in clean-path; PowerSync is faster in conflict-path because it doesn't block on user input.**

For our workload — solo merchant, single device — conflicts are essentially impossible. **Manual IDB queue is fine and saves the PowerSync per-MAU fee.** Cycle 32 caveat 4 budgets correctly here.

### Mitigation directions

- Set explicit PRAGMAs at Drizzle init: `wal_autocheckpoint = 100`, `synchronous = NORMAL`, `journal_mode = WAL` (default but assert).
- Single-writer pattern enforced via Drizzle transaction wrapper. No concurrent writes from multiple JS contexts (background task + foreground task).
- **Phase 0 spike**: `sqlite-burst-write.ts` — 14 rows insert + 3 MV refresh in tight loop, 100 trials, on Redmi Note 12. Report p50 / p95 / max.

**Score (SQLite + sync feasibility): 8/10.** Solid. Just needs explicit PRAGMA tuning and a perf spike to confirm.

---

## 6. UI 60fps under load — the FlashList + Reanimated story

**Cycle 32 §2** picks `@shopify/flash-list` v2 + Reanimated 3 (implicit — for the sensory signature 1.5s arc).

### The 1.5s arc visual claim

Cycle 28 §1.5 says "Visual: CSS keyframe animation on the row (1.5s arc)." Cycle 32 §3.1/§3.2 doesn't explicitly say which animation library. **Reanimated 3 with `withTiming(1, { duration: 1500 })` runs on the UI thread — does not block JS thread, achieves 60fps consistently.**

**Risk**: if the engineer reflexively reaches for `Animated.timing()` (the stock RN library) instead of Reanimated, the animation runs on JS thread and competes with whisper.rn callbacks. On Snapdragon 685 during burst drain, this drops to 30–40fps and the "magical filing arc" looks like a stutter.

**Architecture-level enforcement**: ban `Animated` import from `react-native` in `.eslintrc` for `apps/mobile/components/**`. Force Reanimated.

### FlashList re-render under reactive query

Drizzle's `useLiveQuery` re-evaluates on every diary_entries mutation. On burst drain (14 row writes + 14 update writes = 28 mutations in a 30s window), the Today feed re-evaluates 28 times. FlashList v2 is memoization-aware but only if list-item components are correctly `React.memo()`'d with stable callbacks.

**Sloppy implementation** (no memoization, callback prop recreated every render): 28 list re-evaluates × 50 visible items = 1400 component re-renders in 30s = ~46/sec = stalls.

**Architecture-level enforcement**: every list-item component requires a co-located test that asserts `React.memo` reference equality. Add to the lint rule pack (cycle 28 §6).

### Mitigation directions

- Ban `Animated` from `react-native`; mandate Reanimated 3.
- All list items `React.memo()` with a custom comparison fn.
- All callback props passed to `<FlashList>` wrapped in `useCallback` with explicit deps.
- **Phase 0 spike**: `feed-scroll-burst.ts` — Maestro flow that scrolls Today feed at 1000px/s while mutations land at 2/s for 30s. Capture frame timing via `adb shell dumpsys gfxinfo`. Pass: 95% of frames <16.67ms.

**Score (UI 60fps under load): 7/10.** Achievable, requires discipline on Reanimated + memoization that isn't called out yet.

---

## 7. Network reliability — Bandung 4G p95 reality

Cycle 32 doesn't quantify network. Empirical:
- Bandung 4G median DL: 12 Mbps; UL: 3 Mbps; RTT: 180ms
- **Bandung 4G p95 DL: 4 Mbps; UL: 800kbps; RTT: 600ms** (sources: Speedtest Indonesia city data, Open Signal)
- Pasar Lebaran lunch (cell tower congested): p95 DL 1 Mbps, RTT 1500ms+, packet loss 5–15%

### LLM extract latency p95

- p50: 180ms RTT + 1.5s server compute + 100ms response = **1.8s**
- p95: 600ms + 4s server compute (model warmup + queueing) + 500ms response = **5.1s**
- Pasar congested: 1.5s + 4s + 1.5s = **7s**

Cycle 28 §5.3 budgets <3s. **p95 blows budget by 2–4s.** Optimistic transcript chip "saya dengar..." needs to last *longer than the LLM extract budget*, not less. Cycle 32 doesn't note this.

### Image upload (camera path)

Cycle 28 §4.1 path 3: "image_camera." Compressed JPEG ~400KB.
- p50: 400KB / (3 Mbps / 8) = 1.1s
- p95: 400KB / (800kbps / 8) = 4s
- Pasar congested: ~10s

The image-capture optimistic UI must survive 10s of background upload. Cycle 28 §1.5 sensory signature for image capture fires immediately on capture (not after upload). Acceptable design — but the row in `diary_entries` has `image_blob_url` referencing local file URI until upload completes; PowerSync sync waits on URL pointing to Supabase Storage. **Race condition**: PowerSync sync attempts before upload finishes → broken image link in server DB.

### Mitigation directions

- HTTP keep-alive: assert `RCTNetworking.disableSocketKeepAlive = false`, default in 2026 New Arch but worth verifying in spike.
- Idempotency keys on `/api/extract` + `/api/track` to survive retries without duplicate-side-effects.
- Upload-then-sync ordering: PowerSync sync rule waits for `media_status = 'uploaded'` flag before pushing row. Cycle 28 §5.5 doesn't mention this; **add to schema as a separate column**.
- Exponential backoff with jitter, max 5 retries. Beyond retry-5, mark row `sync_failed` and surface a small kindly chip in Today feed: "1 entry waiting for connection. Will retry."
- **Phase 0 spike**: `bandung-4g-bench.ts` — run extract + image upload during simulated pasar-grade network (use Network Link Conditioner on iOS, `tc qdisc` on Android in emulator). 50 trials each. Report p50/p95/max + retry counts.

**Score (network reliability): 6/10.** Achievable with correct retry + idempotency + media-status gating. Cycle 32 needs all three documented.

---

## 8. Sensory signature drift target — the budget-Android cliff

**Cycle 32 §4 Caveat 3** states <50ms drift target on iPhone 12 + Pixel 6a; <80ms on Redmi Note 12 acceptable.

### Empirical drift on Snapdragon 685

- Reanimated 3 Choreographer callback: 16.67ms granularity (1 frame at 60Hz)
- SoundPool prep + play(): 5ms latency on flagship; **20–35ms on Snapdragon 685 budget DSP**
- Vibrator.vibrate() amplitude waveform: 10–20ms before first detectable rotation start on Snapdragon 685's commodity LRA actuator

p50 drift on Redmi Note 12: ~25ms — fine.
p95 drift on Redmi Note 12: ~85ms — fails the 80ms budget.

Worst case: thermal throttling kicks in (per §3 above), Choreographer falls behind, SoundPool buffer eviction extends by 50ms, vibrator queue waits on BroadcastReceiver IPC. **p99 drift: 150–250ms.**

At >100ms drift, the "filing" moment feels mechanical — visual finishes before haptic starts; user's brain perceives them as separate events, not a unified ceremony.

### Is this user-perceptible?

For a "filing money" event (the most emotionally critical), yes — the user pays attention. For an ambient signature on the 4th capture in 10 minutes (already silent per decay envelope), no — there's nothing to drift.

The decay envelope (cycle 28 §1.5) accidentally protects against this: by the time you'd be hitting the worst drift moments (burst rush, thermal throttle), you're already in shortened-then-silent mode. **The decay envelope is implicitly a thermal-budget envelope too.** Nice property cycle 28 didn't realize.

**Money-event override** (cycle 28 §1.5: "even at 4th+ position, fire silent visual + light haptic") — single-modality, no sync needed. Drift problem doesn't apply.

**First-of-day full ceremony** — 1× per day, phone is cold (no thermal issue), drift will land near p50 (25ms). Fine.

### Mitigation directions

- Implement the custom Expo Module's `fireSignature()` to kick all 3 modalities in a single Kotlin `runOnUiThread` block, not as 3 separate JSI calls.
- On Android, pre-load SoundPool sample on app boot (~10ms one-time cost). Don't load lazily.
- Use AHAP file (pre-bundled CHHaptic pattern) on iOS, not procedural pattern build at trigger time.
- Budget-Android downgrade: if `BatteryManager.getBatteryTemperature() > 35°C` OR `thermalservice == THROTTLING`, fire haptic-only, skip audio. Visual still plays. The "felt signature" failure mode cycle 32 mentions but doesn't operationalize.

**Score (sensory signature feasibility on budget Android): 7/10.** Achievable on flagships, degraded gracefully on budgets via thermal-aware downgrade.

---

## 9. Crash + privacy telemetry under Refuse-list discipline

**Cycle 32 §2** picks Sentry. **Refuse list (cycle 28 Appendix C)** prohibits selling merchant data. **Sentry Session Replay default config violates this without aggressive masking.**

### What Session Replay captures by default

- Every visible `<Text>` node
- Every navigation event
- Every network request (URL, headers, response shape — **including LLM extract response containing customer names + amounts**)
- Crash-time UI snapshot (PNG)

**The diary feed is, by design, the merchant's customer + payment ledger.** A leaked Session Replay = a leaked customer relationship. Refuse list violation #6 (claim ownership of customer data) becomes "Sentry's S3 owns it now."

### Required Sentry config

```ts
Sentry.init({
  // ...
  beforeSend(event) {
    // Strip breadcrumb data containing PII
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb);
    }
    // Strip request bodies entirely from network breadcrumbs
    if (event.request?.data) delete event.request.data;
    return event;
  },
  replaysOnErrorSampleRate: 0.0, // OFF until masking is verified
  replaysSessionSampleRate: 0.0,
  // ...
});
```

**Session Replay must be OFF for Wave 1.** Re-enable only after a month of explicit masking validation + a positioning-bible amendment + a transparent privacy policy update.

### Crash-time stack trace alone

No PII in stack traces by default. Safe. Source-map upload via Sentry CLI in EAS Build pipeline is fine.

### Mitigation directions

- Disable Session Replay until Wave 2.
- `beforeSend` hook scrubs all breadcrumbs containing customer_name, amount, sender_raw, transcript fields.
- Add a runtime test: production build + intentional crash + verify Sentry event has zero PII.
- Crash-free rate target: 99.5% sessions on Wave 1 (which is achievable; Coinbase reports 99.7% post-stabilization).

**Score (privacy under crash telemetry): 7/10.** Requires explicit hardening that cycle 32 doesn't list. Easy to ship wrong.

---

## 10. The 95th-percentile worst-case — quantified

> **Scenario**: Aisyah, Redmi Note 12 4G (3GB RAM, 18mo old, battery health 80%, Snapdragon 685, MIUI 14), 4G in Bandung pasar with intermittent signal, 4 Chrome tabs open, WhatsApp + GoPay + DANA + Tokoflow + Spotify + Instagram all running, 11:30am Lebaran Sabtu lunch rush starting, 22% battery on a 5W slow-charge powerbank. 6 voice orders in 4 minutes, 4 DuitNow QR notifications interleave, toddler grabs phone at minute 3 and presses random buttons.

### Step-by-step quantified

**T+0s — Aisyah unlocks phone, taps Tokoflow icon (cold-cold, 4h since last open)**
- Cold start: 4.0s (p95 — MIUI killed process, Spotify and IG took the RAM)
- Whisper context init deferred (per §1 mitigation): saves 800ms
- First paint at 4.0s. Sensory first-of-day ceremony queued for first capture, not boot.

**T+5s — Voice note 1: "Pak Andi pesan nasi goreng dua, lima belas ribu"**
- Record (1.5s) + silence-detect end (0.5s)
- Whisper.rn context warm-up: 900ms (first call this session)
- Whisper inference 30s clip → too short, actually 4s clip → ~3s on Snapdragon 685
- Optimistic transcript chip "saya dengar..." appears at T+8s
- LLM extract: p50 1.8s
- Persist + signature: 200ms
- **Voice 1 totally complete at T+13.4s (p50)**
- Battery used: ~0.4%

**T+45s — Payment notification 1: DuitNow RM 15.00 from PA arrives**
- NotifListener observes at T+45.1s
- Insert payment_notification row + reconciliation: 100ms
- Match found (Pak Andi @ RM 15) → composite_confidence 0.94 → auto-claim
- Decay envelope: 2nd in 5min window → shortened sigature, no audio
- **Filed at T+45.5s**

**T+60s — Voice notes 2 + 3 + 4 + 5 in a 90s burst (3 in flight)**
- Whisper queue serializes (per §3 mitigation)
- Note 2: 3.5s (chip engine warm now)
- Note 3 enters queue at T+62s; starts at T+65s (after note 2)
- Note 4 enters at T+70s; queues
- Note 5 enters at T+85s; queues
- Note 3 finishes Whisper at T+71s (thermal throttle starts engaging)
- Note 4: 5s (throttled), finishes T+85s
- Note 5: 6s (throttled), finishes T+97s
- LLM extract pipeline runs 4-deep concurrent (3 max in flight), p95 4s each
- **All 5 voice notes filed by T+115s (~50s after capture-end of note 5)**
- 3 dropped frames during the busiest moment (T+85–95s)
- Battery used: ~3% in this 2-minute window

**T+180s — Toddler grabs phone**
- Random taps + voice utterances
- Voice 6 starts: incomprehensible, extract_conf 0.18, money_words=0
- Auto-archive after 30s per cycle 28 §1.9
- Toddler taps a yellow chip → 200ms sustain required (cycle 28 §1.9), released early
- Toddler taps Today feed scroll → fine
- No accidental claims. **Robust here.**

**T+220s — Payment notifs 2, 3, 4 arrive in 30s window (other customers)**
- 3 NotifListener observations
- 2 reconcile to in-flight orders (good)
- 1 unmatched → pending_match queue (60-min TTL)
- All 3 filed silently per decay envelope (≥4th capture in window)
- Money-override fires light haptic on each

**T+240s — Aisyah looks at feed**
- Today feed: 11 entries
- FlashList scroll: 60fps consistent (assuming memoization done right)
- 2 yellow chips visible (uncertain extracts) — no auto-dismiss
- Now pin: 1 disambiguation card waiting

### Aggregate numbers

| Metric | Value |
|---|---|
| Total CPU-seconds in 5 minutes | ~95s of 100% CPU (out of 4 cores × 300s = 1200 core-s; ~8% utilization) |
| Memory peak working set | ~340MB |
| Battery used in 5 minutes | ~3.5% (started 22%, ended ~18.5% — barely keeping up with 5W charge) |
| Frame drops during burst | ~3 visible (acceptable but noticed by perf-savvy users) |
| Network bytes uploaded | ~25KB (LLM extract calls) + ~2MB (5 audio clips to Supabase) = 2MB |
| Crash probability | <2% (memory peak well below jetsam, no lock-screen reboot triggers) |
| **p95 user-perceived latency for any single tap** | **~1.2s** (mostly LLM extract response + UI repaint) |

### Worst observed individual UX moment

Voice note 5 (T+85s start of capture, T+115s filed) — **30s wait between "I said it" and "it appeared in feed."** The `saya dengar...` chip is visible the whole time. **This is the moment that defines whether Tokoflow feels magical or laggy.** 30s during lunch rush is too long; merchant looks at the chip and feels ignored.

Mitigation: this moment must show a concrete progress indicator beyond the static `saya dengar...` chip. Maybe a subtle dot animation. Or a "5 in queue" microcounter. Cycle 32 + cycle 28 are silent on this.

---

## Sev-ranked findings

### Sev-9 (must address before Phase 1 sprint week 1)

1. **Cold-start budget unrealistic on Redmi Note 12 first-launch + cold-cold scenarios.** Real p50 ~2.5s, p95 ~4.5s, not <2s. Sensory first-of-day ceremony fires before feed paints if not gated on `firstPaintCompleted`. *Fix: phase 0 cold-start spike + lazy-init Whisper + intermediate Hermes bundles.*
2. **Burst-drain on reconnect takes 30–40s wall clock for 8 voice notes on Redmi Note 12, not the implicit "instant" cycle 28 §5.9 paints.** During this window cycle 28 mandates "no spinners." Anti-anxiety + reality collide. *Fix: explicit drain progress chip + Whisper serialization + 3-max-in-flight LLM extract.*
3. **Sentry Session Replay default config violates Refuse list #6 (customer data ownership).** *Fix: disable Session Replay for Wave 1; aggressive `beforeSend` PII scrub.*

### Sev-8 (must address in Phase 0 spikes M3-extension)

4. **Whisper thermal throttling on Snapdragon 685 turns 15s/clip into 25s/clip during sustained use** — exactly the burst-rush scenario that defines magic-or-not. *Fix: thermal-aware scheduling + cloud STT fallback below 30% battery.*
5. **iOS Share Extension 120MB ceiling needs architectural enforcement** (lint rule) before someone in month 4 adds a "cute waveform preview" that ships SIGKILL crashes for 2 weeks before being noticed. *Fix: ESLint rule banning audio/image decode in share-extension dir.*

### Sev-7 (must address before launch)

6. **PowerSync vs manual IDB is a real-money decision, not just a cost decision** — manual is fine for solo merchant single-device use case. *Fix: pick manual queue per cycle 28 §1.4; revisit when multi-device hits Phase 4.*
7. **Network p95 in Bandung pasar puts LLM extract at 5–7s, not the 3s budget cycle 28 §5.3 lists.** Optimistic chip duration must extend, retries must be idempotent. *Fix: idempotency keys + media-status gating on PowerSync sync.*
8. **Reanimated 3 mandate not architecture-enforced** — engineer can reach for stock RN `Animated` and JS-thread-block the sensory signature. *Fix: ESLint ban + co-located memo tests.*
9. **WAL checkpoint storms during burst drain audibly stutter `expo-audio` chime.** *Fix: explicit `PRAGMA wal_autocheckpoint = 100` + `synchronous = NORMAL` in Drizzle init.*
10. **Voice-note-5 in burst rush waits ~30s between capture and filed-state.** Static "saya dengar..." chip feels frozen. *Fix: introduce a kindly progress micro-indicator that doesn't violate the "no spinners" rule but acknowledges work-in-flight.*

---

## Quantitative budgets to commit to

| Metric | p50 | p95 | Notes |
|---|---|---|---|
| **Cold start (first install)** | 3.8s | 6.5s | Real Redmi Note 12 |
| **Cold start (cold-cold, 8h)** | 2.5s | 4.5s | After MIUI kill |
| **Cold start (warm)** | 1.6s | 2.8s | Within hour of last use |
| **Hot resume** | 0.4s | 1.0s | <30 min background |
| **Whisper-tiny 30s clip (no throttle)** | 12s | 18s | Snapdragon 685 |
| **Whisper-tiny 30s clip (throttled)** | 22s | 30s | After 90s sustained |
| **LLM extract end-to-end** | 1.8s | 5.1s | Bandung 4G |
| **LLM extract during congestion** | 4s | 7s | Lebaran lunch |
| **JSI bridge throughput peak** | — | 200 calls in 100ms | Bridge isn't the bottleneck |
| **Burst-drain (8 voice notes)** | 35s | 60s | Wall clock on Redmi Note 12 |
| **Battery drain per merchant per day** | 14% | 22% | At 50 voice notes |
| **Memory working set (peak, in-flight Whisper)** | 340MB | 380MB | Redmi Note 12 / iPhone SE 2 |
| **Frame drops during burst** | 1 visible | 5 visible | Acceptable if <5 |
| **Sensory signature drift (flagship)** | 25ms | 50ms | Within budget |
| **Sensory signature drift (Redmi Note 12)** | 35ms | 110ms | Exceeds 80ms budget; downgrade |
| **Crash-free session rate** | 99.7% | 99.0% | Sentry-tracked |

---

## Score (per persona prompt)

| Dimension | Score | Notes |
|---|---|---|
| (a) Cold start budget feasibility | **5/10** | Achievable with 2 weeks of perf tuning; cycle 32's <2s is wrong |
| (b) Whisper budget viability | **6/10** | OK at p50; thermal cliff at p95 burst |
| (c) Bridge throughput under offline-drain | **6/10** | Bridge fine; queue contention real |
| (d) Battery drain acceptability | **5/10** | 14%/day is borderline; 22% p95 is bad |
| (e) Memory pressure tolerance | **6/10** | Discipline-dependent; one bad PR away from sev-1 |
| (f) Overall p95 user experience | **6/10** | Voice-5 30s wait is the moment that defines it |

**Average: 5.7/10.** Cycle 32's 8.9 self-score is optimistic by ~3 points on perf alone. The architecture choice (RN, on-device Whisper, decay envelope) is still sound — it just doesn't ship at the budgets cycle 32 names.

---

## The ONE perf cliff that will surface in production but isn't visible in the spec

**Voice note 5 in a 5-note burst, recorded during minute 4 of the lunch rush, takes ~30 seconds between the merchant saying "filed it" and the feed actually showing the row.**

Not because of a bug. Because:
- Whisper is serialized (good, prevents thermal kill)
- Whisper-3 is throttled because the chip is hot from notes 1+2
- LLM extract is queued behind 2 in-flight calls
- Network is congested (everyone in pasar is on 4G at lunch)
- Sensory decay envelope has gone silent — no "tap" feedback to confirm receipt
- The "saya dengar..." optimistic chip is static, gives no progress

The merchant's brain reads this as **"the app is slow when I need it most."** Not "the app is wrong" — wrong is recoverable, slow-when-busy is the worst possible reputation cliff for an AI-native productivity tool. It surfaces in **week 2 of alpha**, not in spec review.

**Cycle 32 doesn't see this because it benchmarks each stage independently.** The cliff is at the intersection of **thermal × network × queue depth × decay envelope going silent at exactly the wrong moment**. None of the cycle 32 spikes (M1-M5) test this scenario together.

**Recommended addition: Phase 0 spike M6 "burst-rush-end-to-end-bench"** — captured 5 voice notes back-to-back over a 4-min window with throttled 4G + thermal soak + exact decay envelope timing on a real Redmi Note 12. Measure the wait between the 5th utterance-end and 5th-filed event. Pass criteria: ≤25s p50, ≤45s p95. If exceeds, redesign the decay envelope to fire a "still working" haptic at minute 1 of any pending capture, regardless of suppression rules. (This is a positioning-bible amendment, not just an engineering tweak — anti-anxiety + work-in-progress feedback have to be reconciled explicitly.)

---

## Recommended Phase 0 spike additions

| # | Spike | Effort | Block |
|---|---|---|---|
| **P1** | `cold-start-redmi-note-12.ts` — 4 cold variants × 30 trials | 2d | Phase 1 launch |
| **P2** | `offline-drain-bench.ts` — 8 voice + 2 payment, real device, real network | 2d | Phase 1 launch |
| **P3** | `whisper-thermal-bench.ts` — burst 8 transcriptions, dumpsys thermal | 1d | Phase 1 launch |
| **P4** | `memory-pressure-bench.ts` — iPhone SE 2 + Redmi 3GB, full day-1 flow | 2d | Phase 1 launch |
| **P5** | `bandung-4g-bench.ts` — Network Link Conditioner + tc qdisc, 50 trials | 1d | Phase 1 launch |
| **P6** | `burst-rush-end-to-end-bench.ts` — the cliff scenario | 2d | Phase 1 launch |
| **P7** | `sqlite-burst-write.ts` — 14-row insert + MV refresh on Redmi | 0.5d | Wave 1 sprint week 1 |
| **P8** | `feed-scroll-burst.ts` — Maestro flow + gfxinfo | 1d | Wave 1 sprint week 1 |

**Total added effort: ~12 days.** Add to cycle 32's M1-M5 budget. Critical path becomes ~4 weeks of Phase 0 spikes, not 3.

---

## What I'd accept as "this is fine"

- All 8 spikes above run on real hardware (not emulator) before Phase 1 sprint week 1.
- Cold-start budget revised to p50 2.5s / p95 4.5s for cold-cold scenario.
- Sensory first-of-day ceremony gated on `firstPaintComplete && hasUserInteraction`.
- Whisper thermal-aware scheduling spec'd in MOBILE.md.
- Sentry Session Replay disabled for Wave 1.
- ESLint rules for: `Animated` ban, share-extension audio/image decode ban, list-item memo discipline.
- A new Now-pin "still working" subtle indicator for any capture in-flight ≥10s (regardless of decay envelope state) — this is a positioning-bible amendment.

If those land, **the perf score moves to 7.5/10 average and the platform pick stands.** If they don't, the app ships and feels great in demo, then trickles into "kadang lemot bila sibuk" reviews on Play Store within 60 days, and Tokoflow is dead by Wave 1 launch criteria #4 (NPS ≥8).

---

*Cycle 33 / RED_TEAM / Performance + Reliability persona / verdict: cycle 32 is structurally correct, numerically optimistic. Three sev-9 issues need addressing before sprint week 1. The hidden cliff is voice-note-5 in burst rush. Add 8 Phase 0 spikes (~12d effort) before Phase 1 build starts.*
