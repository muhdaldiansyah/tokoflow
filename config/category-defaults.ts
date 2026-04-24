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
  // --- F&B: Pesanan ---
  "katering": {
    mode: "pesanan", icon: "🍱", defaultCapacity: 50, bookingTimeEnabled: false,
    suggestedUnits: ["porsi", "box", "pack", "nampan"],
    suggestedCategories: ["Nasi Box", "Snack Box", "Prasmanan", "Tumpeng"],
    sampleProducts: [{ name: "Nasi Box Ayam", price: 25000 }, { name: "Snack Box", price: 15000 }, { name: "Nasi Tumpeng Mini", price: 75000 }],
  },
  "bakery": {
    mode: "pesanan", icon: "🍞", defaultCapacity: 20, bookingTimeEnabled: false,
    suggestedUnits: ["loyang", "box", "pcs", "pack"],
    suggestedCategories: ["Roti", "Pastry", "Kue Kering", "Custom Cake"],
    sampleProducts: [{ name: "Roti Sobek", price: 25000 }, { name: "Croissant", price: 15000 }, { name: "Brownies", price: 35000 }],
  },
  "kue-custom": {
    mode: "pesanan", icon: "🍰", defaultCapacity: 10, bookingTimeEnabled: false,
    suggestedUnits: ["loyang", "box", "pcs", "pack"],
    suggestedCategories: ["Kue Kering", "Kue Basah", "Custom Cake", "Tart"],
    sampleProducts: [{ name: "Kue Lapis", price: 45000 }, { name: "Custom Cake", price: 150000 }, { name: "Kue Kering 1 Toples", price: 65000 }],
  },
  "snack-box": {
    mode: "pesanan", icon: "🎁", defaultCapacity: 30, bookingTimeEnabled: false,
    suggestedUnits: ["box", "set", "paket"],
    suggestedCategories: ["Snack Box", "Hampers", "Kue Kering", "Corporate"],
    sampleProducts: [{ name: "Snack Box Standard", price: 25000 }, { name: "Hampers Kue Kering", price: 150000 }, { name: "Paket Snack", price: 85000 }],
  },
  "frozen-food": {
    mode: "pesanan", icon: "🧊", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["pack", "pcs", "kg", "box"],
    suggestedCategories: ["Frozen", "Siap Masak", "Dimsum", "Nugget"],
    sampleProducts: [{ name: "Dimsum Frozen 10pcs", price: 35000 }, { name: "Nugget Homemade", price: 25000 }, { name: "Bakso Frozen 1kg", price: 50000 }],
  },
  // --- F&B: Langsung ---
  "warung-makan": {
    mode: "langsung", icon: "🍜", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["porsi", "mangkok", "gelas", "pcs"],
    suggestedCategories: ["Makanan", "Minuman", "Snack", "Extra"],
    sampleProducts: [{ name: "Nasi Goreng", price: 15000 }, { name: "Mie Ayam", price: 12000 }, { name: "Es Teh", price: 5000 }],
  },
  "minuman": {
    mode: "langsung", icon: "☕", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["gelas", "cup", "botol", "liter"],
    suggestedCategories: ["Kopi", "Teh", "Jus", "Minuman Lain"],
    sampleProducts: [{ name: "Es Kopi Susu", price: 18000 }, { name: "Matcha Latte", price: 22000 }, { name: "Jus Alpukat", price: 15000 }],
  },
  // --- Non-Food: Pesanan ---
  "konveksi": {
    mode: "pesanan", icon: "👗", defaultCapacity: 10, bookingTimeEnabled: false,
    suggestedUnits: ["pcs", "lusin", "set"],
    suggestedCategories: ["Kaos", "Kemeja", "Seragam", "Custom"],
    sampleProducts: [{ name: "Kaos Sablon", price: 50000 }, { name: "Kemeja Custom", price: 150000 }, { name: "Seragam Sekolah", price: 85000 }],
  },
  "percetakan": {
    mode: "pesanan", icon: "🖨️", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["lembar", "pcs", "box", "rim"],
    suggestedCategories: ["Undangan", "Brosur", "Stiker", "Banner"],
    sampleProducts: [{ name: "Undangan 100pcs", price: 350000 }, { name: "Stiker Label 1000pcs", price: 150000 }, { name: "Banner 1x2m", price: 75000 }],
  },
  "kerajinan": {
    mode: "pesanan", icon: "🎨", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["pcs", "set", "paket"],
    suggestedCategories: ["Souvenir", "Handmade", "Custom", "Dekorasi"],
    sampleProducts: [{ name: "Souvenir Custom", price: 15000 }, { name: "Bucket Bunga", price: 150000 }, { name: "Hampers Custom", price: 200000 }],
  },
  "furniture": {
    mode: "pesanan", icon: "🪑", defaultCapacity: 5, bookingTimeEnabled: false,
    suggestedUnits: ["unit", "set", "pcs"],
    suggestedCategories: ["Meja", "Kursi", "Lemari", "Custom"],
    sampleProducts: [{ name: "Meja Makan", price: 2500000 }, { name: "Rak Buku Custom", price: 1500000 }, { name: "Kursi Tamu Set", price: 3500000 }],
  },
  "tailor": {
    mode: "pesanan", icon: "🧵", defaultCapacity: 5, bookingTimeEnabled: false,
    suggestedUnits: ["pcs", "pasang", "set"],
    suggestedCategories: ["Kebaya", "Jas", "Gaun", "Alterasi"],
    sampleProducts: [{ name: "Jahit Kebaya", price: 500000 }, { name: "Permak Celana", price: 30000 }, { name: "Jas Custom", price: 1500000 }],
  },
  "tanaman": {
    mode: "pesanan", icon: "🌿", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["pot", "batang", "paket"],
    suggestedCategories: ["Hias", "Buah", "Bunga", "Bibit"],
    sampleProducts: [{ name: "Monstera", price: 75000 }, { name: "Bouquet Bunga", price: 200000 }, { name: "Paket Bibit Sayur", price: 25000 }],
  },
  "kosmetik": {
    mode: "pesanan", icon: "💄", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["pcs", "botol", "set", "box"],
    suggestedCategories: ["Skincare", "Makeup", "Parfum", "Body Care"],
    sampleProducts: [{ name: "Parfum 50ml", price: 250000 }, { name: "Serum Wajah", price: 85000 }, { name: "Set Skincare", price: 350000 }],
  },
  "grosir": {
    mode: "pesanan", icon: "📦", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["kg", "karton", "pack", "liter"],
    suggestedCategories: ["Daging", "Sayur", "Bumbu", "Frozen"],
    sampleProducts: [{ name: "Ayam Potong 1kg", price: 38000 }, { name: "Sayur Campur 1kg", price: 15000 }, { name: "Bumbu Racik", price: 10000 }],
  },
  // --- Jasa: Pesanan + Booking Time ---
  "fotografer": {
    mode: "pesanan", icon: "📸", defaultCapacity: 3, bookingTimeEnabled: true,
    suggestedUnits: ["paket", "sesi", "jam"],
    suggestedCategories: ["Wedding", "Prewedding", "Event", "Studio"],
    sampleProducts: [{ name: "Paket Wedding", price: 2500000 }, { name: "Foto Produk", price: 350000 }, { name: "Sesi Studio", price: 500000 }],
  },
  "mua": {
    mode: "pesanan", icon: "💅", defaultCapacity: 3, bookingTimeEnabled: true,
    suggestedUnits: ["paket", "sesi"],
    suggestedCategories: ["Wedding", "Wisuda", "Event", "Daily"],
    sampleProducts: [{ name: "MUA Wedding", price: 1500000 }, { name: "MUA Wisuda", price: 500000 }, { name: "MUA Event", price: 750000 }],
  },
  "wedding-eo": {
    mode: "pesanan", icon: "💒", defaultCapacity: 3, bookingTimeEnabled: true,
    suggestedUnits: ["paket", "event"],
    suggestedCategories: ["Wedding", "Engagement", "Event", "Dekor"],
    sampleProducts: [{ name: "Paket Wedding", price: 15000000 }, { name: "Dekor Pelaminan", price: 5000000 }, { name: "MC + Sound", price: 3000000 }],
  },
  "laundry": {
    mode: "pesanan", icon: "👔", defaultCapacity: null, bookingTimeEnabled: true,
    suggestedUnits: ["kg", "pcs", "paket"],
    suggestedCategories: ["Reguler", "Express", "Dry Clean", "Setrika"],
    sampleProducts: [{ name: "Cuci Setrika /kg", price: 7000 }, { name: "Express /kg", price: 12000 }, { name: "Dry Clean /pcs", price: 25000 }],
  },
  "rental": {
    mode: "pesanan", icon: "🔧", defaultCapacity: null, bookingTimeEnabled: true,
    suggestedUnits: ["unit", "hari", "paket"],
    suggestedCategories: ["Tenda", "Sound", "Kursi", "Dekor"],
    sampleProducts: [{ name: "Tenda 4x6m /hari", price: 500000 }, { name: "Sound System /hari", price: 750000 }, { name: "Kursi 100 /event", price: 300000 }],
  },
  "otomotif": {
    mode: "pesanan", icon: "🔩", defaultCapacity: null, bookingTimeEnabled: true,
    suggestedUnits: ["unit", "paket", "pcs"],
    suggestedCategories: ["Servis", "Ganti Oli", "Tune Up", "Body Repair"],
    sampleProducts: [{ name: "Ganti Oli", price: 150000 }, { name: "Servis Ringan", price: 250000 }, { name: "Tune Up", price: 400000 }],
  },
  "elektronik": {
    mode: "pesanan", icon: "📱", defaultCapacity: null, bookingTimeEnabled: true,
    suggestedUnits: ["unit", "pcs"],
    suggestedCategories: ["HP", "Laptop", "TV", "Aksesoris"],
    sampleProducts: [{ name: "Ganti LCD HP", price: 250000 }, { name: "Service Laptop", price: 200000 }, { name: "Ganti Baterai", price: 150000 }],
  },
  "pendidikan": {
    mode: "pesanan", icon: "📚", defaultCapacity: 10, bookingTimeEnabled: true,
    suggestedUnits: ["sesi", "paket", "jam"],
    suggestedCategories: ["Matematika", "Bahasa", "Sains", "Privat"],
    sampleProducts: [{ name: "Les Privat /jam", price: 75000 }, { name: "Paket 8 Sesi", price: 500000 }, { name: "Bimbel Kelompok", price: 200000 }],
  },
  "desain": {
    mode: "pesanan", icon: "🎯", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["paket", "revisi", "file"],
    suggestedCategories: ["Logo", "Feeds IG", "Kemasan", "UI/UX"],
    sampleProducts: [{ name: "Desain Logo", price: 500000 }, { name: "Paket Feeds IG 30", price: 750000 }, { name: "Desain Kemasan", price: 350000 }],
  },
  // --- Retail: Langsung ---
  "sembako": {
    mode: "langsung", icon: "🏪", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["kg", "pcs", "pack", "liter"],
    suggestedCategories: ["Beras", "Minyak", "Gula", "Bumbu"],
    sampleProducts: [{ name: "Beras 5kg", price: 65000 }, { name: "Minyak 1L", price: 18000 }, { name: "Gula 1kg", price: 16000 }],
  },
  "pulsa": {
    mode: "langsung", icon: "📶", defaultCapacity: null, bookingTimeEnabled: false,
    suggestedUnits: ["nominal"],
    suggestedCategories: ["Pulsa", "Paket Data", "Token Listrik", "PPOB"],
    sampleProducts: [{ name: "Pulsa 50rb", price: 52000 }, { name: "Paket Data 10GB", price: 65000 }, { name: "Token 100rb", price: 102000 }],
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
