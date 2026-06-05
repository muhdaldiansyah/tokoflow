# Cycle 022 — Norman/Wroblewski UX Critique of UX-C

> Reviewer lens: Norman heuristics + Wroblewski thumb-zone/mobile-first. Subject: 35-45 yo MY/ID mompreneur, mid-Android/older iPhone, frequent one-handed + interrupted use.

## Heuristic-by-heuristic findings

**1. Reachability (thumb zones).** Bottom-center mic FAB is *acceptable* for 6.1" devices but degrades on 6.7" Android (Galaxy A-series, dominant in MY mid-tier). Wroblewski's thumb-zone map shows the natural one-handed arc is bottom-trailing (right for right-handers, ~75% of users). Bottom-center forces a slight ulnar deviation when phone is held low. Recommendation: keep FAB visually centered for symmetry/discoverability but offset the *hit-target* 8–12dp toward the dominant-hand side, OR allow user to pin left/right in onboarding (one tap, no settings dive).

**2. Fitts's Law trade-off.** Large mic FAB = correct (large target, near-edge = effectively infinite via screen-edge clamp on Android). However the pinned "Now" section at TOP forces thumb travel ~600–700px to reach actionable cards (CLAIM button on Lina's QRIS row). That *inverts* Fitts on the most-frequent action of lunch rush. Severity 7. Fix: render Now-section action chips as a horizontally-scrollable strip ABOVE the FAB (bottom-third), not at the top. Top can keep the *summary count*, but actionable affordances belong in thumb-zone.

**3. Error recovery (RM 25 vs RM 250).** Spec says "voice corrections cited" but the actual flow is undefined — a serious gap. Walkthrough needed: (a) parsed card shows "RM 250" with the parsed number visually distinct (chip, not prose) so misreads are scannable; (b) tap-the-chip = inline numeric keypad (not full edit mode); (c) voice path: long-press card → "tukar dua ratus lima puluh jadi dua puluh lima" → patch event applies, card animates the diff (strikethrough → new value, 400ms). Without (a) the error is invisible until the merchant reconciles at night, by which time WA receipts are already wrong. Severity 8.

**4. Signifier clarity ("▼ Now").** Disclosure triangle is a developer convention, not a folk convention. A 40-yo non-engineer trained on WhatsApp/Tokopedia/Maybank reads "▼" as decoration or arrow-down navigation, not "tap to collapse". Severity 7. Fix: replace with an explicit pill ("Now · 2 pending  ⌃") or a card-shaped container that visually resembles WhatsApp's pinned-chat treatment. Recognition over recall.

**5. Mental model — diary-IS-DB.** This is the boldest bet and the riskiest. Every reference app she uses (WhatsApp Business catalog, Maybank2u, Tokopedia Seller) has *named tabs*: Orders, Customers, Products. Asking her to trust that "Tokoflow has no /orders screen, just a feed" violates Jakob's Law (users spend most time on other apps). Severity 8 if no scaffolding. Fix: keep diary-IS-DB as the *architecture*, but expose entity filters as chip-row at top of feed ("All · Orders · Payments · Customers") — chips are derived views, not separate screens, so DB fidelity holds while mental model gets a familiar handle.

**6. Lock-screen vs in-app consistency.** Lock-screen says "Pegang untuk cerita" (long-press); in-app FAB is tap-to-record. Two gestures for the same intent = learnability cost. Severity 7. Pick one — long-press in both surfaces is safer (prevents pocket-dial captures, matches WhatsApp voice-note muscle memory which 100% of target users have).

**7. Visibility of system status during AI processing.** Criterion #4 says "never Processing... spinner" and "card appears INSTANTLY" — good principle, but the *phantom card* visual state is unspecified. Spec needed: card appears with transcript text in full opacity + entity chips rendered as skeleton pills (shimmer 1.2s) + a hairline progress bar along card bottom edge. When parse lands, chips fade in (200ms). If parse fails, chip becomes a tappable "tap to fix" affordance. Without this spec, devs will default to spinners.

**8. Accessibility — noisy environments / non-speakers.** Voice-first with text deferred to Day 60 is an **accessibility violation** (WCAG 2.1 — multiple input modalities). Lunch rush kitchen = 75dB+ ambient; STT WER spikes. Mute users, hard-of-hearing partners helping out, women in surau-adjacent shoplots who can't speak aloud — all excluded. Severity 9. Fix: ship a minimum text-fallback from Day 1 (one tap on mic FAB = voice; long-press OR a small "abc" affordance on the FAB = keyboard). Cost is low, exclusion cost is high.

**9. Onboarding — 5 micro-tutorials in 15 min.** 15 min is *too long* for this demographic with children-interruptions. Realistic uninterrupted block is 3–5 min. Abandon-rate risk at minute 8: ~40%. Severity 7. Fix: compress to 3 micro-tutorials × 90s, gated by *first real capture* (learning-by-doing), with the remaining 2 surfaced contextually on Day 2/Day 5.

**10. Discoverability of Share-target.** Zero in-app surface = near-zero organic discovery. Default discovery rate without prompt: <5%. Severity 7. Fix: after first WA-screenshot capture detected via clipboard heuristic, show a one-time coach-mark: "Lain kali, share terus dari WhatsApp — lagi laju."

## Severity ≥7 concerns (consolidated)

| # | Concern | Severity |
|---|---|---|
| 8 | Text-input deferred to Day 60 — accessibility + noisy-environment exclusion | 9 |
| 3 | Error-recovery UX for misparsed numbers undefined | 8 |
| 5 | Diary-IS-DB violates Jakob's Law without entity-filter scaffolding | 8 |
| 2 | Pinned Now at TOP inverts Fitts for lunch-rush actions | 7 |
| 4 | Disclosure-triangle signifier weak for non-engineer | 7 |
| 6 | Lock-screen long-press vs in-app tap inconsistency | 7 |
| 9 | 15-min onboarding too long for interrupted demographic | 7 |
| 10 | Share-target discoverability near-zero without coach-mark | 7 |

## Scores

- Heuristics compliance: **6/10**
- Mental model fit: **5/10**
- Reachability + Fitts: **6/10**
- Accessibility: **3/10**
- Onboarding cognitive load: **6/10**

UX-C's *architecture* is sound; its *interaction-detail layer* is under-specified and has one accessibility failure (text fallback) that should block ship.
