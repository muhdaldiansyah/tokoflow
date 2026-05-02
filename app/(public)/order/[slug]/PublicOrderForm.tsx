"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Loader2, MapPin, Phone, QrCode, ShoppingBag, ImageIcon, CalendarDays, ChevronLeft, ChevronRight, ChevronDown, X, Clock, Store, Share2 } from "lucide-react";
import { formatPhoneForWA } from "@/lib/utils/phone";
import { validatePhone, normalizePhoneForStorage } from "@/components/PhoneInput";
import { avatarColors } from "@/lib/utils/avatar-color";
import type { PublicFrequentItem } from "@/lib/services/public-order.service";

interface PublicOrderFormProps {
  slug: string;
  businessName: string;
  frequentItems: PublicFrequentItem[];
  logoUrl?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessDescription?: string;
  businessCategory?: string;
  businessCategoryId?: string;
  city?: string;
  citySlug?: string;
  operatingHours?: Record<string, { open: string; close: string; closed?: boolean }> | null;
  completedOrders: number;
  repeatCustomerPct: number;
  memberSince?: string;
  hasQris: boolean;
  qrisUrl?: string;
  preorderEnabled?: boolean;
  langgananEnabled?: boolean;
  dailyOrderCapacity?: number | null;
  businessId: string;
}

export function PublicOrderForm({ slug, businessName, frequentItems, logoUrl, businessAddress, businessPhone, businessDescription, businessCategory, businessCategoryId, city, citySlug, operatingHours, completedOrders, repeatCustomerPct, memberSince, hasQris, qrisUrl, preorderEnabled, langgananEnabled, dailyOrderCapacity, businessId }: PublicOrderFormProps) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pastOrders, setPastOrders] = useState<
    { id: string; order_number: string; items: { name: string; price: number; qty: number }[]; total: number; created_at: string }[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFetchedFor, setHistoryFetchedFor] = useState<string>("");
  const [itemQtys, setItemQtys] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showQris, setShowQris] = useState(false);
  const [isReturningCustomer, setIsReturningCustomer] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [capacityRemaining, setCapacityRemaining] = useState<number | null>(null);
  const [capacityFull, setCapacityFull] = useState(false);

  // Honeypot
  const [honeypot, setHoneypot] = useState("");

  // Referral source detection (from directory or other)
  const [referralSource] = useState(() => {
    if (typeof window === "undefined") return undefined;
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("from") || undefined;
    } catch { return undefined; }
  });

  // Calendar picker state
  const [showCalendar, setShowCalendar] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const calendarRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLDivElement>(null);
  const customerRef = useRef<HTMLDivElement>(null);

  // Restore saved customer info from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`tokoflow_customer_${slug}`);
      if (saved) {
        const { name, phone } = JSON.parse(saved);
        if (name) { setCustomerName(name); setIsReturningCustomer(true); }
        if (phone) setCustomerPhone(phone);
      }
    } catch { /* localStorage unavailable */ }
  }, [slug]);

  // Track page view (once per session)
  useEffect(() => {
    try {
      const key = `tokoflow_viewed_${slug}`;
      if (sessionStorage.getItem(key)) return; // already tracked this session
      sessionStorage.setItem(key, "1");

      // Generate session ID
      let sessionId = sessionStorage.getItem("tokoflow_sid");
      if (!sessionId) {
        sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem("tokoflow_sid", sessionId);
      }

      // Detect referrer
      const ref = document.referrer;
      let referrer = "langsung";
      if (ref.includes("wa.me") || ref.includes("whatsapp") || ref.includes("l.wl.co")) referrer = "whatsapp";
      else if (ref.includes("instagram") || ref.includes("l.instagram.com")) referrer = "instagram";
      else if (ref.includes("tiktok")) referrer = "tiktok";
      else if (ref.includes("facebook") || ref.includes("fb.")) referrer = "facebook";
      else if (ref && !ref.includes("tokoflow")) referrer = "lainnya";

      // Product names for product_view tracking
      const products = frequentItems.map(fi => fi.name);

      fetch("/api/public/page-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, sessionId, referrer, products }),
      }).catch(() => {}); // fire and forget
    } catch { /* sessionStorage unavailable */ }
  }, [slug, frequentItems]);

  // Close calendar on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Check capacity when delivery date changes
  useEffect(() => {
    if (!deliveryDate || dailyOrderCapacity === null || dailyOrderCapacity === undefined) {
      setCapacityRemaining(null);
      setCapacityFull(false);
      return;
    }
    fetch(`/api/public/capacity?userId=${businessId}&date=${deliveryDate}`)
      .then(r => r.json())
      .then(data => {
        if (data.capacity !== null) {
          setCapacityRemaining(data.remaining);
          setCapacityFull(data.remaining <= 0);
        } else {
          setCapacityRemaining(null);
          setCapacityFull(false);
        }
      })
      .catch(() => {
        setCapacityRemaining(null);
        setCapacityFull(false);
      });
  }, [deliveryDate, dailyOrderCapacity, businessId]);

  // Lookup past orders whenever the customer types a plausible phone.
  useEffect(() => {
    const digits = customerPhone.replace(/\D/g, "");
    if (digits.length < 9) {
      setPastOrders([]);
      setHistoryFetchedFor("");
      return;
    }
    if (digits === historyFetchedFor) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setHistoryLoading(true);
      try {
        const res = await fetch(
          `/api/public/order-history?slug=${encodeURIComponent(slug)}&phone=${encodeURIComponent(customerPhone)}`,
        );
        if (!cancelled && res.ok) {
          const data = await res.json();
          setPastOrders(Array.isArray(data.orders) ? data.orders : []);
          setHistoryFetchedFor(digits);
        }
      } catch {
        /* non-fatal */
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [customerPhone, slug, historyFetchedFor]);

  function reorderFromPast(items: { name: string; qty: number }[]) {
    const next: Record<string, number> = {};
    for (const it of items) {
      if (!it.name) continue;
      next[it.name] = (next[it.name] || 0) + (it.qty || 1);
    }
    setItemQtys((prev) => ({ ...prev, ...next }));
  }

  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function getCalendarDays(year: number, month: number) {
    const firstDay = new Date(year, month, 1);
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }

  // Min date for calendar: today for regular, tomorrow for preorder
  const minDate = preorderEnabled
    ? new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1)
    : new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  // Parse selected date from string
  const selectedDateObj = deliveryDate ? new Date(deliveryDate + "T00:00") : null;

  function formatSelectedDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00");
    return d.toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" });
  }

  const hasMenuItems = frequentItems.length > 0;
  const anyHasImage = frequentItems.some((fi) => !!fi.image_url);
  const selectedItems = frequentItems.filter((fi) => (itemQtys[fi.name] || 0) > 0);
  const hasItems = selectedItems.length > 0;
  const subtotal = selectedItems.reduce((sum, fi) => sum + fi.price * (itemQtys[fi.name] || 0), 0);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, PublicFrequentItem[]> = {};
    const uncategorized: PublicFrequentItem[] = [];

    for (const fi of frequentItems) {
      if (fi.category) {
        if (!groups[fi.category]) groups[fi.category] = [];
        groups[fi.category].push(fi);
      } else {
        uncategorized.push(fi);
      }
    }

    const result: { category: string | null; items: PublicFrequentItem[] }[] = [];
    const sortedCats = Object.keys(groups).sort();
    for (const cat of sortedCats) {
      result.push({ category: cat, items: groups[cat] });
    }
    if (uncategorized.length > 0) {
      result.push({ category: null, items: uncategorized });
    }
    return result;
  }, [frequentItems]);

  const hasCategories = groupedItems.some((g) => g.category !== null);

  // Terlaris/Pilihan Toko: only show if store has orders AND enough items
  const terlarisItems = useMemo(() => {
    if (completedOrders === 0) return []; // No orders yet = no terlaris/pilihan
    if (frequentItems.length <= 4) return []; // Too few items to separate
    return frequentItems.filter(fi => fi.stock === null || fi.stock === undefined || fi.stock > 0).slice(0, 3);
  }, [frequentItems, completedOrders]);

  // Items excluding terlaris (to avoid duplicates)
  const terlarisNames = useMemo(() => new Set(terlarisItems.map(fi => fi.name)), [terlarisItems]);
  const catalogItems = useMemo(() => frequentItems.filter(fi => !terlarisNames.has(fi.name)), [frequentItems, terlarisNames]);

  // Grouped catalog items (excluding terlaris)
  const groupedCatalogItems = useMemo(() => {
    const groups: Record<string, PublicFrequentItem[]> = {};
    const uncategorized: PublicFrequentItem[] = [];
    for (const fi of catalogItems) {
      if (fi.category) {
        if (!groups[fi.category]) groups[fi.category] = [];
        groups[fi.category].push(fi);
      } else {
        uncategorized.push(fi);
      }
    }
    const result: { category: string | null; items: PublicFrequentItem[] }[] = [];
    for (const cat of Object.keys(groups).sort()) {
      result.push({ category: cat, items: groups[cat] });
    }
    if (uncategorized.length > 0) result.push({ category: null, items: uncategorized });
    return result;
  }, [catalogItems]);

  function updateQty(item: PublicFrequentItem, delta: number) {
    setItemQtys((prev) => {
      const current = prev[item.name] || 0;
      const minQty = item.min_order_qty || 1;
      let next = current + delta;

      // If adding first time, start at min order qty
      if (current === 0 && delta > 0) {
        next = minQty;
      }
      // If going below min, remove entirely
      if (next > 0 && next < minQty) {
        next = 0;
      }
      // Cap at stock if tracked
      if (item.stock !== null && item.stock !== undefined && next > item.stock) {
        next = item.stock;
      }

      next = Math.max(0, next);
      return { ...prev, [item.name]: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    const errors: Record<string, string> = {};
    if (!customerName.trim()) errors.name = "Name is required";
    const phoneError = validatePhone(customerPhone);
    if (phoneError) errors.phone = phoneError;
    if (preorderEnabled && !langgananEnabled && !deliveryDate) errors.date = "Pick a delivery date";
    if (!hasItems && !notes.trim()) errors.items = "Pick an item or describe your order";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.name || errors.phone || errors.date) {
        customerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    setError("");

    const items = selectedItems.map((fi) => ({
      name: fi.name,
      qty: itemQtys[fi.name] || 1,
      price: fi.price,
    }));

    try {
      const res = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          customerName: customerName.trim(),
          customerPhone: normalizePhoneForStorage(customerPhone),
          items,
          notes: notes.trim(),
          deliveryDate: deliveryDate || undefined,
          referralSource, // directory attribution
          website: honeypot, // honeypot field
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not submit your order");
        setIsSubmitting(false);
        return;
      }

      // Persist customer info for repeat orders
      try {
        localStorage.setItem(`tokoflow_customer_${slug}`, JSON.stringify({
          name: customerName.trim(),
          phone: customerPhone.trim(),
        }));
      } catch { /* localStorage unavailable */ }

      // Store order details for success page
      try {
        sessionStorage.setItem("tokoflow_last_order", JSON.stringify({
          orderNumber: data.orderNumber,
          orderId: data.orderId,
          items,
          total: subtotal,
          notes: notes.trim(),
          customerName: customerName.trim(),
          deliveryDate: deliveryDate || undefined,
          isPreorder: preorderEnabled || false,
          isLangganan: langgananEnabled || false,
        }));
      } catch { /* sessionStorage unavailable — success page degrades gracefully */ }

      const phoneParam = businessPhone ? `&phone=${encodeURIComponent(businessPhone)}` : "";
      const orderIdParam = data.orderId ? `&oid=${encodeURIComponent(data.orderId)}` : "";
      const totalParam = subtotal > 0 ? `&total=${subtotal}` : "";
      const preorderParam = preorderEnabled ? "&preorder=1" : "";
      const langgananParam = langgananEnabled ? "&langganan=1" : "";
      router.push(`/${slug}/sukses?name=${encodeURIComponent(businessName)}&order=${encodeURIComponent(data.orderNumber)}${phoneParam}${orderIdParam}${totalParam}${preorderParam}${langgananParam}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  const totalItemCount = selectedItems.reduce((sum, fi) => sum + (itemQtys[fi.name] || 0), 0);

  // Category emoji mapping for visual warmth without photos
  function getCategoryEmoji(name: string, category?: string): string {
    const text = (category || name).toLowerCase();
    if (text.match(/nasi|rice|box/)) return "🍚";
    if (text.match(/minum|drink|es |jus|kopi|teh/)) return "🥤";
    if (text.match(/snack|cemilan|keripik/)) return "🍿";
    if (text.match(/kue|cake|tart|brownies|roti|donat|pastry|cookies/)) return "🍰";
    if (text.match(/sayur|vegetable|salad/)) return "🥬";
    if (text.match(/ayam|chicken/)) return "🍗";
    if (text.match(/sate|satay/)) return "🍢";
    if (text.match(/mie|noodle|bakso/)) return "🍜";
    if (text.match(/sambal|sauce|bumbu/)) return "🌶️";
    if (text.match(/hampers|gift|parcel/)) return "🎁";
    return "🍽️";
  }

  function renderItemCard(fi: PublicFrequentItem) {
    const qty = itemQtys[fi.name] || 0;
    const isActive = qty > 0;
    const isOutOfStock = fi.stock !== null && fi.stock !== undefined && fi.stock <= 0;
    const isLowStock = fi.stock !== null && fi.stock !== undefined && fi.stock > 0 && fi.stock <= 20;
    const atMax = fi.stock !== null && fi.stock !== undefined && qty >= fi.stock;

    // List mode (no photos) = compact horizontal row
    // Grid mode (has photos) = card with image
    if (!anyHasImage) {
      return (
        <div
          key={fi.name}
          role="button"
          tabIndex={isOutOfStock ? -1 : 0}
          onClick={() => !isOutOfStock && updateQty(fi, 1)}
          className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors squish-press select-none ${
            isOutOfStock
              ? "bg-white border-zinc-100 opacity-50 cursor-not-allowed"
              : isActive
                ? "bg-warm-green-light border-warm-green/30 ring-1 ring-warm-green/20 cursor-pointer"
                : "bg-white border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50/50 cursor-pointer"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="text-lg shrink-0">{getCategoryEmoji(fi.name, fi.category || undefined)}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{fi.name}</p>
              <p className="text-xs text-muted-foreground">
                RM {fi.price.toLocaleString("en-MY")}
                {fi.unit && <span> / {fi.unit}</span>}
                {isLowStock && !isOutOfStock && <span className="text-warm-rose ml-2">{fi.stock} left</span>}
                {isOutOfStock && <span className="text-muted-foreground ml-2">Habis</span>}
              </p>
            </div>
          </div>
          {isActive ? (
            <div className="flex items-center gap-1.5 shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => updateQty(fi, -1)} className="w-7 h-7 flex items-center justify-center rounded-full border border-[#1a4d35]/30 bg-white text-[#1a4d35]">
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-sm font-bold text-foreground w-5 text-center">{qty}</span>
              <button type="button" onClick={() => updateQty(fi, 1)} disabled={atMax} className="w-7 h-7 flex items-center justify-center rounded-full bg-[#1a4d35] text-white disabled:opacity-30">
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="shrink-0 ml-3">
              <Plus className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
        </div>
      );
    }

    // Grid mode (with photos) — original card layout
    return (
      <div
        key={fi.name}
        role="button"
        tabIndex={isOutOfStock ? -1 : 0}
        onClick={() => !isOutOfStock && updateQty(fi, 1)}
        className={`relative text-left rounded-lg border p-2 transition-colors squish-press select-none ${
          isOutOfStock
            ? "bg-white border-zinc-100 opacity-50 cursor-not-allowed"
            : isActive
              ? "bg-warm-green-light border-warm-green/30 ring-1 ring-warm-green/20 cursor-pointer"
              : "bg-white border-zinc-100 hover:border-zinc-200 cursor-pointer"
        }`}
      >
        <div className="w-full text-left">
          <div className="relative w-full aspect-square rounded-lg overflow-hidden shrink-0 mb-2">
            {fi.image_url ? (
              <Image src={fi.image_url} alt="" fill className="object-cover" sizes="(max-width: 512px) 45vw, 200px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-warm-green-light/50 to-muted/30">
                <ImageIcon className="w-8 h-8 text-muted-foreground/20" />
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground bg-background/80 px-2 py-1 rounded">Habis</span>
              </div>
            )}
          </div>
          <div className="w-full min-w-0">
            <p className="text-sm font-medium truncate text-foreground">{fi.name}</p>
            {fi.description && (
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{fi.description}</p>
            )}
            <div className="flex items-center gap-1 mt-1">
              {fi.price > 0 && (
                <p className="text-xs text-muted-foreground">
                  RM {fi.price.toLocaleString("en-MY")}
                  {fi.unit && <span> / {fi.unit}</span>}
                </p>
              )}
              {isLowStock && !isOutOfStock && <span className="text-[10px] text-warm-rose ml-auto">{fi.stock} left</span>}
              {isOutOfStock && <span className="text-[10px] text-muted-foreground ml-auto">Habis</span>}
            </div>
          </div>
        </div>
        {/* Qty controls */}
        <div className={`flex items-center gap-2 mt-2 h-10 transition-opacity duration-150 ${isActive ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => updateQty(fi, -1)} aria-label={`Decrease ${fi.name} quantity`} className="w-8 h-8 flex items-center justify-center rounded-full border border-[#1a4d35]/30 bg-white text-[#1a4d35] hover:bg-[#1a4d35]/5 transition-colors">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm font-bold text-foreground w-6 text-center">{qty}</span>
          <button type="button" onClick={() => updateQty(fi, 1)} disabled={atMax} aria-label={`Increase ${fi.name} quantity`} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a4d35] text-white hover:bg-[#1a4d35]/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
          {fi.min_order_qty > 1 && <span className="text-[10px] text-muted-foreground">Min. {fi.min_order_qty}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-lg mx-auto ${hasItems ? "pb-32" : ""}`}>
      {/* Top bar — navigation + context + share */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex flex-col gap-0.5">
          <Link
            href="/"
            className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Tokoflow</span>
          </Link>
          {(businessCategory || city) && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70 pl-4">
              {businessCategory && <span>{businessCategory}</span>}
              {businessCategory && city && <span>·</span>}
              {city && <span>{city}</span>}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={async () => {
            const url = `https://tokoflow.com/${slug}`;
            if (navigator.share) {
              try {
                await navigator.share({ title: businessName, text: `Order from ${businessName}`, url });
              } catch { /* user cancelled */ }
            } else {
              await navigator.clipboard.writeText(url);
              alert("Link copied!");
            }
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Share"
        >
          <Share2 className="w-4 h-4 text-muted-foreground/60" />
        </button>
      </div>

      {/* Hero header — white background lets the merchant's brand be the
          surface, not Tokoflow's. Avatar color is hashed from the merchant
          name so each shop gets a stable, distinct tint without ever
          stamping Tokoflow's green. */}
      <div className="px-4 pt-10 pb-6 text-center">
        <div
          className={`relative w-[72px] h-[72px] rounded-full ${
            logoUrl ? "bg-white" : avatarColors(businessName).bg
          } flex items-center justify-center mx-auto mb-4 overflow-hidden shadow-sm ring-1 ring-zinc-100`}
        >
          {logoUrl ? (
            <Image src={logoUrl} alt="" fill className="object-cover" sizes="72px" />
          ) : (
            <span className={`text-lg font-bold ${avatarColors(businessName).fg}`}>
              {businessName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold text-foreground">{businessName}</h1>
        {businessCategory && (
          <span className="inline-block mt-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            {businessCategory}
          </span>
        )}
        {businessDescription ? (
          <p className="text-sm text-muted-foreground mt-1.5">{businessDescription}</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1.5">
            {completedOrders >= 10
              ? `${completedOrders} customers have ordered here`
              : langgananEnabled ? "Order directly — no app, no sign-up"
              : preorderEnabled ? "Order now, ready on your chosen date"
              : "Order directly — no app, no sign-up"}
          </p>
        )}

        {/* WA Button — prominent, trust anchor */}
        {businessPhone && (
          <a
            href={`https://wa.me/${formatPhoneForWA(businessPhone)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full border border-border text-muted-foreground text-sm font-medium hover:bg-muted/30 transition-colors"
          >
            <Phone className="w-4 h-4" />
            {completedOrders < 5 ? "Ask the seller" : "Contact on WhatsApp"}
          </a>
        )}

        {/* Trust signals */}
        {(businessAddress || completedOrders >= 5 || hasQris || completedOrders < 5) && (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 mt-3 text-xs text-muted-foreground">
            {completedOrders >= 5 && (
              <span className="inline-flex items-center gap-1 bg-warm-green-light text-warm-green font-medium px-2 py-0.5 rounded-full">
                <ShoppingBag className="w-3 h-3" />
                {completedOrders} orders completed
              </span>
            )}
            {repeatCustomerPct >= 30 && completedOrders >= 10 && (
              <span className="inline-flex items-center gap-1 bg-warm-green-light text-warm-green font-medium px-2 py-0.5 rounded-full">
                🔄 {repeatCustomerPct}% repeat customers
              </span>
            )}
            {memberSince && completedOrders >= 10 && (
              <span className="inline-flex items-center gap-1">
                📅 Active since {memberSince}
              </span>
            )}
            {businessAddress && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {businessAddress}
              </span>
            )}
            {hasQris && (
              <button
                type="button"
                onClick={() => qrisUrl && setShowQris(true)}
                className={`inline-flex items-center gap-1 ${qrisUrl ? "text-warm-green hover:underline" : ""}`}
              >
                <QrCode className="w-3 h-3" />
                QRIS
              </button>
            )}
          </div>
        )}

        {/* Operating hours */}
        {operatingHours && Object.keys(operatingHours).length > 0 && (() => {
          // Keys remain the legacy Indonesian day names because that's how
          // operating_hours is stored in the profiles JSONB column. Labels below
          // are what the storefront actually renders.
          const days = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"];
          const dayLabels: Record<string, string> = { senin: "Mon", selasa: "Tue", rabu: "Wed", kamis: "Thu", jumat: "Fri", sabtu: "Sat", minggu: "Sun" };
          const today = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
          const todayHours = operatingHours[today];
          if (!todayHours) return null;
          return (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {todayHours.closed
                ? <span>Closed today</span>
                : <span>Open today {todayHours.open} — {todayHours.close}</span>
              }
            </div>
          );
        })()}

        {/* Cross-link to directory */}
        {citySlug && city && (
          <div className="mt-3 flex items-center justify-center">
            <a
              href={`/toko?city=${citySlug}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-warm-green transition-colors"
            >
              <Store className="w-3 h-3" />
              More stores in {city}
            </a>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 px-4">
        {/* Terlaris section — top products pinned above catalog */}
        {terlarisItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
              {completedOrders >= 30 ? <><span>🔥</span> Bestsellers</> : <><span>⭐</span> Picks</>}
            </p>
            <div className={anyHasImage ? "grid grid-cols-2 gap-2.5" : "space-y-1"}>
              {terlarisItems.map(renderItemCard)}
            </div>
          </div>
        )}

        {/* Item selection — grouped by category (excluding terlaris) */}
        {catalogItems.length > 0 && (
        <div className="space-y-4">
          {hasCategories ? (
              // Render grouped by category
              groupedCatalogItems.map((group) => (
                <div key={group.category || "__uncategorized"} className="space-y-2">
                  {group.category && (
                    <div className="bg-stone-50 px-3 py-1.5 rounded-md flex items-center gap-1.5">
                      <span className="text-sm">{getCategoryEmoji("", group.category)}</span>
                      <span className="text-xs font-bold text-foreground/80 uppercase tracking-wider">{group.category}</span>
                    </div>
                  )}
                  {!group.category && groupedCatalogItems.length > 1 && (
                    <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                      Others
                    </p>
                  )}
                  <div className={anyHasImage ? "grid grid-cols-2 gap-2.5" : "space-y-1"}>
                    {group.items.map(renderItemCard)}
                  </div>
                </div>
              ))
            ) : (
              // No categories — flat grid or list depending on photos
              <div className={anyHasImage ? "grid grid-cols-2 gap-2.5" : "space-y-1"}>
                {catalogItems.map(renderItemCard)}
              </div>
            )}
        </div>
        )}

        {!hasMenuItems && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
              Your order
            </p>
            <p className="text-sm text-muted-foreground">
              Write your order below
            </p>
          </div>
        )}

        {/* Order summary before checkout */}
        {hasItems && (
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Your order</p>
            {selectedItems.map((fi) => (
              <div key={fi.name} className="flex items-center justify-between text-sm">
                <span className="text-foreground truncate">
                  {fi.name} <span className="text-muted-foreground">×{itemQtys[fi.name]}</span>
                </span>
                <span className="text-foreground font-medium shrink-0 ml-2">
                  RM {(fi.price * (itemQtys[fi.name] || 0)).toLocaleString("en-MY")}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm font-bold pt-1 border-t">
              <span>Total</span>
              <span>RM {subtotal.toLocaleString("en-MY")}</span>
            </div>
          </div>
        )}

        {/* Divider between menu and customer fields */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest">Your details</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Customer fields */}
        <div ref={customerRef} className="space-y-3">

          {/* Returning customer — collapsed summary */}
          {isReturningCustomer ? (
            <div className="flex items-center justify-between p-3 bg-warm-green-light/50 rounded-xl">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{customerName}</p>
                <p className="text-xs text-muted-foreground">{customerPhone}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsReturningCustomer(false)}
                className="text-xs text-warm-green font-medium shrink-0 ml-3"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <div>
                <div className={`relative rounded-lg border bg-white transition-colors focus-within:border-warm-green/25 focus-within:ring-4 focus-within:ring-warm-green/8 ${fieldErrors.name ? "border-warm-rose" : ""}`}>
                  <label htmlFor="customerName" className="block px-3 pt-2 text-[11px] font-medium text-muted-foreground">
                    Your name <span className="text-warm-rose">*</span>
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    value={customerName}
                    onChange={(e) => { setCustomerName(e.target.value); setFieldErrors(prev => { const n = { ...prev }; delete n.name; return n; }); }}
                    placeholder="Full name"
                    className="w-full px-3 pb-2.5 pt-0.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                  />
                </div>
                {fieldErrors.name && <p className="text-[11px] text-warm-rose mt-1">{fieldErrors.name}</p>}
              </div>
              <div>
                <div className={`relative rounded-lg border bg-white transition-colors focus-within:border-warm-green/25 focus-within:ring-4 focus-within:ring-warm-green/8 ${fieldErrors.phone ? "border-warm-rose" : ""}`}>
                  <label htmlFor="customerPhone" className="block px-3 pt-2 text-[11px] font-medium text-muted-foreground">
                    WhatsApp number <span className="text-warm-rose">*</span>
                  </label>
                  <div className="flex items-center px-3 pb-2.5 pt-0.5 gap-2">
                    <span className="text-sm text-muted-foreground shrink-0 select-none">🇲🇾 +60</span>
                    <span className="w-px h-4 bg-border shrink-0" />
                    <input
                      type="tel"
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => { setCustomerPhone(e.target.value); setFieldErrors(prev => { const n = { ...prev }; delete n.phone; return n; }); }}
                      placeholder="12 3456 7890"
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                    />
                  </div>
                </div>
                {fieldErrors.phone ? (
                  <p className="text-[11px] text-warm-rose mt-1">{fieldErrors.phone}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground/70 mt-1">For WhatsApp order confirmation</p>
                )}
              </div>
              {pastOrders.length > 0 && (
                <div className="rounded-lg border border-warm-green/30 bg-warm-green-light/30 px-3 py-2.5 space-y-2">
                  <p className="text-[11px] font-semibold text-warm-green uppercase tracking-wider">
                    Ordered here before · {pastOrders.length} order{pastOrders.length > 1 ? "s" : ""}
                  </p>
                  {pastOrders.slice(0, 2).map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">
                          {o.items.map((i) => i.name).join(", ")}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(o.created_at).toLocaleDateString("en-MY", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          · RM {o.total.toLocaleString("en-MY")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => reorderFromPast(o.items)}
                        className="h-7 px-2.5 text-[11px] font-medium rounded-full bg-warm-green text-white hover:bg-warm-green/90 transition-colors shrink-0"
                      >
                        Reorder
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {historyLoading && pastOrders.length === 0 && customerPhone.replace(/\D/g, "").length >= 9 && (
                <p className="text-[11px] text-muted-foreground">Checking your order history…</p>
              )}
            </>
          )}
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">
              <span>
                {langgananEnabled ? "Delivery date" : preorderEnabled ? "When do you want it?" : "Delivery date"}
                {preorderEnabled && !langgananEnabled && <span className="text-warm-rose">*</span>}
              </span>
              {(!preorderEnabled || langgananEnabled) && <span className="text-muted-foreground/70 font-normal ml-1">(optional)</span>}
            </label>
            {/* Hidden input for form validation */}
            <input type="hidden" value={deliveryDate} required={preorderEnabled && !langgananEnabled} />
            <div className="relative" ref={calendarRef}>
              <button
                type="button"
                onClick={() => {
                  if (selectedDateObj) {
                    setPickerMonth(selectedDateObj.getMonth());
                    setPickerYear(selectedDateObj.getFullYear());
                  } else {
                    const init = preorderEnabled ? new Date(Date.now() + 86400000) : new Date();
                    setPickerMonth(init.getMonth());
                    setPickerYear(init.getFullYear());
                  }
                  setShowCalendar(!showCalendar);
                }}
                className={`w-full h-12 px-3 bg-white border rounded-lg text-sm text-left flex items-center justify-between transition-colors ${
                  showCalendar ? "ring-2 ring-[#1a4d35]/20 border-[#1a4d35]/40" : ""
                } ${deliveryDate ? "text-foreground" : "text-muted-foreground"}`}
              >
                <span>{deliveryDate ? formatSelectedDate(deliveryDate) : "Pick a date"}</span>
                <div className="flex items-center gap-1">
                  {deliveryDate && (
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); setDeliveryDate(""); setShowCalendar(false); }}
                      className="p-0.5 hover:bg-muted rounded transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>

              {showCalendar && (() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const calDays = getCalendarDays(pickerYear, pickerMonth);
                return (
                  <div className="absolute left-0 top-full mt-2 z-50 bg-white border rounded-xl shadow-lg p-3 max-w-xs w-full">
                    <div className="flex items-center justify-between mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (pickerMonth === 0) { setPickerMonth(11); setPickerYear(pickerYear - 1); }
                          else setPickerMonth(pickerMonth - 1);
                        }}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <span className="font-semibold text-sm text-foreground">
                        {MONTH_NAMES[pickerMonth]} {pickerYear}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (pickerMonth === 11) { setPickerMonth(0); setPickerYear(pickerYear + 1); }
                          else setPickerMonth(pickerMonth + 1);
                        }}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                      {DAY_LABELS.map((d) => (
                        <span key={d} className="text-[10px] font-medium text-muted-foreground py-1">{d}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {calDays.map((day, i) => {
                        if (day === null) return <span key={`empty-${i}`} />;
                        const d = new Date(pickerYear, pickerMonth, day);
                        d.setHours(0, 0, 0, 0);
                        const isPast = d < minDate;
                        const isSelected = selectedDateObj && d.getTime() === selectedDateObj.getTime();
                        const isToday = d.getTime() === today.getTime();
                        const dateStr = `${pickerYear}-${String(pickerMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        return (
                          <button
                            key={day}
                            type="button"
                            disabled={isPast}
                            onClick={() => { setDeliveryDate(dateStr); setShowCalendar(false); setFieldErrors(prev => { const n = { ...prev }; delete n.date; return n; }); }}
                            className={`h-9 text-sm rounded-lg transition-colors ${
                              isSelected ? "bg-[#1a4d35] text-white font-semibold" :
                              isToday ? "bg-muted font-semibold text-foreground" :
                              "hover:bg-muted text-foreground"
                            } ${isPast ? "opacity-30 cursor-not-allowed" : ""}`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
            {fieldErrors.date && <p className="text-[11px] text-warm-rose mt-1">{fieldErrors.date}</p>}
            {deliveryDate && capacityRemaining !== null && !capacityFull && (
              <p className="text-[11px] text-muted-foreground mt-1">{capacityRemaining} slot(s) left for this date</p>
            )}
            {capacityFull && (
              <p className="text-[11px] text-warm-rose mt-1">This date is fully booked. Please pick another.</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-lg border bg-white transition-colors focus-within:border-warm-green/25 focus-within:ring-4 focus-within:ring-warm-green/8">
          <label htmlFor="orderNotes" className="block px-3 pt-2 text-[11px] font-medium text-muted-foreground">
            {hasMenuItems ? "Notes" : "Describe your order"}
            {hasMenuItems
              ? <span className="text-muted-foreground/70 font-normal ml-1">(optional)</span>
              : <span className="text-warm-rose ml-0.5">*</span>
            }
          </label>
          <textarea
            id="orderNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={hasMenuItems ? "e.g. red colour, evening delivery, home address..." : "e.g. 2 nasi ayam, 1 iced tea, not spicy"}
            rows={hasMenuItems ? 2 : 4}
            className="w-full px-3 pb-2.5 pt-0.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none"
          />
        </div>

        {/* Honeypot — hidden from real users */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="absolute opacity-0 h-0 w-0 overflow-hidden pointer-events-none"
          aria-hidden="true"
        />

        {error && (
          <p className="text-sm text-warm-rose text-center" role="alert">{error}</p>
        )}
        {fieldErrors.items && (
          <p className="text-sm text-warm-rose text-center" role="alert">{fieldErrors.items}</p>
        )}

        {/* Submit — hidden when sticky bar is visible, acts as form anchor */}
        <div ref={submitRef}>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full h-14 rounded-xl bg-[#1a4d35] text-white text-base font-semibold hover:bg-[#1a4d35]/90 active:bg-[#1a4d35]/90 disabled:opacity-50 disabled:cursor-not-allowed squish-press transition-colors ${hasItems ? "hidden" : ""}`}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Order now"
            )}
          </button>
        </div>
      </form>

      {/* Sticky cart bar — visible when items selected */}
      {hasItems && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-sm border-t border-border/50 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-4 pt-3 pb-3 safe-area-pb">
          <div className="max-w-lg mx-auto">
            <button
              type="button"
              onClick={() => {
                if (!customerName.trim() || !customerPhone.trim()) {
                  customerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                }
                const form = submitRef.current?.closest("form");
                form?.requestSubmit();
              }}
              disabled={isSubmitting || capacityFull}
              className="w-full h-14 rounded-2xl bg-[#1a4d35] text-white font-semibold hover:bg-[#1a4d35]/90 active:bg-[#1a4d35]/90 disabled:opacity-50 disabled:cursor-not-allowed squish-press transition-colors flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : capacityFull ? (
                <span className="text-sm">This date is full</span>
              ) : (
                <>
                  <span className="flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{totalItemCount}</span>
                    Order now
                  </span>
                  {subtotal > 0 && (
                    <>
                      <span className="w-px h-5 bg-white/30" />
                      <span className="text-sm">RM {subtotal.toLocaleString("en-MY")}</span>
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Subtle branding — generous breathing room below the Order now button */}
      <p className="text-center text-[11px] text-muted-foreground/50 mt-16 mb-12 px-4">
        Made with <a href="https://tokoflow.com" className="underline hover:text-muted-foreground">Tokoflow</a>
      </p>

      {/* QRIS modal */}
      {showQris && qrisUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowQris(false)}>
          <div className="bg-background rounded-xl p-5 max-w-xs w-full text-center space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
              <QrCode className="w-4 h-4" />
              Scan to pay
            </div>
            <div className="relative mx-auto w-full aspect-square">
              <Image
                src={qrisUrl}
                alt="QRIS"
                fill
                className="object-contain rounded-lg"
                sizes="280px"
                unoptimized
              />
            </div>
            <p className="text-xs text-muted-foreground">Scan to pay {businessName}</p>
            <button
              type="button"
              onClick={() => setShowQris(false)}
              className="w-full h-10 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
