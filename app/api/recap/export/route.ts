import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Get daily orders for Excel export
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const startOfDay = `${date}T00:00:00.000+07:00`;
    const endOfDay = `${date}T23:59:59.999+07:00`;

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    const statusLabels: Record<string, string> = {
      new: "Baru", processed: "Diproses", shipped: "Dikirim",
      done: "Selesai", cancelled: "Dibatalkan",
    };
    const paymentLabels: Record<string, string> = {
      paid: "Paid", partial: "Partial", unpaid: "Unpaid",
    };
    const sourceLabels: Record<string, string> = { manual: "Manual", order_link: "Link Toko", whatsapp: "WhatsApp", directory: "Direktori" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (orders || []).map((order: any) => {
      const items = order.items as { name: string; price: number; qty: number }[] | null;
      const itemSummary = items
        ? items.map((i: { name: string; qty: number }) => `${i.name} x${i.qty}`).join(", ")
        : "-";

      return {
        nomor_pesanan: order.order_number || "",
        pelanggan: order.customer_name || "-",
        telepon: order.customer_phone || "-",
        item: itemSummary,
        total: order.total || 0,
        dibayar: order.paid_amount || 0,
        sisa: (order.total || 0) - (order.paid_amount || 0),
        pengiriman: order.delivery_date
          ? new Date(order.delivery_date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })
          : "-",
        status: statusLabels[order.status] || order.status,
        pembayaran: paymentLabels[order.payment_status] || order.payment_status,
        sumber: sourceLabels[order.source] || order.source || "Manual",
      };
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Recap export API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
