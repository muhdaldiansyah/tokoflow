import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { EditOrderClient } from "@/features/orders/components/EditOrderClient";
import type { Order, OrderStatusLog } from "@/features/orders/types/order.types";

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [{ data: order }, { data: statusLogs }] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single(),
    supabase
      .from("order_status_logs")
      .select("*")
      .eq("order_id", id)
      .order("changed_at", { ascending: false }),
  ]);

  if (!order) redirect("/orders");

  return (
    <EditOrderClient
      order={order as Order}
      statusLogs={(statusLogs ?? []) as OrderStatusLog[]}
    />
  );
}
