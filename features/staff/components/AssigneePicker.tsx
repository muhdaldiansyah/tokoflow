"use client";

import { useEffect, useState } from "react";
import { UserCircle2, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getStaff, assignOrder } from "../services/staff.service";
import type { Staff } from "../types/staff.types";
import { track } from "@/lib/analytics";

interface AssigneePickerProps {
  orderId: string;
  assignedStaffId?: string | null;
  onChange?: (staffId: string | null) => void;
}

export function AssigneePicker({
  orderId,
  assignedStaffId,
  onChange,
}: AssigneePickerProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [current, setCurrent] = useState<string | null>(assignedStaffId ?? null);

  useEffect(() => {
    (async () => {
      const data = await getStaff();
      setStaff(data.filter((s) => s.active));
      setLoading(false);
    })();
  }, []);

  async function assign(staffId: string | null) {
    setSaving(staffId ?? "unassign");
    const ok = await assignOrder(orderId, staffId);
    setSaving(null);
    if (!ok) {
      toast.error("Could not assign");
      return;
    }
    setCurrent(staffId);
    onChange?.(staffId);
    track("order_assigned", { orderId, staffId: staffId ?? null });
    toast.success(staffId ? "Order assigned" : "Assignment cleared");
  }

  if (loading) {
    return <div className="h-9 bg-muted animate-pulse rounded-lg" />;
  }

  if (staff.length === 0) {
    return (
      <div className="text-[11px] text-muted-foreground">
        No active staff.{" "}
        <a href="/settings/staff" className="underline">
          Add staff
        </a>{" "}
        to assign orders.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => assign(null)}
          disabled={saving !== null}
          className={`h-8 px-3 text-xs font-medium rounded-full border transition-colors flex items-center gap-1 ${
            current === null
              ? "bg-muted border-border text-foreground"
              : "bg-card border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          {saving === "unassign" ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : current === null ? (
            <Check className="w-3 h-3" />
          ) : null}
          Unassigned
        </button>
        {staff.map((s) => {
          const active = current === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => assign(s.id)}
              disabled={saving !== null}
              className={`h-8 px-3 text-xs font-medium rounded-full border transition-colors flex items-center gap-1 ${
                active
                  ? "bg-warm-green-light border-warm-green text-warm-green"
                  : "bg-card border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {saving === s.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : active ? (
                <Check className="w-3 h-3" />
              ) : (
                <UserCircle2 className="w-3 h-3" />
              )}
              {s.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
