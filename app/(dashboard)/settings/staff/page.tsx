import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { StaffPageClient } from "@/features/staff/components/StaffPageClient";
import type { Staff } from "@/features/staff/types/staff.types";

export default async function StaffPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("staff")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return <StaffPageClient initialStaff={(staff ?? []) as Staff[]} />;
}
