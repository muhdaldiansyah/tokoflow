"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FREE_STARTER_ORDERS,
  BISNIS_PRICE,
  BISNIS_PRICE_MONTHLY,
  BISNIS_PRICE_ANNUAL_TOTAL,
  BUSINESS_PRICE,
} from "@/config/plans";

type Billing = "annual" | "monthly";

export function PricingTiers() {
  const [billing, setBilling] = useState<Billing>("annual");

  const proPrice = billing === "annual" ? BISNIS_PRICE : BISNIS_PRICE_MONTHLY;
  const proPeriod = billing === "annual" ? "/month" : "/month";
  const proBadge = billing === "annual" ? `RM ${BISNIS_PRICE_ANNUAL_TOTAL}/year` : null;
  const proTagline = billing === "annual"
    ? "Billed annually. Less than 2 coffees a week."
    : "Month-to-month. Cancel anytime.";

  const tiers = [
    {
      name: "Free",
      price: "RM 0",
      period: "forever",
      tagline: "Start selling with one photo.",
      badge: null,
      features: [
        `${FREE_STARTER_ORDERS} free orders to start`,
        "1-Photo Onboarding magic",
        "Beautiful shop page with your link",
        "Customer payments — DuitNow QR / FPX / cards (0% commission, direct to your bank)",
        "Customer-confirmed delivery — one tap, no chasing",
        "Reply drafts — you always send",
        "Daily summary",
        "Customer auto-directory",
        "Free listing on tokoflow.com/store",
      ],
      cta: "Start free",
      href: "/login",
      highlight: false,
    },
    {
      name: "Pro",
      price: `RM ${proPrice}`,
      period: proPeriod,
      tagline: proTagline,
      badge: proBadge,
      features: [
        "Everything in Free",
        "Unlimited orders",
        "No Tokoflow footer on your shop page",
        "Pricing whisper — weekly peer benchmark nudge",
        "Customer recognition + smart follow-up",
        "Monthly story, seasonal awareness (Ramadan, etc.)",
        "One-tap LHDN MyInvois + SST 0/6% reporting",
        "No watermark on your shop page",
      ],
      cta: billing === "annual" ? "Get Pro — RM 49/mo" : "Get Pro — RM 79/mo",
      href: "/login",
      highlight: true,
    },
    {
      name: "Business",
      price: `RM ${BUSINESS_PRICE}`,
      period: "/month",
      tagline: "For sellers running with help.",
      badge: null,
      features: [
        "Everything in Pro",
        "Multi-staff accounts (2 included)",
        "Order assignment to staff",
        "Priority support (24h response)",
      ],
      cta: "Try Business",
      href: "/login",
      highlight: false,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-1 bg-slate-100 rounded-full p-1 w-fit mx-auto">
        <button
          onClick={() => setBilling("annual")}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
            billing === "annual"
              ? "bg-white text-[#1E293B] shadow-sm"
              : "text-[#475569] hover:text-[#1E293B]"
          }`}
        >
          Annual
          <span className="ml-1.5 text-[11px] font-semibold text-[#05A660]">Save 38%</span>
        </button>
        <button
          onClick={() => setBilling("monthly")}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
            billing === "monthly"
              ? "bg-white text-[#1E293B] shadow-sm"
              : "text-[#475569] hover:text-[#1E293B]"
          }`}
        >
          Monthly
        </button>
      </div>

      {/* Tier cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-3xl border p-8 flex flex-col ${
              tier.highlight
                ? "border-[#05A660]/30 bg-[#E8F6F0]/30 shadow-lg"
                : "border-[#E2E8F0] bg-white shadow-sm"
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-[#05A660] uppercase tracking-wider">
                {tier.name}
              </p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#1E293B]">{tier.price}</span>
                <span className="text-sm text-[#475569]">{tier.period}</span>
              </div>
              {tier.badge && (
                <p className="mt-1 text-xs font-medium text-[#05A660]">
                  {tier.badge} — billed once
                </p>
              )}
              <p className="mt-2 text-sm text-[#475569]">{tier.tagline}</p>
            </div>

            <ul className="mt-6 space-y-3 flex-1">
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-2 items-start text-sm text-[#475569]">
                  <Check className="h-4 w-4 text-[#05A660] shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className={`mt-8 h-12 w-full text-base font-semibold ${
                tier.highlight
                  ? "bg-[#05A660] text-white hover:bg-[#048C51]"
                  : "bg-white text-[#1E293B] border border-[#E2E8F0] hover:bg-slate-50"
              }`}
              variant={tier.highlight ? "default" : "outline"}
              asChild
            >
              <Link href={tier.href}>
                {tier.cta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
