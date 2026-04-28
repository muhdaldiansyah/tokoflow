import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import {
  generateSlug,
  isReservedSlug,
  isValidSlug,
} from "@/lib/utils/slug";
import type { PhotoMagicPreview } from "@/app/api/onboarding/photo-magic/route";

/**
 * Activates a photo-magic preview into the merchant's actual profile.
 * Called after sign-up: the client posts the preview state captured on the
 * landing page, and we persist it as profile + products.
 *
 * - Sets business_name + slug (if profile slug not yet set)
 * - Creates products from preview.products[]
 * - Idempotent on re-call: skips if business_name already set AND profile
 *   already has products (avoids double-create on retry)
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const preview = body as Partial<PhotoMagicPreview>;

    if (!preview || typeof preview !== "object") {
      return NextResponse.json(
        { error: "preview body required" },
        { status: 400 },
      );
    }

    const businessName = String(preview.businessName ?? "").trim().slice(0, 60);
    const story = String(preview.story ?? "").trim().slice(0, 200);
    const requestedSlug = String(preview.suggestedSlug ?? "").trim().toLowerCase();

    if (businessName.length < 2) {
      return NextResponse.json(
        { error: "businessName too short" },
        { status: 400 },
      );
    }

    const products = Array.isArray(preview.products)
      ? preview.products
          .filter(
            (p) =>
              p &&
              typeof p.name === "string" &&
              p.name.trim().length > 0 &&
              typeof p.price === "number",
          )
          .slice(0, 10)
          .map((p) => ({
            name: String(p.name).trim().slice(0, 80),
            price: Math.max(0, Math.round(p.price)),
            category:
              typeof p.category === "string" && p.category.trim()
                ? p.category.trim().slice(0, 40)
                : null,
          }))
      : [];

    // Check current profile state — keep idempotent
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("id, slug, business_name")
      .eq("id", user.id)
      .maybeSingle();

    // Resolve a usable slug: prefer requested if valid+available, else generate
    let finalSlug: string | null = currentProfile?.slug ?? null;

    if (!finalSlug) {
      const candidates = [
        requestedSlug,
        generateSlug(businessName),
        `${generateSlug(businessName)}-${randomSuffix()}`,
      ].filter(
        (s): s is string =>
          typeof s === "string" &&
          s.length >= 3 &&
          isValidSlug(s) &&
          !isReservedSlug(s),
      );

      if (candidates.length === 0) {
        candidates.push(`toko-${randomSuffix()}`);
      }

      const { data: takenRows } = await supabase
        .from("profiles")
        .select("slug")
        .in("slug", candidates);

      const takenSet = new Set((takenRows ?? []).map((r) => r.slug));
      finalSlug = candidates.find((s) => !takenSet.has(s)) ?? `toko-${randomSuffix()}`;
    }

    // Update profile (business_name + slug + order_form_enabled)
    const profileUpdates: Record<string, unknown> = {
      business_name: businessName,
      order_form_enabled: true,
    };

    // Only set slug if it isn't already set (don't overwrite existing slug)
    if (!currentProfile?.slug && finalSlug) {
      profileUpdates.slug = finalSlug;
    }

    // Optional: store story as bio if profile has bio column.
    // Schema check: try to write to bio, fall back silently if column doesn't exist.
    if (story.length > 0) {
      profileUpdates.bio = story;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update(profileUpdates)
      .eq("id", user.id);

    if (profileError) {
      // If `bio` column doesn't exist, retry without it
      if (profileError.message?.toLowerCase().includes("bio")) {
        delete profileUpdates.bio;
        const { error: retryError } = await supabase
          .from("profiles")
          .update(profileUpdates)
          .eq("id", user.id);
        if (retryError) {
          return NextResponse.json(
            { error: "Could not update profile" },
            { status: 500 },
          );
        }
      } else {
        return NextResponse.json(
          { error: "Could not update profile" },
          { status: 500 },
        );
      }
    }

    // Create products. Idempotency: if user already has products, skip create
    // (this means a prior activation succeeded).
    const { data: existingProducts } = await supabase
      .from("products")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    let productsCreated = 0;
    if (
      products.length > 0 &&
      (!existingProducts || existingProducts.length === 0)
    ) {
      const rows = products.map((p) => ({
        user_id: user.id,
        name: p.name,
        price: p.price,
        category: p.category,
        is_available: true,
      }));

      const { error: prodError, data: created } = await supabase
        .from("products")
        .insert(rows)
        .select("id");

      if (prodError) {
        // Don't fail the whole activation — profile is the critical part.
        // Log via response so frontend can surface a hint to user if needed.
        return NextResponse.json({
          success: true,
          slug: finalSlug,
          productsCreated: 0,
          warning: "Profile activated but products could not be saved.",
        });
      }

      productsCreated = created?.length ?? 0;
    }

    return NextResponse.json({
      success: true,
      slug: finalSlug,
      productsCreated,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not activate preview" },
      { status: 500 },
    );
  }
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}
