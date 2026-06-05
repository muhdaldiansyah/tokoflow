import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { PrepPageClient } from "@/features/recap/components/PrepPageClient";
import type { ProductionSummary } from "@/features/recap/services/production.service";
import type { ProductionItem, ProductionOrder } from "@/features/recap/services/production.service";

function buildProductionSummary(
  orders: Record<string, unknown>[],
  dateStr: string
): ProductionSummary | null {
  if (!orders || orders.length === 0) return null;

  const itemMap = new Map<string, { qty: number; orderIds: Set<string> }>();
  let totalItemCount = 0;
  let paidCount = 0, partialCount = 0, unpaidCount = 0;
  let paidRevenue = 0, collectedRevenue = 0, totalRevenue = 0;
  const productionOrders: ProductionOrder[] = [];

  for (const order of orders) {
    const orderTotal = (order.total as number) || 0;
    const paidAmount = (order.paid_amount as number) || 0;
    totalRevenue += orderTotal;
    collectedRevenue += paidAmount;

    if (order.payment_status === "paid") { paidCount++; paidRevenue += orderTotal; }
    else if (order.payment_status === "partial") { partialCount++; }
    else { unpaidCount++; }

    const items = order.items as { name: string; price: number; qty: number }[] | null;
    const orderItems: { name: string; qty: number }[] = [];

    if (items) {
      for (const item of items) {
        const key = item.name.toLowerCase();
        const existing = itemMap.get(key) || { qty: 0, orderIds: new Set<string>() };
        existing.qty += item.qty;
        existing.orderIds.add(order.id as string);
        itemMap.set(key, existing);
        totalItemCount += item.qty;
        orderItems.push({ name: item.name, qty: item.qty });
      }
    }

    productionOrders.push({
      orderNumber: (order.order_number as string) || "",
      customerName: (order.customer_name as string) || "-",
      customerPhone: (order.customer_phone as string) || "",
      items: orderItems,
      total: orderTotal,
      paidAmount,
      paymentStatus: (order.payment_status as string) || "unpaid",
    });
  }

  const productionItems: ProductionItem[] = Array.from(itemMap.entries())
    .map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      qty: data.qty,
      orderCount: data.orderIds.size,
    }))
    .sort((a, b) => b.qty - a.qty);

  return {
    date: dateStr,
    totalOrders: orders.length,
    totalItems: totalItemCount,
    items: productionItems,
    orders: productionOrders,
    paidCount, partialCount, unpaidCount,
    paidRevenue, collectedRevenue, totalRevenue,
  };
}

export default async function PrepPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  // Compute tomorrow in MYT (UTC+8)
  const nowMyt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  nowMyt.setUTCDate(nowMyt.getUTCDate() + 1);
  const tomorrowStr = `${nowMyt.getUTCFullYear()}-${String(nowMyt.getUTCMonth() + 1).padStart(2, "0")}-${String(nowMyt.getUTCDate()).padStart(2, "0")}`;

  const startOfDay = `${tomorrowStr}T00:00:00.000+08:00`;
  const endOfDay = `${tomorrowStr}T23:59:59.999+08:00`;

  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("business_name").eq("id", user.id).single(),
    supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      // Hide QR orders still awaiting a payment receipt (migration 109) — never
      // prep food for an unpaid ghost order.
      .eq("awaiting_payment", false)
      .not("delivery_date", "is", null)
      .gte("delivery_date", startOfDay)
      .lte("delivery_date", endOfDay)
      .neq("status", "cancelled")
      .order("created_at", { ascending: true }),
  ]);

  const initialProduction = buildProductionSummary(
    (orders as Record<string, unknown>[]) ?? [],
    tomorrowStr
  );

  return (
    <PrepPageClient
      initialProduction={initialProduction}
      initialDateStr={tomorrowStr}
      businessName={profile?.business_name || ""}
    />
  );
}
