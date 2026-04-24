import type { Metadata } from "next";
import Link from "next/link";
import {
  Receipt,
  ShoppingBag,
  BarChart3,
  ArrowRight,
  LinkIcon,
  Package,
  Mic,
  ClipboardPaste,
  Camera,
  MessageSquare,
  ClipboardList,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { H1, Lead, P } from "@/components/ui/typography";
import { ClaimSlugInput } from "./ClaimSlugInput";
import ComingSoon from "./ComingSoon";

const isMaintenanceMode =
  process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

export const metadata: Metadata = {
  title: isMaintenanceMode
    ? "Tokoflow — Coming Soon"
    : "Tokoflow — LHDN-Ready WhatsApp Storefront for Malaysia",
  description: isMaintenanceMode
    ? "Tokoflow is coming soon. Share an order link via WhatsApp, track payments, submit LHDN-compliant e-Invoices in one tap — built for Malaysian small businesses."
    : "Share a WhatsApp order link, customers self-order, and submit each sale to LHDN MyInvois in one tap. Built for Malaysian merchants RM 1M–5M.",
  alternates: {
    canonical: "https://tokoflow.com",
  },
};

const steps = [
  {
    icon: ShoppingBag,
    step: "1",
    title: "Sign up and list your menu",
    description:
      "Free account, instant dashboard. Add a few products — type them or paste a WhatsApp chat and let AI extract the items.",
  },
  {
    icon: LinkIcon,
    step: "2",
    title: "Share your store link",
    description:
      "Customers open tokoflow.com/yourshop, pick items, and place the order themselves. No copy-paste from chat, no missed messages.",
  },
  {
    icon: FileCheck,
    step: "3",
    title: "Sell, get paid, stay compliant",
    description:
      "DuitNow QR settles payment. Pro users submit a MyInvois e-Invoice in one tap — no spreadsheets, no LHDN panic.",
  },
];

const fallbackFeatures = [
  {
    icon: ClipboardPaste,
    title: "Paste a WhatsApp chat",
    description:
      "Copy the thread from WhatsApp, paste, and AI turns it into a clean order with quantities and totals.",
  },
  {
    icon: Mic,
    title: "Dictate the order",
    description:
      "Say it out loud — AI transcribes items, quantities and prices while your hands are busy.",
  },
  {
    icon: Camera,
    title: "Snap a screenshot",
    description:
      "Upload a photo of a WhatsApp conversation — AI reads and structures the order automatically.",
  },
];

const outputFeatures = [
  {
    icon: ClipboardList,
    title: "Auto prep list",
    description:
      "Daily totals by product, generated from incoming orders. Send to WhatsApp or export to Excel in one tap.",
  },
  {
    icon: FileCheck,
    title: "MyInvois e-Invoice",
    description:
      "Pro plan lets you submit to LHDN MyInvois in one tap with UBL 2.1 JSON, SST calculation, and the mandatory >RM 10K rule built in.",
  },
  {
    icon: BarChart3,
    title: "Recap and AI insights",
    description:
      "Revenue, payment status, trends — and plain-English suggestions from AI. Digital receipts to WhatsApp. Export to Excel.",
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
    description: "50 orders/month free for every merchant",
  },
  description:
    "LHDN-ready WhatsApp storefront. Share an order link, get paid via DuitNow QR, submit a MyInvois e-Invoice in one tap — for Malaysian small businesses.",
  featureList: [
    "Store link — customers browse menu and place orders themselves",
    "Paste WhatsApp chat into an order",
    "Voice-to-order transcription",
    "Screenshot-to-order via AI",
    "DuitNow QR / FPX / Billplz payment",
    "LHDN MyInvois e-Invoice submission (Pro)",
    "Auto-SST calculation",
    ">RM 10,000 individual e-Invoice handling",
    "WhatsApp payment reminders",
    "Order status and payment tracking",
    "Pre-order + booking modes",
    "Delivery scheduling",
    "Digital receipts via WhatsApp",
    "Daily and monthly sales recap",
    "AI business insights",
    "Auto customer directory",
    "Excel export",
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
                For Malaysian merchants selling via WhatsApp
              </div>

              <div className="space-y-5">
                <H1 className="tracking-tight text-[#1E293B] text-3xl lg:text-4xl lg:leading-tight">
                  From WhatsApp chat{" "}
                  <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05A660] to-[#048C51]">
                    to LHDN e-Invoice.
                  </span>
                </H1>
                <Lead className="text-[#475569] leading-relaxed font-normal">
                  Your customers order via WhatsApp. Your accountant asks for e-Invoice. Your Jan 2027 deadline is closing in.
                </Lead>
                <P className="text-[#475569] leading-relaxed">
                  Share a Tokoflow link — customers self-order, DuitNow QR collects payment, and Pro submits a MyInvois-compliant e-Invoice with one tap. Zero spreadsheets.
                </P>
              </div>

              <div className="pt-2">
                <ClaimSlugInput />
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
                          <span className="text-xs font-bold text-[#05A660]">BR</span>
                        </div>
                        <span className="text-[13px] font-bold text-[#1E293B]">Bakery Rasa</span>
                        <span className="text-[9px] text-[#94A3B8] mt-0.5">Pick items and send your order</span>
                      </div>

                      <p className="text-[8px] font-bold text-[#1E293B]/50 uppercase tracking-wider mb-2">Choose items</p>
                      <div className="space-y-2">
                        {/* Selected */}
                        <div className="rounded-xl border border-[#05A660]/30 bg-[#E8F6F0] p-3 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-semibold text-[#05A660]">Brownies 20x20</span>
                            <span className="block text-[9px] text-[#05A660]/70">RM 35</span>
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
                            <span className="text-[11px] font-semibold text-[#05A660]">Kuih Lapis Box</span>
                            <span className="block text-[9px] text-[#05A660]/70">RM 25</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[10px] text-[#475569]">-</div>
                            <span className="text-[11px] font-bold text-[#1E293B] w-4 text-center">3</span>
                            <div className="h-6 w-6 rounded-lg bg-[#05A660] flex items-center justify-center text-[10px] text-white">+</div>
                          </div>
                        </div>
                        {/* Selected */}
                        <div className="rounded-xl border border-[#05A660]/30 bg-[#E8F6F0] p-3 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-semibold text-[#05A660]">Karipap (12 pcs)</span>
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
                            <span className="text-[11px] font-semibold text-[#1E293B]">Cookies Box</span>
                            <span className="block text-[9px] text-[#94A3B8]">RM 22</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sticky Cart Bar */}
                    <div className="absolute bottom-0 w-full bg-white border-t border-[#E2E8F0] px-4 py-3 z-20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] text-[#94A3B8]">6 items</span>
                        <span className="text-[12px] font-bold text-[#1E293B]">RM 163</span>
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
                  <p className="text-[#1E293B] font-semibold mb-2">Before</p>
                  <p className="text-[#475569] leading-relaxed">
                    30 order threads pile up on WhatsApp. You tally totals by hand while cooking. One message gets missed — the customer walks, you eat the loss. By closing time you&apos;re not sure if you made money today, and the LHDN e-Invoice deadline is still on your mind.
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
                  <Receipt className="h-6 w-6 text-[#05A660]" />
                </div>
                <div>
                  <p className="text-[#1E293B] font-semibold mb-2">After</p>
                  <p className="text-[#475569] leading-relaxed">
                    Customers order through your link. DuitNow QR confirms payment. Each paid order turns into an LHDN-compliant MyInvois e-Invoice with one tap. You wake up to a clean prep list, clean books, clean conscience.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center mt-8 text-sm text-[#475569]">
            Zero commission. Your customers stay yours. Compliance handled.
          </p>
        </div>
      </section>

      {/* How It Works — 3 steps */}
      <section id="features" className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        <div className="container relative mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1E293B]">Sign up. Sell. Stay compliant.</h2>
            <p className="mt-3 text-[#475569] lg:text-lg">
              Up and running in under a minute. First order can be in your dashboard in 30 seconds. LHDN e-Invoice works from day one on Pro.
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

      {/* Fallback — still getting orders via chat? */}
      <section className="py-12 lg:py-16 relative">
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1E293B] tracking-tight">
              Still getting orders by chat?
            </h2>
            <p className="mt-4 text-[#475569] lg:text-lg">
              Paste the chat, dictate the order, or snap a screenshot — AI turns it into a clean, tracked order.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {fallbackFeatures.map((feature) => (
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

      {/* Output — what you get */}
      <section className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1E293B] tracking-tight">
              Orders in. Compliance and books, automatic.
            </h2>
            <p className="mt-4 text-[#475569] lg:text-lg">
              Status, payment, receipts, LHDN filings, recap — all produced without a spreadsheet in sight.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {outputFeatures.map((feature) => (
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
                Get ahead of the LHDN deadline.
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-base text-[#475569]">
                50 orders/month free — forever. Pay only when you grow.
                Pro (RM 49/mo) handles MyInvois, SST, and the &gt;RM 10K rule so you never touch a tax form again.
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
