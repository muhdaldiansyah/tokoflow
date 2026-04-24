import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

/**
 * GET /api/communities/announcements
 * Returns announcements for user's community (last 20).
 *
 * POST /api/communities/announcements
 * Organizer posts an announcement. Body: { type, title, body }
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
    return NextResponse.json({ announcements: [], reason: "not_in_community" });
  }

  const { data: announcements } = await supabase
    .from("community_announcements")
    .select("id, type, title, body, created_at, author_id")
    .eq("community_id", profile.community_id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Get author names
  const authorIds = [...new Set((announcements || []).map(a => a.author_id))];
  const { data: authors } = await supabase
    .from("profiles")
    .select("id, business_name")
    .in("id", authorIds);

  const authorMap = new Map((authors || []).map(a => [a.id, a.business_name]));

  return NextResponse.json({
    announcements: (announcements || []).map(a => ({
      id: a.id,
      type: a.type,
      title: a.title,
      body: a.body,
      createdAt: a.created_at,
      authorName: authorMap.get(a.author_id) || "Koordinator",
    })),
  });
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = user.id;
  const body = await request.json();

  const { type = "info", title, body: announcementBody } = body;

  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  // Check user is organizer of at least one community
  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("organizer_id", userId)
    .limit(1)
    .maybeSingle();

  if (!community) {
    return NextResponse.json({ error: "Only organizers can post announcements" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("community_announcements")
    .insert({
      community_id: community.id,
      author_id: userId,
      type,
      title,
      body: announcementBody || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to post announcement" }, { status: 500 });
  }

  return NextResponse.json({ announcement: data });
}
