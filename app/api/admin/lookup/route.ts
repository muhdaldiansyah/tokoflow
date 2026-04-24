import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

const TABLES: Record<string, string> = {
  categories: "business_categories",
  units: "product_units",
  cities: "cities",
};

// Which profile/product columns reference each lookup table
const USAGE_CHECKS: Record<string, { table: string; column: string; label: string }[]> = {
  categories: [{ table: "profiles", column: "business_category", label: "toko" }],
  units: [{ table: "products", column: "unit", label: "produk" }],
  cities: [{ table: "profiles", column: "city_slug", label: "toko" }],
};

async function requireAdmin(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient(request);
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return null;
  return { supabase, user };
}

// POST — create new lookup item
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { type, ...item } = body;

  if (!type || !TABLES[type]) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  // Validate required fields
  if (type === "categories" && (!item.id || !item.label)) {
    return NextResponse.json({ error: "ID and Label are required" }, { status: 400 });
  }
  if (type === "units" && (!item.id || !item.label)) {
    return NextResponse.json({ error: "ID and Label are required" }, { status: 400 });
  }
  if (type === "cities" && (!item.name || !item.slug)) {
    return NextResponse.json({ error: "Name and Slug are required" }, { status: 400 });
  }

  // Sanitize ID — lowercase, no spaces
  if (item.id && typeof item.id === "string") {
    item.id = item.id.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (item.id.length < 2) {
      return NextResponse.json({ error: "ID must be at least 2 characters (lowercase, numbers, hyphens)" }, { status: 400 });
    }
  }

  const { data, error } = await auth.supabase
    .from(TABLES[type])
    .insert(item)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "ID sudah digunakan" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

// PUT — update lookup item (ID cannot be changed)
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { type, id, ...updates } = body;

  if (!type || !TABLES[type] || !id) {
    return NextResponse.json({ error: "Invalid type or id" }, { status: 400 });
  }

  // NEVER allow changing the ID — this would orphan all references
  delete updates.id;

  // Validate label is not empty
  if (updates.label !== undefined && !updates.label?.trim()) {
    return NextResponse.json({ error: "Label tidak boleh kosong" }, { status: 400 });
  }
  if (updates.name !== undefined && !updates.name?.trim()) {
    return NextResponse.json({ error: "Nama tidak boleh kosong" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from(TABLES[type])
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

// DELETE — soft delete (set is_active = false)
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !TABLES[type] || !id) {
    return NextResponse.json({ error: "Invalid type or id" }, { status: 400 });
  }

  // Check ALL tables that reference this lookup item
  const checks = USAGE_CHECKS[type] || [];
  for (const check of checks) {
    const { count } = await auth.supabase
      .from(check.table)
      .select("id", { count: "exact", head: true })
      .eq(check.column, id);
    if (count && count > 0) {
      return NextResponse.json({
        error: `Tidak bisa hapus — ${count} ${check.label} masih menggunakan "${id}"`,
      }, { status: 400 });
    }
  }

  const { error } = await auth.supabase
    .from(TABLES[type])
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
