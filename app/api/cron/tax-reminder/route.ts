import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Monthly nudge for merchants with invoices that were sent but never
 * submitted to LHDN MyInvois. Runs on the 10th of each month (see
 * vercel.json cron config) and only fires for Pro plan users.
 *
 * Malaysian SMEs in the RM 1M–5M band hit mandatory e-Invoice from
 * 1 Jan 2027 but a grace "relaxation" applies through 31 Dec 2026.
 * This reminder exists so merchants don't miss the on-ramp.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Missing config" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, push_token, business_name, onboarding_drip, bisnis_until, quiet_hours_start, quiet_hours_end, tin",
    )
    .not("push_token", "is", null);

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ processed: 0, sent: 0 });
  }

  const now = new Date();
  // Malaysia Standard Time is UTC+8. Used for quiet-hours check below.
  const mytOffsetMs = 8 * 60 * 60 * 1000;
  const nowMyt = new Date(now.getTime() + mytOffsetMs);
  const hhmm = `${String(nowMyt.getUTCHours()).padStart(2, "0")}:${String(
    nowMyt.getUTCMinutes(),
  ).padStart(2, "0")}`;

  const monthKey = `myinvois_reminder_${nowMyt.getUTCFullYear()}_${String(
    nowMyt.getUTCMonth() + 1,
  ).padStart(2, "0")}`;

  const pushMessages: {
    to: string;
    title: string;
    body: string;
    sound: string;
    data: Record<string, unknown>;
  }[] = [];
  const updates: { id: string; drip: Record<string, string> }[] = [];

  for (const profile of profiles) {
    if (!profile.push_token) continue;
    // Pro-plan only — MyInvois feature is gated there.
    if (!profile.bisnis_until || new Date(profile.bisnis_until) < now) continue;
    if (!profile.tin) continue;

    const drip: Record<string, string> = profile.onboarding_drip || {};
    if (drip[monthKey]) continue;

    // Malaysia quiet hours — default 22:00–06:00.
    const qStart = profile.quiet_hours_start || "22:00";
    const qEnd = profile.quiet_hours_end || "06:00";
    const inQuietHours = qStart > qEnd
      ? hhmm >= qStart || hhmm < qEnd
      : hhmm >= qStart && hhmm < qEnd;
    if (inQuietHours) continue;

    const { count: unsubmitted } = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .in("status", ["sent", "paid"])
      .is("myinvois_uuid", null);

    if (!unsubmitted || unsubmitted === 0) continue;

    pushMessages.push({
      to: profile.push_token,
      title: `${unsubmitted} invoice${unsubmitted > 1 ? "s" : ""} ready for MyInvois`,
      body: `Each one is one tap away from LHDN. Best to send them within 72 hours of issuing — open invoices to review.`,
      sound: "default",
      data: { screen: "invoices" },
    });

    updates.push({ id: profile.id, drip: { ...drip, [monthKey]: now.toISOString() } });
  }

  for (const update of updates) {
    await supabase
      .from("profiles")
      .update({ onboarding_drip: update.drip })
      .eq("id", update.id);
  }

  let sent = 0;
  for (let i = 0; i < pushMessages.length; i += 100) {
    const batch = pushMessages.slice(i, i + 100);
    try {
      await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(batch),
      });
      sent += batch.length;
    } catch (err) {
      console.error("[tax-reminder] Push send failed:", err);
    }
  }

  return NextResponse.json({ processed: profiles.length, sent, updated: updates.length });
}
