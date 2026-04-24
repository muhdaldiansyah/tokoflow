import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import type { CreateInvoiceInput, PaymentTerms } from "@/features/invoices/types/invoice.types";
import {
  PAYMENT_TERMS_DAYS,
  SST_RATES_ALLOWED,
  MYINVOIS_INDIVIDUAL_THRESHOLD_MYR,
} from "@/features/invoices/types/invoice.types";
import { sanitizeSearch } from "@/lib/utils/sanitize";

// GET - List invoices with filters
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    let query = supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);

    if (search) {
      const s = sanitizeSearch(search);
      query = query.or(
        `invoice_number.ilike.%${s}%,buyer_name.ilike.%${s}%,buyer_phone.ilike.%${s}%`
      );
    }

    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lt("created_at", dateTo);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching invoices:", error);
      return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Invoices list API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create invoice
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateInvoiceInput = await request.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 });
    }

    // Fetch seller profile — pull both MY and legacy columns during the
    // compat window so snapshots are complete either way.
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "business_name, business_address, business_phone, tin, brn, sst_registration_id, default_sst_rate, npwp, nitku"
      )
      .eq("id", user.id)
      .single();

    // Generate invoice number
    const { data: invoiceNumber, error: rpcError } = await supabase.rpc(
      "generate_invoice_number",
      { p_user_id: user.id }
    );

    if (rpcError || !invoiceNumber) {
      console.error("Error generating invoice number:", rpcError);
      return NextResponse.json({ error: "Failed to generate invoice number" }, { status: 500 });
    }

    // Calculate totals — SST is applied after the invoice-level discount on the net base.
    const subtotal = body.items.reduce(
      (sum: number, item: { price: number; qty: number }) => sum + item.price * item.qty,
      0
    );
    const discount = body.discount || 0;
    const netBase = Math.max(0, subtotal - discount);

    // Resolve SST rate: request → profile default → 0.
    const requestedRate = body.sst_rate;
    const profileDefault = profile?.default_sst_rate;
    const sstRate = SST_RATES_ALLOWED.includes(requestedRate as 0 | 6)
      ? (requestedRate as 0 | 6)
      : SST_RATES_ALLOWED.includes(profileDefault as 0 | 6)
        ? (profileDefault as 0 | 6)
        : 0;
    const sstAmount = Math.round((netBase * sstRate) / 100);
    const total = netBase + sstAmount;

    // Calculate due_date from payment_terms
    const paymentTerms = body.payment_terms as PaymentTerms | undefined;
    let dueDate: string | null = null;

    if (paymentTerms) {
      const days = PAYMENT_TERMS_DAYS[paymentTerms];
      if (days !== null) {
        const due = new Date();
        due.setDate(due.getDate() + days);
        dueDate = due.toISOString();
      } else if (paymentTerms === "custom" && body.due_date) {
        dueDate = body.due_date;
      }
    }

    const invoiceStatus = body.status || "draft";
    const now = new Date().toISOString();

    const buyerTin = body.buyer_tin?.trim() || null;
    const buyerBrn = body.buyer_brn?.trim() || null;
    const buyerSstId = body.buyer_sst_id?.trim() || null;

    // LHDN mandates individual e-Invoice submission for any B2C invoice ≥ RM10,000.
    // B2B (buyer TIN known) always submits individually anyway, so the flag is
    // really an operational marker for walk-in sales.
    const requiresIndividualEInvoice =
      total >= MYINVOIS_INDIVIDUAL_THRESHOLD_MYR && !buyerTin;

    const { data, error } = await supabase
      .from("invoices")
      .insert({
        user_id: user.id,
        invoice_number: invoiceNumber,
        order_id: body.order_id || null,
        customer_id: body.customer_id || null,

        // Seller snapshot — MY primary
        seller_name: profile?.business_name || null,
        seller_address: profile?.business_address || null,
        seller_phone: profile?.business_phone || null,
        seller_tin: profile?.tin || null,
        seller_brn: profile?.brn || null,
        seller_sst_registration_id: profile?.sst_registration_id || null,
        // Seller snapshot — legacy mirror (dropped in a later migration)
        seller_npwp: profile?.npwp || profile?.tin || null,
        seller_nitku: profile?.nitku || null,

        // Buyer snapshot — MY primary
        buyer_name: body.buyer_name || null,
        buyer_address: body.buyer_address || null,
        buyer_phone: body.buyer_phone || null,
        buyer_tin: buyerTin,
        buyer_brn: buyerBrn,
        buyer_sst_id: buyerSstId,
        // Buyer snapshot — legacy mirror so PDF/WA keep rendering
        buyer_npwp: buyerTin,

        items: body.items,
        subtotal,
        discount,

        // MY primary tax
        sst_rate: sstRate,
        sst_amount: sstAmount,
        // Legacy mirror — same value under ppn_* until the column is dropped
        ppn_rate: sstRate,
        ppn_amount: sstAmount,

        total,

        paid_amount: 0,
        payment_status: "unpaid",
        due_date: dueDate,
        payment_terms: paymentTerms || null,
        notes: body.notes || null,

        requires_individual_einvoice: requiresIndividualEInvoice,

        status: invoiceStatus,
        sent_at: invoiceStatus === "sent" ? now : null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating invoice:", error);
      return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Create invoice API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
