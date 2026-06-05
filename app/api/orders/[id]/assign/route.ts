import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

/**
 * PATCH /api/orders/:id/assign
 * Body: { staff_id: string | null }
 *
 * Assigns an order to a staff member (or clears the assignment).
 * Scoped to the owner via the orders.user_id = auth.uid() match.
 */
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
    const staffId: string | null = body.staff_id ?? null;

    if (staffId) {
      // Validate that the staff belongs to this owner before assigning.
      const { data: staffRow } = await supabase
        .from("staff")
        .select("id, active")
        .eq("id", staffId)
        .eq("user_id", user.id)
        .single();
      if (!staffRow) {
        return NextResponse.json({ error: "Staff not found" }, { status: 404 });
      }
      if (!staffRow.active) {
        return NextResponse.json({ error: "Staff is inactive" }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from("orders")
      .update({
        assigned_staff_id: staffId,
        assigned_at: staffId ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to assign order" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Order assign API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
