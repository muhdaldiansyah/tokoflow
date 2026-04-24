"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { getProfile } from "@/features/receipts/services/receipt.service";
import type { Profile } from "@/features/receipts/types/receipt.types";

interface Step {
  label: string;
  done: boolean;
  href?: string;
}

export function OnboardingChecklist() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getProfile();
      setProfile(data);

      // Check product count
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
  const hasProfileComplete = !!(profile.business_name && profile.logo_url && profile.business_address);
  const hasCityCategory = !!(profile.city && profile.business_category);

  const steps: Step[] = [
    { label: "Daftar akun", done: true },
    { label: "Tambah produk ke katalog", done: hasProducts, href: "/products" },
    { label: "Lengkapi profil toko", done: hasProfileComplete, href: "/profil/edit" },
    { label: "Isi kota & kategori bisnis", done: hasCityCategory, href: "/profil/edit" },
    { label: "Catat pesanan pertama", done: profile.orders_used > 0, href: "/orders/new?contoh=1" },
    { label: "Kirim konfirmasi ke pelanggan via WA", done: !!profile.first_wa_sent_at },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  // Don't show if all steps complete
  if (allDone) return null;

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 h-12 hover:bg-muted/50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Mulai pakai Tokoflow</span>
          <span className="text-xs text-muted-foreground">{completedCount}/{steps.length}</span>
        </div>
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {!collapsed && (
        <div className="px-4 pb-4 space-y-2">
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-warm-green rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / steps.length) * 100}%` }}
            />
          </div>
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              {step.done ? (
                <div className="w-5 h-5 rounded-full bg-warm-green-light flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-warm-green" />
                </div>
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
              )}
              {step.done || !step.href ? (
                <span className={`text-sm ${step.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {step.label}
                </span>
              ) : (
                <Link href={step.href} className="text-sm text-foreground font-medium hover:underline">
                  {step.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
