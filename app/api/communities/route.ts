import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { createServiceClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/utils/slug";

// GET — List active communities (public)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const category = searchParams.get("category");

    let query = supabase
      .from("communities")
      .select("id, name, slug, description, invite_code, city, city_slug, category, member_count, total_orders, event_date_start, event_date_end, created_at")
      .eq("is_active", true)
      .order("member_count", { ascending: false })
      .limit(50);

    if (city) query = query.eq("city_slug", city);
    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const response = NextResponse.json(data || []);
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — Create community (auth required)
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, description, category, eventDateStart, eventDateEnd } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Community name must be at least 2 characters" }, { status: 400 });
    }

    // Rate limit: max 3 communities per user
    const { count } = await supabase
      .from("communities")
      .select("id", { count: "exact", head: true })
      .eq("organizer_id", user.id);

    if ((count || 0) >= 3) {
      return NextResponse.json({ error: "Maksimal 3 komunitas per akun" }, { status: 429 });
    }

    // Get organizer's city info
    const { data: profile } = await supabase
      .from("profiles")
      .select("city, city_slug, referral_code")
      .eq("id", user.id)
      .single();

    // Generate slug
    const baseSlug = generateSlug(name.trim());
    let slug = baseSlug;
    const service = await createServiceClient();

    // Check slug uniqueness, append number if needed
    for (let i = 0; i < 10; i++) {
      const candidate = i === 0 ? baseSlug : `${baseSlug}-${i + 1}`;
      const { data: existing } = await service
        .from("communities")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle();
      if (!existing) { slug = candidate; break; }
    }

    // Create community
    const { data: community, error } = await service
      .from("communities")
      .insert({
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        organizer_id: user.id,
        city: profile?.city || null,
        city_slug: profile?.city_slug || null,
        category: category || null,
        event_date_start: eventDateStart || null,
        event_date_end: eventDateEnd || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating community:", error);
      return NextResponse.json({ error: "Gagal membuat komunitas" }, { status: 500 });
    }

    // Auto-add organizer as member with 'organizer' role
    const { error: memberError } = await service.from("community_members").insert({
      community_id: community.id,
      user_id: user.id,
      role: "organizer",
    });
    if (memberError) console.error("Failed to add organizer as member:", memberError);

    // Set as user's primary community
    const { error: profileError } = await service.from("profiles").update({ community_id: community.id }).eq("id", user.id);
    if (profileError) console.error("Failed to set primary community:", profileError);

    return NextResponse.json(community, { status: 201 });
  } catch (error) {
    console.error("Create community error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
