import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Get piutang breakdown by customer with aging
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: invoices } = await supabase
      .from("invoices")
      .select("buyer_name, buyer_phone, total, paid_amount, due_date, created_at, status")
      .eq("user_id", user.id)
      .neq("status", "cancelled")
      .neq("status", "draft");

    if (!invoices) {
      return NextResponse.json([]);
    }

    const now = new Date();
    const customerMap = new Map<string, {
      buyerName: string; buyerPhone: string; totalOutstanding: number; invoiceCount: number;
      aging: { current: number; week2: number; month: number; overMonth: number };
    }>();

    for (const inv of invoices) {
      const remaining = (inv.total || 0) - (inv.paid_amount || 0);
      if (remaining <= 0) continue;

      const key = inv.buyer_phone || inv.buyer_name || "unknown";
      const daysSinceCreated = Math.floor((now.getTime() - new Date(inv.created_at).getTime()) / (1000 * 60 * 60 * 24));

      const agingBucket = {
        current: daysSinceCreated <= 7 ? remaining : 0,
        week2: daysSinceCreated > 7 && daysSinceCreated <= 14 ? remaining : 0,
        month: daysSinceCreated > 14 && daysSinceCreated <= 30 ? remaining : 0,
        overMonth: daysSinceCreated > 30 ? remaining : 0,
      };

      const existing = customerMap.get(key);
      if (existing) {
        existing.totalOutstanding += remaining;
        existing.invoiceCount++;
        existing.aging.current += agingBucket.current;
        existing.aging.week2 += agingBucket.week2;
        existing.aging.month += agingBucket.month;
        existing.aging.overMonth += agingBucket.overMonth;
      } else {
        customerMap.set(key, {
          buyerName: inv.buyer_name || "Unnamed buyer",
          buyerPhone: inv.buyer_phone || "",
          totalOutstanding: remaining,
          invoiceCount: 1,
          aging: agingBucket,
        });
      }
    }

    const result = Array.from(customerMap.values()).sort((a, b) => b.totalOutstanding - a.totalOutstanding);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Piutang by customer API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
