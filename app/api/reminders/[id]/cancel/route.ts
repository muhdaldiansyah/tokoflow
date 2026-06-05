import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// PATCH - Cancel a single reminder
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("reminders")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to cancel reminder" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel reminder API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
