import { NextRequest, NextResponse } from "next/server";
import {
  anonymousAiRateLimitResponseInit,
  checkAnonymousAiRateLimit,
  getClientIp,
} from "@/lib/rate-limit/anonymous-ai";
import { generateSlug, isReservedSlug, isValidSlug } from "@/lib/utils/slug";
import { createServiceClient } from "@/lib/supabase/server";

// Cap data URL payload — image is base64 so ~1.33x the binary size.
// 6 MB of base64 ≈ 4.5 MB binary.
const MAX_IMAGE_PAYLOAD_CHARS = 6 * 1024 * 1024;

export interface PhotoMagicProduct {
  name: string;
  price: number;
  category?: string | null;
}

export interface PhotoMagicPreview {
  businessName: string;
  story: string;
  suggestedSlug: string;
  slugAvailable: boolean;
  alternativeSlugs: string[];
  products: PhotoMagicProduct[];
  confidence: "high" | "medium" | "low";
}

interface ParsedFromAi {
  businessName?: string;
  story?: string;
  products?: Array<{ name?: string; price?: number; category?: string | null }>;
  confidence?: "high" | "medium" | "low";
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const limit = checkAnonymousAiRateLimit(ip);

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error:
            limit.reason === "day"
              ? "Demo limit reached for today. Daftar untuk lanjut tanpa batas."
              : "Banyak request dari kamu sekarang. Coba lagi sebentar.",
        },
        anonymousAiRateLimitResponseInit(limit),
      );
    }

    const { image } = await request.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "image is required" },
        { status: 400 },
      );
    }

    if (image.length > MAX_IMAGE_PAYLOAD_CHARS) {
      return NextResponse.json(
        { error: "Foto terlalu besar (max ~4.5 MB). Coba kompres dulu." },
        { status: 413 },
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      // Dev / preview without OpenRouter key — return deterministic stub so the
      // landing flow stays demoable.
      return NextResponse.json(devStub());
    }

    const textPrompt = `You are Tokoflow's onboarding parser. You receive ONE photo of a Malaysian home seller's products (kek lapis, kuih, fashion, kosmetik, jasa lokal, etc.) and bootstrap their shop in 3 seconds.

Rules:
1. IDENTIFY visible products. For each: name (in BM/EN/Manglish as the seller would), estimated price in MYR (whole ringgit, peer-benchmarked for Shah Alam home seller).
2. Maximum 5 products. Most photos: 2-4 products.
3. SUGGEST a business name based on what's in the photo. Format: "Toko [Type] [generic name]" or use detected brand cues. Examples: "Toko Kek Aisyah", "Aisyah's Kitchen", "Kuih Madu Home".
4. SUGGEST a 1-2 sentence story (in English or BM, warm tone, first-person, max 120 chars). Examples: "Grandma's recipe, made with love." / "Kek lapis homemade, dari dapur ke pintu kamu."
5. CONFIDENCE: "high" if products clearly visible, "medium" if ambiguous, "low" if photo unclear.
6. NEVER invent products you can't see. If photo shows just one item, return one product.
7. Prices should be REALISTIC for Malaysian home-seller context: kek lapis RM 5-8, kuih RM 2-4, brownies box RM 25-40, etc. Don't go crazy.
8. NEVER beautify or fictionalize — extract only what's visible.

Output JSON ONLY:
{
  "businessName": "string",
  "story": "string (max 120 chars)",
  "products": [{"name": "string", "price": number, "category": "string or null"}],
  "confidence": "high" | "medium" | "low"
}`;

    const aiRes = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-lite-preview",
          messages: [
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: image } },
                { type: "text", text: textPrompt },
              ],
            },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      },
    );

    if (!aiRes.ok) {
      return NextResponse.json(
        { error: "AI service tidak tersedia. Coba lagi sebentar." },
        { status: 502 },
      );
    }

    const data = await aiRes.json();
    const text = data.choices?.[0]?.message?.content || "{}";
    let parsed: ParsedFromAi;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "AI response unparseable. Coba foto lain." },
        { status: 502 },
      );
    }

    const businessName =
      typeof parsed.businessName === "string" && parsed.businessName.trim()
        ? parsed.businessName.trim().slice(0, 60)
        : "My Shop";

    const story =
      typeof parsed.story === "string" && parsed.story.trim()
        ? parsed.story.trim().slice(0, 200)
        : "";

    const products: PhotoMagicProduct[] = Array.isArray(parsed.products)
      ? parsed.products
          .filter(
            (p) =>
              p &&
              typeof p.name === "string" &&
              p.name.trim().length > 0 &&
              typeof p.price === "number",
          )
          .slice(0, 5)
          .map((p) => ({
            name: String(p.name).trim().slice(0, 80),
            price: Math.max(0, Math.round(p.price ?? 0)),
            category: typeof p.category === "string" ? p.category : null,
          }))
      : [];

    const confidence: PhotoMagicPreview["confidence"] =
      parsed.confidence === "high" ||
      parsed.confidence === "medium" ||
      parsed.confidence === "low"
        ? parsed.confidence
        : "medium";

    const slugInfo = await suggestAvailableSlug(businessName);

    const preview: PhotoMagicPreview = {
      businessName,
      story,
      suggestedSlug: slugInfo.suggested,
      slugAvailable: slugInfo.available,
      alternativeSlugs: slugInfo.alternatives,
      products,
      confidence,
    };

    return NextResponse.json(preview);
  } catch {
    return NextResponse.json(
      { error: "Tidak bisa proses foto. Coba lagi." },
      { status: 500 },
    );
  }
}

async function suggestAvailableSlug(businessName: string): Promise<{
  suggested: string;
  available: boolean;
  alternatives: string[];
}> {
  const base = generateSlug(businessName) || "toko";
  const candidates = [
    base,
    `${base}-my`,
    `${base}-shop`,
    `${base}-${randomSuffix()}`,
  ].filter((s) => s.length >= 3 && isValidSlug(s) && !isReservedSlug(s));

  if (candidates.length === 0) {
    candidates.push(`toko-${randomSuffix()}`);
  }

  const supabase = await createServiceClient();
  const { data: taken } = await supabase
    .from("profiles")
    .select("slug")
    .in("slug", candidates);

  const takenSet = new Set((taken ?? []).map((r) => r.slug));
  const available = candidates.find((s) => !takenSet.has(s)) ?? candidates[0];
  const alternatives = candidates
    .filter((s) => s !== available && !takenSet.has(s))
    .slice(0, 3);

  return {
    suggested: available,
    available: !takenSet.has(available),
    alternatives,
  };
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

function devStub(): PhotoMagicPreview {
  return {
    businessName: "Toko Kek Aisyah",
    story: "Grandma's recipe, made with love.",
    suggestedSlug: `toko-kek-aisyah-${Math.random().toString(36).slice(2, 5)}`,
    slugAvailable: true,
    alternativeSlugs: ["aisyah-kek-lapis", "aisyah-kitchen"],
    products: [
      { name: "Kek Lapis Original", price: 25, category: "kek" },
      { name: "Kuih Ros (12 pcs)", price: 18, category: "kuih" },
      { name: "Brownies (Box)", price: 35, category: "kek" },
    ],
    confidence: "high",
  };
}
