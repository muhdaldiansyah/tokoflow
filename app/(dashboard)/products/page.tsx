import { redirect } from "next/navigation";
import { ProductList } from "@/features/products/components/ProductList";
import { createClient, getUser } from "@/lib/supabase/server";
import type { Product } from "@/features/products/types/product.types";

const PRODUCT_LIST_SELECT =
  "id, user_id, name, price, sort_order, image_url, description, category, is_available, stock, unit, min_order_qty, cost_price, created_at";

interface ProductSaleRow {
  name: string | null;
  qty: number | string | null;
}

export default async function ProductsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [productsResult, salesResult] = await Promise.all([
    supabase
      .from("products")
      .select(PRODUCT_LIST_SELECT)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.rpc("get_product_sales", { p_user_id: user.id }),
  ]);

  if (productsResult.error) {
    console.error("Error fetching initial products:", productsResult.error);
  }

  if (salesResult.error) {
    console.error("Error fetching initial product sales:", salesResult.error);
  }

  const sales: Record<string, number> = {};
  for (const row of (salesResult.data || []) as ProductSaleRow[]) {
    if (!row.name) continue;
    sales[row.name] = Number(row.qty) || 0;
  }

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <ProductList
        initialProducts={(productsResult.data || []) as Product[]}
        initialSales={sales}
      />
    </div>
  );
}
