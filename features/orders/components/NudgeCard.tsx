"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ChevronRight } from "lucide-react";

interface NudgeCardProps {
  ordersUsed: number;
  createdAt: string;
}

interface Nudge {
  id: string;
  text: string;
  href: string;
  condition: (ordersUsed: number, daysSinceCreation: number) => boolean;
}

const NUDGES: Nudge[] = [
  {
    id: "rekap",
    text: "Check your daily recap",
    href: "/recap",
    condition: (_, days) => days >= 7,
  },
  {
    id: "share",
    text: "Share link toko ke pelanggan",
    href: "/settings",
    condition: (ordersUsed) => ordersUsed >= 5,
  },
];

const STORAGE_KEY = "catatorder_dismissed_nudges";

function getDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function NudgeCard({ ordersUsed, createdAt }: NudgeCardProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDismissed(getDismissed());
    setMounted(true);
  }, []);

  if (!mounted || !createdAt) return null;

  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const activeNudge = NUDGES.find(
    (n) => !dismissed.includes(n.id) && n.condition(ordersUsed, daysSinceCreation)
  );

  if (!activeNudge) return null;

  function dismiss() {
    const updated = [...dismissed, activeNudge!.id];
    setDismissed(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  return (
    <div className="rounded-lg border bg-card p-3.5 shadow-sm flex items-center gap-3">
      <Link
        href={activeNudge.href}
        className="flex-1 min-w-0 flex items-center gap-2 text-sm text-foreground hover:text-foreground/80 transition-colors"
      >
        <span className="truncate">{activeNudge.text}</span>
        <ChevronRight className="w-4 h-4 shrink-0" />
      </Link>
      <button
        type="button"
        onClick={dismiss}
        className="p-1 text-muted-foreground hover:text-foreground shrink-0 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
