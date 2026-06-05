# Cycle 022 — Jobs Critique (UX Architecture)

> Reviewing UX-C adaptive-zoom feed. Cutting tone. Said SHIP at 18, now back with a knife.

---

## 1. UX-C adaptive-zoom — elegant or Notion?

It's **on the knife's edge**. Five collapsible sections (Now / Today / Yesterday / This week / This month) is one section too many. That's Notion creeping in. The mental model "scroll your life" dies the moment a merchant has to *decide* which bucket to expand. **Cut "This week" and "This month"** — they're scroll-reachable, not section-reachable. Two sections + infinite scroll. That's elegant. Five accordions is a settings page wearing a feed costume.

## 2. "Now" pinned section vs separate tab

**Genuinely better.** Section-as-pin preserves the diary mental model — and the "tap a Now card → scrolls to source voice note" is the move. That single behavior earns the architecture. But: do not let "Now" become a dashboard. If it grows action chips, status badges, multi-line summaries — kill it. Now = max 3 cards, each one a single sentence. If there are 7 pendings, show 3 + "more". Restraint.

## 3. Visual hierarchy of the ASCII layout

**Top-bar with "Cerita je." brand text + gear is wrong.** You don't put your own name on the home screen. iPhone home doesn't say "iPhone." Cut the brand text. Gear moves to a long-press on avatar/initials top-right. Now the eye lands on **Now** first, which is the entire point. Hierarchy after cut: Now (eye lands) → Today (peripheral) → mic FAB (thumb knows). Three things. Not five.

## 4. Mic FAB at bottom-center

Bottom-center is correct **for thumb reachability** on a 6.7" phone Sari is holding while frosting a cake — but the *primary* gesture should not be a button. **The lock-screen long-press IS the primary gesture.** The in-app FAB is the *secondary* fallback when she's already inside. So: keep FAB, but stop calling it primary. Pull-down-to-refresh = mic is too clever — discoverability tax, gesture conflict with iOS native pull. No.

## 5. Lock-screen surface

**Too dense.** Five elements (time, app name, mic prompt, claim card, summary line). Cut "Cerita aja (CatatOrder)" — the long-press affordance IS the brand. Cut "3 pending today" — if there's a claim card, the claim is the only thing that matters in that moment. Lock-screen = **one job**: claim payment OR start capture. Two states, never both visible.

## 6. Scene-aware adaptation

**Half magical-thinking.** "Lunch rush detected (5+ captures in 30 min)" — fine, that's measurable. "Evening reconcile after 6pm" — fine, that's a clock. But "FAB pulses subtly" during lunch rush is the kind of feature engineers love and merchants ignore. **Cut the pulse.** Scene-aware = content reorder only, never animation changes. Behavior consistency > clever responsiveness.

## 7. Anti-anxiety enforcement

Sufficient on the *what we don't ship* side. Insufficient on chrome. Cut: section counts ("Today (5)") — a number next to a label is a quota in disguise. Just "Today". She'll see how many when she looks.

---

## Scores

- **ELEGANCE**: 7/10 — too many sections, brand text on home, count badges
- **HIERARCHY**: 8/10 — Now-pin earns it, but top-bar steals attention
- **GESTURE**: 9/10 — lock-screen long-press is right; FAB is honest fallback

## DELETE

1. "This week" + "This month" sections (scroll-reachable)
2. "Cerita je." brand text in top-bar
3. Section count badges ("(5)", "(8)")
4. "3 pending today" summary on lock-screen
5. FAB pulse animation during lunch rush
6. Settings gear in top-bar (move to avatar long-press)

## 9 → 10 suggestion

**Delete the top-bar entirely.** Feed starts at the status bar. Now-pin floats with a subtle scroll-on-overscroll behavior. Gear gone. Brand gone. The app forgets it's an app — which was the original goal. *That's* the iPhone-home moment.

---

## Verdict

**REWORK** — architecture is right, ornament is wrong. Cut six things, ship the bones.
