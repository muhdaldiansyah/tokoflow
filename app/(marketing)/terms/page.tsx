import type { Metadata } from "next";
import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of service for Tokoflow — WhatsApp storefront, order management, and LHDN MyInvois e-Invoice for Malaysian small businesses.",
  alternates: {
    canonical: "https://tokoflow.com/terms",
  },
};

export default function TermsPage() {
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
            <span className="font-medium text-[#1E293B]">Terms</span>
          </nav>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-[#1E293B]">Terms of Service</h1>
          <p className="mt-1 text-sm lg:text-base text-[#475569]">
            Last updated: 24 April 2026
          </p>
        </div>
      </div>

      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-sm text-[#475569]">
            These Terms govern your use of Tokoflow. By creating an account you agree to these Terms.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">1. The service</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Tokoflow provides a WhatsApp-oriented storefront, order management, and (on the Pro plan) LHDN MyInvois e-Invoice submission. The service is provided on an &ldquo;as is&rdquo; basis; we continuously improve functionality.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">2. Your account</h2>
          <p className="mt-2 text-sm text-[#475569]">
            You are responsible for protecting your login credentials and for all activity on your account. Do not share your login with third parties. You must be 18+ or have parental consent to use Tokoflow for commercial purposes.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">3. Fees and billing</h2>
          <p className="mt-2 text-sm text-[#475569]">
            The free tier includes 50 orders per month. Top-ups and subscriptions are billed in Malaysian Ringgit via Billplz. Top-up credits never expire. Subscription plans auto-renew monthly unless cancelled before the renewal date. All prices exclude SST where applicable.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">4. Your content</h2>
          <p className="mt-2 text-sm text-[#475569]">
            You retain ownership of all content and data you upload. You grant Tokoflow a limited licence to store, display, and process your content solely to operate the service. You are responsible for the accuracy of products, prices, and invoice data you enter.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">5. Tax compliance</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Tokoflow submits e-Invoices to LHDN MyInvois on your behalf when you enable the Pro plan and provide valid MyInvois credentials. You are responsible for ensuring all tax data (TIN, BRN, SST ID, SST rates) is accurate and complete. Tokoflow is not a licensed tax advisor; consult your accountant for tax questions.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">6. Acceptable use</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Do not use Tokoflow for illegal products, spam, fraud, or content that violates Malaysian law. We may suspend accounts that breach these terms.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">7. Limitation of liability</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Tokoflow's total liability for any claim is limited to fees you paid in the 3 months preceding the claim. We are not liable for indirect or consequential damages.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">8. Termination</h2>
          <p className="mt-2 text-sm text-[#475569]">
            You may cancel your account at any time. We may terminate or suspend accounts for breach of these Terms. On termination you may export your data for 30 days before deletion.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">9. Governing law</h2>
          <p className="mt-2 text-sm text-[#475569]">
            These Terms are governed by the laws of Malaysia. Disputes are resolved in the courts of Kuala Lumpur.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">10. Contact</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Questions? Email <a href="mailto:hello@tokoflow.com" className="text-[#05A660] underline">hello@tokoflow.com</a>.
          </p>
        </div>
      </section>
    </>
  );
}
