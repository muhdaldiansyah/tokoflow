import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { InvoiceForm } from "@/features/invoices/components/InvoiceForm";
import type { Invoice } from "@/features/invoices/types/invoice.types";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!invoice) redirect("/invoices");

  return <InvoiceForm existingInvoice={invoice as Invoice} />;
}
