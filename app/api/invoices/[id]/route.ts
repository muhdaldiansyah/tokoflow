import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { derivePaymentStatus } from "@/features/orders/types/order.types";
import {
  SST_RATES_ALLOWED,
  MYINVOIS_INDIVIDUAL_THRESHOLD_MYR,
} from "@/features/invoices/types/invoice.types";

// GET - Get single invoice
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
      .from("invoices")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get invoice API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update invoice
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

    // Existing state is needed whenever items or the SST rate change so that
    // totals (and the "requires individual e-invoice" flag) stay coherent.
    let existingTotal: number | undefined;
    let existingSubtotal: number | undefined;
    let existingDiscount: number | undefined;
    let existingSstRate: number | undefined;

    const needsRecompute = body.items !== undefined
      || body.discount !== undefined
      || body.sst_rate !== undefined;

    if (needsRecompute) {
      const { data: existing } = await supabase
        .from("invoices")
        .select("subtotal, discount, sst_rate, ppn_rate, total")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      existingTotal = existing?.total ?? undefined;
      existingSubtotal = existing?.subtotal ?? undefined;
      existingDiscount = existing?.discount ?? undefined;
      existingSstRate = existing?.sst_rate ?? existing?.ppn_rate ?? undefined;
    }

    if (needsRecompute) {
      const items = body.items as { price: number; qty: number }[] | undefined;
      const subtotal = items
        ? items.reduce((sum, item) => sum + item.price * item.qty, 0)
        : existingSubtotal ?? 0;
      const discount = body.discount !== undefined
        ? body.discount
        : existingDiscount ?? 0;
      const requestedRate = body.sst_rate !== undefined ? body.sst_rate : existingSstRate ?? 0;
      const sstRate = SST_RATES_ALLOWED.includes(requestedRate as 0 | 6)
        ? (requestedRate as 0 | 6)
        : 0;
      const netBase = Math.max(0, subtotal - discount);
      const sstAmount = Math.round((netBase * sstRate) / 100);
      const total = netBase + sstAmount;

      if (items) updates.items = items;
      updates.subtotal = subtotal;
      updates.discount = discount;
      updates.sst_rate = sstRate;
      updates.sst_amount = sstAmount;
      // Mirror to legacy columns during the compat window.
      updates.ppn_rate = sstRate;
      updates.ppn_amount = sstAmount;
      updates.total = total;
    }

    if (body.order_id !== undefined) updates.order_id = body.order_id;
    if (body.customer_id !== undefined) updates.customer_id = body.customer_id;
    if (body.buyer_name !== undefined) updates.buyer_name = body.buyer_name;
    if (body.buyer_address !== undefined) updates.buyer_address = body.buyer_address;
    if (body.buyer_phone !== undefined) updates.buyer_phone = body.buyer_phone;

    // MY buyer tax identity — mirror buyer_tin to legacy buyer_npwp during compat.
    if (body.buyer_tin !== undefined) {
      const tin = body.buyer_tin ? String(body.buyer_tin).trim() || null : null;
      updates.buyer_tin = tin;
      updates.buyer_npwp = tin;
    }
    if (body.buyer_brn !== undefined) {
      updates.buyer_brn = body.buyer_brn ? String(body.buyer_brn).trim() || null : null;
    }
    if (body.buyer_sst_id !== undefined) {
      updates.buyer_sst_id = body.buyer_sst_id ? String(body.buyer_sst_id).trim() || null : null;
    }

    if (body.seller_name !== undefined) updates.seller_name = body.seller_name;
    if (body.seller_address !== undefined) updates.seller_address = body.seller_address;
    if (body.seller_phone !== undefined) updates.seller_phone = body.seller_phone;
    if (body.seller_tin !== undefined) updates.seller_tin = body.seller_tin;
    if (body.seller_brn !== undefined) updates.seller_brn = body.seller_brn;
    if (body.seller_sst_registration_id !== undefined) {
      updates.seller_sst_registration_id = body.seller_sst_registration_id;
    }

    if (body.due_date !== undefined) updates.due_date = body.due_date;
    if (body.payment_terms !== undefined) updates.payment_terms = body.payment_terms;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.status !== undefined) updates.status = body.status;

    // Refresh the individual-einvoice flag whenever total or buyer TIN changed.
    if (needsRecompute || body.buyer_tin !== undefined) {
      const effectiveTotal = (updates.total as number | undefined) ?? existingTotal ?? 0;
      const effectiveBuyerTin = (updates.buyer_tin as string | null | undefined)
        ?? null;
      updates.requires_individual_einvoice =
        effectiveTotal >= MYINVOIS_INDIVIDUAL_THRESHOLD_MYR && !effectiveBuyerTin;
    }

    // Derive payment status if paid_amount changed
    if (body.paid_amount !== undefined) {
      updates.paid_amount = body.paid_amount;
      let total = updates.total as number | undefined;
      if (total === undefined) {
        total = existingTotal;
        if (total === undefined) {
          const { data: existing } = await supabase
            .from("invoices")
            .select("total")
            .eq("id", id)
            .eq("user_id", user.id)
            .single();
          total = existing?.total ?? 0;
        }
      }
      updates.payment_status = derivePaymentStatus(body.paid_amount, total ?? 0);
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("invoices")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update invoice API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete draft invoice only
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check status first — only drafts can be deleted
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select("status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft invoices can be deleted" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete invoice API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
