import { redirect, notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const supabase = await createServiceClient();
  const { data: community } = await supabase
    .from("communities")
    .select("slug")
    .eq("invite_code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (!community) notFound();

  redirect(`/community/${community.slug}`);
}
