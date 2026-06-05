"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Minus, Trash2, User, Check, MessageSquare, FileText, Percent, Pencil, CalendarDays, Lightbulb, Sparkles, Bell, ChevronLeft, ChevronRight, Loader2, CircleDollarSign, Search, X, Truck, Receipt, Download } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AssigneePicker } from "@/features/staff/components/AssigneePicker";
import { toast } from "sonner";
import { createOrder, updateOrder, updateOrderStatus, deleteOrder, undoOrder, getItemSuggestions, clearItemSuggestionsCache, getFrequentItems, getRecentOrdersByCustomer, recordPayment } from "../services/order.service";
import type { ItemSuggestion, FrequentItem } from "../services/order.service";
import { getProfile } from "@/features/receipts/services/receipt.service";
import { createClient } from "@/lib/supabase/client";
import { buildCelebrationConfirmation, buildOrderWithStatus, buildPaymentReminder } from "@/lib/utils/wa-messages";
import { COURIER_NAMES } from "@/lib/utils/courier";
import { CustomerPicker } from "@/features/customers/components/CustomerPicker";
import { WAPreviewSheet } from "./WAPreviewSheet";
import { InlineHint } from "./InlineHint";
import { ProofAiCheck } from "./ProofAiCheck";
import { usePeakMode } from "../hooks/usePeakMode";
import { hapticSuccess, hapticDestructive } from "@/lib/utils/haptics";
import { createOrderOffline } from "@/lib/offline/sync";
import { track } from "@/lib/analytics";
import { createProduct } from "@/features/products/services/product.service";
import { isSpeechSupported } from "@/lib/voice/speech-recognition";

const AIOrderSheet = dynamic(() => import("./AIOrderSheet").then((m) => m.AIOrderSheet), { ssr: false });
import type { Order, OrderItem, OrderStatus, OrderStatusLog } from "../types/order.types";
import type { ParsedOrderData } from "./AIOrderSheet";
import { ORDER_STATUS_LABELS, ORDER_STATUS_FLOW } from "../types/order.types";
import { StatusTimeline } from "./StatusTimeline";

const KNOWN_COURIERS = COURIER_NAMES;

interface OrderFormProps {
  initialOrder?: Order;
  statusLogs?: OrderStatusLog[];
  assignedStaffId?: string | null;
  onAssignedStaffChange?: (staffId: string | null) => void;
}

export function OrderForm({ initialOrder, statusLogs, assignedStaffId, onAssignedStaffChange }: OrderFormProps) {
  const isEdit = !!initialOrder;
  const isFormLocked = isEdit && (initialOrder?.status === 'done' || initialOrder?.status === 'cancelled');
  const isPaymentLocked = isEdit && initialOrder?.status === 'cancelled';
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPeak = usePeakMode();

  const [items, setItems] = useState<OrderItem[]>(() => {
    if (initialOrder?.items) return initialOrder.items;
    // Repeat-order shortcut: ?items= param accepts JSON-encoded OrderItem[].
    // searchParams.get already URI-decodes, so feed it directly to JSON.parse —
    // a second decodeURIComponent throws URIError on bare % literals (e.g.
    // product name "10% off") and would silently drop the prefilled cart.
    const itemsParam = searchParams.get("items");
    if (itemsParam) {
      try {
        const parsed = JSON.parse(itemsParam);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((p) => p && typeof p.name === "string" && typeof p.qty === "number")
            .slice(0, 50)
            .map((p) => ({
              product_id: typeof p.product_id === "string" ? p.product_id : null,
              name: String(p.name).slice(0, 100),
              qty: Math.max(1, Math.round(p.qty)),
              price: Math.max(0, Math.round(p.price ?? 0)),
            }));
        }
      } catch {
        // ignore malformed param
      }
    }
    return [];
  });
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
  // Incremental DP top-up state. The single cumulative-amount input (current
  // dpAmount) is unintuitive when a customer makes a follow-up payment — the
  // merchant has to mentally add (10 + 25 = 35) and overwrite. These fields
  // power the new "+ Record additional payment" UX that takes an incremental
  // amount and POSTs it to /api/orders/[id]/payment so the audit trail is
  // accurate and we don't lose the partial-payment timeline.
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showEditDp, setShowEditDp] = useState(false);
  const [addPaymentInput, setAddPaymentInput] = useState("");
  const [recordingPayment, setRecordingPayment] = useState(false);
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
  const [deliveryAddress, setDeliveryAddress] = useState(initialOrder?.delivery_address || "");
  const [showNotes, setShowNotes] = useState(!!initialOrder?.notes);
  const [showDiscount, setShowDiscount] = useState(!!initialOrder?.discount);
  const [showCustomer, setShowCustomer] = useState(
    !isEdit || !!(initialOrder?.customer_name || initialOrder?.customer_phone)
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Edit-mode action state
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(initialOrder?.status || "new");
  const [confirmModal, setConfirmModal] = useState<"cancel" | "delete" | "force-cancel" | "reject-payment" | null>(null);
  // QR receipt rejection: bounces the order back to "Menunggu bayar"
  // (awaiting_payment) so the customer must upload a valid receipt before it
  // returns to the active list.
  const [isRejectingPayment, setIsRejectingPayment] = useState(false);
  const [paymentRejected, setPaymentRejected] = useState(false);
  const [isDestructing, setIsDestructing] = useState(false);
  // Status-change confirm modal (Ariff feedback 2026-05-02): anti-misclick +
  // optional auto-WA so the merchant doesn't re-tap the WA menu after every
  // status change.
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [notifyOnStatusChange, setNotifyOnStatusChange] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  // Shipment metadata captured inline on the "Mark as Shipped" confirm
  // modal (migration 098). Both optional. Pre-fills from the live order
  // so the merchant can edit a previously-entered value instead of
  // re-typing. Cleared when pendingStatus resets.
  const [pendingTrackingNumber, setPendingTrackingNumber] = useState<string>("");
  const [pendingCourierName, setPendingCourierName] = useState<string>("");
  const [pendingCourierIsOther, setPendingCourierIsOther] = useState<boolean>(false);
  const undoWindowEndsAt = initialOrder?.undo_window_ends_at
    ? new Date(initialOrder.undo_window_ends_at)
    : null;
  const isPastUndoWindow =
    !!undoWindowEndsAt && undoWindowEndsAt.getTime() < Date.now();
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
  const [waPreviewData, setWaPreviewData] = useState<{ message: string; name?: string; phone?: string | null; subHeader?: string; secondaryLabel?: string } | null>(null);

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

  // Payment proof URLs (customer-uploaded) are identified by bucket path.
  // They live in image_urls alongside reference photos but must be kept
  // separate: read-only to merchant, never deletable from this form.
  const isProofUrl = (url: string) => url.includes("payment-proofs");

  // Photo attachment — only reference/design photos, never proof uploads
  const [showPhotoAttach, setShowPhotoAttach] = useState(
    !!(initialOrder?.image_urls?.filter(u => !isProofUrl(u)).length)
  );
  const [imageUrls, setImageUrls] = useState<string[]>(
    (initialOrder?.image_urls || []).filter(u => !isProofUrl(u))
  );
  // Proof URLs are read-only — preserved in saves but never editable here
  const proofImageUrls = (initialOrder?.image_urls || []).filter(isProofUrl);
  // A store-link (QR) order whose customer-uploaded receipt is still unpaid is
  // the one case where the merchant may reject the receipt and send it back to
  // "Menunggu bayar". Gated to order_link so a non-QR order is never hidden by
  // flipping awaiting_payment.
  const canRejectPayment =
    isEdit &&
    !!initialOrder &&
    initialOrder.source === "order_link" &&
    proofImageUrls.length > 0 &&
    initialOrder.payment_status !== "paid" &&
    initialOrder.status !== "cancelled" &&
    initialOrder.status !== "done";
  const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);
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
        // Subscription mode: customer required, delivery date optional, QR hidden
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
  const deliveryFee = Math.max(0, Number(initialOrder?.delivery_fee ?? 0) || 0);
  const lineItemsTotal = Math.max(0, subtotal - discountAmount);
  const total = lineItemsTotal + deliveryFee;
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
        product_id: fi?.id ?? null,
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
        if (field === "name") {
          const fi = frequentItems.find((f) => f.name.toLowerCase() === value.trim().toLowerCase());
          return { ...item, name: value, product_id: fi?.id ?? null };
        }
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


  // Edit-mode: status change with confirm + optional auto-WA notify.
  // Single tap sequence (pill → confirm → done) replaces the old four-tap
  // sequence (pill → save → WA menu → confirm).
  async function handleConfirmStatusChange() {
    if (!initialOrder || !pendingStatus) return;
    setIsUpdatingStatus(true);
    // Only forward shipment metadata on the shipped transition — other
    // status transitions ignore these fields server-side, but keeping
    // the payload tight makes the network panel easier to read.
    const shipmentMeta = pendingStatus === "shipped"
      ? {
          tracking_number: pendingTrackingNumber.trim() || null,
          courier_name: pendingCourierName.trim() || null,
        }
      : undefined;
    const updated = await updateOrderStatus(initialOrder.id, pendingStatus, shipmentMeta);
    if (updated) {
      hapticSuccess();
      setOrderStatus(pendingStatus);
      setLiveOrder(updated);
      toast.success(`Marked as ${ORDER_STATUS_LABELS[pendingStatus]}`, {
        duration: 4000,
      });
      const customerHasPhone = !!(updated.customer_phone && updated.customer_phone.trim());
      if (notifyOnStatusChange && customerHasPhone) {
        // Open the WA preview prefilled with the new status — single click
        // out of the modal lands them in WhatsApp. This is a follow-up
        // *after* the status has been saved, not a confirmation gate, so
        // label the secondary action "Skip" instead of "Cancel" (which
        // misreads as "undo the status change") and add a sub-header that
        // names the action that just succeeded.
        setWaPreviewData({
          message: buildOrderWithStatus(updated),
          name: updated.customer_name,
          phone: updated.customer_phone,
          subHeader: `Status updated to ${ORDER_STATUS_LABELS[pendingStatus]} — notify customer?`,
          secondaryLabel: "Skip",
        });
      }
    } else {
      toast.error("Couldn't update status. Try again.");
    }
    setIsUpdatingStatus(false);
    setPendingStatus(null);
    setPendingTrackingNumber("");
    setPendingCourierName("");
    setPendingCourierIsOther(false);
  }

  // Edit-mode: destructive actions. Cancel is now a soft-undo with a 7-day
  // window — within window the cancel restores stock + frees a quota slot;
  // past window we surface a second-step force confirm.
  async function handleConfirmCancel(force: boolean = false) {
    if (!initialOrder) return;
    setIsDestructing(true);
    const result = await undoOrder(initialOrder.id, { force });
    if (result.success) {
      hapticDestructive();
      toast.success(
        force
          ? "Order cancelled (past undo window)"
          : "Order cancelled — stock restored",
        { duration: 5000 },
      );
      router.push(`/orders/${initialOrder.id}/edit`);
      setIsDestructing(false);
      setConfirmModal(null);
      return;
    }
    if (result.windowExpired) {
      // Bounce to force-confirm modal — user has to opt in explicitly.
      setIsDestructing(false);
      setConfirmModal("force-cancel");
      return;
    }
    toast.error("Failed to cancel order");
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

  // Reject a QR payment receipt — bounces the order back to "Menunggu bayar"
  // (awaiting_payment = true) so it leaves the active list until the customer
  // uploads a valid receipt. Reversible: a fresh upload reveals it again. The
  // reject-payment route also clears payment_claimed_at server-side.
  async function handleRejectPayment() {
    if (!initialOrder || isRejectingPayment) return;
    setIsRejectingPayment(true);
    try {
      const res = await fetch(`/api/orders/${initialOrder.id}/reject-payment`, { method: "POST" });
      if (!res.ok) throw new Error("reject_failed");
      track("order_payment_rejected", { order_id: initialOrder.id });
      hapticDestructive();
      setPaymentRejected(true);
      setConfirmModal(null);
      toast.success("Receipt rejected — order moved back to Menunggu bayar", { duration: 5000 });
      // Tokoflow drafts; the merchant sends. Offer a WhatsApp reminder so the
      // customer knows to pay again — there is no auto-message to the customer.
      if (liveOrder?.customer_phone) {
        setWaPreviewData({
          message: buildPaymentReminder(liveOrder),
          name: liveOrder.customer_name,
          phone: liveOrder.customer_phone,
          subHeader: "Ask the customer to pay again",
        });
      }
    } catch {
      toast.error("Failed to reject payment");
      setConfirmModal(null);
    }
    setIsRejectingPayment(false);
  }

  // Record an incremental DP top-up. Hits /api/orders/[id]/payment which
  // already caps at total + recomputes payment_status. We trust the server
  // response over local math — survives stale form state and concurrent edits.
  async function handleAddPayment() {
    if (!initialOrder) return;
    const amt = parseFloat(addPaymentInput) || 0;
    if (amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setRecordingPayment(true);
    const updated = await recordPayment(initialOrder.id, amt);
    setRecordingPayment(false);
    if (!updated) {
      toast.error("Could not record payment");
      return;
    }
    hapticSuccess();
    if (updated.payment_status === "paid") {
      setPaymentMode("paid");
      setDpAmount("");
      toast.success("Now paid in full", { duration: 4000 });
    } else {
      setDpAmount(String(updated.paid_amount));
      const newRemaining = Math.max(0, updated.total - updated.paid_amount);
      toast.success(
        `Payment recorded · Rp ${newRemaining.toLocaleString("id-ID")} remaining`,
        { duration: 4000 },
      );
    }
    // Keep liveOrder in sync so the audit block + downstream UI reflect truth
    // without a full refetch.
    setLiveOrder((prev) =>
      prev
        ? { ...prev, paid_amount: updated.paid_amount, payment_status: updated.payment_status }
        : prev,
    );
    setAddPaymentInput("");
    setShowAddPayment(false);
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
              product_id: merged[existingIdx].product_id ?? fi?.id ?? null,
              qty: newQty,
              price: Math.max(merged[existingIdx].price, vi.price),
            };
          } else {
            let qty = vi.qty;
            if (stockLimit !== null && qty > stockLimit) qty = stockLimit;
            // Use catalog price if matched, otherwise keep AI-parsed price
            const price = fi ? fi.price : vi.price;
            if (!fi) customItems.push(vi.name);
            merged.push({ ...vi, product_id: fi?.id ?? vi.product_id ?? null, price, qty });
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
    if (data.customer_name) extras.push("customer");
    if (data.delivery_date) extras.push("date");
    if (data.notes) extras.push("note");
    if (data.discount) extras.push("discount");
    if (data.payment_status) extras.push("payment");
    if (extras.length > 0) {
      toast.success(`Auto-filled: ${extras.join(", ")}`);
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
    const finalTotal = Math.max(0, finalSubtotal - discountAmount) + deliveryFee;
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
        delivery_fee: deliveryFee,
        delivery_zone: initialOrder.delivery_zone ?? null,
        paid_amount: paidAmount,
        delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : null,
        delivery_address: deliveryAddress.trim() || null,
        image_urls: [...imageUrls, ...proofImageUrls],
      } as Partial<Order>);

      setIsSaving(false);

      if (updated) {
        hapticSuccess();
        toast.success("Order updated", { duration: 5000 });
        router.push(`/orders/${initialOrder.id}/edit`);
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
      delivery_address: deliveryAddress.trim() || undefined,
      is_preorder: isPreorder,
      is_dine_in: isDineIn,
      is_langganan: isLangganan,
      is_booking: isBooking,
      booking_time: bookingTime || undefined,
      table_number: tableNumber || undefined,
      paid_amount: paidAmount,
      source: "manual",
      ...((imageUrls.length > 0 || proofImageUrls.length > 0) && { image_urls: [...imageUrls, ...proofImageUrls] }),
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
        setDeliveryAddress("");
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
        toast.success(`Order created — Rp ${order.total.toLocaleString("id-ID")}`, { duration: 3000 });
        setTimeout(() => itemNameRef.current?.focus(), 100);
      } else if (ordersUsedBefore === 0 && sessionCount === 0) {
        setCelebrationOrder(order);
        setShowCelebration(true);
      } else {
        hapticSuccess();
        toast.success("Order created", { duration: 5000 });
        router.push(`/orders/${order.id}/edit`);
      }
    } else {
      toast.error("Could not save order. Check your connection and retry");
    }
  }

  async function handleDownloadProof(url: string) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `payment-proof-${initialOrder?.id ?? "order"}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
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


  function formatSummaryDate(dateStr: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowMidnight = new Date(todayMidnight);
    tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);
    const dMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    let dayLabel: string;
    if (dMidnight.getTime() === todayMidnight.getTime()) dayLabel = "Today";
    else if (dMidnight.getTime() === tomorrowMidnight.getTime()) dayLabel = "Tomorrow";
    else dayLabel = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    const timePart = dateStr.includes("T") ? dateStr.split("T")[1] : "";
    if (timePart && timePart !== "00:00") {
      return `${dayLabel} · ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
    }
    return dayLabel;
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[1200px] grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,780px)_400px] md:items-start xl:justify-center pb-4 md:pb-6">
        <div className="min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href="/orders" className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            {isEdit ? (
              <>
                <h1 className="text-lg font-semibold text-foreground truncate">
                  {initialOrder.customer_id ? (
                    <Link href={`/customers/${initialOrder.customer_id}`} className="hover:underline">
                      {initialOrder.customer_name || initialOrder.customer_phone || "Order"}
                    </Link>
                  ) : (
                    initialOrder.customer_name || initialOrder.customer_phone || "Order"
                  )}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {initialOrder.order_number} · {new Date(initialOrder.created_at).toLocaleDateString("id-ID", {
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
              <>
                <h1 className="text-lg font-semibold text-foreground">New order</h1>
                <p className="text-xs text-muted-foreground">Tap a product, or paste a WhatsApp chat</p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
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
          {isEdit && initialOrder && (
            <a
              href={`/r/${initialOrder.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium bg-card border border-border shadow-sm hover:bg-muted transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
              Receipt
            </a>
          )}
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
          {isLangganan && "Subscription — date optional, pay later"}
          {isPreorder && !isLangganan && "Pre-order — pick a delivery date below"}
          {isDineIn && "Walk-in order"}
        </div>
      )}

      <div className="rounded-lg border bg-card px-4 py-4 space-y-6 shadow-sm">

        {/* Section: Order (always visible, first for natural flow) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider shrink-0">Items</p>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {items.reduce((sum, i) => sum + i.qty, 0)} item · Rp {items.reduce((sum, i) => sum + i.price * i.qty, 0).toLocaleString("id-ID")}
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
                    className={`w-44 h-9 pl-7 text-xs rounded-md border border-border bg-muted/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors placeholder:text-muted-foreground ${productSearch ? "pr-6" : "pr-2"}`}
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
                  const existingItem = items.find((i) => (
                    fi.id ? i.product_id === fi.id : i.name.toLowerCase() === fi.name.toLowerCase()
                  ));
                  const currentQty = existingItem?.qty ?? 0;
                  const hasStock = fi.stock !== null && fi.stock !== undefined;
                  const atStockLimit = hasStock && currentQty >= fi.stock!;
                  const isLowStock = hasStock && fi.stock! > 0 && fi.stock! <= 5;
                  const isOutOfStock = hasStock && fi.stock! <= 0;
                  const minQty = fi.min_order_qty && fi.min_order_qty > 1 ? fi.min_order_qty : 1;

                  const handleIncrement = () => {
                    if (isOutOfStock) return;
                    setItems((prev) => {
                      const existingIdx = prev.findIndex((i) => (
                        fi.id ? i.product_id === fi.id : i.name.toLowerCase() === fi.name.toLowerCase()
                      ));
                      if (existingIdx >= 0) {
                        const newQty = prev[existingIdx].qty + 1;
                        if (hasStock && newQty > fi.stock!) return prev;
                        return prev.map((item, idx) => idx === existingIdx ? { ...item, qty: newQty } : item);
                      }
                      return [...prev, { product_id: fi.id ?? null, name: fi.name, price: fi.price, qty: minQty }];
                    });
                  };

                  const handleDecrement = () => {
                    setItems((prev) => {
                      const existingIdx = prev.findIndex((i) => (
                        fi.id ? i.product_id === fi.id : i.name.toLowerCase() === fi.name.toLowerCase()
                      ));
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
                          : existingItem
                          ? "bg-warm-green-light/30 border-warm-green/40 cursor-pointer"
                          : "bg-muted/30 border-border hover:bg-muted/50 active:bg-muted/70 cursor-pointer"
                      }`}
                    >
                      <p className="text-sm font-medium truncate text-foreground">
                        {fi.name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <p className="text-xs text-muted-foreground">
                          Rp {fi.price.toLocaleString("id-ID")}
                          {fi.unit && <span> / {fi.unit}</span>}
                        </p>
                        {isLowStock && !isOutOfStock && (
                          <span className="text-[10px] text-warm-rose ml-auto">{fi.stock} left</span>
                        )}
                        {isOutOfStock && (
                          <span className="text-[10px] text-muted-foreground ml-auto">Out of stock</span>
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
                  const isProduct = !!frequentItems.find((f) => (
                    item.product_id ? f.id === item.product_id : f.name.toLowerCase() === item.name.toLowerCase()
                  ));
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
                          <span className="text-xs text-muted-foreground">RM</span>
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
                          {item.price === 0 ? "Set price" : `Rp ${item.price.toLocaleString("id-ID")}`}
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
                      className={`inline-flex h-9 px-3 text-xs font-medium rounded-full border items-center gap-1 transition-colors ${
                        showManualInput
                          ? "bg-warm-green/10 border-warm-green/30 text-warm-green"
                          : "border-dashed border-border text-muted-foreground hover:bg-muted active:bg-muted/80"
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      Other item
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
              placeholder="Optional"
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
            <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Customer <span className="text-muted-foreground font-normal normal-case tracking-normal">(optional)</span></p>
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
          const DAY_LABELS_CAL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
                  className={`h-9 px-3 text-xs font-medium rounded-lg border transition-colors ${
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
                  className={`h-9 px-3 text-xs font-medium rounded-lg border transition-colors ${
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
                  className={`h-9 px-3 text-xs font-medium rounded-lg border transition-colors ${
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
                  className={`h-9 px-3 text-xs font-medium rounded-lg border transition-colors ${
                    activeChip === "other"
                      ? "bg-warm-green-light border-warm-green/30 text-warm-green"
                      : "bg-muted/50 border-border text-foreground/70 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {activeChip === "other"
                    ? new Date(datePartOfValue + "T00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })
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

        {/* Delivery address — shown for preorder/delivery orders */}
        {(isPreorder || deliveryAddress || isEdit) && !isDineIn && (
          <div className={`space-y-1.5${isFormLocked ? ' pointer-events-none opacity-60' : ''}`}>
            <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              Delivery Address <span className="text-muted-foreground font-normal normal-case tracking-normal">(optional)</span>
            </p>
            <div className="rounded-lg border bg-muted/50 transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 focus-within:bg-background">
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value.slice(0, 500))}
                placeholder="e.g. 12, Jalan Mawar, Section 2, 40150 Shah Alam"
                rows={2}
                className="w-full px-3 py-2.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Note + Discount — combined row */}
        <div className={`space-y-1.5${isFormLocked ? ' pointer-events-none opacity-60' : ''}`}>
          <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Additional Details <span className="text-muted-foreground font-normal normal-case tracking-normal">(optional)</span></p>
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
                  value={discount ? parseInt(discount).toLocaleString("id-ID") : ""}
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

        {/* Payment Proof — customer-uploaded screenshots, read-only */}
        {proofImageUrls.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
              Payment Proof
              <span className="text-muted-foreground font-normal normal-case tracking-normal ml-1">({proofImageUrls.length})</span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {proofImageUrls.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setProofModalUrl(url)}
                  className="relative w-20 h-20 rounded-lg overflow-hidden border border-warm-green/30 ring-1 ring-warm-green/10 hover:ring-2 hover:ring-warm-green/40 transition-all"
                >
                  <img src={url} alt={`Proof ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">Uploaded by customer. Tap to view or download.</p>
            {initialOrder && initialOrder.payment_status !== "paid" && !paymentRejected && (
              <div className="pt-1 space-y-2">
                <ProofAiCheck orderId={initialOrder.id} />
                {canRejectPayment && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setConfirmModal("reject-payment")}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-warm-rose/40 bg-warm-rose-light text-warm-rose text-xs font-medium hover:bg-warm-rose/15 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject receipt
                    </button>
                    <span className="text-[11px] text-muted-foreground">
                      Wrong amount or fake? Send it back to Menunggu bayar.
                    </span>
                  </div>
                )}
              </div>
            )}
            {paymentRejected && (
              <p className="pt-1 text-[11px] text-warm-rose">
                Receipt rejected — order moved back to Menunggu bayar. Ask the customer to pay again; it returns to your list when they upload a valid receipt.
              </p>
            )}
          </div>
        )}

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
                    onClick={() => {
                      // No-op tap on the already-active status — avoid a
                      // confirm modal asking to change to the current state.
                      if (status === orderStatus) return;
                      setPendingStatus(status);
                      setNotifyOnStatusChange(true);
                      // Seed shipment inputs from the live order so the
                      // merchant can edit a prior value instead of typing
                      // from scratch. Cleared when modal closes.
                      if (status === "shipped") {
                        setPendingTrackingNumber(liveOrder?.tracking_number || "");
                        const existingCourier = liveOrder?.courier_name || "";
                        const isOther = !!existingCourier && !KNOWN_COURIERS.includes(existingCourier);
                        setPendingCourierName(existingCourier);
                        setPendingCourierIsOther(isOther);
                      }
                    }}
                    className={`h-9 px-3 text-xs font-medium rounded-full border transition-colors ${chipStyle}`}
                  >
                    {ORDER_STATUS_LABELS[status]}
                  </button>
                );
              })}
            </div>
            {/* Inline WA re-trigger — surfaces here so the merchant can
                resend the current-status update without scrolling back to
                the top-bar WA dropdown. Hidden when the customer has no
                phone or the order is on its terminal status (no useful
                update to send beyond the celebration confirmation). */}
            {liveOrder?.customer_phone && (
              <button
                type="button"
                onClick={shareOrderWA}
                className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-warm-green hover:text-warm-green-hover transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Send status update on WhatsApp
              </button>
            )}
            {isEdit && initialOrder && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  History
                </p>
                <StatusTimeline
                  logs={statusLogs ?? []}
                  createdAt={initialOrder.created_at}
                />
              </div>
            )}
          </div>
        )}

        {/* Status Pembayaran — always visible */}
        <div className={`space-y-1.5${isPaymentLocked ? ' pointer-events-none opacity-60' : ''}`}>
          <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Payment Status</p>
          <InlineHint hintId="payment-toggle" text="Set the payment status for this order" />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { setPaymentMode("paid"); setDpAmount(""); setShowAddPayment(false); setShowEditDp(false); setAddPaymentInput(""); }}
              className={`h-9 px-3 text-xs font-medium rounded-full border transition-colors ${
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
              className={`h-9 px-3 text-xs font-medium rounded-full border transition-colors ${
                paymentMode === "dp"
                  ? "bg-warm-amber-light border-warm-amber/30 text-warm-amber"
                  : "bg-muted/50 border-border text-foreground/70 hover:bg-muted hover:text-foreground"
              }`}
            >
              DP
            </button>
            <button
              type="button"
              onClick={() => { setPaymentMode("unpaid"); setDpAmount(""); setShowAddPayment(false); setShowEditDp(false); setAddPaymentInput(""); }}
              className={`h-9 px-3 text-xs font-medium rounded-full border transition-colors ${
                paymentMode === "unpaid"
                  ? "bg-warm-rose-light border-warm-rose/30 text-warm-rose"
                  : "bg-muted/50 border-border text-foreground/70 hover:bg-muted hover:text-foreground"
              }`}
            >
              Unpaid
            </button>
          </div>
          {paymentMode === "dp" && (() => {
            const dpReceived = parseFloat(dpAmount) || 0;
            const remaining = Math.max(0, total - dpReceived);
            // Summary view shows only when there is already a recorded DP on
            // an existing order — for a fresh order or zero-paid state the
            // single input is still the right starting affordance.
            const showSummary = isEdit && dpReceived > 0 && !showEditDp;

            if (!showSummary) {
              return (
                <input
                  type="number"
                  value={dpAmount}
                  onChange={(e) => setDpAmount(e.target.value)}
                  placeholder="Down payment (RM)"
                  autoFocus
                  className="w-full h-11 px-3 bg-muted/50 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-background transition-colors placeholder:text-muted-foreground"
                />
              );
            }

            return (
              <div className="space-y-2 rounded-lg bg-muted/30 border border-border p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">DP received</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    Rp {dpReceived.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-semibold text-warm-amber tabular-nums">
                    Rp {remaining.toLocaleString("id-ID")}
                  </span>
                </div>

                {showAddPayment ? (
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="number"
                      value={addPaymentInput}
                      onChange={(e) => setAddPaymentInput(e.target.value)}
                      placeholder={`How much (max Rp ${remaining.toLocaleString("id-ID")})`}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddPayment();
                        }
                      }}
                      className="flex-1 h-9 px-3 bg-background border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleAddPayment}
                      disabled={recordingPayment}
                      className="h-9 px-3 rounded-lg bg-warm-green text-white text-xs font-medium hover:bg-warm-green-hover disabled:opacity-50 transition-colors"
                    >
                      {recordingPayment ? "..." : "Add"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddPayment(false); setAddPaymentInput(""); }}
                      disabled={recordingPayment}
                      className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddPayment(true)}
                    className="w-full h-9 rounded-lg border border-dashed border-warm-green/40 text-xs font-medium text-warm-green hover:bg-warm-green-light/40 transition-colors"
                  >
                    + Record additional payment
                  </button>
                )}

                {/* Escape hatch — for typo corrections or unusual cases the
                    merchant can still overwrite the cumulative DP value. */}
                <button
                  type="button"
                  onClick={() => setShowEditDp(true)}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline w-full text-center pt-0.5"
                >
                  Edit DP amount directly
                </button>
              </div>
            );
          })()}
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

      {/* Spacer for sticky bar — mobile only */}
      {items.length > 0 && <div className="h-20 md:h-0" />}

      </form>
        </div>{/* end left column */}

        {/* Order summary panel — desktop only */}
        <aside className="hidden md:block">
          <div className="sticky top-4 space-y-3">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {isEdit ? "Order" : "New order"}
              </p>
            </div>

            {items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">Tap a product to add items</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Items list */}
                <div className="space-y-2.5">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground leading-tight">{item.name}</p>
                        <p className="text-xs text-muted-foreground">×{item.qty} @ Rp {item.price.toLocaleString("id-ID")}</p>
                      </div>
                      <p className="text-sm font-medium text-foreground shrink-0 tabular-nums">
                        Rp {(item.price * item.qty).toLocaleString("id-ID")}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t pt-3 space-y-1.5">
                  {(discountAmount > 0 || deliveryFee > 0) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="tabular-nums">Rp {subtotal.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="text-warm-rose tabular-nums">-Rp {discountAmount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="tabular-nums">Rp {deliveryFee.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">Rp {total.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                {/* Customer + delivery info */}
                {(hasCustomer || (showDelivery && deliveryDate) || (!isDineIn && deliveryAddress)) && (
                  <div className="border-t pt-3 space-y-2">
                    {hasCustomer && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-foreground truncate">{customerName || customerPhone}</span>
                      </div>
                    )}
                    {showDelivery && deliveryDate && (
                      <div className="flex items-start gap-2 text-sm">
                        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-foreground">{formatSummaryDate(deliveryDate)}</span>
                          {isDineIn && <p className="text-xs text-muted-foreground">Dine-in</p>}
                        </div>
                      </div>
                    )}
                    {!isDineIn && deliveryAddress && (
                      <div className="flex items-start gap-2 text-sm">
                        <Truck className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="min-w-0 text-xs text-muted-foreground whitespace-pre-line break-words">
                          {deliveryAddress}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit buttons */}
                {!isPaymentLocked && (
                  <div className="border-t pt-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => handleSubmit()}
                      disabled={isSaving}
                      className="w-full h-11 rounded-lg bg-warm-green text-white text-sm font-medium hover:bg-warm-green-hover active:bg-warm-green-hover disabled:opacity-50 disabled:cursor-not-allowed squish-press transition-colors"
                    >
                      {isSaving ? "Saving..." : isEdit ? "Save changes" : "Create order"}
                    </button>
                    {!isEdit && (
                      <button
                        type="button"
                        onClick={() => handleSubmit(undefined, true)}
                        disabled={isSaving}
                        className="w-full h-10 rounded-lg bg-card border border-border text-xs font-medium text-foreground hover:bg-muted active:bg-muted disabled:opacity-50 disabled:cursor-not-allowed squish-press transition-colors shadow-sm"
                      >
                        {isSaving ? "Saving..." : "Save & new"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Assigned to — edit mode only */}
          {isEdit && initialOrder && (
            <div className="rounded-xl border bg-card shadow-sm p-4">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-3">
                Assigned to
              </p>
              <AssigneePicker
                orderId={initialOrder.id}
                assignedStaffId={assignedStaffId}
                onChange={onAssignedStaffChange}
              />
            </div>
          )}
          </div>{/* end sticky wrapper */}
        </aside>
      </div>{/* end grid */}

      {/* Sticky total + submit bar */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-white border-t border-border">
          <div className="max-w-2xl mx-auto px-4 lg:px-6 py-3 flex items-center gap-3">
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-muted-foreground">
                {items.length} item
                {discountAmount > 0 && (
                  <span className="text-warm-rose ml-1">
                    -Rp {discountAmount.toLocaleString("id-ID")}
                  </span>
                )}
              </span>
              <span className="text-sm font-bold text-foreground">
                Rp {total.toLocaleString("id-ID")}
              </span>
            </div>
            {!isEdit && (
              <button
                type="button"
                onClick={() => handleSubmit(undefined, true)}
                disabled={isSaving}
                className="ml-auto h-10 px-4 rounded-lg bg-card border border-border text-xs font-medium text-foreground hover:bg-muted active:bg-muted disabled:opacity-50 disabled:cursor-not-allowed squish-press transition-colors shadow-sm"
              >
                {isSaving ? "Saving..." : "Save & new"}
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

      {/* Confirmation modal for cancel/delete/force-cancel/reject-payment */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end lg:items-center justify-center">
          <div className="bg-background rounded-t-2xl lg:rounded-2xl p-6 pb-8 w-full max-w-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-warm-rose-light flex items-center justify-center mb-3">
                {confirmModal === "reject-payment" ? (
                  <CircleDollarSign className="w-6 h-6 text-warm-rose" />
                ) : (
                  <Trash2 className="w-6 h-6 text-warm-rose" />
                )}
              </div>
              <h2 className="text-base font-semibold text-foreground mb-1">
                {confirmModal === "cancel"
                  ? "Cancel this order?"
                  : confirmModal === "force-cancel"
                    ? "Past the undo window"
                    : confirmModal === "reject-payment"
                      ? "Reject this receipt?"
                      : "Delete this order?"}
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                {confirmModal === "cancel"
                  ? isPastUndoWindow
                    ? "More than 7 days have passed — cancellation is final and stock is not restored automatically."
                    : "Stock returns to inventory. The cancellation can be reviewed in the order's history for 7 days."
                  : confirmModal === "force-cancel"
                    ? "It's been more than 7 days since this order was created. Cancelling now is final — stock is NOT restored. Continue?"
                    : confirmModal === "reject-payment"
                      ? "The order goes back to Menunggu bayar and leaves your active list until the customer uploads a valid receipt. You can message them to pay again."
                      : "Order will be permanently deleted and cannot be restored."}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  disabled={isDestructing || isRejectingPayment}
                  className="flex-1 h-11 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {confirmModal === "reject-payment" ? "Keep reviewing" : "Keep order"}
                </button>
                <button
                  type="button"
                  onClick={
                    confirmModal === "cancel"
                      ? () => handleConfirmCancel(false)
                      : confirmModal === "force-cancel"
                        ? () => handleConfirmCancel(true)
                        : confirmModal === "reject-payment"
                          ? handleRejectPayment
                          : handleConfirmDelete
                  }
                  disabled={isDestructing || isRejectingPayment}
                  className="flex-1 h-11 rounded-lg bg-warm-rose text-white text-sm font-medium hover:bg-warm-rose/90 active:bg-warm-rose/80 transition-colors disabled:opacity-50"
                >
                  {isDestructing || isRejectingPayment
                    ? "Processing..."
                    : confirmModal === "cancel"
                      ? "Yes, cancel"
                      : confirmModal === "force-cancel"
                        ? "Cancel anyway"
                        : confirmModal === "reject-payment"
                          ? "Reject receipt"
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
                Send a confirmation to your customer via WhatsApp.
              </p>
              {/* Business name prompt — only if not set */}
              {!savedBusinessName && (
                <div className="w-full mb-4">
                  <label className="text-xs text-muted-foreground text-left block mb-1.5">Business name (for WA signature)</label>
                  <input
                    type="text"
                    placeholder="e.g. Aisyah's Catering"
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
                Send via WhatsApp
              </button>
              <button
                type="button"
                onClick={() => router.push(`/orders/${celebrationOrder.id}/edit`)}
                className="w-full h-11 text-sm text-muted-foreground mt-2"
              >
                View order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status change confirm modal — Ariff feedback 2026-05-02 */}
      {pendingStatus && initialOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end lg:items-center justify-center">
          <div className="bg-background rounded-t-2xl lg:rounded-2xl p-6 pb-8 w-full max-w-sm">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-base font-semibold text-foreground mb-1">
                Mark order as {ORDER_STATUS_LABELS[pendingStatus]}?
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {pendingStatus === "processed"
                  ? "Order moves to the prep queue."
                  : pendingStatus === "shipped"
                    ? "Customer will know it's on the way."
                    : pendingStatus === "done"
                      ? "Order is complete and moves to history."
                      : "Status will be updated."}
              </p>
              {/* Shipment metadata capture — only on the shipped transition.
                  Both optional; merchant can skip and edit later. Migration
                  098 + courier auto-detection at render time. */}
              {pendingStatus === "shipped" && (
                <div className="w-full mb-4 space-y-2 text-left">
                  {/* Courier first — merchant knows the courier from the sticker */}
                  <select
                    value={pendingCourierIsOther ? "__other__" : pendingCourierName}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__other__") {
                        setPendingCourierName("");
                        setPendingCourierIsOther(true);
                      } else {
                        setPendingCourierName(val);
                        setPendingCourierIsOther(false);
                      }
                    }}
                    className="w-full h-10 px-3 bg-card border border-border rounded-lg text-sm focus:ring-2 focus:ring-warm-green/20 focus:border-warm-green/30 outline-none"
                  >
                    <option value="">Courier (optional)</option>
                    {KNOWN_COURIERS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__other__">Other...</option>
                  </select>
                  {pendingCourierIsOther && (
                    <input
                      type="text"
                      value={pendingCourierName}
                      onChange={(e) => setPendingCourierName(e.target.value.slice(0, 60))}
                      placeholder="Type courier name"
                      autoFocus
                      className="w-full h-10 px-3 bg-card border border-border rounded-lg text-sm focus:ring-2 focus:ring-warm-green/20 focus:border-warm-green/30 outline-none"
                    />
                  )}
                  {/* Tracking number second — highlighted when courier selected */}
                  <input
                    type="text"
                    value={pendingTrackingNumber}
                    onChange={(e) => setPendingTrackingNumber(e.target.value.slice(0, 100))}
                    placeholder={
                      pendingCourierName === "Pos Laju" ? "e.g. EZ123456789MY" :
                      pendingCourierName === "J&T Express" ? "e.g. 600123456789" :
                      pendingCourierName === "Ninja Van" ? "e.g. NVMY..." :
                      pendingCourierName === "GDEX" ? "e.g. GDX..." :
                      pendingCourierName === "DHL" ? "e.g. 1234567890" :
                      pendingCourierName === "Skynet" ? "e.g. SA12345678" :
                      "Tracking number (optional)"
                    }
                    className={`w-full h-10 px-3 bg-card border rounded-lg text-sm outline-none transition-colors ${
                      pendingCourierName && !pendingCourierIsOther
                        ? "border-warm-green/40 ring-2 ring-warm-green/10 focus:ring-warm-green/20 focus:border-warm-green/50"
                        : "border-border focus:ring-2 focus:ring-warm-green/20 focus:border-warm-green/30"
                    }`}
                  />
                  {pendingCourierName && !pendingCourierIsOther && !pendingTrackingNumber && (
                    <p className="text-[11px] text-muted-foreground">
                      Enter tracking number so your customer can track delivery
                    </p>
                  )}
                </div>
              )}
              {!!(initialOrder.customer_phone && initialOrder.customer_phone.trim()) && (
                <label className="flex items-start gap-2.5 w-full mb-4 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifyOnStatusChange}
                    onChange={(e) => setNotifyOnStatusChange(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border accent-warm-green"
                  />
                  <span className="text-sm text-foreground text-left">
                    Send WhatsApp update to {initialOrder.customer_name || "customer"}
                  </span>
                </label>
              )}
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setPendingStatus(null);
                    setPendingTrackingNumber("");
                    setPendingCourierName("");
                    setPendingCourierIsOther(false);
                  }}
                  disabled={isUpdatingStatus}
                  className="flex-1 h-11 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStatusChange}
                  disabled={isUpdatingStatus}
                  className="flex-1 h-11 rounded-lg bg-warm-green text-white text-sm font-medium hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors disabled:opacity-50"
                >
                  {isUpdatingStatus ? "Updating..." : "Confirm"}
                </button>
              </div>
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
          subHeader={waPreviewData.subHeader}
          secondaryLabel={waPreviewData.secondaryLabel}
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

      {/* Payment Proof modal — full image viewer with download */}
      {proofModalUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setProofModalUrl(null)}
        >
          <div
            className="bg-background rounded-2xl p-5 w-full max-w-2xl space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Payment Proof</p>
              <button
                type="button"
                onClick={() => setProofModalUrl(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-border bg-muted/30">
              <img
                src={proofModalUrl}
                alt="Payment proof"
                className="w-full object-contain max-h-[72vh]"
              />
            </div>
            <button
              type="button"
              onClick={() => handleDownloadProof(proofModalUrl)}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-warm-green text-white text-sm font-semibold hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              type="button"
              onClick={() => setProofModalUrl(null)}
              className="w-full h-10 flex items-center justify-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </>
  );
}
