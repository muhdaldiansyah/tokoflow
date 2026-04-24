import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// POST - Prefill invoice data from an order
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch customer details if linked — pull MY tax identity (tin/brn/sst) and
    // fall back to legacy npwp for pre-migration rows.
    let buyerAddress: string | null = null;
    let buyerTin: string | null = null;
    let buyerBrn: string | null = null;
    let buyerSstId: string | null = null;

    if (order.customer_id) {
      const { data: customer } = await supabase
        .from("customers")
        .select("address, tin, brn, sst_registration_id, npwp")
        .eq("id", order.customer_id)
        .single();

      if (customer) {
        buyerAddress = customer.address || null;
        buyerTin = customer.tin || customer.npwp || null;
        buyerBrn = customer.brn || null;
        buyerSstId = customer.sst_registration_id || null;
      }
    }

    // Return CreateInvoiceInput-shaped prefill object
    const prefill = {
      order_id: order.id,
      customer_id: order.customer_id || undefined,
      buyer_name: order.customer_name || undefined,
      buyer_address: buyerAddress || undefined,
      buyer_phone: order.customer_phone || undefined,
      buyer_tin: buyerTin || undefined,
      buyer_brn: buyerBrn || undefined,
      buyer_sst_id: buyerSstId || undefined,
      items: order.items || [],
      discount: order.discount || 0,
    };

    return NextResponse.json(prefill);
  } catch (error) {
    console.error("Invoice from order API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
