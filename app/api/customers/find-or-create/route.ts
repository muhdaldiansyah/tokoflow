import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { normalizePhone } from "@/lib/utils/phone";

// POST - Find existing customer by phone or create new one
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { phone, name } = body;

    if (!phone) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }

    const normalized = normalizePhone(phone) || phone;

    // Try to find existing customer
    const { data: existing } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", user.id)
      .eq("phone", normalized)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(existing);
    }

    // Create new customer
    const { data, error } = await supabase
      .from("customers")
      .insert({
        user_id: user.id,
        name: name || normalized,
        phone: normalized,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating customer:", error);
      return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Find or create customer API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
