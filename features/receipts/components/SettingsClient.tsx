"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Pencil, KeyRound, LinkIcon, Copy, Check, Zap, Shield, ChevronRight, FileText, Trash2, Users } from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";
import { toast } from "sonner";
import { updateProfile, updateSlug, updateOrderFormEnabled, updateIsListed, updateDailyOrderCapacity, updateQuietHours } from "@/features/receipts/services/receipt.service";
import { AcceptPaymentsCard } from "@/features/billing/components/AcceptPaymentsCard";
import { isValidSlug, isReservedSlug, generateSlug } from "@/lib/utils/slug";
import { track } from "@/lib/analytics";
import { REFERRAL_ENABLED } from "@/lib/utils/constants";
import { getOrdersRemaining, isOrderQuotaExhausted, isUnlimited, BISNIS_CODE, BISNIS_CODE_ANNUAL, BISNIS_PRICE, BISNIS_PRICE_MONTHLY, BISNIS_PRICE_ANNUAL_TOTAL, isBisnis } from "@/config/plans";
import type { Profile } from "@/features/receipts/types/receipt.types";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function ChecklistItem({ done, label, href }: { done: boolean; label: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 py-1.5 group">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-warm-green" : "border-2 border-muted-foreground/30"}`}>
        {done && <Check className="w-3 h-3 text-white" />}
      </div>
      <span className={`text-sm flex-1 ${done ? "text-muted-foreground" : "text-foreground"}`}>{label}</span>
      {!done && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
    </Link>
  );
}

interface SettingsClientProps {
  initialProfile: Profile;
  productCount: number;
  productsWithImage: number;
  initialCategoryLabel: string | null;
}

export function SettingsClient({
  initialProfile,
  productCount,
  productsWithImage,
  initialCategoryLabel,
}: SettingsClientProps) {
  const searchParamsHook = useSearchParams();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isBuyingBisnis, setIsBuyingBisnis] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [tinInput, setTinInput] = useState(initialProfile.tin || initialProfile.npwp || "");
  const [brnInput, setBrnInput] = useState(initialProfile.brn || "");
  const [sstIdInput, setSstIdInput] = useState(initialProfile.sst_registration_id || "");
  // Tax rate options: ID PPN (0/11) active; 6 kept for the dormant MY SST path.
  const [defaultSstRate, setDefaultSstRate] = useState<0 | 6 | 11 | 12>(
    (initialProfile.default_sst_rate as 0 | 6 | 11 | 12) || 0,
  );
  const [isSavingTax, setIsSavingTax] = useState(false);
  const [isSavingRates, setIsSavingRates] = useState(false);

  const [slugInput, setSlugInput] = useState(
    initialProfile.slug || (initialProfile.business_name ? generateSlug(initialProfile.business_name) : ""),
  );
  const [isSavingSlug, setIsSavingSlug] = useState(false);
  const [slugError, setSlugError] = useState("");
  const [copied, setCopied] = useState(false);

  const [referralCopied, setReferralCopied] = useState(false);
  const [referredUsers, setReferredUsers] = useState<{ id: string; full_name: string; business_name?: string; created_at: string }[]>([]);

  const [categoryLabel, setCategoryLabel] = useState<string | null>(initialCategoryLabel);

  // Show toast if redirected with slug_taken
  useEffect(() => {
    if (searchParamsHook.get("slug_taken") === "true") {
      toast.error("That link is already taken. Please pick another name.");
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParamsHook]);

  // Fetch referred users once on mount if profile has a referral code
  useEffect(() => {
    if (REFERRAL_ENABLED && initialProfile.referral_code) {
      fetch("/api/referral/users")
        .then((r) => r.json())
        .then((users) => { if (Array.isArray(users)) setReferredUsers(users); })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleChangePassword() {
    setIsSendingReset(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("Email not found");
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error("Could not send password reset email");
      } else {
        toast.success(`Password reset link sent to ${user.email}`);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSendingReset(false);
    }
  }

  async function handleSaveSlug() {
    const cleaned = slugInput.trim().toLowerCase();
    if (!isValidSlug(cleaned)) {
      setSlugError("Min 3 characters, lowercase letters, numbers, and hyphens only");
      return;
    }
    if (isReservedSlug(cleaned)) {
      setSlugError("This name is reserved by the system — please try another");
      return;
    }
    setIsSavingSlug(true);
    setSlugError("");
    const result = await updateSlug(cleaned);
    if (result.success) {
      setProfile((prev) => ({ ...prev, slug: cleaned }));
      track("slug_saved", { slug: cleaned });
      toast.success("Order link saved");
    } else {
      setSlugError(result.error || "Could not save");
    }
    setIsSavingSlug(false);
  }

  async function handleToggleOrderForm() {
    const newValue = !profile.order_form_enabled;
    const success = await updateOrderFormEnabled(newValue);
    if (success) {
      setProfile((prev) => ({ ...prev, order_form_enabled: newValue }));
      track("order_form_toggled", { enabled: newValue });
      toast.success(newValue ? "Order link activated" : "Order link deactivated");
    } else {
      toast.error("Could not update setting");
    }
  }

  async function handleToggleListed() {
    const newValue = !(profile.is_listed ?? true);
    const success = await updateIsListed(newValue);
    if (success) {
      setProfile((prev) => ({ ...prev, is_listed: newValue }));
      track("directory_listed_toggled", { listed: newValue });
      toast.success(newValue ? "Listed on directory" : "Hidden from directory");
    } else {
      toast.error("Could not update setting");
    }
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/${profile.slug || slugInput}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    track("link_copied", { slug: profile.slug || slugInput });
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  const startBillplzCheckout = useCallback(
    async (planCode: string, setLoading: (v: boolean) => void) => {
      setLoading(true);
      try {
        const res = await fetch("/api/billing/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planCode }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error || "Could not create payment");
          setLoading(false);
          return;
        }
        const { url } = await res.json();
        if (!url) {
          toast.error("No payment URL returned");
          setLoading(false);
          return;
        }
        window.location.href = url;
      } catch {
        toast.error("Something went wrong while starting payment");
        setLoading(false);
      }
    },
    [],
  );

  const handleBuyBisnis = useCallback(() => {
    track("bisnis_purchase_started", { billing: "monthly" });
    startBillplzCheckout(BISNIS_CODE, setIsBuyingBisnis);
  }, [startBillplzCheckout]);

  const handleBuyBisnisAnnual = useCallback(() => {
    track("bisnis_purchase_started", { billing: "annual" });
    startBillplzCheckout(BISNIS_CODE_ANNUAL, setIsBuyingBisnis);
  }, [startBillplzCheckout]);

  async function handleSaveTax() {
    setIsSavingTax(true);
    const tin = tinInput.trim() || undefined;
    const brn = brnInput.trim() || undefined;
    const sstId = sstIdInput.trim() || undefined;
    const result = await updateProfile({
      tin,
      brn,
      sst_registration_id: sstId,
      default_sst_rate: defaultSstRate,
    });
    if (result) {
      setProfile((prev) => ({
        ...prev,
        tin: tin ?? null,
        brn: brn ?? null,
        sst_registration_id: sstId ?? null,
        default_sst_rate: defaultSstRate,
      }));
      track("tax_identity_saved", {});
      toast.success("Tax identity saved");
    } else {
      toast.error("Could not save");
    }
    setIsSavingTax(false);
  }

  const bisnisActive = isBisnis(profile);
  const hasSlug = !!profile.slug;
  const totalRemaining = getOrdersRemaining(profile);
  const quotaExhausted = isOrderQuotaExhausted(profile);
  const unlimited = isUnlimited(profile);
  const hasTaxInfo = !!(profile.tin || profile.brn || profile.sst_registration_id);

  const missingItems: { label: string; href: string }[] = [];
  if (!profile.logo_url) missingItems.push({ label: "Add a profile photo / logo", href: "/profil/edit" });
  if (!profile.business_address) missingItems.push({ label: "Add your business address", href: "/profil/edit" });
  if (!profile.business_phone) missingItems.push({ label: "Add your business WhatsApp number", href: "/profil/edit" });
  if (!profile.qris_url) missingItems.push({ label: "Upload your QRIS", href: "/profil/edit" });
  if (productCount === 0) missingItems.push({ label: "Add your first product", href: "/products" });
  if (productCount > 0 && productsWithImage < productCount) missingItems.push({ label: `${productCount - productsWithImage} products missing a photo`, href: "/products" });

  // Keep categoryLabel in sync if profile.business_category changes locally
  // (only happens if user updates business_category elsewhere and comes back)
  const derivedCategoryLabel = categoryLabel;

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px] lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,780px)_360px] md:items-start xl:justify-center">
      <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center min-h-9">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground">Store profile, order link, and preferences</p>
        </div>
      </div>

      {/* ── SECTION 1: STORE ── */}
      <div className="rounded-lg border bg-card shadow-sm">
        {/* Profile preview + edit */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-full bg-warm-green/10 flex items-center justify-center shrink-0 overflow-hidden">
              {profile.logo_url ? (
                <Image src={profile.logo_url} alt="" fill className="object-cover" sizes="48px" />
              ) : (
                <span className="text-base font-semibold text-warm-green">
                  {(profile.business_name || profile.full_name || "U").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {profile.business_name || profile.full_name || "Not set"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {[profile.business_phone, profile.email].filter(Boolean).join(" · ") || "Complete your business profile"}
              </p>
              {derivedCategoryLabel && (
                <span className="inline-flex items-center mt-1.5 h-5 px-2 text-[10px] font-medium rounded-full bg-warm-green/10 text-warm-green">
                  {derivedCategoryLabel}
                </span>
              )}
            </div>
            <Link
              href="/profil/edit"
              className="flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-lg bg-card border border-border shadow-sm hover:bg-muted transition-colors shrink-0"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </Link>
          </div>
        </div>

        {/* Link + toggle */}
        <div className="border-t px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Order link</p>
            </div>
            <button
              type="button"
              onClick={handleToggleOrderForm}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                profile.order_form_enabled !== false ? "bg-warm-green" : "bg-muted"
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                profile.order_form_enabled !== false ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center h-11 bg-muted/50 border rounded-lg text-sm">
              <span className="text-muted-foreground shrink-0 pl-3">tokoflow.com/</span>
              <input
                type="text"
                value={slugInput}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                  setSlugInput(val);
                  setSlugError("");
                }}
                placeholder="business-name"
                maxLength={50}
                className="flex-1 min-w-0 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={handleSaveSlug}
                disabled={isSavingSlug || slugInput === profile.slug}
                className="shrink-0 h-9 px-3 mr-1 rounded-md bg-warm-green text-white text-xs font-medium hover:bg-warm-green-hover disabled:opacity-50 transition-colors"
              >
                {isSavingSlug ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </button>
            </div>
            {slugError && <p className="text-xs text-warm-rose">{slugError}</p>}
          </div>

          {hasSlug && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="h-9 px-3 flex items-center gap-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-warm-green" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <Link
                href={`/${profile.slug}`}
                className="h-9 px-3 flex items-center gap-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors ml-auto"
              >
                Preview
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Directory listing */}
        <div className="border-t px-4 py-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">List on directory</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Show your shop at tokoflow.com/store so customers nearby can discover you. Your direct link still works either way.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleListed}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                (profile.is_listed ?? true) ? "bg-warm-green" : "bg-muted"
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                (profile.is_listed ?? true) ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
          </div>
          {(profile.is_listed ?? true) && profile.city_slug && profile.business_category && (
            <Link
              href={`/store/${profile.city_slug}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 text-[11px] text-warm-green hover:underline mt-1"
            >
              <Check className="w-3 h-3" />
              Live at /store/{profile.city_slug} →
            </Link>
          )}
          {(profile.is_listed ?? true) && (!profile.city_slug || !profile.business_category) && (
            <Link
              href="/profil/edit"
              className="inline-flex items-center gap-1.5 text-[11px] text-warm-amber hover:underline mt-1"
            >
              Add city + category in profile to appear in directory →
            </Link>
          )}
        </div>

        {/* Store mode */}
        <div className="border-t px-4 py-4 space-y-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Store mode</p>

          {/* TIMING — single select (radio) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Order type</p>
              <p className="text-[10px] text-muted-foreground">Choose one</p>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {([
                { key: "scheduled", label: "Pre-order", desc: "Customer picks a delivery date" },
                { key: "ondemand", label: "Ready now", desc: "No date needed" },
              ] as const).map((timing) => {
                const isScheduled = timing.key === "scheduled";
                const active = isScheduled ? (profile.preorder_enabled ?? true) : !profile.preorder_enabled;
                return (
                  <button
                    key={timing.key}
                    type="button"
                    onClick={async () => {
                      if (active) return;
                      const switchingToScheduled = isScheduled;
                      const next = {
                        preorder_enabled: switchingToScheduled,
                        dine_in_enabled: switchingToScheduled ? false : (profile.dine_in_enabled ?? false),
                        delivery_enabled: switchingToScheduled ? (profile.delivery_enabled ?? false) : false,
                        pickup_enabled: true,
                      };
                      setProfile((prev) => ({ ...prev, ...next }));
                      const ok = await updateProfile(next);
                      if (ok) {
                        track("store_timing_changed", { timing: timing.key });
                        toast.success(`Store mode: ${timing.label}`);
                      } else {
                        toast.error("Could not save");
                      }
                    }}
                    className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      active ? "border-warm-green bg-warm-green/5" : "border-border bg-card hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-xs font-medium ${active ? "text-warm-green" : "text-foreground"}`}>{timing.label}</p>
                      <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? "border-warm-green" : "border-muted-foreground/40"}`}>
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-warm-green" />}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{timing.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FULFILLMENT — multi select (checkboxes), options depend on timing */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">How orders are received</p>
              <p className="text-[10px] text-muted-foreground">Can pick both</p>
            </div>
            {(profile.preorder_enabled ?? true) ? (
              /* Scheduled: Delivery + Pickup */
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  { key: "delivery_enabled" as const, label: "Delivery", desc: "You deliver to customer" },
                  { key: "pickup_enabled" as const, label: "Pickup", desc: "Customer collects from you" },
                ] as const).map((method) => {
                  const enabled = !!(profile[method.key] ?? (method.key === "pickup_enabled"));
                  const isOnlyOneLeft =
                    method.key === "delivery_enabled"
                      ? enabled && !(profile.pickup_enabled ?? true)
                      : enabled && !(profile.delivery_enabled ?? false);
                  return (
                    <button
                      key={method.key}
                      type="button"
                      onClick={async () => {
                        if (isOnlyOneLeft) return;
                        const next = { [method.key]: !enabled };
                        setProfile((prev) => ({ ...prev, ...next }));
                        const ok = await updateProfile(next);
                        if (!ok) {
                          setProfile((prev) => ({ ...prev, [method.key]: enabled }));
                          toast.error("Could not save");
                        }
                      }}
                      className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        enabled ? "border-warm-green bg-warm-green/5" : "border-border bg-card hover:bg-muted/50"
                      } ${isOnlyOneLeft ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={`text-xs font-medium ${enabled ? "text-warm-green" : "text-foreground"}`}>{method.label}</p>
                        <span className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 ${enabled ? "border-warm-green bg-warm-green" : "border-muted-foreground/40"}`}>
                          {enabled && <Check className="w-2 h-2 text-white" />}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{method.desc}</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* On-demand: Pickup + Dine-in */
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  { key: "pickup_enabled" as const, label: "Pickup", desc: "Customer collects from you" },
                  { key: "dine_in_enabled" as const, label: "Dine-in", desc: "Served on the spot" },
                ] as const).map((method) => {
                  const enabled = !!(profile[method.key] ?? (method.key === "pickup_enabled"));
                  const isOnlyOneLeft =
                    method.key === "pickup_enabled"
                      ? enabled && !(profile.dine_in_enabled ?? false)
                      : enabled && !(profile.pickup_enabled ?? true);
                  return (
                    <button
                      key={method.key}
                      type="button"
                      onClick={async () => {
                        if (isOnlyOneLeft) return;
                        const next = { [method.key]: !enabled };
                        setProfile((prev) => ({ ...prev, ...next }));
                        const ok = await updateProfile(next);
                        if (!ok) {
                          setProfile((prev) => ({ ...prev, [method.key]: enabled }));
                          toast.error("Could not save");
                        }
                      }}
                      className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        enabled ? "border-warm-green bg-warm-green/5" : "border-border bg-card hover:bg-muted/50"
                      } ${isOnlyOneLeft ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={`text-xs font-medium ${enabled ? "text-warm-green" : "text-foreground"}`}>{method.label}</p>
                        <span className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 ${enabled ? "border-warm-green bg-warm-green" : "border-muted-foreground/40"}`}>
                          {enabled && <Check className="w-2 h-2 text-white" />}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{method.desc}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground">Switch any time. Past orders aren&rsquo;t affected.</p>
        </div>

        {/* Delivery rates — MY zone-rate matrix (peninsular/Sabah-Sarawak); hidden for ID
            (Indonesian provinces don't map to MY zones — pending an ID delivery-zone model) */}
        {(profile.delivery_enabled && profile.country !== "ID") && (
          <div className="border-t px-4 py-4 space-y-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Delivery rates</p>
            <p className="text-[10px] text-muted-foreground -mt-1">Caj auto-detect ikut negeri customer. Isi 0 untuk percuma; biarkan kosong kalau anda tak hantar ke zon itu.</p>
            <div className="space-y-2">
              {([
                { key: "peninsular" as const, label: "Semenanjung Malaysia" },
                { key: "sabah_sarawak" as const, label: "Sabah & Sarawak" },
              ] as const).map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-xs text-muted-foreground whitespace-nowrap flex-1">{label}</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">RM</span>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="0"
                      value={profile.delivery_rates?.[key] ?? ""}
                      onChange={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : undefined;
                        setProfile((prev) => ({
                          ...prev,
                          delivery_rates: { ...prev.delivery_rates, [key]: val },
                        }));
                      }}
                      className="w-20 h-8 px-2.5 text-sm text-right bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-background transition-colors placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={isSavingRates}
              onClick={async () => {
                setIsSavingRates(true);
                const rates = profile.delivery_rates ?? {};
                const ok = await updateProfile({ delivery_rates: rates as Record<string, number> });
                setIsSavingRates(false);
                if (ok) {
                  toast.success("Delivery rates saved");
                  track("delivery_rates_saved", { rates });
                } else {
                  toast.error("Could not save delivery rates");
                }
              }}
              className="h-8 px-4 rounded-lg bg-warm-green text-white text-xs font-semibold disabled:opacity-50 hover:bg-warm-green-hover transition-colors flex items-center gap-1.5"
            >
              {isSavingRates ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {isSavingRates ? "Saving..." : "Save rates"}
            </button>
          </div>
        )}

        {/* Order settings */}
        <div className="border-t px-4 py-4 space-y-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Order settings</p>

          <label className="flex items-center justify-between py-1">
            <span className="text-xs text-muted-foreground">Show time selection (booking)</span>
            <button
              type="button"
              onClick={async () => {
                const newVal = !profile.booking_enabled;
                const success = await updateProfile({ booking_enabled: newVal });
                if (success) {
                  setProfile((prev) => ({ ...prev, booking_enabled: newVal }));
                  track("booking_time_toggled", { enabled: newVal });
                }
              }}
              className={`relative w-9 h-5 rounded-full transition-colors ${profile.booking_enabled ? "bg-warm-green" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${profile.booking_enabled ? "translate-x-4" : ""}`} />
            </button>
          </label>

          <label className="flex items-center justify-between py-1">
            <span className="text-xs text-muted-foreground">Email me when a new order arrives</span>
            <button
              type="button"
              onClick={async () => {
                const newVal = !(profile.notify_new_order_email ?? true);
                const success = await updateProfile({ notify_new_order_email: newVal });
                if (success) {
                  setProfile((prev) => ({ ...prev, notify_new_order_email: newVal }));
                  track("notify_new_order_email_toggled", { enabled: newVal });
                }
              }}
              className={`relative w-9 h-5 rounded-full transition-colors ${(profile.notify_new_order_email ?? true) ? "bg-warm-green" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${(profile.notify_new_order_email ?? true) ? "translate-x-4" : ""}`} />
            </button>
          </label>

          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground whitespace-nowrap">Daily order cap</label>
            <input
              type="number"
              min={1}
              placeholder="Max/day"
              value={profile.daily_order_capacity ?? ""}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value) : null;
                if (val !== null && (isNaN(val) || val < 1)) return;
                setProfile((prev) => ({ ...prev, daily_order_capacity: val }));
              }}
              onBlur={async (e) => {
                const val = e.target.value ? parseInt(e.target.value) : null;
                if (val !== null && (isNaN(val) || val < 1)) return;
                const success = await updateDailyOrderCapacity(val);
                if (success) { track("daily_capacity_updated", { capacity: val }); }
              }}
              className="w-24 h-8 px-2.5 text-sm text-right bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-background transition-colors placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground whitespace-nowrap">Quiet hours</label>
            <div className="flex items-center gap-1.5">
              <input
                type="time"
                value={profile.quiet_hours_start ?? "22:00"}
                onChange={(e) => {
                  setProfile((prev) => ({ ...prev, quiet_hours_start: e.target.value }));
                }}
                onBlur={async (e) => {
                  const start = e.target.value;
                  await updateQuietHours(start, profile.quiet_hours_end ?? "06:00");
                  track("quiet_hours_updated", { start, end: profile.quiet_hours_end });
                }}
                className="w-[5.5rem] h-8 px-2 text-sm text-center bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-background transition-colors"
              />
              <span className="text-xs text-muted-foreground">—</span>
              <input
                type="time"
                value={profile.quiet_hours_end ?? "06:00"}
                onChange={(e) => {
                  setProfile((prev) => ({ ...prev, quiet_hours_end: e.target.value }));
                }}
                onBlur={async (e) => {
                  const end = e.target.value;
                  await updateQuietHours(profile.quiet_hours_start ?? "22:00", end);
                  track("quiet_hours_updated", { start: profile.quiet_hours_start, end });
                }}
                className="w-[5.5rem] h-8 px-2 text-sm text-center bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-background transition-colors"
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground -mt-1">Notifications silenced during quiet hours. Orders still come in.</p>

          <div className="flex items-center gap-3 pt-2 border-t border-dashed">
            <label className="text-xs text-muted-foreground whitespace-nowrap">Overhead estimate</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={80}
                step={5}
                value={profile.overhead_estimate_pct ?? 40}
                onChange={(e) => {
                  const val = e.target.value ? parseFloat(e.target.value) : 40;
                  if (val < 0 || val > 80) return;
                  setProfile((prev) => ({ ...prev, overhead_estimate_pct: val }));
                }}
                onBlur={async (e) => {
                  const val = e.target.value ? parseFloat(e.target.value) : 40;
                  if (val < 0 || val > 80) return;
                  await updateProfile({ overhead_estimate_pct: val });
                  track("overhead_estimate_updated", { pct: val });
                }}
                className="w-16 h-8 px-2.5 text-sm text-right bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-background transition-colors"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground -mt-1">Operating costs beyond raw materials (transport, rent, utilities, packaging). Used to calculate real margin on product pages.</p>
        </div>

        {/* Suggested next steps */}
        {hasSlug && missingItems.length > 0 && (
          <div className="border-t px-4 py-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Suggested next steps</p>
            <div className="space-y-1">
              {missingItems.map((item) => (
                <ChecklistItem key={item.label} done={false} label={item.label} href={item.href} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION: ORDER QUOTA ── */}
      <div className="rounded-lg border bg-card px-4 py-4 shadow-sm">
        <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Order quota</p>
        <div className="text-center my-3">
          <p className="text-3xl font-bold text-foreground leading-none">
            {unlimited || totalRemaining === Infinity ? "∞" : totalRemaining}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {unlimited ? "unlimited on Pro" : "orders left on Free"}
          </p>
        </div>
        {quotaExhausted && (
          <div className="rounded-lg bg-warm-green-light border border-warm-green/20 px-3 py-2 text-center">
            <p className="text-xs text-warm-green">
              You&rsquo;ve used your first 50 free orders. Go unlimited with Pro below.
            </p>
          </div>
        )}
      </div>

      {/* ── SECTION: PRO PLAN ── */}
      <div className="rounded-lg border bg-card px-4 py-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Pro plan</p>
        </div>
        {bisnisActive ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 px-2.5 text-xs font-medium rounded-full border border-blue-200 bg-blue-50 text-blue-700 items-center">Active</span>
              <span className="text-xs text-muted-foreground">
                until {new Date(profile.bisnis_until!).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            <Link href="/invoices" className="text-xs text-blue-600 font-medium hover:underline">
              Open invoices &rarr;
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Unlimited orders, voice and image order parsing, peer pricing whisper, and the silent compliance layer when you need it.
            </p>
            <div className="space-y-1.5 text-[11px] text-muted-foreground">
              <p className="flex items-center gap-1.5">✅ Unlimited orders, no quota nudge</p>
              <p className="flex items-center gap-1.5">✅ Voice + photo order parsing</p>
              <p className="flex items-center gap-1.5">✅ Pricing whisper from peer benchmarks</p>
              <p className="flex items-center gap-1.5">✅ Formal invoice + A4 PDF + WhatsApp send</p>
              <p className="flex items-center gap-1.5">✅ Receivables tracking + monthly recap</p>
              <p className="flex items-center gap-1.5 text-muted-foreground/80">✅ One-tap e-Faktur submit when you&rsquo;re ready</p>
            </div>
            {/* Annual — hero option (MY only; ID has no annual pricing tier) */}
            {profile.country !== "ID" && (
            <button
              onClick={handleBuyBisnisAnnual}
              disabled={isBuyingBisnis}
              className="w-full rounded-xl border-2 border-warm-green bg-warm-green/5 px-3.5 py-3 text-left hover:bg-warm-green/10 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-warm-green/10 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-warm-green" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-foreground">Pro · 1 year</p>
                      <span className="text-[10px] font-semibold text-warm-green bg-warm-green/10 px-1.5 py-0.5 rounded-full">Save 38%</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Rp {BISNIS_PRICE}/month · billed once</p>
                  </div>
                </div>
                <div className="text-right">
                  {isBuyingBisnis ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <p className="text-sm font-bold text-warm-green">Rp {BISNIS_PRICE_ANNUAL_TOTAL}</p>
                      <p className="text-[10px] text-muted-foreground">Billplz</p>
                    </>
                  )}
                </div>
              </div>
            </button>
            )}
            {/* Monthly — flexible option */}
            <button
              onClick={handleBuyBisnis}
              disabled={isBuyingBisnis}
              className="w-full rounded-xl border border-border bg-card px-3.5 py-3 text-left hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Pro · 1 month</p>
                    <p className="text-[10px] text-muted-foreground">Flexible — cancel anytime</p>
                  </div>
                </div>
                <div className="text-right">
                  {isBuyingBisnis ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <p className="text-sm font-bold text-foreground">{profile.country === "ID" ? "Rp 99.000" : `Rp ${BISNIS_PRICE_MONTHLY}`}</p>
                      <p className="text-[10px] text-muted-foreground">{profile.country === "ID" ? "Midtrans" : "Billplz"}</p>
                    </>
                  )}
                </div>
              </div>
            </button>
          </>
        )}
      </div>

      {/* ── SECTION: TAX IDENTITY ── */}
      {(bisnisActive || hasTaxInfo) && (
        <div className="rounded-lg border bg-card px-4 py-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Tax identity</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Used for the formal invoice and e-Faktur — leave blank if you don&rsquo;t issue e-invoices yet.
          </p>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="NPWP — e.g. 09.254.294.3-407.000"
              value={tinInput}
              onChange={(e) => setTinInput(e.target.value)}
              maxLength={25}
              className="w-full h-11 px-3 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors"
            />
            <input
              type="text"
              placeholder="NIB (Nomor Induk Berusaha) — e.g. 1234567890123"
              value={brnInput}
              onChange={(e) => setBrnInput(e.target.value)}
              maxLength={20}
              className="w-full h-11 px-3 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors"
            />
            <input
              type="text"
              placeholder="Nomor PKP (hanya jika sudah PKP)"
              value={sstIdInput}
              onChange={(e) => setSstIdInput(e.target.value)}
              maxLength={30}
              className="w-full h-11 px-3 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Default PPN rate on new invoices
            </label>
            <div className="flex items-center gap-1 bg-muted rounded-md p-0.5 w-fit">
              {([0, 11] as const).map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setDefaultSstRate(rate)}
                  className={`h-7 px-3 text-xs font-medium rounded transition-colors ${
                    defaultSstRate === rate
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {defaultSstRate === 0
                ? "Non-PKP / tidak memungut PPN (mayoritas UMKM)."
                : "PPN 11% (untuk PKP)."}
            </p>
          </div>
          <button
            onClick={handleSaveTax}
            disabled={isSavingTax}
            className="h-9 px-4 rounded-lg bg-warm-green text-white text-xs font-medium hover:bg-warm-green-hover disabled:opacity-50 transition-colors"
          >
            {isSavingTax ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </button>
        </div>
      )}

      {/* ── SECTION: ACCEPT PAYMENTS ── */}
      <AcceptPaymentsCard
        profile={profile}
        onProfileChange={(next) => setProfile((prev) => ({ ...prev, ...next }))}
      />

      {/* ── SECTION: STAFF ── */}
      <Link
        href="/settings/staff"
        className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm hover:bg-muted/50 transition-colors"
      >
        <Users className="w-4 h-4 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Staff</p>
          <p className="text-xs text-muted-foreground">Manage assistants and assign orders to them.</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </Link>

      {/* ── SECTION: REFERRAL ── */}
      {REFERRAL_ENABLED && profile.referral_code && (
        <div className="rounded-lg border bg-card px-4 py-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Referral</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Invite fellow Indonesian UMKM to Tokoflow. Earn{" "}
            <span className="font-semibold text-foreground">Rp 10.000</span> when they ship their first
            order + a <span className="font-semibold text-foreground">30% commission</span> on
            every payment they make for 6 months.
          </p>
          <div className="flex items-center h-11 bg-muted/50 border rounded-lg text-sm">
            <span className="text-muted-foreground shrink-0 pl-3 text-xs">tokoflow.com/register?ref=</span>
            <span className="font-mono font-medium text-foreground">{profile.referral_code}</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`https://tokoflow.com/register?ref=${profile.referral_code}`);
                setReferralCopied(true);
                toast.success("Referral link copied");
                setTimeout(() => setReferralCopied(false), 2000);
              }}
              className="shrink-0 h-9 px-3 mr-1 ml-auto rounded-md bg-warm-green text-white text-xs font-medium hover:bg-warm-green-hover transition-colors flex items-center gap-1.5"
            >
              {referralCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {referralCopied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-muted/50 p-2.5">
              <p className="text-sm font-semibold text-foreground">{referredUsers.length}</p>
              <p className="text-[10px] text-muted-foreground">Friends signed up</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5">
              <p className="text-sm font-semibold text-foreground">{formatRupiah(profile.referral_total_earned ?? 0)}</p>
              <p className="text-[10px] text-muted-foreground">Total commission</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5">
              <p className="text-sm font-semibold text-foreground">{formatRupiah(profile.referral_balance ?? 0)}</p>
              <p className="text-[10px] text-muted-foreground">Balance</p>
            </div>
          </div>
          {referredUsers.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Friends who signed up</p>
              <div className="divide-y divide-border rounded-lg border overflow-hidden">
                {referredUsers.map((u) => (
                  <div key={u.id} className="px-3 py-2 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{u.full_name || "—"}</p>
                      {u.business_name && <p className="text-[10px] text-muted-foreground truncate">{u.business_name}</p>}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {new Date(u.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION: ACCOUNT ── */}
      <div className="rounded-lg border bg-card shadow-sm divide-y divide-border">
        <button
          onClick={handleChangePassword}
          disabled={isSendingReset}
          className="w-full px-4 py-3 text-left hover:bg-muted/50 active:bg-muted transition-colors disabled:opacity-50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <KeyRound className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-foreground">Change password</span>
            </div>
            {isSendingReset && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
        </button>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="w-full px-4 py-3 text-left hover:bg-red-50 active:bg-red-100 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-red-600">Sign out</span>
            </div>
          </button>
        </form>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full px-4 py-3 text-left hover:bg-red-50 active:bg-red-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-sm font-medium text-red-500">Delete account</span>
          </div>
        </button>
        {profile.role === "admin" && (
          <Link href="/admin" className="block px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-foreground">Admin Panel</span>
            </div>
          </Link>
        )}
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Delete account?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                All data will be permanently removed: orders, products, customers, invoices, and profile. This cannot be undone.
              </p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                Type <span className="font-semibold text-foreground">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full h-10 px-3 mt-1 bg-card border rounded-lg text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                className="flex-1 h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== "DELETE" || isDeletingAccount}
                onClick={async () => {
                  setIsDeletingAccount(true);
                  try {
                    const res = await fetch("/api/auth/delete-account", { method: "POST" });
                    if (res.ok) {
                      toast.success("Account deleted");
                      router.push("/login");
                    } else {
                      toast.error("Could not delete account");
                    }
                  } catch {
                    toast.error("Something went wrong");
                  }
                  setIsDeletingAccount(false);
                }}
                className="flex-1 h-9 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeletingAccount ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      <aside className="hidden md:block">
        <div className="sticky top-4 space-y-3">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Your store</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Plan</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isBisnis(profile) ? "bg-warm-green-light text-warm-green" : "bg-muted text-muted-foreground"}`}>
                  {isBisnis(profile) ? "Pro" : "Free"}
                </span>
              </div>
              {profile.slug && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Store link</p>
                  <p className="text-xs font-medium text-foreground break-all">tokoflow.com/{profile.slug}</p>
                </div>
              )}
              {profile.slug && (
                <div className="border-t pt-3 space-y-2">
                  <a
                    href={`https://tokoflow.com/${profile.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full h-9 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    View store
                  </a>
                </div>
              )}
              {!isBisnis(profile) && (
                <div className={profile.slug ? "" : "border-t pt-3"}>
                  <p className="text-xs text-muted-foreground">
                    Upgrade to{" "}
                    <span className="font-semibold text-foreground">Pro</span>
                    {" "}for e-Faktur, unlimited orders, and more.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

    </div>
  );
}
