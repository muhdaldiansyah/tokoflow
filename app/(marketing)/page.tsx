import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Store, RefreshCw, Zap, Building2, MessageCircle, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { H1, Lead, P } from "@/components/ui/typography";
import { PhotoMagicHero } from "./PhotoMagicHero";
import { MarketplaceCostCalculator } from "./MarketplaceCostCalculator";
import ComingSoon from "./ComingSoon";

const isMaintenanceMode =
  process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

const homepageTitle = isMaintenanceMode
  ? "Tokoflow — Coming Soon"
  : "Tokoflow — Your Own Order Website for Malaysian Businesses";

const homepageDescription = isMaintenanceMode
  ? "Tokoflow is coming soon. The simplest way for anyone to start selling — one photo to launch your shop."
  : "Take orders from your own page, keep your customer data, and reduce dependence on marketplaces. Ready today, from RM49/month. Built for independent Malaysian businesses.";

export const metadata: Metadata = {
  title: { absolute: homepageTitle },
  description: homepageDescription,
  alternates: {
    canonical: "https://tokoflow.com",
  },
  openGraph: {
    title: homepageTitle,
    description: homepageDescription,
    url: "https://tokoflow.com",
  },
  twitter: {
    title: homepageTitle,
    description: homepageDescription,
  },
};

const ownership = [
  { lead: "Your customers, your data", tail: "never shared with or locked inside any marketplace" },
  { lead: "Your prices, your judgment", tail: "we never set them for you" },
  { lead: "Your repeat buyers, your channel", tail: "they come back to you, not to the platform" },
  { lead: "Your pace", tail: "no streaks, no badges, no daily-target pressure" },
  { lead: "Your freedom", tail: "cancel one tap, export everything" },
  { lead: "0% commission from Tokoflow", tail: "what you earn, you keep" },
];

const entryPaths = [
  {
    icon: Building2,
    heading: "Your product is serious, but your digital channel is still WhatsApp?",
    body: "You already have stock, branding, and customers — give them an order page that matches the quality of what you sell.",
    cta: "Build my order website",
    href: "/register",
  },
  {
    icon: MessageCircle,
    heading: "Orders coming in via WhatsApp, getting harder to track?",
    body: "Let customers choose and order on their own. Orders come in organised, and repeat orders don't start from an empty chat.",
    cta: "Get my orders organised",
    href: "/register",
  },
  {
    icon: BarChart2,
    heading: "Sales look good, but you're not sure what's actually left?",
    body: "Platform costs go beyond commission. Calculate the full picture — and compare it against your own order channel.",
    cta: "Calculate my platform cost",
    href: "#calculator",
  },
];

const coreMessages = [
  {
    icon: Store,
    title: "Look more professional",
    body: "Customers order from tokoflow.com/yourname — your own branded page. Not a WhatsApp chat, not a marketplace listing.",
  },
  {
    icon: RefreshCw,
    title: "Keep your repeat customers",
    body: "Use TikTok and Shopee to get discovered. When they're ready to reorder, bring them to your own channel — where the next recommendation is yours, not the platform's.",
  },
  {
    icon: Zap,
    title: "Live today. No IT company needed.",
    body: "Upload a product photo. AI builds your catalogue. Your order page is ready to share — in minutes, not months.",
  },
];

const tiers = [
  {
    name: "Free",
    price: "Rp 0",
    period: "first 50 orders",
    blurb: "Everything you need to start. No credit card.",
    cta: "Start free",
    href: "/register",
    highlight: false,
  },
  {
    name: "Pro",
    price: "Rp 49",
    period: "/ month",
    blurb: "Unlimited orders, voice + photo parsing, invoices, and the full system.",
    cta: "Try Pro",
    href: "/register",
    highlight: true,
  },
  {
    name: "Business",
    price: "Rp 99",
    period: "/ month",
    blurb: "Everything in Pro plus multi-staff accounts and order assignment for teams.",
    cta: "Talk to us",
    href: "/contact",
    highlight: false,
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tokoflow",
  url: "https://tokoflow.com",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "IDR",
    description: "Your first 50 orders are free",
  },
  description:
    "Your own order website for Malaysian small businesses. Take orders from your own page, keep customer data, and reduce marketplace dependence. Ready today, from RM49/month.",
  featureList: [
    "Your own order page — tokoflow.com/yourname",
    "Customer payments — DuitNow QR, FPX, cards, e-wallets",
    "0% commission — funds settle direct to your bank",
    "AI product catalogue from one photo",
    "Customer data you own and can export",
    "Repeat customer order history",
    "Delivery zone pricing",
    "Inventory tracking and auto-invoice",
    "Packing list for pending orders",
    "Works offline",
  ],
  inLanguage: "en",
  author: {
    "@type": "Organization",
    name: "Tokoflow",
    url: "https://tokoflow.com",
  },
};

export default function HomePage() {
  if (isMaintenanceMode) {
    return <ComingSoon />;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative pt-20 pb-16 md:pt-24 md:pb-20 lg:pt-32 lg:pb-32 overflow-hidden">
        <div className="max-w-5xl relative mx-auto px-4 z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-3 py-1 pr-4 text-sm font-medium text-[#1E293B] shadow-sm cursor-default">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warm-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-warm-green"></span>
                </span>
                For independent Malaysian businesses
              </div>

              <div className="space-y-5">
                <H1 className="tracking-tight text-[#1E293B] text-3xl lg:text-4xl lg:leading-tight">
                  Your own{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-warm-green to-warm-green-hover">
                    order website.
                  </span>
                  <br className="hidden md:block" />
                  Not just a marketplace listing.
                </H1>

                <Lead className="text-[#475569] leading-relaxed font-normal">
                  Take orders from your own page, keep your customer data, and reduce dependence on marketplaces — live today, from RM49/month.
                </Lead>
                <P className="text-[#475569] leading-relaxed">
                  Use TikTok and Shopee to get discovered. Use Tokoflow to bring repeat customers back to your own channel.
                </P>
              </div>

              <div className="pt-2">
                <PhotoMagicHero />
              </div>

              <p className="text-xs text-[#94A3B8]">
                First 50 orders free · No credit card · Cancel anytime
              </p>

              <p className="text-xs text-[#64748B] pt-1">
                Or{" "}
                <Link
                  href="/store"
                  className="font-medium text-[#05A660] underline-offset-2 hover:underline"
                >
                  browse local sellers on Tokoflow
                </Link>
                .
              </p>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="relative aspect-square w-full max-w-[480px] overflow-hidden rounded-3xl shadow-[0_32px_80px_-8px_rgba(0,0,0,0.18)]">
                <Image
                  src="/images/marketing/hero-craft.webp"
                  alt="A Malaysian small business owner checks their Tokoflow order page on a smartphone beside their products."
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 480px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain → Promise */}
      <section className="border-t border-[#E2E8F0] py-12 lg:py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="border-l-2 border-red-200 pl-5">
            <p className="text-[11px] font-semibold text-red-400 uppercase tracking-[0.12em] mb-2">The problem</p>
            <p className="text-[#475569] leading-relaxed">
              Every time a customer orders through TikTok or Shopee, the platform takes a cut — and their next recommendation might send that customer to a competitor. You don&apos;t own that relationship.
            </p>
          </div>

          <div className="flex justify-center my-4">
            <ArrowRight className="h-4 w-4 text-warm-green/50 rotate-90" />
          </div>

          <div className="border-l-2 border-warm-green pl-5">
            <p className="text-[11px] font-semibold text-warm-green uppercase tracking-[0.12em] mb-2">With Tokoflow</p>
            <p className="text-[#475569] leading-relaxed">
              Customers order from your link. Payment goes direct to your bank. Their data stays with you. When they&apos;re ready to reorder, they come back to{" "}
              <em className="not-italic font-medium text-[#1E293B]">your page</em> — not the marketplace.
            </p>
          </div>
        </div>
      </section>

      {/* Problem Selector — 3 entry paths */}
      <section className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1E293B] tracking-tight">
              Which one sounds like you?
            </h2>
            <p className="mt-3 text-[#475569] lg:text-lg">
              Pick the one that fits your situation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {entryPaths.map((path) => {
              const Icon = path.icon;
              return (
                <div
                  key={path.heading}
                  className="rounded-2xl border border-[#E2E8F0] bg-white p-6 flex flex-col shadow-sm"
                >
                  <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center mb-4 shrink-0">
                    <Icon className="h-5 w-5 text-warm-green" />
                  </div>
                  <h3 className="font-semibold text-[#1E293B] mb-2 leading-snug">
                    {path.heading}
                  </h3>
                  <p className="text-sm text-[#475569] leading-relaxed flex-1">
                    {path.body}
                  </p>
                  <Link
                    href={path.href}
                    className="mt-5 inline-flex items-center justify-center h-10 rounded-xl text-sm font-semibold border border-warm-green text-warm-green hover:bg-green-50 transition-colors"
                  >
                    {path.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3 Core Messages */}
      <section className="border-t border-[#E2E8F0] py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1E293B] tracking-tight">
              Built for businesses with real products and real customers
            </h2>
            <p className="mt-3 text-[#475569] lg:text-lg">
              Not a beginner tool. Not a RM5,000 IT project. The middle ground that didn&apos;t exist until now.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {coreMessages.map((msg) => {
              const Icon = msg.icon;
              return (
                <div key={msg.title} className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
                  <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-warm-green" />
                  </div>
                  <h3 className="font-semibold text-[#1E293B] mb-2">{msg.title}</h3>
                  <p className="text-sm text-[#475569] leading-relaxed">{msg.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Marketplace Cost Calculator */}
      <section id="calculator" className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1E293B] tracking-tight">
              How much does selling on marketplaces actually cost you?
            </h2>
            <p className="mt-3 text-[#475569] lg:text-lg">
              Platform costs go beyond commission. Calculate the full picture.
            </p>
          </div>
          <MarketplaceCostCalculator />
        </div>
      </section>

      {/* Yours. All of it. */}
      <section className="border-t border-[#E2E8F0] py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1E293B] tracking-tight">
              Yours. All of it.
            </h2>
            <p className="mt-3 text-[#475569] lg:text-lg">
              Your customers, your data, your channel — they were yours before Tokoflow, and they stay yours.
            </p>
          </div>

          <ul className="space-y-3 max-w-xl mx-auto">
            {ownership.map((item) => (
              <li key={item.lead} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-warm-green shrink-0" aria-hidden />
                <span className="text-[#475569] leading-relaxed">
                  <span className="font-semibold text-[#1E293B]">{item.lead}</span>
                  <span> — {item.tail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Real shops anchor */}
      <section className="border-t border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-4 py-12 lg:py-16">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-[#E2E8F0] shadow-sm">
            <Image
              src="/images/marketing/real-shops.webp"
              alt="A Malaysian small business owner arranges products beside a smartphone showing their Tokoflow order page."
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
          </div>
          <p className="mt-4 text-center text-sm text-[#475569]">
            Your shop. Your channel. Your customers.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1E293B] tracking-tight">
              Simple pricing. Pay only when you grow.
            </h2>
            <p className="mt-3 text-[#475569] lg:text-lg">
              Cancel anytime. Export everything. No credit card to start.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-6 ${
                  tier.highlight
                    ? "border-warm-green bg-white shadow-md"
                    : "border-[#E2E8F0] bg-white"
                }`}
              >
                {tier.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center h-6 px-3 text-[11px] font-semibold rounded-full bg-warm-green text-white">
                    Most popular
                  </span>
                )}
                <p className="text-sm font-semibold text-[#1E293B]">{tier.name}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#1E293B]">{tier.price}</span>
                  <span className="text-xs text-[#94A3B8]">{tier.period}</span>
                </div>
                <p className="mt-3 text-sm text-[#475569] leading-relaxed">{tier.blurb}</p>
                <Link
                  href={tier.href}
                  className={`mt-5 inline-flex items-center justify-center w-full h-10 rounded-xl text-sm font-semibold transition-colors ${
                    tier.highlight
                      ? "bg-warm-green text-white hover:bg-warm-green-hover"
                      : "bg-white text-[#1E293B] border border-[#E2E8F0] hover:bg-slate-50"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center mt-6 text-xs text-[#94A3B8]">
            <Link href="/pricing" className="underline hover:text-[#475569]">
              See full pricing details →
            </Link>
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[#E2E8F0] py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="relative z-10">
            <h2 className="mx-auto max-w-2xl text-2xl lg:text-3xl font-bold tracking-tight text-[#1E293B]">
              Build your own order website today.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base text-[#475569]">
              Your first 50 orders are free. No credit card. No commission from Tokoflow. Customer data stays yours.
            </p>

            <div className="mt-8">
              <Button size="lg" className="h-12 px-8 text-base font-semibold bg-warm-green text-white w-full sm:w-auto hover:bg-warm-green-hover" asChild>
                <Link href="/register">
                  Start free
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
