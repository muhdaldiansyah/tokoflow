import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isValidSlug, isReservedSlug } from "@/lib/utils/slug";
import { REFERRAL_DURATION_MONTHS } from "@/lib/utils/constants";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/orders";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      let isNewUser = true;

      // Auto-set business_name + slug for new Google users
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const googleName = user.user_metadata?.full_name || user.user_metadata?.name;
          if (googleName) {
            const service = await createServiceClient();
            const { data: profile } = await service
              .from("profiles")
              .select("business_name, slug, orders_used, created_at")
              .eq("id", user.id)
              .maybeSingle();

            // New user = 0 orders AND profile created within last 5 minutes
            const profileAge = profile?.created_at
              ? Date.now() - new Date(profile.created_at).getTime()
              : 0;
            isNewUser = (profile?.orders_used ?? 0) === 0 && profileAge < 5 * 60 * 1000;

            if (profile && !profile.business_name) {
              const updates: Record<string, unknown> = { business_name: googleName };

              if (!profile.slug) {
                const { generateSlug } = await import("@/lib/utils/slug");
                const baseSlug = generateSlug(googleName);
                const { data: existing } = await service
                  .from("profiles")
                  .select("id")
                  .eq("slug", baseSlug)
                  .maybeSingle();
                if (!existing) {
                  updates.slug = baseSlug;
                  updates.order_form_enabled = true;
                }
              }

              await service.from("profiles").update(updates).eq("id", user.id);
            }
          }
        }
      } catch {
        // best-effort — proceed to redirect
      }

      // Track signup event only for new users (server-side, fire-and-forget)
      if (isNewUser) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            const svc = await createServiceClient();
            await svc.from("events").insert({
              user_id: authUser.id,
              event: "signup",
              properties: { method: "google" },
            });
          }
        } catch {
          // best-effort
        }
      }

      const cookieStore = await cookies();

      // Handle referral code cookie (set on register page with ?ref=CODE)
      if (isNewUser) {
        const referralCode = cookieStore.get("referral_code")?.value;
        if (referralCode && /^[A-Z0-9]{6}$/.test(referralCode)) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const service = await createServiceClient();
              // Verify referral code exists and is not self-referral
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
                  .is("referred_by", null); // only set if not already referred
              }
            }
          } catch {
            // best-effort
          }
        }
      }

      // Handle community invite code cookie
      if (isNewUser) {
        const communityCode = cookieStore.get("community_code")?.value;
        if (communityCode && /^[A-Z0-9]{6}$/.test(communityCode)) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const service = await createServiceClient();
              const { data: community } = await service
                .from("communities")
                .select("id, organizer_id, invite_code")
                .eq("invite_code", communityCode)
                .eq("is_active", true)
                .single();

              if (community) {
                // Join community (upsert to handle duplicate gracefully)
                await service.from("community_members").upsert({
                  community_id: community.id,
                  user_id: user.id,
                  role: "member",
                }, { onConflict: "community_id,user_id" });

                // Set as primary community
                await service.from("profiles")
                  .update({ community_id: community.id })
                  .eq("id", user.id);

                // Set organizer as referrer (for commission)
                if (community.organizer_id !== user.id) {
                  const { data: organizer } = await service
                    .from("profiles")
                    .select("referral_code")
                    .eq("id", community.organizer_id)
                    .single();

                  if (organizer?.referral_code) {
                    const expiresAt = new Date();
                    expiresAt.setMonth(expiresAt.getMonth() + 6);
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
          } catch {
            // best-effort
          }
        }
      }

      // Attempt to claim slug from cookie
      const claimedSlug = cookieStore.get("claimed_slug")?.value;

      if (claimedSlug && isValidSlug(claimedSlug) && !isReservedSlug(claimedSlug)) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const service = await createServiceClient();
            // Check if user already has a slug
            const { data: profile } = await service
              .from("profiles")
              .select("slug")
              .eq("id", user.id)
              .maybeSingle();

            if (!profile?.slug) {
              const { error: updateError } = await service
                .from("profiles")
                .update({ slug: claimedSlug, order_form_enabled: true })
                .eq("id", user.id);

              if (updateError?.code === "23505") {
                // Slug taken by someone else — redirect to pengaturan
                const response = NextResponse.redirect(`${origin}/settings?slug_taken=true`);
                response.cookies.set("claimed_slug", "", { maxAge: 0, path: "/" });
                response.cookies.set("referral_code", "", { maxAge: 0, path: "/" });
                return response;
              }

              // Slug claimed successfully — new users go to pre-filled form
              const slugRedirect = isNewUser
                ? `/setup?slug_claimed=${claimedSlug}`
                : `/orders?slug_claimed=${claimedSlug}`;
              const response = NextResponse.redirect(`${origin}${slugRedirect}`);
              response.cookies.set("claimed_slug", "", { maxAge: 0, path: "/" });
              response.cookies.set("referral_code", "", { maxAge: 0, path: "/" });
              response.cookies.set("mitra_role", "", { maxAge: 0, path: "/" });
              return response;
            }
          }
        } catch {
          // best-effort — proceed to redirect
        }
      }

      const defaultRedirect = isNewUser ? "/setup" : next;
      const response = NextResponse.redirect(`${origin}${defaultRedirect}`);
      response.cookies.set("claimed_slug", "", { maxAge: 0, path: "/" });
      response.cookies.set("referral_code", "", { maxAge: 0, path: "/" });
      response.cookies.set("community_code", "", { maxAge: 0, path: "/" });
      response.cookies.set("mitra_role", "", { maxAge: 0, path: "/" });
      return response;
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
