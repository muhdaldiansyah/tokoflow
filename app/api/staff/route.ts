import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { normalizePhone } from "@/lib/utils/phone";

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Staff list error:", error);
      return NextResponse.json({ error: "Failed to load staff" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("Staff list API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const role = body.role === "owner" ? "owner" : "assistant";
    const phone = body.phone ? normalizePhone(String(body.phone)) || String(body.phone).trim() : null;

    const { data, error } = await supabase
      .from("staff")
      .insert({
        user_id: user.id,
        name,
        phone: phone || null,
        role,
        active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A staff member with this phone already exists" },
          { status: 409 },
        );
      }
      console.error("Staff create error:", error);
      return NextResponse.json({ error: "Failed to create staff" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("Staff create API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
