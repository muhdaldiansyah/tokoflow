// Per-user rate limiting for AI endpoints (voice/image/recap).
//
// Two windows: a tight per-minute window to absorb bursts, and a daily cap to
// bound total OpenRouter cost per merchant. State is in-process; for
// horizontally-scaled production this should move to Vercel KV / Upstash.
// At Phase 0 scale (single Vercel function instance, friends-and-family
// beta) the in-memory map is sufficient and avoids extra infra.

const PER_MINUTE_LIMIT = 10;
const PER_DAY_LIMIT = 200;
const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * 60_000;
const MAX_ENTRIES = 10_000;

type Bucket = {
  minuteCount: number;
  minuteResetAt: number;
  dayCount: number;
  dayResetAt: number;
};

const buckets = new Map<string, Bucket>();

export type AiRateLimitResult =
  | { allowed: true; remaining: { minute: number; day: number } }
  | { allowed: false; retryAfterSeconds: number; reason: "minute" | "day" };

export function checkAiRateLimit(userId: string): AiRateLimitResult {
  const now = Date.now();
  // Bound memory growth: prune buckets whose daily window has expired when
  // the map crosses the cap. O(n) once per ~10K unique users.
  if (buckets.size > MAX_ENTRIES) {
    for (const [k, v] of buckets) {
      if (v.dayResetAt < now) buckets.delete(k);
    }
  }
  const bucket = buckets.get(userId) ?? {
    minuteCount: 0,
    minuteResetAt: now + MINUTE_MS,
    dayCount: 0,
    dayResetAt: now + DAY_MS,
  };

  if (now >= bucket.minuteResetAt) {
    bucket.minuteCount = 0;
    bucket.minuteResetAt = now + MINUTE_MS;
  }
  if (now >= bucket.dayResetAt) {
    bucket.dayCount = 0;
    bucket.dayResetAt = now + DAY_MS;
  }

  if (bucket.dayCount >= PER_DAY_LIMIT) {
    buckets.set(userId, bucket);
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.dayResetAt - now) / 1000),
      reason: "day",
    };
  }
  if (bucket.minuteCount >= PER_MINUTE_LIMIT) {
    buckets.set(userId, bucket);
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.minuteResetAt - now) / 1000),
      reason: "minute",
    };
  }

  bucket.minuteCount += 1;
  bucket.dayCount += 1;
  buckets.set(userId, bucket);

  return {
    allowed: true,
    remaining: {
      minute: PER_MINUTE_LIMIT - bucket.minuteCount,
      day: PER_DAY_LIMIT - bucket.dayCount,
    },
  };
}

export function aiRateLimitResponseInit(
  result: Extract<AiRateLimitResult, { allowed: false }>,
): { status: number; headers: HeadersInit } {
  return {
    status: 429,
    headers: {
      "Retry-After": String(result.retryAfterSeconds),
    },
  };
}
