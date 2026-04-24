"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Trash2, UserCircle2 } from "lucide-react";
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} from "@/features/staff/services/staff.service";
import type { Staff, StaffRole } from "@/features/staff/types/staff.types";
import { STAFF_ROLE_LABELS } from "@/features/staff/types/staff.types";
import { track } from "@/lib/analytics";

function stripMyPhonePrefix(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("60")) return digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState<StaffRole>("assistant");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getStaff();
      setStaff(data);
      setLoading(false);
    })();
  }, []);

  async function handleCreate() {
    if (!formName.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const phoneToSave = formPhone.trim() ? `+60${formPhone.trim()}` : undefined;
    const created = await createStaff({
      name: formName.trim(),
      phone: phoneToSave,
      role: formRole,
    });
    setSaving(false);
    if (!created) {
      toast.error("Could not create staff");
      return;
    }
    track("staff_created", { role: formRole });
    setStaff([...staff, created]);
    setShowForm(false);
    setFormName("");
    setFormPhone("");
    setFormRole("assistant");
    toast.success("Staff added");
  }

  async function handleToggleActive(row: Staff) {
    const updated = await updateStaff(row.id, { active: !row.active });
    if (!updated) {
      toast.error("Could not update");
      return;
    }
    setStaff(staff.map((s) => (s.id === row.id ? updated : s)));
  }

  async function handleDelete(row: Staff) {
    if (!window.confirm(`Remove ${row.name}? Assigned orders will become unassigned.`)) return;
    const ok = await deleteStaff(row.id);
    if (!ok) {
      toast.error("Could not delete");
      return;
    }
    track("staff_deleted", {});
    setStaff(staff.filter((s) => s.id !== row.id));
    toast.success("Staff removed");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">Staff</h1>
          <p className="text-sm text-muted-foreground">
            Assign orders to the right person. Workers see their name on the order card.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="h-9 px-3 flex items-center gap-1.5 rounded-lg bg-warm-green text-white text-sm font-medium hover:bg-warm-green/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add staff
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
          <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
            New staff member
          </p>
          <input
            type="text"
            placeholder="Full name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-full h-11 px-3 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
          />
          <div className="flex items-center border rounded-lg shadow-sm px-3 h-11 bg-card">
            <span className="text-sm text-muted-foreground mr-2">🇲🇾 +60</span>
            <span className="w-px h-4 bg-border mr-2" />
            <input
              type="tel"
              placeholder="12 345 6789 (optional)"
              value={formPhone}
              onChange={(e) => setFormPhone(stripMyPhonePrefix(e.target.value))}
              className="flex-1 h-full bg-transparent text-sm focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-md p-0.5 w-fit">
            {(["assistant", "owner"] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setFormRole(role)}
                className={`h-8 px-3 text-xs font-medium rounded transition-colors ${
                  formRole === role
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {STAFF_ROLE_LABELS[role]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowForm(false);
                setFormName("");
                setFormPhone("");
              }}
              className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 h-10 rounded-lg bg-warm-green text-white text-sm font-medium hover:bg-warm-green/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12">
          <UserCircle2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No staff yet. Add the first one to start assigning orders.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm divide-y divide-border">
          {staff.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                <UserCircle2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {STAFF_ROLE_LABELS[s.role]}
                  </span>
                </div>
                {s.phone && (
                  <p className="text-xs text-muted-foreground">{s.phone}</p>
                )}
              </div>
              <button
                onClick={() => handleToggleActive(s)}
                className={`h-7 px-2.5 text-xs font-medium rounded-full border transition-colors ${
                  s.active
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {s.active ? "Active" : "Inactive"}
              </button>
              <button
                onClick={() => handleDelete(s)}
                className="h-7 w-7 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
