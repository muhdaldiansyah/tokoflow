// Client-safe category → mode defaults.
// No server-side imports — safe for "use client" components.

export interface CategoryDefaults {
  mode: "pesanan" | "langsung";
  icon: string;
  defaultCapacity: number | null;
  bookingTimeEnabled: boolean;
  suggestedUnits: string[];
  suggestedCategories: string[];
  sampleProducts: { name: string; price: number }[];
}

export const CATEGORY_DEFAULTS: Record<string, CategoryDefaults> = {
  // --- F&B: Pre-order ---
  "katering": {
    mode: "pesanan", icon: "🍱", defaultCapacity: 50, bookingTimeEnabled: false,
    suggestedUnits: ["serving", "box", "pack", "tray"],
    suggestedCategories: ["Nasi Box", "Snack Box", "Buffet", "Set Meal"],
    sampleProducts: [{ name: "Nasi Lemak Box", price: 12 }, { name: "Snack Box", price: 8 }, { name: "Lemang Set", price: 35 }],
  },
  "bakery": {
    mode: "pesanan", icon: "🍞", defaultCapacity: 20, bookingTimeEnabled: false,
    suggestedUnits: ["tray", "box", "pcs", "pack"],
    suggestedCategories: ["Bread", "Pastry", "Cookies", "Custom Cake"],
    sampleProducts: [{ name: "Roti Sobek", price: 10 }, { name: "Croissant", price: 6 }, { name: "Brownies", price: 15 }],
  },
  "kue-custom": {
    mode: "pesanan", icon: "🍰", defaultCapacity: 10, bookingTimeEnabled: false,
    suggestedUnits: ["tray", "box", "pcs", "pack"],
    suggestedCategories: ["Cookies", "Kuih", "Custom Cake", "Tart"],
    sampleProducts: [{ name: "Kek Lapis", price: 18 }, { name: "Custom Cake", price: 60 }, { name: "Kuih Raya 1 balang", price: 25 }],
  },
  "snack-box": {
    mode: "pesanan", icon: "🎁", defaultCapacity: 30, bookingTimeEnabled: false,
    suggestedUnits: ["box", "set", "pack"],
    suggestedCategories: ["Snack Box", "Hampers", "Cookies", "Corporate"],
    sampleProducts: [{ name: "Snack Box Standard", price: 10 }, { name: "Cookie Hampers", price: 60 }, { name: "Snack Pack", price: 35 }],
  },
  "frozen-food": {
    mode: "pesanan", icon: "🧊", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["pack", "pcs", "kg", "box"],
    suggestedCategories: ["Frozen", "Ready to Cook", "Dim Sum", "Nuggets"],
    sampleProducts: [{ name: "Dim Sum Frozen 10pcs", price: 15 }, { name: "Nuggets Homemade", price: 10 }, { name: "Bakso Frozen 1kg", price: 20 }],
  },
  // --- F&B: Walk-in ---
  "warung-makan": {
    mode: "langsung", icon: "🍜", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["serving", "bowl", "glass", "pcs"],
    suggestedCategories: ["Food", "Drinks", "Snacks", "Add-ons"],
    sampleProducts: [{ name: "Nasi Goreng", price: 8 }, { name: "Mee Goreng", price: 7 }, { name: "Teh Tarik", price: 3 }],
  },
  "minuman": {
    mode: "langsung", icon: "☕", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["glass", "cup", "bottle", "litre"],
    suggestedCategories: ["Coffee", "Tea", "Juice", "Other"],
    sampleProducts: [{ name: "Iced Latte", price: 9 }, { name: "Matcha Latte", price: 11 }, { name: "Avocado Juice", price: 8 }],
  },
  // --- Non-Food: Pre-order ---
  "konveksi": {
    mode: "pesanan", icon: "👗", defaultCapacity: 10, bookingTimeEnabled: false,
    suggestedUnits: ["pcs", "dozen", "set"],
    suggestedCategories: ["T-shirts", "Shirts", "Uniforms", "Custom"],
    sampleProducts: [{ name: "Printed T-shirt", price: 18 }, { name: "Custom Shirt", price: 50 }, { name: "School Uniform", price: 28 }],
  },
  "percetakan": {
    mode: "pesanan", icon: "🖨️", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["sheet", "pcs", "box", "ream"],
    suggestedCategories: ["Invitations", "Brochures", "Stickers", "Banners"],
    sampleProducts: [{ name: "Invitations 100pcs", price: 120 }, { name: "Sticker Labels 1000pcs", price: 50 }, { name: "Banner 1x2m", price: 25 }],
  },
  "kerajinan": {
    mode: "pesanan", icon: "🎨", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["pcs", "set", "pack"],
    suggestedCategories: ["Souvenir", "Handmade", "Custom", "Decoration"],
    sampleProducts: [{ name: "Custom Souvenir", price: 5 }, { name: "Flower Bucket", price: 50 }, { name: "Custom Hampers", price: 70 }],
  },
  "furniture": {
    mode: "pesanan", icon: "🪑", defaultCapacity: 5, bookingTimeEnabled: false,
    suggestedUnits: ["unit", "set", "pcs"],
    suggestedCategories: ["Tables", "Chairs", "Cabinets", "Custom"],
    sampleProducts: [{ name: "Dining Table", price: 850 }, { name: "Custom Bookshelf", price: 500 }, { name: "Living Room Set", price: 1200 }],
  },
  "tailor": {
    mode: "pesanan", icon: "🧵", defaultCapacity: 5, bookingTimeEnabled: false,
    suggestedUnits: ["pcs", "pair", "set"],
    suggestedCategories: ["Kebaya", "Suits", "Gowns", "Alterations"],
    sampleProducts: [{ name: "Kebaya Tailoring", price: 170 }, { name: "Pants Alteration", price: 10 }, { name: "Custom Suit", price: 500 }],
  },
  "tanaman": {
    mode: "pesanan", icon: "🌿", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["pot", "stem", "pack"],
    suggestedCategories: ["Ornamental", "Fruit", "Flowers", "Seedlings"],
    sampleProducts: [{ name: "Monstera", price: 25 }, { name: "Flower Bouquet", price: 70 }, { name: "Vegetable Seedling Pack", price: 8 }],
  },
  "kosmetik": {
    mode: "pesanan", icon: "💄", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["pcs", "bottle", "set", "box"],
    suggestedCategories: ["Skincare", "Makeup", "Perfume", "Body Care"],
    sampleProducts: [{ name: "Perfume 50ml", price: 85 }, { name: "Face Serum", price: 28 }, { name: "Skincare Set", price: 120 }],
  },
  "grosir": {
    mode: "pesanan", icon: "📦", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["kg", "carton", "pack", "litre"],
    suggestedCategories: ["Meat", "Vegetables", "Spices", "Frozen"],
    sampleProducts: [{ name: "Chicken /kg", price: 13 }, { name: "Mixed Vegetables /kg", price: 5 }, { name: "Spice Mix", price: 3 }],
  },
  // --- Services: Pre-order + Booking Time ---
  "fotografer": {
    mode: "pesanan", icon: "📸", defaultCapacity: 3, bookingTimeEnabled: true,
    suggestedUnits: ["package", "session", "hour"],
    suggestedCategories: ["Wedding", "Pre-wedding", "Event", "Studio"],
    sampleProducts: [{ name: "Wedding Package", price: 850 }, { name: "Product Photoshoot", price: 120 }, { name: "Studio Session", price: 170 }],
  },
  "mua": {
    mode: "pesanan", icon: "💅", defaultCapacity: 3, bookingTimeEnabled: true,
    suggestedUnits: ["package", "session"],
    suggestedCategories: ["Wedding", "Graduation", "Event", "Daily"],
    sampleProducts: [{ name: "MUA Wedding", price: 500 }, { name: "MUA Graduation", price: 170 }, { name: "MUA Event", price: 250 }],
  },
  "wedding-eo": {
    mode: "pesanan", icon: "💒", defaultCapacity: 3, bookingTimeEnabled: true,
    suggestedUnits: ["package", "event"],
    suggestedCategories: ["Wedding", "Engagement", "Event", "Decor"],
    sampleProducts: [{ name: "Wedding Package", price: 5000 }, { name: "Stage Decoration", price: 1700 }, { name: "MC + Sound", price: 1000 }],
  },
  "laundry": {
    mode: "pesanan", icon: "👔", defaultCapacity: null, bookingTimeEnabled: true,
    suggestedUnits: ["kg", "pcs", "package"],
    suggestedCategories: ["Regular", "Express", "Dry Clean", "Ironing"],
    sampleProducts: [{ name: "Wash & Iron /kg", price: 3 }, { name: "Express /kg", price: 5 }, { name: "Dry Clean /pcs", price: 10 }],
  },
  "rental": {
    mode: "pesanan", icon: "🔧", defaultCapacity: null, bookingTimeEnabled: true,
    suggestedUnits: ["unit", "day", "package"],
    suggestedCategories: ["Tents", "Sound", "Chairs", "Decor"],
    sampleProducts: [{ name: "Tent 4x6m /day", price: 170 }, { name: "Sound System /day", price: 250 }, { name: "100 Chairs /event", price: 100 }],
  },
  "otomotif": {
    mode: "pesanan", icon: "🔩", defaultCapacity: null, bookingTimeEnabled: true,
    suggestedUnits: ["unit", "package", "pcs"],
    suggestedCategories: ["Service", "Oil Change", "Tune Up", "Body Repair"],
    sampleProducts: [{ name: "Oil Change", price: 50 }, { name: "Light Service", price: 85 }, { name: "Tune Up", price: 130 }],
  },
  "elektronik": {
    mode: "pesanan", icon: "📱", defaultCapacity: null, bookingTimeEnabled: true,
    suggestedUnits: ["unit", "pcs"],
    suggestedCategories: ["Phone", "Laptop", "TV", "Accessories"],
    sampleProducts: [{ name: "Phone LCD Replacement", price: 85 }, { name: "Laptop Service", price: 70 }, { name: "Battery Replacement", price: 50 }],
  },
  "pendidikan": {
    mode: "pesanan", icon: "📚", defaultCapacity: 10, bookingTimeEnabled: true,
    suggestedUnits: ["session", "package", "hour"],
    suggestedCategories: ["Math", "Languages", "Science", "Private"],
    sampleProducts: [{ name: "Private Tutor /hour", price: 25 }, { name: "8-Session Pack", price: 170 }, { name: "Group Tuition", price: 70 }],
  },
  "desain": {
    mode: "pesanan", icon: "🎯", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["package", "revision", "file"],
    suggestedCategories: ["Logo", "Instagram Feed", "Packaging", "UI/UX"],
    sampleProducts: [{ name: "Logo Design", price: 170 }, { name: "Instagram Feed Pack 30", price: 250 }, { name: "Packaging Design", price: 120 }],
  },
  // --- Retail: Walk-in ---
  "sembako": {
    mode: "langsung", icon: "🏪", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["kg", "pcs", "pack", "litre"],
    suggestedCategories: ["Rice", "Cooking Oil", "Sugar", "Spices"],
    sampleProducts: [{ name: "Rice 5kg", price: 22 }, { name: "Cooking Oil 1L", price: 6 }, { name: "Sugar 1kg", price: 6 }],
  },
  "pulsa": {
    mode: "langsung", icon: "📶", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["amount"],
    suggestedCategories: ["Topup", "Data Plan", "Electricity Token", "Bill Pay"],
    sampleProducts: [{ name: "Topup RM10", price: 11 }, { name: "Data 10GB", price: 22 }, { name: "Electricity Token RM30", price: 32 }],
  },
  // --- Fallback ---
  "lainnya": {
    mode: "pesanan", icon: "🏪", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["pcs", "pack", "box"],
    suggestedCategories: [],
    sampleProducts: [],
  },
};

/**
 * Get defaults for a category. Falls back to "lainnya" if not found.
 */
export function getCategoryDefaults(categoryId: string): CategoryDefaults {
  return CATEGORY_DEFAULTS[categoryId] || CATEGORY_DEFAULTS["lainnya"];
}

/**
 * Get profile updates to apply when a category is selected during onboarding.
 */
export function getProfileUpdatesFromCategory(categoryId: string): Record<string, unknown> {
  const defaults = getCategoryDefaults(categoryId);
  return {
    business_category: categoryId,
    order_form_enabled: true,
    preorder_enabled: defaults.mode === "pesanan",
    dine_in_enabled: defaults.mode === "langsung",
    booking_enabled: defaults.bookingTimeEnabled,
    langganan_enabled: false,
    daily_order_capacity: defaults.defaultCapacity,
  };
}
