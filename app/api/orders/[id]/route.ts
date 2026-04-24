import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { createServiceClient } from "@/lib/supabase/server";
import { derivePaymentStatus } from "@/features/orders/types/order.types";
import { normalizePhone } from "@/lib/utils/phone";
import { generateUniqueCode } from "@/lib/utils/unique-code";

// GET - Get single order
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
      .from("orders")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get order API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update order with customer upsert + stats
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

    // Recalculate totals if items changed
    if (body.items) {
      updates.items = body.items;
      updates.subtotal = body.items.reduce(
        (sum: number, item: { price: number; qty: number }) => sum + item.price * item.qty,
        0
      );
      const discount = body.discount !== undefined ? body.discount : 0;
      updates.discount = discount;
      updates.total = Math.max(0, (updates.subtotal as number) - discount);

      // Regenerate unique code when total changes
      const newTotal = updates.total as number;
      if (newTotal > 0) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { data: existing } = await supabase
          .from("orders")
          .select("unique_code")
          .eq("user_id", user.id)
          .eq("total", newTotal)
          .gte("created_at", todayStart.toISOString())
          .not("unique_code", "is", null)
          .neq("id", id);
        updates.unique_code = generateUniqueCode((existing || []).map((r: { unique_code: number }) => r.unique_code));
      } else {
        updates.unique_code = null;
      }
    }

    if (body.customer_name !== undefined) updates.customer_name = body.customer_name;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.delivery_date !== undefined) updates.delivery_date = body.delivery_date;
    if (body.is_preorder !== undefined) updates.is_preorder = body.is_preorder;
    if (body.is_dine_in !== undefined) updates.is_dine_in = body.is_dine_in;
    if (body.is_langganan !== undefined) updates.is_langganan = body.is_langganan;
    if (body.is_booking !== undefined) updates.is_booking = body.is_booking;
    if (body.booking_time !== undefined) updates.booking_time = body.booking_time;
    if (body.table_number !== undefined) updates.table_number = body.table_number;
    if (body.image_urls !== undefined) updates.image_urls = body.image_urls;
    if (body.proof_url !== undefined) updates.proof_url = body.proof_url;

    // Derive payment status if paid_amount is being set
    if (body.paid_amount !== undefined) {
      updates.paid_amount = body.paid_amount;
      let total = updates.total as number | undefined;
      if (total === undefined) {
        const { data: existing } = await supabase
          .from("orders")
          .select("total")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();
        total = existing?.total ?? 0;
      }
      updates.payment_status = derivePaymentStatus(body.paid_amount, total ?? 0);
    } else if (body.payment_status !== undefined) {
      updates.payment_status = body.payment_status;
    }

    // Capture old customer_id for stats cleanup if customer changes
    let oldCustomerId: string | undefined;
    const normalizedPhone = body.customer_phone ? (normalizePhone(body.customer_phone) || body.customer_phone) : undefined;
    if (normalizedPhone) {
      updates.customer_phone = normalizedPhone;

      const { data: oldOrder } = await supabase
        .from("orders")
        .select("customer_id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      oldCustomerId = oldOrder?.customer_id ?? undefined;

      // Upsert customer
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .eq("phone", normalizedPhone)
        .maybeSingle();

      if (existingCustomer) {
        updates.customer_id = existingCustomer.id;
      } else {
        const { data: newCustomer } = await supabase
          .from("customers")
          .insert({
            user_id: user.id,
            name: body.customer_name || normalizedPhone,
            phone: normalizedPhone,
          })
          .select("id")
          .single();
        if (newCustomer) updates.customer_id = newCustomer.id;
      }
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }

    // Customer stats auto-updated by database trigger (055_fix_trigger_and_stock)

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update order API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Soft delete order
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

    // Use service role to bypass RLS WITH CHECK constraint
    const serviceClient = await createServiceClient();
    const { error } = await serviceClient
      .from("orders")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
    }

    // Decrement orders_used quota
    await serviceClient.rpc("decrement_orders_used", { p_user_id: user.id });

    // Customer stats auto-updated by trigger (055_fix_trigger_and_stock)

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete order API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
