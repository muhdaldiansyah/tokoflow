import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { createServiceClient } from "@/lib/supabase/server";

// GET - Get single receipt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user } = await getAuthenticatedClient(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get receipt API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update receipt
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user } = await getAuthenticatedClient(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    // Only allow certain fields to be updated
    if (body.items) {
      updates.items = body.items;
      // Recalculate totals
      updates.subtotal = body.items.reduce(
        (sum: number, item: { price: number; qty: number }) => sum + item.price * item.qty,
        0
      );
      updates.tax = 0;
      updates.total = updates.subtotal as number;
    }
    if (body.customer_name !== undefined) updates.customer_name = body.customer_name;
    if (body.customer_phone !== undefined) updates.customer_phone = body.customer_phone;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.payment_status !== undefined) updates.payment_status = body.payment_status;

    const { data, error } = await supabase
      .from("receipts")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to update receipt" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update receipt API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete receipt
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user } = await getAuthenticatedClient(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Soft delete — use service role to bypass RLS WITH CHECK constraint
    const serviceClient = await createServiceClient();
    const { error } = await serviceClient
      .from("receipts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete receipt" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete receipt API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
