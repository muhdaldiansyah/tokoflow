// Malaysian cities + states for onboarding, directory filters, and community clustering.
// Used to normalize user-entered city into a canonical slug.
// DB columns `profiles.city_slug` / `communities.city_slug` remain authoritative.

export interface MalaysianCity {
  id: string;
  label: string;
  slug: string;
  state: string;
  stateSlug: string;
}

export const MY_STATES = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Kuala Lumpur",
  "Labuan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Penang",
  "Perak",
  "Perlis",
  "Putrajaya",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
] as const;

export type MalaysianState = (typeof MY_STATES)[number];

export const MY_CITIES: MalaysianCity[] = [
  // Kuala Lumpur (FT)
  { id: "kuala-lumpur", label: "Kuala Lumpur", slug: "kuala-lumpur", state: "Kuala Lumpur", stateSlug: "kuala-lumpur" },

  // Selangor
  { id: "shah-alam", label: "Shah Alam", slug: "shah-alam", state: "Selangor", stateSlug: "selangor" },
  { id: "petaling-jaya", label: "Petaling Jaya", slug: "petaling-jaya", state: "Selangor", stateSlug: "selangor" },
  { id: "subang-jaya", label: "Subang Jaya", slug: "subang-jaya", state: "Selangor", stateSlug: "selangor" },
  { id: "klang", label: "Klang", slug: "klang", state: "Selangor", stateSlug: "selangor" },
  { id: "kajang", label: "Kajang", slug: "kajang", state: "Selangor", stateSlug: "selangor" },
  { id: "ampang", label: "Ampang", slug: "ampang", state: "Selangor", stateSlug: "selangor" },
  { id: "cheras", label: "Cheras", slug: "cheras", state: "Selangor", stateSlug: "selangor" },
  { id: "puchong", label: "Puchong", slug: "puchong", state: "Selangor", stateSlug: "selangor" },
  { id: "cyberjaya", label: "Cyberjaya", slug: "cyberjaya", state: "Selangor", stateSlug: "selangor" },

  // Penang
  { id: "george-town", label: "George Town", slug: "george-town", state: "Penang", stateSlug: "penang" },
  { id: "butterworth", label: "Butterworth", slug: "butterworth", state: "Penang", stateSlug: "penang" },
  { id: "bukit-mertajam", label: "Bukit Mertajam", slug: "bukit-mertajam", state: "Penang", stateSlug: "penang" },

  // Johor
  { id: "johor-bahru", label: "Johor Bahru", slug: "johor-bahru", state: "Johor", stateSlug: "johor" },
  { id: "muar", label: "Muar", slug: "muar", state: "Johor", stateSlug: "johor" },
  { id: "batu-pahat", label: "Batu Pahat", slug: "batu-pahat", state: "Johor", stateSlug: "johor" },
  { id: "kluang", label: "Kluang", slug: "kluang", state: "Johor", stateSlug: "johor" },

  // Perak
  { id: "ipoh", label: "Ipoh", slug: "ipoh", state: "Perak", stateSlug: "perak" },
  { id: "taiping", label: "Taiping", slug: "taiping", state: "Perak", stateSlug: "perak" },
  { id: "teluk-intan", label: "Teluk Intan", slug: "teluk-intan", state: "Perak", stateSlug: "perak" },

  // Kedah
  { id: "alor-setar", label: "Alor Setar", slug: "alor-setar", state: "Kedah", stateSlug: "kedah" },
  { id: "sungai-petani", label: "Sungai Petani", slug: "sungai-petani", state: "Kedah", stateSlug: "kedah" },
  { id: "langkawi", label: "Langkawi", slug: "langkawi", state: "Kedah", stateSlug: "kedah" },
  { id: "kulim", label: "Kulim", slug: "kulim", state: "Kedah", stateSlug: "kedah" },

  // Kelantan
  { id: "kota-bharu", label: "Kota Bharu", slug: "kota-bharu", state: "Kelantan", stateSlug: "kelantan" },

  // Terengganu
  { id: "kuala-terengganu", label: "Kuala Terengganu", slug: "kuala-terengganu", state: "Terengganu", stateSlug: "terengganu" },
  { id: "kemaman", label: "Kemaman", slug: "kemaman", state: "Terengganu", stateSlug: "terengganu" },

  // Pahang
  { id: "kuantan", label: "Kuantan", slug: "kuantan", state: "Pahang", stateSlug: "pahang" },
  { id: "temerloh", label: "Temerloh", slug: "temerloh", state: "Pahang", stateSlug: "pahang" },
  { id: "bentong", label: "Bentong", slug: "bentong", state: "Pahang", stateSlug: "pahang" },

  // Melaka
  { id: "melaka", label: "Melaka", slug: "melaka", state: "Melaka", stateSlug: "melaka" },
  { id: "alor-gajah", label: "Alor Gajah", slug: "alor-gajah", state: "Melaka", stateSlug: "melaka" },

  // Negeri Sembilan
  { id: "seremban", label: "Seremban", slug: "seremban", state: "Negeri Sembilan", stateSlug: "negeri-sembilan" },
  { id: "port-dickson", label: "Port Dickson", slug: "port-dickson", state: "Negeri Sembilan", stateSlug: "negeri-sembilan" },

  // Perlis
  { id: "kangar", label: "Kangar", slug: "kangar", state: "Perlis", stateSlug: "perlis" },

  // Sabah
  { id: "kota-kinabalu", label: "Kota Kinabalu", slug: "kota-kinabalu", state: "Sabah", stateSlug: "sabah" },
  { id: "sandakan", label: "Sandakan", slug: "sandakan", state: "Sabah", stateSlug: "sabah" },
  { id: "tawau", label: "Tawau", slug: "tawau", state: "Sabah", stateSlug: "sabah" },

  // Sarawak
  { id: "kuching", label: "Kuching", slug: "kuching", state: "Sarawak", stateSlug: "sarawak" },
  { id: "miri", label: "Miri", slug: "miri", state: "Sarawak", stateSlug: "sarawak" },
  { id: "sibu", label: "Sibu", slug: "sibu", state: "Sarawak", stateSlug: "sarawak" },
  { id: "bintulu", label: "Bintulu", slug: "bintulu", state: "Sarawak", stateSlug: "sarawak" },

  // FT Labuan + Putrajaya
  { id: "labuan", label: "Labuan", slug: "labuan", state: "Labuan", stateSlug: "labuan" },
  { id: "putrajaya", label: "Putrajaya", slug: "putrajaya", state: "Putrajaya", stateSlug: "putrajaya" },
];

export function getCityBySlug(slug: string): MalaysianCity | undefined {
  return MY_CITIES.find((c) => c.slug === slug);
}

export function getCitiesByState(stateSlug: string): MalaysianCity[] {
  return MY_CITIES.filter((c) => c.stateSlug === stateSlug);
}

// Group cities by state for dropdown rendering
export function getCitiesGrouped(): Record<string, MalaysianCity[]> {
  const grouped: Record<string, MalaysianCity[]> = {};
  for (const city of MY_CITIES) {
    if (!grouped[city.state]) grouped[city.state] = [];
    grouped[city.state].push(city);
  }
  return grouped;
}

// Normalize free-text city input to canonical slug (best-effort fuzzy match)
export function normalizeCitySlug(input: string): string {
  const normalized = input.trim().toLowerCase().replace(/\s+/g, "-");
  const direct = MY_CITIES.find((c) => c.slug === normalized || c.label.toLowerCase() === input.trim().toLowerCase());
  return direct?.slug ?? normalized;
}
