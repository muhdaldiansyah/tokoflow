"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FREE_STARTER_ORDERS } from "@/config/plans";

// Indonesia pricing (mirrors config/plans.ts ID map + migration 096):
// Gratis Rp 0 / Pro Rp 99.000/bln / Business Rp 199.000/bln.
const PRO_PRICE = "Rp 99.000";
const BUSINESS_PRICE = "Rp 199.000";

export function PricingTiers() {
  const tiers = [
    {
      name: "Gratis",
      price: "Rp 0",
      period: "selamanya",
      tagline: "Mulai jualan cukup dengan satu foto.",
      badge: null,
      features: [
        `${FREE_STARTER_ORDERS} order gratis untuk mulai`,
        "Onboarding 1-Foto",
        "Halaman toko cantik dengan link sendiri",
        "Pembayaran pelanggan — QRIS / transfer bank / e-wallet (0% komisi, langsung ke rekeningmu)",
        "Konfirmasi pengiriman oleh pelanggan — sekali tap, tanpa nagih",
        "Draft balasan — kamu yang selalu kirim",
        "Ringkasan harian",
        "Direktori pelanggan otomatis",
        "Listing gratis di tokoflow.co.id/store",
      ],
      cta: "Mulai gratis",
      href: "/login",
      highlight: false,
    },
    {
      name: "Pro",
      price: PRO_PRICE,
      period: "/bulan",
      tagline: "Untuk yang sudah jualan rutin.",
      badge: null,
      features: [
        "Semua di Gratis",
        "Order tanpa batas",
        "Tanpa footer Tokoflow di halaman tokomu",
        "Pricing whisper — benchmark harga antar penjual",
        "Pengenalan pelanggan + follow-up cerdas",
        "Cerita bulanan, pengingat musiman (Ramadan, dll.)",
        "e-Faktur + pelaporan PPN sekali tap",
        "Tanpa watermark di halaman tokomu",
      ],
      cta: "Ambil Pro",
      href: "/login",
      highlight: true,
    },
    {
      name: "Business",
      price: BUSINESS_PRICE,
      period: "/bulan",
      tagline: "Untuk penjual yang jalan dengan tim.",
      badge: null,
      features: [
        "Semua di Pro",
        "Akun multi-staf (2 termasuk)",
        "Penugasan order ke staf",
        "Dukungan prioritas (respons 24 jam)",
      ],
      cta: "Coba Business",
      href: "/login",
      highlight: false,
    },
  ];

  return (
    <div className="space-y-8">
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
                  {tier.badge}
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
