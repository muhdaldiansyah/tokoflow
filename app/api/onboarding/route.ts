import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// WA Cloud API removed — see research/wa-bot-redesign/06

// Template names for each drip stage
const DRIP_TEMPLATES: Record<string, string> = {
  day0: "onboarding_welcome",
  day1: "onboarding_day1",
  day3_active: "onboarding_day3",
  day3_inactive: "onboarding_day3",
  day7_active: "onboarding_day7_active",
  day7_inactive: "onboarding_day7_inactive",
  day14_inactive: "onboarding_day14_inactive",
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildBodyComponents(name: string) {
  return [{ type: "body", parameters: [{ type: "text", text: name }] }];
}

// POST /api/onboarding — Manual trigger for WA onboarding drip
// Protected with CRON_SECRET env var
// Checks all profiles and sends appropriate drip message based on age + activity
export async function POST(request: NextRequest) {
  // Auth check — require secret key
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service role to read all profiles
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Missing Supabase config" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Fetch all profiles with business_phone (needed to send WA)
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, business_phone, orders_used, onboarding_drip, created_at")
    .not("business_phone", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();
  const results: { user: string; message: string; sent: boolean; detail?: string }[] = [];

  for (const profile of profiles || []) {
    const name = profile.full_name || "Kak";
    const phone = profile.business_phone;
    const ordersUsed = profile.orders_used || 0;
    const drip: Record<string, string> = profile.onboarding_drip || {};
    const createdAt = new Date(profile.created_at);
    const ageDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    let messageKey: string | null = null;
    let templateName: string | null = null;

    // Determine which message to send based on age and activity
    if (ageDays === 0 && !drip.day0) {
      messageKey = "day0";
      templateName = DRIP_TEMPLATES.day0;
    } else if (ageDays === 1 && !drip.day1 && ordersUsed === 0) {
      messageKey = "day1";
      templateName = DRIP_TEMPLATES.day1;
    } else if (ageDays >= 3 && ageDays < 7 && !drip.day3) {
      messageKey = "day3";
      templateName = ordersUsed > 0
        ? DRIP_TEMPLATES.day3_active
        : DRIP_TEMPLATES.day3_inactive;
    } else if (ageDays >= 7 && ageDays < 14 && !drip.day7) {
      messageKey = "day7";
      templateName = ordersUsed > 0
        ? DRIP_TEMPLATES.day7_active
        : DRIP_TEMPLATES.day7_inactive;
    } else if (ageDays >= 14 && !drip.day14 && ordersUsed === 0) {
      messageKey = "day14";
      templateName = DRIP_TEMPLATES.day14_inactive;
    }

    if (messageKey && templateName && phone) {
      // WA Cloud API removed — skip sending, just log
      const result = { success: false } as { success: boolean };

      if (result.success) {
        // Mark as sent
        const updatedDrip = { ...drip, [messageKey]: now.toISOString() };
        await supabase
          .from("profiles")
          .update({ onboarding_drip: updatedDrip })
          .eq("id", profile.id);
      }

      results.push({
        user: profile.id,
        message: messageKey,
        sent: result.success,
        detail: result.success ? undefined : "Cloud API send failed",
      });
    }
  }

  return NextResponse.json({
    processed: profiles?.length || 0,
    sent: results.filter((r) => r.sent).length,
    results,
  });
}
