import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { InvoiceForm } from "@/features/invoices/components/InvoiceForm";
import type { CreateInvoiceInput } from "@/features/invoices/types/invoice.types";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const { orderId } = await searchParams;
  let prefill: CreateInvoiceInput | undefined;

  if (orderId) {
    const supabase = await createClient();
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (order) {
      let buyerAddress: string | null = null;
      let buyerTin: string | null = null;
      let buyerBrn: string | null = null;
      let buyerSstId: string | null = null;

      if (order.customer_id) {
        const { data: customer } = await supabase
          .from("customers")
          .select("address, tin, brn, sst_registration_id, npwp")
          .eq("id", order.customer_id)
          .single();

        if (customer) {
          buyerAddress = (customer as { address?: string }).address || null;
          buyerTin = customer.tin || customer.npwp || null;
          buyerBrn = customer.brn || null;
          buyerSstId = customer.sst_registration_id || null;
        }
      }

      prefill = {
        order_id: order.id,
        customer_id: order.customer_id || undefined,
        buyer_name: order.customer_name || undefined,
        buyer_address: buyerAddress || undefined,
        buyer_phone: order.customer_phone || undefined,
        buyer_tin: buyerTin || undefined,
        buyer_brn: buyerBrn || undefined,
        buyer_sst_id: buyerSstId || undefined,
        items: order.items || [],
        discount: order.discount || 0,
      };
    }
  }

  return <InvoiceForm prefill={prefill} />;
}
