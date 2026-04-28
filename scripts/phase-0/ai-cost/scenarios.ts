/**
 * Realistic merchant scenarios for AI cost measurement.
 *
 * Each scenario simulates ONE Bu Aisyah-archetype merchant at projected scale.
 * Mix represents typical month: ~50 orders, ~225 customer chat events.
 *
 * Token estimates derived from actual prompt lengths in ./prompts/ + realistic
 * context windows (10-20 prior messages, customer profile, recent orders).
 */

export interface Scenario {
  id: string;
  type:
    | "reply_draft"
    | "complaint_draft"
    | "pricing_whisper"
    | "payment_match"
    | "customer_memory"
    | "pattern_detection";
  description: string;
  inputContext: string;
  expectedOutputMaxTokens: number;
  // Frequency: how many times per month a single 50-order merchant hits this
  monthlyFrequency: number;
}

export const SCENARIOS: Scenario[] = [
  // ========== FOREGROUND ASSIST (Tier 2) ==========

  {
    id: "reply-price-check",
    type: "reply_draft",
    description: "Customer asks 'berapa harga kek lapis?'",
    inputContext: `
Merchant voice profile: warm, casual, Malay-leaning. Often uses "Kak/Pak" address, "tau", "ya".
Stock today: kek lapis (12 left, RM 6), kuih ros (8 left, RM 3), kek pandan (sold out)
Customer: Sarah Aminah, +60123456789, 2 prior orders (kek lapis x4, kuih ros x6 in past 2 months)
History last 10 messages: [casual chat from 2 weeks ago, ordered then]
Customer just said: "Hi kak, ada kek lapis lagi tak?"
    `.trim(),
    expectedOutputMaxTokens: 80,
    monthlyFrequency: 80, // ~3-4/day, ~half of customer interactions
  },

  {
    id: "reply-delivery-check",
    type: "reply_draft",
    description: "Customer asks 'boleh hantar Selasa?'",
    inputContext: `
Merchant voice profile: warm, casual, Malay-leaning.
Today: Friday. Selasa = next Tuesday.
Merchant's stated delivery days: Selasa, Kamis, Sabtu in Shah Alam area.
Customer: new customer (no history)
Customer just said: "Boleh hantar area Subang USJ Selasa pagi tak?"
    `.trim(),
    expectedOutputMaxTokens: 100,
    monthlyFrequency: 50,
  },

  {
    id: "reply-custom-request",
    type: "reply_draft",
    description: "Customer asks for custom (vegetarian, halal, no-sugar)",
    inputContext: `
Merchant voice profile: warm, casual.
Stock + recipes: kek lapis, kuih ros, kek pandan — all standard recipes, halal, contains gula.
Customer: Hardeep Singh, no prior order
Customer just said: "Hi, kamu ada vegetarian options tak? Sugar-free?"
[This is a custom request — Foreground Assist must flag for merchant judgment, not auto-commit]
    `.trim(),
    expectedOutputMaxTokens: 120,
    monthlyFrequency: 15,
  },

  {
    id: "reply-loyal-customer-greeting",
    type: "reply_draft",
    description: "Returning loyal customer (5th+ order)",
    inputContext: `
Merchant voice profile: warm, casual.
Customer: Pak Andi, +60198765432, 5 prior orders (kek lapis x3 + kek pandan x2 over 4 months).
Pattern: orders monthly around end of month (payday cycle).
Last interaction: 32 days ago, ordered kek lapis x2.
Customer just said: "Salam kak, ada kek lapis lagi? Macam biasa."
    `.trim(),
    expectedOutputMaxTokens: 90,
    monthlyFrequency: 25,
  },

  {
    id: "complaint-texture",
    type: "complaint_draft",
    description: "Customer complains kek texture kering",
    inputContext: `
Merchant voice profile: warm, casual.
Customer: Bu Lina, +60187654321, 3 prior orders (all kek lapis, no prior complaints).
Order in question: kek lapis x2, RM 12, delivered yesterday.
Customer just said: "Kak, kek hari tu rasa kering. Saya kecewa sangat. Biasanya tak macam ni."
[High-stakes Tier 2. Draft for merchant review only.]
    `.trim(),
    expectedOutputMaxTokens: 200,
    monthlyFrequency: 2,
  },

  {
    id: "pricing-whisper",
    type: "pricing_whisper",
    description: "Weekly pricing observation surface check",
    inputContext: `
Merchant's current price: kek lapis RM 5 each.
Peer benchmark (Shah Alam, 14 users in cluster): average RM 6.50, median RM 6.
Merchant's cost basis: not captured.
Sales volume past 30 days: 47 kek lapis sold.
[Most weeks should output should_surface: false. Surface only if signal strong.]
    `.trim(),
    expectedOutputMaxTokens: 100,
    monthlyFrequency: 4, // weekly check, surfaced ~1x/month avg
  },

  // ========== BACKGROUND TWIN (Tier 3) ==========

  {
    id: "payment-match-clean",
    type: "payment_match",
    description: "Bank notif → unique-amount match",
    inputContext: `
Notification: "Penerimaan DuitNow QR: RM 75.00 from AHMAD BIN ALI at 14:32, ref: TXN-887766"
Open orders:
- ORDER-2026-0042: Pak Ahmad, RM 75.00, kek lapis x12 + kuih ros x3
- ORDER-2026-0041: Bu Sarah, RM 30.00, kuih ros x10
- ORDER-2026-0040: Pak Andi, RM 75.00, kek lapis x12 + kek pandan x1
[Two orders match RM 75.00 — but Ahmad name matches ORDER-2026-0042 better than Andi]
    `.trim(),
    expectedOutputMaxTokens: 60,
    monthlyFrequency: 20, // ~40 payments/month, ~half need AI disambiguation
  },

  {
    id: "payment-match-ambiguous",
    type: "payment_match",
    description: "Bank notif → multiple amount matches, ambiguous",
    inputContext: `
Notification: "Penerimaan: RM 30.00 from FATIMAH at 09:15"
Open orders:
- ORDER-2026-0050: Bu Sarah, RM 30.00, kuih ros x10
- ORDER-2026-0051: Bu Aminah, RM 30.00, kek pandan x1
- ORDER-2026-0052: Pak Hisham, RM 60.00, kek lapis x10
[Both Sarah and Aminah names start with "A/S" range. Fatimah doesn't match either directly. Should ESCALATE.]
    `.trim(),
    expectedOutputMaxTokens: 60,
    monthlyFrequency: 5,
  },

  {
    id: "customer-memory-loyal",
    type: "customer_memory",
    description: "Update loyal customer profile after Nth order",
    inputContext: `
Recent interaction: Pak Andi just confirmed his 6th order (kek lapis x2, RM 12). Pattern: orders ~monthly around 28th of month for past 6 months.
He mentioned: "Macam biasa. Lagi sebulan saya order ya, isteri suka kek lapis kamu."
Current customer profile: 5 orders, no tags yet, no notes.
    `.trim(),
    expectedOutputMaxTokens: 150,
    monthlyFrequency: 5, // ~5 customers per month hit memory-update threshold
  },

  {
    id: "pattern-hari-sepi",
    type: "pattern_detection",
    description: "Hari Sepi pattern (today's revenue <30% of 7-day avg)",
    inputContext: `
Last 14 days summary:
- Daily revenue avg: RM 320 (range RM 180-RM 480)
- Today (so far): RM 65 by 15:00 (4 hours into business day)
- Stock: normal levels
- Day of week: Selasa (typically mid-volume day)
- No festival proximity
[Should detect Hari Sepi, suggest gentle action.]
    `.trim(),
    expectedOutputMaxTokens: 150,
    monthlyFrequency: 4, // 1x/week average
  },

  {
    id: "pattern-festival-prep",
    type: "pattern_detection",
    description: "14 days before Hari Raya Aidilfitri",
    inputContext: `
Calendar: Today = 2027-02-25. Hari Raya = 2027-03-11 (14 days away).
Last year same period: revenue spiked 4.2x average for 21 days around Raya.
Merchant's current stock: normal.
Merchant has not yet announced Raya orders.
[Should flag festival prep.]
    `.trim(),
    expectedOutputMaxTokens: 150,
    monthlyFrequency: 0.5, // major festivals ~6/year, monthly avg
  },

  {
    id: "pattern-null-day",
    type: "pattern_detection",
    description: "Normal day, no patterns to surface",
    inputContext: `
Last 14 days summary: typical (avg RM 320/day, range normal).
Today: RM 280 by 16:00 (track for normal day).
Stock: normal.
No festival within 14 days.
[Should output null — no actionable pattern.]
    `.trim(),
    expectedOutputMaxTokens: 30,
    monthlyFrequency: 22, // most days, output is null
  },
];

/**
 * Compute total monthly events per single 50-order merchant.
 */
export function totalMonthlyEvents(): number {
  return SCENARIOS.reduce((sum, s) => sum + s.monthlyFrequency, 0);
}

/**
 * Group scenarios by type for reporting.
 */
export function scenariosByType() {
  const grouped: Record<string, Scenario[]> = {};
  for (const s of SCENARIOS) {
    if (!grouped[s.type]) grouped[s.type] = [];
    grouped[s.type].push(s);
  }
  return grouped;
}
