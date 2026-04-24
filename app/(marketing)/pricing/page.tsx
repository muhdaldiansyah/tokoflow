import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HelpCircle } from "lucide-react";
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
  title: "Pricing — LHDN-Ready WhatsApp Storefront | Tokoflow",
  description:
    "Free forever for your first 50 orders/month. Add RM 5 for 50 more. Pro (RM 49/mo) includes unlimited LHDN e-Invoice via MyInvois — built for RM 1M–5M merchants.",
  alternates: {
    canonical: "https://tokoflow.com/pricing",
  },
};

const faqs = [
  {
    question: "Is it really free?",
    answer:
      "Yes. All core features are free forever — order link, digital receipts, recap, payment tracking, AI order parsing. You get 50 orders per month at zero cost. Not a trial.",
  },
  {
    question: `What happens if I go over ${FREE_MONTHLY_ORDERS} orders?`,
    answer: `Four options: Top-up RM ${PACK_PRICE} for ${PACK_ORDERS} orders, RM ${MEDIUM_PACK_PRICE} for ${MEDIUM_PACK_ORDERS} orders (better value), Unlimited at RM ${UNLIMITED_PRICE}/mo, or Pro at RM ${BISNIS_PRICE}/mo with LHDN e-Invoice included. Packs never expire. Pay via FPX / DuitNow QR.`,
  },
  {
    question: "Do I need Pro for LHDN e-Invoice compliance?",
    answer:
      "Yes. Pro (RM 49/mo) generates UBL 2.1 JSON invoices, connects directly to MyInvois for one-tap submission, handles the >RM 10,000 individual e-Invoice rule (effective 1 Jan 2026), and calculates SST 6% where applicable. SST filing itself is still done separately via MySST — Tokoflow does not file on your behalf. Free and Unlimited tiers do not include MyInvois submission.",
  },
  {
    question: "What happens if I don't buy a pack?",
    answer:
      "Orders from customers keep coming in, but they're held in \"queued\" status until you top up. Customers don't see any limit — they can place orders anytime.",
  },
  {
    question: "Do topped-up orders ever expire?",
    answer:
      "Never. Pack credits are yours forever — use them whenever you need.",
  },
  {
    question: "How do I pay?",
    answer:
      "DuitNow QR, FPX online banking, or credit/debit card via Billplz. No hidden fees. No setup charges.",
  },
  {
    question: "Are the AI features (paste chat, voice, photo) free?",
    answer:
      "Yes — all AI features are free and unlimited on every tier. Paste a WhatsApp chat, speak the order, or upload a screenshot — the order appears instantly.",
  },
  {
    question: "Are you part of the MDEC Digitalisation Grant scheme?",
    answer:
      "Not yet — our MDEC Digitalisation Partner application is pending. When that clears, eligible MSMEs will be able to claim grant co-funding on Pro. We won't mislead you on this page the moment it changes.",
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
  const ctaHref = "/login";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Pricing */}
      <section className="pt-24 lg:pt-28 pb-12 lg:pb-16">
        <div className="max-w-sm mx-auto px-4 text-center">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-[#1E293B]">
            Free forever. Pay only when you&apos;re growing.
          </h1>

          <div className="mt-8 space-y-6">
            {/* Free */}
            <div>
              <p className="text-xs font-semibold text-[#05A660] uppercase tracking-wider">Free forever</p>
              <p className="mt-1 text-2xl font-bold text-[#1E293B]">{FREE_MONTHLY_ORDERS} orders/month</p>
              <p className="mt-1 text-sm text-[#475569]">All features included, no time limit.</p>
            </div>

            <div className="border-t border-[#E2E8F0]" />

            {/* Small Pack */}
            <div>
              <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider">Top-up</p>
              <p className="mt-1 text-2xl font-bold text-[#1E293B]">
                RM {PACK_PRICE}
                <span className="text-sm font-normal text-[#475569]"> / {PACK_ORDERS} orders</span>
              </p>
              <p className="mt-1 text-sm text-[#475569]">
                RM {(PACK_PRICE / PACK_ORDERS).toFixed(2)}/order · FPX / DuitNow · never expires.
              </p>
            </div>

            <div className="border-t border-[#E2E8F0]" />

            {/* Medium Pack */}
            <div>
              <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider">Top-up Saver</p>
              <p className="mt-1 text-2xl font-bold text-[#1E293B]">
                RM {MEDIUM_PACK_PRICE}
                <span className="text-sm font-normal text-[#475569]"> / {MEDIUM_PACK_ORDERS} orders</span>
              </p>
              <p className="mt-1 text-sm text-[#475569]">
                RM {(MEDIUM_PACK_PRICE / MEDIUM_PACK_ORDERS).toFixed(2)}/order · 20% off · never expires.
              </p>
            </div>

            <div className="border-t border-[#E2E8F0]" />

            {/* Unlimited */}
            <div>
              <p className="text-xs font-semibold text-[#05A660] uppercase tracking-wider">Unlimited</p>
              <p className="mt-1 text-2xl font-bold text-[#1E293B]">
                RM {UNLIMITED_PRICE}
                <span className="text-sm font-normal text-[#475569]"> / month</span>
              </p>
              <p className="mt-1 text-sm text-[#475569]">Unlimited orders. Best value for busy sellers.</p>
            </div>

            <div className="border-t border-[#E2E8F0]" />

            {/* Pro — LHDN wedge */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-left">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Pro — LHDN Ready</p>
              <p className="mt-1 text-2xl font-bold text-[#1E293B]">
                RM {BISNIS_PRICE}
                <span className="text-sm font-normal text-[#475569]"> / month</span>
              </p>
              <p className="mt-1 text-sm text-[#475569]">
                Everything in Unlimited + one-tap MyInvois submission, SST calculation, &gt;RM 10K flag, 72-hour cancel.
              </p>
              <div className="mt-2 space-y-1 text-xs text-[#475569]">
                <p>✅ MyInvois submissions (UBL 2.1 JSON)</p>
                <p>✅ SST calculation (0% / 6%)</p>
                <p>✅ &gt;RM 10,000 individual e-Invoice auto-trigger</p>
                <p>✅ Order → Invoice one click</p>
                <p>✅ 72-hour cancellation window handling</p>
              </div>
              <p className="mt-2 text-[10px] text-[#94A3B8]">
                vs tax agent RM 500-2,000/mo · vs accounting software RM 59-499/mo
              </p>
            </div>

            <div className="border-t border-[#E2E8F0]" />

            {/* Business — Phase 4 preview */}
            <div>
              <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider">Business</p>
              <p className="mt-1 text-2xl font-bold text-[#1E293B]">
                RM {BUSINESS_PRICE}
                <span className="text-sm font-normal text-[#475569]"> / month</span>
              </p>
              <p className="mt-1 text-sm text-[#475569]">
                Franchise / multi-outlet · API access · white-label. Coming Q4 2026.
              </p>
            </div>

            <Button
              size="default"
              className="w-full h-11 text-sm font-semibold bg-[#05A660] text-white hover:bg-[#048C51]"
              asChild
            >
              <Link href={ctaHref}>
                Start free now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <p className="text-xs text-[#475569]">
              <Link href="/features" className="text-[#05A660] font-medium hover:underline">
                See all features →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Value anchoring */}
      <section className="border-t border-[#E2E8F0] py-10 lg:py-12">
        <div className="max-w-sm mx-auto px-4">
          <p className="text-xs font-bold text-[#1E293B]/70 uppercase tracking-wider text-center mb-4">
            Your customers are yours
          </p>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#475569]">Foodpanda / GrabFood</span>
              <span className="font-semibold text-[#1E293B] line-through decoration-[#94A3B8]">20-30% commission</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#475569]">StoreHub POS</span>
              <span className="font-semibold text-[#1E293B] line-through decoration-[#94A3B8]">RM 150-600/mo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#475569]">Orderla Pro</span>
              <span className="font-semibold text-[#1E293B] line-through decoration-[#94A3B8]">RM 100/mo (no e-Invoice)</span>
            </div>
            <div className="border-t border-[#E2E8F0] pt-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#05A660]">Tokoflow</span>
                <span className="font-bold text-[#05A660]">
                  RM {(PACK_PRICE / PACK_ORDERS).toFixed(2)}/order
                </span>
              </div>
              <p className="mt-1.5 text-xs text-[#475569]">
                0% commission. You own the customer. No middlemen.
              </p>
            </div>
            <div className="border-t border-[#E2E8F0] pt-2.5 mt-2.5 space-y-2.5">
              <p className="text-xs font-bold text-[#1E293B]/70 uppercase tracking-wider">
                Need LHDN e-Invoice?
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[#475569]">Tax agent</span>
                <span className="font-semibold text-[#1E293B] line-through decoration-[#94A3B8]">RM 500-2,000/mo</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#475569]">Accounting software</span>
                <span className="font-semibold text-[#1E293B] line-through decoration-[#94A3B8]">RM 59-499/mo</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-600">Tokoflow Pro</span>
                <span className="font-bold text-blue-600">RM {BISNIS_PRICE}/mo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mx-auto max-w-3xl">
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
                    The things merchants ask us most.
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
        </div>
      </section>
    </>
  );
}
