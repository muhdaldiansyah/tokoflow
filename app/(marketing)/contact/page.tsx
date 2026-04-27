import type { Metadata } from "next";
import Link from "next/link";
import {
  Home,
  ChevronRight,
  Mail,
  MessageSquare,
  Clock,
  HelpCircle,
} from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact Tokoflow",
  description:
    "Talk to us on WhatsApp or email. Real humans, honest answers. We reply within a day.",
  alternates: {
    canonical: "https://tokoflow.com/contact",
  },
};

const faqs = [
  {
    question: "Is Tokoflow free?",
    answer:
      "Yes. Free forever — 50 orders/month, including the Photo Magic onboarding, your shop link, AI customer assistant, and Daily Summary. Pro (RM 49/mo) unlocks unlimited orders and the full AI companion. Business (RM 99/mo) adds silent LHDN MyInvois compliance.",
  },
  {
    question: "Do I need to install an app?",
    answer:
      "Not yet. Right now Tokoflow runs in your mobile browser — works great as a PWA when you add to home screen. Native iOS and Android apps come a few months after launch.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. Encrypted servers, per-user data isolation, regular backups. We never sell or share your data. PDPA 2024-compliant.",
  },
  {
    question: "How do I delete my account?",
    answer:
      "One tap in Settings. Or email hello@tokoflow.com — your data will be removed permanently within 5 business days. No exit survey, no friction.",
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

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="border-b pt-24 lg:pt-28">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10">
          <nav className="mb-3 flex items-center gap-1.5 text-sm">
            <Link href="/" className="flex items-center gap-1 text-[#475569] transition-colors hover:text-[#1E293B]">
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#475569]/40" />
            <span className="font-medium text-[#1E293B]">Contact</span>
          </nav>

          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-[#1E293B]">
            Talk to us.
          </h1>
          <p className="mt-1 text-sm lg:text-base text-[#475569]">
            Real humans, honest answers. WhatsApp or email — both work.
          </p>
        </div>
      </div>

      <section className="py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid gap-8 lg:gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-start gap-4 rounded-[2rem] border border-[#E2E8F0] bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F6F0]">
                  <MessageSquare className="h-6 w-6 text-[#05A660]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-base lg:text-lg font-bold text-[#1E293B]">WhatsApp</h3>
                  <p className="mt-0.5 text-sm text-[#475569]">Chat us for quick help.</p>
                  <div className="mt-1.5 flex items-center gap-1 text-xs text-[#475569]">
                    <Clock className="h-3 w-3" strokeWidth={1.5} />
                    <span>Reply within 24 hours</span>
                  </div>
                  <a
                    href={`https://wa.me/${siteConfig.supportWhatsapp}?text=Hi%20Tokoflow%2C%20I%20have%20a%20question`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center justify-center rounded-lg bg-[#05A660] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#048C51]"
                  >
                    WhatsApp chat
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-[2rem] border border-[#E2E8F0] bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F6F0]">
                  <Mail className="h-6 w-6 text-[#05A660]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-base lg:text-lg font-bold text-[#1E293B]">Email</h3>
                  <p className="mt-0.5 text-sm text-[#475569]">For detailed questions or partnerships.</p>
                  <div className="mt-1.5 flex items-center gap-1 text-xs text-[#475569]">
                    <Clock className="h-3 w-3" strokeWidth={1.5} />
                    <span>Reply within 1-2 business days</span>
                  </div>
                  <a
                    href="mailto:hello@tokoflow.com"
                    className="mt-3 inline-flex items-center justify-center rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#1E293B] transition-colors hover:bg-[#E8F6F0] hover:border-[#05A660]/30"
                  >
                    hello@tokoflow.com
                  </a>
                </div>
              </div>

              <div className="rounded-[2rem] border border-[#E2E8F0] bg-slate-50 p-6">
                <h3 className="text-sm lg:text-base font-bold text-[#1E293B]">Other pages</h3>
                <div className="mt-3 flex flex-col gap-2">
                  <Link href="/features" className="text-sm text-[#475569] hover:text-[#1E293B] transition-colors">
                    Features →
                  </Link>
                  <Link href="/pricing" className="text-sm text-[#475569] hover:text-[#1E293B] transition-colors">
                    Pricing →
                  </Link>
                  <Link href="/about" className="text-sm text-[#475569] hover:text-[#1E293B] transition-colors">
                    About Tokoflow →
                  </Link>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-[2rem] border border-[#E2E8F0] bg-white p-6 sm:p-8 lg:p-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F6F0]">
                    <HelpCircle className="h-6 w-6 text-[#05A660]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-lg lg:text-xl font-bold text-[#1E293B]">
                      Common questions
                    </h2>
                    <p className="text-sm text-[#475569]">
                      Answers to things merchants ask most.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {faqs.map((faq) => (
                    <div key={faq.question} className="border-b border-[#E2E8F0] pb-5 last:border-0 last:pb-0">
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
        </div>
      </section>
    </>
  );
}
