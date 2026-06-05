import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { PageViewTracker } from "@/components/PageViewTracker";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { TrialBanner } from "@/components/TrialBanner";
import { DashboardRealtimeProvider } from "@/components/DashboardRealtimeProvider";
import { RouteTransitionIndicator } from "@/components/layout/RouteTransitionIndicator";
import { getOrdersRemaining, getNudgeLevel, isBisnis } from "@/config/plans";


export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // getProfile() is React cache()-memoised — layout + pages that also call
  // getProfile(user.id) share the same Supabase round-trip per request.
  const profile = await getProfile(user.id);

  // Setup is no longer forced — onboarding checklist + contextual empty states guide new users
  // Setup page still accessible via /setup if user wants guided onboarding

  const displayName =
    profile?.business_name || profile?.full_name || user.user_metadata?.full_name || "User";

  const ordersRemaining = profile ? getOrdersRemaining(profile) : 0;
  const nudgeLevel = profile ? getNudgeLevel(profile) : "none";
  const isBisnisActive = profile ? isBisnis(profile) : false;

  return (
    <DashboardRealtimeProvider>
      <RouteTransitionIndicator />
      <div className="flex h-dvh overflow-hidden">
        <Sidebar userName={displayName} userEmail={user.email} userRole={profile?.role} ordersRemaining={ordersRemaining} isBisnisActive={isBisnisActive} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <MobileHeader userName={displayName} userEmail={user.email} userRole={profile?.role} ordersRemaining={ordersRemaining} isBisnisActive={isBisnisActive} />
          <OfflineIndicator />
          <TrialBanner nudgeLevel={nudgeLevel} />
          <main className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
          <PageViewTracker />
        </div>
      </div>
    </DashboardRealtimeProvider>
  );
}
