import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { generateSlug } from "@/lib/utils/slug";
import { encryptSecret, isEncryptedEnvelope } from "@/lib/crypto/secret-box";

// GET - Get current user's profile (with lazy monthly counter reset)
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !data) {
      // Profile doesn't exist yet — upsert
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating profile:", insertError);
        return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
      }
      return NextResponse.json(newProfile);
    }

    // Lazy cleanup: reset counters on month change
    const now = new Date();
    const resetAt = data.counter_reset_at ? new Date(data.counter_reset_at) : null;
    if (!resetAt || resetAt.getMonth() !== now.getMonth() || resetAt.getFullYear() !== now.getFullYear()) {
      const { data: updated } = await supabase
        .from("profiles")
        .update({
          orders_used: 0,
          receipts_used: 0,
          packs_bought_this_month: 0,
          counter_reset_at: now.toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();
      if (updated) return NextResponse.json(updated);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update profile fields (handles all toggle updates)
export async function PUT(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    // General profile fields
    if (body.full_name !== undefined) updates.full_name = body.full_name;
    if (body.business_name !== undefined) updates.business_name = body.business_name;
    if (body.business_phone !== undefined) updates.business_phone = body.business_phone;
    if (body.business_address !== undefined) updates.business_address = body.business_address;
    if (body.qris_url !== undefined) updates.qris_url = body.qris_url;
    if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;
    if (body.logo_url !== undefined) updates.logo_url = body.logo_url;
    if (body.npwp !== undefined) updates.npwp = body.npwp;
    if (body.nitku !== undefined) updates.nitku = body.nitku;
    if (body.wp_type !== undefined) updates.wp_type = body.wp_type;
    if (body.wp_registered_year !== undefined) updates.wp_registered_year = body.wp_registered_year;

    // MY tax identity (migration 077).
    if (body.tin !== undefined) updates.tin = body.tin ? String(body.tin).trim() : null;
    if (body.brn !== undefined) updates.brn = body.brn ? String(body.brn).trim() : null;
    if (body.sst_registration_id !== undefined) {
      updates.sst_registration_id = body.sst_registration_id
        ? String(body.sst_registration_id).trim()
        : null;
    }
    if (body.default_sst_rate !== undefined) {
      const rate = Number(body.default_sst_rate);
      if (rate === 0 || rate === 6) updates.default_sst_rate = rate;
    }
    if (body.myinvois_client_id !== undefined) {
      updates.myinvois_client_id = body.myinvois_client_id
        ? String(body.myinvois_client_id).trim()
        : null;
    }
    if (body.myinvois_client_secret_enc !== undefined) {
      const raw = body.myinvois_client_secret_enc
        ? String(body.myinvois_client_secret_enc)
        : null;
      if (raw === null) {
        updates.myinvois_client_secret_enc = null;
      } else if (isEncryptedEnvelope(raw)) {
        // Already encrypted (e.g. round-tripped from another env); store as-is.
        updates.myinvois_client_secret_enc = raw;
      } else {
        try {
          updates.myinvois_client_secret_enc = encryptSecret(raw);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          return NextResponse.json(
            { error: `Cannot store MyInvois secret: ${message}` },
            { status: 500 },
          );
        }
      }
    }
    if (body.target_food_cost_percent !== undefined) updates.target_food_cost_percent = body.target_food_cost_percent;
    if (body.overhead_estimate_pct !== undefined) updates.overhead_estimate_pct = body.overhead_estimate_pct;
    if (body.quiet_hours_start !== undefined) updates.quiet_hours_start = body.quiet_hours_start;
    if (body.quiet_hours_end !== undefined) updates.quiet_hours_end = body.quiet_hours_end;

    // Feature toggles
    if (body.order_form_enabled !== undefined) updates.order_form_enabled = body.order_form_enabled;
    if (body.preorder_enabled !== undefined) updates.preorder_enabled = body.preorder_enabled;
    if (body.dine_in_enabled !== undefined) updates.dine_in_enabled = body.dine_in_enabled;
    if (body.langganan_enabled !== undefined) updates.langganan_enabled = body.langganan_enabled;
    if (body.booking_enabled !== undefined) updates.booking_enabled = body.booking_enabled;
    if (body.daily_order_capacity !== undefined) updates.daily_order_capacity = body.daily_order_capacity;
    if (body.push_token !== undefined) updates.push_token = body.push_token;
    if (body.notify_new_order_email !== undefined) updates.notify_new_order_email = !!body.notify_new_order_email;
    if (body.business_type !== undefined) updates.business_type = body.business_type;
    if (body.community_id !== undefined) updates.community_id = body.community_id;

    // Marketplace fields
    if (body.city_id !== undefined) {
      updates.city_id = body.city_id;
      // Auto-populate denormalized city/city_slug from lookup
      if (body.city_id) {
        const { data: cityRow } = await supabase
          .from("cities")
          .select("name, slug")
          .eq("id", body.city_id)
          .single();
        if (cityRow) {
          updates.city = cityRow.name;
          updates.city_slug = cityRow.slug;
        }
      } else {
        updates.city = null;
        updates.city_slug = null;
      }
    }
    // Legacy: still accept direct city/city_slug for backward compat
    if (body.city !== undefined && body.city_id === undefined) updates.city = body.city;
    if (body.city_slug !== undefined && body.city_id === undefined) updates.city_slug = body.city_slug;
    if (body.business_category !== undefined) {
      updates.business_category = body.business_category;
      // Auto-set overhead from category if user hasn't explicitly set one
      if (body.business_category && body.overhead_estimate_pct === undefined) {
        const { data: catRow } = await supabase
          .from("business_categories")
          .select("overhead_estimate_pct")
          .eq("id", body.business_category)
          .single();
        if (catRow?.overhead_estimate_pct != null) {
          updates.overhead_estimate_pct = catRow.overhead_estimate_pct;
        }
      }
    }
    if (body.business_description !== undefined) updates.business_description = body.business_description;
    if (body.is_listed !== undefined) updates.is_listed = body.is_listed;
    if (body.operating_hours !== undefined) updates.operating_hours = body.operating_hours;

    // Auto-generate slug from business_name if slug is null or was auto-generated from personal name
    if (body.business_name) {
      const { data: current } = await supabase
        .from("profiles")
        .select("slug, full_name")
        .eq("id", user.id)
        .single();

      const autoSlugFromName = current?.full_name ? generateSlug(current.full_name) : null;
      const slugIsDefault = !current?.slug || current.slug === autoSlugFromName;

      if (slugIsDefault) {
        const baseSlug = generateSlug(body.business_name);
        if (baseSlug && baseSlug.length >= 3) {
          // Try base slug, then with numeric suffix
          let slug: string | null = null;
          const { data: existing } = await supabase
            .from("profiles")
            .select("id")
            .eq("slug", baseSlug)
            .maybeSingle();

          if (!existing) {
            slug = baseSlug;
          } else {
            for (let i = 2; i <= 10; i++) {
              const candidate = `${baseSlug}-${i}`.slice(0, 50);
              const { data: taken } = await supabase
                .from("profiles")
                .select("id")
                .eq("slug", candidate)
                .maybeSingle();
              if (!taken) { slug = candidate; break; }
            }
          }
          if (slug) updates.slug = slug;
        }
      }
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update profile API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
