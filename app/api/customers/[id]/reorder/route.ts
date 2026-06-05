import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

/**
 * Repeat-order shortcut endpoint.
 *
 * GET /api/customers/[id]/reorder
 *
 * Returns the items + customer info from the customer's most recent
 * non-cancelled order, formatted for prefill into /orders/new via querystring.
 *
 * Inheritance from synthesis §3.1 — Klaviyo customer-ownership mechanic
 * applied to F&B SMB context. The merchant is the relationship holder; we
 * just shave the friction of recreating a known order.
 *
 * Response shape:
 *   {
 *     ok: true,
 *     redirect: "/orders/new?nama=...&hp=...&items=..." (URL-ready)
 *   }
 *   OR
 *   { ok: false, error: "No prior orders" }
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedClient(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Fetch customer (RLS scopes to user)
  const { data: customer, error: custErr } = await supabase
    .from("customers")
    .select("id, name, phone")
    .eq("id", id)
    .single();

  if (custErr || !customer) {
    return NextResponse.json(
      { ok: false, error: "Customer not found" },
      { status: 404 },
    );
  }

  // Fetch most recent non-cancelled order for this customer
  const { data: orders } = await supabase
    .from("orders")
    .select("id, items, created_at, order_number")
    .eq("customer_id", customer.id)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(1);

  const lastOrder = orders?.[0];

  if (!lastOrder || !Array.isArray(lastOrder.items) || lastOrder.items.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No prior orders to repeat" },
      { status: 404 },
    );
  }

  // Cap at 30 items to keep URL under typical 2KB browser limit.
  // 30 items × avg 60 chars/item ≈ 1.8KB JSON, leaving headroom for nama+hp+from params.
  const cleanedItems = (lastOrder.items as Array<{
    name?: string;
    qty?: number;
    price?: number;
  }>)
    .filter((it) => it && typeof it.name === "string" && typeof it.qty === "number" && it.qty > 0)
    .slice(0, 30)
    .map((it) => ({
      name: String(it.name).slice(0, 80),
      qty: Math.max(1, Math.round(it.qty as number)),
      price: Math.max(0, Math.round(it.price ?? 0)),
    }));

  if (cleanedItems.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Last order has no valid items" },
      { status: 422 },
    );
  }

  const params2 = new URLSearchParams();
  params2.set("nama", customer.name);
  if (customer.phone) params2.set("hp", customer.phone);
  params2.set("items", JSON.stringify(cleanedItems));
  params2.set("from", "reorder");

  const redirect = `/orders/new?${params2.toString()}`;

  return NextResponse.json({
    ok: true,
    redirect,
    sourceOrder: {
      id: lastOrder.id,
      order_number: lastOrder.order_number,
      created_at: lastOrder.created_at,
      items_count: cleanedItems.length,
    },
  });
}
