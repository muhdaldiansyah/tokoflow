import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { PageViewTracker } from "@/components/PageViewTracker";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { TrialBanner } from "@/components/TrialBanner";
import { DashboardRealtimeProvider } from "@/components/DashboardRealtimeProvider";
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

  // Fetch profile for sidebar user display
  const supabase = await createClient();
  const [{ data: profile }, { count: totalOrders }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, business_name, business_type, business_category, role, orders_used, order_credits, unlimited_until, packs_bought_this_month, bisnis_until")
      .eq("id", user.id)
      .single(),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("status", "eq", "cancelled")
      .is("deleted_at", null),
  ]);

  // Setup is no longer forced — onboarding checklist + contextual empty states guide new users
  // Setup page still accessible via /setup if user wants guided onboarding

  const displayName =
    profile?.business_name || profile?.full_name || user.user_metadata?.full_name || "User";

  const ordersRemaining = profile ? getOrdersRemaining(profile) : 0;
  const nudgeLevel = profile ? getNudgeLevel(profile) : "none";
  const isBisnisActive = profile ? isBisnis(profile) : false;

  return (
    <DashboardRealtimeProvider>
      <div className="flex h-dvh overflow-hidden">
        <Sidebar userName={displayName} userEmail={user.email} userRole={profile?.role} ordersRemaining={ordersRemaining} isBisnisActive={isBisnisActive} totalOrders={totalOrders ?? 0} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <MobileHeader userName={displayName} userEmail={user.email} userRole={profile?.role} ordersRemaining={ordersRemaining} isBisnisActive={isBisnisActive} totalOrders={totalOrders ?? 0} />
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
