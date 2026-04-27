import type { Metadata } from "next";
import Link from "next/link";
import { Gift, Smartphone, MessageSquare, HelpCircle } from "lucide-react";
import SignupForm from "./SignupForm";

export const metadata: Metadata = {
  title: "Try Tokoflow — Early access",
  description:
    "Sell something? Try Tokoflow during early access. Your shop, one photo away. Help shape the product and get a TNG reload as a thank-you.",
  alternates: {
    canonical: "https://tokoflow.com/coba-aplikasi",
  },
};

const faqs = [
  {
    question: "Is it really free?",
    answer: "Yes. 50 orders/month free forever — including 1-Photo Onboarding, your shop link, and basic AI customer assistant.",
  },
  {
    question: "Do I need to install anything?",
    answer: "No. Tokoflow runs in your mobile browser. Install as a PWA if you want an app icon. Native iOS / Android apps follow a few months after launch.",
  },
  {
    question: "When do I get the reload?",
    answer: "After 14 days of use plus a short feedback chat with us.",
  },
];

export default function CobaAplikasiPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Try Tokoflow — early access",
            url: "https://tokoflow.com/coba-aplikasi",
          }),
        }}
      />

      {/* Hero + Form */}
      <section className="pt-20 pb-12 lg:pt-24 lg:pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* Left */}
            <div className="space-y-6 lg:pt-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#05A660]/20 bg-[#E8F6F0] px-3 py-1 pr-4 text-sm font-medium text-[#05A660]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#05A660] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#05A660]"></span>
                </span>
                Limited spots
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#1E293B] leading-snug">
                Your shop,
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05A660] to-[#048C51]">
                  one photo away.
                </span>
              </h1>

              <p className="text-[#475569] leading-relaxed">
                Tokoflow is in early access — we&apos;re looking for sellers who want a tool that respects their time and dignifies their work. Help shape the magic.
              </p>

              <div className="space-y-2.5">
                {[
                  { icon: Gift, text: "RM 10 mobile top-up after 14 days of use" },
                  { icon: Smartphone, text: "Free forever — first 50 orders/month" },
                  { icon: MessageSquare, text: "Your feedback shapes the product" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2.5">
                    <item.icon className="h-4 w-4 text-[#05A660] shrink-0" strokeWidth={1.5} />
                    <span className="text-sm text-[#1E293B]">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Form */}
            <div className="lg:sticky lg:top-24">
              <div className="rounded-[2rem] border border-[#E2E8F0] bg-white shadow-lg p-6 lg:p-8">
                <h2 className="text-lg font-bold text-[#1E293B] mb-1">Get early access</h2>
                <p className="text-sm text-[#94A3B8] mb-6">We&apos;ll reach you on WhatsApp within 1–2 days.</p>
                <SignupForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ — compact */}
      <section className="border-t border-[#E2E8F0] py-10 lg:py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-[#94A3B8] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <p key={faq.question} className="text-sm text-[#475569]">
                    <strong className="text-[#1E293B]">{faq.question}</strong>{" "}{faq.answer}
                  </p>
                ))}
                <p className="text-sm text-[#475569]">
                  Other questions?{" "}
                  <Link href="https://wa.me/60123456789?text=Hi%2C%20I%27d%20like%20to%20ask%20about%20the%20Tokoflow%20beta" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#05A660] hover:underline">WhatsApp chat</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
