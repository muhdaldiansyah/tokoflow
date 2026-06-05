import { redirect } from "next/navigation";
import { CustomerList } from "@/features/customers/components/CustomerList";
import { createClient, getUser } from "@/lib/supabase/server";
import type { Customer } from "@/features/customers/types/customer.types";
import type { PiutangSummary } from "@/features/orders/services/order.service";

const CUSTOMER_LIST_SELECT =
  "id, user_id, name, phone, address, tin, brn, sst_registration_id, npwp, total_orders, total_spent, last_order_at, created_at, updated_at";

interface PiutangRow {
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  total_debt: number | string | null;
  order_count: number | string | null;
}

function toPiutangSummary(rows: PiutangRow[] | null): PiutangSummary {
  const customers = (rows || []).map((row) => ({
    customer_id: row.customer_id || "",
    customer_name: row.customer_name || "Tanpa nama",
    customer_phone: row.customer_phone || "",
    total_debt: Number(row.total_debt) || 0,
    order_count: Number(row.order_count) || 0,
  }));

  return {
    totalDebt: customers.reduce((sum, customer) => sum + customer.total_debt, 0),
    customerCount: customers.length,
    customers,
  };
}

export default async function CustomersPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [customersResult, piutangResult] = await Promise.all([
    supabase
      .from("customers")
      .select(CUSTOMER_LIST_SELECT)
      .eq("user_id", user.id)
      .order("last_order_at", { ascending: false, nullsFirst: false }),
    supabase.rpc("get_piutang_summary", { p_user_id: user.id }),
  ]);

  if (customersResult.error) {
    console.error("Error fetching initial customers:", customersResult.error);
  }

  if (piutangResult.error) {
    console.error("Error fetching initial piutang:", piutangResult.error);
  }

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <CustomerList
        initialCustomers={(customersResult.data || []) as Customer[]}
        initialPiutang={toPiutangSummary((piutangResult.data || []) as PiutangRow[])}
      />
    </div>
  );
}
