// Microcopy library — Tokoflow voice canon.
// All strings here follow the DO/DON'T table in
// docs/positioning/04-design-system.md and the AI voice rules in
// docs/positioning/02-product-soul.md.
//
// Voice rules (one-line summary):
//   • warm, personal, active ("we'll check…" not "the system is processing")
//   • use names where you can ("Pak Andi" beats "the customer")
//   • empathetic in hard moments (slow days, errors), confident in success
//   • no jargon (no "slug", "API", "UUID", "webhook")
//   • no anxiety patterns (no "X/50 used", no streaks, no countdowns)
//
// Wire these from screens via direct import — `copy.empty.orders()` etc.
// Templates that need values are functions; static strings are exported as is.

export const empty = {
  // "No orders for the day" — repeat-user empty.
  orders: () => "No orders today. Enjoy a quiet morning.",
  // First-time empty (lifetime no orders ever).
  ordersFirstTime: () => "Your first order is 30 seconds away.",
  // First-time + filtered/searched-no-match.
  ordersNoMatch: () => "Nothing matches that filter — try widening it.",

  products: () => "No products yet. Add one and customers can order from your store link.",
  productsNoMatch: (term: string) => `Nothing matches "${term}".`,

  customers: () => "Customers show up here after their first order.",
  customersNoMatch: () => "No customers match that search.",

  invoices: () => "Invoices appear here when an order is paid — or you can write one manually.",
  invoicesNoMatch: () => "No invoices match that filter.",

  // Daily prep list (recap/Production view).
  production: () => "No orders for this date yet.",
  productionHint: () =>
    "When customers order through your store link with a delivery date, prep totals appear here automatically.",

  // Monthly recap report.
  monthly: (monthName: string, year: number) =>
    `No orders in ${monthName} ${year} yet.`,

  history: () => "Nothing here yet — your past orders will show up after the first sale.",
} as const;

export const errors = {
  network: () => "Connection's a bit shaky. Trying again.",
  validation: (field: string) =>
    `${field} looks off — mind giving it another check?`,
  permission: (what: string) =>
    `We need ${what} access for this. Open settings to allow it?`,
  server: () => "Something went wrong on our end. We're on it.",
} as const;

export const loading = {
  // Use a skeleton shimmer instead of text under 1 second.
  short: () => "One sec…",
  medium: () => "Just a moment…",
  long: () => "Setting things up for you…",
} as const;

export const confirm = {
  deleteProduct: () => "Remove this product? You can add it back any time.",
  cancelOrder: () =>
    "Cancel this order? The customer will be notified automatically.",
  refund: (amount: string, name: string) =>
    `Refund ${amount} to ${name}? It goes back to their account.`,
  logout: () => "Log out of Tokoflow? You can sign back in any time.",
} as const;

export const success = {
  orderCreated: (customer: string) =>
    `Order saved. ${customer} has been notified.`,
  paymentReceived: (amount: string) =>
    `${amount} received. You're cleared to start cooking.`,
  productAdded: (name: string) => `${name} is on the menu.`,
  statusUpdated: (customer: string) =>
    `${customer}'s order is up to date — they've been told.`,
} as const;

// === Empathy moments ===
// Tone: warm, dignifying, never judgmental, never comparison-shaming.
// See docs/positioning/02-product-soul.md "The 7 Empathy Moments".

export const empathy = {
  firstOrder: (customer: string, items: number, amount: string) =>
    `Your first order. ${customer} — ${items} item${items === 1 ? "" : "s"}, ${amount}. Today is the start of something.`,

  quietDay: (orders: number, amount: string) =>
    `A quieter day today. ${orders} order${orders === 1 ? "" : "s"}, ${amount}. Every business has these — rest tonight, tomorrow's another one.`,

  steadyDay: (orders: number, amount: string) =>
    `${orders} order${orders === 1 ? "" : "s"} today, ${amount}. Steady. Goodnight.`,

  busyDay: (orders: number, amount: string) =>
    `Big day. ${orders} orders, ${amount}. You earned the rest tonight.`,

  customerReturning: (customer: string, totalOrders: number, favorite?: string) =>
    `${customer} is back — order #${totalOrders} with you${favorite ? `. Favourite: ${favorite}.` : "."} Want to tag them as a regular?`,

  preRamadan: () =>
    "Ramadan in two weeks. Want a hand setting up a Ramadan menu?",

  midRush: () =>
    "Looks busy — I'll draft replies so you can keep cooking. Tap to send.",

  customerComplaint: (customer: string) =>
    `${customer} sounds unhappy with the last order. Want me to draft a calm, helpful reply?`,

  anniversary: (years: number, customers: number, businessName: string) =>
    `${years} year${years === 1 ? "" : "s"} ago you started with one photo. ${customers} customers later — happy anniversary, ${businessName}.`,
} as const;

// === Settings labels (replaces technical jargon) ===
// Always use the human label in UI; the technical term stays in code.

export const labels = {
  slug: "Store link",
  apiToken: "Access token",
  webhookUrl: "Notification URL",
  taxId: "Tax info (Pro)",
  pushNotifications: "Notifications",
} as const;

export const copy = {
  empty,
  errors,
  loading,
  confirm,
  success,
  empathy,
  labels,
} as const;

export default copy;
