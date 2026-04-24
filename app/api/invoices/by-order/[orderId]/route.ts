import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Find invoice by order_id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("order_id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching invoice by order:", error);
      return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Invoice by order API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
