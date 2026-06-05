"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Loader2, MapPin, Phone, QrCode, ShoppingBag, CalendarDays, ChevronLeft, ChevronRight, ChevronDown, X, Clock, Store, Share2, Repeat, Download } from "lucide-react";
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
  city?: string;
  citySlug?: string;
  operatingHours?: Record<string, { open: string; close: string; closed?: boolean }> | null;
  completedOrders: number;
  repeatCustomerPct: number;
  memberSince?: string;
  hasQris: boolean;
  hasBillplz?: boolean;
  qrisUrl?: string;
  preorderEnabled?: boolean;
  deliveryEnabled?: boolean;
  pickupEnabled?: boolean;
  dineInEnabled?: boolean;
  langgananEnabled?: boolean;
  dailyOrderCapacity?: number | null;
  businessId: string;
  deliveryRates?: { peninsular?: number; sabah_sarawak?: number } | null;
  isProActive?: boolean;
}

function itemKey(item: PublicFrequentItem): string {
  return item.id ?? item.name;
}

export function PublicOrderForm({ slug, businessName, frequentItems, logoUrl, businessAddress, businessPhone, businessDescription, businessCategory, city, citySlug, operatingHours, completedOrders, repeatCustomerPct, memberSince, hasQris, hasBillplz, qrisUrl, preorderEnabled, deliveryEnabled, pickupEnabled, dineInEnabled, langgananEnabled, dailyOrderCapacity, businessId, deliveryRates, isProActive }: PublicOrderFormProps) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [itemQtys, setItemQtys] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrPostcode, setAddrPostcode] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showQris, setShowQris] = useState(false);
  const [isReturningCustomer, setIsReturningCustomer] = useState(false);
  const selectedPayment: "fpx" | "qr" | "later" = langgananEnabled ? "later" : hasQris ? "qr" : hasBillplz ? "fpx" : "later";
  const hasDeliveryRates = !!(deliveryRates && (deliveryRates.peninsular !== undefined || deliveryRates.sabah_sarawak !== undefined));

  const MY_PENINSULAR_STATES = ["Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Pulau Pinang", "Perak", "Perlis", "Selangor", "Terengganu", "W.P. Kuala Lumpur", "W.P. Putrajaya"];

  const deliveryZone: "peninsular" | "sabah_sarawak" | null = addrState
    ? (MY_PENINSULAR_STATES.includes(addrState) ? "peninsular" : "sabah_sarawak")
    : null;
  const deliveryFee = deliveryZone && deliveryRates?.[deliveryZone] !== undefined ? (deliveryRates[deliveryZone] ?? 0) : 0;

  function normalizeGeoState(raw: string): string {
    const s = raw.toLowerCase().trim();
    const map: Record<string, string> = {
      "selangor": "Selangor",
      "kuala lumpur": "W.P. Kuala Lumpur",
      "federal territory of kuala lumpur": "W.P. Kuala Lumpur",
      "wilayah persekutuan kuala lumpur": "W.P. Kuala Lumpur",
      "putrajaya": "W.P. Putrajaya",
      "federal territory of putrajaya": "W.P. Putrajaya",
      "wilayah persekutuan putrajaya": "W.P. Putrajaya",
      "labuan": "W.P. Labuan",
      "federal territory of labuan": "W.P. Labuan",
      "wilayah persekutuan labuan": "W.P. Labuan",
      "penang": "Pulau Pinang",
      "pulau pinang": "Pulau Pinang",
      "george town": "Pulau Pinang",
      "johor": "Johor",
      "kedah": "Kedah",
      "kelantan": "Kelantan",
      "melaka": "Melaka",
      "malacca": "Melaka",
      "negeri sembilan": "Negeri Sembilan",
      "pahang": "Pahang",
      "perak": "Perak",
      "perlis": "Perlis",
      "sabah": "Sabah",
      "sarawak": "Sarawak",
      "terengganu": "Terengganu",
    };
    return map[s] || raw;
  }
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [capacityRemaining, setCapacityRemaining] = useState<number | null>(null);
  const [capacityFull, setCapacityFull] = useState(false);

  // Build the ordered list of fulfillment options the merchant supports.
  // Scheduled: delivery | pickup (any mix). On-demand: pickup | dine-in (any mix).
  const fulfillmentOptions = [
    ...(deliveryEnabled ? (["delivery"] as const) : []),
    ...(pickupEnabled   ? (["pickup"]   as const) : []),
    ...(dineInEnabled   ? (["dine-in"]  as const) : []),
  ] as ("delivery" | "pickup" | "dine-in")[];

  const hasMultipleFulfillment = fulfillmentOptions.length > 1;

  const [fulfillmentChoice, setFulfillmentChoice] = useState<"delivery" | "pickup" | "dine-in">(
    fulfillmentOptions[0] ?? "pickup"
  );

  // Address only needed when customer chose delivery
  const showDeliveryAddress = fulfillmentChoice === "delivery";

  // A zone whose rate the merchant left blank (undefined) means "not served" —
  // distinct from an explicit 0, which means "free". Only when the merchant uses
  // zone pricing and delivery is the chosen fulfillment. We block the order to
  // that zone instead of silently charging RM 0.
  const deliveryUnavailable =
    showDeliveryAddress &&
    hasDeliveryRates &&
    deliveryZone !== null &&
    deliveryRates?.[deliveryZone] === undefined;

  // Location detection
  const [locating, setLocating] = useState(false);
  const [locationErr, setLocationErr] = useState("");

  // Last order — persisted in localStorage so customer can find their order
  // if they close the tab and come back to the same store later.
  const [lastOrder, setLastOrder] = useState<{ orderId: string; orderNumber: string } | null>(null);

  async function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationErr("Location not supported on this browser");
      return;
    }
    setLocating(true);
    setLocationErr("");
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });
      const { latitude, longitude } = position.coords;
      const res = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
      if (!res.ok) throw new Error("geocode_failed");
      const data = await res.json();
      if (data.address || data.line1) {
        if (data.line1) setAddrLine1(data.line1);
        else if (data.address) setAddrLine1(data.address);
        if (data.postcode) setAddrPostcode(data.postcode);
        if (data.city) setAddrCity(data.city);
        if (data.state) setAddrState(normalizeGeoState(data.state));
      } else throw new Error("empty_address");
    } catch (err) {
      const geoErr = err as GeolocationPositionError;
      if (geoErr?.code === 1) setLocationErr("Location permission denied. Allow in browser settings.");
      else if (geoErr?.code === 2) setLocationErr("Location unavailable. Type address manually.");
      else if (geoErr?.code === 3) setLocationErr("Location timed out. Try again.");
      else setLocationErr("Could not detect address. Please type it manually.");
    } finally {
      setLocating(false);
    }
  }

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

  // Restore saved customer info + last order reference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`tokoflow_customer_${slug}`);
      if (saved) {
        const { name, phone } = JSON.parse(saved);
        if (name) { setCustomerName(name); setIsReturningCustomer(true); }
        if (phone) setCustomerPhone(phone);
      }
      const savedOrder = localStorage.getItem(`tokoflow_last_order_${slug}`);
      if (savedOrder) {
        const parsed = JSON.parse(savedOrder);
        // Expire after 30 days
        if (parsed.createdAt && Date.now() - parsed.createdAt < 30 * 24 * 60 * 60 * 1000) {
          setLastOrder({ orderId: parsed.orderId, orderNumber: parsed.orderNumber });
        } else {
          localStorage.removeItem(`tokoflow_last_order_${slug}`);
        }
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
  const selectedItems = frequentItems.filter((fi) => (itemQtys[itemKey(fi)] || 0) > 0);
  const hasItems = selectedItems.length > 0;
  const subtotal = selectedItems.reduce((sum, fi) => sum + fi.price * (itemQtys[itemKey(fi)] || 0), 0);
  const grandTotal = subtotal + deliveryFee;

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

  // Bestsellers/picks: only show if store has orders AND enough items
  const terlarisItems = useMemo(() => {
    if (completedOrders === 0) return []; // No orders yet = no terlaris/pilihan
    if (frequentItems.length <= 4) return []; // Too few items to separate
    return frequentItems.filter(fi => fi.stock === null || fi.stock === undefined || fi.stock > 0).slice(0, 3);
  }, [frequentItems, completedOrders]);

  // Items excluding terlaris (to avoid duplicates)
  const terlarisKeys = useMemo(() => new Set(terlarisItems.map(itemKey)), [terlarisItems]);
  const catalogItems = useMemo(() => frequentItems.filter(fi => !terlarisKeys.has(itemKey(fi))), [frequentItems, terlarisKeys]);

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
    if (delta > 0) setFieldErrors(prev => { const n = { ...prev }; delete n.items; return n; });
    setItemQtys((prev) => {
      const key = itemKey(item);
      const current = prev[key] || 0;
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
      return { ...prev, [key]: next };
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
    if (hasMenuItems && !hasItems) errors.items = "Please select at least one item";
    if (!hasMenuItems && !notes.trim()) errors.items = "Please describe your order";
    if (showDeliveryAddress && !addrLine1.trim()) errors.address = "Address is required";
    if (showDeliveryAddress && !addrState) errors.state = "Please select your state";
    // Block delivery to a zone the merchant hasn't priced (the banner explains why).
    if (deliveryUnavailable) errors.delivery = "Delivery not available to this area";

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
      product_id: fi.id ?? null,
      name: fi.name,
      qty: itemQtys[itemKey(fi)] || 1,
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
          deliveryAddress: showDeliveryAddress ? [
            addrLine1.trim(),
            addrLine2.trim(),
            [addrPostcode.trim(), addrCity.trim()].filter(Boolean).join(" "),
            addrState,
            "Malaysia",
          ].filter(Boolean).join("\n") || undefined : undefined,
          deliveryDate: deliveryDate || undefined,
          deliveryZone: deliveryZone ?? undefined,
          deliveryFee: deliveryFee > 0 ? deliveryFee : undefined,
          referralSource, // directory attribution
          paymentMethod: selectedPayment,
          website: honeypot, // honeypot field
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not submit your order");
        setIsSubmitting(false);
        return;
      }
      const confirmedTotal = typeof data.total === "number" ? data.total : grandTotal;
      const confirmedDeliveryFee = typeof data.deliveryFee === "number" ? data.deliveryFee : deliveryFee;

      // Persist customer info for repeat orders
      try {
        localStorage.setItem(`tokoflow_customer_${slug}`, JSON.stringify({
          name: customerName.trim(),
          phone: customerPhone.trim(),
        }));
        // Persist last order reference so customer can find it if they close the tab
        if (data.orderId && data.orderNumber) {
          localStorage.setItem(`tokoflow_last_order_${slug}`, JSON.stringify({
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            createdAt: Date.now(),
          }));
        }
      } catch { /* localStorage unavailable */ }

      // Store order details for success page
      try {
        sessionStorage.setItem("tokoflow_last_order", JSON.stringify({
          orderNumber: data.orderNumber,
          orderId: data.orderId,
          items,
          total: confirmedTotal,
          deliveryFee: confirmedDeliveryFee,
          notes: notes.trim(),
          customerName: customerName.trim(),
          deliveryDate: deliveryDate || undefined,
          isPreorder: preorderEnabled || false,
          isLangganan: langgananEnabled || false,
        }));
      } catch { /* sessionStorage unavailable — success page degrades gracefully */ }

      // ADR 0001 — when the merchant has Billplz in-flow payment on, the API
      // returns a paymentUrl pointing to Billplz hosted checkout. Hand the
      // customer off to it; on success Billplz redirects back to /sukses
      // (configured server-side on the bill). Otherwise: classic flow with
      // static QR + manual verify on the success page.
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      const orderIdParam = data.orderId ? `&oid=${encodeURIComponent(data.orderId)}` : "";
      const preorderParam = preorderEnabled ? "&preorder=1" : "";
      const langgananParam = langgananEnabled ? "&langganan=1" : "";
      const payParam = hasQris && selectedPayment === "qr" && !langgananEnabled && !data.paymentUrl ? `&pay=qr` : "";
      router.push(`/${slug}/sukses?order=${encodeURIComponent(data.orderNumber)}${orderIdParam}${preorderParam}${langgananParam}${payParam}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  const totalItemCount = selectedItems.reduce((sum, fi) => sum + (itemQtys[itemKey(fi)] || 0), 0);

  function renderItemCard(fi: PublicFrequentItem) {
    const key = itemKey(fi);
    const qty = itemQtys[key] || 0;
    const isActive = qty > 0;
    const isOutOfStock = fi.stock !== null && fi.stock !== undefined && fi.stock <= 0;
    const isLowStock = fi.stock !== null && fi.stock !== undefined && fi.stock > 0 && fi.stock <= 5;
    const atMax = fi.stock !== null && fi.stock !== undefined && qty >= fi.stock;

    // List mode (no photos) = compact horizontal row
    // Grid mode (has photos) = card with image
    if (!anyHasImage) {
      return (
        <div
          key={key}
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
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${avatarColors(fi.name).bg}`} aria-hidden>
              <span className={`text-xs font-semibold ${avatarColors(fi.name).fg}`}>
                {fi.name.trim().charAt(0).toUpperCase() || "·"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{fi.name}</p>
              <p className="text-xs text-muted-foreground">
                RM {fi.price.toLocaleString("en-MY")}
                {fi.unit && <span> / {fi.unit}</span>}
                {isLowStock && !isOutOfStock && <span className="text-warm-rose ml-2">{fi.stock} left</span>}
                {isOutOfStock && <span className="text-muted-foreground ml-2">Out</span>}
              </p>
            </div>
          </div>
          {isActive ? (
            <div className="flex items-center gap-2 shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => updateQty(fi, -1)} aria-label={`Decrease ${fi.name} quantity`} className="w-9 h-9 flex items-center justify-center rounded-full border border-warm-green/30 bg-white text-warm-green hover:bg-warm-green/5 transition-colors">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold text-foreground w-5 text-center tabular-nums">{qty}</span>
              <button type="button" onClick={() => updateQty(fi, 1)} disabled={atMax} aria-label={`Increase ${fi.name} quantity`} className="w-9 h-9 flex items-center justify-center rounded-full bg-warm-green text-white hover:bg-warm-green-hover disabled:opacity-30 transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="shrink-0 ml-3 w-9 h-9 rounded-full bg-zinc-50 group-hover:bg-zinc-100 flex items-center justify-center" aria-hidden>
              <Plus className="w-4 h-4 text-foreground/60" />
            </div>
          )}
        </div>
      );
    }

    // Grid mode (with photos) — original card layout
    return (
      <div
        key={key}
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
              <div className={`w-full h-full flex items-center justify-center ${avatarColors(fi.name).bg}`}>
                <span className={`text-3xl font-semibold ${avatarColors(fi.name).fg}`}>
                  {fi.name.trim().charAt(0).toUpperCase() || "·"}
                </span>
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground bg-background/80 px-2 py-1 rounded">Out</span>
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
              {isOutOfStock && <span className="text-[10px] text-muted-foreground ml-auto">Out</span>}
            </div>
          </div>
        </div>
        {/* Qty controls */}
        <div className={`flex items-center gap-2 mt-2 h-10 transition-opacity duration-150 ${isActive ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => updateQty(fi, -1)} aria-label={`Decrease ${fi.name} quantity`} className="w-8 h-8 flex items-center justify-center rounded-full border border-warm-green/30 bg-white text-warm-green hover:bg-warm-green/5 transition-colors">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm font-bold text-foreground w-6 text-center">{qty}</span>
          <button type="button" onClick={() => updateQty(fi, 1)} disabled={atMax} aria-label={`Increase ${fi.name} quantity`} className="w-8 h-8 flex items-center justify-center rounded-full bg-warm-green text-white hover:bg-warm-green-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
          {fi.min_order_qty > 1 && <span className="text-[10px] text-muted-foreground">Min. {fi.min_order_qty}</span>}
        </div>
      </div>
    );
  }

  // Color band uses the merchant's hashed avatar bg as a 3px strip at the very
  // top of the page — quiet identity, never Tokoflow green colonising the surface.
  const heroBandClass = avatarColors(businessName).bg;

  return (
    <div className={`max-w-lg mx-auto ${hasItems ? "pb-32" : ""}`}>
      {/* Hero color band — 3px strip wraps the page in the merchant's identity
          color before any text loads. Cheap pride signal, no decoration. */}
      <div className={`h-[3px] ${heroBandClass}`} aria-hidden />

      {/* Top bar — navigation + context + share. Back-link is context-aware:
          customers who arrived from /store (?from=directory) land back on
          the directory; everyone else (direct WhatsApp / IG share link)
          lands on /. Label stays "Tokoflow" so the brand cue is constant
          either way. */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex flex-col gap-0.5">
          <Link
            href={referralSource === "directory" ? "/store" : "/"}
            className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>{referralSource === "directory" ? "Browse stores" : "Tokoflow"}</span>
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

      {/* Last order banner — shown when customer returns to the same store.
          Quiet, not intrusive — just a one-liner so they can find their order. */}
      {lastOrder && (
        <div className="mx-4 mb-1">
          <Link
            href={`/r/${lastOrder.orderId}`}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-muted/60 text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            <span>Your last order: <span className="font-mono font-medium text-foreground">{lastOrder.orderNumber}</span></span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>
      )}

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
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{businessName}</h1>
        {businessCategory && (
          <span className="inline-block mt-2 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-warm-green-light text-warm-green">
            {businessCategory}
          </span>
        )}
        {businessDescription ? (
          <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">{businessDescription}</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1.5">
            {langgananEnabled
              ? "Sign up for recurring delivery"
              : preorderEnabled
                ? "Made fresh, delivered on your chosen date"
                : "Walk-in welcome, on the spot"}
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
            {completedOrders < 5 ? "Ask on WhatsApp" : "Contact on WhatsApp"}
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
                <Repeat className="w-3 h-3" />
                {repeatCustomerPct}% repeat customers
              </span>
            )}
            {memberSince && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                Active since {memberSince}
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
                <div key={group.category || "__uncategorized"} className="space-y-2.5">
                  {group.category && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-semibold text-warm-green uppercase tracking-[0.12em]">
                        {group.category}
                      </span>
                      <span className="flex-1 h-px bg-zinc-100" aria-hidden />
                    </div>
                  )}
                  {!group.category && groupedCatalogItems.length > 1 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                        Others
                      </span>
                      <span className="flex-1 h-px bg-zinc-100" aria-hidden />
                    </div>
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
              <div key={itemKey(fi)} className="flex items-center justify-between text-sm">
                <span className="text-foreground truncate">
                  {fi.name} <span className="text-muted-foreground">×{itemQtys[itemKey(fi)]}</span>
                </span>
                <span className="text-foreground font-medium shrink-0 ml-2">
                  RM {(fi.price * (itemQtys[itemKey(fi)] || 0)).toLocaleString("en-MY")}
                </span>
              </div>
            ))}
            {deliveryFee > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                <span>Subtotal</span><span>RM {subtotal.toLocaleString("en-MY")}</span>
              </div>
            )}
            {deliveryFee > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Delivery</span><span>RM {deliveryFee.toLocaleString("en-MY")}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-bold pt-1 border-t">
              <span>Total</span>
              <span>RM {grandTotal.toLocaleString("en-MY")}</span>
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
                    <span className="text-sm text-muted-foreground shrink-0 select-none">🇮🇩 +62</span>
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
            </>
          )}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">
              <span>
                {langgananEnabled
                  ? "Delivery date"
                  : preorderEnabled
                    ? deliveryEnabled && !pickupEnabled && !dineInEnabled
                      ? "Delivery date"
                      : pickupEnabled && !deliveryEnabled && !dineInEnabled
                        ? "Pickup date"
                        : "Preferred date"
                    : "Date"}
                {preorderEnabled && !langgananEnabled && <span className="text-warm-rose">*</span>}
              </span>
              {(!preorderEnabled || langgananEnabled) && <span className="text-muted-foreground/70 font-normal ml-1">(optional)</span>}
            </label>
            {preorderEnabled && !langgananEnabled && (
              <p className="text-[11px] text-muted-foreground/60 mb-1.5">
                Earliest: {minDate.toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" })}
              </p>
            )}
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
                  showCalendar ? "ring-2 ring-warm-green/20 border-warm-green/40" : ""
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
                              isSelected ? "bg-warm-green text-white font-semibold" :
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

        {/* Fulfillment picker — shown when merchant offers more than one option */}
        {hasMultipleFulfillment && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">How to receive</p>
            <div className={`grid gap-1.5 ${fulfillmentOptions.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
              {fulfillmentOptions.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => setFulfillmentChoice(choice)}
                  className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    fulfillmentChoice === choice
                      ? "border-warm-green bg-warm-green/5"
                      : "border-border bg-white hover:bg-muted/50"
                  }`}
                >
                  <p className={`text-xs font-medium ${fulfillmentChoice === choice ? "text-warm-green" : "text-foreground"}`}>
                    {choice === "delivery" ? "Delivery" : choice === "pickup" ? "Pickup" : "Dine-in"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {choice === "delivery" ? "Delivered to your address" : choice === "pickup" ? "Collect from merchant" : "Eat here"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Delivery address — structured fields shown only when delivery is selected */}
        {showDeliveryAddress && (
          <div className="space-y-2">
            {/* Use my location */}
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-muted-foreground">Delivery address <span className="text-warm-rose">*</span></p>
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                className="flex items-center gap-1 text-[11px] font-medium text-warm-green hover:text-warm-green/80 disabled:opacity-50 transition-colors"
              >
                {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                {locating ? "Detecting..." : "Use my location"}
              </button>
            </div>
            {locationErr && <p className="text-[11px] text-warm-rose">{locationErr}</p>}

            {/* Address line 1 */}
            <div className={`rounded-lg border bg-white ${fieldErrors.address ? "border-warm-rose" : ""}`}>
              <label htmlFor="addrLine1" className="block px-3 pt-2 text-[11px] font-medium text-muted-foreground">Address line 1</label>
              <input
                id="addrLine1"
                type="text"
                value={addrLine1}
                onChange={(e) => { setAddrLine1(e.target.value.slice(0, 200)); setFieldErrors(prev => { const n = { ...prev }; delete n.address; return n; }); }}
                placeholder="e.g. No. 12, Jalan Mawar, Section 2"
                className="w-full px-3 pb-2.5 pt-0.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
              />
              {fieldErrors.address && <p className="px-3 pb-2 text-[11px] text-warm-rose">{fieldErrors.address}</p>}
            </div>

            {/* Address line 2 (optional) */}
            <div className="rounded-lg border bg-white">
              <label htmlFor="addrLine2" className="block px-3 pt-2 text-[11px] font-medium text-muted-foreground">Address line 2 <span className="text-muted-foreground/60 font-normal">(optional)</span></label>
              <input
                id="addrLine2"
                type="text"
                value={addrLine2}
                onChange={(e) => setAddrLine2(e.target.value.slice(0, 200))}
                placeholder="e.g. Apartment, unit, floor"
                className="w-full px-3 pb-2.5 pt-0.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
              />
            </div>

            {/* Postcode + City */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border bg-white">
                <label htmlFor="addrPostcode" className="block px-3 pt-2 text-[11px] font-medium text-muted-foreground">Postcode</label>
                <input
                  id="addrPostcode"
                  type="text"
                  inputMode="numeric"
                  value={addrPostcode}
                  onChange={(e) => setAddrPostcode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  placeholder="40150"
                  className="w-full px-3 pb-2.5 pt-0.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                />
              </div>
              <div className="rounded-lg border bg-white">
                <label htmlFor="addrCity" className="block px-3 pt-2 text-[11px] font-medium text-muted-foreground">City / District</label>
                <input
                  id="addrCity"
                  type="text"
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value.slice(0, 100))}
                  placeholder="Shah Alam"
                  className="w-full px-3 pb-2.5 pt-0.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                />
              </div>
            </div>

            {/* State dropdown — auto-detects zone */}
            <div className={`rounded-lg border bg-white ${fieldErrors.state ? "border-warm-rose" : ""}`}>
              <label htmlFor="addrState" className="block px-3 pt-2 text-[11px] font-medium text-muted-foreground">State <span className="text-warm-rose">*</span></label>
              <select
                id="addrState"
                value={addrState}
                onChange={(e) => { setAddrState(e.target.value); setFieldErrors(prev => { const n = { ...prev }; delete n.state; return n; }); }}
                className="w-full px-3 pb-2.5 pt-0.5 bg-transparent text-sm text-foreground focus:outline-none appearance-none"
              >
                <option value="">Select state</option>
                <optgroup label="Peninsular Malaysia">
                  {["Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Perak", "Perlis", "Pulau Pinang", "Selangor", "Terengganu", "W.P. Kuala Lumpur", "W.P. Putrajaya"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </optgroup>
                <optgroup label="Sabah &amp; Sarawak">
                  {["Sabah", "Sarawak", "W.P. Labuan"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </optgroup>
              </select>
              {fieldErrors.state && <p className="px-3 pb-2 text-[11px] text-warm-rose">{fieldErrors.state}</p>}
            </div>

            {/* Country (fixed) */}
            <div className="rounded-lg border bg-muted/30 px-3 py-2.5 flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">Country</span>
              <span className="text-sm text-foreground">Malaysia</span>
            </div>

            {/* Auto-detected delivery fee based on state. A blank zone rate means
                "not served" — block it (with a way out) instead of showing "Free". */}
            {deliveryUnavailable ? (
              <div className="rounded-lg border bg-warm-rose-light border-warm-rose/30 px-3 py-2.5 space-y-2">
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Delivery to {deliveryZone === "peninsular" ? "Peninsular Malaysia" : "Sabah & Sarawak"} isn&apos;t available yet
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {pickupEnabled
                      ? "Switch to pickup, or message the seller to arrange."
                      : "Message the seller to arrange delivery to your area."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {pickupEnabled && (
                    <button
                      type="button"
                      onClick={() => setFulfillmentChoice("pickup")}
                      className="h-8 px-3 rounded-lg bg-warm-green text-white text-xs font-medium hover:bg-warm-green-hover transition-colors"
                    >
                      Switch to pickup
                    </button>
                  )}
                  {businessPhone && (
                    <a
                      href={`https://wa.me/${formatPhoneForWA(businessPhone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 px-3 inline-flex items-center rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      Message seller
                    </a>
                  )}
                </div>
              </div>
            ) : hasDeliveryRates && deliveryZone ? (
              <div className="rounded-lg border bg-warm-green/5 border-warm-green/20 px-3 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground">Delivery charge</p>
                  <p className="text-[10px] text-muted-foreground">{deliveryZone === "peninsular" ? "Peninsular Malaysia" : "Sabah & Sarawak"}</p>
                </div>
                <span className="text-sm font-semibold text-warm-green">
                  {deliveryFee === 0 ? "Free" : `RM ${deliveryFee.toLocaleString("en-MY")}`}
                </span>
              </div>
            ) : null}
          </div>
        )}

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
            onChange={(e) => { setNotes(e.target.value); if (!hasMenuItems) setFieldErrors(prev => { const n = { ...prev }; delete n.items; return n; }); }}
            placeholder={hasMenuItems ? "e.g. write Happy Birthday on cake, no nuts, include gift box" : "e.g. 1 whole cake, chocolate flavour, not too sweet"}
            rows={hasMenuItems ? 2 : 4}
            className="w-full px-3 pb-2.5 pt-0.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none"
          />
        </div>

        {/* Payment method — Billplz preview (no QR set) */}
        {hasBillplz && !hasQris && !langgananEnabled && (
          <div className="rounded-xl border border-warm-green/20 bg-warm-green/5 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warm-green/10 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-warm-green" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Transfer Bank / e-Wallet</p>
              <p className="text-[11px] text-muted-foreground">Secure online payment — you&apos;ll be redirected after ordering</p>
            </div>
          </div>
        )}

        {/* Payment method — QR only, required */}
        {hasQris && !langgananEnabled && (
          <div className="rounded-xl border-2 border-warm-green/30 bg-warm-green/5 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">
                Payment method <span className="text-warm-rose ml-0.5">*</span>
              </p>
              <span className="text-[10px] font-medium text-warm-green bg-warm-green/10 px-2 py-0.5 rounded-full">Required</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white border border-warm-green px-4 py-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-warm-green flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">QRIS</p>
                <p className="text-[11px] text-muted-foreground">Pay now, then upload the receipt after ordering</p>
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-warm-green flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-warm-green" />
              </div>
            </div>
          </div>
        )}

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
            className={`w-full h-14 rounded-2xl bg-warm-green text-white text-base font-semibold hover:bg-warm-green-hover active:bg-warm-green-hover disabled:opacity-50 disabled:cursor-not-allowed squish-press transition-colors ${hasItems ? "hidden" : ""}`}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : preorderEnabled ? (
              "Send order"
            ) : (
              "Order now"
            )}
          </button>
        </div>
      </form>

      {/* Sticky cart bar — visible when items selected */}
      {hasItems && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/85 backdrop-blur-md border-t border-border/40 shadow-[0_-8px_24px_rgba(0,0,0,0.04)] px-4 pt-3 pb-3 safe-area-pb">
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
              className="w-full h-14 rounded-2xl bg-warm-green text-white font-semibold hover:bg-warm-green-hover active:bg-warm-green-hover disabled:opacity-50 disabled:cursor-not-allowed squish-press transition-colors flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : capacityFull ? (
                <span className="text-sm">This date is full</span>
              ) : (
                <>
                  <span className="flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{totalItemCount}</span>
                    {preorderEnabled ? "Send order" : "Order now"}
                  </span>
                  {grandTotal > 0 && (
                    <>
                      <span className="w-px h-5 bg-white/30" />
                      <span className="text-sm">RM {grandTotal.toLocaleString("en-MY")}</span>
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Directory link — bottom of page so it doesn't compete with order CTA */}
      {citySlug && city && (
        <div className="flex items-center justify-center mt-4">
          <a
            href={`/store?city=${citySlug}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-warm-green transition-colors"
          >
            <Store className="w-3 h-3" />
            More stores in {city}
          </a>
        </div>
      )}

      {/* Subtle branding — hidden for Pro merchants */}
      {!isProActive && (
        <p className="text-center text-[11px] text-muted-foreground/50 mt-4 mb-12 px-4">
          Made with <a href="https://tokoflow.com" className="underline hover:text-muted-foreground">Tokoflow</a>
        </p>
      )}

      {/* QRIS preview modal (from header badge tap) */}
      {showQris && qrisUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowQris(false)}>
          <div className="bg-background rounded-xl p-5 max-w-xs w-full text-center space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
              <QrCode className="w-4 h-4" />
              QRIS
            </div>
            <div className="relative mx-auto w-full aspect-square">
              <Image src={qrisUrl} alt={`QRIS ${businessName}`} fill className="object-contain rounded-lg" sizes="280px" unoptimized />
            </div>
            <a
              href={qrisUrl}
              download={`duitnow-qr-${businessName}.jpg`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-3.5 h-3.5" />
              Save QR Code
            </a>
            <button type="button" onClick={() => setShowQris(false)} className="w-full h-10 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
