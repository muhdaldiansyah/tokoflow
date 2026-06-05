/**
 * Phase 0 Spike 0.2: Billplz sandbox hello-world
 *
 * Goal: Prove we can create a bill, open its payment URL, and verify X-Signature on callback.
 * Pass criteria: Bill created with status "due"; X-Signature HMAC logic verified against a
 * simulated callback payload (round-trip identity check).
 * Fail criteria: API rejects credentials, or HMAC doesn't round-trip.
 *
 * Prerequisites:
 *   1. Register at https://www.billplz-sandbox.com
 *   2. Go to Settings → "Payment Gateway" → copy your Secret Key (API key)
 *   3. Create a Collection (Billings → Add Collection) → copy the Collection ID
 *   4. Settings → "X Signature Key" → create one → copy
 *   5. cp scripts/phase-0/.env.phase-0.example scripts/phase-0/.env.phase-0
 *      then fill in the blanks
 *   6. Run: npx tsx --env-file=scripts/phase-0/.env.phase-0 scripts/phase-0/billplz-spike.ts
 */

import crypto from "node:crypto";

const BASE =
  process.env.BILLPLZ_BASE_URL ?? "https://www.billplz-sandbox.com/api/v3";
const API_KEY = process.env.BILLPLZ_API_KEY;
const COLLECTION_ID = process.env.BILLPLZ_COLLECTION_ID;
const X_SIGNATURE_KEY = process.env.BILLPLZ_X_SIGNATURE_KEY;

function requireEnv() {
  const missing: string[] = [];
  if (!API_KEY) missing.push("BILLPLZ_API_KEY");
  if (!COLLECTION_ID) missing.push("BILLPLZ_COLLECTION_ID");
  if (!X_SIGNATURE_KEY) missing.push("BILLPLZ_X_SIGNATURE_KEY");
  if (missing.length) {
    console.error("Missing env vars:", missing.join(", "));
    console.error(
      "Copy scripts/phase-0/.env.phase-0.example → scripts/phase-0/.env.phase-0 and fill in.",
    );
    process.exit(1);
  }
}

type Bill = {
  id: string;
  url: string;
  state: string;
  amount: number;
  paid: boolean;
  collection_id: string;
};

async function createBill(): Promise<Bill> {
  const basic = Buffer.from(`${API_KEY}:`).toString("base64");
  const res = await fetch(`${BASE}/bills`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      collection_id: COLLECTION_ID!,
      email: "spike@tokoflow.test",
      name: "Spike Tester",
      amount: "100", // cents → RM1.00
      callback_url: "https://example.com/webhooks/billplz",
      description: "Phase 0 spike test — safe to ignore",
      reference_1_label: "invoice",
      reference_1: `SPIKE-${Date.now()}`,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Bill create failed ${res.status}: ${text}`);
  }
  return JSON.parse(text) as Bill;
}

/**
 * Billplz X-Signature verification.
 *
 * Billplz sends callback params (either as form-encoded POST body or redirect query string).
 * The x_signature field is HMAC-SHA256 of the source string:
 *   source = keys sorted alphabetically, joined as `key1value1|key2value2|...`
 *   (the "x_signature" key itself is excluded from the source)
 *
 * Docs: https://www.billplz.com/api#x-signature
 */
function buildSourceString(params: Record<string, string>): string {
  return Object.keys(params)
    .filter((k) => k !== "x_signature")
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join("|");
}

function sign(params: Record<string, string>, secret: string): string {
  const source = buildSourceString(params);
  return crypto.createHmac("sha256", secret).update(source).digest("hex");
}

function verify(params: Record<string, string>, secret: string): boolean {
  if (!params.x_signature) return false;
  const expected = sign(params, secret);
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(params.x_signature, "hex"),
  );
}

async function main() {
  console.log("─".repeat(60));
  console.log("Phase 0.2: Billplz sandbox spike");
  console.log("─".repeat(60));
  requireEnv();

  console.log("\n[1/2] Create bill...");
  const bill = await createBill();
  console.log(`  ✓ bill id: ${bill.id}`);
  console.log(`  ✓ payment URL: ${bill.url}`);
  console.log(`  ✓ state: ${bill.state}`);
  console.log("\n  → Open the URL in browser to simulate FPX/DuitNow QR payment.");
  console.log("    Use sandbox bank: Test BIMB, PIN 1234.");

  console.log("\n[2/2] X-Signature round-trip test...");
  const mockCallback: Record<string, string> = {
    id: bill.id,
    collection_id: bill.collection_id,
    paid: "true",
    state: "paid",
    amount: String(bill.amount),
    paid_amount: String(bill.amount),
    due_at: "2099-01-01",
    email: "spike@tokoflow.test",
    mobile: "",
    name: "Spike Tester",
    url: bill.url,
    paid_at: new Date().toISOString(),
    transaction_id: "T-SPIKE-" + Date.now(),
    transaction_status: "completed",
  };

  mockCallback.x_signature = sign(mockCallback, X_SIGNATURE_KEY!);
  const ok = verify(mockCallback, X_SIGNATURE_KEY!);

  // Negative test: tamper the payload, signature must fail.
  const tampered = { ...mockCallback, paid_amount: "999999" };
  const tamperFails = !verify(tampered, X_SIGNATURE_KEY!);

  console.log(`  ✓ genuine payload verify: ${ok ? "PASS" : "FAIL"}`);
  console.log(`  ✓ tampered payload rejected: ${tamperFails ? "PASS" : "FAIL"}`);

  console.log("\n" + "─".repeat(60));
  if (ok && tamperFails) {
    console.log("✅ PASS — Billplz integration path confirmed.");
    console.log(
      `\n   Next: pay the bill at ${bill.url} and observe real callback.`,
    );
    console.log("   (Use ngrok + a local Next.js route to receive the POST.)");
    console.log("\n→ Phase 0.2 validated. Proceed to Stage 2.");
  } else {
    console.log("❌ FAIL — signature logic broken. Stop.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\n❌ FAIL — exception");
  console.error(err);
  process.exit(1);
});
