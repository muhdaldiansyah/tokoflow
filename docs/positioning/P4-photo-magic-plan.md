# P4 · Photo Magic — Implementation Plan

> One-photo onboarding ("From snap to sold"). Phase 1 centerpiece per
> [`02-product-soul.md`](./02-product-soul.md#1-the-photo-magic) and
> [`06-roadmap.md`](./06-roadmap.md) (Jun–Jul 2026).
> Effort estimate: **8–12 working days** for a shippable v1.

---

## Goal

Replace the current 3-step setup form (category → products → store link) with a
single screen built around one button: **a big camera icon**. The merchant takes
one photo of their kitchen / counter / dagangan; within ~3 seconds Gemini Flash
Lite (multimodal, via OpenRouter) returns inferred shop name, story, and 3–5
products with peer-benchmarked prices and beautified images. The merchant
confirms with "Begini sudah pas?" and the shop is live.

This is the *only* iconic interaction in the
[soul doc](./02-product-soul.md#the-5-iconic-interactions) that current code
fundamentally contradicts. Vibrate, Swipe Forward, Voice Ask, and Evening
Embrace already exist in some form. The Photo Magic does not.

---

## What exists today

| Surface | State | Reusable? |
|---|---|---|
| `app/(onboarding)/setup/page.tsx` (442 LOC) | Multi-step form: category grid → product list → slug picker. English copy, MY-localized lookups. | **Replace, do not extend.** Keep as `/setup/manual` fallback for users who decline the camera. |
| `app/api/image/parse/route.ts` (188 LOC) | Already calls Gemini multimodal via OpenRouter to parse a single order screenshot into `{ items, customer, total }`. | **Reuse the OpenRouter wrapper, fork the prompt.** New endpoint, new schema — order-parsing is a different shape from shop-bootstrap. |
| `lib/utils/slug.ts` | `generateSlug` from name + reserved-slug check. | Reuse for auto-slug. |
| `config/category-defaults.ts` | 28 entries mapping `business_category` to mode + sample products + suggested categories. | Reuse for inference fallback (e.g., if Gemini misses, fall back to category defaults). |
| `lib/utils/peer-benchmark` (`/api/benchmark`) | Density-gated peer pricing, ≥10 users/cluster. | Reuse for the price suggestion column. |
| `config/site.ts`, marketing landing | Hero is "From snap to sold" — already promises this experience. | Implies the cost of *not* shipping this is now reputational, not just product. |

---

## Scope of v1 (must-have)

1. **One-screen camera entry** at `/setup` (replaces current first step)
   - Big circular camera button center-of-screen, soft pulse animation
   - Tap → `<input type="file" capture="environment" accept="image/*">` (mobile camera) or `getUserMedia` (desktop fallback)
   - "Or describe your shop" voice/text fallback below the camera as smaller secondary CTA
2. **`POST /api/onboarding/photo-magic`** — accepts one image, returns:
   ```ts
   {
     suggestedName: string;          // e.g. "Aisyah's Kitchen"
     suggestedSlug: string;          // generateSlug(suggestedName), reserved-checked
     story: string;                  // 2–3 sentence first-person story
     businessCategoryId: string;     // matches business_categories.id
     products: Array<{
       name: string;
       priceMyr: number;             // peer-benchmarked
       category: string | null;
       imagePrompt?: string;         // optional regenerate prompt
     }>;
     confidence: "high" | "medium" | "low"; // for "want to try another photo?" prompt
   }
   ```
3. **Preview screen** — shop card with name + story + 3–5 product cards. Each
   editable inline (single tap to fix a typo). One primary CTA: "Begini sudah pas?"
   → calls existing services to persist profile + products + slug, then redirects
   to dashboard.
4. **Manual fallback** at `/setup/manual` — preserve current 3-step flow verbatim
   for users who decline the camera or whose photo Gemini can't parse confidently.
5. **One-tap share** post-confirm — already in current setup at the "link ready"
   step, port copy to the new finish screen.

## Out of scope for v1 (deferred)

- AI photo enhancement (`02-product-soul.md` describes "auto beautify photos") —
  v1 uses raw camera output, beautification is a separate P-task.
- Voice setup fallback inside Photo Magic — there's already a `/api/voice/parse`
  endpoint, but wiring it as a parallel intake is a v2 add-on. The voice ask
  feature is already a separate Phase 2 mobile-app deliverable.
- IG/TikTok/WA auto-share — current setup has clipboard copy, leave as-is.
- Re-onboarding existing merchants — Photo Magic is for first-run only. Existing
  users keep their current data.

---

## Implementation plan (11 chunks)

| # | File / area | Effort | Notes |
|---|---|---|---|
| 1 | `lib/onboarding/photo-magic-prompt.ts` | 0.5 day | System prompt for Gemini multimodal — MY business vocab, RM pricing, +60 phone, MYT timezone. Mirror the spirit of `app/api/image/parse/route.ts` but for shop bootstrap. |
| 2 | `app/api/onboarding/photo-magic/route.ts` | 1 day | New endpoint. Accepts `multipart/form-data` with `image`. Calls OpenRouter Gemini Flash Lite. Validates JSON shape with Zod. Cross-checks slug against reserved list. Returns 422 on low confidence so client can offer manual fallback. |
| 3 | `app/api/onboarding/photo-magic/persist/route.ts` | 0.5 day | Confirm step — accepts the (possibly edited) preview payload + image storage path, writes profile, products, slug atomically. Idempotent on user_id. |
| 4 | `features/onboarding/services/photo-magic.service.ts` | 0.5 day | Thin client wrapper for the two endpoints. |
| 5 | `app/(onboarding)/setup/page.tsx` rewrite | 2 days | New camera-first screen + preview + edit-in-place + confirm. Replaces existing multi-step form. |
| 6 | `app/(onboarding)/setup/manual/page.tsx` | 0.5 day | Move the existing 442-LOC page here unchanged as fallback. |
| 7 | Image upload handling | 1 day | Resize client-side to 1024×1024 max before upload (cost + latency). Save to existing `product-images` storage bucket under `onboarding/{user_id}.jpg`. Keep ref on profile for future re-bootstrap or AI fine-tuning. |
| 8 | Peer benchmark integration | 0.5 day | After Gemini returns products, post-process: for each product, hit `/api/benchmark` and replace Gemini's price guess if peer data is denser (≥10 users/cluster). |
| 9 | Empty/error/loading copy | 0.5 day | Use `lib/copy/index.ts` for empty, errors, loading. Camera-permission-denied flow opens Settings (mobile native) or shows manual fallback (web). |
| 10 | Analytics events | 0.25 day | `photo_magic_started`, `photo_magic_parsed`, `photo_magic_confirmed`, `photo_magic_fell_back_to_manual`, plus duration buckets. |
| 11 | Dev-mode mock | 0.25 day | When `OPENROUTER_API_KEY` is unset (Phase 0 reality — see CLAUDE.md known issues), `/api/onboarding/photo-magic` returns a deterministic stub so the UI is still demoable. |

**Total: ~7.5 working days** of focused work, plus ~3 days of polish, edge cases,
typecheck, and Patrick-Collison-style merchant testing. Round to **8–12 days**.

## Risks

1. **Gemini Flash Lite multimodal latency** can spike past 3 seconds —
   positioning copy promises "3 seconds." Mitigation: streaming UI with
   skeleton-card placeholders that fill in as parsed; honest "almost there…"
   copy past 5 s; never show a spinner alone for >2 s.
2. **Confidence in product detection** — a counter shot of mixed kuih is fine
   for human eyes but ambiguous to a model. Plan ships a "Try another photo?"
   gentle prompt at low confidence and an inline-edit row for every parsed
   product so the user can correct cheaply.
3. **Cost** — Gemini multimodal is ~10× a text call. Free-tier merchants will
   onboard once; cap retries to 3 per user per 24h to bound cost.
4. **Hero promise vs. reality** — landing already says "From snap to sold." If
   Photo Magic ships behind a feature flag or only on mobile, marketing risks
   over-claiming. **Recommendation: ship web-first since web is Phase 1
   primary** ([`03-features.md` architecture table](./03-features.md#architecture-web--mobile)),
   port to mobile in Phase 2.

## Success criteria (from [`06-roadmap.md`](./06-roadmap.md) Phase 1 gate)

- 5 friendly merchants onboard in <5 minutes each (target: 60-second median)
- 5 merchants use the resulting shop daily for 4 weeks
- NPS ≥ 8 from those 5
- A demo video of the Photo Magic exists and is shareable for Phase 2 marketing

If any of these fail at the Phase 1 gate, the doc instructs: iterate the magic
moment before scaling.

---

## Dependency on the rest of this reposition pass

This plan assumes the changes already shipped in this branch:

- Anti-anxiety copy + microcopy library (`lib/copy/`)
- Compliance demoted to silent superpower (no LHDN gates in onboarding)
- Pricing collapsed to Free / Pro / Business — Photo Magic happens *before* tier
  choice, on the free tier

Not blocked on the production env: in dev/preview, the mock stub lets the UI run
without `OPENROUTER_API_KEY`.

---

*Versi 1.0 · 27 April 2026 · Plan only — no code yet. Ship after Phase 0 gates
in [`06-roadmap.md`](./06-roadmap.md) clear.*
