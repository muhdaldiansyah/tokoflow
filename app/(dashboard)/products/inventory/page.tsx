import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { InventoryClientWrapper } from "@/features/products/components/InventoryClientWrapper";
import type { Product } from "@/features/products/types/product.types";

interface ProductSaleRow {
  name: string | null;
  qty: number | string | null;
}

// v2 — with per-product history
export default async function InventoryPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [productsResult, salesResult, profileResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, user_id, name, price, sort_order, image_url, description, category, is_available, stock, unit, min_order_qty, cost_price, created_at")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.rpc("get_product_sales", { p_user_id: user.id }),
    supabase.from("profiles").select("business_name").eq("id", user.id).single(),
  ]);

  const sales: Record<string, number> = {};
  for (const row of (salesResult.data || []) as ProductSaleRow[]) {
    if (!row.name) continue;
    sales[row.name] = Number(row.qty) || 0;
  }

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <InventoryClientWrapper
        initialProducts={(productsResult.data || []) as Product[]}
        initialSales={sales}
        businessName={profileResult.data?.business_name ?? undefined}
      />
    </div>
  );
}
