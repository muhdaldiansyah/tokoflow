import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { createServiceClient } from "@/lib/supabase/server";

// POST — Join community by invite_code
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { invite_code } = body;

    if (!invite_code) {
      return NextResponse.json({ error: "Kode undangan diperlukan" }, { status: 400 });
    }

    const service = await createServiceClient();

    // Find community
    const { data: community } = await service
      .from("communities")
      .select("id, name, slug, organizer_id")
      .eq("invite_code", invite_code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Check if already member
    const { data: existing } = await service
      .from("community_members")
      .select("user_id")
      .eq("community_id", community.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ message: "Sudah bergabung", community });
    }

    // Join
    const { error: joinError } = await service.from("community_members").insert({
      community_id: community.id,
      user_id: user.id,
      role: "member",
    });
    if (joinError) {
      console.error("Failed to join community:", joinError);
      return NextResponse.json({ error: "Gagal bergabung" }, { status: 500 });
    }

    // Set as primary community (if user doesn't have one)
    await service
      .from("profiles")
      .update({ community_id: community.id })
      .eq("id", user.id)
      .is("community_id", null);

    return NextResponse.json({ message: "Berhasil bergabung", community });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
