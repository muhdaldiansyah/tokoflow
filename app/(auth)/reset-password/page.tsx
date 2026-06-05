import type { Metadata } from "next";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password — Tokoflow",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <MarketingNav />
      <div className="flex flex-1 items-center justify-center px-4 pt-24 pb-12">
        <ResetPasswordForm />
      </div>
      <Footer />
    </div>
  );
}
