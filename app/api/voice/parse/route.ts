import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { aiRateLimitResponseInit, checkAiRateLimit } from "@/lib/rate-limit/ai";

const MAX_TRANSCRIPT_CHARS = 10_000;

interface ParsedItem {
  name: string;
  qty: number;
  price: number;
}

interface ParsedOrder {
  items: ParsedItem[];
  customer_name?: string;
  customer_phone?: string;
  delivery_date?: string;
  notes?: string;
  discount?: number;
  payment_status?: "paid" | "dp" | "unpaid";
  dp_amount?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedClient(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = checkAiRateLimit(user.id);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error:
            limit.reason === "day"
              ? "Daily AI usage limit reached. Try again tomorrow."
              : "Too many AI requests. Slow down for a moment.",
        },
        aiRateLimitResponseInit(limit),
      );
    }

    const { transcript, products } = await request.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "transcript is required" },
        { status: 400 }
      );
    }

    if (transcript.length > MAX_TRANSCRIPT_CHARS) {
      return NextResponse.json(
        { error: `Transcript too long (max ${MAX_TRANSCRIPT_CHARS} chars).` },
        { status: 413 },
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ items: [] });
    }

    const productList =
      Array.isArray(products) && products.length > 0
        ? products
            .map(
              (p: { name: string; price: number }) =>
                `- ${p.name}: RM ${p.price.toLocaleString("en-MY")}`
            )
            .join("\n")
        : "No products on file.";

    const today = new Date().toLocaleDateString("en-MY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Kuala_Lumpur",
    });

    const systemPrompt = `You are a Malaysian SMB order parser. Extract ALL information from the customer's order text into JSON.

INSTRUCTIONS:
1. Extract line items: name, qty, price.
2. Match each item to the merchant's product catalog (allow common Malay / English / Manglish shortenings, e.g. "nasi lemak biasa" = "Nasi Lemak Biasa", "teh o ais" = "Teh O Ais"). Use the catalog price when a match is found.
3. Unknown item WITH a price mentioned → use that price. Unknown item WITHOUT a price → price: 0.
4. Convert Malay / English number words: satu/one=1, dua/two=2, tiga/three=3, empat/four=4, lima/five=5, enam/six=6, tujuh/seven=7, lapan/eight=8, sembilan/nine=9, sepuluh/ten=10, belas=teens, puluh=x10, ratus=x100, ribu/thousand=x1000.
5. If quantity is not stated: qty = 1.
6. Extract the customer's name if mentioned (ignore the WhatsApp sender display name — only the actual customer name).
7. Extract phone if present. Malaysian formats: 01x-xxx-xxxx, 60xxxxxxxxxx, +60xxxxxxxxxx.
8. Extract delivery/pickup date if mentioned. Today is ${today}. Convert "tomorrow"/"lusa"/"esok"/"monday"/"isnin"/etc. into YYYY-MM-DD.
9. Extract special notes (e.g. "kurang manis", "extra spicy", "deliver to address X", "pack separately", etc.).
10. Extract discount if mentioned ("diskaun 10", "potong RM5", "discount 10%").
11. Extract payment status: "paid"/"sudah bayar"/"lunas" → "paid", "deposit RM50"/"DP 50" → "dp", "belum bayar"/"unpaid" → "unpaid".
12. Ignore pleasantries, timestamps, WhatsApp quote formatting.

Always respond in JSON:
{
  "items": [{"name": "string", "qty": number, "price": number}],
  "customer_name": "string or null",
  "customer_phone": "string or null",
  "delivery_date": "YYYY-MM-DD or null",
  "notes": "string or null",
  "discount": number or null,
  "payment_status": "paid/dp/unpaid or null",
  "dp_amount": number or null
}`;

    const userPrompt = `TRANSCRIPT: "${transcript}"

MERCHANT PRODUCTS:
${productList}`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ items: [] });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(text);

    const items: ParsedItem[] = Array.isArray(parsed.items)
      ? parsed.items
          .filter(
            (item: ParsedItem) =>
              item.name && typeof item.qty === "number" && item.qty > 0
          )
          .map((item: ParsedItem) => ({
            name: String(item.name),
            qty: Math.max(1, Math.round(item.qty)),
            price: Math.max(0, Math.round(item.price || 0)),
          }))
      : [];

    const result: ParsedOrder = { items };

    if (parsed.customer_name && typeof parsed.customer_name === "string") {
      result.customer_name = parsed.customer_name.trim();
    }
    if (parsed.customer_phone && typeof parsed.customer_phone === "string") {
      result.customer_phone = parsed.customer_phone.trim();
    }
    if (parsed.delivery_date && typeof parsed.delivery_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.delivery_date)) {
      result.delivery_date = parsed.delivery_date;
    }
    if (parsed.notes && typeof parsed.notes === "string") {
      result.notes = parsed.notes.trim();
    }
    if (typeof parsed.discount === "number" && parsed.discount > 0) {
      result.discount = Math.round(parsed.discount);
    }
    if (parsed.payment_status && ["paid", "dp", "unpaid"].includes(parsed.payment_status)) {
      result.payment_status = parsed.payment_status;
    }
    if (typeof parsed.dp_amount === "number" && parsed.dp_amount > 0) {
      result.dp_amount = Math.round(parsed.dp_amount);
    }

    return NextResponse.json(result);
  } catch {
    // On any failure, return empty items — client falls back to regex
    return NextResponse.json({ items: [] });
  }
}
