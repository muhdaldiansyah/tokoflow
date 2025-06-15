// app/(private)/dashboard/page.js
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/database/supabase/server";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect('/login');
  }

  // Get user metadata (name, business name, etc.)
  const profile = {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || null,
    business_name: user.user_metadata?.business_name || 'My Store',
    created_at: user.created_at
  };

  // Sample stats - in production, these would come from your database
  const stats = {
    totalOmzet: 73900000,
    totalProfit: 23112000,
    totalTransaksi: 16,
    totalProduk: 5,
    stokKritis: 2,
    profitMargin: 31.27
  };

  return <DashboardClient user={user} profile={profile} stats={stats} />;
}