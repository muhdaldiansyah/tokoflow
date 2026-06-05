// Per-IP rate limiting for ANONYMOUS AI endpoints (photo-magic landing demo).
//
// Tighter than per-user ai.ts — anonymous endpoints are public and abuse-prone.
// 3 requests per hour, 10 per day per IP. State is in-process (single Vercel
// instance scale, Phase 0 reality). Move to Vercel KV / Upstash for prod scale.
//
// Bucket capacity is bounded by MAX_ENTRIES with passive pruning when full.

const PER_HOUR_LIMIT = 3;
const PER_DAY_LIMIT = 10;
const HOUR_MS = 60 * 60_000;
const DAY_MS = 24 * 60 * 60_000;
const MAX_ENTRIES = 100_000;

type Bucket = {
  hourCount: number;
  hourResetAt: number;
  dayCount: number;
  dayResetAt: number;
};

const buckets = new Map<string, Bucket>();

export type AnonymousAiRateLimitResult =
  | { allowed: true; remaining: { hour: number; day: number } }
  | {
      allowed: false;
      retryAfterSeconds: number;
      reason: "hour" | "day";
    };

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  const real = headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export function checkAnonymousAiRateLimit(
  ip: string,
): AnonymousAiRateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_ENTRIES) {
    for (const [k, v] of buckets) {
      if (v.dayResetAt < now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(ip) ?? {
    hourCount: 0,
    hourResetAt: now + HOUR_MS,
    dayCount: 0,
    dayResetAt: now + DAY_MS,
  };

  if (now >= bucket.hourResetAt) {
    bucket.hourCount = 0;
    bucket.hourResetAt = now + HOUR_MS;
  }
  if (now >= bucket.dayResetAt) {
    bucket.dayCount = 0;
    bucket.dayResetAt = now + DAY_MS;
  }

  if (bucket.dayCount >= PER_DAY_LIMIT) {
    buckets.set(ip, bucket);
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.dayResetAt - now) / 1000),
      reason: "day",
    };
  }
  if (bucket.hourCount >= PER_HOUR_LIMIT) {
    buckets.set(ip, bucket);
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.hourResetAt - now) / 1000),
      reason: "hour",
    };
  }

  bucket.hourCount += 1;
  bucket.dayCount += 1;
  buckets.set(ip, bucket);

  return {
    allowed: true,
    remaining: {
      hour: PER_HOUR_LIMIT - bucket.hourCount,
      day: PER_DAY_LIMIT - bucket.dayCount,
    },
  };
}

export function anonymousAiRateLimitResponseInit(
  result: Extract<AnonymousAiRateLimitResult, { allowed: false }>,
): ResponseInit {
  return {
    status: 429,
    headers: {
      "Retry-After": String(result.retryAfterSeconds),
      "X-RateLimit-Reason": result.reason,
    },
  };
}
