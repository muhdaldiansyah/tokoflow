"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";

interface Interview {
  id?: string;
  interview_number: number;
  initial: string;
  type: "friendly" | "hostile";
  interview_date: string;
  vertical?: string | null;
  revenue_band?: "<5k" | "5-15k" | "15-50k" | ">50k" | null;
  three_tier_resonance?: number | null;
  tier_1_love_mentioned?: boolean;
  tier_2_love_mentioned?: boolean;
  tier_3_top_pain_cited?: boolean;
  top_pains?: string | null;
  sean_ellis_answer?: string | null;
  wtp_rm_per_month?: number | null;
  brand_friction?: number | null;
  brand_friction_notes?: string | null;
  wave_2_spillover_names?: string | null;
  trust_concerns?: string | null;
  beta_willing?: boolean;
  notes?: string | null;
}

const blankForm: Interview = {
  interview_number: 1,
  initial: "",
  type: "friendly",
  interview_date: new Date().toISOString().slice(0, 10),
  vertical: "",
  revenue_band: null,
  three_tier_resonance: null,
  tier_1_love_mentioned: false,
  tier_2_love_mentioned: false,
  tier_3_top_pain_cited: false,
  top_pains: "",
  sean_ellis_answer: null,
  wtp_rm_per_month: null,
  brand_friction: null,
  brand_friction_notes: "",
  wave_2_spillover_names: "",
  trust_concerns: "",
  beta_willing: false,
  notes: "",
};

export default function InterviewsPage() {
  const [list, setList] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Interview>(blankForm);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/phase-0/interviews");
      if (r.ok) {
        const data = await r.json();
        setList(data.interviews || []);
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
        vertical: form.vertical?.trim() || null,
        top_pains: form.top_pains?.trim() || null,
        brand_friction_notes: form.brand_friction_notes?.trim() || null,
        wave_2_spillover_names: form.wave_2_spillover_names?.trim() || null,
        trust_concerns: form.trust_concerns?.trim() || null,
        notes: form.notes?.trim() || null,
      };
      const r = await fetch("/api/admin/phase-0/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        toast.error(d.error || "Save failed");
        return;
      }
      toast.success("Interview saved");
      setShowForm(false);
      setForm(blankForm);
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
            <h1 className="text-2xl font-semibold">Phase 0 Interviews</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              5 friendly + 5 hostile · {list.length}/10 logged
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg bg-warm-green text-white text-sm font-medium hover:bg-warm-green-hover"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Log interview"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-card p-4 space-y-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumField
              label="Interview #"
              value={form.interview_number}
              onChange={(v) => setForm({ ...form, interview_number: typeof v === "number" ? v : 1 })}
              min={1}
              max={10}
            />
            <TxtField
              label="Initial (e.g. AS)"
              value={form.initial}
              onChange={(v) => setForm({ ...form, initial: v })}
              maxLength={5}
            />
            <SelectField
              label="Type"
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v as "friendly" | "hostile" })}
              options={[
                { value: "friendly", label: "Friendly" },
                { value: "hostile", label: "Hostile" },
              ]}
            />
            <TxtField
              label="Date"
              type="date"
              value={form.interview_date}
              onChange={(v) => setForm({ ...form, interview_date: v })}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <TxtField
              label="Vertical (e.g. catering)"
              value={form.vertical || ""}
              onChange={(v) => setForm({ ...form, vertical: v })}
            />
            <SelectField
              label="Revenue band"
              value={form.revenue_band || ""}
              onChange={(v) =>
                setForm({
                  ...form,
                  revenue_band: (v || null) as Interview["revenue_band"],
                })
              }
              options={[
                { value: "", label: "—" },
                { value: "<5k", label: "Under RM 5K/mo" },
                { value: "5-15k", label: "RM 5-15K/mo" },
                { value: "15-50k", label: "RM 15-50K/mo" },
                { value: ">50k", label: "Over RM 50K/mo" },
              ]}
            />
            <NumField
              label="Three-Tier resonance (1-10)"
              value={form.three_tier_resonance ?? ""}
              onChange={(v) =>
                setForm({
                  ...form,
                  three_tier_resonance: v === "" ? null : Number(v),
                })
              }
              min={1}
              max={10}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <CheckField
              label="Tier 1 love (craft) mentioned"
              checked={form.tier_1_love_mentioned || false}
              onChange={(v) => setForm({ ...form, tier_1_love_mentioned: v })}
            />
            <CheckField
              label="Tier 2 love (customer) mentioned"
              checked={form.tier_2_love_mentioned || false}
              onChange={(v) => setForm({ ...form, tier_2_love_mentioned: v })}
            />
            <CheckField
              label="Tier 3 top pain cited"
              checked={form.tier_3_top_pain_cited || false}
              onChange={(v) => setForm({ ...form, tier_3_top_pain_cited: v })}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <SelectField
              label="Sean Ellis answer"
              value={form.sean_ellis_answer || ""}
              onChange={(v) =>
                setForm({ ...form, sean_ellis_answer: v || null })
              }
              options={[
                { value: "", label: "—" },
                { value: "a_very_disappointed", label: "(a) very disappointed" },
                { value: "b_somewhat_disappointed", label: "(b) somewhat" },
                { value: "c_not_disappointed", label: "(c) not disappointed" },
              ]}
            />
            <NumField
              label="WTP RM/month"
              value={form.wtp_rm_per_month ?? ""}
              onChange={(v) =>
                setForm({
                  ...form,
                  wtp_rm_per_month: v === "" ? null : Number(v),
                })
              }
              min={0}
              max={500}
            />
            <NumField
              label="Brand friction (1-10)"
              value={form.brand_friction ?? ""}
              onChange={(v) =>
                setForm({
                  ...form,
                  brand_friction: v === "" ? null : Number(v),
                })
              }
              min={1}
              max={10}
            />
          </div>

          <TxtArea
            label="Top 3 pains (free text)"
            value={form.top_pains || ""}
            onChange={(v) => setForm({ ...form, top_pains: v })}
          />

          <TxtArea
            label="Wave 2 spillover (non-F&B mompreneur friend names/verticals)"
            value={form.wave_2_spillover_names || ""}
            onChange={(v) => setForm({ ...form, wave_2_spillover_names: v })}
          />

          <TxtArea
            label="Trust concerns (hostile only)"
            value={form.trust_concerns || ""}
            onChange={(v) => setForm({ ...form, trust_concerns: v })}
          />

          <TxtArea
            label="Notes"
            value={form.notes || ""}
            onChange={(v) => setForm({ ...form, notes: v })}
          />

          <CheckField
            label="Beta-willing (would test alpha)"
            checked={form.beta_willing || false}
            onChange={(v) => setForm({ ...form, beta_willing: v })}
          />

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
          No interviews logged yet. Click &quot;Log interview&quot; to start.
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-xs">
              <tr>
                <th className="text-left px-3 py-2">#</th>
                <th className="text-left px-3 py-2">Initial</th>
                <th className="text-left px-3 py-2">Type</th>
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-left px-3 py-2">Resonance</th>
                <th className="text-left px-3 py-2">Sean Ellis</th>
                <th className="text-left px-3 py-2">WTP</th>
                <th className="text-left px-3 py-2">Brand</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((i) => (
                <tr key={i.id || i.interview_number}>
                  <td className="px-3 py-2 font-mono">{i.interview_number}</td>
                  <td className="px-3 py-2">{i.initial}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs ${
                        i.type === "friendly"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {i.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">{i.interview_date}</td>
                  <td className="px-3 py-2 font-mono">{i.three_tier_resonance ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">
                    {i.sean_ellis_answer === "a_very_disappointed"
                      ? "(a)"
                      : i.sean_ellis_answer === "b_somewhat_disappointed"
                        ? "(b)"
                        : i.sean_ellis_answer === "c_not_disappointed"
                          ? "(c)"
                          : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono">
                    {i.wtp_rm_per_month != null ? `RM ${i.wtp_rm_per_month}` : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono">{i.brand_friction ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TxtField({
  label,
  value,
  onChange,
  type = "text",
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-lg border bg-background text-sm"
      />
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number | string;
  onChange: (v: string | number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="w-full h-10 px-3 rounded-lg border bg-background text-sm tabular-nums"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-lg border bg-background text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-border"
      />
      {label}
    </label>
  );
}

function TxtArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-y"
      />
    </div>
  );
}
