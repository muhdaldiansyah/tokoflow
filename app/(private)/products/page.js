import { Suspense } from "react";
import { createClient } from "../../../lib/database/supabase-server";
import ProductsTable from "./ProductsTable";
import { Loader2 } from "lucide-react";

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;
  const search = params?.search || null;
  const stock = params?.stock || null;
  // Server-side data fetching - no API round trip!
  const supabase = await createClient();

  let q = supabase
    .from('v_products_with_costs')
    .select('id, sku, name, stock, low_stock_threshold, stock_status, warehouse_id, warehouse_name, created_at, updated_at, modal_cost, packing_cost, affiliate_percentage')
    .order('updated_at', { ascending: false })
    .order('id', { ascending: true })   // tie-breaker to match index
    .range(0, 49);

  if (search) {
    q = q.textSearch('search_tsv', search, { type: 'websearch', config: 'public.simple_unaccent' });
  }
  if (stock === 'negative') q = q.lt('stock', 0);
  else if (stock === 'zero') q = q.eq('stock', 0);
  else if (stock === 'positive') q = q.gt('stock', 0);

  const { data: products, error } = await q;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 text-red-500 mx-auto mb-4">⚠️</div>
          <p className="text-red-600 mb-4">Failed to load products</p>
          <p className="text-gray-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  // View already includes costs - no additional query needed
  const transformedProducts = (products || []).map(product => ({
    ...product,
    modal_cost: product.modal_cost || 0,
    packing_cost: product.packing_cost || 0,
    affiliate_percentage: product.affiliate_percentage || 0,
  }));

  return (
    <>
      {/* Above-the-fold: instant render */}
      <ProductsTable initialData={transformedProducts} />

      {/* Below-the-fold: stream expensive components later */}
      <Suspense fallback={<div className="skeleton h-40 mx-4 mb-4 bg-gray-100 rounded-lg animate-pulse" />}>
        {/* Future: Add expensive summary widgets here */}
        {/* <ProductsSummary /> */}
      </Suspense>
    </>
  );
}