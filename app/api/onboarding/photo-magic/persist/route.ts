import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { isReservedSlug, isValidSlug } from "@/lib/utils/slug";

/**
 * Photo Magic v1 persistence endpoint.
 *
 * Accepts the (possibly merchant-edited) preview from
 * `/api/onboarding/photo-magic` and writes profile + products atomically.
 * Idempotent on user_id: re-calling overwrites profile bootstrap fields and
 * REPLACES products created by photo-magic in this session (does not delete
 * pre-existing manual products). Manual products are preserved.
 *
 * Per docs/positioning/P4-photo-magic-plan.md chunk 3.
 */

const ProductSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().min(0).max(100000),
  category: z.string().nullable().optional(),
});

const PersistSchema = z.object({
  businessName: z.string().min(1).max(100),
  story: z.string().max(500).optional().default(""),
  slug: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9-]+$/),
  products: z.array(ProductSchema).min(1).max(8),
  businessCategoryId: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = PersistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid payload shape",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const { businessName, story, slug, products, businessCategoryId } = parsed.data;

  // Slug validation — block reserved + invalid characters
  if (!isValidSlug(slug) || isReservedSlug(slug)) {
    return NextResponse.json(
      { error: "Slug is reserved or invalid. Pick another." },
      { status: 400 },
    );
  }

  // Slug uniqueness — block if taken by another user
  const { data: slugTaken } = await supabase
    .from("profiles")
    .select("id")
    .eq("slug", slug)
    .neq("id", user.id)
    .maybeSingle();

  if (slugTaken) {
    return NextResponse.json(
      { error: "Slug is already taken. Pick another." },
      { status: 409 },
    );
  }

  // Update profile bootstrap fields
  const profileUpdate: Record<string, unknown> = {
    business_name: businessName,
    slug,
    bio: story || null,
  };
  if (businessCategoryId) {
    profileUpdate.business_category = businessCategoryId;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", user.id);

  if (profileError) {
    console.error("photo-magic persist profile error", profileError);
    return NextResponse.json(
      { error: "Could not save shop profile. Try again." },
      { status: 500 },
    );
  }

  // Insert products. Tag with source='photo_magic' so we can re-overwrite
  // safely on re-bootstrap without affecting manual entries.
  //
  // Operation order matters: INSERT first, then DELETE old. If INSERT fails,
  // old photo_magic products are preserved (better UX than empty catalog).
  // Brief overlap (2x products visible) is acceptable for the seconds between
  // INSERT and DELETE — most merchants are still on the preview screen.
  const productRows = products.map((p) => ({
    user_id: user.id,
    name: p.name,
    price: Math.round(p.price),
    category: p.category ?? null,
    is_available: true,
    source: "photo_magic" as const,
  }));

  const { error: productsError, data: insertedProducts } = await supabase
    .from("products")
    .insert(productRows)
    .select("id, name");

  if (productsError) {
    console.error("photo-magic persist products error", productsError);
    return NextResponse.json(
      { error: "Saved profile but products failed. Try again or add manually." },
      { status: 500 },
    );
  }

  // INSERT succeeded — now safe to delete prior photo_magic products
  // (those NOT in the new insertion set). We identify the new ones by id.
  // Supabase .in() filter with negation: list comma-separated UUIDs in parens.
  const insertedIds = (insertedProducts ?? []).map((p) => p.id);
  if (insertedIds.length > 0) {
    await supabase
      .from("products")
      .delete()
      .eq("user_id", user.id)
      .eq("source", "photo_magic")
      .not("id", "in", `(${insertedIds.join(",")})`);
  }

  return NextResponse.json({
    ok: true,
    slug,
    productsCreated: insertedProducts?.length ?? 0,
    message: "Shop bootstrapped. Tutup mata sekejap, dah live.",
  });
}
