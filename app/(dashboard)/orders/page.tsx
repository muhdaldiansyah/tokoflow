import { redirect } from "next/navigation";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { OrderList, type OrderListInitialData } from "@/features/orders/components/OrderList";
import type { Order } from "@/features/orders/types/order.types";
import type { TodaySummary } from "@/features/orders/services/order.service";

const PAGE_SIZE = 50;

const ORDER_LIST_SELECT =
  "id, user_id, order_number, customer_id, customer_name, customer_phone, items, subtotal, discount, total, delivery_fee, delivery_zone, unique_code, transfer_amount, paid_amount, notes, source, status, payment_status, delivery_date, is_preorder, is_dine_in, is_langganan, is_booking, booking_time, table_number, payment_claimed_at, awaiting_payment, image_urls, referral_source, assigned_staff_id, assigned_at, created_at, updated_at";

function getMytTodayBounds() {
  const now = new Date();
  const mytOffset = 8 * 60 * 60 * 1000;
  const mytNow = new Date(now.getTime() + mytOffset);
  const date = `${mytNow.getUTCFullYear()}-${String(mytNow.getUTCMonth() + 1).padStart(2, "0")}-${String(mytNow.getUTCDate()).padStart(2, "0")}`;

  return {
    date,
    start: `${date}T00:00:00.000+08:00`,
    end: `${date}T23:59:59.999+08:00`,
  };
}

async function getInitialTodaySummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<TodaySummary> {
  const { start, end } = getMytTodayBounds();

  const [createdResult, deliveryResult, unpaidResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id, status, total, delivery_date, source")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .eq("awaiting_payment", false)
      .gte("created_at", start)
      .lte("created_at", end),
    supabase
      .from("orders")
      .select("id, status, total, delivery_date, source")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .eq("awaiting_payment", false)
      .gte("delivery_date", start)
      .lte("delivery_date", end),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null)
      .eq("awaiting_payment", false)
      .neq("status", "cancelled")
      .in("payment_status", ["unpaid", "partial"]),
  ]);

  const orderMap = new Map<string, { id: string; status: string; total: number | null; source?: string | null }>();
  for (const order of [...(createdResult.data || []), ...(deliveryResult.data || [])]) {
    if (!orderMap.has(order.id)) orderMap.set(order.id, order);
  }

  const allOrders = Array.from(orderMap.values());
  const nonCancelled = allOrders.filter((order) => order.status !== "cancelled");
  const todayOrderCount = nonCancelled.length;

  return {
    pendingCount: nonCancelled.filter((order) => order.status === "new" || order.status === "processed").length,
    todayRevenue: nonCancelled.reduce((sum, order) => sum + (order.total || 0), 0),
    todayOrderCount,
    allTodayDone: todayOrderCount > 0 && nonCancelled.every((order) => order.status === "done"),
    linkOrderCount: nonCancelled.filter((order) => order.source === "order_link").length,
    unpaidCount: unpaidResult.count ?? 0,
  };
}

async function getInitialDeliverySummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<OrderListInitialData["deliverySummary"]> {
  const { start, end } = getMytTodayBounds();

  const { data } = await supabase
    .from("orders")
    .select("id, items, total")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .eq("awaiting_payment", false)
    .not("delivery_date", "is", null)
    .gte("delivery_date", start)
    .lte("delivery_date", end)
    .not("status", "in", '("done","cancelled")');

  if (!data || data.length === 0) return null;

  const itemMap = new Map<string, number>();
  let revenue = 0;

  for (const order of data) {
    revenue += order.total || 0;
    const items = (order.items || []) as { name: string; qty: number }[];
    for (const item of items) {
      const key = item.name.toLowerCase();
      itemMap.set(key, (itemMap.get(key) || 0) + item.qty);
    }
  }

  const items = Array.from(itemMap.entries())
    .map(([name, qty]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), qty }))
    .sort((a, b) => b.qty - a.qty);

  return { count: data.length, items, revenue };
}

export default async function OrdersPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  // getProfile() is React cache()-memoised — shared with layout.tsx, no extra round-trip.
  const [ordersResult, profile, todaySummary, deliverySummary] = await Promise.all([
    supabase
      .from("orders")
      .select(ORDER_LIST_SELECT)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .eq("awaiting_payment", false)
      .not("status", "in", '("done","cancelled")')
      .order("created_at", { ascending: false })
      .range(0, PAGE_SIZE - 1),
    getProfile(user.id),
    getInitialTodaySummary(supabase, user.id),
    getInitialDeliverySummary(supabase, user.id),
  ]);

  const orders = (ordersResult.data || []) as Order[];

  return (
    <OrderList
      initialData={{
        orders,
        hasMore: orders.length >= PAGE_SIZE,
        fromCache: false,
        profile: profile ?? null,
        todaySummary,
        deliverySummary,
      }}
    />
  );
}
