import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { SettingsClient } from "@/features/receipts/components/SettingsClient";
import type { Profile } from "@/features/receipts/types/receipt.types";

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [{ data: profile }, { data: products }, { data: categories }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("products")
      .select("id, image_url")
      .eq("user_id", user.id)
      .is("deleted_at", null),
    supabase
      .from("business_categories")
      .select("id, label")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  if (!profile) redirect("/login");

  const productCount = products?.length ?? 0;
  const productsWithImage = products?.filter((p) => !!p.image_url).length ?? 0;

  const categoryLabel =
    profile.business_category && categories
      ? (categories.find((c) => c.id === profile.business_category)?.label ?? null)
      : null;

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <Suspense>
        <SettingsClient
          initialProfile={profile as Profile}
          productCount={productCount}
          productsWithImage={productsWithImage}
          initialCategoryLabel={categoryLabel}
        />
      </Suspense>
    </div>
  );
}
