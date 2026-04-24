import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { createServiceClient } from "@/lib/supabase/server";

// GET — Community detail with members (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createServiceClient();

    // Get community
    const { data: community, error } = await supabase
      .from("communities")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Get members with their profile info
    const { data: members } = await supabase
      .from("community_members")
      .select("user_id, role, joined_at")
      .eq("community_id", community.id)
      .order("joined_at", { ascending: true });

    // Get member profiles
    let memberProfiles: Record<string, unknown>[] = [];
    if (members && members.length > 0) {
      const userIds = members.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, business_name, logo_url, slug, business_category, city")
        .in("id", userIds)
        .eq("order_form_enabled", true);

      // Get completed order counts per member
      const { data: orderCounts } = await supabase
        .rpc("get_member_order_counts", { member_ids: userIds });

      const countMap = new Map((orderCounts || []).map((c: { user_id: string; count: number }) => [c.user_id, c.count]));

      memberProfiles = (profiles || []).map((p) => ({
        ...p,
        completedOrders: countMap.get(p.id) || 0,
        role: members.find((m) => m.user_id === p.id)?.role || "member",
      }));
    }

    const response = NextResponse.json({
      ...community,
      members: memberProfiles,
    });
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT — Update community (organizer only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.category !== undefined) updates.category = body.category;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.event_date_start !== undefined) updates.event_date_start = body.event_date_start;
    if (body.event_date_end !== undefined) updates.event_date_end = body.event_date_end;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("communities")
      .update(updates)
      .eq("slug", slug)
      .eq("organizer_id", user.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Gagal update atau bukan organizer" }, { status: 403 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
