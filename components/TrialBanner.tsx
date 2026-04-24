"use client";

import Link from "next/link";
import { FREE_MONTHLY_ORDERS } from "@/config/plans";

interface TrialBannerProps {
  ordersUsed: number;
  nudgeLevel: "none" | "soft" | "medium" | "urgent" | "exhausted";
  ordersRemaining: number;
}

export function TrialBanner({ ordersUsed, nudgeLevel, ordersRemaining }: TrialBannerProps) {
  if (nudgeLevel === "none") return null;

  if (nudgeLevel === "exhausted") {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800">
        {FREE_MONTHLY_ORDERS} orders this month — business is booming!{" "}
        <Link href="/settings" className="font-semibold underline">
          Tambah pesanan →
        </Link>
      </div>
    );
  }

  if (nudgeLevel === "urgent") {
    const remaining = FREE_MONTHLY_ORDERS - ordersUsed;
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800">
        {remaining} pesanan gratis tersisa.{" "}
        <Link href="/settings" className="font-semibold underline">
          Siapkan paket pesanan?
        </Link>
      </div>
    );
  }

  if (nudgeLevel === "medium") {
    const remaining = FREE_MONTHLY_ORDERS - ordersUsed;
    return (
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-center text-sm text-blue-800">
        {remaining} pesanan gratis tersisa bulan ini.{" "}
        <Link href="/settings" className="font-semibold underline">
          Siapkan paket pesanan?
        </Link>
      </div>
    );
  }

  // soft
  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-center text-sm text-blue-800">
      {ordersUsed}/{FREE_MONTHLY_ORDERS} pesanan gratis — bisnis lagi rame bulan ini!
    </div>
  );
}
