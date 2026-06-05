"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ArrowLeft, Save, Loader2, Upload, Trash2, QrCode, Camera, X, Search, ChevronDown } from "lucide-react";
import { updateProfile } from "@/features/receipts/services/receipt.service";
import type { Profile } from "@/features/receipts/types/receipt.types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProfileEditClientProps {
  initialProfile: Profile;
  initialCategories: { id: string; label: string }[];
  initialProvinces: { id: number; name: string; slug: string }[];
  initialCities: { id: number; name: string; slug: string; province_id: number }[];
  initialProvinceId: number | "";
}

export function ProfileEditClient({
  initialProfile,
  initialCategories,
  initialProvinces,
  initialCities,
  initialProvinceId,
}: ProfileEditClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialProfile.logo_url || null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingQris, setIsUploadingQris] = useState(false);
  const [qrisUrl, setQrisUrl] = useState<string | null>((initialProfile as Profile & { qris_url?: string }).qris_url || null);
  const qrisInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [preorderEnabled] = useState((initialProfile as Profile & { preorder_enabled?: boolean }).preorder_enabled ?? true);
  const [operatingHours, setOperatingHours] = useState<Record<string, { open: string; close: string; closed?: boolean }>>(
    (initialProfile as Profile & { operating_hours?: unknown }).operating_hours && typeof (initialProfile as Profile & { operating_hours?: unknown }).operating_hours === "object"
      ? (initialProfile as Profile & { operating_hours?: Record<string, { open: string; close: string; closed?: boolean }> }).operating_hours!
      : {}
  );
  const [cities, setCities] = useState(initialCities);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | "">(initialProvinceId);
  const [selectedCityId, setSelectedCityId] = useState<number | "">((initialProfile as Profile & { city_id?: number }).city_id || "");
  const [form, setForm] = useState({
    full_name: initialProfile.full_name || "",
    business_name: initialProfile.business_name || "",
    business_address: (initialProfile as Profile & { business_address?: string }).business_address || "",
    business_phone: (initialProfile as Profile & { business_phone?: string }).business_phone || "",
    business_category: (initialProfile as Profile & { business_category?: string }).business_category || "",
    business_type: (initialProfile as Profile & { business_type?: string }).business_type || "",
    business_description: (initialProfile as Profile & { business_description?: string }).business_description || "",
  });

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Max file size is 2MB");
      return;
    }
    setIsUploadingLogo(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("profile-photos").getPublicUrl(path);
      const url = urlData.publicUrl;
      const updated = await updateProfile({ logo_url: url });
      if (updated) {
        setLogoUrl(url);
        toast.success("Profile photo uploaded");
      } else {
        toast.error("Failed to save profile photo");
      }
    } catch {
      toast.error("Failed to upload profile photo");
    }
    setIsUploadingLogo(false);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  async function handleLogoDelete() {
    setIsUploadingLogo(true);
    try {
      const updated = await updateProfile({ logo_url: "" as string });
      if (updated) {
        setLogoUrl(null);
        toast.success("Profile photo removed");
      } else {
        toast.error("Failed to remove profile photo");
      }
    } catch {
      toast.error("Failed to remove profile photo");
    }
    setIsUploadingLogo(false);
  }

  async function handleQrisUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingQris(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/qris-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("qris-codes").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("qris-codes").getPublicUrl(path);
      const url = urlData.publicUrl;
      const updated = await updateProfile({ qris_url: url });
      if (updated) {
        setQrisUrl(url);
        toast.success("DuitNow QR uploaded");
      } else {
        toast.error("Failed to save DuitNow QR");
      }
    } catch {
      toast.error("Failed to upload DuitNow QR");
    }
    setIsUploadingQris(false);
    if (qrisInputRef.current) qrisInputRef.current.value = "";
  }

  async function handleQrisDelete() {
    setIsUploadingQris(true);
    try {
      const updated = await updateProfile({ qris_url: "" as string });
      if (updated) {
        setQrisUrl(null);
        toast.success("DuitNow QR removed");
      } else {
        toast.error("Failed to remove DuitNow QR");
      }
    } catch {
      toast.error("Failed to remove DuitNow QR");
    }
    setIsUploadingQris(false);
  }

  const handleProvinceChange = async (provinceId: number | "") => {
    setSelectedProvinceId(provinceId);
    setSelectedCityId("");
    setCities([]);
    if (provinceId) {
      try {
        const res = await fetch(`/api/lookup?type=cities&province_id=${provinceId}`);
        if (res.ok) setCities(await res.json());
      } catch { /* fallback to empty */ }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const hasHours = Object.keys(operatingHours).length > 0;
    const updated = await updateProfile({
      ...form,
      city_id: selectedCityId || null,
      ...(hasHours && { operating_hours: operatingHours }),
    });
    if (updated) {
      toast.success("Profile saved");
      router.push("/settings");
    } else {
      toast.error("Failed to save profile");
    }
    setIsSaving(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5 min-h-9">
        <Link href="/settings" className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Edit Profile</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px] lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,780px)_360px] md:items-start xl:justify-center">
        <div className="min-w-0">
      {/* Form */}
      <div className="rounded-lg border bg-card shadow-sm p-4 space-y-3">
        {/* Logo Upload */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Profile photo / Logo</label>
          <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoUpload} className="hidden" />
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border hover:border-primary/30 transition-colors shrink-0 group"
                >
                  <Image src={logoUrl} alt="Logo" fill className="object-cover" sizes="96px" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </button>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="h-9 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium bg-card border border-border shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    {isUploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleLogoDelete}
                    disabled={isUploadingLogo}
                    className="h-9 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium text-red-600 bg-card border border-border shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploadingLogo}
                className="w-24 h-24 flex flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed border-border bg-card hover:bg-muted transition-colors disabled:opacity-50"
              >
                {isUploadingLogo ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : (
                  <Camera className="w-5 h-5 text-muted-foreground" />
                )}
                <span className="text-[10px] text-muted-foreground">
                  {isUploadingLogo ? "Uploading..." : "Upload"}
                </span>
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/70 mt-1.5">
            Shown on your public order page and settings. Max 2MB.
          </p>
        </div>

        <div className="rounded-lg border bg-card shadow-sm transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30">
          <label className="block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground">Full name</label>
          <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Full name" className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none" />
        </div>
        <div className="rounded-lg border bg-card shadow-sm transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30">
          <label className="block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground">Business name</label>
          <input type="text" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} placeholder="Your business name" className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none" />
        </div>
        <div className="rounded-lg border bg-card shadow-sm transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30">
          <label className="block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground">Business address</label>
          <textarea value={form.business_address} onChange={(e) => setForm({ ...form, business_address: e.target.value })} rows={2} placeholder="Business address" className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none" />
        </div>
        <div className="rounded-lg border bg-card shadow-sm transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30">
          <label className="block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground">Business WhatsApp number</label>
          <div className="flex items-center px-3 pb-2 pt-0 gap-2">
            <span className="text-sm text-muted-foreground shrink-0 select-none mr-2">🇮🇩 +62</span>
            <span className="w-px h-4 bg-border shrink-0 mr-2" />
            <input
              type="tel"
              value={(() => { const d = (form.business_phone || "").replace(/\D/g, ""); return d.startsWith("60") ? d.slice(2) : d.startsWith("0") ? d.slice(1) : d; })()}
              onChange={(e) => { const d = e.target.value.replace(/\D/g, ""); setForm({ ...form, business_phone: d.startsWith("0") ? d.slice(1) : d.startsWith("60") ? d.slice(2) : d }); }}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              placeholder="12 345 6789"
            />
          </div>
        </div>

        {/* Marketplace fields */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider mb-3">Online store profile</p>
        </div>
        <SearchableSelect
          label="State"
          placeholder="Choose state"
          options={initialProvinces.map((p) => ({ id: String(p.id), label: p.name }))}
          value={selectedProvinceId ? String(selectedProvinceId) : ""}
          onChange={(val) => handleProvinceChange(val ? parseInt(val, 10) : "")}
        />
        <div>
          <SearchableSelect
            label="City"
            placeholder={selectedProvinceId ? "Choose city" : "Choose a state first"}
            options={cities.map((c) => ({ id: String(c.id), label: c.name }))}
            value={selectedCityId ? String(selectedCityId) : ""}
            onChange={(val) => setSelectedCityId(val ? parseInt(val, 10) : "")}
            disabled={!selectedProvinceId}
          />
          <p className="text-[11px] text-muted-foreground/70 mt-1">City where your business operates</p>
        </div>
        <SearchableSelect
          label="Business category"
          placeholder="Choose category"
          options={initialCategories}
          value={form.business_category}
          onChange={(val) => setForm({ ...form, business_category: val })}
        />
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">What you sell (specifics)</label>
          <input
            type="text"
            value={form.business_type}
            onChange={(e) => setForm({ ...form, business_type: e.target.value.slice(0, 80) })}
            placeholder="e.g. Nasi lemak catering, batik baju kurung, baby sleep coaching"
            className="w-full h-11 px-3 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors placeholder:text-muted-foreground/60"
          />
          <p className="text-[11px] text-muted-foreground/70 mt-1">Helps us give you more relevant peer benchmarks and pricing whisper.</p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Store description</label>
          <textarea
            value={form.business_description}
            onChange={(e) => setForm({ ...form, business_description: e.target.value.slice(0, 160) })}
            rows={3}
            className="w-full px-3 py-2.5 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-card resize-none transition-colors placeholder:text-muted-foreground"
            placeholder="Briefly describe your business..."
          />
          <p className="text-[11px] text-muted-foreground/70 mt-1">{form.business_description.length}/160 characters</p>
        </div>

        {/* DuitNow QR Upload */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">DuitNow QR (payment)</label>
          <p className="text-[11px] text-muted-foreground/70 mb-2">
            Upload your DuitNow QR from bank or e-wallet.
            {preorderEnabled && " While Pre-order mode or Subscription is active, the QR isn't shown to customers after ordering."}
          </p>
          <input ref={qrisInputRef} type="file" accept="image/*" onChange={handleQrisUpload} className="hidden" />
          {qrisUrl ? (
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setPreviewImage(qrisUrl)}
                className="relative w-28 h-28 rounded-lg border border-border bg-white p-1 flex-shrink-0 hover:border-primary/30 transition-colors cursor-zoom-in"
              >
                <Image src={qrisUrl} alt="DuitNow QR" fill className="object-contain rounded" sizes="112px" />
              </button>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => qrisInputRef.current?.click()}
                  disabled={isUploadingQris}
                  className="h-9 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium bg-card border border-border shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {isUploadingQris ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleQrisDelete}
                  disabled={isUploadingQris}
                  className="h-9 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium text-red-600 bg-card border border-border shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => qrisInputRef.current?.click()}
              disabled={isUploadingQris}
              className="w-full h-20 flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-card hover:bg-muted transition-colors disabled:opacity-50"
            >
              {isUploadingQris ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                <QrCode className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {isUploadingQris ? "Uploading..." : "Upload DuitNow QR"}
              </span>
            </button>
          )}
        </div>

      </div>
        </div>

        <aside className="hidden md:block">
          <div className="sticky top-4 space-y-3">
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/30">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Profile</p>
              </div>
              <div className="p-4 space-y-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full h-11 flex items-center justify-center gap-2 bg-warm-green text-white rounded-lg text-sm font-medium hover:bg-warm-green-hover disabled:opacity-50 transition-colors"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save changes
                </button>
                {initialProfile.slug && (
                  <a
                    href={`https://tokoflow.com/${initialProfile.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full h-9 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    View store
                  </a>
                )}
              </div>
            </div>
          </div>
        </aside>

      </div>

      {/* Mobile save */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border">
        <div className="px-4 py-3 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="h-10 px-5 rounded-lg bg-warm-green text-white text-xs font-medium hover:bg-warm-green-hover disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </div>
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-[90vw] max-h-[85vh] rounded-xl bg-white object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function SearchableSelect({ label, placeholder, options, value, onChange, disabled }: {
  label: string;
  placeholder: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value);
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div ref={ref} className="relative">
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <button
        type="button"
        onClick={() => { if (!disabled) { setOpen(!open); setQuery(""); } }}
        onBlur={(e) => { if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false); }}
        className={`w-full h-11 px-3 bg-card border rounded-lg shadow-sm text-sm text-left flex items-center justify-between focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length > 0 ? filtered.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onChange(opt.id); setOpen(false); setQuery(""); }}
                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors ${opt.id === value ? "bg-muted/30 font-medium text-foreground" : "text-foreground"}`}
              >
                {opt.label}
              </button>
            )) : (
              <p className="px-3 py-3 text-sm text-muted-foreground">No matches</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
