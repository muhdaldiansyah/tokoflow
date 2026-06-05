import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { ProductForm } from "@/features/products/components/ProductForm";
import type { Product } from "@/features/products/types/product.types";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!product) redirect("/products");

  return <ProductForm initialProduct={product as Product} />;
}
