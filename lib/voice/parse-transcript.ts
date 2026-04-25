import type { OrderItem } from "@/features/orders/types/order.types";

interface ProductRef {
  name: string;
  price: number;
}

// Malay/Manglish + English number words. BM speakers may use "lapan" while
// BI speakers say "delapan" — both work.
const NUMBER_WORDS: Record<string, number> = {
  // Malay / Bahasa
  satu: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  lapan: 8,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
  se: 1,
  // English
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

const UNIT_WORDS = /\b(porsi|buah|pcs|biji|biji|x|kali|cup|gelas|mangkok|mangkuk|bungkus|set|platter|pinggan|piece|pieces|pax)\b/gi;

// Split transcript into individual item segments
function splitSegments(transcript: string): string[] {
  // Normalize whitespace
  const text = transcript.trim().replace(/\s+/g, " ");
  // Split by delimiters
  return text
    .split(/[,;]+|\b(?:sama|terus|tambah|dan|plus|and|with|also)\b/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Extract qty from a segment, return [name, qty]
function extractQtyAndName(segment: string): [string, number] {
  // Remove unit words
  const cleaned = segment.replace(UNIT_WORDS, "").replace(/\s+/g, " ").trim();

  // Try qty at start: "dua nasi goreng" or "2 nasi goreng"
  const startDigit = cleaned.match(/^(\d+)\s+(.+)/);
  if (startDigit) {
    return [startDigit[2].trim(), parseInt(startDigit[1])];
  }

  const startWord = cleaned.match(/^(\w+)\s+(.+)/);
  if (startWord && NUMBER_WORDS[startWord[1].toLowerCase()] !== undefined) {
    return [startWord[2].trim(), NUMBER_WORDS[startWord[1].toLowerCase()]];
  }

  // Try qty at end: "nasi goreng dua" or "nasi goreng 2"
  const endDigit = cleaned.match(/(.+)\s+(\d+)$/);
  if (endDigit) {
    return [endDigit[1].trim(), parseInt(endDigit[2])];
  }

  const endWord = cleaned.match(/(.+)\s+(\w+)$/);
  if (endWord && NUMBER_WORDS[endWord[2].toLowerCase()] !== undefined) {
    return [endWord[1].trim(), NUMBER_WORDS[endWord[2].toLowerCase()]];
  }

  // Default qty = 1
  return [cleaned, 1];
}

// Title-case: "nasi goreng" → "Nasi Goreng"
function titleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}

// Fuzzy match against product catalog for price lookup
function matchProduct(
  itemName: string,
  products: ProductRef[]
): ProductRef | null {
  const lower = itemName.toLowerCase();

  // Exact match
  for (const p of products) {
    if (p.name.toLowerCase() === lower) return p;
  }

  // Contains match (product name contains item, or item contains product name)
  for (const p of products) {
    const pLower = p.name.toLowerCase();
    if (pLower.includes(lower) || lower.includes(pLower)) return p;
  }

  return null;
}

export function parseTranscriptToItems(
  transcript: string,
  products: ProductRef[]
): OrderItem[] {
  if (!transcript.trim()) return [];

  const segments = splitSegments(transcript);
  const itemMap = new Map<string, OrderItem>();

  for (const segment of segments) {
    const [rawName, qty] = extractQtyAndName(segment);
    if (!rawName) continue;

    const matched = matchProduct(rawName, products);
    const name = matched ? matched.name : titleCase(rawName);
    const price = matched ? matched.price : 0;
    const key = name.toLowerCase();

    const existing = itemMap.get(key);
    if (existing) {
      existing.qty += qty;
    } else {
      itemMap.set(key, { name, qty, price });
    }
  }

  return Array.from(itemMap.values());
}
