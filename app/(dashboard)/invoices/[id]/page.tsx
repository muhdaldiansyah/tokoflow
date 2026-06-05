import { redirect } from "next/navigation";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { isBisnis } from "@/config/plans";
import { InvoiceDetail } from "@/features/invoices/components/InvoiceDetail";
import type { Invoice } from "@/features/invoices/types/invoice.types";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const [{ data: invoice }, profile] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).eq("user_id", user.id).single(),
    getProfile(user.id),
  ]);

  if (!invoice) redirect("/invoices");

  return <InvoiceDetail invoice={invoice as Invoice} isBisnisActive={profile ? isBisnis(profile) : false} />;
}
