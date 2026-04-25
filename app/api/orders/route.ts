import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { derivePaymentStatus } from "@/features/orders/types/order.types";
import { normalizePhone } from "@/lib/utils/phone";
import { sanitizeSearch } from "@/lib/utils/sanitize";
import { generateUniqueCode } from "@/lib/utils/unique-code";
import { creditReferralSignupBonus } from "@/lib/services/referral-bonus.service";

// GET - List orders with full filter support
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
    const paymentStatus = searchParams.get("paymentStatus");
    const customerId = searchParams.get("customerId");
    const search = searchParams.get("search");
    const activeOnly = searchParams.get("activeOnly") === "true";
    const historyOnly = searchParams.get("historyOnly") === "true";
    const preorderOnly = searchParams.get("preorderOnly") === "true";
    const dineInOnly = searchParams.get("dineInOnly") === "true";
    const langgananOnly = searchParams.get("langgananOnly") === "true";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const dateField = searchParams.get("dateField") || "created_at";

    let query = supabase
      .from("orders")
      .select("id, user_id, order_number, customer_id, customer_name, customer_phone, items, subtotal, discount, total, unique_code, transfer_amount, paid_amount, notes, source, status, payment_status, delivery_date, is_preorder, is_dine_in, is_langganan, is_booking, booking_time, table_number, payment_claimed_at, image_urls, referral_source, assigned_staff_id, assigned_at, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (paymentStatus) query = query.eq("payment_status", paymentStatus);
    if (customerId) query = query.eq("customer_id", customerId);

    if (search) {
      const s = sanitizeSearch(search);
      const numericSearch = s.replace(/[.,\s]/g, "");
      if (/^\d{4,}$/.test(numericSearch)) {
        // Numeric input (4+ digits) → search by transfer amount
        query = query.eq("transfer_amount", parseInt(numericSearch));
      } else {
        query = query.or(
          `order_number.ilike.%${s}%,customer_name.ilike.%${s}%,customer_phone.ilike.%${s}%`
        );
      }
    }

    if (preorderOnly) query = query.eq("is_preorder", true);
    if (dineInOnly) query = query.eq("is_dine_in", true);
    if (langgananOnly) query = query.eq("is_langganan", true);

    if (dateFrom) query = query.gte(dateField, dateFrom);
    if (dateTo) query = query.lt(dateField, dateTo);

    if (activeOnly) {
      query = query.not("status", "in", '("done","cancelled")');
    } else if (historyOnly) {
      query = query.in("status", ["done", "cancelled"]);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching orders:", error);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Orders API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create order with full field support
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      items, customer_name, customer_phone, notes, discount,
      source, payment_status, paid_amount,
      delivery_date, is_preorder, is_dine_in, is_langganan, is_booking,
      table_number, booking_time, image_urls,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 });
    }

    // Validate individual items
    for (const item of items) {
      if (!item.name || typeof item.name !== "string" || item.name.trim().length === 0) {
        return NextResponse.json({ error: "Item name is required" }, { status: 400 });
      }
      if (typeof item.price !== "number" || item.price < 0) {
        return NextResponse.json({ error: "Item price must be >= 0" }, { status: 400 });
      }
      if (typeof item.qty !== "number" || item.qty < 1) {
        return NextResponse.json({ error: "Item qty must be >= 1" }, { status: 400 });
      }
    }

    // L6: At least one item must have price > 0 (prevent zero-total orders from AI parse)
    if (!items.some((item: { price: number }) => item.price > 0)) {
      return NextResponse.json({ error: "At least one item must have a price" }, { status: 400 });
    }

    // Server-side quota enforcement
    const { data: hasQuota } = await supabase.rpc("check_order_limit", { p_user_id: user.id });
    if (hasQuota === false) {
      return NextResponse.json({ error: "Order quota exceeded", code: "QUOTA_EXCEEDED" }, { status: 402 });
    }

    // L8: Reject delivery dates more than 1 day in the past (typo protection)
    if (delivery_date) {
      const deliveryTime = new Date(delivery_date).getTime();
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      if (deliveryTime < yesterday) {
        return NextResponse.json({ error: "Delivery date cannot be in the past" }, { status: 400 });
      }
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: { price: number; qty: number }) => sum + item.price * item.qty,
      0
    );
    const discountAmount = discount || 0;
    const total = Math.max(0, subtotal - discountAmount);

    // Generate sequential order number (atomic — no collision)
    const { data: order_number, error: numError } = await supabase.rpc("generate_order_number", { p_user_id: user.id });
    if (numError || !order_number) {
      console.error("Error generating order number:", numError);
      return NextResponse.json({ error: "Failed to generate order number" }, { status: 500 });
    }

    // Find or create customer: match by phone first, then by name (case-insensitive)
    let customer_id: string | undefined;
    const normalizedPhone = normalizePhone(customer_phone);
    const trimmedName = customer_name?.trim();

    if (normalizedPhone) {
      // 1. Try match by phone
      const { data: byPhone } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .eq("phone", normalizedPhone)
        .maybeSingle();

      if (byPhone) {
        customer_id = byPhone.id;
        // Update name if it was empty before
        if (trimmedName) {
          await supabase.from("customers").update({ name: trimmedName }).eq("id", byPhone.id).is("name", null);
        }
      } else {
        const { data: newCustomer } = await supabase
          .from("customers")
          .insert({ user_id: user.id, name: trimmedName || normalizedPhone, phone: normalizedPhone })
          .select("id")
          .single();
        customer_id = newCustomer?.id;
      }
    } else if (trimmedName) {
      // 2. No phone — match by name (case-insensitive)
      const { data: byName } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .ilike("name", trimmedName)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (byName) {
        customer_id = byName.id;
      } else {
        const { data: newCustomer } = await supabase
          .from("customers")
          .insert({ user_id: user.id, name: trimmedName })
          .select("id")
          .single();
        customer_id = newCustomer?.id;
      }
    }

    // Derive paid_amount and payment_status
    const resolvedPaidAmount = paid_amount ?? (payment_status === "paid" ? total : 0);
    const resolvedPaymentStatus = derivePaymentStatus(resolvedPaidAmount, total);

    // Generate unique code for transfer amount matching
    let unique_code: number | null = null;
    if (total > 0) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: existing } = await supabase
        .from("orders")
        .select("unique_code")
        .eq("user_id", user.id)
        .eq("total", total)
        .gte("created_at", todayStart.toISOString())
        .not("unique_code", "is", null);
      unique_code = generateUniqueCode((existing || []).map((r: { unique_code: number }) => r.unique_code));
    }

    // Create order
    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        order_number,
        customer_id,
        customer_name,
        customer_phone: normalizedPhone || customer_phone,
        items,
        subtotal,
        discount: discountAmount,
        total,
        unique_code,
        paid_amount: resolvedPaidAmount,
        notes,
        delivery_date: delivery_date || null,
        is_preorder: is_preorder || false,
        is_dine_in: is_dine_in || false,
        is_langganan: is_langganan || false,
        is_booking: is_booking || false,
        booking_time: booking_time || null,
        table_number: table_number || null,
        image_urls: image_urls || [],
        source: source || "manual",
        payment_status: resolvedPaymentStatus,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating order:", error);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // Increment order count
    await supabase.rpc("increment_orders_used", { p_user_id: user.id });

    // Referral signup bonus — credit referrer RM 2 on first order (best-effort)
    creditReferralSignupBonus(user.id);

    // Customer stats auto-updated by database trigger (053_customer_stats_trigger)

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Create order API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
