"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";

interface Snapshot {
  id?: string;
  snapshot_date: string;
  week_number: number;
  followers_total: number;
  posts_published: number;
  substantive_comments: number;
  inbound_dm_total: number;
  inbound_dm_qualified: number;
  notes?: string | null;
}

const blank: Snapshot = {
  snapshot_date: new Date().toISOString().slice(0, 10),
  week_number: 1,
  followers_total: 0,
  posts_published: 0,
  substantive_comments: 0,
  inbound_dm_total: 0,
  inbound_dm_qualified: 0,
  notes: "",
};

export default function DistributionPage() {
  const [list, setList] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Snapshot>(blank);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/phase-0/distribution");
      if (r.ok) {
        const data = await r.json();
        setList(data.snapshots || []);
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
        notes: form.notes?.trim() || null,
      };
      const r = await fetch("/api/admin/phase-0/distribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        toast.error(d.error || "Save failed");
        return;
      }
      toast.success("Distribution snapshot saved");
      setShowForm(false);
      setForm(blank);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error — try again");
    } finally {
      setSaving(false);
    }
  }

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
            <h1 className="text-2xl font-semibold">Distribution Snapshots</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track 0.9 · Weekly TikTok + komuniti checkpoints · Goal Week 8: ≥300 followers, ≥15 inbound DM
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg bg-warm-green text-white text-sm font-medium hover:bg-warm-green-hover"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Log snapshot"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-card p-4 space-y-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Snapshot date</label>
              <input
                type="date"
                value={form.snapshot_date}
                onChange={(e) => setForm({ ...form, snapshot_date: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Week number (1-8)</label>
              <input
                type="number"
                min={1}
                max={8}
                value={form.week_number}
                onChange={(e) => setForm({ ...form, week_number: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Followers cumulative</label>
              <input
                type="number"
                min={0}
                value={form.followers_total}
                onChange={(e) => setForm({ ...form, followers_total: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Posts published</label>
              <input
                type="number"
                min={0}
                value={form.posts_published}
                onChange={(e) => setForm({ ...form, posts_published: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Substantive comments</label>
              <input
                type="number"
                min={0}
                value={form.substantive_comments}
                onChange={(e) => setForm({ ...form, substantive_comments: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Inbound DM total</label>
              <input
                type="number"
                min={0}
                value={form.inbound_dm_total}
                onChange={(e) => setForm({ ...form, inbound_dm_total: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Inbound DM qualified</label>
              <input
                type="number"
                min={0}
                value={form.inbound_dm_qualified}
                onChange={(e) => setForm({ ...form, inbound_dm_qualified: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
            <textarea
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
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
          No snapshots yet. Log first weekly snapshot per scripts/phase-0/distribution/README.md.
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-xs">
              <tr>
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-left px-3 py-2">Week</th>
                <th className="text-right px-3 py-2">Followers</th>
                <th className="text-right px-3 py-2">Posts</th>
                <th className="text-right px-3 py-2">Comments</th>
                <th className="text-right px-3 py-2">DM total</th>
                <th className="text-right px-3 py-2">DM qual.</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((s) => (
                <tr key={s.id || s.snapshot_date}>
                  <td className="px-3 py-2 text-xs">{s.snapshot_date}</td>
                  <td className="px-3 py-2 font-mono">{s.week_number}</td>
                  <td className="px-3 py-2 font-mono text-right">{s.followers_total}</td>
                  <td className="px-3 py-2 font-mono text-right">{s.posts_published}</td>
                  <td className="px-3 py-2 font-mono text-right">{s.substantive_comments}</td>
                  <td className="px-3 py-2 font-mono text-right">{s.inbound_dm_total}</td>
                  <td className="px-3 py-2 font-mono text-right">{s.inbound_dm_qualified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
