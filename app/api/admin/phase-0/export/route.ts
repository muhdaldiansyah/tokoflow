import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

/**
 * Phase 0 retrospective export — generates Markdown report of all Phase 0 data.
 *
 * Aldi runs this at end of Week 8 to compile go/no-go decision memo per
 * SYNTHESIS-2026-05-05.md §7.3 Phase 0 Gate. Produces:
 * - Interview aggregate (10 rows + scoring)
 * - Distribution timeline (8 weekly snapshots)
 * - Smoke test summary (14 daily logs + kill flags)
 * - 7 trigger pass/kill status
 * - Recommended decision (PASS / WARNING / KILL)
 *
 * GET /api/admin/phase-0/export → returns text/markdown
 */

interface InterviewRow {
  interview_number: number;
  initial: string;
  type: "friendly" | "hostile";
  interview_date: string;
  vertical: string | null;
  revenue_band: string | null;
  three_tier_resonance: number | null;
  tier_1_love_mentioned: boolean | null;
  tier_2_love_mentioned: boolean | null;
  tier_3_top_pain_cited: boolean | null;
  top_pains: string | null;
  sean_ellis_answer: string | null;
  wtp_rm_per_month: number | null;
  brand_friction: number | null;
  wave_2_spillover_names: string | null;
  beta_willing: boolean | null;
}

interface DistRow {
  snapshot_date: string;
  week_number: number;
  followers_total: number;
  posts_published: number;
  substantive_comments: number;
  inbound_dm_total: number;
  inbound_dm_qualified: number;
}

interface SmokeRow {
  log_date: string;
  smoke_test_day: number;
  hours_invested: number;
  wa_messages_handled: number;
  orders_processed: number;
  customer_complaints: number;
  ai_tone_detection_incidents: number;
  trust_degradation_incidents: number;
  what_worked: string | null;
  what_broke: string | null;
}

export async function GET(req: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    { data: interviews },
    { data: distribution },
    { data: smokeTest },
  ] = await Promise.all([
    supabase
      .from("phase_0_interviews")
      .select("*")
      .order("interview_number"),
    supabase
      .from("phase_0_distribution_metrics")
      .select("*")
      .order("snapshot_date"),
    supabase
      .from("phase_0_smoke_test_log")
      .select("*")
      .order("smoke_test_day"),
  ]);

  const interviewRows = (interviews ?? []) as InterviewRow[];
  const distRows = (distribution ?? []) as DistRow[];
  const smokeRows = (smokeTest ?? []) as SmokeRow[];

  const md = generateMarkdown(interviewRows, distRows, smokeRows);

  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="phase-0-retrospective-${new Date().toISOString().slice(0, 10)}.md"`,
    },
  });
}

function generateMarkdown(
  interviews: InterviewRow[],
  dist: DistRow[],
  smoke: SmokeRow[],
): string {
  const lines: string[] = [];
  const date = new Date().toISOString().slice(0, 10);

  lines.push(`# Phase 0 Retrospective — ${date}`);
  lines.push("");
  lines.push(`> Generated from /api/admin/phase-0/export. Source: Phase 0 admin dashboard.`);
  lines.push(`> Per [SYNTHESIS-2026-05-05.md §7.3](./SYNTHESIS-2026-05-05.md) Phase 0 Gate. Decision memo input.`);
  lines.push("");

  // ============ Interviews aggregate ============
  lines.push("## 1. Interview aggregate");
  lines.push("");
  const interviewCount = interviews.length;
  const friendly = interviews.filter((i) => i.type === "friendly").length;
  const hostile = interviews.filter((i) => i.type === "hostile").length;

  const resonanceScores = interviews
    .map((i) => i.three_tier_resonance)
    .filter((s): s is number => s !== null);
  const resAvg =
    resonanceScores.length > 0
      ? (resonanceScores.reduce((a, b) => a + b, 0) / resonanceScores.length).toFixed(2)
      : "n/a";
  const resAtLeast7 = resonanceScores.filter((s) => s >= 7).length;
  const seanA = interviews.filter((i) => i.sean_ellis_answer === "a_very_disappointed").length;
  const seanPct = interviewCount > 0 ? ((seanA / interviewCount) * 100).toFixed(1) : "0";
  const wtp49 = interviews.filter((i) => (i.wtp_rm_per_month ?? 0) >= 49).length;
  const tier3Pain = interviews.filter((i) => i.tier_3_top_pain_cited).length;
  const tier2Love = interviews.filter((i) => i.tier_2_love_mentioned).length;
  const wave2 = interviews.filter(
    (i) => (i.wave_2_spillover_names?.trim().length ?? 0) > 0,
  ).length;

  const brandFrictionScores = interviews
    .map((i) => i.brand_friction)
    .filter((s): s is number => s !== null);
  const brandAvg =
    brandFrictionScores.length > 0
      ? (brandFrictionScores.reduce((a, b) => a + b, 0) / brandFrictionScores.length).toFixed(2)
      : "n/a";

  lines.push(`- Total: **${interviewCount}/10** (${friendly} friendly + ${hostile} hostile)`);
  lines.push(`- Three-Tier resonance: avg **${resAvg}**, ${resAtLeast7} score ≥7/10`);
  lines.push(`- Sean Ellis (a) "very disappointed": **${seanPct}%** (target ≥40%)`);
  lines.push(`- WTP RM 49+/month: **${wtp49}/10** (target ≥5)`);
  lines.push(`- Tier-3 pain cited as top: **${tier3Pain}/10** (target ≥3)`);
  lines.push(`- Tier-2 love mentioned: **${tier2Love}/10** (target ≥2)`);
  lines.push(`- Wave 2 spillover names: **${wave2}/10** (target ≥3)`);
  lines.push(`- Brand friction avg: **${brandAvg}/10** (rebrand if ≥4)`);
  lines.push("");

  if (interviewCount > 0) {
    lines.push("### Interview detail");
    lines.push("");
    lines.push("| # | Initial | Type | Date | Resonance | Sean Ellis | WTP | Brand | Beta? |");
    lines.push("|---|---------|------|------|-----------|------------|-----|-------|-------|");
    for (const i of interviews) {
      lines.push(
        `| ${i.interview_number} | ${i.initial} | ${i.type} | ${i.interview_date} | ${
          i.three_tier_resonance ?? "—"
        } | ${formatSean(i.sean_ellis_answer)} | ${
          i.wtp_rm_per_month ?? "—"
        } | ${i.brand_friction ?? "—"} | ${i.beta_willing ? "✓" : ""} |`,
      );
    }
    lines.push("");
  }

  // ============ Distribution timeline ============
  lines.push("## 2. Distribution timeline (Track 0.9)");
  lines.push("");
  if (dist.length === 0) {
    lines.push("_No distribution snapshots logged yet._");
    lines.push("");
  } else {
    const latest = dist[dist.length - 1];
    lines.push(`- Latest week ${latest.week_number}: **${latest.followers_total}** followers, **${latest.inbound_dm_total}** inbound DM`);
    lines.push(`- Goal Week 8: ≥300 followers, ≥15 inbound DM`);
    lines.push("");
    lines.push("| Date | Week | Followers | Posts | Comments | DM total | DM qualified |");
    lines.push("|------|------|-----------|-------|----------|----------|--------------|");
    for (const s of dist) {
      lines.push(
        `| ${s.snapshot_date} | ${s.week_number} | ${s.followers_total} | ${s.posts_published} | ${s.substantive_comments} | ${s.inbound_dm_total} | ${s.inbound_dm_qualified} |`,
      );
    }
    lines.push("");
  }

  // ============ Smoke test summary ============
  lines.push("## 3. Smoke test summary (Track 0.5)");
  lines.push("");
  if (smoke.length === 0) {
    lines.push("_No smoke test days logged yet._");
    lines.push("");
  } else {
    const totalHours = smoke.reduce((s, r) => s + (r.hours_invested || 0), 0);
    const avgHours = totalHours / smoke.length;
    const totalAITone = smoke.reduce((s, r) => s + (r.ai_tone_detection_incidents || 0), 0);
    const totalTrust = smoke.reduce((s, r) => s + (r.trust_degradation_incidents || 0), 0);
    const totalComplaints = smoke.reduce((s, r) => s + (r.customer_complaints || 0), 0);

    lines.push(`- Days logged: **${smoke.length}/14**`);
    lines.push(`- Total hours invested: **${totalHours.toFixed(1)}h** (avg ${avgHours.toFixed(2)}h/day; target ≤2h/day)`);
    lines.push(`- AI tone detection incidents: **${totalAITone}** (target = 0; ANY hits kill trigger)`);
    lines.push(`- Trust degradation incidents: **${totalTrust}** (target = 0)`);
    lines.push(`- Customer complaints: **${totalComplaints}**`);
    lines.push("");

    const workedSummary = smoke.filter((s) => s.what_worked?.trim()).map((s) => `- Day ${s.smoke_test_day}: ${s.what_worked}`);
    if (workedSummary.length > 0) {
      lines.push("### What worked (highlights)");
      lines.push(workedSummary.slice(0, 5).join("\n"));
      lines.push("");
    }

    const brokeSummary = smoke.filter((s) => s.what_broke?.trim()).map((s) => `- Day ${s.smoke_test_day}: ${s.what_broke}`);
    if (brokeSummary.length > 0) {
      lines.push("### What broke (highlights)");
      lines.push(brokeSummary.slice(0, 5).join("\n"));
      lines.push("");
    }
  }

  // ============ Trigger evaluation ============
  lines.push("## 4. Pre-committed trigger evaluation (per SYNTHESIS §5)");
  lines.push("");

  const triggers = evaluateTriggers(interviews, dist, smoke);
  lines.push("| # | Trigger | Status | Detail |");
  lines.push("|---|---------|--------|--------|");
  for (const t of triggers) {
    lines.push(`| ${t.num} | ${t.label} | ${t.statusEmoji} ${t.status} | ${t.detail} |`);
  }
  lines.push("");

  // Auto-decision is computed over data-driven triggers only.
  // External (AI cost, Ariff, SSM) are tracked outside this dashboard and
  // would otherwise stay PENDING forever — leaving the report stuck in
  // "PARTIAL" even when in-dashboard signals are unanimous.
  const dataTriggers = triggers.filter((t) => !t.external);
  const externalCount = triggers.length - dataTriggers.length;
  const killTriggered = dataTriggers.some((t) => t.status === "KILL");
  const rebrandTriggered = dataTriggers.some((t) => t.status === "REBRAND_FLAG");
  const allPending = dataTriggers.every((t) => t.status === "PENDING");
  const allPass = dataTriggers.every(
    (t) => t.status === "PASS" || t.status === "REBRAND_FLAG",
  );

  // ============ Recommendation ============
  lines.push("## 5. Recommended decision");
  lines.push("");
  lines.push(
    `> Auto-decision computed over ${dataTriggers.length} data-driven triggers. ${externalCount} external triggers (AI cost, Ariff partnership, SSM) tracked outside dashboard — verify them manually before final go/no-go.`,
  );
  lines.push("");
  if (killTriggered) {
    lines.push(
      "### ❌ KILL or PIVOT — at least one kill trigger fired",
    );
    lines.push("");
    lines.push("Per synthesis: 'no rationalization when emotion arrives.' Write written go/no-go memo within 7 days. Update `docs/positioning/07-decisions.md` with formal D-XXX entry before any code work resumes.");
  } else if (allPending) {
    lines.push("### ⏳ PHASE 0 INCOMPLETE — keep validating");
    lines.push("");
    lines.push("No data-driven triggers have evaluable data yet. Continue Phase 0 execution. Re-run this export after Week 8 milestones.");
  } else if (allPass) {
    if (rebrandTriggered) {
      lines.push("### ✅ DATA-DRIVEN PASS WITH REBRAND — verify externals, then proceed");
      lines.push("");
      lines.push("All in-dashboard kill triggers cleared. Brand resonance suggests rebrand. **Before locking Phase 1**: confirm AI cost ≤RM 25/merchant/month (run `scripts/phase-0/ai-cost/measure.ts --full`), Ariff partnership signed, Sdn Bhd in SSM queue. Apply rebrand criteria from synthesis §6.1 (3-6 weeks switching cost).");
    } else {
      lines.push("### ✅ DATA-DRIVEN PASS — verify externals, then proceed to Phase 1");
      lines.push("");
      lines.push("All in-dashboard triggers clear. **Before locking Phase 1 spec**: confirm AI cost ≤RM 25/merchant/month, Ariff partnership signed, Sdn Bhd in SSM queue. Then update `docs/positioning/07-decisions.md` with D-018 (Phase 0 → Phase 1 transition memo).");
    }
  } else {
    lines.push("### ⚠️ PARTIAL — review warnings before deciding");
    lines.push("");
    lines.push("No kill triggers fired but some warnings present. Review the trigger detail above. Decide whether warnings are acceptable risk to push through, or whether to extend Phase 0 by 2-4 weeks for more data.");
  }
  lines.push("");

  // ============ Footer ============
  lines.push("---");
  lines.push("");
  lines.push(`*Generated ${date} from Phase 0 admin dashboard. Source: \`/admin/phase-0\`. Update `);
  lines.push(`\`docs/positioning/07-decisions.md\` with formal D-XXX entry capturing this retrospective + decision rationale.*`);

  return lines.join("\n");
}

function formatSean(answer: string | null): string {
  if (answer === "a_very_disappointed") return "(a) very";
  if (answer === "b_somewhat_disappointed") return "(b) some";
  if (answer === "c_not_disappointed") return "(c) not";
  return "—";
}

interface TriggerEval {
  num: number;
  label: string;
  status: "PASS" | "WARNING" | "KILL" | "REBRAND_FLAG" | "PENDING";
  statusEmoji: string;
  detail: string;
  // External triggers (AI cost, partnership, SSM) are tracked outside the
  // dashboard. They're surfaced in the report for completeness but excluded
  // from the auto-decision logic so a stuck PENDING doesn't block PASS.
  external?: boolean;
}

function evaluateTriggers(
  interviews: InterviewRow[],
  dist: DistRow[],
  smoke: SmokeRow[],
): TriggerEval[] {
  const interviewCount = interviews.length;
  const resonanceScores = interviews
    .map((i) => i.three_tier_resonance)
    .filter((s): s is number => s !== null);
  const resAtLeast7 = resonanceScores.filter((s) => s >= 7).length;
  const allScored = interviewCount === 10 && resonanceScores.length === 10;

  const brandScores = interviews
    .map((i) => i.brand_friction)
    .filter((s): s is number => s !== null);
  const brandAvg =
    brandScores.length > 0
      ? brandScores.reduce((a, b) => a + b, 0) / brandScores.length
      : 0;

  const latestDist = dist[dist.length - 1];
  const distDone = (latestDist?.week_number ?? 0) >= 8;
  const followers = latestDist?.followers_total ?? 0;
  const dms = latestDist?.inbound_dm_total ?? 0;

  const smokeDays = smoke.length;
  const smokeDone = smokeDays >= 14;
  const aiTone = smoke.reduce((s, r) => s + (r.ai_tone_detection_incidents || 0), 0);
  const trust = smoke.reduce((s, r) => s + (r.trust_degradation_incidents || 0), 0);

  const result: TriggerEval[] = [];

  result.push({
    num: 1,
    label: "AI cost ≤RM 25/merchant/month",
    status: "PENDING",
    statusEmoji: "⏳",
    detail:
      "Run `scripts/phase-0/ai-cost/measure.ts --full` to evaluate. Verdict appears in this row when measured.",
    external: true,
  });

  result.push({
    num: 2,
    label: "≥7/10 interviews resonate Three-Tier",
    status: !allScored ? "PENDING" : resAtLeast7 >= 7 ? "PASS" : "KILL",
    statusEmoji: !allScored ? "⏳" : resAtLeast7 >= 7 ? "✅" : "❌",
    detail: `${resAtLeast7}/10 score ≥7. ${allScored ? "" : `(${resonanceScores.length}/10 scored)`}`,
  });

  result.push({
    num: 3,
    label: "Smoke test: zero AI tone + zero trust degradation",
    status: !smokeDone
      ? "PENDING"
      : aiTone === 0 && trust === 0
        ? "PASS"
        : "KILL",
    statusEmoji: !smokeDone ? "⏳" : aiTone === 0 && trust === 0 ? "✅" : "❌",
    detail: `${smokeDays}/14 days. AI tone: ${aiTone}, trust: ${trust}.`,
  });

  result.push({
    num: 4,
    label: "Ariff partnership locked OR Plan B locked",
    status: "PENDING",
    statusEmoji: "⏳",
    detail: "Logged outside dashboard. Update `docs/positioning/07-decisions.md` D-XXX when signed.",
    external: true,
  });

  result.push({
    num: 5,
    label: "Sdn Bhd in SSM queue",
    status: "PENDING",
    statusEmoji: "⏳",
    detail: "Logged outside dashboard. SSM tracking external.",
    external: true,
  });

  result.push({
    num: 6,
    label: "Distribution: ≥300 followers + ≥15 inbound DM by Week 8",
    status: !distDone
      ? "PENDING"
      : followers >= 300 && dms >= 15
        ? "PASS"
        : "KILL",
    statusEmoji: !distDone ? "⏳" : followers >= 300 && dms >= 15 ? "✅" : "❌",
    detail: `${followers} followers, ${dms} DM. ${distDone ? "" : `(week ${latestDist?.week_number ?? 0}/8)`}`,
  });

  result.push({
    num: 7,
    label: "Brand friction <4/10 average (rebrand-flag if ≥4)",
    status:
      interviewCount < 10
        ? "PENDING"
        : brandAvg < 4
          ? "PASS"
          : "REBRAND_FLAG",
    statusEmoji:
      interviewCount < 10
        ? "⏳"
        : brandAvg < 4
          ? "✅"
          : "🏷️",
    detail: `Avg ${brandAvg.toFixed(2)}/10 from ${brandScores.length} scored.`,
  });

  return result;
}
