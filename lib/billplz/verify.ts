import crypto from "node:crypto";

/**
 * Billplz X-Signature verification.
 *
 * Billplz sends callback params as form-urlencoded POST (to `callback_url`) and
 * as query string on browser redirect (to `redirect_url`). The `x_signature`
 * field is HMAC-SHA256 of the "source string":
 *
 *     sourceString = keys sorted alphabetically, joined as `keyvalue|keyvalue|...`
 *     (the `x_signature` key itself is excluded)
 *
 * Docs: https://www.billplz.com/api#x-signature
 */

function buildSourceString(params: Record<string, string | undefined>): string {
  return Object.keys(params)
    .filter((k) => k !== "x_signature" && params[k] !== undefined)
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join("|");
}

function getSignatureKey(override?: string): string {
  const key = override ?? process.env.BILLPLZ_X_SIGNATURE_KEY;
  if (!key) {
    throw new Error(
      "BILLPLZ_X_SIGNATURE_KEY is not set. Configure it in env before verifying webhooks.",
    );
  }
  return key;
}

export function signPayload(
  params: Record<string, string | undefined>,
  signatureKey?: string,
): string {
  const source = buildSourceString(params);
  return crypto
    .createHmac("sha256", getSignatureKey(signatureKey))
    .update(source)
    .digest("hex");
}

/**
 * Verify X-Signature on an incoming Billplz callback payload.
 * Uses timing-safe comparison. Returns false if the field is missing.
 */
export function verifyXSignature(
  params: Record<string, string | undefined>,
  signatureKey?: string,
): boolean {
  const received = params.x_signature;
  if (!received || typeof received !== "string") return false;

  let expected: string;
  try {
    expected = signPayload(params, signatureKey);
  } catch {
    return false;
  }

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(received, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
