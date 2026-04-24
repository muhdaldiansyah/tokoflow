// Smart defaults per business type — Malaysian market
// Applied during onboarding to auto-configure user's profile.
// Prices in MYR (whole ringgit).

export interface BusinessTypeConfig {
  id: string;
  label: string;
  icon: string; // emoji
  mode: "preorder" | "dine_in" | "booking" | "langganan";
  defaultCapacity: number | null; // null = unlimited
  suggestedUnits: string[];
  suggestedCategories: string[];
  sampleProducts: { name: string; price: number }[];
  deliveryDateRequired: boolean;
  customerRequired: boolean;
  // Estimated overhead as % of sell price (gas, electricity, packaging, time, waste).
  // Calibrated to Malaysian SME operating costs; adjust after merchant interviews.
  overheadEstimatePct: number;
}

export const BUSINESS_TYPES: BusinessTypeConfig[] = [
  {
    id: "kue-bakery",
    label: "Bakery & Cakes",
    icon: "🍰",
    mode: "preorder",
    defaultCapacity: 20,
    overheadEstimatePct: 40,
    suggestedUnits: ["loyang", "box", "pcs", "pack"],
    suggestedCategories: ["Kuih", "Cakes", "Bread", "Custom Cake", "Karipap"],
    sampleProducts: [
      { name: "Kuih Lapis Box", price: 25 },
      { name: "Brownies Slice", price: 15 },
      { name: "Custom Birthday Cake", price: 120 },
    ],
    deliveryDateRequired: true,
    customerRequired: true,
  },
  {
    id: "katering",
    label: "Catering",
    icon: "🍱",
    mode: "preorder",
    defaultCapacity: 50,
    overheadEstimatePct: 45,
    suggestedUnits: ["pax", "box", "pack", "tray"],
    suggestedCategories: ["Nasi Box", "Snack Box", "Buffet", "Nasi Briyani", "Nasi Minyak"],
    sampleProducts: [
      { name: "Nasi Ayam Box", price: 12 },
      { name: "Snack Box (5 items)", price: 8 },
      { name: "Nasi Briyani Platter (10 pax)", price: 180 },
    ],
    deliveryDateRequired: true,
    customerRequired: true,
  },
  {
    id: "warung-makan",
    label: "Kopitiam & Food Stall",
    icon: "🍜",
    mode: "preorder",
    defaultCapacity: null,
    overheadEstimatePct: 50,
    suggestedUnits: ["plate", "bowl", "cup", "pcs"],
    suggestedCategories: ["Rice", "Noodles", "Drinks", "Snacks"],
    sampleProducts: [
      { name: "Nasi Lemak", price: 8 },
      { name: "Mee Goreng", price: 10 },
      { name: "Teh Tarik", price: 3 },
    ],
    deliveryDateRequired: false,
    customerRequired: false,
  },
  {
    id: "konveksi",
    label: "Apparel & Tailoring",
    icon: "👗",
    mode: "preorder",
    defaultCapacity: 10,
    overheadEstimatePct: 25,
    suggestedUnits: ["pcs", "dozen", "set"],
    suggestedCategories: ["Baju Kurung", "Baju Melayu", "T-Shirt", "School Uniform", "Custom"],
    sampleProducts: [
      { name: "Baju Kurung Custom", price: 250 },
      { name: "T-Shirt Print", price: 35 },
      { name: "School Uniform Set", price: 80 },
    ],
    deliveryDateRequired: true,
    customerRequired: true,
  },
  {
    id: "jasa",
    label: "Services (MUA/Photography)",
    icon: "📸",
    mode: "booking",
    defaultCapacity: 3,
    overheadEstimatePct: 30,
    suggestedUnits: ["package", "session", "hour"],
    suggestedCategories: ["Wedding", "Pre-wedding", "Event", "Studio"],
    sampleProducts: [
      { name: "Wedding Package", price: 2500 },
      { name: "Product Photography", price: 350 },
      { name: "MUA Event Session", price: 500 },
    ],
    deliveryDateRequired: true,
    customerRequired: true,
  },
  {
    id: "grosir",
    label: "Wholesale & Supplier",
    icon: "📦",
    mode: "preorder",
    defaultCapacity: null,
    overheadEstimatePct: 20,
    suggestedUnits: ["kg", "carton", "pack", "litre"],
    suggestedCategories: ["Meat", "Vegetables", "Spices", "Frozen"],
    sampleProducts: [
      { name: "Chicken 1kg", price: 14 },
      { name: "Mixed Vegetables 1kg", price: 8 },
      { name: "Spice Mix Pack", price: 6 },
    ],
    deliveryDateRequired: false,
    customerRequired: true,
  },
  {
    id: "hampers",
    label: "Hampers & Gifts",
    icon: "🎁",
    mode: "preorder",
    defaultCapacity: 30,
    overheadEstimatePct: 35,
    suggestedUnits: ["box", "set", "package"],
    suggestedCategories: ["Hari Raya", "Chinese New Year", "Deepavali", "Christmas", "Birthday", "Corporate"],
    sampleProducts: [
      { name: "Raya Kuih Hampers", price: 120 },
      { name: "Premium Gift Box", price: 220 },
      { name: "Snack Pack", price: 55 },
    ],
    deliveryDateRequired: true,
    customerRequired: true,
  },
  {
    id: "toko-bangunan",
    label: "Building Materials",
    icon: "🧱",
    mode: "preorder",
    defaultCapacity: null,
    overheadEstimatePct: 15,
    suggestedUnits: ["bar", "sheet", "bag", "kg", "metre", "pcs"],
    suggestedCategories: ["Steel", "Cement", "Wood", "Paint", "Pipes", "Tiles", "Roofing"],
    sampleProducts: [
      { name: "Cement 50kg", price: 22 },
      { name: "Steel Bar 10mm", price: 28 },
      { name: "Wall Paint 5kg", price: 35 },
    ],
    deliveryDateRequired: false,
    customerRequired: true,
  },
  {
    id: "reseller",
    label: "TikTok Shop / Marketplace Reseller",
    icon: "🛍️",
    mode: "preorder",
    defaultCapacity: null,
    overheadEstimatePct: 30,
    suggestedUnits: ["pcs", "pack", "box", "set"],
    suggestedCategories: ["Fashion", "Beauty", "Gadgets", "Home", "Skincare"],
    sampleProducts: [
      { name: "Skincare Set", price: 65 },
      { name: "Fashion Accessory", price: 25 },
      { name: "Phone Case", price: 15 },
    ],
    deliveryDateRequired: false,
    customerRequired: true,
  },
  {
    id: "lainnya",
    label: "Other",
    icon: "🏪",
    mode: "preorder",
    defaultCapacity: null,
    overheadEstimatePct: 40,
    suggestedUnits: ["pcs", "pack", "box"],
    suggestedCategories: [],
    sampleProducts: [],
    deliveryDateRequired: false,
    customerRequired: true,
  },
];

export function getBusinessType(id: string): BusinessTypeConfig | undefined {
  return BUSINESS_TYPES.find((t) => t.id === id);
}

// Convert business type selection to profile updates
export function getDefaultProfileUpdates(typeId: string): Record<string, unknown> {
  const config = getBusinessType(typeId);
  if (!config) return {};

  return {
    business_type: typeId,
    order_form_enabled: true,
    preorder_enabled: true,
    dine_in_enabled: false,
    booking_enabled: config.mode === "booking",
    langganan_enabled: false,
    daily_order_capacity: config.defaultCapacity,
    overhead_estimate_pct: config.overheadEstimatePct,
  };
}
