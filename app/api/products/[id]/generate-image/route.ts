import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { aiRateLimitResponseInit, checkAiRateLimit } from "@/lib/rate-limit/ai";
import { generateProductImage, type ProductImageMode } from "@/lib/ai/product-image";

// POST /api/products/[id]/generate-image
//
// Body: { mode: "generate" | "enhance" }
//
// generate: invent a new product photo from name + description + category.
// enhance:  take the existing image_url and produce an improved version
//           (lighting, background, color grade) without changing the
//           product itself.
//
// Returns: { imageUrl } — public URL on the product-images bucket.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Same per-user AI rate limit as voice/image parsing — keeps the cost
    // bounded if a merchant accidentally spams the regenerate button.
    const limit = checkAiRateLimit(user.id);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error:
            limit.reason === "day"
              ? "Daily AI usage limit reached. Try again tomorrow."
              : "Too many AI requests. Slow down for a moment.",
        },
        aiRateLimitResponseInit(limit),
      );
    }

    const body = await request.json().catch(() => ({}));
    const mode = body.mode as ProductImageMode | undefined;
    if (mode !== "generate" && mode !== "enhance") {
      return NextResponse.json(
        { error: 'mode must be "generate" or "enhance"' },
        { status: 400 },
      );
    }

    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("id, name, description, category, image_url")
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (mode === "enhance" && !product.image_url) {
      return NextResponse.json(
        { error: "No existing photo to enhance — upload one first or use generate." },
        { status: 400 },
      );
    }

    let buffer: Buffer;
    let mimeType: string;
    try {
      const result = await generateProductImage({
        name: product.name,
        description: product.description,
        category: product.category,
        mode,
        existingImageUrl: mode === "enhance" ? product.image_url : undefined,
      });
      buffer = result.buffer;
      mimeType = result.mimeType;
    } catch (err) {
      console.error("AI image generation failed:", err);
      return NextResponse.json(
        { error: "Couldn't generate image. Try again in a moment." },
        { status: 502 },
      );
    }

    const ext = mimeType === "image/jpeg" ? "jpg" : "png";
    const path = `${user.id}/${product.id}-ai-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, buffer, { contentType: mimeType, upsert: false });

    if (uploadError) {
      console.error("Product image storage upload failed:", uploadError);
      return NextResponse.json(
        { error: "Image generated but couldn't be saved. Try again." },
        { status: 500 },
      );
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from("products")
      .update({ image_url: publicUrl })
      .eq("id", product.id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Product image_url update failed:", updateError);
      return NextResponse.json(
        { error: "Image saved but couldn't be linked. Try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ imageUrl: publicUrl, mode });
  } catch (err) {
    console.error("Generate image API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
