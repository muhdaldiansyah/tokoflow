"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";

interface DayLog {
  id?: string;
  log_date: string;
  smoke_test_day: number;
  wa_messages_handled: number;
  orders_processed: number;
  payments_matched: number;
  invoices_generated: number;
  hours_invested: number;
  customer_complaints: number;
  ai_tone_detection_incidents: number;
  trust_degradation_incidents: number;
  what_worked?: string | null;
  what_broke?: string | null;
  merchant_feedback?: string | null;
}

const blank: DayLog = {
  log_date: new Date().toISOString().slice(0, 10),
  smoke_test_day: 1,
  wa_messages_handled: 0,
  orders_processed: 0,
  payments_matched: 0,
  invoices_generated: 0,
  hours_invested: 0,
  customer_complaints: 0,
  ai_tone_detection_incidents: 0,
  trust_degradation_incidents: 0,
  what_worked: "",
  what_broke: "",
  merchant_feedback: "",
};

export default function SmokeTestPage() {
  const [list, setList] = useState<DayLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DayLog>(blank);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/phase-0/smoke-test");
      if (r.ok) {
        const data = await r.json();
        setList(data.logs || []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        what_worked: form.what_worked?.trim() || null,
        what_broke: form.what_broke?.trim() || null,
        merchant_feedback: form.merchant_feedback?.trim() || null,
      };
      const r = await fetch("/api/admin/phase-0/smoke-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        toast.error(d.error || "Save failed");
        return;
      }
      toast.success("Smoke test day saved");
      setShowForm(false);
      setForm(blank);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error — try again");
    } finally {
      setSaving(false);
    }
  }

  const totalHours = list.reduce((sum, l) => sum + (l.hours_invested || 0), 0);
  const totalAITone = list.reduce((sum, l) => sum + (l.ai_tone_detection_incidents || 0), 0);
  const totalTrustIssues = list.reduce((sum, l) => sum + (l.trust_degradation_incidents || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/phase-0"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg border bg-card hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Smoke Test Daily Log</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track 0.5 · Aldi as manual twin · {list.length}/14 days · {totalHours.toFixed(1)}h total
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg bg-warm-green text-white text-sm font-medium hover:bg-warm-green-hover"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Log day"}
        </button>
      </div>

      {(totalAITone > 0 || totalTrustIssues > 0) && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-3 text-sm text-red-800">
          ⚠️ Kill trigger #3 risk: {totalAITone} AI tone detection
          {totalAITone === 1 ? "" : "s"} + {totalTrustIssues} trust degradation incident
          {totalTrustIssues === 1 ? "" : "s"} logged. Review SYNTHESIS-2026-05-05.md §5 — single
          incident kills smoke test.
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-card p-4 space-y-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date</label>
              <input
                type="date"
                value={form.log_date}
                onChange={(e) => setForm({ ...form, log_date: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Day (1-14)</label>
              <input
                type="number"
                min={1}
                max={14}
                value={form.smoke_test_day}
                onChange={(e) => setForm({ ...form, smoke_test_day: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Hours invested today</label>
              <input
                type="number"
                step="0.25"
                min={0}
                max={24}
                value={form.hours_invested}
                onChange={(e) => setForm({ ...form, hours_invested: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">WA messages handled</label>
              <input
                type="number"
                min={0}
                value={form.wa_messages_handled}
                onChange={(e) => setForm({ ...form, wa_messages_handled: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Orders processed</label>
              <input
                type="number"
                min={0}
                value={form.orders_processed}
                onChange={(e) => setForm({ ...form, orders_processed: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Payments matched</label>
              <input
                type="number"
                min={0}
                value={form.payments_matched}
                onChange={(e) => setForm({ ...form, payments_matched: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Invoices generated</label>
              <input
                type="number"
                min={0}
                value={form.invoices_generated}
                onChange={(e) => setForm({ ...form, invoices_generated: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Customer complaints</label>
              <input
                type="number"
                min={0}
                value={form.customer_complaints}
                onChange={(e) => setForm({ ...form, customer_complaints: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs text-red-600 mb-1 block">AI tone detected</label>
              <input
                type="number"
                min={0}
                value={form.ai_tone_detection_incidents}
                onChange={(e) =>
                  setForm({ ...form, ai_tone_detection_incidents: Number(e.target.value) })
                }
                className="w-full h-10 px-3 rounded-lg border-2 border-red-200 bg-background text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs text-red-600 mb-1 block">Trust degradation</label>
              <input
                type="number"
                min={0}
                value={form.trust_degradation_incidents}
                onChange={(e) =>
                  setForm({ ...form, trust_degradation_incidents: Number(e.target.value) })
                }
                className="w-full h-10 px-3 rounded-lg border-2 border-red-200 bg-background text-sm tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">What worked</label>
            <textarea
              value={form.what_worked || ""}
              onChange={(e) => setForm({ ...form, what_worked: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-y"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">What broke</label>
            <textarea
              value={form.what_broke || ""}
              onChange={(e) => setForm({ ...form, what_broke: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-y"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Merchant feedback (verbatim)</label>
            <textarea
              value={form.merchant_feedback || ""}
              onChange={(e) => setForm({ ...form, merchant_feedback: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-y"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="h-9 px-3 inline-flex items-center rounded-lg border bg-card text-sm hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg bg-warm-green text-white text-sm font-medium hover:bg-warm-green-hover disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No daily logs yet. Smoke test runs Week 4-6 per scripts/phase-0/smoke-test/README.md.
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-xs">
              <tr>
                <th className="text-left px-3 py-2">Day</th>
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-right px-3 py-2">Hours</th>
                <th className="text-right px-3 py-2">WA msgs</th>
                <th className="text-right px-3 py-2">Orders</th>
                <th className="text-right px-3 py-2">Payments</th>
                <th className="text-right px-3 py-2 text-red-600">AI tone</th>
                <th className="text-right px-3 py-2 text-red-600">Trust</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((l) => (
                <tr key={l.id || l.log_date}>
                  <td className="px-3 py-2 font-mono">{l.smoke_test_day}</td>
                  <td className="px-3 py-2 text-xs">{l.log_date}</td>
                  <td className="px-3 py-2 font-mono text-right">{l.hours_invested}</td>
                  <td className="px-3 py-2 font-mono text-right">{l.wa_messages_handled}</td>
                  <td className="px-3 py-2 font-mono text-right">{l.orders_processed}</td>
                  <td className="px-3 py-2 font-mono text-right">{l.payments_matched}</td>
                  <td
                    className={`px-3 py-2 font-mono text-right ${
                      l.ai_tone_detection_incidents > 0 ? "text-red-700 font-bold" : ""
                    }`}
                  >
                    {l.ai_tone_detection_incidents}
                  </td>
                  <td
                    className={`px-3 py-2 font-mono text-right ${
                      l.trust_degradation_incidents > 0 ? "text-red-700 font-bold" : ""
                    }`}
                  >
                    {l.trust_degradation_incidents}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
