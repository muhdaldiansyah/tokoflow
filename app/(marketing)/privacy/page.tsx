import type { Metadata } from "next";
import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
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
            Last updated: 19 May 2026
          </p>
        </div>
      </div>

      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-sm text-[#475569]">
            This Privacy Policy explains how Tokoflow (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses, discloses, and protects personal information in accordance with Malaysia&apos;s Personal Data Protection Act 2010 (PDPA) and its 2025 amendments.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">1. Information we collect</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Two categories — what merchants give us about themselves, and what customers give merchants through us.
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm text-[#475569] space-y-1">
            <li><strong>Merchant account</strong> — name, email, phone, business name, BRN, TIN, SST registration ID, business category, city, business address, business description, logo / cover photo.</li>
            <li><strong>Order &amp; invoice data</strong> — customer name, phone, items, amounts, payment status, delivery date, delivery address, tracking number + courier name (when the merchant adds them), notes.</li>
            <li><strong>Payment data</strong> — processed by Billplz / third-party gateways; we store only reference identifiers.</li>
            <li><strong>Usage data</strong> — cookies, device info, page views for analytics and abuse prevention.</li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">2. How we use your data</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-[#475569] space-y-1">
            <li>To operate the service: storefront, orders, invoicing, payments, transactional WhatsApp / email notifications.</li>
            <li>To list opted-in merchants on the public directory at <code>/store</code> (see &sect; 4 below).</li>
            <li>To meet legal obligations: LHDN MyInvois e-Invoice submission, SST reporting, tax records.</li>
            <li>To communicate service-critical information and optional product updates.</li>
            <li>To improve the service via anonymised analytics.</li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">3. Who we share data with</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Your data is shared only with: (a) payment processors to settle transactions, (b) LHDN (MyInvois) for tax compliance on your explicit instruction, (c) cloud infrastructure providers under data-processing agreements, (d) authorities where required by Malaysian law. <strong>We do not sell or rent your data.</strong>
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">4. Directory listing &amp; what is public</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Merchants are opt-in listed on the public directory at <code>tokoflow.com/store</code>. When listed, the following are visible to anyone: business name, business description, city, business category, logo (if uploaded), product photos &amp; prices (if you mark products as available), and the slug of your store link. Your personal email, phone, address, BRN, TIN, and SST ID are <strong>never</strong> shown on the directory. Toggle the listing off anytime in <em>Settings &rarr; List on directory</em>; your direct <code>tokoflow.com/[slug]</code> link continues to work either way.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">5. Order receipts &amp; customer acknowledgement links</h2>
          <p className="mt-2 text-sm text-[#475569]">
            When a customer places an order, the merchant can share a receipt link (<code>/r/[id]</code>) and an optional delivery confirmation link (<code>/a/[token]</code>). These URLs use unguessable UUID tokens and are not indexable by search engines. Anyone who holds the URL can view the order details. Merchants choose who to share the link with; treat it like sharing a Google Drive link.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">6. Data retention</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Transaction and invoice records are retained for at least 7 years to satisfy Malaysian tax law. Account profile data is retained while your account is active, plus 90 days after a deletion request.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">7. Your rights</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Under PDPA you may access, correct, or request deletion of your personal data; withdraw consent for optional processing; export your full account + order history at any time; and lodge a complaint with the Personal Data Protection Department. Email hello@tokoflow.com to exercise these rights.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">8. Cross-border transfers</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Data is processed on infrastructure located in Singapore (Supabase <code>ap-southeast-1</code>) and on Vercel&apos;s global edge network. Transfers follow the cross-border guidelines under the PDPA 2025 amendments.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">9. Contact</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Data Protection Officer — email <a href="mailto:hello@tokoflow.com" className="text-[#05A660] underline">hello@tokoflow.com</a>.
          </p>
        </div>
      </section>
    </>
  );
}
