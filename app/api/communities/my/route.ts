import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET — Communities user is member of
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: memberships } = await supabase
      .from("community_members")
      .select("community_id, role, joined_at")
      .eq("user_id", user.id);

    if (!memberships || memberships.length === 0) {
      return NextResponse.json([]);
    }

    const communityIds = memberships.map((m) => m.community_id);
    const { data: communities } = await supabase
      .from("communities")
      .select("id, name, slug, description, invite_code, member_count, total_orders, is_active, created_at")
      .in("id", communityIds);

    const result = (communities || []).map((c) => ({
      ...c,
      role: memberships.find((m) => m.community_id === c.id)?.role || "member",
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
