"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Copy, Share2, Users, ShoppingBag, ChevronRight, Loader2, Megaphone, Package } from "lucide-react";
import { track } from "@/lib/analytics";

interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string;
  invite_code: string;
  member_count: number;
  total_orders: number;
  is_active: boolean;
  role: string;
}

export default function KomunitasPage() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cooperation: announcements + group buy
  const [announcements, setAnnouncements] = useState<{ id: string; type: string; title: string; body?: string; createdAt: string; authorName: string }[]>([]);
  const [groupBuy, setGroupBuy] = useState<{ category: string; memberCount: number; totalMembers: number; message: string }[]>([]);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [announcementType, setAnnouncementType] = useState("info");
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/communities/my");
        if (res.ok) {
          const data = await res.json();
          setCommunities(data);
        }
      } catch {
        // silent
      }
      setIsLoading(false);
    }
    load();

    // Load cooperation data
    fetch("/api/communities/announcements")
      .then(r => r.ok ? r.json() : null)
      .then(data => setAnnouncements(data?.announcements || []))
      .catch(() => {});
    fetch("/api/communities/group-buy")
      .then(r => r.ok ? r.json() : null)
      .then(data => setGroupBuy(data?.suggestions || []))
      .catch(() => {});
  }, []);

  async function handlePostAnnouncement() {
    if (!announcementTitle.trim()) { toast.error("Judul diperlukan"); return; }
    setIsPosting(true);
    try {
      const res = await fetch("/api/communities/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: announcementType, title: announcementTitle, body: announcementBody || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(prev => [{ ...data.announcement, authorName: "You", createdAt: new Date().toISOString() }, ...prev]);
        setAnnouncementTitle("");
        setAnnouncementBody("");
        toast.success("Pengumuman terkirim");
        track("announcement_posted", { type: announcementType });
      } else {
        toast.error("Gagal kirim pengumuman");
      }
    } catch { toast.error("Gagal kirim"); }
    setIsPosting(false);
  }

  function handleCopyInvite(community: Community) {
    const link = `https://tokoflow.com/join/${community.invite_code}`;
    navigator.clipboard.writeText(link);
    toast.success("Link undangan disalin!");
  }

  function handleShareWA(community: Community) {
    const link = `https://tokoflow.com/join/${community.invite_code}`;
    const text = `Hai! Gabung di ${community.name} — komunitas UMKM yang pakai Tokoflow.\n\nCustomers order through a link, pesanan and everything lands in my dashboard.\n\n${link}\n\n_From selling to a real business_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    track("community_invite_wa", { community: community.name });
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded w-48" />
        <div className="h-32 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Community</h1>
          <p className="text-sm text-muted-foreground">Ajak UMKM lain bergabung di satu komunitas</p>
        </div>
        <Link
          href="/community/new"
          className="h-9 px-3 bg-warm-green text-white rounded-lg text-sm font-medium hover:bg-warm-green/90 transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Buat Komunitas
        </Link>
      </div>

      {/* Community List */}
      {communities.length === 0 ? (
        <div className="text-center py-12 rounded-xl border bg-card shadow-sm">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="font-medium text-foreground">None yet komunitas</p>
          <p className="text-sm text-muted-foreground mt-1">
            Buat komunitas untuk mengajak UMKM lain bergabung
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {communities.map((c) => (
            <div key={c.id} className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{c.name}</h3>
                    {c.role === "organizer" && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#E8F6F0] text-[#05A660]">Koordinator</span>
                    )}
                  </div>
                  {c.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                  )}
                </div>
                <button
                  onClick={() => router.push(`/community/${c.slug}`)}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {c.member_count} anggota
                </span>
                {c.total_orders > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {c.total_orders} pesanan
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCopyInvite(c)}
                  className="flex-1 h-9 rounded-lg border bg-card text-xs font-medium text-foreground hover:bg-accent transition-colors flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy link
                </button>
                <button
                  onClick={() => handleShareWA(c)}
                  className="flex-1 h-9 rounded-lg bg-[#25D366] text-white text-xs font-medium hover:bg-[#25D366]/90 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Undang via WA
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === COOPERATION: Announcements (Phase 1) === */}
      {communities.some(c => c.role === "organizer") && (
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Megaphone className="w-4 h-4" />
            Kirim Pengumuman ke Member
          </div>
          <div className="flex gap-2">
            {[
              { value: "info", label: "Info" },
              { value: "supplier_alert", label: "Supplier" },
              { value: "price_change", label: "Price" },
              { value: "deal", label: "Deal" },
            ].map(t => (
              <button
                key={t.value}
                onClick={() => setAnnouncementType(t.value)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${announcementType === t.value ? "bg-[#1a4d35] text-white" : "bg-muted text-muted-foreground hover:bg-accent"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Judul (contoh: Harga tepung naik 10%)"
            value={announcementTitle}
            onChange={(e) => setAnnouncementTitle(e.target.value)}
            className="w-full h-10 px-3 bg-card border rounded-lg text-sm focus:ring-2 focus:ring-[#1a4d35]/20 focus:border-[#1a4d35]"
          />
          <textarea
            placeholder="Detail (opsional)"
            value={announcementBody}
            onChange={(e) => setAnnouncementBody(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-card border rounded-lg text-sm focus:ring-2 focus:ring-[#1a4d35]/20 focus:border-[#1a4d35] resize-none"
          />
          <button
            onClick={handlePostAnnouncement}
            disabled={isPosting || !announcementTitle.trim()}
            className="w-full h-10 rounded-lg bg-[#1a4d35] text-white text-sm font-medium hover:bg-[#1a4d35]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kirim ke Semua Member"}
          </button>
        </div>
      )}

      {/* Announcements feed */}
      {announcements.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Megaphone className="w-3.5 h-3.5" />
            Pengumuman Komunitas
          </h2>
          {announcements.slice(0, 5).map(a => (
            <div key={a.id} className="rounded-lg border bg-card px-3 py-2.5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                  {a.type === "supplier_alert" ? "Supplier" : a.type === "price_change" ? "Price" : a.type === "deal" ? "Deal" : "Info"}
                </span>
                <span className="text-[10px] text-muted-foreground">{a.authorName} · {new Date(a.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "short" })}</span>
              </div>
              <p className="text-sm font-medium text-foreground">{a.title}</p>
              {a.body && <p className="text-xs text-muted-foreground mt-0.5">{a.body}</p>}
            </div>
          ))}
        </div>
      )}

      {/* === COOPERATION: Group Buy Suggestions (Phase 2) === */}
      {groupBuy.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />
            Peluang Beli Bareng
          </h2>
          {groupBuy.map(g => (
            <div key={g.category} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 shadow-sm">
              <p className="text-sm font-medium text-amber-900">{g.category}</p>
              <p className="text-xs text-amber-700 mt-0.5">{g.message}</p>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground">Beli bahan bareng anggota komunitas = potensi hemat 15-25% dari harga eceran.</p>
        </div>
      )}
    </div>
  );
}
