import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { normalizePhone } from "@/lib/utils/phone";
import { sanitizeSearch } from "@/lib/utils/sanitize";

// GET - List customers
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let query = supabase
      .from("customers")
      .select(
        "id, user_id, name, phone, address, tin, brn, sst_registration_id, npwp, total_orders, total_spent, last_order_at, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .order("last_order_at", { ascending: false, nullsFirst: false });

    if (search) {
      const s = sanitizeSearch(search);
      query = query.or(
        `name.ilike.%${s}%,phone.ilike.%${s}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching customers:", error);
      return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("Customers API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create customer
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, address, notes, tin, brn, sst_registration_id } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const normalizedPhone = phone ? (normalizePhone(phone) || phone) : phone;

    const { data, error } = await supabase
      .from("customers")
      .insert({
        user_id: user.id,
        name,
        phone: normalizedPhone,
        ...(address && { address }),
        ...(notes && { notes }),
        ...(tin && { tin, npwp: tin }),
        ...(brn && { brn }),
        ...(sst_registration_id && { sst_registration_id }),
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Customer with this phone already exists" }, { status: 409 });
      }
      console.error("Error creating customer:", error);
      return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Create customer API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
