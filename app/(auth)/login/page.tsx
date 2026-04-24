import type { Metadata } from "next";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; error?: string }>;
}) {
  const { slug } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <MarketingNav />
      <div className="flex flex-1 items-center justify-center px-4 pt-24 pb-12">
        <LoginForm claimedSlug={slug} />
      </div>
      <Footer />
    </div>
  );
}
