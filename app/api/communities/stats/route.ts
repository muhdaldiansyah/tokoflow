import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

/**
 * GET /api/communities/stats
 * Returns today's aggregate stats for user's community.
 * Gate: only returns if user is in a community with ≥3 members.
 * "Hari ini di komunitasmu: 47 pesanan, 3 member penuh"
 */
export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = user.id;

  // Get user's community
  const { data: profile } = await supabase
    .from("profiles")
    .select("community_id")
    .eq("id", userId)
    .single();

  if (!profile?.community_id) {
    return NextResponse.json({ stats: null, reason: "not_in_community" });
  }

  // Get community members
  const { data: members } = await supabase
    .from("community_members")
    .select("user_id")
    .eq("community_id", profile.community_id);

  if (!members || members.length < 3) {
    return NextResponse.json({ stats: null, reason: "insufficient_members", memberCount: members?.length || 0 });
  }

  const memberIds = members.map(m => m.user_id);

  // Today in MYT
  const now = new Date();
  const mytOffset = 8 * 60 * 60 * 1000;
  const todayMYT = new Date(now.getTime() + mytOffset);
  const todayStr = todayMYT.toISOString().split("T")[0];

  // Count today's orders across all community members
  const { data: todayOrders } = await supabase
    .from("orders")
    .select("user_id, total")
    .in("user_id", memberIds)
    .gte("delivery_date", `${todayStr}T00:00:00+08:00`)
    .lt("delivery_date", `${todayStr}T23:59:59+08:00`)
    .not("status", "eq", "cancelled")
    .is("deleted_at", null);

  const totalOrders = todayOrders?.length || 0;
  const totalRevenue = (todayOrders || []).reduce((sum, o) => sum + (o.total || 0), 0);
  const activeMembersToday = new Set((todayOrders || []).map(o => o.user_id)).size;

  // Check who's at capacity
  const { data: capacityProfiles } = await supabase
    .from("profiles")
    .select("id, daily_order_capacity")
    .in("id", memberIds)
    .not("daily_order_capacity", "is", null);

  let membersAtCapacity = 0;
  if (capacityProfiles) {
    for (const cp of capacityProfiles) {
      const memberOrders = (todayOrders || []).filter(o => o.user_id === cp.id).length;
      if (memberOrders >= (cp.daily_order_capacity || Infinity)) {
        membersAtCapacity++;
      }
    }
  }

  // Social proof: how many members raised prices this week (Feature 5)
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: priceEvents } = await supabase
    .from("events")
    .select("user_id")
    .in("user_id", memberIds)
    .eq("event", "product_price_increased")
    .gte("created_at", weekAgo);

  const membersRaisedPrice = new Set((priceEvents || []).map(e => e.user_id)).size;

  // Get community name
  const { data: community } = await supabase
    .from("communities")
    .select("name")
    .eq("id", profile.community_id)
    .single();

  return NextResponse.json({
    stats: {
      communityName: community?.name || "Komunitas",
      memberCount: members.length,
      today: {
        totalOrders,
        totalRevenue,
        activeMembersToday,
        membersAtCapacity,
      },
      socialProof: {
        membersRaisedPrice,
        period: "7d",
      },
    },
  });
}
