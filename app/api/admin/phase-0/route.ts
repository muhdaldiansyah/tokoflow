import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

interface InterviewRow {
  type: "friendly" | "hostile";
  three_tier_resonance: number | null;
  tier_1_love_mentioned: boolean | null;
  tier_2_love_mentioned: boolean | null;
  tier_3_top_pain_cited: boolean | null;
  sean_ellis_answer: string | null;
  wtp_rm_per_month: number | null;
  brand_friction: number | null;
  wave_2_spillover_names: string | null;
}

interface DistRow {
  week_number: number;
  followers_total: number;
  inbound_dm_total: number;
  inbound_dm_qualified: number;
  posts_published: number;
  substantive_comments: number;
}

interface SmokeRow {
  smoke_test_day: number;
  hours_invested: number;
  customer_complaints: number;
  ai_tone_detection_incidents: number;
  trust_degradation_incidents: number;
}

export async function GET(req: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admin role check
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Aggregate interviews
  const { data: interviews } = await supabase
    .from("phase_0_interviews")
    .select("*")
    .order("interview_number");

  const interviewRows = (interviews ?? []) as InterviewRow[];

  const interviewCount = interviewRows.length;
  const friendlyCount = interviewRows.filter((r) => r.type === "friendly").length;
  const hostileCount = interviewRows.filter((r) => r.type === "hostile").length;

  const resonanceScores = interviewRows
    .map((r) => r.three_tier_resonance)
    .filter((s): s is number => s !== null);
  const resonanceAvg =
    resonanceScores.length > 0
      ? resonanceScores.reduce((a, b) => a + b, 0) / resonanceScores.length
      : 0;
  const resonanceAtLeast7 = resonanceScores.filter((s) => s >= 7).length;

  const seanEllisA = interviewRows.filter(
    (r) => r.sean_ellis_answer === "a_very_disappointed",
  ).length;
  const seanEllisPct = interviewCount > 0 ? (seanEllisA / interviewCount) * 100 : 0;

  const wtpAtLeast49 = interviewRows.filter(
    (r) => (r.wtp_rm_per_month ?? 0) >= 49,
  ).length;

  const tier3PainCited = interviewRows.filter((r) => r.tier_3_top_pain_cited).length;
  const tier2LoveMentioned = interviewRows.filter((r) => r.tier_2_love_mentioned).length;

  const wave2Spillover = interviewRows.filter(
    (r) => (r.wave_2_spillover_names?.trim().length ?? 0) > 0,
  ).length;

  const brandFrictionScores = interviewRows
    .map((r) => r.brand_friction)
    .filter((s): s is number => s !== null);
  const brandFrictionAvg =
    brandFrictionScores.length > 0
      ? brandFrictionScores.reduce((a, b) => a + b, 0) / brandFrictionScores.length
      : 0;

  // Aggregate distribution
  const { data: distribution } = await supabase
    .from("phase_0_distribution_metrics")
    .select("*")
    .order("snapshot_date", { ascending: false })
    .limit(1);

  const latestDist = (distribution?.[0] ?? null) as DistRow | null;

  // Aggregate smoke test
  const { data: smokeTest } = await supabase
    .from("phase_0_smoke_test_log")
    .select("*")
    .order("smoke_test_day");

  const smokeRows = (smokeTest ?? []) as SmokeRow[];
  const smokeDaysLogged = smokeRows.length;
  const totalHoursInvested = smokeRows.reduce((sum, r) => sum + (r.hours_invested ?? 0), 0);
  const avgHoursPerDay = smokeDaysLogged > 0 ? totalHoursInvested / smokeDaysLogged : 0;
  const aiToneIncidents = smokeRows.reduce(
    (sum, r) => sum + (r.ai_tone_detection_incidents ?? 0),
    0,
  );
  const trustDegradationIncidents = smokeRows.reduce(
    (sum, r) => sum + (r.trust_degradation_incidents ?? 0),
    0,
  );
  const customerComplaints = smokeRows.reduce(
    (sum, r) => sum + (r.customer_complaints ?? 0),
    0,
  );

  // Compute kill trigger status (per SYNTHESIS-2026-05-05.md §5)
  // Pending = interview count <10 OR scoring incomplete (any null fields).
  // Only evaluate pass/kill once all 10 interviews logged AND scored.
  const allInterviewsScored =
    interviewCount === 10 && resonanceScores.length === 10;

  const triggers = {
    interviews_three_tier: {
      label: "Interviews: ≥7/10 resonate Three-Tier",
      target: 7,
      current: resonanceAtLeast7,
      status:
        !allInterviewsScored
          ? ("pending" as const)
          : resonanceAtLeast7 >= 7
            ? ("pass" as const)
            : ("kill" as const),
    },
    sean_ellis: {
      label: "Sean Ellis: ≥40% 'very disappointed'",
      target: 40,
      current: Math.round(seanEllisPct),
      status:
        interviewCount < 10
          ? ("pending" as const)
          : seanEllisPct >= 40
            ? ("pass" as const)
            : ("warning" as const),
    },
    wtp: {
      label: "WTP: ≥5/10 willing to pay RM 49+",
      target: 5,
      current: wtpAtLeast49,
      status:
        interviewCount < 10
          ? ("pending" as const)
          : wtpAtLeast49 >= 5
            ? ("pass" as const)
            : ("warning" as const),
    },
    tier_3_pain: {
      label: "Tier-3 mechanical residue: ≥3/10 cite as top pain",
      target: 3,
      current: tier3PainCited,
      status:
        interviewCount < 10
          ? ("pending" as const)
          : tier3PainCited >= 3
            ? ("pass" as const)
            : ("warning" as const),
    },
    tier_2_love: {
      label: "Tier-2 customer relationship: ≥2/10 mention as joy",
      target: 2,
      current: tier2LoveMentioned,
      status:
        interviewCount < 10
          ? ("pending" as const)
          : tier2LoveMentioned >= 2
            ? ("pass" as const)
            : ("warning" as const),
    },
    wave_2_spillover: {
      label: "Wave 2 spillover: ≥3/10 name non-F&B mompreneur friend",
      target: 3,
      current: wave2Spillover,
      status:
        interviewCount < 10
          ? ("pending" as const)
          : wave2Spillover >= 3
            ? ("pass" as const)
            : ("warning" as const),
    },
    brand_resonance: {
      label: "Brand friction <4/10 average (rebrand-flag if ≥4)",
      target: 4,
      current: Number(brandFrictionAvg.toFixed(2)),
      status:
        interviewCount < 10
          ? ("pending" as const)
          : brandFrictionAvg < 4
            ? ("pass" as const)
            : ("rebrand_flag" as const),
    },
    distribution_followers: {
      label: "Distribution: ≥300 followers cumulative by Week 8",
      target: 300,
      current: latestDist?.followers_total ?? 0,
      status:
        (latestDist?.week_number ?? 0) < 8
          ? ("pending" as const)
          : (latestDist?.followers_total ?? 0) >= 300
            ? ("pass" as const)
            : ("kill" as const),
    },
    distribution_dms: {
      label: "Distribution: ≥15 inbound DM cumulative by Week 8",
      target: 15,
      current: latestDist?.inbound_dm_total ?? 0,
      status:
        (latestDist?.week_number ?? 0) < 8
          ? ("pending" as const)
          : (latestDist?.inbound_dm_total ?? 0) >= 15
            ? ("pass" as const)
            : ("kill" as const),
    },
    smoke_test_ai_tone: {
      label: "Smoke test: zero customer AI-tone detections",
      target: 0,
      current: aiToneIncidents,
      status:
        smokeDaysLogged < 14
          ? ("pending" as const)
          : aiToneIncidents === 0
            ? ("pass" as const)
            : ("kill" as const),
    },
    smoke_test_trust: {
      label: "Smoke test: zero trust degradation incidents",
      target: 0,
      current: trustDegradationIncidents,
      status:
        smokeDaysLogged < 14
          ? ("pending" as const)
          : trustDegradationIncidents === 0
            ? ("pass" as const)
            : ("kill" as const),
    },
    smoke_test_hours: {
      label: "Smoke test: Aldi sustains ≤2 hours/day",
      target: 2,
      current: Number(avgHoursPerDay.toFixed(2)),
      status:
        smokeDaysLogged < 14
          ? ("pending" as const)
          : avgHoursPerDay <= 2
            ? ("pass" as const)
            : ("warning" as const),
    },
  };

  return NextResponse.json({
    interviews: {
      count: interviewCount,
      friendly: friendlyCount,
      hostile: hostileCount,
      resonance_avg: Number(resonanceAvg.toFixed(2)),
      resonance_at_least_7: resonanceAtLeast7,
      sean_ellis_pct: Number(seanEllisPct.toFixed(1)),
      wtp_at_least_49: wtpAtLeast49,
      tier_3_pain_cited: tier3PainCited,
      tier_2_love_mentioned: tier2LoveMentioned,
      wave_2_spillover: wave2Spillover,
      brand_friction_avg: Number(brandFrictionAvg.toFixed(2)),
    },
    distribution: latestDist,
    smoke_test: {
      days_logged: smokeDaysLogged,
      total_hours: Number(totalHoursInvested.toFixed(2)),
      avg_hours_per_day: Number(avgHoursPerDay.toFixed(2)),
      ai_tone_incidents: aiToneIncidents,
      trust_degradation_incidents: trustDegradationIncidents,
      customer_complaints: customerComplaints,
    },
    triggers,
  });
}
