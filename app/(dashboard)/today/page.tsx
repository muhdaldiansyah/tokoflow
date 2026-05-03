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

  const [{ data: activeOrders }, { data: doneToday }, { data: profile }, { data: outOfStockProducts }] = await Promise.all([
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
    supabase
      .from("profiles")
      .select("daily_order_capacity")
      .eq("id", user.id)
      .single(),
    supabase
      .from("products")
      .select("id, name, stock")
      .eq("user_id", user.id)
      .eq("is_available", true)
      .eq("stock", 0),
  ]);

  // Out-of-stock products that are actually in today's active or done orders.
  // (Surfacing every zero-stock product on /today would be noise; only the
  // ones a customer is currently waiting on matter.)
  const activeArr = (activeOrders ?? []) as Order[];
  const doneArr = (doneToday ?? []) as Pick<Order, "id" | "customer_name" | "customer_phone" | "items" | "total" | "completed_at">[];
  const namesInPlay = new Set<string>();
  for (const o of activeArr) {
    for (const it of o.items ?? []) namesInPlay.add(it.name.toLowerCase());
  }
  const outOfStockInPlay = (outOfStockProducts ?? [])
    .filter((p) => p.name && namesInPlay.has(p.name.toLowerCase()))
    .map((p) => p.name as string);

  // Today's order count for the capacity meter — active + done today.
  const todayOrderCount = activeArr.filter((o) => {
    if (!o.created_at) return false;
    return new Date(o.created_at) >= new Date(startOfToday);
  }).length + doneArr.length;

  return (
    <TodayView
      activeOrders={activeArr}
      doneToday={doneArr}
      todayStr={todayStr}
      tomorrowStr={tomorrowStr}
      dailyCapacity={profile?.daily_order_capacity ?? null}
      todayOrderCount={todayOrderCount}
      outOfStockInPlay={outOfStockInPlay}
    />
  );
}
