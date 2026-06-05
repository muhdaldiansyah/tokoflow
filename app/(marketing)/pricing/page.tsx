import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import {
  FREE_STARTER_ORDERS,
  BISNIS_PRICE,
  BISNIS_PRICE_MONTHLY,
  BUSINESS_PRICE,
} from "@/config/plans";
import { PricingTiers } from "./PricingTiers";

export const metadata: Metadata = {
  title: `Pricing — ${siteConfig.tagline}`,
  description:
    `50 free orders to start. Pro RM ${BISNIS_PRICE}/month (annual) or RM ${BISNIS_PRICE_MONTHLY}/month unlocks unlimited orders and the full companion. Business RM ${BUSINESS_PRICE}/month adds multi-staff accounts.`,
  alternates: {
    canonical: "https://tokoflow.com/pricing",
  },
};

const faqs = [
  {
    question: "Is it really free?",
    answer:
      "Yes. The Free tier gives you 50 orders to start — no credit card, no time limit. The Photo Magic, your shop link, and accepting customer payments are all included.",
  },
  {
    question: "Can my customers pay through my shop link?",
    answer:
      "Yes — connect your own Billplz account in Settings (free for you to open with SSM registration). Customers pay via DuitNow QR, FPX, cards, or e-wallets, and the money settles directly to your bank. Tokoflow never holds your funds and never takes a commission. If you don't want this, you can keep using a static DuitNow QR with manual confirm — the choice is yours.",
  },
  {
    question: `What happens after my first ${FREE_STARTER_ORDERS} free orders?`,
    answer: `Upgrade to Pro at RM ${BISNIS_PRICE}/month for unlimited orders, the full AI companion, and silent LHDN MyInvois + SST compliance. Business at RM ${BUSINESS_PRICE}/month adds multi-staff accounts and order assignment for sellers running with help. Either way, your data stays — no lock-in, cancel any time.`,
  },
  {
    question: "Why upgrade to Pro?",
    answer:
      `Pro gives you unlimited orders, smart reminders, pricing whisper, and silent LHDN MyInvois + SST compliance. Your shop page drops the "Made with Tokoflow" footer. Annual plan is RM ${BISNIS_PRICE}/month (RM ${BISNIS_PRICE * 12}/year) — monthly is RM ${BISNIS_PRICE_MONTHLY}/month. Most active sellers move to Pro within a few weeks.`,
  },
  {
    question: "What does Business add?",
    answer:
      "Business (RM 99/month) is for sellers who run with help. Everything in Pro, plus multi-staff accounts (2 included), order assignment to staff, and priority support (24h response).",
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
      "Yes — every tier includes AI order parsing via photo, voice, and pasted WhatsApp chats. Photo Magic onboarding is free for everyone.",
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
            50 free orders to start. Upgrade only when you need more — never because we made you anxious about it.
          </p>
        </div>

        <div className="mt-12 max-w-5xl mx-auto px-4">
          <PricingTiers />
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
            <div className="border-t border-[#E2E8F0] pt-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#05A660]">Tokoflow Pro</span>
                <span className="font-bold text-[#05A660]">RM {BISNIS_PRICE}/mo</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-semibold text-[#05A660]">Tokoflow Business</span>
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
