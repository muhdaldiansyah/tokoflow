import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// Versioned envelope: "v1:<iv_b64>:<ciphertext_b64>:<tag_b64>"
// v1 = AES-256-GCM, 12-byte IV, 16-byte tag, key derived from SECRET_KEY env via scrypt.
const ENVELOPE_VERSION = "v1";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const SCRYPT_SALT = Buffer.from("tokoflow-secret-box-v1", "utf8");

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const secret = process.env.MYINVOIS_SECRET_KEY;
  if (!secret || secret.length < 16) {
    throw new Error(
      "MYINVOIS_SECRET_KEY env var is required (>= 16 chars) to encrypt MyInvois credentials at rest.",
    );
  }
  cachedKey = scryptSync(secret, SCRYPT_SALT, KEY_LENGTH);
  return cachedKey;
}

export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    ENVELOPE_VERSION,
    iv.toString("base64"),
    ciphertext.toString("base64"),
    tag.toString("base64"),
  ].join(":");
}

export function decryptSecret(envelope: string): string {
  const parts = envelope.split(":");
  if (parts.length !== 4 || parts[0] !== ENVELOPE_VERSION) {
    throw new Error("Invalid secret envelope format.");
  }
  const [, ivB64, ctB64, tagB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const ciphertext = Buffer.from(ctB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  if (iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH) {
    throw new Error("Invalid secret envelope payload.");
  }
  const key = getKey();
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

export function isEncryptedEnvelope(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(`${ENVELOPE_VERSION}:`);
}
