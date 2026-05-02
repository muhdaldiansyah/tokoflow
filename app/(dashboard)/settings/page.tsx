"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Pencil, KeyRound, LinkIcon, Copy, Check, Zap, Shield, ChevronRight, FileText, Trash2, Users } from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";
import { toast } from "sonner";
import { getProfile, updateProfile, updateSlug, updateOrderFormEnabled, updateDailyOrderCapacity, updateQuietHours } from "@/features/receipts/services/receipt.service";
import { isValidSlug, isReservedSlug, generateSlug } from "@/lib/utils/slug";
import { track } from "@/lib/analytics";
import { getOrdersRemaining, isOrderQuotaExhausted, isUnlimited, BISNIS_CODE, BISNIS_PRICE, isBisnis } from "@/config/plans";
import type { Profile } from "@/features/receipts/types/receipt.types";
import { createClient } from "@/lib/supabase/client";
import { getProducts } from "@/features/products/services/product.service";
import Link from "next/link";

// Billplz uses a hosted payment page — no SDK or popup script required.
// After `POST /api/billing/payments` we receive `{ url }` and redirect the
// merchant there. The webhook flips the plan active once payment clears.

function ChecklistItem({ done, label, href }: { done: boolean; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 py-1.5 group"
    >
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-warm-green" : "border-2 border-muted-foreground/30"}`}>
        {done && <Check className="w-3 h-3 text-white" />}
      </div>
      <span className={`text-sm flex-1 ${done ? "text-muted-foreground" : "text-foreground"}`}>
        {label}
      </span>
      {!done && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
    </Link>
  );
}

export default function SettingsPage() {
  const searchParamsHook = useSearchParams();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isBuyingBisnis, setIsBuyingBisnis] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Tax identity state — MY (LHDN) primary, NITKU retained only for legacy rows.
  const [tinInput, setTinInput] = useState("");
  const [brnInput, setBrnInput] = useState("");
  const [sstIdInput, setSstIdInput] = useState("");
  const [defaultSstRate, setDefaultSstRate] = useState<0 | 6>(0);
  const [isSavingTax, setIsSavingTax] = useState(false);

  // Order link state
  const [slugInput, setSlugInput] = useState("");
  const [isSavingSlug, setIsSavingSlug] = useState(false);
  const [slugError, setSlugError] = useState("");
  const [copied, setCopied] = useState(false);

  // Referral state
  const [referralCopied, setReferralCopied] = useState(false);
  const [referredUsers, setReferredUsers] = useState<{ id: string; full_name: string; business_name?: string; created_at: string }[]>([]);

  // Store setup state
  const [productCount, setProductCount] = useState(0);
  const [productsWithImage, setProductsWithImage] = useState(0);


  // Show toast if redirected with slug_taken (from OAuth callback)
  useEffect(() => {
    if (searchParamsHook.get("slug_taken") === "true") {
      toast.error("That link is already taken. Please pick another name.");
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParamsHook]);

  useEffect(() => {
    async function load() {
      const [data, products] = await Promise.all([
        getProfile(),
        getProducts(),
      ]);
      if (data) {
        setProfile(data);
        setSlugInput(data.slug || (data.business_name ? generateSlug(data.business_name) : ""));
        setTinInput(data.tin || data.npwp || "");
        setBrnInput(data.brn || "");
        setSstIdInput(data.sst_registration_id || "");
        setDefaultSstRate((data.default_sst_rate === 6 ? 6 : 0) as 0 | 6);

        // Load referred users if has referral code
        if (data.referral_code) {
          fetch("/api/referral/users").then(r => r.json()).then(users => {
            if (Array.isArray(users)) setReferredUsers(users);
          }).catch(() => {});
        }
      }
      setProductCount(products.length);
      setProductsWithImage(products.filter((p) => !!p.image_url).length);
      setIsLoading(false);
    }
    load();
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
      setProfile((prev) => prev ? { ...prev, slug: cleaned } : prev);
      track("slug_saved", { slug: cleaned });
      toast.success("Order link saved");
    } else {
      setSlugError(result.error || "Could not save");
    }
    setIsSavingSlug(false);
  }

  async function handleToggleOrderForm() {
    if (!profile) return;
    const newValue = !profile.order_form_enabled;
    const success = await updateOrderFormEnabled(newValue);
    if (success) {
      setProfile((prev) => prev ? { ...prev, order_form_enabled: newValue } : prev);
      track("order_form_toggled", { enabled: newValue });
      toast.success(newValue ? "Order link activated" : "Order link deactivated");
    } else {
      toast.error("Could not update setting");
    }
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/${profile?.slug || slugInput}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    track("link_copied", { slug: profile?.slug || slugInput });
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  // Shared Billplz flow: create a bill via /api/billing/payments, redirect to the
  // hosted payment page. When the merchant returns (or when the webhook fires),
  // the plan is already active. On this client we just optimistically navigate
  // to /pembayaran/pending while the redirect happens.
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
        // Redirect to Billplz-hosted payment page.
        window.location.href = url;
      } catch {
        toast.error("Something went wrong while starting payment");
        setLoading(false);
      }
    },
    [],
  );

  const handleBuyBisnis = useCallback(() => {
    track("bisnis_purchase_started", {});
    startBillplzCheckout(BISNIS_CODE, setIsBuyingBisnis);
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
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              tin: tin ?? null,
              brn: brn ?? null,
              sst_registration_id: sstId ?? null,
              default_sst_rate: defaultSstRate,
            }
          : prev,
      );
      track("tax_identity_saved", {});
      toast.success("Tax identity saved");
    } else {
      toast.error("Could not save");
    }
    setIsSavingTax(false);
  }

  const bisnisActive = profile ? isBisnis(profile) : false;

  const hasSlug = !!profile?.slug;

  // Derived order quota values
  const totalRemaining = profile ? getOrdersRemaining(profile) : 0;
  const quotaExhausted = profile ? isOrderQuotaExhausted(profile) : false;
  const unlimited = profile ? isUnlimited(profile) : false;
  const hasTaxInfo = !!(profile?.tin || profile?.brn || profile?.sst_registration_id);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div><h1 className="text-lg font-semibold text-foreground">Settings</h1></div>

        {/* Profile Card Skeleton */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-muted animate-pulse rounded w-32" />
                <div className="h-3 bg-muted animate-pulse rounded w-48" />
              </div>
              <div className="h-8 w-16 bg-muted animate-pulse rounded-lg" />
            </div>
          </div>
          <div className="border-t px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 bg-muted animate-pulse rounded w-24" />
              <div className="h-6 w-11 bg-muted animate-pulse rounded-full" />
            </div>
            <div className="h-11 bg-muted animate-pulse rounded-lg" />
            <div className="flex items-center gap-2">
              <div className="h-9 w-16 bg-muted animate-pulse rounded-lg" />
              <div className="h-9 w-28 bg-muted animate-pulse rounded-lg" />
            </div>
          </div>
        </div>

        {/* Kuota Card Skeleton */}
        <div className="rounded-lg border bg-card px-4 py-4 shadow-sm space-y-3">
          <div className="h-3 bg-muted animate-pulse rounded w-28" />
          <div className="flex flex-col items-center gap-1 py-2">
            <div className="h-9 w-14 bg-muted animate-pulse rounded" />
            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="h-3 bg-muted animate-pulse rounded w-24" />
              <div className="h-3 bg-muted animate-pulse rounded w-12" />
            </div>
            <div className="h-2 bg-muted animate-pulse rounded-full" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-16 bg-muted animate-pulse rounded-xl" />
            <div className="h-16 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>

        {/* Account Card Skeleton */}
        <div className="rounded-lg border bg-card shadow-sm divide-y divide-border">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-4 h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 w-28 bg-muted animate-pulse rounded" />
          </div>
          <div className="px-4 py-3">
            <div className="h-4 w-14 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Incomplete checklist items (only show what's missing)
  const missingItems: { label: string; href: string }[] = [];
  if (!profile?.logo_url) missingItems.push({ label: "Add a profile photo / logo", href: "/profil/edit" });
  if (!profile?.business_address) missingItems.push({ label: "Add your business address", href: "/profil/edit" });
  if (!profile?.business_phone) missingItems.push({ label: "Add your business WhatsApp number", href: "/profil/edit" });
  if (!profile?.qris_url) missingItems.push({ label: "Upload your DuitNow QR", href: "/profil/edit" });
  if (productCount === 0) missingItems.push({ label: "Add your first product", href: "/products" });
  if (productCount > 0 && productsWithImage < productCount) missingItems.push({ label: `${productCount - productsWithImage} products missing a photo`, href: "/products" });

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center min-h-9">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground">Store profile, order link, and preferences</p>
        </div>
      </div>

      {/* ── SECTION 1: TOKO KAMU ── */}
      <div className="rounded-lg border bg-card shadow-sm">
        {/* Profile preview + edit */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-full bg-warm-green/10 flex items-center justify-center shrink-0 overflow-hidden">
              {profile?.logo_url ? (
                <Image src={profile.logo_url} alt="" fill className="object-cover" sizes="48px" />
              ) : (
                <span className="text-base font-semibold text-warm-green">
                  {(profile?.business_name || profile?.full_name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {profile?.business_name || profile?.full_name || "Not set"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {[profile?.business_phone, profile?.email].filter(Boolean).join(" \u00b7 ") || "Complete your business profile"}
              </p>
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
                profile?.order_form_enabled !== false ? "bg-warm-green" : "bg-muted"
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                profile?.order_form_enabled !== false ? "translate-x-5" : "translate-x-0"
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
                disabled={isSavingSlug || slugInput === profile?.slug}
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
                href={`/${profile?.slug}`}
                className="h-9 px-3 flex items-center gap-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors ml-auto"
              >
                Preview
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Store mode — pick one. Drives which fields show on the public order form
            (delivery date for pre-order, dine-in tags, recurring billing for subscription).
            Set initially by /setup based on category; merchant changes here when their model evolves. */}
        <div className="border-t px-4 py-4 space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Store mode</p>
          <div className="grid grid-cols-3 gap-1.5">
            {([
              { key: "preorder", label: "Pre-order", desc: "Delivery date" },
              { key: "dine_in", label: "Walk-in", desc: "On-the-spot" },
              { key: "langganan", label: "Subscription", desc: "Recurring" },
            ] as const).map((mode) => {
              const active =
                (mode.key === "preorder" && (profile?.preorder_enabled ?? true) && !profile?.dine_in_enabled && !profile?.langganan_enabled) ||
                (mode.key === "dine_in" && profile?.dine_in_enabled && !profile?.langganan_enabled) ||
                (mode.key === "langganan" && profile?.langganan_enabled);
              return (
                <button
                  key={mode.key}
                  type="button"
                  onClick={async () => {
                    if (!profile) return;
                    const next = {
                      preorder_enabled: mode.key === "preorder",
                      dine_in_enabled: mode.key === "dine_in",
                      langganan_enabled: mode.key === "langganan",
                    };
                    setProfile((prev) => prev ? { ...prev, ...next } : prev);
                    const ok = await updateProfile(next);
                    if (ok) {
                      track("store_mode_changed", { mode: mode.key });
                      toast.success(`Mode: ${mode.label}`);
                    } else {
                      toast.error("Could not save");
                    }
                  }}
                  className={`rounded-lg border px-2 py-2.5 text-left transition-colors ${
                    active
                      ? "border-warm-green bg-warm-green/5"
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                >
                  <p className={`text-xs font-medium ${active ? "text-warm-green" : "text-foreground"}`}>{mode.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{mode.desc}</p>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground">Switch any time. Past orders aren&rsquo;t affected.</p>
        </div>

        {/* Order settings */}
        <div className="border-t px-4 py-4 space-y-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Order settings</p>

          {/* Booking time toggle */}
          <label className="flex items-center justify-between py-1">
            <span className="text-xs text-muted-foreground">Show time selection (booking)</span>
            <button
              type="button"
              onClick={async () => {
                if (!profile) return;
                const newVal = !profile.booking_enabled;
                const success = await updateProfile({ booking_enabled: newVal });
                if (success) {
                  setProfile((prev) => prev ? { ...prev, booking_enabled: newVal } : prev);
                  track("booking_time_toggled", { enabled: newVal });
                }
              }}
              className={`relative w-9 h-5 rounded-full transition-colors ${profile?.booking_enabled ? "bg-warm-green" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${profile?.booking_enabled ? "translate-x-4" : ""}`} />
            </button>
          </label>

          {/* New-order email toggle. Default ON (migration 085). Email send lives in
              app/api/public/orders/route.ts and respects this flag. */}
          <label className="flex items-center justify-between py-1">
            <span className="text-xs text-muted-foreground">Email me when a new order arrives</span>
            <button
              type="button"
              onClick={async () => {
                if (!profile) return;
                const newVal = !(profile.notify_new_order_email ?? true);
                const success = await updateProfile({ notify_new_order_email: newVal });
                if (success) {
                  setProfile((prev) => prev ? { ...prev, notify_new_order_email: newVal } : prev);
                  track("notify_new_order_email_toggled", { enabled: newVal });
                }
              }}
              className={`relative w-9 h-5 rounded-full transition-colors ${(profile?.notify_new_order_email ?? true) ? "bg-warm-green" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${(profile?.notify_new_order_email ?? true) ? "translate-x-4" : ""}`} />
            </button>
          </label>

          {/* Daily capacity */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground whitespace-nowrap">Daily order cap</label>
            <input
              type="number"
              min={1}
              placeholder="Max/day"
              value={profile?.daily_order_capacity ?? ""}
              onChange={async (e) => {
                const val = e.target.value ? parseInt(e.target.value) : null;
                if (val !== null && (isNaN(val) || val < 1)) return;
                setProfile((prev) => prev ? { ...prev, daily_order_capacity: val } : prev);
                const success = await updateDailyOrderCapacity(val);
                if (success) { track("daily_capacity_updated", { capacity: val }); }
              }}
              className="w-24 h-8 px-2.5 text-sm text-right bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-background transition-colors placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Quiet hours / rest mode */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground whitespace-nowrap">Quiet hours</label>
            <div className="flex items-center gap-1.5">
              <input
                type="time"
                value={profile?.quiet_hours_start ?? "22:00"}
                onChange={async (e) => {
                  const start = e.target.value;
                  setProfile((prev) => prev ? { ...prev, quiet_hours_start: start } : prev);
                  await updateQuietHours(start, profile?.quiet_hours_end ?? "06:00");
                  track("quiet_hours_updated", { start, end: profile?.quiet_hours_end });
                }}
                className="w-[5.5rem] h-8 px-2 text-sm text-center bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-background transition-colors"
              />
              <span className="text-xs text-muted-foreground">—</span>
              <input
                type="time"
                value={profile?.quiet_hours_end ?? "06:00"}
                onChange={async (e) => {
                  const end = e.target.value;
                  setProfile((prev) => prev ? { ...prev, quiet_hours_end: end } : prev);
                  await updateQuietHours(profile?.quiet_hours_start ?? "22:00", end);
                  track("quiet_hours_updated", { start: profile?.quiet_hours_start, end });
                }}
                className="w-[5.5rem] h-8 px-2 text-sm text-center bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-background transition-colors"
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground -mt-1">Notifications silenced during quiet hours. Orders still come in.</p>

          {/* Overhead estimate */}
          <div className="flex items-center gap-3 pt-2 border-t border-dashed">
            <label className="text-xs text-muted-foreground whitespace-nowrap">Overhead estimate</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={80}
                step={5}
                value={profile?.overhead_estimate_pct ?? 40}
                onChange={async (e) => {
                  const val = e.target.value ? parseFloat(e.target.value) : 40;
                  if (val < 0 || val > 80) return;
                  setProfile((prev) => prev ? { ...prev, overhead_estimate_pct: val } : prev);
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

        {/* Suggested next steps — listed without a count to avoid completion-% guilt. */}
        {hasSlug && missingItems.length > 0 && (
          <div className="border-t px-4 py-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Suggested next steps
            </p>
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
        <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Orders this month</p>

        <div className="text-center my-3">
          <p className="text-3xl font-bold text-foreground leading-none">
            {unlimited || totalRemaining === Infinity ? "\u221e" : totalRemaining}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {unlimited ? "unlimited on Pro" : "orders left on the free tier"}
          </p>
        </div>

        {quotaExhausted && (
          <div className="rounded-lg bg-warm-green-light border border-warm-green/20 px-3 py-2 text-center">
            <p className="text-xs text-warm-green">
              You&rsquo;ve passed 50 orders this month. Go unlimited with Pro below.
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
              <span className="inline-flex h-6 px-2.5 text-xs font-medium rounded-full border border-blue-200 bg-blue-50 text-blue-700 items-center">
                Active
              </span>
              <span className="text-xs text-muted-foreground">
                until {new Date(profile!.bisnis_until!).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })}
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
              <p className="flex items-center gap-1.5 text-muted-foreground/80">✅ One-tap LHDN MyInvois submit when you&rsquo;re ready</p>
            </div>
            <button
              onClick={handleBuyBisnis}
              disabled={isBuyingBisnis}
              className="w-full rounded-xl border-2 border-warm-green/30 bg-warm-green/5 px-3.5 py-3 text-left hover:bg-warm-green/10 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-warm-green/10 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-warm-green" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Pro · 1 month</p>
                    <p className="text-[10px] text-muted-foreground">~1 hour saved per day, all month</p>
                  </div>
                </div>
                <div className="text-right">
                  {isBuyingBisnis ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <p className="text-sm font-bold text-warm-green">RM {BISNIS_PRICE}</p>
                      <p className="text-[10px] text-muted-foreground">Billplz</p>
                    </>
                  )}
                </div>
              </div>
            </button>
          </>
        )}
      </div>

      {/* ── SECTION: TAX IDENTITY ── */}
      {/*
        Gated to Pro merchants and to anyone who already entered tax info.
        Free-tier merchants don't see this until they actually need it
        (silent superpower discipline — see docs/positioning/03-features.md).
      */}
      {(bisnisActive || hasTaxInfo) && (
      <div className="rounded-lg border bg-card px-4 py-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
            Tax identity
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Used for the formal invoice and LHDN submission — leave blank if you don&rsquo;t file e-invoices yet.
        </p>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="TIN (LHDN Taxpayer ID) — e.g. C25805324050"
            value={tinInput}
            onChange={(e) => setTinInput(e.target.value)}
            maxLength={20}
            className="w-full h-11 px-3 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors"
          />
          <input
            type="text"
            placeholder="BRN (Sdn Bhd registration) — e.g. 202301012345"
            value={brnInput}
            onChange={(e) => setBrnInput(e.target.value)}
            maxLength={20}
            className="w-full h-11 px-3 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors"
          />
          <input
            type="text"
            placeholder="SST registration id (only if you're SST-registered)"
            value={sstIdInput}
            onChange={(e) => setSstIdInput(e.target.value)}
            maxLength={30}
            className="w-full h-11 px-3 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Default SST rate on new invoices
          </label>
          <div className="flex items-center gap-1 bg-muted rounded-md p-0.5 w-fit">
            {([0, 6] as const).map((rate) => (
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
              ? "Exempt / zero-rated goods (most retail)."
              : "Service tax (F&B, services, digital)."}
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

      {/* ── SECTION: STAFF ── */}
      <Link
        href="/settings/staff"
        className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm hover:bg-muted/50 transition-colors"
      >
        <Users className="w-4 h-4 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Staff</p>
          <p className="text-xs text-muted-foreground">
            Manage assistants and assign orders to them.
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </Link>

      {/* ── SECTION: REFERRAL ── */}
      {profile?.referral_code && (
        <div className="rounded-lg border bg-card px-4 py-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Referral</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Invite fellow Malaysian SMBs to Tokoflow. Earn{" "}
            <span className="font-semibold text-foreground">RM 2</span> when they ship their first
            order + a <span className="font-semibold text-foreground">30% commission</span> on
            every payment they make for 6 months.
          </p>

          {/* Referral link */}
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
              {referralCopied ? "Disalin" : "Salin"}
            </button>
          </div>

          {/* Stats */}
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

          {/* Referred users list */}
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
                      {new Date(u.created_at).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 4: AKUN ── */}
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
          <button
            type="submit"
            className="w-full px-4 py-3 text-left hover:bg-red-50 active:bg-red-100 transition-colors"
          >
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
        {profile?.role === "admin" && (
          <Link
            href="/admin"
            className="block px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors"
          >
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
  );
}


