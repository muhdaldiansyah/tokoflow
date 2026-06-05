import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { CommunityClient } from "@/features/community/components/CommunityClient";
import type { Community, Announcement, GroupBuySuggestion } from "@/features/community/components/CommunityClient";

export default async function CommunityPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  // Step 1: profile (community_id) + user's own memberships — parallel
  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("community_id").eq("id", user.id).single(),
    supabase.from("community_members").select("community_id, role").eq("user_id", user.id),
  ]);

  const communityId = profile?.community_id ?? null;
  const communityIds = (memberships ?? []).map((m) => m.community_id);

  // Step 2: communities list + announcements rows + all community members — parallel
  const [communitiesResult, announcementsRaw, allMembersResult] = await Promise.all([
    communityIds.length > 0
      ? supabase
          .from("communities")
          .select("id, name, slug, description, invite_code, member_count, total_orders, is_active")
          .in("id", communityIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
    communityId
      ? supabase
          .from("community_announcements")
          .select("id, type, title, body, created_at, author_id")
          .eq("community_id", communityId)
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
    communityId
      ? supabase.from("community_members").select("user_id").eq("community_id", communityId)
      : Promise.resolve({ data: [] as { user_id: string }[], error: null }),
  ]);

  const announcementRows = (announcementsRaw.data ?? []) as {
    id: string; type: string; title: string; body: string | null;
    created_at: string; author_id: string;
  }[];
  const allMemberIds = (allMembersResult.data ?? []).map((m) => (m as { user_id: string }).user_id);
  const enableGroupBuy = allMemberIds.length >= 5;
  const authorIds = [...new Set(announcementRows.map((a) => a.author_id))];

  // Step 3: author names + group-buy products — parallel
  const [authorsResult, productsResult] = await Promise.all([
    authorIds.length > 0
      ? supabase.from("profiles").select("id, business_name").in("id", authorIds)
      : Promise.resolve({ data: [] as { id: string; business_name: string | null }[] }),
    enableGroupBuy
      ? supabase
          .from("products")
          .select("user_id, category, name, cost_price, unit")
          .in("user_id", allMemberIds)
          .eq("is_available", true)
          .is("deleted_at", null)
          .not("category", "is", null)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  // Build communities list with role
  const communities: Community[] = ((communitiesResult.data ?? []) as Record<string, unknown>[]).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    slug: c.slug as string,
    description: (c.description as string | undefined) ?? undefined,
    invite_code: c.invite_code as string,
    member_count: (c.member_count as number) ?? 0,
    total_orders: (c.total_orders as number) ?? 0,
    is_active: (c.is_active as boolean) ?? true,
    role: (memberships ?? []).find((m) => m.community_id === c.id)?.role ?? "member",
  }));

  // Build announcements with author names
  const authorMap = new Map(
    ((authorsResult.data ?? []) as { id: string; business_name: string | null }[]).map((a) => [a.id, a.business_name])
  );
  const announcements: Announcement[] = announcementRows.map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    body: a.body ?? undefined,
    createdAt: a.created_at,
    authorName: authorMap.get(a.author_id) || "Koordinator",
  }));

  // Build group-buy suggestions
  const groupBuy: GroupBuySuggestion[] = [];
  if (enableGroupBuy && productsResult.data && productsResult.data.length > 0) {
    const categoryMap = new Map<string, { members: Set<string>; products: { name: string; unit: string | null; costPrice: number | null }[] }>();
    for (const p of productsResult.data as { user_id: string; category: string; name: string; cost_price: number | null; unit: string | null }[]) {
      if (!p.category) continue;
      if (!categoryMap.has(p.category)) categoryMap.set(p.category, { members: new Set(), products: [] });
      const entry = categoryMap.get(p.category)!;
      entry.members.add(p.user_id);
      entry.products.push({ name: p.name, unit: p.unit, costPrice: p.cost_price });
    }
    for (const [cat, data] of categoryMap) {
      if (data.members.size < 3) continue;
      groupBuy.push({
        category: cat,
        memberCount: data.members.size,
        totalMembers: allMemberIds.length,
        message: `${data.members.size} dari ${allMemberIds.length} member jual produk "${cat}". Beli bahan bareng bisa lebih murah.`,
      });
    }
    groupBuy.sort((a, b) => b.memberCount - a.memberCount);
    groupBuy.splice(5);
  }

  return (
    <CommunityClient
      initialCommunities={communities}
      initialAnnouncements={announcements}
      initialGroupBuy={groupBuy}
    />
  );
}
