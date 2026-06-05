import type { Metadata } from "next";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; ref?: string; community?: string }>;
}) {
  const { slug, ref, community } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <MarketingNav />
      <div className="flex flex-1 items-center justify-center px-4 pt-24 pb-12">
        <RegisterForm claimedSlug={slug} referralCode={ref} communityCode={community} />
      </div>
      <Footer />
    </div>
  );
}
