import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import type { OrderStatus, PaymentStatus } from "@/features/orders/types/order.types";

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
    }

    // MYT (UTC+8) boundaries for the month
    const startDate = `${year}-${String(month).padStart(2, "0")}-01T00:00:00.000+08:00`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01T00:00:00.000+08:00`;

    // Wave 1: orders + products
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startDate)
      .lt("created_at", endDate)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Monthly recap orders query error:", error);
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
      for (const p of products) {
        costMap.set(p.name.toLowerCase(), p.cost_price);
      }
    }

    const ordersList = orders || [];

    let totalRevenue = 0;
    let paidRevenue = 0;
    let partialRevenue = 0;
    let unpaidRevenue = 0;
    let collectedRevenue = 0;
    let totalDiscount = 0;
    let paidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;
    let cancelledCount = 0;
    let cancelledValue = 0;

    const ordersByStatus: Record<OrderStatus, number> = {
      new: 0, menunggu: 0, processed: 0, shipped: 0, done: 0, cancelled: 0,
    };

    const ordersBySource: Record<string, number> = {};
    const revenueBySource: Record<string, number> = {};
    const itemMap = new Map<string, { qty: number; revenue: number; cost: number }>();
    const customerMap = new Map<
      string,
      { name: string; phone: string; orderCount: number; totalSpent: number }
    >();
    const uniqueCustomerSet = new Set<string>();
    const dailyMap = new Map<
      string,
      { date: string; orders: number; revenue: number; paidRevenue: number; partialRevenue: number; unpaidRevenue: number; collectedRevenue: number }
    >();

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

      const paymentStatus = order.payment_status as PaymentStatus;
      if (paymentStatus === "paid") {
        paidRevenue += orderTotal;
        paidCount++;
      } else if (paymentStatus === "partial") {
        partialRevenue += orderTotal;
        partialCount++;
      } else {
        unpaidRevenue += orderTotal;
        unpaidCount++;
      }

      // Source tracking
      const source = order.source || "manual";
      ordersBySource[source] = (ordersBySource[source] || 0) + 1;
      revenueBySource[source] = (revenueBySource[source] || 0) + orderTotal;

      // Item aggregation
      const items = order.items as { name: string; price: number; qty: number }[] | null;
      if (items) {
        for (const item of items) {
          const key = item.name.toLowerCase();
          const existing = itemMap.get(key) || { qty: 0, revenue: 0, cost: 0 };
          existing.qty += item.qty;
          existing.revenue += item.price * item.qty;
          const unitCost = costMap.get(key);
          if (unitCost) {
            existing.cost += unitCost * item.qty;
          }
          itemMap.set(key, existing);
        }
      }

      // Customer aggregation — ranked by paid amount (actual cash received)
      const custKey = order.customer_phone || order.customer_name || "Unknown";
      const existing = customerMap.get(custKey) || {
        name: order.customer_name || custKey,
        phone: order.customer_phone || "",
        orderCount: 0,
        totalSpent: 0,
      };
      existing.orderCount++;
      existing.totalSpent += paidAmount;
      customerMap.set(custKey, existing);

      // Daily breakdown — convert UTC timestamp to MYT date
      const day = new Date(order.created_at).toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
      const dayData = dailyMap.get(day) || {
        date: day,
        orders: 0,
        revenue: 0,
        paidRevenue: 0,
        partialRevenue: 0,
        unpaidRevenue: 0,
        collectedRevenue: 0,
      };
      dayData.orders++;
      dayData.revenue += orderTotal;
      dayData.collectedRevenue += paidAmount;
      if (paymentStatus === "paid") {
        dayData.paidRevenue += orderTotal;
      } else if (paymentStatus === "partial") {
        dayData.partialRevenue += orderTotal;
      } else {
        dayData.unpaidRevenue += orderTotal;
      }
      dailyMap.set(day, dayData);
    }

    const activeOrderCount = ordersList.length - cancelledCount;

    // Wave 2: Piutang aging, new customers, stock alerts, late orders
    const nowMyt = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
    const todayStartIso = `${nowMyt}T00:00:00.000+08:00`;

    const [
      { data: allUnpaidOrders },
      { data: newCustData },
      { data: stockAlertData },
      { data: lateOrderData },
    ] = await Promise.all([
      supabase
        .from("orders")
        .select("created_at, total, paid_amount")
        .eq("user_id", user.id)
        .neq("status", "cancelled")
        .in("payment_status", ["unpaid", "partial"]),
      supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .gte("created_at", startDate)
        .lt("created_at", endDate),
      supabase
        .from("products")
        .select("name, stock")
        .eq("user_id", user.id)
        .eq("is_available", true)
        .gt("stock", 0)
        .lte("stock", 10)
        .order("stock", { ascending: true }),
      supabase
        .from("orders")
        .select("id, order_number, customer_name, delivery_date, total")
        .eq("user_id", user.id)
        .lt("delivery_date", todayStartIso)
        .in("status", ["new", "menunggu", "processed", "shipped"])
        .order("delivery_date", { ascending: true })
        .limit(10),
    ]);

    // Piutang aging buckets (all-time unpaid orders)
    const piutangAging = [
      { label: "0-7 days", count: 0, amount: 0 },
      { label: "8-14 days", count: 0, amount: 0 },
      { label: "15-30 days", count: 0, amount: 0 },
      { label: "> 30 days", count: 0, amount: 0 },
    ];
    const nowTs = Date.now();
    for (const o of allUnpaidOrders || []) {
      const ageDays = Math.floor((nowTs - new Date(o.created_at).getTime()) / 86400000);
      const remaining = (o.total || 0) - (o.paid_amount || 0);
      if (remaining <= 0) continue;
      if (ageDays <= 7) { piutangAging[0].count++; piutangAging[0].amount += remaining; }
      else if (ageDays <= 14) { piutangAging[1].count++; piutangAging[1].amount += remaining; }
      else if (ageDays <= 30) { piutangAging[2].count++; piutangAging[2].amount += remaining; }
      else { piutangAging[3].count++; piutangAging[3].amount += remaining; }
    }

    const newCustomerCount = (newCustData || []).length;
    const returningCustomerCount = Math.max(0, uniqueCustomerSet.size - newCustomerCount);

    // Derived metrics
    const piutang = totalRevenue - collectedRevenue;
    const aov = activeOrderCount > 0 ? Math.round(totalRevenue / activeOrderCount) : 0;
    const collectionRate = totalRevenue > 0 ? Math.round((collectedRevenue / totalRevenue) * 100) : 0;
    const doneCount = ordersByStatus.done || 0;
    const fulfillmentBase = activeOrderCount - (ordersByStatus.menunggu || 0);
    const fulfillmentRate = fulfillmentBase > 0 ? Math.round((doneCount / fulfillmentBase) * 100) : 0;
    const cancellationRate = ordersList.length > 0 ? Math.round((cancelledCount / ordersList.length) * 100) : 0;

    // Top items (top 10 by revenue, with cost/profit/margin)
    const topItems = Array.from(itemMap.entries())
      .map(([name, data]) => {
        const profit = data.cost > 0 ? data.revenue - data.cost : undefined;
        const margin = profit !== undefined && data.revenue > 0 ? Math.round((profit / data.revenue) * 100) : undefined;
        return {
          name: name.charAt(0).toUpperCase() + name.slice(1),
          qty: data.qty,
          revenue: data.revenue,
          cost: data.cost > 0 ? data.cost : undefined,
          profit,
          margin,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Top customers (top 10 by totalSpent=paid_amount)
    const topCustomers = Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Daily breakdown sorted by date
    const dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return NextResponse.json({
      totalOrders: activeOrderCount,
      totalRevenue,
      paidRevenue,
      partialRevenue,
      unpaidRevenue,
      collectedRevenue,
      piutang,
      aov,
      collectionRate,
      paidCount,
      partialCount,
      unpaidCount,
      cancelledCount,
      cancelledValue,
      ordersByStatus,
      ordersBySource,
      revenueBySource,
      totalDiscount,
      fulfillmentRate,
      cancellationRate,
      topItems,
      topCustomers,
      dailyBreakdown,
      piutangAging,
      newCustomerCount,
      returningCustomerCount,
      stockAlerts: (stockAlertData || []).map((p: { name: string; stock: number }) => ({
        name: p.name,
        stock: p.stock,
      })),
      lateOrders: (lateOrderData || []).map((o: { id: string; order_number: string; customer_name: string; delivery_date: string; total: number }) => ({
        id: o.id,
        orderNumber: o.order_number || "",
        customerName: o.customer_name || "-",
        deliveryDate: o.delivery_date,
        total: o.total || 0,
      })),
    });
  } catch (error) {
    console.error("Monthly recap API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
