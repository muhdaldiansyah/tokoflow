"use client";

import Link from "next/link";

interface TrialBannerProps {
  nudgeLevel: "none" | "exhausted";
}

// One quiet line, only when the free tier runs out for the month.
// No fractions, no countdowns, no "X/50 used" — those are forbidden anxiety patterns
// per docs/positioning/03-features.md.
export function TrialBanner({ nudgeLevel }: TrialBannerProps) {
  if (nudgeLevel !== "exhausted") return null;

  return (
    <div className="bg-warm-green-light border-b border-warm-green/20 px-4 py-2 text-center text-sm text-warm-green">
      Busy month! You&rsquo;ve passed 50 orders.{" "}
      <Link href="/settings" className="font-semibold underline">
        Go unlimited from RM 49 &rarr;
      </Link>
    </div>
  );
}
