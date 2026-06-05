import { redirect } from "next/navigation";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { isBisnis } from "@/config/plans";
import { InvoicesClient } from "@/features/invoices/components/InvoicesClient";
import type { Invoice } from "@/features/invoices/types/invoice.types";

export default async function InvoicesPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const [profile, { data: invoices }] = await Promise.all([
    getProfile(user.id),
    supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <InvoicesClient
        initialInvoices={(invoices ?? []) as Invoice[]}
        bisnisActive={profile ? isBisnis(profile) : false}
      />
    </div>
  );
}
