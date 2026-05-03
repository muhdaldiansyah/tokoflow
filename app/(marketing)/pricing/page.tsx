import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HelpCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FREE_MONTHLY_ORDERS,
  PACK_ORDERS,
  PACK_PRICE,
  MEDIUM_PACK_ORDERS,
  MEDIUM_PACK_PRICE,
  UNLIMITED_PRICE,
  BISNIS_PRICE,
  BUSINESS_PRICE,
} from "@/config/plans";

export const metadata: Metadata = {
  title: "Pricing — We handle the receipts. Not the recipes. | Tokoflow",
  description:
    "Free forever for your first 50 orders/month. Pro RM 49/month for unlimited orders and the full AI companion. Business RM 99/month adds LHDN MyInvois.",
  alternates: {
    canonical: "https://tokoflow.com/pricing",
  },
};

const faqs = [
  {
    question: "Is it really free?",
    answer:
      "Yes. The Free tier is forever — your first 50 orders every month, no time limit, no credit card. The Photo Magic, your shop link, and accepting customer payments are all included.",
  },
  {
    question: "Can my customers pay through my shop link?",
    answer:
      "Yes — connect your own Billplz account in Settings (free for you to open with SSM registration). Customers pay via DuitNow QR, FPX, cards, or e-wallets, and the money settles directly to your bank. Tokoflow never holds your funds and never takes a commission. If you don't want this, you can keep using a static DuitNow QR with manual confirm — the choice is yours.",
  },
  {
    question: `What happens after ${FREE_MONTHLY_ORDERS} orders?`,
    answer: `You have four ways to keep going. Top up RM ${PACK_PRICE} for ${PACK_ORDERS} more orders. Or RM ${MEDIUM_PACK_PRICE} for ${MEDIUM_PACK_ORDERS} (better value). Or upgrade to Pro at RM ${BISNIS_PRICE}/month for unlimited everything. Or Business at RM ${BUSINESS_PRICE}/month for LHDN MyInvois compliance built in. Pack credits never expire.`,
  },
  {
    question: "Why upgrade to Pro?",
    answer:
      "Pro (RM 49/month) gives you unlimited orders, the full AI companion (voice setup, voice ask, smart reminders, pricing whisper), photo enhancement, and weekly stories. No watermark on your shop page. Most active sellers move to Pro within a few weeks.",
  },
  {
    question: "What does Business add?",
    answer:
      "Business (RM 99/month) is for sellers who care about compliance. It includes everything in Pro, plus silent LHDN MyInvois auto-submit, automatic SST calculation, multi-staff accounts, and priority support. The compliance happens behind the scenes — you never log into LHDN.",
  },
  {
    question: "Will Tokoflow file my SST returns?",
    answer:
      "No — Tokoflow calculates SST and prepares records, but the SST return itself is filed via MySST. Tokoflow keeps your numbers tidy so when filing time comes, the data is ready.",
  },
  {
    question: "How do I pay for my Pro / Business plan?",
    answer:
      "DuitNow QR, FPX online banking, or credit/debit card via Billplz. No hidden fees. No setup charges. Cancel anytime — your data stays accessible.",
  },
  {
    question: "Are AI features (photo, voice, paste) free?",
    answer:
      "Yes — every tier includes AI parsing for photo, voice, and pasted chats. The Photo Magic onboarding is free for everyone. Pro adds voice across the whole app, not just setup.",
  },
  {
    question: "What if I want to cancel?",
    answer:
      "One tap to cancel. No phone calls, no exit survey. Your data remains accessible until your billing period ends. Reactivate anytime within 90 days — everything is still there.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

const tiers = [
  {
    name: "Free",
    price: "RM 0",
    period: "forever",
    tagline: "Start selling with one photo.",
    features: [
      `${FREE_MONTHLY_ORDERS} orders/month, every month`,
      "1-Photo Onboarding magic",
      "Beautiful shop page with your link",
      "Customer payments — DuitNow QR / FPX / cards (0% commission, direct to your bank)",
      "Reply drafts — you always send",
      "Daily summary",
      "Customer auto-directory",
    ],
    cta: "Start free",
    href: "/login",
    highlight: false,
  },
  {
    name: "Pro",
    price: `RM ${BISNIS_PRICE}`,
    period: "/month",
    tagline: "The full companion. For active sellers.",
    features: [
      "Everything in Free",
      "Unlimited orders",
      "Voice setup + Voice Ask",
      "Photo enhancement",
      "Pricing whisper, smart reminders",
      "Customer recognition + follow-up",
      "Weekly story, seasonal awareness",
      "No watermark on shop page",
    ],
    cta: "Try Pro",
    href: "/login",
    highlight: true,
  },
  {
    name: "Business",
    price: `RM ${BUSINESS_PRICE}`,
    period: "/month",
    tagline: "Compliance, handled silently.",
    features: [
      "Everything in Pro",
      "LHDN MyInvois auto-submit",
      "SST 0% / 6% calculation",
      "> RM 10K rule auto-flag",
      "Multi-staff accounts (2 included)",
      "Order assignment to staff",
      "Branded invoice PDF",
      "Priority support (24h response)",
    ],
    cta: "Try Business",
    href: "/login",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Pricing Hero */}
      <section className="pt-24 lg:pt-28 pb-12 lg:pb-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#1E293B]">
            Simple pricing, dignified terms.
          </h1>
          <p className="mt-3 text-[#475569] lg:text-lg max-w-xl mx-auto">
            Free forever for your first 50 orders/month. Upgrade only when you need more — never because we made you anxious about it.
          </p>
        </div>

        {/* Tier cards */}
        <div className="mt-12 max-w-5xl mx-auto px-4">
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

          {/* Top-up note */}
          <div className="mt-8 max-w-md mx-auto rounded-2xl border border-[#E2E8F0] bg-white p-6 text-center">
            <p className="text-xs font-bold text-[#1E293B]/70 uppercase tracking-wider">
              Or pay only when you grow
            </p>
            <p className="mt-2 text-sm text-[#475569]">
              Hit {FREE_MONTHLY_ORDERS} orders? Top up RM {PACK_PRICE} for {PACK_ORDERS} more,
              or RM {MEDIUM_PACK_PRICE} for {MEDIUM_PACK_ORDERS} (better value).
              Pack credits never expire.
            </p>
          </div>
        </div>
      </section>

      {/* Value anchoring */}
      <section className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16">
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-xs font-bold text-[#1E293B]/70 uppercase tracking-wider text-center mb-6">
            Your customers stay yours
          </p>
          <div className="space-y-3 text-sm bg-white rounded-2xl border border-[#E2E8F0] p-6">
            <div className="flex items-center justify-between">
              <span className="text-[#475569]">Foodpanda / GrabFood</span>
              <span className="font-semibold text-[#1E293B] line-through decoration-[#94A3B8]">
                20–30% commission
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#475569]">StoreHub POS</span>
              <span className="font-semibold text-[#1E293B] line-through decoration-[#94A3B8]">
                RM 150–600/mo
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#475569]">Tax agent (LHDN compliance)</span>
              <span className="font-semibold text-[#1E293B] line-through decoration-[#94A3B8]">
                RM 500–2,000/mo
              </span>
            </div>
            <div className="border-t border-[#E2E8F0] pt-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#05A660]">Tokoflow Pro</span>
                <span className="font-bold text-[#05A660]">RM {BISNIS_PRICE}/mo</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-semibold text-[#05A660]">Tokoflow Business (with LHDN)</span>
                <span className="font-bold text-[#05A660]">RM {BUSINESS_PRICE}/mo</span>
              </div>
              <p className="mt-3 text-xs text-[#475569] text-center">
                0% commission. Customer payments settle direct to your bank — Tokoflow never touches the money. Customers and data stay yours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-[#E2E8F0] py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-[2rem] border border-[#E2E8F0] bg-white p-6 sm:p-8 lg:p-10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F6F0]">
                <HelpCircle className="h-6 w-6 text-[#05A660]" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-lg lg:text-xl font-bold text-[#1E293B]">
                  Pricing questions
                </h2>
                <p className="text-sm lg:text-base text-[#475569]">
                  Honest answers, no fine print.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="border-b border-[#E2E8F0] pb-5 last:border-0 last:pb-0"
                >
                  <h3 className="text-sm lg:text-base font-semibold text-[#1E293B]">
                    {faq.question}
                  </h3>
                  <p className="mt-1.5 text-sm lg:text-base leading-relaxed text-[#475569]">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[#E2E8F0] py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#1E293B]">
            Your shop. One photo away.
          </h2>
          <p className="mt-3 text-base text-[#475569]">
            No credit card. No commission. Cancel anytime.
          </p>
          <div className="mt-8">
            <Button
              size="lg"
              className="h-12 px-8 text-base font-semibold bg-[#05A660] text-white hover:bg-[#048C51]"
              asChild
            >
              <Link href="/login">
                Start free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
