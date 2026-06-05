import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { RecapPageClient } from "@/features/recap/components/RecapPageClient";

export default async function RecapPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, created_at")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <RecapPageClient
        businessName={profile?.business_name || ""}
        profileCreatedAt={profile?.created_at || ""}
      />
    </div>
  );
}
