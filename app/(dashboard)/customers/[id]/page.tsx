import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { CustomerDetailClient } from "@/features/customers/components/CustomerDetailClient";
import type { Customer } from "@/features/customers/types/customer.types";
import type { Order } from "@/features/orders/types/order.types";

const ORDER_SELECT =
  "id, user_id, order_number, customer_id, customer_name, customer_phone, items, subtotal, discount, total, unique_code, transfer_amount, paid_amount, notes, source, status, payment_status, delivery_date, is_preorder, is_dine_in, is_langganan, is_booking, booking_time, table_number, payment_claimed_at, image_urls, referral_source, assigned_staff_id, assigned_at, created_at, updated_at";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!customer) redirect("/customers");

  // Fetch orders after we have the customer — customer_id is the FK, not url param
  const { data: orders } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("user_id", user.id)
    // exclude awaiting-payment QR ghosts (migration 109)
    .eq("awaiting_payment", false)
    .eq("customer_id", customer.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <CustomerDetailClient
        customer={customer as Customer}
        orders={(orders ?? []) as Order[]}
      />
    </div>
  );
}
