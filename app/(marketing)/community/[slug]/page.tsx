import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { Users, ShoppingBag, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommunityMember {
  id: string;
  business_name: string;
  logo_url?: string;
  slug?: string;
  business_category?: string;
  city?: string;
  completedOrders: number;
}

async function getCommunity(slug: string) {
  const supabase = await createServiceClient();

  const { data: community } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!community) return null;

  // Get members
  const { data: memberships } = await supabase
    .from("community_members")
    .select("user_id, role")
    .eq("community_id", community.id);

  if (!memberships || memberships.length === 0) {
    return { ...community, members: [] };
  }

  const userIds = memberships.map((m) => m.user_id);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, business_name, logo_url, slug, business_category, city")
    .in("id", userIds)
    .eq("order_form_enabled", true);

  // Count completed orders per member
  const members: CommunityMember[] = [];
  for (const profile of profiles || []) {
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("status", "done")
      .is("deleted_at", null);

    members.push({
      ...profile,
      completedOrders: count || 0,
    });
  }

  // Sort by completed orders descending
  members.sort((a, b) => b.completedOrders - a.completedOrders);

  return { ...community, members };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const community = await getCommunity(slug);
  if (!community) return { title: "Komunitas — Tokoflow" };

  return {
    title: `${community.name} — ${community.member_count} UMKM | Tokoflow`,
    description: community.description || `${community.member_count} UMKM sudah bergabung di ${community.name}. Gabung sekarang — gratis.`,
    openGraph: {
      title: `${community.name} | Tokoflow`,
      description: `${community.member_count} UMKM sudah bergabung. Dari chat jadi catatan.`,
      url: `https://tokoflow.com/community/${slug}`,
    },
    alternates: {
      canonical: `https://tokoflow.com/community/${slug}`,
    },
    robots: community.member_count >= 3 ? undefined : { index: false },
  };
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const community = await getCommunity(slug);
  if (!community) notFound();

  const totalOrders = community.members.reduce((sum: number, m: CommunityMember) => sum + m.completedOrders, 0);
  const isEvent = community.event_date_start || community.event_date_end;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: community.name,
    url: `https://tokoflow.com/community/${slug}`,
    description: community.description,
    numberOfEmployees: { "@type": "QuantitativeValue", value: community.member_count },
    member: community.members.slice(0, 10).map((m: CommunityMember) => ({
      "@type": "LocalBusiness",
      name: m.business_name,
      url: m.slug ? `https://tokoflow.com/${m.slug}` : undefined,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-gradient-to-b from-[#E8F6F0] to-white pt-24 pb-12 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#05A660]/20 px-3 py-1 text-sm font-medium text-[#05A660] shadow-sm mb-6">
              <Users className="w-4 h-4" />
              {community.member_count} UMKM bergabung
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold text-[#1E293B] tracking-tight">
              {community.name}
            </h1>

            {community.description && (
              <p className="mt-3 text-[#475569] text-lg leading-relaxed">
                {community.description}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-[#475569]">
              {community.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {community.city}
                </span>
              )}
              {totalOrders > 0 && (
                <span className="inline-flex items-center gap-1">
                  <ShoppingBag className="w-4 h-4" />
                  {totalOrders} pelanggan dilayani
                </span>
              )}
              {isEvent && community.event_date_start && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(community.event_date_start).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })}
                  {community.event_date_end && ` — ${new Date(community.event_date_end).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Member Grid */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {community.members.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {community.members.map((member: CommunityMember) => (
                <Link
                  key={member.id}
                  href={member.slug ? `/${member.slug}?from=community` : "#"}
                  className="group rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm hover:shadow-md hover:border-[#05A660]/30 transition-all text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-[#E8F6F0] flex items-center justify-center mx-auto mb-3 overflow-hidden">
                    {member.logo_url ? (
                      <Image src={member.logo_url} alt="" width={56} height={56} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-sm font-bold text-[#05A660]">
                        {(member.business_name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-sm text-[#1E293B] group-hover:text-[#05A660] transition-colors truncate">
                    {member.business_name}
                  </p>
                  {member.business_category && (
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">{member.business_category}</p>
                  )}
                  {member.completedOrders > 0 && (
                    <p className="text-[11px] text-[#05A660] font-medium mt-1">
                      {member.completedOrders} pesanan
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[#475569]">
              <Users className="w-12 h-12 mx-auto mb-4 text-[#94A3B8]" />
              <p className="font-medium">No members yet</p>
              <p className="text-sm mt-1">Be the first to join!</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-lg border-t border-[#E2E8F0] px-4 py-4">
          <div className="max-w-md mx-auto">
            <Button size="lg" className="w-full h-12 text-base font-semibold bg-[#05A660] text-white hover:bg-[#048C51]" asChild>
              <Link href={`/register?community=${community.invite_code}`}>
                Join community — free
              </Link>
            </Button>
            <p className="text-center text-xs text-[#94A3B8] mt-2">
              Kasih store link ke pelanggan — mereka pesan sendiri, pesanan tercatat rapi.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
