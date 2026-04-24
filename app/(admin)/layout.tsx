import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";

export const metadata: Metadata = {
  title: "Admin — Tokoflow",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, business_name, role")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.business_name || profile?.full_name || user.user_metadata?.full_name || "User";

  return (
    <AdminGuard>
      <div className="flex h-dvh overflow-hidden">
        <Sidebar
          userName={displayName}
          userEmail={user.email}
          variant="admin"
          userRole={profile?.role}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <MobileHeader
            userName={displayName}
            userEmail={user.email}
            variant="admin"
            userRole={profile?.role}
          />
          <main className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
