import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Get production data formatted for Excel export
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Fetch from production endpoint (reuse logic)
    const productionUrl = new URL(`/api/production?date=${date}`, request.url);
    const res = await fetch(productionUrl.toString(), {
      headers: Object.fromEntries(request.headers),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json(err, { status: res.status });
    }

    const summary = await res.json();
    if (!summary) {
      return NextResponse.json(null);
    }

    const paymentLabels: Record<string, string> = {
      paid: "Paid", partial: "Partial", unpaid: "Unpaid",
    };

    const items = (summary.items || []).map((item: { name: string; qty: number; orderCount: number }) => ({
      produk: item.name,
      jumlah: item.qty,
      dari_pesanan: item.orderCount,
    }));

    const orders = (summary.orders || []).map(
      (order: { customerName: string; customerPhone: string; items: { name: string; qty: number }[]; total: number; paidAmount: number; paymentStatus: string }, i: number) => ({
        no: i + 1,
        pelanggan: order.customerName,
        telepon: order.customerPhone || "-",
        item: order.items.map((it: { name: string; qty: number }) => `${it.name} x${it.qty}`).join(", "),
        total: order.total,
        dibayar: order.paidAmount,
        sisa: order.total - order.paidAmount,
        pembayaran: paymentLabels[order.paymentStatus] || order.paymentStatus,
      })
    );

    return NextResponse.json({ items, orders });
  } catch (error) {
    console.error("Production export API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
