"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Minus, Trash2, User, Check, MessageSquare, FileText, Percent, Pencil, CalendarDays, Lightbulb, Sparkles, Bell, ChevronLeft, ChevronRight, Loader2, CircleDollarSign, Search, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { toast } from "sonner";
import { createOrder, updateOrder, updateOrderStatus, deleteOrder, getItemSuggestions, clearItemSuggestionsCache, getFrequentItems, getRecentOrdersByCustomer } from "../services/order.service";
import type { ItemSuggestion, FrequentItem } from "../services/order.service";
import { getProfile } from "@/features/receipts/services/receipt.service";
import { createClient } from "@/lib/supabase/client";
import { buildCelebrationConfirmation, buildOrderWithStatus, buildPaymentReminder } from "@/lib/utils/wa-messages";
import { CustomerPicker } from "@/features/customers/components/CustomerPicker";
import { WAPreviewSheet } from "./WAPreviewSheet";
import { InlineHint } from "./InlineHint";
import { usePeakMode } from "../hooks/usePeakMode";
import { hapticSuccess, hapticDestructive } from "@/lib/utils/haptics";
import { createOrderOffline } from "@/lib/offline/sync";
import { track } from "@/lib/analytics";
import { createProduct } from "@/features/products/services/product.service";
import { isSpeechSupported } from "@/lib/voice/speech-recognition";

const AIOrderSheet = dynamic(() => import("./AIOrderSheet").then((m) => m.AIOrderSheet), { ssr: false });
import type { Order, OrderItem, OrderStatus } from "../types/order.types";
import type { ParsedOrderData } from "./AIOrderSheet";
import { ORDER_STATUS_LABELS, ORDER_STATUS_FLOW } from "../types/order.types";

interface OrderFormProps {
  initialOrder?: Order;
}

export function OrderForm({ initialOrder }: OrderFormProps) {
  const isEdit = !!initialOrder;
  const isFormLocked = isEdit && (initialOrder?.status === 'done' || initialOrder?.status === 'cancelled');
  const isPaymentLocked = isEdit && initialOrder?.status === 'cancelled';
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPeak = usePeakMode();

  const [items, setItems] = useState<OrderItem[]>(
    initialOrder?.items || []
  );
  const [customerName, setCustomerName] = useState(
    initialOrder?.customer_name || searchParams.get("nama") || ""
  );
  const [customerPhone, setCustomerPhone] = useState(
    initialOrder?.customer_phone || searchParams.get("hp") || ""
  );
  const [notes, setNotes] = useState(initialOrder?.notes || "");
  const [discount, setDiscount] = useState(initialOrder?.discount ? String(initialOrder.discount) : "");
  const [paymentMode, setPaymentMode] = useState<"paid" | "dp" | "unpaid">(
    initialOrder
      ? initialOrder.paid_amount >= initialOrder.total && initialOrder.total > 0
        ? "paid"
        : initialOrder.paid_amount > 0
          ? "dp"
          : "unpaid"
      : "unpaid"
  );
  const [dpAmount, setDpAmount] = useState(
    initialOrder && initialOrder.paid_amount > 0 && initialOrder.paid_amount < initialOrder.total
      ? String(initialOrder.paid_amount)
      : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(() => {
    if (initialOrder?.delivery_date) {
      return new Date(initialOrder.delivery_date).toISOString().slice(0, 16);
    }
    if (!isEdit) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T00:00`;
    }
    return "";
  });
  const [showDelivery, setShowDelivery] = useState(!isEdit || !!initialOrder?.delivery_date);
  const [isPreorder, setIsPreorder] = useState(initialOrder?.is_preorder || false);
  const [isDineIn, setIsDineIn] = useState(initialOrder?.is_dine_in || false);
  const [isLangganan, setIsLangganan] = useState(initialOrder?.is_langganan || false);
  const [isBooking, setIsBooking] = useState(initialOrder?.is_booking || false);
  const [bookingTime, setBookingTime] = useState(initialOrder?.booking_time || "");
  const [tableNumber, setTableNumber] = useState(initialOrder?.table_number || "");
  const [showNotes, setShowNotes] = useState(!!initialOrder?.notes);
  const [showDiscount, setShowDiscount] = useState(!!initialOrder?.discount);
  const [showCustomer, setShowCustomer] = useState(
    !isEdit || !!(initialOrder?.customer_name || initialOrder?.customer_phone)
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Edit-mode action state
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(initialOrder?.status || "new");
  const [confirmModal, setConfirmModal] = useState<"cancel" | "delete" | null>(null);
  const [isDestructing, setIsDestructing] = useState(false);
  // Live order state for quick actions (separate from form state)
  const [liveOrder, setLiveOrder] = useState<Order | null>(initialOrder || null);

  // Business name prompt state
  const [businessName, setBusinessName] = useState("");
  const [savedBusinessName, setSavedBusinessName] = useState("");
  const [showBusinessPrompt, setShowBusinessPrompt] = useState(false);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);

  // First-order celebration state
  const [ordersUsedBefore, setOrdersUsedBefore] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationOrder, setCelebrationOrder] = useState<Order | null>(null);
  const [celebrationBusinessName, setCelebrationBusinessName] = useState("");

  // Invoice link
  const [hasInvoice, setHasInvoice] = useState(false);

  // WA preview after celebration
  const [waPreviewData, setWaPreviewData] = useState<{ message: string; name?: string; phone?: string | null } | null>(null);

  // Save & New — session counter
  const [sessionCount, setSessionCount] = useState(0);

  // Quick-pick frequent items
  const [frequentItems, setFrequentItems] = useState<FrequentItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const aiMenuRef = useRef<HTMLDivElement>(null);
  const manualBtnRef = useRef<HTMLDivElement>(null);
  const manualInputRef = useRef<HTMLDivElement>(null);

  // Voice order
  const [showVoice, setShowVoice] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  // Paste order
  const [showPaste, setShowPaste] = useState(false);

  // Image order
  const [showImage, setShowImage] = useState(false);

  // Repeat order suggestions
  const [repeatOrders, setRepeatOrders] = useState<{ items: OrderItem[]; total: number; created_at: string; order_number: string }[]>([]);

  // Photo attachment
  const [showPhotoAttach, setShowPhotoAttach] = useState(!!(initialOrder?.image_urls?.length));
  const [imageUrls, setImageUrls] = useState<string[]>(initialOrder?.image_urls || []);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // WA action menu
  const [showWAMenu, setShowWAMenu] = useState(false);
  const waMenuRef = useRef<HTMLDivElement>(null);

  // Struk modal

  // Calendar picker for delivery date
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
      if (waMenuRef.current && !waMenuRef.current.contains(e.target as Node)) {
        setShowWAMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setVoiceSupported(isSpeechSupported());
  }, []);

  // Peak mode: auto-collapse empty optional sections
  useEffect(() => {
    if (isPeak && !isEdit) {
      if (!notes) setShowNotes(false);
      if (!discount) setShowDiscount(false);
    }
  }, [isPeak]);

  // Load frequent items for both new and edit
  useEffect(() => {
    getFrequentItems().then((items) => { setFrequentItems(items); setLoadingProducts(false); });
  }, []);

  // Fetch profile on mount (new orders only)
  useEffect(() => {
    if (isEdit) return;
    async function loadProfile() {
      const profile = await getProfile();
      if (profile) {
        setOrdersUsedBefore(profile.orders_used || 0);
        if (profile.business_name) {
          setSavedBusinessName(profile.business_name);
        }
        // Auto-expand delivery date and mark preorder when preorder mode is on
        if (profile.preorder_enabled ?? true) {
          setIsPreorder(true);
          setShowDelivery(true);
        }
        // Dine-in mode: hide customer and delivery sections by default
        if (profile.dine_in_enabled) {
          setIsDineIn(true);
          setShowCustomer(false);
          setShowDelivery(false);
          setIsPreorder(false);
        }
        // Langganan mode: customer required, delivery date optional, QRIS hidden
        if (profile.langganan_enabled) {
          setIsLangganan(true);
          setShowCustomer(true);
          setShowDelivery(false);
          setIsPreorder(false);
          setIsDineIn(false);
        }
      }
    }
    loadProfile();

    // Pre-fill sample order when ?contoh=1
    if (searchParams.get("contoh") === "1" && !initialOrder) {
      setItems([
        { name: "Nasi Lemak Ayam", qty: 2, price: 8 },
        { name: "Teh Tarik", qty: 2, price: 3 },
      ]);
      setCustomerName("Puan Aisyah");
      setCustomerPhone("0123456789");
      setShowCustomer(true);
    }

  }, [isEdit, searchParams]);

  // Check existing invoice for edit mode
  useEffect(() => {
    if (!isEdit || !initialOrder) return;
    async function checkInvoice() {
      const { getInvoiceByOrderId } = await import("@/features/invoices/services/invoice.service");
      const existing = await getInvoiceByOrderId(initialOrder!.id);
      if (existing) setHasInvoice(true);
    }
    checkInvoice();
  }, [isEdit, initialOrder]);

  async function saveBusinessName() {
    if (!businessName.trim()) return;
    setIsSavingBusiness(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ business_name: businessName.trim() })
        .eq("id", user.id);
    }
    setSavedBusinessName(businessName.trim());
    setIsSavingBusiness(false);
    setShowBusinessPrompt(false);
  }

  // Item input state
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const itemNameRef = useRef<HTMLInputElement>(null);
  const itemWrapperRef = useRef<HTMLDivElement>(null);
  const [itemSuggestions, setItemSuggestions] = useState<ItemSuggestion[]>([]);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);

  // Price auto-fill: Path 1 (dropdown/silent) vs Path 2 (manual/chip)
  const selectedFromDropdownRef = useRef(false);
  const userHasTypedPriceRef = useRef(false);
  const dismissedPriceChipsRef = useRef<Set<string>>(new Set());
  const [priceChip, setPriceChip] = useState<{ name: string; price: number } | null>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const priceFlashTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const itemPriceRef = useRef(itemPrice);
  itemPriceRef.current = itemPrice;

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (itemName.length >= 2) {
        const results = await getItemSuggestions(itemName);
        setItemSuggestions(results);
        if (results.length > 0) setShowItemSuggestions(true);

        // Path 2: agentic price chip for manual free-text exact match
        const exactMatch = results.find(
          (s) => s.name.toLowerCase() === itemName.trim().toLowerCase()
        );
        if (
          exactMatch &&
          exactMatch.price > 0 &&
          (!itemPriceRef.current || itemPriceRef.current === "0") &&
          !userHasTypedPriceRef.current &&
          !selectedFromDropdownRef.current &&
          !dismissedPriceChipsRef.current.has(itemName.trim().toLowerCase())
        ) {
          setPriceChip({ name: exactMatch.name, price: exactMatch.price });
        } else {
          setPriceChip(null);
        }
      } else {
        setItemSuggestions([]);
        setShowItemSuggestions(false);
        setPriceChip(null);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [itemName]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (itemWrapperRef.current && !itemWrapperRef.current.contains(event.target as Node)) {
        setShowItemSuggestions(false);
        // Auto-hide manual input if fields are empty and products exist
        if (frequentItems.length > 0 && !itemName.trim() && !itemPrice) {
          setShowManualInput(false);
        }
      }
      if (aiMenuRef.current && !aiMenuRef.current.contains(event.target as Node)) {
        setShowAIMenu(false);
      }
      const inBtn = manualBtnRef.current?.contains(event.target as Node);
      const inInput = manualInputRef.current?.contains(event.target as Node);
      if (!inBtn && !inInput) {
        setShowManualInput(false);
        setItemName("");
        setItemPrice("");
        setItemQty("1");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [frequentItems.length, itemName, itemPrice]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = parseInt(discount) || 0;
  const total = Math.max(0, subtotal - discountAmount);
  const hasCustomer = !!(customerName || customerPhone);
  const hasZeroPrice = items.some((item) => item.price === 0);

  function addItem() {
    if (!itemName.trim() || !itemPrice) return;

    let qty = parseInt(itemQty) || 1;
    const fi = frequentItems.find((f) => f.name.toLowerCase() === itemName.trim().toLowerCase());
    if (fi?.stock !== null && fi?.stock !== undefined && qty > fi.stock) {
      qty = fi.stock;
    }

    setItems((prev) => [
      ...prev,
      {
        name: itemName.trim(),
        price: parseInt(itemPrice) || 0,
        qty,
      },
    ]);

    setItemName("");
    setItemPrice("");
    setItemQty("1");
    setShowItemSuggestions(false);
    setShowManualInput(false);
    setPriceChip(null);
    selectedFromDropdownRef.current = false;
    userHasTypedPriceRef.current = false;
    clearItemSuggestionsCache();
  }

  function selectItemSuggestion(suggestion: ItemSuggestion) {
    setItemName(suggestion.name);
    setItemPrice(String(suggestion.price));
    setShowItemSuggestions(false);
    selectedFromDropdownRef.current = true;
    setPriceChip(null);
    if (suggestion.price > 0) flashPriceInput();
  }

  function flashPriceInput() {
    if (!priceInputRef.current) return;
    priceInputRef.current.classList.add("price-flash");
    if (priceFlashTimeoutRef.current) clearTimeout(priceFlashTimeoutRef.current);
    priceFlashTimeoutRef.current = setTimeout(() => {
      priceInputRef.current?.classList.remove("price-flash");
    }, 200);
  }

  function acceptPriceChip() {
    if (!priceChip) return;
    setItemPrice(String(priceChip.price));
    setPriceChip(null);
    flashPriceInput();
    if (!itemQty || itemQty === "1") {
      setTimeout(() => qtyInputRef.current?.focus(), 250);
    }
  }

  function dismissPriceChip() {
    if (!priceChip) return;
    dismissedPriceChipsRef.current.add(priceChip.name.toLowerCase().trim());
    setPriceChip(null);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof OrderItem, value: string) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (field === "name") return { ...item, name: value };
        let num = Math.max(field === "qty" ? 1 : 0, parseInt(value) || 0);
        if (field === "qty") {
          const fi = frequentItems.find((f) => f.name.toLowerCase() === item.name.toLowerCase());
          if (fi?.stock !== null && fi?.stock !== undefined && num > fi.stock) {
            num = fi.stock;
          }
        }
        return { ...item, [field]: num };
      })
    );
  }

  function handleCustomerSelect(name: string, phone: string) {
    setCustomerName(name);
    setCustomerPhone(phone);
    // Fetch recent orders for repeat suggestion
    if (!isEdit) {
      getRecentOrdersByCustomer(name).then(setRepeatOrders);
    }
  }

  function handleItemKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  }


  // Edit-mode: destructive actions
  async function handleConfirmCancel() {
    if (!initialOrder) return;
    setIsDestructing(true);
    const updated = await updateOrderStatus(initialOrder.id, "cancelled");
    if (updated) {
      hapticDestructive();
      toast.success("Order cancelled", { duration: 5000 });
      router.push(`/orders/${initialOrder.id}`);
    } else {
      toast.error("Failed to cancel order");
    }
    setIsDestructing(false);
    setConfirmModal(null);
  }

  async function handleConfirmDelete() {
    if (!initialOrder) return;
    setIsDestructing(true);
    const success = await deleteOrder(initialOrder.id);
    if (success) {
      hapticDestructive();
      toast.success("Order deleted", { duration: 5000 });
      router.push("/today");
    } else {
      toast.error("Failed to delete order");
    }
    setIsDestructing(false);
    setConfirmModal(null);
  }

  function handleParsedItems(parsedItems: OrderItem[], source: "voice" | "paste" | "image") {
    // Match against catalog, unmatched items added as custom items
    const customItems: string[] = [];

    if (parsedItems.length > 0) {
      setItems((prev) => {
        const merged = [...prev];
        for (const vi of parsedItems) {
          const fi = frequentItems.find((f) => f.name.toLowerCase() === vi.name.toLowerCase());
          const stockLimit = fi?.stock !== null && fi?.stock !== undefined ? fi.stock : null;
          const existingIdx = merged.findIndex(
            (m) => m.name.toLowerCase() === vi.name.toLowerCase()
          );
          if (existingIdx >= 0) {
            let newQty = merged[existingIdx].qty + vi.qty;
            if (stockLimit !== null && newQty > stockLimit) newQty = stockLimit;
            merged[existingIdx] = {
              ...merged[existingIdx],
              qty: newQty,
              price: Math.max(merged[existingIdx].price, vi.price),
            };
          } else {
            let qty = vi.qty;
            if (stockLimit !== null && qty > stockLimit) qty = stockLimit;
            // Use catalog price if matched, otherwise keep AI-parsed price
            const price = fi ? fi.price : vi.price;
            if (!fi) customItems.push(vi.name);
            merged.push({ ...vi, price, qty });
          }
        }
        return merged;
      });
      hapticSuccess();
    }

    const sourceLabel = source === "voice" ? "suara" : source === "image" ? "foto" : "tempel";
    if (parsedItems.length > 0) {
      toast.success(`${parsedItems.length} items added from ${sourceLabel}`);
    }
    if (customItems.length > 0) {
      toast.info(`New items (not in catalog): ${customItems.join(", ")}`);
    }
    if (parsedItems.length === 0) {
      toast.error("No items detected");
    }

    track(`${source}_order_parsed`, {
      item_count: parsedItems.length,
      custom_count: customItems.length,
    });
  }

  function handleParsedOrder(data: ParsedOrderData, source: "paste" | "voice" | "image") {
    // Fill items
    handleParsedItems(data.items, source);

    // Fill customer
    if (data.customer_name) setCustomerName(data.customer_name);
    if (data.customer_phone) setCustomerPhone(data.customer_phone);

    // Fill delivery date
    if (data.delivery_date) {
      const dateVal = data.delivery_date + "T00:00";
      setDeliveryDate(dateVal);
    }

    // Fill notes
    if (data.notes) setNotes(data.notes);

    // Fill discount
    if (data.discount) setDiscount(String(data.discount));

    // Fill payment
    if (data.payment_status) {
      if (data.payment_status === "paid") {
        setPaymentMode("paid");
        setDpAmount("");
      } else if (data.payment_status === "dp") {
        setPaymentMode("dp");
        if (data.dp_amount) setDpAmount(String(data.dp_amount));
      } else {
        setPaymentMode("unpaid");
        setDpAmount("");
      }
    }

    // Summary toast for extra fields
    const extras: string[] = [];
    if (data.customer_name) extras.push("pelanggan");
    if (data.delivery_date) extras.push("tanggal");
    if (data.notes) extras.push("catatan");
    if (data.discount) extras.push("diskon");
    if (data.payment_status) extras.push("pembayaran");
    if (extras.length > 0) {
      toast.success(`Juga terisi: ${extras.join(", ")}`);
    }
  }

  async function handleSubmit(e?: React.FormEvent, saveAndNew = false) {
    e?.preventDefault();

    // Auto-add pending item from input fields
    let finalItems = items;
    if (itemName.trim() && itemPrice) {
      const pendingItem: OrderItem = {
        name: itemName.trim(),
        price: parseInt(itemPrice) || 0,
        qty: parseInt(itemQty) || 1,
      };
      finalItems = [...items, pendingItem];
      setItems(finalItems);
      setItemName("");
      setItemPrice("");
      setItemQty("1");
    }

    if (finalItems.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    if (finalItems.some((item) => item.price === 0)) {
      toast.error("Some items have RM 0 price. Tap an item to set the price.");
      return;
    }

    setIsSaving(true);

    const finalSubtotal = finalItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const finalTotal = Math.max(0, finalSubtotal - discountAmount);
    const paidAmount = paymentMode === "paid" ? finalTotal : paymentMode === "dp" ? (parseInt(dpAmount) || 0) : 0;

    if (isEdit) {
      // Save status change if it changed
      if (orderStatus !== initialOrder.status) {
        const statusUpdated = await updateOrderStatus(initialOrder.id, orderStatus);
        if (!statusUpdated) {
          toast.error("Failed to update status");
          setIsSaving(false);
          return;
        }
      }

      const updated = await updateOrder(initialOrder.id, {
        items: finalItems,
        customer_name: customerName || "",
        customer_phone: customerPhone || "",
        notes: notes || "",
        discount: discountAmount,
        paid_amount: paidAmount,
        delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : null,
        image_urls: imageUrls,
      } as Partial<Order>);

      setIsSaving(false);

      if (updated) {
        hapticSuccess();
        toast.success("Order updated", { duration: 5000 });
        router.push(`/orders/${initialOrder.id}`);
      } else {
        toast.error("Could not save order. Check your connection and retry");
      }
      return;
    }

    // Offline create path
    if (!navigator.onLine) {
      await createOrderOffline({
        items: finalItems,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        notes: notes || undefined,
        discount: discountAmount,
        delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        is_preorder: isPreorder,
        is_dine_in: isDineIn,
        is_langganan: isLangganan,
        is_booking: isBooking,
        booking_time: bookingTime || undefined,
        table_number: tableNumber || undefined,
        paid_amount: paidAmount,
        source: "manual",
      });
      setIsSaving(false);
      hapticSuccess();
      track("order_created", { source: "offline", items_count: finalItems.length, total: finalTotal });
      toast.success("Order saved offline — will sync when online", { duration: 5000 });
      router.push("/today");
      return;
    }

    const order = await createOrder({
      items: finalItems,
      customer_name: customerName || undefined,
      customer_phone: customerPhone || undefined,
      notes: notes || undefined,
      discount: discountAmount,
      delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
      is_preorder: isPreorder,
      is_dine_in: isDineIn,
      is_langganan: isLangganan,
      is_booking: isBooking,
      booking_time: bookingTime || undefined,
      table_number: tableNumber || undefined,
      paid_amount: paidAmount,
      source: "manual",
      ...(imageUrls.length > 0 && { image_urls: imageUrls }),
    });

    setIsSaving(false);

    if (order) {
      // Auto-create products for custom (non-catalog) items
      const customItems = finalItems.filter(
        (item) => !frequentItems.find((f) => f.name.toLowerCase() === item.name.toLowerCase())
      );
      if (customItems.length > 0) {
        await Promise.all(
          customItems.map((item) => createProduct({ name: item.name, price: item.price }))
        );
      }

      track("order_created", { source: "manual", items_count: finalItems.length, total: order.total });
      if (saveAndNew) {
        // Reset form for next order
        setSessionCount((c) => c + 1);
        setItems([]);
        setCustomerName("");
        setCustomerPhone("");
        setNotes("");
        setDiscount("");
        setPaymentMode("unpaid");
        setDpAmount("");
        setDeliveryDate("");
        setShowDelivery(false);
        setShowNotes(false);
        setShowDiscount(false);
        setEditingIndex(null);
        setShowManualInput(false);
        selectedFromDropdownRef.current = false;
        userHasTypedPriceRef.current = false;
        dismissedPriceChipsRef.current.clear();
        setPriceChip(null);
        clearItemSuggestionsCache();
        hapticSuccess();
        toast.success(`Order created — RM ${order.total.toLocaleString("en-MY")}`, { duration: 3000 });
        setTimeout(() => itemNameRef.current?.focus(), 100);
      } else if (ordersUsedBefore === 0 && sessionCount === 0) {
        setCelebrationOrder(order);
        setShowCelebration(true);
      } else {
        hapticSuccess();
        toast.success("Order created", { duration: 5000 });
        router.push(`/orders/${order.id}`);
      }
    } else {
      toast.error("Could not save order. Check your connection and retry");
    }
  }

  function celebrationShareWA() {
    if (!celebrationOrder) return;
    const bizName = savedBusinessName || celebrationBusinessName.trim() || undefined;
    setWaPreviewData({
      message: buildCelebrationConfirmation(celebrationOrder, bizName),
      name: celebrationOrder.customer_name,
      phone: celebrationOrder.customer_phone,
    });
    setShowCelebration(false);
  }


  function shareOrderWA() {
    if (!liveOrder) return;
    setWaPreviewData({
      message: buildOrderWithStatus(liveOrder),
      name: liveOrder.customer_name,
      phone: liveOrder.customer_phone,
    });
  }

  function sendPaymentReminder() {
    if (!liveOrder) return;
    setWaPreviewData({
      message: buildPaymentReminder(liveOrder),
      name: liveOrder.customer_name,
      phone: liveOrder.customer_phone,
    });
  }


  return (
    <div className="max-w-2xl mx-auto pb-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-5">
        <div>
          {isEdit ? (
            <>
              <h1 className="text-lg font-semibold text-foreground">
                {initialOrder.customer_id ? (
                  <Link href={`/customers/${initialOrder.customer_id}`} className="hover:underline">
                    {initialOrder.customer_name || initialOrder.customer_phone || "Order"}
                  </Link>
                ) : (
                  initialOrder.customer_name || initialOrder.customer_phone || "Order"
                )}
              </h1>
              <p className="text-xs text-muted-foreground">
                {initialOrder.order_number} · {new Date(initialOrder.created_at).toLocaleDateString("en-MY", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {initialOrder.source === "order_link" && initialOrder.status === "new" && (
                <p className="text-xs text-warm-amber mt-0.5">
                  Order via store link — confirm on WhatsApp before processing
                </p>
              )}
            </>
          ) : (
            <div>
              <h1 className="text-lg font-semibold text-foreground">Orders</h1>
              <p className="text-xs text-muted-foreground">Log new orders from customers</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isEdit && liveOrder && (
            <>
              <Link
                href={hasInvoice ? `/invoices` : `/invoices/new?orderId=${initialOrder!.id}`}
                className="h-9 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium bg-card border border-border shadow-sm hover:bg-muted transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                {hasInvoice ? "View Invoice" : "Create Invoice"}
              </Link>
              <div ref={waMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowWAMenu(!showWAMenu)}
                  className="h-9 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium bg-card border border-border shadow-sm hover:bg-muted cursor-pointer transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  WA
                </button>
                {showWAMenu && (
                  <div className="absolute right-0 mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden min-w-[180px] z-50">
                    <button
                      type="button"
                      onClick={() => { shareOrderWA(); setShowWAMenu(false); }}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted active:bg-muted/80 transition-colors"
                    >
                      Confirm order
                    </button>
                    {liveOrder.paid_amount === 0 && (
                      <button
                        type="button"
                        onClick={() => { sendPaymentReminder(); setShowWAMenu(false); }}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted active:bg-muted/80 border-t transition-colors"
                      >
                        Payment reminder
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
          {!isEdit && (
            <button
              type="button"
              onClick={() => setShowPaste(true)}
              className="h-9 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium bg-card border border-border shadow-sm hover:bg-muted cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-fill
            </button>
          )}
          <Link href="/orders" className="h-9 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium bg-card border border-border shadow-sm hover:bg-muted transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

      {isFormLocked && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
          initialOrder?.status === 'done'
            ? 'bg-warm-green-light text-warm-green'
            : 'bg-muted text-muted-foreground'
        }`}>
          {initialOrder?.status === 'done'
            ? 'Order is completed. Only payment status can be changed.'
            : 'Order is cancelled.'}
        </div>
      )}

      {/* Mode indicator */}
      {!isEdit && (isPreorder || isLangganan || isDineIn) && (
        <div className={`rounded-lg px-3 py-2 text-xs font-medium ${
          isLangganan ? "bg-blue-50 text-blue-700 border border-blue-200" :
          isPreorder ? "bg-amber-50 text-amber-700 border border-amber-200" :
          "bg-orange-50 text-orange-700 border border-orange-200"
        }`}>
          {isLangganan && "Subscription mode — date optional, pay later"}
          {isPreorder && !isLangganan && "Pre-order mode — delivery date is required"}
          {isDineIn && "Walk-in mode"}
        </div>
      )}

      <div className="rounded-lg border bg-card px-4 py-4 space-y-6 shadow-sm">

        {/* Section: Order (always visible, first for natural flow) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider shrink-0">Orders</p>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {items.reduce((sum, i) => sum + i.qty, 0)} item · RM {items.reduce((sum, i) => sum + i.price * i.qty, 0).toLocaleString("en-MY")}
                </p>
              )}
              {frequentItems.length > 0 && !isFormLocked && (
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className={`w-44 h-7 pl-7 text-xs rounded-md border border-border bg-muted/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors placeholder:text-muted-foreground ${productSearch ? "pr-6" : "pr-2"}`}
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch("")}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Product cards grid */}
          {loadingProducts ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-lg border border-border p-2 animate-pulse">
                  <div className="h-4 w-2/3 bg-muted rounded" />
                  <div className="h-3 w-1/3 bg-muted rounded mt-1.5" />
                </div>
              ))}
            </div>
          ) : frequentItems.length > 0 ? (
            <>
              <div className={`relative grid grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-[220px] overflow-y-auto scroll-smooth${isFormLocked ? ' pointer-events-none opacity-60' : ''}`} style={{ maskImage: "linear-gradient(to bottom, black calc(100% - 24px), transparent)", WebkitMaskImage: "linear-gradient(to bottom, black calc(100% - 24px), transparent)" }}>
                {(productSearch
                  ? frequentItems.filter((fi) => fi.name.toLowerCase().includes(productSearch.toLowerCase()))
                  : frequentItems.slice(0, 12)
                ).map((fi) => {
                  const existingItem = items.find((i) => i.name.toLowerCase() === fi.name.toLowerCase());
                  const currentQty = existingItem?.qty ?? 0;
                  const hasStock = fi.stock !== null && fi.stock !== undefined;
                  const atStockLimit = hasStock && currentQty >= fi.stock!;
                  const isLowStock = hasStock && fi.stock! > 0 && fi.stock! <= 5;
                  const isOutOfStock = hasStock && fi.stock! <= 0;
                  const minQty = fi.min_order_qty && fi.min_order_qty > 1 ? fi.min_order_qty : 1;

                  const handleIncrement = () => {
                    if (isOutOfStock) return;
                    setItems((prev) => {
                      const existingIdx = prev.findIndex((i) => i.name.toLowerCase() === fi.name.toLowerCase());
                      if (existingIdx >= 0) {
                        const newQty = prev[existingIdx].qty + 1;
                        if (hasStock && newQty > fi.stock!) return prev;
                        return prev.map((item, idx) => idx === existingIdx ? { ...item, qty: newQty } : item);
                      }
                      return [...prev, { name: fi.name, price: fi.price, qty: minQty }];
                    });
                  };

                  const handleDecrement = () => {
                    setItems((prev) => {
                      const existingIdx = prev.findIndex((i) => i.name.toLowerCase() === fi.name.toLowerCase());
                      if (existingIdx < 0) return prev;
                      const newQty = prev[existingIdx].qty - 1;
                      if (newQty < minQty) return prev.filter((_, idx) => idx !== existingIdx);
                      return prev.map((item, idx) => idx === existingIdx ? { ...item, qty: newQty } : item);
                    });
                  };

                  return (
                    <div
                      key={fi.name}
                      role="button"
                      tabIndex={isOutOfStock ? -1 : 0}
                      onClick={() => {
                        if (isOutOfStock || atStockLimit) return;
                        handleIncrement();
                      }}
                      className={`relative text-left rounded-lg border p-2 transition-colors squish-press select-none ${
                        isOutOfStock
                          ? "bg-muted/20 border-border opacity-50 cursor-not-allowed"
                          : "bg-muted/30 border-border hover:bg-muted/50 active:bg-muted/70 cursor-pointer"
                      }`}
                    >
                      <p className="text-sm font-medium truncate text-foreground">
                        {fi.name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <p className="text-xs text-muted-foreground">
                          RM {fi.price.toLocaleString("en-MY")}
                          {fi.unit && <span> / {fi.unit}</span>}
                        </p>
                        {isLowStock && !isOutOfStock && (
                          <span className="text-[10px] text-warm-rose ml-auto">Sisa {fi.stock}</span>
                        )}
                        {isOutOfStock && (
                          <span className="text-[10px] text-muted-foreground ml-auto">Habis</span>
                        )}
                      </div>
                      <div className={`flex items-center gap-2 mt-1.5 pt-1.5 border-t transition-opacity ${existingItem ? "border-border/50 opacity-100" : "border-transparent opacity-0 pointer-events-none"}`} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={handleDecrement}
                          className="w-8 h-8 flex items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-muted transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-bold text-foreground w-5 text-center">{currentQty}</span>
                        <button
                          type="button"
                          onClick={handleIncrement}
                          disabled={atStockLimit}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-warm-green text-white hover:bg-warm-green-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        {minQty > 1 && (
                          <span className="text-[11px] text-muted-foreground">Min. {minQty}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {/* Custom (non-catalog) item cards */}
                {items.map((item, index) => {
                  const isProduct = !!frequentItems.find((f) => f.name.toLowerCase() === item.name.toLowerCase());
                  if (isProduct) return null;
                  const handleCustomIncrement = () => {
                    setItems((prev) => prev.map((it, idx) => idx === index ? { ...it, qty: it.qty + 1 } : it));
                  };
                  const handleCustomDecrement = () => {
                    setItems((prev) => {
                      if (prev[index].qty <= 1) return prev.filter((_, idx) => idx !== index);
                      return prev.map((it, idx) => idx === index ? { ...it, qty: it.qty - 1 } : it);
                    });
                  };
                  return (
                    <div
                      key={`custom-${index}`}
                      className="relative text-left rounded-lg border p-2 transition-colors squish-press select-none bg-muted/30 border-border"
                    >
                      <p className="text-sm font-medium truncate text-foreground">{item.name}</p>
                      {editingIndex === index ? (
                        <div className="flex items-center gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                          <span className="text-xs text-muted-foreground">Rp</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoFocus
                            value={item.price || ""}
                            onChange={(e) => updateItem(index, "price", e.target.value.replace(/\D/g, ""))}
                            onKeyDown={(e) => { if (e.key === "Enter") setEditingIndex(null); }}
                            onBlur={() => setEditingIndex(null)}
                            className="w-20 h-6 px-1 text-xs bg-background border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-warm-green/30"
                          />
                        </div>
                      ) : (
                        <p
                          className={`text-xs mt-0.5 cursor-pointer ${item.price === 0 ? "text-warm-rose font-medium" : "text-muted-foreground"}`}
                          onClick={(e) => { e.stopPropagation(); setEditingIndex(index); }}
                        >
                          {item.price === 0 ? "Isi harga" : `RM ${item.price.toLocaleString("en-MY")}`}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-border/50">
                        <button
                          type="button"
                          onClick={handleCustomDecrement}
                          className="w-8 h-8 flex items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-muted transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-bold text-foreground w-5 text-center">{item.qty}</span>
                        <button
                          type="button"
                          onClick={handleCustomIncrement}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-warm-green text-white hover:bg-warm-green-hover transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="ml-auto p-1 text-muted-foreground/40 hover:text-warm-rose transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
                {!isFormLocked && (
                <div className="flex items-center gap-2">
                  <div ref={manualBtnRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowManualInput(!showManualInput);
                        if (!showManualInput) {
                          setTimeout(() => itemNameRef.current?.focus(), 100);
                        }
                      }}
                      className={`inline-flex h-7 px-2.5 text-xs font-medium rounded-full border items-center gap-1 transition-colors ${
                        showManualInput
                          ? "bg-warm-green/10 border-warm-green/30 text-warm-green"
                          : "border-dashed border-border text-muted-foreground hover:bg-muted active:bg-muted/80"
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      Item lain
                    </button>
                  </div>
                </div>
                )}
              {!isFormLocked && showManualInput && (
                <div ref={manualInputRef} className="rounded-xl border bg-card shadow-sm p-3 space-y-2 lg:space-y-0">
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                    <input
                      ref={itemNameRef}
                      type="text"
                      placeholder="Item name"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full lg:flex-1 h-10 px-3 text-sm bg-background border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-warm-green/30"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Price (RM)"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value.replace(/\D/g, ""))}
                        className="flex-1 lg:w-28 h-10 px-3 text-sm bg-background border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-warm-green/30"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Qty"
                        value={itemQty}
                        onChange={(e) => setItemQty(e.target.value.replace(/\D/g, ""))}
                        className="w-16 h-10 px-3 text-sm bg-background border rounded-lg shadow-sm text-center focus:outline-none focus:ring-2 focus:ring-warm-green/30"
                      />
                    <button
                      type="button"
                      onClick={addItem}
                      disabled={!itemName.trim() || !itemPrice}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-warm-green text-white hover:bg-warm-green-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center">
                <p className="text-sm text-muted-foreground mb-3">Type items directly, or paste a WA chat</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowManualInput(true); setTimeout(() => itemNameRef.current?.focus(), 100); }}
                    className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg text-xs font-medium bg-warm-green text-white hover:bg-warm-green-hover transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Type Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaste(true)}
                    className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg text-xs font-medium bg-card border border-border shadow-sm hover:bg-muted transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Paste WhatsApp chat
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">
                  Want a catalog? <Link href="/products/new" className="text-warm-green font-medium hover:underline">Add a product</Link>
                </p>
              </div>
              {showManualInput && (
                <div className="rounded-xl border bg-card shadow-sm p-3 space-y-2 lg:space-y-0">
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                    <input
                      ref={itemNameRef}
                      type="text"
                      placeholder="Item name"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full lg:flex-1 h-10 px-3 text-sm bg-background border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-warm-green/30"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Price (RM)"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value.replace(/\D/g, ""))}
                        className="flex-1 lg:w-28 h-10 px-3 text-sm bg-background border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-warm-green/30"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Qty"
                        value={itemQty}
                        onChange={(e) => setItemQty(e.target.value.replace(/\D/g, ""))}
                        className="w-16 h-10 px-3 text-sm bg-background border rounded-lg shadow-sm text-center focus:outline-none focus:ring-2 focus:ring-warm-green/30"
                      />
                      <button
                        type="button"
                        onClick={addItem}
                        disabled={!itemName.trim() || !itemPrice}
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-warm-green text-white hover:bg-warm-green-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dine-in: Table number */}
        {isDineIn && (
          <div className={`space-y-1.5${isFormLocked ? ' pointer-events-none opacity-60' : ''}`}>
            <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Table number</p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Opsional"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full h-11 px-3 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-background transition-colors placeholder:text-muted-foreground/50"
            />
          </div>
        )}

        {/* Customer — optional in dine-in mode */}
        {isDineIn ? (
          <div className={isFormLocked ? 'pointer-events-none opacity-60' : ''}>
            <button
              type="button"
              onClick={() => setShowCustomer(!showCustomer)}
              className="text-xs font-medium text-warm-green hover:underline"
            >
              {showCustomer ? "Hide customer" : "+ Add customer (optional)"}
            </button>
            {showCustomer && (
              <div className="mt-1.5">
                <CustomerPicker
                  customerName={customerName}
                  customerPhone={customerPhone}
                  onSelect={handleCustomerSelect}
                  onNameChange={setCustomerName}
                  onPhoneChange={setCustomerPhone}
                  compact={false}
                />
              </div>
            )}
          </div>
        ) : (
          <div className={`space-y-1.5${isFormLocked ? ' pointer-events-none opacity-60' : ''}`}>
            <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Customers</p>
            <CustomerPicker
              customerName={customerName}
              customerPhone={customerPhone}
              onSelect={handleCustomerSelect}
              onNameChange={setCustomerName}
              onPhoneChange={setCustomerPhone}
              compact={false}
            />
          </div>
        )}

        {/* Delivery date — hidden in dine-in mode */}
        {!isDineIn && (() => {
          const MONTH_NAMES_CAL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          const DAY_LABELS_CAL = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

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

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
          const tmr = new Date(today);
          tmr.setDate(tmr.getDate() + 1);
          const tmrStr = `${tmr.getFullYear()}-${String(tmr.getMonth() + 1).padStart(2, "0")}-${String(tmr.getDate()).padStart(2, "0")}`;
          const lusa = new Date(today);
          lusa.setDate(lusa.getDate() + 2);
          const lusaStr = `${lusa.getFullYear()}-${String(lusa.getMonth() + 1).padStart(2, "0")}-${String(lusa.getDate()).padStart(2, "0")}`;

          const datePartOfValue = deliveryDate.slice(0, 10);
          const timePartOfValue = deliveryDate.slice(11, 16);
          const activeChip = datePartOfValue === todayStr ? "today" : datePartOfValue === tmrStr ? "tomorrow" : datePartOfValue === lusaStr ? "lusa" : datePartOfValue ? "other" : null;

          function pickDate(dateStr: string) {
            if (datePartOfValue === dateStr) {
              setDeliveryDate("");
            } else {
              setDeliveryDate(timePartOfValue ? `${dateStr}T${timePartOfValue}` : `${dateStr}T00:00`);
            }
          }

          function pickTime(time: string) {
            const datePart = datePartOfValue || todayStr;
            if (time) {
              setDeliveryDate(`${datePart}T${time}`);
            } else {
              setDeliveryDate(`${datePart}T00:00`);
            }
          }

          const selectedDateObj = datePartOfValue ? new Date(datePartOfValue + "T00:00") : null;
          const calDays = getCalendarDays(pickerYear, pickerMonth);

          return (
            <div className={`space-y-2${isFormLocked ? ' pointer-events-none opacity-60' : ''}`}>
              <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Delivery</p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => { pickDate(todayStr); setShowCalendar(false); }}
                  className={`h-8 px-3 text-xs font-medium rounded-lg border transition-colors ${
                    activeChip === "today"
                      ? "bg-warm-green-light border-warm-green/30 text-warm-green"
                      : "bg-muted/50 border-border text-foreground/70 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => { pickDate(tmrStr); setShowCalendar(false); }}
                  className={`h-8 px-3 text-xs font-medium rounded-lg border transition-colors ${
                    activeChip === "tomorrow"
                      ? "bg-warm-green-light border-warm-green/30 text-warm-green"
                      : "bg-muted/50 border-border text-foreground/70 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => { pickDate(lusaStr); setShowCalendar(false); }}
                  className={`h-8 px-3 text-xs font-medium rounded-lg border transition-colors ${
                    activeChip === "lusa"
                      ? "bg-warm-green-light border-warm-green/30 text-warm-green"
                      : "bg-muted/50 border-border text-foreground/70 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  In 2 days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedDateObj) {
                      setPickerMonth(selectedDateObj.getMonth());
                      setPickerYear(selectedDateObj.getFullYear());
                    } else {
                      setPickerMonth(today.getMonth());
                      setPickerYear(today.getFullYear());
                    }
                    setShowCalendar(!showCalendar);
                  }}
                  className={`h-8 px-3 text-xs font-medium rounded-lg border transition-colors ${
                    activeChip === "other"
                      ? "bg-warm-green-light border-warm-green/30 text-warm-green"
                      : "bg-muted/50 border-border text-foreground/70 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {activeChip === "other"
                    ? new Date(datePartOfValue + "T00:00").toLocaleDateString("en-MY", { day: "numeric", month: "short" })
                    : "Other date"
                  }
                </button>
                {deliveryDate && (
                  <button
                    type="button"
                    onClick={() => { setDeliveryDate(""); setShowCalendar(false); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <span className="text-base">×</span>
                  </button>
                )}
              </div>

              {/* Custom calendar dropdown */}
              {showCalendar && (
                <div ref={calendarRef} className="bg-card border rounded-xl shadow-lg p-3 max-w-xs">
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
                      {MONTH_NAMES_CAL[pickerMonth]} {pickerYear}
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
                    {DAY_LABELS_CAL.map((d) => (
                      <span key={d} className="text-[10px] font-medium text-muted-foreground py-1">{d}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {calDays.map((day, i) => {
                      if (day === null) return <span key={`empty-${i}`} />;
                      const d = new Date(pickerYear, pickerMonth, day);
                      d.setHours(0, 0, 0, 0);
                      const isPast = d < today;
                      const isSelected = selectedDateObj && d.getTime() === selectedDateObj.getTime();
                      const isToday = d.getTime() === today.getTime();
                      const dateStr = `${pickerYear}-${String(pickerMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={isPast}
                          onClick={() => {
                            const time = timePartOfValue || "00:00";
                            setDeliveryDate(`${dateStr}T${time}`);
                            setShowCalendar(false);
                          }}
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
              )}

              {/* Time picker removed — use Note for specific time needs */}
            </div>
          );
        })()}

        {/* Note + Discount — combined row */}
        <div className={`space-y-1.5${isFormLocked ? ' pointer-events-none opacity-60' : ''}`}>
          <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Additional Details</p>
          <div className="flex gap-2">
            <div className="flex-1 rounded-lg border bg-muted/50 transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 focus-within:bg-background">
              <label className="block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground">Note</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. no spice, deliver in the evening..."
                className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
              />
            </div>
            <div className="w-32 shrink-0 rounded-lg border bg-muted/50 transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 focus-within:bg-background">
              <label className="block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground">Discount</label>
              <div className="flex items-center px-3 pb-2 pt-0 gap-1">
                <span className="text-sm text-muted-foreground shrink-0 select-none">RM</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={discount ? parseInt(discount).toLocaleString("en-MY") : ""}
                  onChange={(e) => setDiscount(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                />
              </div>
            </div>
          </div>
          {discountAmount > subtotal && subtotal > 0 && (
            <p className="text-xs text-warm-rose">Discount exceeds subtotal</p>
          )}
        </div>

        {/* Photo Attachment */}
        <div className={`space-y-1.5${isFormLocked ? ' pointer-events-none opacity-60' : ''}`}>
          <button
            type="button"
            onClick={() => setShowPhotoAttach(!showPhotoAttach)}
            className="text-xs font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5"
          >
            Reference Photos
            <span className="text-muted-foreground font-normal normal-case tracking-normal">
              {imageUrls.length > 0 ? `(${imageUrls.length})` : "(optional)"}
            </span>
          </button>
          {showPhotoAttach && (
            <div className="space-y-2">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    toast.error("Max file size is 2MB");
                    return;
                  }
                  if (imageUrls.length >= 3) {
                    toast.error("Max 3 photos");
                    return;
                  }
                  setIsUploadingPhoto(true);
                  try {
                    const supabase = createClient();
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) throw new Error("Not authenticated");
                    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
                    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
                    const { error: uploadError } = await supabase.storage
                      .from("order-images")
                      .upload(path, file, { upsert: true });
                    if (uploadError) throw uploadError;
                    const { data: urlData } = supabase.storage
                      .from("order-images")
                      .getPublicUrl(path);
                    setImageUrls(prev => [...prev, urlData.publicUrl]);
                    toast.success("Photo added");
                  } catch {
                    toast.error("Failed to upload photo");
                  }
                  setIsUploadingPhoto(false);
                  if (photoInputRef.current) photoInputRef.current.value = "";
                }}
                className="hidden"
              />
              <div className="flex gap-2 flex-wrap">
                {imageUrls.map((url, i) => (
                  <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrls(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {imageUrls.length < 3 && (
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="text-2xl">+</span>
                    )}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">Design photos, greeting cards, or references. Max 3 photos.</p>
            </div>
          )}
        </div>

        {/* Edit-mode: Order status */}
        {isEdit && initialOrder && initialOrder.status !== "cancelled" && (
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Order status</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {ORDER_STATUS_FLOW.map((status) => {
                const isActive = orderStatus === status;
                const chipStyle = isActive
                  ? status === "new" ? "bg-warm-blue-light border-warm-blue/30 text-warm-blue"
                  : status === "processed" ? "bg-warm-amber-light border-warm-amber/30 text-warm-amber"
                  : status === "shipped" ? "bg-warm-purple-light border-warm-purple/30 text-warm-purple"
                  : "bg-warm-green-light border-warm-green/30 text-warm-green"
                  : "bg-muted/50 border-border text-foreground/70 hover:bg-muted hover:text-foreground";
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setOrderStatus(status)}
                    className={`h-7 px-2.5 text-xs font-medium rounded-full border transition-colors ${chipStyle}`}
                  >
                    {ORDER_STATUS_LABELS[status]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Pembayaran — always visible */}
        <div className={`space-y-1.5${isPaymentLocked ? ' pointer-events-none opacity-60' : ''}`}>
          <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Payment Status</p>
          <InlineHint hintId="payment-toggle" text="Set the payment status for this order" />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { setPaymentMode("paid"); setDpAmount(""); }}
              className={`h-7 px-2.5 text-xs font-medium rounded-full border transition-colors ${
                paymentMode === "paid"
                  ? "bg-warm-green-light border-warm-green/30 text-warm-green"
                  : "bg-muted/50 border-border text-foreground/70 hover:bg-muted hover:text-foreground"
              }`}
            >
              Paid
            </button>
            <button
              type="button"
              onClick={() => { setPaymentMode("dp"); }}
              className={`h-7 px-2.5 text-xs font-medium rounded-full border transition-colors ${
                paymentMode === "dp"
                  ? "bg-warm-amber-light border-warm-amber/30 text-warm-amber"
                  : "bg-muted/50 border-border text-foreground/70 hover:bg-muted hover:text-foreground"
              }`}
            >
              DP
            </button>
            <button
              type="button"
              onClick={() => { setPaymentMode("unpaid"); setDpAmount(""); }}
              className={`h-7 px-2.5 text-xs font-medium rounded-full border transition-colors ${
                paymentMode === "unpaid"
                  ? "bg-warm-rose-light border-warm-rose/30 text-warm-rose"
                  : "bg-muted/50 border-border text-foreground/70 hover:bg-muted hover:text-foreground"
              }`}
            >
              Unpaid
            </button>
          </div>
          {paymentMode === "dp" && (
            <input
              type="number"
              value={dpAmount}
              onChange={(e) => setDpAmount(e.target.value)}
              placeholder="Down payment (RM)"
              autoFocus
              className="w-full h-11 px-3 bg-muted/50 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-background transition-colors placeholder:text-muted-foreground"
            />
          )}
        </div>

        {/* Edit-mode: Destructive actions */}
        {isEdit && initialOrder && (
          <div className="flex items-center justify-center gap-6 pt-4 mt-2 border-t border-border">
            {initialOrder.status !== "cancelled" && initialOrder.status !== "done" && (
              <button
                type="button"
                onClick={() => setConfirmModal("cancel")}
                className="text-xs text-muted-foreground hover:text-warm-rose active:text-warm-rose transition-colors"
              >
                Cancel order
              </button>
            )}
            <button
              type="button"
              onClick={() => setConfirmModal("delete")}
              className="text-xs text-warm-rose hover:text-warm-rose active:text-warm-rose/80 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete order
            </button>
          </div>
        )}

      </div>{/* End card */}

      {/* Spacer for sticky bar */}
      {items.length > 0 && <div className="h-20" />}

      </form>

      {/* Sticky total + submit bar */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-40 bg-white border-t border-border">
          <div className="max-w-2xl mx-auto px-4 lg:px-6 py-3 flex items-center gap-3">
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-muted-foreground">
                {items.length} item
                {discountAmount > 0 && (
                  <span className="text-warm-rose ml-1">
                    -RM {discountAmount.toLocaleString("en-MY")}
                  </span>
                )}
              </span>
              <span className="text-sm font-bold text-foreground">
                RM {total.toLocaleString("en-MY")}
              </span>
            </div>
            {!isEdit && (
              <button
                type="button"
                onClick={() => handleSubmit(undefined, true)}
                disabled={isSaving}
                className="ml-auto h-10 px-4 rounded-lg bg-card border border-border text-xs font-medium text-foreground hover:bg-muted active:bg-muted disabled:opacity-50 disabled:cursor-not-allowed squish-press transition-colors shadow-sm"
              >
                {isSaving ? "Saving..." : "Order again"}
              </button>
            )}
            {!isPaymentLocked && (
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSaving}
              className={`${isEdit ? "ml-auto" : ""} h-10 px-5 rounded-lg bg-warm-green text-white text-xs font-medium hover:bg-warm-green-hover active:bg-warm-green-hover disabled:opacity-50 disabled:cursor-not-allowed squish-press transition-colors`}
            >
              {isSaving ? "Saving..." : isEdit ? "Save changes" : "Create order"}
            </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation modal for cancel/delete */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end lg:items-center justify-center">
          <div className="bg-background rounded-t-2xl lg:rounded-2xl p-6 pb-8 w-full max-w-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-warm-rose-light flex items-center justify-center mb-3">
                <Trash2 className="w-6 h-6 text-warm-rose" />
              </div>
              <h2 className="text-base font-semibold text-foreground mb-1">
                {confirmModal === "cancel" ? "Cancel this order?" : "Delete this order?"}
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                {confirmModal === "cancel"
                  ? "Order will change to the Cancelled status. This cannot be undone."
                  : "Order will be permanently deleted and cannot be restored."}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  disabled={isDestructing}
                  className="flex-1 h-11 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmModal === "cancel" ? handleConfirmCancel : handleConfirmDelete}
                  disabled={isDestructing}
                  className="flex-1 h-11 rounded-lg bg-warm-rose text-white text-sm font-medium hover:bg-warm-rose/90 active:bg-warm-rose/80 transition-colors disabled:opacity-50"
                >
                  {isDestructing
                    ? "Processing..."
                    : confirmModal === "cancel"
                      ? "Ya, Batalkan"
                      : "Yes, delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* First-order celebration bottom sheet */}
      {showCelebration && celebrationOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end lg:items-center justify-center">
          <div className="bg-background rounded-t-2xl lg:rounded-2xl p-6 pb-8 w-full max-w-lg">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-warm-green-light flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-warm-green" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-1">
                First order logged!
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Kirim konfirmasi ke pelanggan lewat WA supaya terlihat profesional.
              </p>
              {/* Business name prompt — only if not set */}
              {!savedBusinessName && (
                <div className="w-full mb-4">
                  <label className="text-xs text-muted-foreground text-left block mb-1.5">Business name (for WA signature)</label>
                  <input
                    type="text"
                    placeholder="cth: Katering Bu Ani"
                    value={celebrationBusinessName}
                    onChange={(e) => setCelebrationBusinessName(e.target.value)}
                    onBlur={async () => {
                      if (celebrationBusinessName.trim()) {
                        setSavedBusinessName(celebrationBusinessName.trim());
                        await fetch("/api/profile", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ business_name: celebrationBusinessName.trim() }),
                        });
                      }
                    }}
                    className="w-full h-11 px-3 bg-card border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-warm-green/20 focus:border-warm-green"
                    autoFocus
                  />
                </div>
              )}
              <button
                type="button"
                onClick={celebrationShareWA}
                className="w-full h-12 bg-warm-green text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                Kirim ke WhatsApp
              </button>
              <button
                type="button"
                onClick={() => router.push(`/orders/${celebrationOrder.id}`)}
                className="w-full h-11 text-sm text-muted-foreground mt-2"
              >
                View order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WA Preview Sheet */}
      {waPreviewData && (
        <WAPreviewSheet
          open={!!waPreviewData}
          onClose={() => {
            setWaPreviewData(null);
            if (celebrationOrder) router.push(`/orders/${celebrationOrder.id}/edit`);
          }}
          customerName={waPreviewData.name}
          customerPhone={waPreviewData.phone}
          initialMessage={waPreviewData.message}
        />
      )}

      {/* AI Order Sheet (unified paste/image/voice) */}
      {showPaste && (
        <AIOrderSheet
          open={showPaste}
          onClose={() => setShowPaste(false)}
          onParsed={(data) => handleParsedOrder(data, "paste")}
          products={frequentItems.map((fi) => ({ name: fi.name, price: fi.price }))}
          voiceSupported={voiceSupported}
        />
      )}

      {/* Image Order Sheet */}

    </div>
  );
}
