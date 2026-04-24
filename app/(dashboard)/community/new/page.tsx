"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { track } from "@/lib/analytics";

export default function BuatKomunitasPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Nama komunitas diperlukan");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: desc.trim() || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Gagal membuat komunitas");
        return;
      }

      const community = await res.json();
      toast.success("Komunitas dibuat!");
      track("community_created", { name: community.name });
      router.push("/community");
    } catch {
      toast.error("Gagal membuat komunitas");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/community"
          className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Buat Komunitas</h1>
          <p className="text-sm text-muted-foreground">Ajak UMKM lain bergabung di satu komunitas</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Nama Komunitas</label>
          <input
            type="text"
            placeholder="contoh: Katering Bekasi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 px-3 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors"
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Deskripsi <span className="text-muted-foreground font-normal">(opsional)</span></label>
          <textarea
            placeholder="Contoh: Komunitas katering dan nasi box area Bekasi"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors resize-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Link
            href="/community"
            className="flex-1 h-10 rounded-lg border bg-card text-sm font-medium text-muted-foreground hover:bg-accent transition-colors flex items-center justify-center"
          >
            Batal
          </Link>
          <button
            onClick={handleCreate}
            disabled={isCreating || !name.trim()}
            className="flex-1 h-10 rounded-lg bg-warm-green text-white text-sm font-medium hover:bg-warm-green/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buat Komunitas"}
          </button>
        </div>
      </div>
    </div>
  );
}
