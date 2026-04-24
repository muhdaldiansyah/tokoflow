import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Get monthly orders for Excel export
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || "1");
    const year = parseInt(searchParams.get("year") || "2026");

    const startDate = `${year}-${String(month).padStart(2, "0")}-01T00:00:00.000+07:00`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01T00:00:00.000+07:00`;

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startDate)
      .lt("created_at", endDate)
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
        tanggal: new Date(order.created_at).toLocaleDateString("en-MY", { timeZone: "Asia/Jakarta" }),
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
    console.error("Monthly export API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
