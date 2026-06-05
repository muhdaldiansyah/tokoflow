import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { ProfileEditClient } from "@/features/receipts/components/ProfileEditClient";
import type { Profile } from "@/features/receipts/types/receipt.types";

export default async function ProfileEditPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [{ data: profile }, { data: categories }, { data: provinces }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("business_categories")
      .select("id, label")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("provinces")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  if (!profile) redirect("/login");

  let initialCities: { id: number; name: string; slug: string; province_id: number }[] = [];
  let initialProvinceId: number | "" = "";

  const cityId = (profile as Profile & { city_id?: number }).city_id;
  if (cityId) {
    const { data: allCities } = await supabase
      .from("cities")
      .select("id, name, slug, province_id")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (allCities) {
      const cityMatch = allCities.find((c) => c.id === cityId);
      if (cityMatch) {
        initialProvinceId = cityMatch.province_id;
        initialCities = allCities.filter((c) => c.province_id === cityMatch.province_id);
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <ProfileEditClient
        initialProfile={profile as Profile}
        initialCategories={(categories ?? []) as { id: string; label: string }[]}
        initialProvinces={(provinces ?? []) as { id: number; name: string; slug: string }[]}
        initialCities={initialCities}
        initialProvinceId={initialProvinceId}
      />
    </div>
  );
}
