import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Check if user can create more orders
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("check_order_limit", { p_user_id: user.id });

    if (error) {
      console.error("Error checking order limit:", error);
      return NextResponse.json({ error: "Failed to check limit" }, { status: 500 });
    }

    return NextResponse.json({ allowed: data === true }, {
      headers: { "Cache-Control": "private, s-maxage=10, stale-while-revalidate=30" },
    });
  } catch (error) {
    console.error("Check limit API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
