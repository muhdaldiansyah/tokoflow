# Cycle 014 — Jobs critique (regional MY+ID)

## 1. Dilute or amplify?

**Amplify — but only because Bahasa is a structural accident, not a strategy.**

I usually hate "international from Day 1." iPod was US-only for a reason: focus. But here the magic moment is *voice in Bahasa*. The product literally can't tell BM from BI at the input layer. That's not "we expanded" — that's "we noticed we already shipped it." Different from going US→JP, where you rebuild everything.

Caveat: amplification is *narrative*, not *operational*. Day 1 is still MY-only. Don't confuse "the story scales to ID" with "we ship to ID." You don't.

## 2. Sister codebases — pragmatic or two products?

**Pragmatic. For now.** Tax/payment compliance forks cleanly: SST≠PPN, MyInvois≠e-Faktur, Billplz≠Midtrans. Forcing one codebase here = the cross-platform Mac/PC abomination Sculley shipped. Two binaries, one soul is correct.

Watch the seam: the moment voice-corpus learnings stop flowing cross-market, you have two products wearing one brand. Ship a shared `voice-core` package by Day 60 or you've lied to yourself.

## 3. Day 1 cut + Wave 2 staging — honor completeness or leak MVP-thinking?

**Honors it.** 13 features in 6-8 weeks for ONE market is finished thinking for that market. That's the iPod move. Wave 2 ID Q1 2027 is sequential ship of *another* finished product, not "we'll add features later." Different axis.

The MVP-leak would be: ship MY with 8 features and call it "v1." You're not. You ship 13, all load-bearing, all polished. Pass.

One leak: "Day 30 text-input escape hatch" feels like a cop-out you've already pre-negotiated. Cut it from the roadmap entirely or ship it Day 1. Don't pre-apologize.

## 4. The two demos — portable or translated?

**90% portable, 10% lazy.** Same beat sheet, same Shazam reveal, same WA reply tap, same closing customer ack. That's the *product* working — good. But Bu Aisyah's nasi lemak at 11:15 and Ibu Sari's 8 box transfer DANA at 09:30 reading like the same story with translated nouns is the tell. Real cultural fluency would surface a moment ID has and MY doesn't (QRIS confirm sound, "udah masuk" relief, the rendang-bumbu hand). The demo currently performs symmetry; it should perform difference *within* identical mechanism.

## 5. "Regional Bahasa moat" — insight or marketing-speak?

**Half real.** Real part: voice-first is genuinely more portable across BM↔BI than form-based. That's a structural claim, defensible. Marketing-speak part: "any English-first voice product needs to rebuild corpus" — true, and irrelevant. Newo isn't coming for Bu Aisyah. The actual competitor (Bukku, Mokapos) is already Bahasa-native by default. The moat isn't language; it's *voice mechanism + diary mental model* in Bahasa. Stop dressing it up.

USD 80B TAM — fine for a Series A deck. Don't put it in the manifesto.

## Re-score

- **RADICALISM: 9/10** (unchanged from round 3 — regional doesn't add radicalism, it adds reach)
- **GASP-FACTOR: 9/10** (unchanged — same mechanism; gasp doesn't compound by translating)

Honest: regional adds *strategic surface*, not magic. Don't inflate.

## ONE concrete suggestion: 9 → 10

**Rewrite Demo 2 so ID does something MY structurally cannot.** Specifically: Ibu Sari pays via QRIS, the bank-notification SMS auto-photo-ingests on lock, and the entry posts before she unlocks. MY has no QRIS-equivalent universal-rail; that beat is uncopyable in MY. Now the regional positioning isn't "same product, different currency" — it's "the product takes a *different shape* in each market, mechanism identical." That's the iPhone-moves-cellular-from-carrier-to-OS move at the demo layer. Earns the 10.

## Verdict

**SHIP** — regional framing is honest, sister-codebase split is correct, Day 1 cut is finished. Fix Demo 2 to perform *difference* not symmetry, and kill the Day 30 text-escape pre-apology.
