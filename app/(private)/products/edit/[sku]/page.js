import { Suspense } from "react";
import { createClient } from "../../../../../lib/database/supabase-server";
import EditProductForm from "./EditProductForm";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function EditProductPage({ params }) {
  const { sku } = await params;
  const decodedSku = decodeURIComponent(sku);
  const supabase = await createClient();

  try {
    // Step 1: Get product ID from SKU (fast with index)
    const { data: productData, error: productError } = await supabase
      .from('tf_products')
      .select('id, sku, name, stock, created_at, updated_at')
      .eq('sku', decodedSku)
      .single();

    if (productError || !productData) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">Product not found</p>
            <Link
              href="/products"
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Products
            </Link>
          </div>
        </div>
      );
    }

    // Step 2: Fetch related data using product ID (much faster)
    const [costsResult, compositionsResult] = await Promise.all([
      supabase
        .from('tf_product_costs')
        .select('modal_cost, packing_cost, affiliate_percentage')
        .eq('product_id', productData.id)
        .maybeSingle(),

      supabase
        .from('tf_product_compositions')
        .select(`
          id,
          parent_sku,
          component_sku,
          quantity
        `)
        .or(`parent_sku.eq.${decodedSku},component_sku.eq.${decodedSku}`)
    ]);

    // Combine all data
    const enrichedProduct = {
      ...productData,
      modal_cost: costsResult.data?.modal_cost || 0,
      packing_cost: costsResult.data?.packing_cost || 0,
      affiliate_percentage: costsResult.data?.affiliate_percentage || 0,
      asParent: (compositionsResult.data || []).filter(c => c.parent_sku === decodedSku),
      asComponent: (compositionsResult.data || []).filter(c => c.component_sku === decodedSku),
    };

    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
      }>
        <EditProductForm product={enrichedProduct} />
      </Suspense>
    );

  } catch (error) {
    console.error('Error loading product:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Failed to load product</p>
          <p className="text-gray-500 text-sm">{error.message}</p>
          <Link
            href="/products"
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }
}