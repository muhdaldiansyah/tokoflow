import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Get production list (items to prepare) for a delivery date
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    if (!dateStr) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const startOfDay = `${dateStr}T00:00:00.000+07:00`;
    const endOfDay = `${dateStr}T23:59:59.999+07:00`;

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .not("delivery_date", "is", null)
      .gte("delivery_date", startOfDay)
      .lte("delivery_date", endOfDay)
      .neq("status", "cancelled")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch production data" }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json(null);
    }

    // Aggregate items across all orders (case-insensitive)
    const itemMap = new Map<string, { qty: number; orderIds: Set<string> }>();
    let totalItemCount = 0;
    let paidCount = 0, partialCount = 0, unpaidCount = 0;
    let paidRevenue = 0, collectedRevenue = 0, totalRevenue = 0;

    const productionOrders = [];

    for (const order of orders) {
      const orderTotal = order.total || 0;
      const paidAmount = order.paid_amount || 0;
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
          existing.orderIds.add(order.id);
          itemMap.set(key, existing);
          totalItemCount += item.qty;
          orderItems.push({ name: item.name, qty: item.qty });
        }
      }

      productionOrders.push({
        orderNumber: order.order_number || "",
        customerName: order.customer_name || "-",
        customerPhone: order.customer_phone || "",
        items: orderItems,
        total: orderTotal,
        paidAmount,
        paymentStatus: order.payment_status || "unpaid",
      });
    }

    const productionItems = Array.from(itemMap.entries())
      .map(([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        qty: data.qty,
        orderCount: data.orderIds.size,
      }))
      .sort((a, b) => b.qty - a.qty);

    return NextResponse.json({
      date: dateStr,
      totalOrders: orders.length,
      totalItems: totalItemCount,
      items: productionItems,
      orders: productionOrders,
      paidCount, partialCount, unpaidCount,
      paidRevenue, collectedRevenue, totalRevenue,
    });
  } catch (error) {
    console.error("Production API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
