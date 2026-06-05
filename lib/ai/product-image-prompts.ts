// Server-side prompt templates for product image generation. The merchant
// never types a prompt — we build it from the product fields (name +
// description + category) so the experience is one-tap.
//
// Style anchor across both prompts:
//   - Cinematic editorial product photograph
//   - Warm cream + amber + obsidian color grade
//   - Shallow depth-of-field, hyperreal
//   - Clean background (white / light wood / soft cream)
//   - No text, no logos, no watermarks
//
// Two separate templates because the operations are structurally different:
//   - generate: text-only prompt → AI invents the image from scratch
//   - enhance:  image+text prompt → AI improves the existing photo,
//               keeping the product itself unchanged. Conservative on
//               purpose to respect bible v1.2's "we don't beautify the
//               merchant's craft" — enhance touches lighting / background
//               / color, never the food/product arrangement.

export interface ProductPromptInput {
  name: string;
  description?: string | null;
  category?: string | null;
}

const FOOD_CATEGORY_KEYWORDS = [
  "nasi",
  "kuih",
  "kek",
  "bakery",
  "cake",
  "dessert",
  "minuman",
  "drink",
  "beverage",
  "snack",
  "food",
  "kopitiam",
  "catering",
  "meal",
  "lemang",
  "rendang",
  "satay",
  "kopi",
  "teh",
  "lapis",
  "biskut",
  "cookie",
];

function looksLikeFood(category?: string | null): boolean {
  if (!category) return false;
  const lower = category.toLowerCase();
  return FOOD_CATEGORY_KEYWORDS.some((kw) => lower.includes(kw));
}

function descLine(description?: string | null): string {
  if (!description) return "";
  // Trim and limit so a chatty merchant note doesn't drown the style anchor.
  const trimmed = description.trim().slice(0, 200);
  return ` ${trimmed}.`;
}

export function buildGeneratePrompt(p: ProductPromptInput): string {
  const isFood = looksLikeFood(p.category);

  if (isFood) {
    return [
      `Cinematic editorial food photograph of "${p.name}".`,
      descLine(p.description),
      "Malaysian home-cooked food, served on a clean white ceramic plate or wooden board.",
      "Soft natural daylight from upper-left, warm amber highlights, cream mid-tones, deep obsidian shadows — no cool blue.",
      "Shallow depth-of-field, hyperreal magazine-quality food editorial.",
      "Clean uncluttered background — white surface or light wood, blurred.",
      "Square 1:1 composition, the dish centered, appetizing, fresh.",
      "No text, no logos, no watermarks, no tableware brands visible.",
    ].join(" ");
  }

  // Non-food: fashion, kosmetik, jasa, electronics, etc.
  return [
    `Cinematic editorial product photograph of "${p.name}".`,
    descLine(p.description),
    p.category ? `Category: ${p.category}.` : "",
    "Soft natural daylight, warm cream and amber color grade, deep obsidian shadows.",
    "Shallow depth-of-field, hyperreal magazine-quality.",
    "Clean uncluttered background — light cream or soft wood, blurred.",
    "Square 1:1 composition, the product centered, professional.",
    "No text, no logos, no watermarks, no brand markings visible.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildEnhancePrompt(p: ProductPromptInput): string {
  return [
    `Enhance this product photograph of "${p.name}".`,
    descLine(p.description),
    "Improve lighting, contrast, and color balance.",
    "Clean up the background — soften clutter, smooth out distractions.",
    "Apply a warm cream + amber color grade with deep obsidian shadows.",
    "KEEP the product itself unchanged — same arrangement, same items, same colors.",
    "Only improve photographic quality: lighting, background tidiness, color tone.",
    "Hyperreal, magazine-quality, professional.",
    "Output: square 1:1 composition. No text, no logos, no watermarks.",
  ].join(" ");
}
