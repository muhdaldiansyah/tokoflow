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

    // Recalculate totals if items, discount, or delivery fee changed. Public
    // store-link orders already include delivery_fee in total; preserve it when
    // the merchant edits items/discount from the dashboard.
    const needsTotalRecalc =
      body.items !== undefined || body.discount !== undefined || body.delivery_fee !== undefined;

    let existingTotals: { subtotal: number | null; discount: number | null; delivery_fee: number | null } | null = null;
    if (needsTotalRecalc && (body.items === undefined || body.discount === undefined || body.delivery_fee === undefined)) {
      const { data: existing } = await supabase
        .from("orders")
        .select("subtotal, discount, delivery_fee")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      existingTotals = existing;
    }

    if (needsTotalRecalc) {
      const subtotal = body.items !== undefined
        ? body.items.reduce(
            (sum: number, item: { price: number; qty: number }) => sum + item.price * item.qty,
            0
          )
        : Number(existingTotals?.subtotal ?? 0);
      const discount = body.discount !== undefined
        ? Math.max(0, Number(body.discount) || 0)
        : Number(existingTotals?.discount ?? 0);
      const deliveryFee = body.delivery_fee !== undefined
        ? Math.max(0, Number(body.delivery_fee) || 0)
        : Number(existingTotals?.delivery_fee ?? 0);

      if (body.items !== undefined) {
        updates.items = body.items;
      }
      updates.subtotal = subtotal;
      updates.discount = discount;
      updates.delivery_fee = deliveryFee;
      updates.total = Math.max(0, subtotal - discount) + deliveryFee;

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

    if (body.delivery_zone !== undefined) {
      updates.delivery_zone =
        body.delivery_zone === "peninsular" || body.delivery_zone === "sabah_sarawak"
          ? body.delivery_zone
          : null;
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
    if (body.delivery_address !== undefined) updates.delivery_address = body.delivery_address?.trim() || null;

    // Derive payment status if paid_amount is being set.
    // Also capture old paid_amount so we can log the change after saving.
    let oldPaidAmount: number | undefined;
    if (body.paid_amount !== undefined) {
      updates.paid_amount = body.paid_amount;
      const { data: currentForPayment } = await supabase
        .from("orders")
        .select("total, paid_amount")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      const effectiveTotal = (updates.total as number | undefined) ?? currentForPayment?.total ?? 0;
      oldPaidAmount = currentForPayment?.paid_amount ?? 0;
      updates.payment_status = derivePaymentStatus(body.paid_amount, effectiveTotal);
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

    let stockSyncedOrder: Record<string, unknown> | null = null;
    if (body.items !== undefined) {
      const serviceClient = await createServiceClient();
      const { data: synced, error: stockError } = await serviceClient.rpc("update_order_items_and_sync_stock", {
        p_user_id: user.id,
        p_order_id: id,
        p_items: updates.items,
        p_subtotal: updates.subtotal,
        p_discount: updates.discount,
        p_delivery_fee: updates.delivery_fee,
        p_total: updates.total,
        p_unique_code: updates.unique_code ?? null,
      });

      if (stockError || !synced) {
        console.error("Error syncing order item stock:", stockError);
        const isInsufficient = stockError?.message?.includes("insufficient_stock");
        return NextResponse.json(
          { error: isInsufficient ? "Insufficient stock for one or more items" : "Failed to update order stock" },
          { status: isInsufficient ? 409 : 500 }
        );
      }

      stockSyncedOrder = synced as Record<string, unknown>;
      delete updates.items;
      delete updates.subtotal;
      delete updates.discount;
      delete updates.delivery_fee;
      delete updates.total;
      delete updates.unique_code;
    }

    let data: Record<string, unknown> | null = stockSyncedOrder;
    let error: unknown = null;
    if (Object.keys(updates).length > 0) {
      const updateResult = await supabase
        .from("orders")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();
      data = updateResult.data as Record<string, unknown> | null;
      error = updateResult.error;
    } else if (!data) {
      const fetchResult = await supabase
        .from("orders")
        .select()
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      data = fetchResult.data as Record<string, unknown> | null;
      error = fetchResult.error;
    }

    if (error || !data) {
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }

    // Customer stats auto-updated by database trigger (055_fix_trigger_and_stock)

    // Fire-and-forget payment log when paid_amount actually changed
    if (body.paid_amount !== undefined && oldPaidAmount !== undefined && data.paid_amount !== oldPaidAmount) {
      const paymentKey = data.payment_status === "paid" ? "payment_paid"
        : data.payment_status === "partial" ? "payment_partial"
        : "payment_unpaid";
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_name")
        .eq("id", user.id)
        .single();
      supabase
        .from("order_status_logs")
        .insert({
          order_id: id,
          from_status: null,
          to_status: paymentKey,
          changed_by: user.id,
          changed_by_name: profile?.business_name ?? null,
        })
        .then(() => {});

      // Financial ledger — record the manual payment delta
      const delta = (Number(data.paid_amount) || 0) - (Number(oldPaidAmount) || 0);
      if (delta !== 0) {
        const svc = await createServiceClient();
        svc.from("financial_ledger_entries").insert({
          user_id: user.id,
          customer_id: (data.customer_id as string) ?? null,
          order_id: id,
          entry_type: delta > 0 ? "payment_received" : "payment_adjusted",
          amount_delta: delta,
          cash_delta: delta,
          currency: "MYR",
          payment_method: "manual",
          actor_type: "merchant",
          actor_id: user.id,
          source_table: "orders",
          source_id: id,
          idempotency_key: `manual_payment:${id}:${Date.now()}`,
          reason: `Manual payment update: RM ${oldPaidAmount} → RM ${data.paid_amount}`,
        }).then(() => {});
      }
    }

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

    // Use service role to bypass RLS WITH CHECK constraint and release stock
    // reservations atomically through the service-only RPC.
    const serviceClient = await createServiceClient();
    const { error } = await serviceClient.rpc("soft_delete_order_and_release_stock", {
      p_user_id: user.id,
      p_order_id: id,
      p_deleted_at: new Date().toISOString(),
    });

    if (error) {
      if (error.message?.includes("order_not_found")) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
    }

    // Customer stats auto-updated by trigger (055_fix_trigger_and_stock)

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete order API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
