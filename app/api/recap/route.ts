import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
// WA Cloud API removed — see research/wa-bot-redesign/06
import type { OrderStatus } from "@/features/orders/types/order.types";

// GET - Full daily recap with all metrics + profile quota
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const mytNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const targetDate = searchParams.get("date") || mytNow.toISOString().split("T")[0];
    const startOfDay = `${targetDate}T00:00:00.000+08:00`;
    const endOfDay = `${targetDate}T23:59:59.999+08:00`;

    // Main query: orders for the date
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    // Products with cost_price for profit calculation
    const { data: products } = await supabase
      .from("products")
      .select("name, cost_price")
      .eq("user_id", user.id)
      .not("cost_price", "is", null);

    const costMap = new Map<string, number>();
    if (products) {
      for (const p of products) costMap.set(p.name.toLowerCase(), p.cost_price);
    }

    const ordersList = orders || [];
    const ordersByStatus: Record<OrderStatus, number> = {
      new: 0, menunggu: 0, processed: 0, shipped: 0, done: 0, cancelled: 0,
    };

    let totalRevenue = 0, paidRevenue = 0, partialRevenue = 0, unpaidRevenue = 0;
    let collectedRevenue = 0, totalDiscount = 0;
    let cancelledCount = 0, cancelledValue = 0;
    let paidCount = 0, partialCount = 0, unpaidCount = 0;

    const ordersBySource: Record<string, number> = {};
    const revenueBySource: Record<string, number> = {};
    const itemMap = new Map<string, { qty: number; revenue: number; cost: number }>();
    const uniqueCustomerSet = new Set<string>();

    for (const order of ordersList) {
      const status = order.status as OrderStatus;
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;

      if (status === "cancelled") {
        cancelledCount++;
        cancelledValue += order.total || 0;
        continue;
      }

      const orderTotal = order.total || 0;
      const paidAmount = order.paid_amount || 0;
      totalRevenue += orderTotal;
      collectedRevenue += paidAmount;
      totalDiscount += order.discount || 0;

      const custId = order.customer_phone || order.customer_name;
      if (custId) uniqueCustomerSet.add(custId);

      if (order.payment_status === "paid") { paidRevenue += orderTotal; paidCount++; }
      else if (order.payment_status === "partial") { partialRevenue += orderTotal; partialCount++; }
      else { unpaidRevenue += orderTotal; unpaidCount++; }

      const source = order.source || "manual";
      ordersBySource[source] = (ordersBySource[source] || 0) + 1;
      revenueBySource[source] = (revenueBySource[source] || 0) + orderTotal;

      const items = order.items as { name: string; price: number; qty: number }[] | null;
      if (items) {
        for (const item of items) {
          const key = item.name.toLowerCase();
          const existing = itemMap.get(key) ?? { qty: 0, revenue: 0, cost: 0 };
          existing.qty += item.qty;
          existing.revenue += item.price * item.qty;
          const unitCost = costMap.get(key);
          if (unitCost) existing.cost += unitCost * item.qty;
          itemMap.set(key, existing);
        }
      }
    }

    const activeOrderCount = ordersList.length - cancelledCount;

    const topItems = Array.from(itemMap.entries())
      .map(([name, data]) => {
        const profit = data.cost > 0 ? data.revenue - data.cost : undefined;
        const margin = profit !== undefined && data.revenue > 0 ? Math.round((profit / data.revenue) * 100) : undefined;
        return {
          name: name.charAt(0).toUpperCase() + name.slice(1),
          qty: data.qty, revenue: data.revenue,
          cost: data.cost > 0 ? data.cost : undefined, profit, margin,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Yesterday for growth comparison
    const yesterday = new Date(`${targetDate}T12:00:00+08:00`);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
    const yesterdayStart = `${yesterdayStr}T00:00:00.000+08:00`;
    const yesterdayEnd = `${yesterdayStr}T23:59:59.999+08:00`;

    const nowMyt = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
    const todayStartIso = `${nowMyt}T00:00:00.000+08:00`;

    // Parallel: new customers, yesterday, stock alerts, late orders, profile
    const [
      { data: newCustomerData },
      { data: yesterdayOrders },
      { data: stockAlertData },
      { data: lateOrderData },
      { data: profile },
    ] = await Promise.all([
      supabase.from("customers").select("name").eq("user_id", user.id)
        .gte("created_at", startOfDay).lte("created_at", endOfDay),
      supabase.from("orders").select("total, status").eq("user_id", user.id)
        .gte("created_at", yesterdayStart).lte("created_at", yesterdayEnd),
      supabase.from("products").select("name, stock").eq("user_id", user.id)
        .eq("is_available", true).is("deleted_at", null).gt("stock", 0).lte("stock", 10)
        .order("stock", { ascending: true }),
      supabase.from("orders").select("id, order_number, customer_name, delivery_date, total")
        .eq("user_id", user.id).lt("delivery_date", todayStartIso)
        .in("status", ["new", "menunggu", "processed", "shipped"])
        .order("delivery_date", { ascending: true }).limit(10),
      supabase.from("profiles").select("orders_used, orders_limit").eq("id", user.id).single(),
    ]);

    const newCustomerNames = (newCustomerData || []).map((c: { name: string }) => c.name).filter(Boolean) as string[];

    let growthRevenue: number | null = null;
    let growthOrders: number | null = null;
    if (yesterdayOrders && yesterdayOrders.length > 0) {
      const yesterdayActive = yesterdayOrders.filter((o: { status: string }) => o.status !== "cancelled");
      growthRevenue = yesterdayActive.reduce((sum: number, o: { total: number }) => sum + (o.total || 0), 0);
      growthOrders = yesterdayActive.length;
    }

    const piutang = totalRevenue - collectedRevenue;
    const aov = activeOrderCount > 0 ? Math.round(totalRevenue / activeOrderCount) : 0;
    const collectionRate = totalRevenue > 0 ? Math.round((collectedRevenue / totalRevenue) * 100) : 0;
    const doneCount = ordersByStatus.done || 0;
    const fulfillmentBase = activeOrderCount - (ordersByStatus.menunggu || 0);
    const fulfillmentRate = fulfillmentBase > 0 ? Math.round((doneCount / fulfillmentBase) * 100) : 0;
    const cancellationRate = ordersList.length > 0 ? Math.round((cancelledCount / ordersList.length) * 100) : 0;

    return NextResponse.json({
      today: {
        date: targetDate, totalOrders: activeOrderCount, ordersByStatus,
        totalRevenue, paidRevenue, partialRevenue, unpaidRevenue, collectedRevenue,
        piutang, aov, collectionRate, ordersBySource, revenueBySource, totalDiscount,
        cancelledCount, cancelledValue, fulfillmentRate, cancellationRate,
        paidCount, partialCount, unpaidCount,
        growthRevenue, growthOrders,
        newCustomers: newCustomerNames.length, newCustomerNames,
        topItems,
        returningCustomers: Math.max(0, uniqueCustomerSet.size - newCustomerNames.length),
        stockAlerts: (stockAlertData || []).map((p: { name: string; stock: number }) => ({ name: p.name, stock: p.stock })),
        lateOrders: (lateOrderData || []).map((o: { id: string; order_number: string; customer_name: string; delivery_date: string; total: number }) => ({
          id: o.id, orderNumber: o.order_number || "", customerName: o.customer_name || "-",
          deliveryDate: o.delivery_date, total: o.total || 0,
        })),
      },
      ordersUsed: profile?.orders_used ?? 0,
      ordersLimit: profile?.orders_limit ?? 150,
    });
  } catch (error) {
    console.error("Recap API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Send recap via WhatsApp (unchanged)
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { phone } = body;
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const now = new Date();
    const mytNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const today = mytNow.toISOString().split("T")[0];
    const startOfDay = `${today}T00:00:00.000+08:00`;
    const endOfDay = `${today}T23:59:59.999+08:00`;

    const { data: orders } = await supabase
      .from("orders").select("*").eq("user_id", user.id)
      .gte("created_at", startOfDay).lte("created_at", endOfDay);

    const ordersList = orders || [];
    let totalRevenue = 0, paidCount = 0, unpaidCount = 0;
    for (const order of ordersList) {
      if (order.status !== "cancelled") {
        totalRevenue += order.total || 0;
        if (order.payment_status === "paid") paidCount++;
        else unpaidCount++;
      }
    }

    const { data: profileData } = await supabase
      .from("profiles").select("business_name").eq("id", user.id).single();
    const businessName = profileData?.business_name || "My Store";

    // WA template sending removed — use WAPreviewSheet in dashboard instead
    return NextResponse.json({ error: "WA Cloud API integration removed. Use manual WA send from dashboard." }, { status: 410 });
  } catch (error) {
    console.error("Send recap API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
