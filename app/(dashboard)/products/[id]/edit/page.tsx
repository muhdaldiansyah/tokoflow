"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { getProduct } from "@/features/products/services/product.service";
import { ProductForm } from "@/features/products/components/ProductForm";
import type { Product } from "@/features/products/types/product.types";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getProduct(id);
      setProduct(data);
      setIsLoading(false);
    }
    load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Product not found</p>
        <Link href="/products" className="text-foreground underline">
          Back to products
        </Link>
      </div>
    );
  }

  return <ProductForm initialProduct={product} />;
}
