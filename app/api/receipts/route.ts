import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - List receipts
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status"); // 'paid', 'unpaid', or null for all

    let query = supabase
      .from("receipts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("payment_status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching receipts:", error);
      return NextResponse.json({ error: "Failed to fetch receipts" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Receipts API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create receipt
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items, customer_name, customer_phone, notes, payment_status } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 });
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: { price: number; qty: number }) => sum + item.price * item.qty,
      0
    );
    const tax = 0; // No tax for V1
    const total = subtotal + tax;

    // Generate sequential receipt number (atomic — no collision)
    const { data: receiptNum, error: numError } = await supabase.rpc("generate_receipt_number", { p_user_id: user.id });
    if (numError || !receiptNum) {
      console.error("Error generating receipt number:", numError);
      return NextResponse.json({ error: "Failed to generate receipt number" }, { status: 500 });
    }
    const receipt_number = receiptNum as string;

    // Create receipt
    const { data, error } = await supabase
      .from("receipts")
      .insert({
        user_id: user.id,
        receipt_number,
        items,
        subtotal,
        tax,
        total,
        customer_name,
        customer_phone,
        notes,
        payment_status: payment_status || "paid",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating receipt:", error);
      return NextResponse.json({ error: "Failed to create receipt" }, { status: 500 });
    }

    // Increment receipt count
    await supabase.rpc("increment_receipts_used", { p_user_id: user.id });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Create receipt API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
