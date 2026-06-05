"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertTriangle, XCircle, Clock, Tag, Download } from "lucide-react";

type TriggerStatus = "pass" | "warning" | "kill" | "rebrand_flag" | "pending";

interface TriggerRow {
  label: string;
  target: number;
  current: number;
  status: TriggerStatus;
}

interface Phase0Data {
  interviews: {
    count: number;
    friendly: number;
    hostile: number;
    resonance_avg: number;
    resonance_at_least_7: number;
    sean_ellis_pct: number;
    wtp_at_least_49: number;
    tier_3_pain_cited: number;
    tier_2_love_mentioned: number;
    wave_2_spillover: number;
    brand_friction_avg: number;
  };
  distribution: {
    week_number: number;
    followers_total: number;
    inbound_dm_total: number;
    inbound_dm_qualified: number;
    posts_published: number;
    substantive_comments: number;
  } | null;
  smoke_test: {
    days_logged: number;
    total_hours: number;
    avg_hours_per_day: number;
    ai_tone_incidents: number;
    trust_degradation_incidents: number;
    customer_complaints: number;
  };
  triggers: Record<string, TriggerRow>;
}

const STATUS_CONFIG: Record<TriggerStatus, { color: string; icon: typeof CheckCircle2; label: string }> = {
  pass: { color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle2, label: "Pass" },
  warning: { color: "text-amber-700 bg-amber-50 border-amber-200", icon: AlertTriangle, label: "Warning" },
  kill: { color: "text-red-700 bg-red-50 border-red-200", icon: XCircle, label: "Kill trigger" },
  rebrand_flag: { color: "text-purple-700 bg-purple-50 border-purple-200", icon: Tag, label: "Rebrand flag" },
  pending: { color: "text-gray-600 bg-gray-50 border-gray-200", icon: Clock, label: "Pending" },
};

export default function Phase0Dashboard() {
  const [data, setData] = useState<Phase0Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/phase-0")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => setData(d))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-red-600">
        Error loading Phase 0 data: {error ?? "no data"}
      </div>
    );
  }

  const { interviews, distribution, smoke_test, triggers } = data;

  const triggerEntries = Object.entries(triggers);
  const passCount = triggerEntries.filter(([, t]) => t.status === "pass").length;
  const killCount = triggerEntries.filter(([, t]) => t.status === "kill").length;
  const warningCount = triggerEntries.filter(([, t]) => t.status === "warning").length;
  const pendingCount = triggerEntries.filter(([, t]) => t.status === "pending").length;
  const flagCount = triggerEntries.filter(([, t]) => t.status === "rebrand_flag").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Phase 0 Validation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gate 0 master dashboard · 7 pre-committed triggers · 8-week adversarial validation
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Link
            href="/admin/phase-0/interviews"
            className="px-3 h-9 inline-flex items-center rounded-lg border bg-card hover:bg-accent"
          >
            Log interview
          </Link>
          <Link
            href="/admin/phase-0/distribution"
            className="px-3 h-9 inline-flex items-center rounded-lg border bg-card hover:bg-accent"
          >
            Log distribution
          </Link>
          <Link
            href="/admin/phase-0/smoke-test"
            className="px-3 h-9 inline-flex items-center rounded-lg border bg-card hover:bg-accent"
          >
            Log smoke test
          </Link>
          <a
            href="/api/admin/phase-0/export"
            className="px-3 h-9 inline-flex items-center gap-1.5 rounded-lg bg-warm-green text-white hover:bg-warm-green-hover"
            title="Download retrospective markdown"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </a>
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard label="Pass" count={passCount} color="text-green-700 bg-green-50" />
        <SummaryCard label="Warning" count={warningCount} color="text-amber-700 bg-amber-50" />
        <SummaryCard label="Kill" count={killCount} color="text-red-700 bg-red-50" />
        <SummaryCard label="Rebrand flag" count={flagCount} color="text-purple-700 bg-purple-50" />
        <SummaryCard label="Pending" count={pendingCount} color="text-gray-600 bg-gray-50" />
      </div>

      {/* Kill trigger panel */}
      {killCount > 0 && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-800 font-semibold text-sm mb-2">
            <XCircle className="h-4 w-4" />
            {killCount} kill trigger{killCount > 1 ? "s" : ""} fired — written go/no-go memo required within 7 days
          </div>
          <p className="text-xs text-red-700">
            Per SYNTHESIS-2026-05-05.md §5: pre-committed triggers cannot be relaxed without formal D-XXX entry in
            docs/positioning/07-decisions.md.
          </p>
        </div>
      )}

      {/* Triggers table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b px-4 py-3 bg-muted/30">
          <h2 className="font-semibold text-sm">Pre-committed trigger sub-metrics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            12 in-dashboard sub-metrics aggregating to 4 of the 7 SYNTHESIS-level triggers. AI cost / Ariff partnership / SSM tracked externally.
          </p>
        </div>
        <div className="divide-y">
          {triggerEntries.map(([key, trigger]) => {
            const cfg = STATUS_CONFIG[trigger.status];
            const Icon = cfg.icon;
            return (
              <div
                key={key}
                className="px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{trigger.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Target: {trigger.target} · Current: <span className="font-mono">{trigger.current}</span>
                  </div>
                </div>
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${cfg.color}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cfg.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Track breakdowns */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Interviews */}
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h3 className="font-semibold text-sm">Interviews</h3>
          <div className="text-2xl font-mono">
            {interviews.count}<span className="text-base text-muted-foreground">/10</span>
          </div>
          <Stat label="Friendly" value={`${interviews.friendly}/5`} />
          <Stat label="Hostile" value={`${interviews.hostile}/5`} />
          <Stat label="Three-Tier resonance avg" value={interviews.resonance_avg.toFixed(1)} />
          <Stat label="Sean Ellis (a)" value={`${interviews.sean_ellis_pct}%`} />
          <Stat label="WTP RM 49+" value={`${interviews.wtp_at_least_49}/10`} />
          <Stat label="Brand friction avg" value={interviews.brand_friction_avg.toFixed(1)} />
        </div>

        {/* Distribution */}
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h3 className="font-semibold text-sm">Distribution (Track 0.9)</h3>
          {distribution ? (
            <>
              <div className="text-2xl font-mono">
                Week {distribution.week_number}
              </div>
              <Stat label="Followers" value={distribution.followers_total} />
              <Stat label="Posts published" value={distribution.posts_published} />
              <Stat label="Substantive comments" value={distribution.substantive_comments} />
              <Stat label="Inbound DM total" value={distribution.inbound_dm_total} />
              <Stat label="Inbound DM qualified" value={distribution.inbound_dm_qualified} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No data yet. Log first weekly snapshot via Track 0.9.</p>
          )}
        </div>

        {/* Smoke test */}
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h3 className="font-semibold text-sm">Smoke test (Track 0.5)</h3>
          <div className="text-2xl font-mono">
            {smoke_test.days_logged}<span className="text-base text-muted-foreground">/14 days</span>
          </div>
          <Stat label="Total hours invested" value={smoke_test.total_hours} />
          <Stat label="Avg hours/day" value={smoke_test.avg_hours_per_day} />
          <Stat label="AI tone detections" value={smoke_test.ai_tone_incidents} />
          <Stat label="Trust degradation" value={smoke_test.trust_degradation_incidents} />
          <Stat label="Customer complaints" value={smoke_test.customer_complaints} />
        </div>
      </div>

      <div className="rounded-xl border bg-muted/20 p-4 text-xs text-muted-foreground">
        References: <Link href="/SYNTHESIS-2026-05-05" className="underline">SYNTHESIS-2026-05-05.md</Link> ·{" "}
        scripts/phase-0/README.md · scripts/phase-0/merchant-interview.md · scripts/phase-0/distribution/README.md
      </div>
    </div>
  );
}

function SummaryCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`rounded-xl px-4 py-3 ${color}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="text-2xl font-semibold mt-0.5">{count}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium">{value}</span>
    </div>
  );
}
