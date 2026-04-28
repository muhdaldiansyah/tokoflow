import type { Metadata } from "next";
import Link from "next/link";
import {
  Camera,
  Sparkles,
  ArrowRight,
  LinkIcon,
  Mic,
  MessageSquare,
  Heart,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { H1, Lead, P } from "@/components/ui/typography";
import { PhotoMagicHero } from "./PhotoMagicHero";
import ComingSoon from "./ComingSoon";

const isMaintenanceMode =
  process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

export const metadata: Metadata = {
  title: isMaintenanceMode
    ? "Tokoflow — Coming Soon"
    : "Tokoflow — We handle the receipts. Not the recipes.",
  description: isMaintenanceMode
    ? "Tokoflow is coming soon. The simplest way for anyone to start selling — one photo to launch your shop."
    : "Snap one photo. See your shop preview live. We handle the receipts (payment, invoices, tax) — your craft stays yours. Built for Malaysian home sellers.",
  alternates: {
    canonical: "https://tokoflow.com",
  },
};

const steps = [
  {
    icon: Camera,
    step: "1",
    title: "Snap a photo",
    description:
      "Open Tokoflow, point your camera at your kitchen, your bakes, or whatever you sell. We do the rest.",
  },
  {
    icon: Sparkles,
    step: "2",
    title: "Your shop appears",
    description:
      "AI builds your shop in seconds — name, story, menu with prices, beautiful photos. Edit anything by voice.",
  },
  {
    icon: LinkIcon,
    step: "3",
    title: "Share your link, start selling",
    description:
      "One link for IG bio, TikTok, WhatsApp status. Customers order, pay, and get confirmed — without you lifting a finger.",
  },
];

const iconicMoments = [
  {
    icon: Camera,
    title: "The Photo Magic",
    description:
      "One photo. Sixty seconds. Your shop is live. No setup wizards, no business-type dropdowns, no forms. Just the camera you already use.",
  },
  {
    icon: Mic,
    title: "The Voice Ask",
    description:
      "Hands busy cooking? Tap mic and speak. \"Add ayam crispy, twenty-seven ringgit.\" Done. Like a quiet companion who's always listening.",
  },
  {
    icon: Heart,
    title: "The Vibrate",
    description:
      "When an order comes in, your phone whispers — one soft buzz. No jarring sound. No interruption. Glance when you have a moment. Tokoflow respects your flow.",
  },
];

const eveningEmbrace = [
  {
    icon: Sun,
    title: "Today, you did well.",
    description:
      "Each evening, Tokoflow tells you the story of your day. \"23 orders, RM 1,247. Pak Andi said the kek lapis was wonderful. Rest well.\"",
  },
  {
    icon: Heart,
    title: "Quiet on slow days.",
    description:
      "Slow day? You'll hear: \"Today was lighter. That's okay — every business has them. Rest, and tomorrow.\" No shaming, no targets, no streaks.",
  },
  {
    icon: Sparkles,
    title: "Compliance, handled.",
    description:
      "Behind the scenes, Tokoflow handles your invoices, SST, and LHDN MyInvois silently. You'll never have to think about a tax form.",
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
    priceCurrency: "MYR",
    description: "Free forever for your first 50 orders/month",
  },
  description:
    "We handle the receipts, not the recipes. Snap one photo, see your shop preview live, then sign up. Tokoflow handles payment matching, invoices, and tax silently.",
  featureList: [
    "1-photo onboarding — your shop in 60 seconds",
    "AI customer assistant — handles chat for you",
    "DuitNow QR / FPX / Billplz payment",
    "Voice-driven actions (add menu, view orders)",
    "Beautiful shop link with your story",
    "1-tap reorder for returning customers",
    "Vibrate-only notifications (respect your flow)",
    "Daily evening summary in your language",
    "Silent LHDN compliance (Business tier)",
    "Auto SST calculation",
    "Customer recognition & follow-up",
    "Inventory tracking via photo",
    "Auto receipt generation",
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

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-24 md:pb-20 lg:pt-32 lg:pb-32 overflow-hidden">

        <div className="max-w-5xl relative mx-auto px-4 z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Content */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-3 py-1 pr-4 text-sm font-medium text-[#1E293B] shadow-sm cursor-default">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#05A660] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#05A660]"></span>
                </span>
                For anyone with something to sell
              </div>

              <div className="space-y-5">
                <H1 className="tracking-tight text-[#1E293B] text-3xl lg:text-4xl lg:leading-tight">
                  We handle the{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05A660] to-[#048C51]">
                    receipts.
                  </span>
                  <br className="hidden md:block" />
                  Not the recipes.
                </H1>
                <Lead className="text-[#475569] leading-relaxed font-normal">
                  Snap one photo. See your shop preview live — before you sign up.
                </Lead>
                <P className="text-[#475569] leading-relaxed">
                  Tokoflow handles the admin (payment matching, invoices, tax) quietly in the background. Your kitchen, your customers, your craft — all yours.
                </P>
              </div>

              <div className="pt-2">
                <PhotoMagicHero />
              </div>

            </div>

            {/* Phone Mockup — Store Link */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative">
                <div className="w-[300px] rounded-[3rem] border-[8px] border-[#1E293B] bg-[#1E293B] shadow-[0_32px_80px_-8px_rgba(0,0,0,0.10)] overflow-hidden">
                  {/* Phone notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[24px] w-[120px] bg-[#1E293B] rounded-b-[18px] z-20" />

                  {/* Screen Content */}
                  <div className="h-[600px] w-full bg-gray-50 relative overflow-hidden flex flex-col">
                    <div className="h-8 w-full bg-white z-10" />

                    <div className="flex-1 px-4 pt-2 pb-16 flex flex-col font-sans overflow-hidden">
                      {/* Store Header */}
                      <div className="flex flex-col items-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-[#E8F6F0] flex items-center justify-center mb-1.5">
                          <span className="text-xs font-bold text-[#05A660]">AS</span>
                        </div>
                        <span className="text-[13px] font-bold text-[#1E293B]">Aisyah Kuih Lapis</span>
                        <span className="text-[9px] text-[#94A3B8] mt-0.5 italic">&ldquo;Grandma&apos;s recipe, made with love.&rdquo;</span>
                      </div>

                      <p className="text-[8px] font-bold text-[#1E293B]/50 uppercase tracking-wider mb-2">Pick your items</p>
                      <div className="space-y-2">
                        {/* Selected */}
                        <div className="rounded-xl border border-[#05A660]/30 bg-[#E8F6F0] p-3 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-semibold text-[#05A660]">Kek Lapis Original</span>
                            <span className="block text-[9px] text-[#05A660]/70">RM 25</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[10px] text-[#475569]">-</div>
                            <span className="text-[11px] font-bold text-[#1E293B] w-4 text-center">2</span>
                            <div className="h-6 w-6 rounded-lg bg-[#05A660] flex items-center justify-center text-[10px] text-white">+</div>
                          </div>
                        </div>
                        {/* Selected */}
                        <div className="rounded-xl border border-[#05A660]/30 bg-[#E8F6F0] p-3 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-semibold text-[#05A660]">Kuih Ros (12 pcs)</span>
                            <span className="block text-[9px] text-[#05A660]/70">RM 18</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[10px] text-[#475569]">-</div>
                            <span className="text-[11px] font-bold text-[#1E293B] w-4 text-center">1</span>
                            <div className="h-6 w-6 rounded-lg bg-[#05A660] flex items-center justify-center text-[10px] text-white">+</div>
                          </div>
                        </div>
                        {/* Unselected */}
                        <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-semibold text-[#1E293B]">Brownies (Box)</span>
                            <span className="block text-[9px] text-[#94A3B8]">RM 35</span>
                          </div>
                        </div>
                        {/* Unselected */}
                        <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-semibold text-[#1E293B]">Karipap (12 pcs)</span>
                            <span className="block text-[9px] text-[#94A3B8]">RM 18</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sticky Cart Bar */}
                    <div className="absolute bottom-0 w-full bg-white border-t border-[#E2E8F0] px-4 py-3 z-20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] text-[#94A3B8]">3 items</span>
                        <span className="text-[12px] font-bold text-[#1E293B]">RM 68</span>
                      </div>
                      <div className="bg-[#05A660] text-white rounded-xl py-2.5 text-[11px] font-semibold text-center">
                        Send order
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Vision Story */}
      <section className="border-t border-[#E2E8F0] py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="space-y-8">
            {/* Problem */}
            <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6 lg:p-8">
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-1">
                  <MessageSquare className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <p className="text-[#1E293B] font-semibold mb-2">Right now</p>
                  <p className="text-[#475569] leading-relaxed">
                    Thirty unread messages on WhatsApp. Hands sticky from baking. You tally totals in your head. One order slips through — the customer walks. By evening you&apos;re tired, not sure if today went well, and admin still waits.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-[#05A660] rotate-90" />
            </div>

            {/* Vision */}
            <div className="rounded-2xl border border-[#05A660]/20 bg-[#E8F6F0]/50 p-6 lg:p-8">
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-1">
                  <Heart className="h-6 w-6 text-[#05A660]" />
                </div>
                <div>
                  <p className="text-[#1E293B] font-semibold mb-2">With Tokoflow</p>
                  <p className="text-[#475569] leading-relaxed">
                    Customers order through your link. AI replies, takes the order, and collects payment — quietly, on your behalf. Your phone whispers when food needs to be made. By evening, you hear: <em>&ldquo;Today, you did well. 23 orders. Rest well.&rdquo;</em>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center mt-8 text-sm text-[#475569]">
            Zero commission. Your customers stay yours. The technology disappears — your work shines.
          </p>
        </div>
      </section>

      {/* How It Works — 3 steps */}
      <section id="features" className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        <div className="container relative mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1E293B]">Sixty seconds to live.</h2>
            <p className="mt-3 text-[#475569] lg:text-lg">
              No business-type dropdowns. No setup checklist. Just a photo of what you sell — Tokoflow does the rest.
            </p>
          </div>

          <div className="relative mt-12 grid gap-8 lg:gap-12 md:grid-cols-3">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-slate-200 z-0"></div>

            {steps.map((item) => (
              <div
                key={item.step}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                    <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-[#05A660] text-white flex items-center justify-center font-bold text-sm ring-4 ring-white">
                      {item.step}
                    </div>
                    <item.icon className="h-10 w-10 text-[#1E293B]" strokeWidth={1.5} />
                  </div>
                </div>

                <h3 className="mt-8 text-lg font-semibold text-[#1E293B]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#475569] max-w-xs block">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Iconic Moments — what makes Tokoflow Tokoflow */}
      <section className="py-12 lg:py-16 relative">
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1E293B] tracking-tight">
              Designed for the way you actually work.
            </h2>
            <p className="mt-4 text-[#475569] lg:text-lg">
              Not another dashboard. Not another tool to learn. A quiet companion that knows when to speak and when to stay out of the way.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {iconicMoments.map((feature) => (
              <div
                key={feature.title}
                className="relative overflow-hidden rounded-[2rem] bg-white border border-[#E2E8F0] shadow-sm p-8"
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#05A660] text-white shadow-lg shadow-[#05A660]/20">
                  <feature.icon className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <h3 className="mb-3 text-lg font-bold text-[#1E293B] tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Evening Embrace — humane analytics */}
      <section className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1E293B] tracking-tight">
              At the end of every day, Tokoflow has something kind to say.
            </h2>
            <p className="mt-4 text-[#475569] lg:text-lg">
              No shaming charts. No streak warnings. Just the story of your day — the way a friend would tell it.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {eveningEmbrace.map((feature) => (
              <div
                key={feature.title}
                className="relative overflow-hidden rounded-[2rem] bg-white border border-[#E2E8F0] shadow-sm p-8"
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#05A660] text-white shadow-lg shadow-[#05A660]/20">
                  <feature.icon className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <h3 className="mb-3 text-lg font-bold text-[#1E293B] tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#E2E8F0] py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="relative z-10">
              <h2 className="mx-auto max-w-2xl text-2xl lg:text-3xl font-bold tracking-tight text-[#1E293B]">
                Your shop. One photo away.
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-base text-[#475569]">
                Free forever for your first 50 orders/month. No credit card. No commission. Customers stay yours.
              </p>

              <div className="mt-8">
                <Button size="lg" className="h-12 px-8 text-base font-semibold bg-[#05A660] text-white w-full sm:w-auto hover:bg-[#048C51]" asChild>
                  <Link href="/login">
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
