import type { Metadata } from "next";
import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — Tokoflow",
  description:
    "Tokoflow Privacy Policy — how we collect, use, and protect your data under Malaysia's Personal Data Protection Act (PDPA 2010).",
  alternates: {
    canonical: "https://tokoflow.com/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <>
      <div className="border-b pt-24 lg:pt-28">
        <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10">
          <nav className="mb-3 flex items-center gap-1.5 text-sm">
            <Link href="/" className="flex items-center gap-1 text-[#475569] transition-colors hover:text-[#1E293B]">
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#475569]/40" />
            <span className="font-medium text-[#1E293B]">Privacy</span>
          </nav>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-[#1E293B]">Privacy Policy</h1>
          <p className="mt-1 text-sm lg:text-base text-[#475569]">
            Last updated: 24 April 2026
          </p>
        </div>
      </div>

      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-sm text-[#475569]">
            This Privacy Policy explains how Tokoflow (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses, discloses, and protects personal information in accordance with Malaysia&apos;s Personal Data Protection Act 2010 (PDPA) and its 2025 amendments.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">1. Information we collect</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-[#475569] space-y-1">
            <li>Account — name, email, phone, business name, BRN, TIN, SST registration ID.</li>
            <li>Order &amp; invoice data — customer names, phone numbers, items, amounts, payment status.</li>
            <li>Payment data — processed by Billplz / third-party gateways; we store only reference identifiers.</li>
            <li>Usage data — cookies, device info, page views for analytics and abuse prevention.</li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">2. How we use your data</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-[#475569] space-y-1">
            <li>To operate the service: storefront, orders, invoicing, payments.</li>
            <li>To meet legal obligations: LHDN MyInvois e-Invoice submission, SST reporting, tax records.</li>
            <li>To communicate service-critical information and optional product updates.</li>
            <li>To improve the service via anonymised analytics.</li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">3. Who we share data with</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Your data is shared only with: (a) payment processors to settle transactions, (b) LHDN (MyInvois) for tax compliance on your explicit instruction, (c) cloud infrastructure providers under data-processing agreements, (d) authorities where required by Malaysian law.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">4. Data retention</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Transaction and invoice records are retained for at least 7 years to satisfy Malaysian tax law. Account profile data is retained while your account is active, plus 90 days after a deletion request.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">5. Your rights</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Under PDPA you may access, correct, or request deletion of your personal data; withdraw consent for optional processing; and lodge a complaint with the Personal Data Protection Department. Email hello@tokoflow.com to exercise these rights.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">6. Cross-border transfers</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Data may be processed on infrastructure located outside Malaysia (Singapore region). Transfers follow the cross-border guidelines under the PDPA 2025 amendments.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">7. Contact</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Data Protection Officer — email <a href="mailto:hello@tokoflow.com" className="text-[#05A660] underline">hello@tokoflow.com</a>.
          </p>
        </div>
      </section>
    </>
  );
}
