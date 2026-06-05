import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

interface PiutangRow {
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  total_debt: number | string | null;
  order_count: number | string | null;
}

// GET - Get accounts receivable (piutang) summary
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("get_piutang_summary", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("Error fetching piutang:", error);
      return NextResponse.json({ error: "Failed to fetch piutang" }, { status: 500 });
    }

    const customers = ((data || []) as PiutangRow[]).map((row) => ({
      customer_id: row.customer_id || "",
      customer_name: row.customer_name || "Tanpa nama",
      customer_phone: row.customer_phone || "",
      total_debt: Number(row.total_debt) || 0,
      order_count: Number(row.order_count) || 0,
    }));
    const totalDebt = customers.reduce((sum, customer) => sum + customer.total_debt, 0);

    return NextResponse.json({
      totalDebt,
      customerCount: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Piutang API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
