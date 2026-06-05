import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { normalizePhone } from "@/lib/utils/phone";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      updates.name = name;
    }
    if (body.phone !== undefined) {
      if (!body.phone) {
        updates.phone = null;
      } else {
        const p = String(body.phone).trim();
        updates.phone = normalizePhone(p) || p;
      }
    }
    if (body.role !== undefined) {
      updates.role = body.role === "owner" ? "owner" : "assistant";
    }
    if (body.active !== undefined) {
      updates.active = !!body.active;
    }

    const { data, error } = await supabase
      .from("staff")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      console.error("Staff update error:", error);
      return NextResponse.json({ error: "Failed to update staff" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Staff update API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("staff")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Staff delete error:", error);
      return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Staff delete API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
