import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { createServiceClient } from "@/lib/supabase/server";
import { REFERRAL_DURATION_MONTHS } from "@/lib/utils/constants";

// POST — Apply referral code and/or community code for email signup
// (Google OAuth handles this in /api/auth/callback)
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { referralCode, communityCode } = body;

    const service = await createServiceClient();

    // Apply referral code
    if (referralCode && /^[A-Z0-9]{6}$/.test(referralCode)) {
      const { data: referrer } = await service
        .from("profiles")
        .select("id, referral_code")
        .eq("referral_code", referralCode)
        .maybeSingle();

      if (referrer && referrer.id !== user.id) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + REFERRAL_DURATION_MONTHS);

        await service
          .from("profiles")
          .update({
            referred_by: referralCode,
            referral_expires_at: expiresAt.toISOString(),
          })
          .eq("id", user.id)
          .is("referred_by", null);
      }
    }

    // Apply community code
    if (communityCode && /^[A-Z0-9]{6}$/.test(communityCode)) {
      const { data: community } = await service
        .from("communities")
        .select("id, organizer_id, invite_code")
        .eq("invite_code", communityCode)
        .eq("is_active", true)
        .maybeSingle();

      if (community) {
        // Join community
        await service.from("community_members").upsert({
          community_id: community.id,
          user_id: user.id,
          role: "member",
        }, { onConflict: "community_id,user_id" });

        // Set as primary community
        await service.from("profiles")
          .update({ community_id: community.id })
          .eq("id", user.id);

        // Set organizer as referrer (if no referral code was provided)
        if (community.organizer_id !== user.id && !referralCode) {
          const { data: organizer } = await service
            .from("profiles")
            .select("referral_code")
            .eq("id", community.organizer_id)
            .single();

          if (organizer?.referral_code) {
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + REFERRAL_DURATION_MONTHS);
            await service.from("profiles")
              .update({
                referred_by: organizer.referral_code,
                referral_expires_at: expiresAt.toISOString(),
              })
              .eq("id", user.id)
              .is("referred_by", null);
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Apply referral error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
