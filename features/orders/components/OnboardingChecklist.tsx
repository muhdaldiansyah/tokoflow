"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { getProfile } from "@/features/receipts/services/receipt.service";
import type { Profile } from "@/features/receipts/types/receipt.types";

interface NextStep {
  label: string;
  href: string;
}

// "What's next" — only surfaces incomplete steps as gentle suggestions.
// No completion fraction, no progress bar, no strikethrough. See
// docs/positioning/03-features.md anti-features ("complete profile X%").
export function OnboardingChecklist() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getProfile();
      setProfile(data);
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const products = await res.json();
          setProductCount(Array.isArray(products) ? products.length : 0);
        }
      } catch {
        setProductCount(0);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading || !profile || dismissed) return null;

  const hasProducts = (productCount ?? 0) > 0;
  const hasFirstOrder = (profile.orders_used ?? 0) > 0;

  // Only surface the next 1-2 most useful actions. Stop showing once basics done.
  const nextSteps: NextStep[] = [];
  if (!hasProducts) {
    nextSteps.push({ label: "Add your first product", href: "/products/new" });
  }
  if (hasProducts && !hasFirstOrder) {
    nextSteps.push({ label: "Try a sample order", href: "/orders/new?contoh=1" });
  }

  if (nextSteps.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between px-4 h-11 border-b border-border/60">
        <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
          What&rsquo;s next
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 -mr-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="px-2 py-1.5">
        {nextSteps.map((step) => (
          <Link
            key={step.href}
            href={step.href}
            className="flex items-center justify-between gap-3 px-2 py-2.5 rounded-md hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm text-foreground">{step.label}</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
