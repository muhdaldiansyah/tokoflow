import { redirect } from "next/navigation";
import { getUser, createClient } from "@/lib/supabase/server";
import { TodayView } from "@/features/orders/components/TodayView";
import type { Order } from "@/features/orders/types/order.types";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [{ data: activeOrders }, { data: doneToday }] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .not("status", "in", "(done,cancelled)")
      .order("delivery_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("orders")
      .select("id, customer_name, customer_phone, items, total, completed_at")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .eq("status", "done")
      .gte("completed_at", startOfToday)
      .order("completed_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <TodayView
      activeOrders={(activeOrders ?? []) as Order[]}
      doneToday={(doneToday ?? []) as Pick<Order, "id" | "customer_name" | "customer_phone" | "items" | "total" | "completed_at">[]}
      todayStr={todayStr}
      tomorrowStr={tomorrowStr}
    />
  );
}
