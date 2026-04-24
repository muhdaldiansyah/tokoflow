import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { isValidSlug, isReservedSlug } from "@/lib/utils/slug";

// PUT - Update slug with uniqueness check
export async function PUT(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    if (!isValidSlug(slug)) {
      return NextResponse.json({ success: false, error: "Slug must be 3-50 characters, lowercase letters and numbers only" }, { status: 400 });
    }

    if (isReservedSlug(slug)) {
      return NextResponse.json({ success: false, error: "Slug ini tidak tersedia" }, { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ slug })
      .eq("id", user.id);

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: false, error: "Slug already taken" }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: "Gagal menyimpan" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update slug API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
