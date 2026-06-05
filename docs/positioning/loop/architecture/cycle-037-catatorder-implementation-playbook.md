# Cycle 037 — CatatOrder Implementation Playbook (Wave 1 ID Locked)

> User confirmed Wave 1 = CatatOrder ID exclusive. This cycle locks the remaining 4 decisions (D-A1 through D-A4), gives concrete SQL for the schema migration, code skeletons for the mobile bridge, and per-phase implementation steps with file paths.
>
> **Mode:** PLAYBOOK. Per-phase production-code skeletons; ready for cycle 038+ to start execution.

---

## 0. Locked decisions (final)

| # | Decision | Locked value | Rationale |
|---|---|---|---|
| **D-A1** | Schema migration approach | **Incremental coexist 30-60d** | Existing v1.0.0 users keep working; materialized views unify reads; dual-write `/api/orders` POST also inserts `diary_entries`; deprecate legacy write path migration 081 only after telemetry confirms 100% writes via new path |
| **D-A2** | Voice STT picker | **`@react-native-voice/voice` (native Apple Speech / Android SpeechRecognizer)** primary + OpenRouter Gemini speech fallback | Lean APK, free, first-class Indonesian, scaffolding exists at `VoiceOrderSheet.tsx:14-27`; flips cycle 34 D2 (whisper.rn was Tokoflow-MY-context). Refuse-list satisfied: audio routes to Apple/Google with merchant consent, treated as "with merchant consent" not "data sale" |
| **D-A3** | UX migration approach | **Add "Cerita" as 6th tab** (additive). Existing 5 tabs unchanged. New installs default to Cerita; v1.0.0 users see one-time tooltip pointing to it. After 60-90d stable + telemetry validates Cerita primacy, migrate to cycle 28 §3 "no top-bar feed-only" mandate | Lowest-risk path; does not break v1.0.0 muscle memory; opt-in adoption; falsifiable (if Cerita usage <30% by Day 60, abort full migration) |
| **D-A4** | Refuse-list quota nudge | **Simplify to `none \| exhausted`** (bible v1.2 mandate) | Anti-anxiety per cycle 22 + 28; 40/48/50 tiers create "achievement-flavored countdown" violating refuse #8 |
| **D-A5** | Wave 1 scope | ✅ **CatatOrder ID exclusive (Indonesian Phase 1 launch)** | User confirmed. Tokoflow MY = Wave 2 brand fork via `EXPO_PUBLIC_BRAND=tokoflow` after CatatOrder validates architecture |

### Carry-over open questions (defer to per-phase decisions)

- Phase 0 validation interviews — **recommend SKIP** given CatatOrder v4.6 has PMF signal (76 migrations + paying users + community shipped); replace with telemetry-driven validation post-Phase A
- Existing user data backfill — **live, batched** (no maintenance window): backfill in Phase A migration 080 with `INSERT INTO diary_entries SELECT ... FROM orders LIMIT 1000 OFFSET ...` chunks
- EAS profiles per brand — **defer** to Wave 2 prep (Q4 2026); Wave 1 single profile

---

## 1. Phase A — Backend schema foundation (Week 1-2)

### A.1 Migration 077 — `diary_entries` super-table

`catatorder-web/supabase/migrations/077_diary_entries.sql`:

```sql
-- Migration 077: diary_entries super-table (cycle 28 §2)
-- Canonical truth for all entries (orders, payments, corrections)
-- Materialized views (orders, customers, payments) derive from this

CREATE TABLE diary_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  kind            TEXT NOT NULL CHECK (kind IN (
    'voice', 'text', 'image', 'forwarded_audio',
    'payment_notification', 'manual_share', 'order_legacy'
  )),
  source_input    TEXT NOT NULL,
  raw_payload     JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Transcription + extraction
  transcript      TEXT,
  language_detected TEXT,
  extracted_json  JSONB,
  extract_confidence NUMERIC,

  -- Reconciliation (cycle 28 §1.2 + §1.4)
  match_confidence NUMERIC,
  composite_confidence NUMERIC GENERATED ALWAYS AS (
    LEAST(COALESCE(extract_confidence, 1.0), COALESCE(match_confidence, 1.0))
  ) STORED,
  matched_entry_id UUID REFERENCES diary_entries(id),
  cascade_role    TEXT CHECK (cascade_role IN ('original', 'correction', 'auto_link')) DEFAULT 'original',

  -- Lifecycle
  device_offline_when_captured BOOLEAN DEFAULT FALSE,
  llm_processed_at TIMESTAMPTZ,
  signature_fired_at TIMESTAMPTZ,
  signature_role  TEXT CHECK (signature_role IN ('full', 'shortened', 'silent', 'batch_summary', 'reduced')),
  user_corrections JSONB DEFAULT '[]'::jsonb,
  undo_window_ends_at TIMESTAMPTZ,
  undone_at       TIMESTAMPTZ,

  -- Status
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'pending_match', 'matched', 'rejected_not_mine', 'archived_low_conf', 'undone'
  )),

  -- Bridge to legacy (transitional during 30-60d coexist period)
  legacy_order_id UUID,  -- references orders(id) when this entry created the order; null when diary was written first

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- RLS: same pattern as orders/customers
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own diary entries" ON diary_entries
  FOR ALL USING (auth.uid() = user_id);

-- updated_at trigger
CREATE TRIGGER diary_entries_updated_at
  BEFORE UPDATE ON diary_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE diary_entries IS 'Cycle 28 §2 canonical super-table. Orders, payments, corrections all unified here. Materialized views derive.';
COMMENT ON COLUMN diary_entries.composite_confidence IS 'Cycle 28 §1.2: min(extract_confidence, match_confidence). UI chip color reflects this.';
COMMENT ON COLUMN diary_entries.legacy_order_id IS 'Bridge column. NULL = diary-first; non-null = order-first (legacy path during coexist).';
```

### A.2 Migration 078 — Indices

`catatorder-web/supabase/migrations/078_diary_entries_indices.sql`:

```sql
-- Migration 078: diary_entries indices for feed queries + reconciliation

CREATE INDEX idx_diary_user_created ON diary_entries (user_id, created_at DESC);
CREATE INDEX idx_diary_kind ON diary_entries (user_id, kind, created_at DESC);
CREATE INDEX idx_diary_matched ON diary_entries (matched_entry_id) WHERE matched_entry_id IS NOT NULL;
CREATE INDEX idx_diary_pending_match ON diary_entries (user_id, kind, created_at)
  WHERE kind = 'payment_notification' AND status = 'pending_match';
CREATE INDEX idx_diary_legacy_order ON diary_entries (legacy_order_id) WHERE legacy_order_id IS NOT NULL;
CREATE INDEX idx_diary_status_open ON diary_entries (user_id, status, created_at DESC) WHERE status = 'open';

-- Confidence-based filter for chip rendering
CREATE INDEX idx_diary_low_confidence ON diary_entries (user_id, created_at DESC)
  WHERE composite_confidence < 0.85;
```

### A.3 Migration 079 — Materialized views (read path)

**Decision:** use **table-as-MV** pattern (NOT Postgres materialized views) because Supabase Realtime doesn't replicate true MVs. Instead, use views OR keep existing `orders`/`customers`/`products` tables and write to BOTH during coexist.

`catatorder-web/supabase/migrations/079_diary_views.sql`:

```sql
-- Migration 079: read-side views over diary_entries
-- Strategy: SQL views (live, no refresh needed). Coexist with existing tables 30-60d.

-- Diary-derived orders view (when diary is canonical source)
CREATE OR REPLACE VIEW diary_orders AS
SELECT
  d.id,
  d.user_id,
  d.extracted_json->>'order_number'        AS order_number,
  d.extracted_json->>'customer_name'        AS customer_name,
  d.extracted_json->>'customer_phone'       AS customer_phone,
  d.extracted_json->'items'                 AS items,
  (d.extracted_json->>'subtotal')::numeric  AS subtotal,
  (d.extracted_json->>'discount')::numeric  AS discount,
  (d.extracted_json->>'total')::numeric     AS total,
  (d.extracted_json->>'paid_amount')::numeric AS paid_amount,
  (d.extracted_json->>'unique_code')::int   AS unique_code,
  d.extracted_json->>'notes'                 AS notes,
  d.extracted_json->>'delivery_date'         AS delivery_date,
  (d.extracted_json->>'is_preorder')::boolean AS is_preorder,
  d.extracted_json->>'status'                AS status,
  d.composite_confidence                     AS confidence,
  d.legacy_order_id,
  d.created_at,
  d.updated_at
FROM diary_entries d
WHERE d.kind IN ('voice', 'forwarded_audio', 'text', 'image', 'order_legacy')
  AND d.extracted_json ? 'items'
  AND d.undone_at IS NULL
  AND d.cascade_role <> 'correction';

-- During coexist: orders table remains source of truth for /api/orders consumers
-- Post-coexist: switch /api/orders to use diary_orders view
COMMENT ON VIEW diary_orders IS 'Coexist period read view. Will become primary source for /api/orders post-deprecation (migration 082).';

-- Diary-derived payments (Path 6 future, Wave 1.1)
CREATE OR REPLACE VIEW diary_payments AS
SELECT
  d.id,
  d.user_id,
  (d.raw_payload->>'amount')::numeric       AS amount,
  d.raw_payload->>'currency'                 AS currency,
  d.raw_payload->>'sender_raw'               AS sender_raw,
  d.raw_payload->>'method'                   AS method,
  d.raw_payload->>'reference'                AS reference,
  d.matched_entry_id                         AS matched_diary_id,
  d.match_confidence,
  d.status,
  d.created_at
FROM diary_entries d
WHERE d.kind = 'payment_notification'
  AND d.undone_at IS NULL;
```

### A.4 Migration 080 — Backfill from existing tables

`catatorder-web/supabase/migrations/080_diary_backfill.sql`:

```sql
-- Migration 080: backfill diary_entries from existing orders
-- Idempotent: ON CONFLICT DO NOTHING; uses legacy_order_id as dedup key

-- Backfill in batches via function (avoid lock contention; safe for live-running prod)
CREATE OR REPLACE FUNCTION backfill_diary_entries(batch_size INT DEFAULT 500, max_iterations INT DEFAULT 100)
RETURNS TABLE(rows_inserted INT, batches_run INT) AS $$
DECLARE
  total_inserted INT := 0;
  iter INT := 0;
  this_batch INT;
BEGIN
  WHILE iter < max_iterations LOOP
    INSERT INTO diary_entries (
      id, user_id, kind, source_input, raw_payload,
      extracted_json, extract_confidence,
      cascade_role, status, legacy_order_id,
      created_at, updated_at
    )
    SELECT
      gen_random_uuid(),
      o.user_id,
      'order_legacy',
      COALESCE(o.source, 'manual'),
      jsonb_build_object('legacy_order_number', o.order_number),
      jsonb_build_object(
        'order_number', o.order_number,
        'customer_name', o.customer_name,
        'customer_phone', o.customer_phone,
        'items', o.items,
        'subtotal', o.subtotal,
        'discount', o.discount,
        'total', o.total,
        'paid_amount', o.paid_amount,
        'unique_code', o.unique_code,
        'notes', o.notes,
        'delivery_date', o.delivery_date,
        'is_preorder', o.is_preorder,
        'status', o.status
      ),
      1.0,                          -- legacy orders treated as fully confident (manually verified by merchant)
      'original',
      'matched',
      o.id,
      o.created_at,
      o.updated_at
    FROM orders o
    LEFT JOIN diary_entries d ON d.legacy_order_id = o.id
    WHERE d.id IS NULL
    LIMIT batch_size;

    GET DIAGNOSTICS this_batch = ROW_COUNT;
    total_inserted := total_inserted + this_batch;
    iter := iter + 1;

    EXIT WHEN this_batch = 0;
  END LOOP;

  RETURN QUERY SELECT total_inserted, iter;
END;
$$ LANGUAGE plpgsql;

-- Run initial backfill — admin runs manually in pgAdmin or via /api/admin/migrate
-- SELECT * FROM backfill_diary_entries(500, 1000);
COMMENT ON FUNCTION backfill_diary_entries IS 'Idempotent backfill function. Run manually via Supabase SQL editor or admin script.';
```

**Backfill cost estimate:** assuming 50 paying users × avg 200 historical orders = ~10,000 rows. Each row insert ~5ms in batches of 500 = ~50s wall-clock total. **No maintenance window needed.**

### A.5 API endpoint — `/api/diary/entries` POST + GET

`catatorder-web/app/api/diary/entries/route.ts` (NEW):

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { computeCompositeConfidence } from "@/lib/services/diary.service";

// POST — create new diary_entry (canonical write path)
export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    kind, source_input, raw_payload,
    transcript, language_detected,
    extracted_json, extract_confidence,
    device_offline_when_captured
  } = body;

  // Validation
  if (!kind || !source_input) {
    return NextResponse.json({ error: "kind + source_input required" }, { status: 400 });
  }

  // Server-side quota check (same gate as /api/orders)
  const { data: hasQuota } = await supabase.rpc("check_order_limit", { p_user_id: user.id });
  if (hasQuota === false) {
    return NextResponse.json({ error: "Quota exceeded", code: "QUOTA_EXCEEDED" }, { status: 402 });
  }

  // Insert diary_entry
  const { data, error } = await supabase
    .from("diary_entries")
    .insert({
      user_id: user.id,
      kind, source_input, raw_payload: raw_payload || {},
      transcript, language_detected,
      extracted_json, extract_confidence,
      device_offline_when_captured: !!device_offline_when_captured,
      undo_window_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()  // 7d for money-bearing per cycle 28 §10
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to insert", details: error.message }, { status: 500 });
  }

  // If this looks like an order, ALSO create legacy order row for coexist (Phase A only)
  if (kind === 'voice' || kind === 'text' || kind === 'image' || kind === 'forwarded_audio') {
    const ej = extracted_json || {};
    if (ej.items && Array.isArray(ej.items) && ej.items.length > 0) {
      // Reuse existing order creation by calling internal /api/orders POST
      // (preserves customer auto-create, unique_code, payment status derivation, quota increment)
      const orderRes = await fetch(`${request.nextUrl.origin}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: request.headers.get("Authorization") || "" },
        body: JSON.stringify({
          items: ej.items,
          customer_name: ej.customer_name,
          customer_phone: ej.customer_phone,
          notes: ej.notes,
          discount: ej.discount,
          payment_status: ej.payment_status,
          delivery_date: ej.delivery_date,
          source: source_input
        })
      });
      const order = await orderRes.json();
      if (order?.id) {
        await supabase
          .from("diary_entries")
          .update({ legacy_order_id: order.id, status: 'matched' })
          .eq("id", data.id);
      }
    }
  }

  return NextResponse.json(data, { status: 201 });
}

// GET — feed query for Cerita tab
export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const since = searchParams.get("since"); // ISO date for incremental
  const kind = searchParams.get("kind");

  let q = supabase
    .from("diary_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (since) q = q.gt("created_at", since);
  if (kind) q = q.eq("kind", kind);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
```

### A.6 Service layer

`catatorder-web/lib/services/diary.service.ts` (NEW):

```typescript
export function computeCompositeConfidence(
  extractConfidence: number | null | undefined,
  matchConfidence: number | null | undefined
): number {
  return Math.min(extractConfidence ?? 1.0, matchConfidence ?? 1.0);
}

export function determineSignatureRole(
  windowEvents: Array<{ at: number; role: string }>,
  isFirstOfDay: boolean,
  isMoneyBearing: boolean,
  reduceMotion: boolean
): 'full' | 'shortened' | 'silent' | 'batch_summary' | 'reduced' {
  if (reduceMotion) return 'reduced';
  if (isFirstOfDay) return 'full';

  const cutoff = Date.now() - 5 * 60 * 1000;
  const recent = windowEvents.filter(e => e.at > cutoff);

  if (recent.length === 0) return 'full';
  if (recent.length === 1) return 'shortened';
  if (recent.length >= 2) return isMoneyBearing ? 'reduced' : 'silent';
  return 'silent';
}

export function shouldFireHaptic(lastHapticAt: number, gapMs: number = 250): boolean {
  return Date.now() - lastHapticAt >= gapMs;
}

// Honorific-strip preprocessing (cycle 28 §9)
export function normalizeCustomerName(name: string): string {
  const honorifics = /^(?:bu|pak|ibu|bapak|mbak|mas|kak|bang|mba|kang|teh|aa|neng|mbah)\s+/i;
  return name.replace(honorifics, '').trim();
}

// Self-reference disambig (cycle 28 §9) — fires force-yellow chip
export function isSelfReference(extractedName: string, profileName: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const a = norm(normalizeCustomerName(extractedName));
  const b = norm(normalizeCustomerName(profileName));
  if (a === b) return true;
  // Levenshtein-1 check (Sari ↔ Saridah)
  if (Math.abs(a.length - b.length) <= 1) {
    let diffs = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] !== b[i]) diffs++;
      if (diffs > 1) return false;
    }
    return diffs <= 1;
  }
  return false;
}
```

### A.7 Update `/api/voice/parse` to return confidence

Modify `catatorder-web/app/api/voice/parse/route.ts`:

- Update systemPrompt to instruct LLM to return `confidence_per_field` (per cycle 25 §C)
- Update mapper to include `extract_confidence` (lowest of per-field confidences)
- Update mapper to add `language_detected` field

```typescript
// Add to systemPrompt:
// 13. Tambahkan untuk setiap field penilaian confidence 0..1 berdasarkan kepastian transcript.
//     {
//       "items": [...],
//       ...
//       "confidence_per_field": {
//         "items": 0.9,
//         "customer_name": 0.7,
//         "customer_phone": 0.95,
//         "delivery_date": 0.8,
//         ...
//       },
//       "language_detected": "id" | "id_bandung" | "id_jakarta" | "mixed"
//     }

// Update mapper (around line 130):
const confidences = parsed.confidence_per_field || {};
result.extract_confidence = Math.min(
  confidences.items ?? 1.0,
  confidences.customer_name ?? 1.0,
  confidences.customer_phone ?? 1.0,
  confidences.delivery_date ?? 1.0
);
result.language_detected = parsed.language_detected || 'id';
```

### A.8 Reconciliation engine

`catatorder-web/app/api/diary/reconcile/route.ts` (NEW):

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// POST — second-pass reconciliation per cycle 28 §1.4
// Triggered by: cron every 60s OR /api/diary/entries POST that just finished extraction
export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find all pending payment_notifications < 60min old
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: pendingPayments } = await supabase
    .from("diary_entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("kind", "payment_notification")
    .eq("status", "pending_match")
    .gte("created_at", cutoff);

  if (!pendingPayments?.length) return NextResponse.json({ matched: 0 });

  let matchedCount = 0;
  for (const payment of pendingPayments) {
    const amount = parseFloat(payment.raw_payload?.amount || '0');
    const senderRaw = payment.raw_payload?.sender_raw || '';

    // Find candidate orders within 48h with matching amount
    const { data: candidates } = await supabase
      .from("orders")
      .select("id, customer_name, total, created_at, status")
      .eq("user_id", user.id)
      .eq("total", amount)
      .gte("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .eq("payment_status", "unpaid");

    if (!candidates?.length) continue;

    // Score each candidate
    let bestScore = 0;
    let bestCandidate = null;
    for (const c of candidates) {
      const amountScore = 0.5;  // exact amount = 0.5
      const nameScore = computeNameScore(senderRaw, c.customer_name || '');
      const recencyScore = (Date.now() - new Date(c.created_at).getTime()) < 30 * 60 * 1000 ? 0.2 : 0;
      const score = amountScore + nameScore + recencyScore;
      if (score > bestScore) { bestScore = score; bestCandidate = c; }
    }

    // Cycle 28 §1.3: money-bearing threshold 0.92
    if (bestCandidate && bestScore >= 0.92) {
      await supabase.from("diary_entries").update({
        matched_entry_id: bestCandidate.id,
        match_confidence: bestScore,
        status: "matched"
      }).eq("id", payment.id);
      // Also mark order paid
      await supabase.from("orders").update({
        paid_amount: amount,
        payment_status: "paid",
        payment_claimed_at: new Date().toISOString()
      }).eq("id", bestCandidate.id);
      matchedCount++;
    }
  }

  return NextResponse.json({ matched: matchedCount });
}

function computeNameScore(senderRaw: string, customerName: string): number {
  if (!senderRaw || !customerName) return 0;
  const honorifics = /^(?:bu|pak|ibu|bapak|mbak|mas|kak|bang|mba|kang|teh|aa|neng|mbah)\s+/i;
  const a = senderRaw.toLowerCase().replace(honorifics, '').trim();
  const b = customerName.toLowerCase().replace(honorifics, '').trim();
  if (a === b) return 0.4;  // exact match (after honorific strip)
  // Token-first-name match: "LIM CHEE KEONG" matches "Pak Lim"
  const aFirst = a.split(/\s+/)[0];
  const bFirst = b.split(/\s+/)[0];
  if (aFirst === bFirst && aFirst.length >= 3) return 0.3;
  // Levenshtein-2 fallback
  if (levenshtein(a, b) <= 2) return 0.2;
  return 0;
}

function levenshtein(a: string, b: string): number { /* standard impl */ }
```

### A.9 Phase A pass criteria

- [ ] Migrations 077-080 applied to staging
- [ ] `/api/diary/entries` POST round-trips: voice → diary_entries + legacy order
- [ ] `/api/diary/entries` GET returns last 50 entries
- [ ] `/api/diary/reconcile` finds pending matches and links them
- [ ] `/api/voice/parse` v2 returns confidence + language fields
- [ ] Backfill function inserts ≥10K rows in <60s on staging
- [ ] Existing `/api/orders` GET unchanged behavior (no v1.0.0 user impact)
- [ ] Telemetry: ≥95% of new orders have a corresponding diary_entries row

---

## 2. Phase B — Mobile schema bridge (Week 3)

### B.1 Dependencies

`catatorder-app/package.json` add:

```json
{
  "dependencies": {
    "drizzle-orm": "^0.39.0",
    "expo-sqlite": "~15.0.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30.0"
  }
}
```

(Keep existing TanStack Query for server state — orthogonal to local Drizzle).

### B.2 Drizzle schema mirror

`catatorder-app/src/db/schema.ts` (NEW):

```typescript
import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

export const diaryEntries = sqliteTable("diary_entries", {
  id: text("id").primaryKey(),  // UUID
  userId: text("user_id").notNull(),
  kind: text("kind").notNull(),
  sourceInput: text("source_input").notNull(),
  rawPayload: text("raw_payload").notNull().default("{}"),  // JSON stringified
  transcript: text("transcript"),
  languageDetected: text("language_detected"),
  extractedJson: text("extracted_json"),  // JSON stringified
  extractConfidence: real("extract_confidence"),
  matchConfidence: real("match_confidence"),
  compositeConfidence: real("composite_confidence"),  // computed client-side; mirror server
  matchedEntryId: text("matched_entry_id"),
  cascadeRole: text("cascade_role").default("original"),
  deviceOfflineWhenCaptured: integer("device_offline_when_captured", { mode: "boolean" }).default(false),
  llmProcessedAt: text("llm_processed_at"),
  signatureFiredAt: text("signature_fired_at"),
  signatureRole: text("signature_role"),
  userCorrections: text("user_corrections").default("[]"),
  undoWindowEndsAt: text("undo_window_ends_at"),
  undoneAt: text("undone_at"),
  status: text("status").notNull().default("open"),
  legacyOrderId: text("legacy_order_id"),
  syncedToServer: integer("synced_to_server", { mode: "boolean" }).default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => ({
  userCreatedIdx: index("diary_user_created_idx").on(table.userId, table.createdAt),
  syncIdx: index("diary_sync_idx").on(table.syncedToServer, table.createdAt),
}));

export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type NewDiaryEntry = typeof diaryEntries.$inferInsert;
```

### B.3 SQLite client + bootstrap

`catatorder-app/src/db/client.ts` (NEW):

```typescript
import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "./migrations/_journal.json";  // generated by drizzle-kit
import * as schema from "./schema";

export const sqlite = SQLite.openDatabaseSync("catatorder.db", {
  enableChangeListener: true,
});

// Enforce WAL + autocheckpoint per cycle 33 sev-8 #29
sqlite.execSync("PRAGMA journal_mode = WAL;");
sqlite.execSync("PRAGMA wal_autocheckpoint = 100;");
sqlite.execSync("PRAGMA synchronous = NORMAL;");

export const db = drizzle(sqlite, { schema });

// Run migrations on app boot
export async function runMigrations() {
  await migrate(db, migrations);
}
```

### B.4 Mobile API hooks

`catatorder-app/src/api/diary.ts` (NEW):

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eq, desc } from "drizzle-orm";
import { api } from "./client";
import { db } from "@/db/client";
import { diaryEntries, type DiaryEntry, type NewDiaryEntry } from "@/db/schema";
import { useEffect } from "react";

const keys = {
  all: ["diary"] as const,
  list: (since?: string) => [...keys.all, "list", since] as const,
  detail: (id: string) => [...keys.all, "detail", id] as const,
};

// Local-first read: SQLite primary; sync from server in background
export function useDiaryFeed(limit = 50) {
  return useQuery({
    queryKey: keys.list(),
    queryFn: async () => {
      const rows = await db
        .select()
        .from(diaryEntries)
        .orderBy(desc(diaryEntries.createdAt))
        .limit(limit);
      return rows;
    },
    staleTime: 0,  // always re-query SQLite
  });
}

// Background sync from server (every 30s when app foreground)
export function useDiarySync() {
  const queryClient = useQueryClient();
  useEffect(() => {
    let alive = true;
    const sync = async () => {
      if (!alive) return;
      try {
        const lastSync = await getLastSyncTime();  // localStorage helper
        const remote = await api<DiaryEntry[]>(`/api/diary/entries?since=${lastSync || ''}&limit=100`);
        if (remote && remote.length) {
          for (const entry of remote) {
            await db.insert(diaryEntries).values(entryFromServer(entry)).onConflictDoUpdate({
              target: diaryEntries.id,
              set: entryFromServer(entry),
            });
          }
          await setLastSyncTime(new Date().toISOString());
          queryClient.invalidateQueries({ queryKey: keys.all });
        }
      } catch (e) {
        // Silent fail — offline-first
      }
    };

    sync();  // immediate on mount
    const interval = setInterval(sync, 30000);
    return () => { alive = false; clearInterval(interval); };
  }, []);
}

// Create — write local-first, queue for server sync
export function useCreateDiaryEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<NewDiaryEntry, 'id' | 'createdAt' | 'updatedAt' | 'syncedToServer'>) => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const entry: NewDiaryEntry = { ...input, id, createdAt: now, updatedAt: now, syncedToServer: false };
      await db.insert(diaryEntries).values(entry);

      // Server sync (best-effort)
      try {
        await api(`/api/diary/entries`, { method: "POST", body: JSON.stringify(entry) });
        await db.update(diaryEntries).set({ syncedToServer: true }).where(eq(diaryEntries.id, id));
      } catch {
        // Will retry on next sync cycle
      }

      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
    },
  });
}

function entryFromServer(serverEntry: any): NewDiaryEntry {
  return {
    ...serverEntry,
    rawPayload: typeof serverEntry.raw_payload === 'object' ? JSON.stringify(serverEntry.raw_payload) : serverEntry.raw_payload,
    extractedJson: typeof serverEntry.extracted_json === 'object' ? JSON.stringify(serverEntry.extracted_json) : serverEntry.extracted_json,
    syncedToServer: true,
  };
}
```

### B.5 Phase B pass criteria

- [ ] `expo-sqlite` + Drizzle compiles with Metro
- [ ] Local SQLite migration runs on boot
- [ ] `useDiaryFeed()` returns local rows
- [ ] `useDiarySync()` pulls server diary into local DB
- [ ] `useCreateDiaryEntry()` writes local + syncs to server
- [ ] Round-trip: voice capture → diary_entries local → server `/api/diary/entries` → materialized via legacy order → existing `useOrders()` shows it

---

## 3. Phase C — Voice path 1 (Week 4-5)

### C.1 Install dependencies

```bash
cd catatorder-app
pnpm add @react-native-voice/voice
```

`app.json` add permission strings:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSMicrophoneUsageDescription": "CatatOrder mendengar voice note pesananmu untuk dicatat ke diary. Suara tetap di hp kamu (atau dikirim ke Google/Apple untuk transkrip dengan persetujuanmu).",
        "NSSpeechRecognitionUsageDescription": "CatatOrder pakai Apple Speech Recognition untuk mengubah suara jadi teks pesanan."
      }
    },
    "android": {
      "permissions": ["RECORD_AUDIO", "INTERNET"]
    }
  }
}
```

### C.2 VoiceOrderSheet rewrite

`catatorder-app/src/components/VoiceOrderSheet.tsx` (rewrite):

- Remove the try/catch require pattern (lines 14-27); import directly
- After STT finishes, call `useCreateDiaryEntry({ kind: 'voice', source_input: 'voice_recording', transcript, extracted_json, ... })`
- Add ConfidenceChip rendering based on `composite_confidence`
- Optimistic transcript chip "aku denger..." 3-7s while LLM extract running

### C.3 ConfidenceChip component

`catatorder-app/src/components/ConfidenceChip.tsx` (NEW):

```typescript
import { View, Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { useState, useEffect } from "react";

type Props = {
  confidence: number;
  isMoneyBearing?: boolean;
  isSimilarNamesTrap?: boolean;
  onTap?: () => void;
};

export function ConfidenceChip({ confidence, isMoneyBearing, isSimilarNamesTrap, onTap }: Props) {
  const [visible, setVisible] = useState(true);
  const moneyThreshold = isMoneyBearing ? 0.92 : 0.85;
  const peekDuration = isSimilarNamesTrap ? 5000 : 2000;

  let color: 'green' | 'yellow' | 'red';
  let glyph: string;
  if (confidence >= moneyThreshold) { color = 'green'; glyph = '✓'; }
  else if (confidence >= 0.6) { color = 'yellow'; glyph = '?'; }
  else { color = 'red'; glyph = '⚠'; }

  // Auto-dismiss yellow chip after peek (cycle 28 §1.8)
  useEffect(() => {
    if (color === 'yellow') {
      const t = setTimeout(() => setVisible(false), peekDuration);
      return () => clearTimeout(t);
    }
  }, [color, peekDuration]);

  if (!visible) return null;

  const bg = color === 'green' ? '#dcfce7' : color === 'yellow' ? '#fef3c7' : '#fee2e2';
  const fg = color === 'green' ? '#15803d' : color === 'yellow' ? '#92400e' : '#991b1b';

  return (
    <Pressable onPress={() => { onTap?.(); Haptics.selectionAsync(); }}>
      <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row' }}>
        <Text style={{ color: fg, fontSize: 12 }}>{glyph}</Text>
      </View>
    </Pressable>
  );
}
```

### C.4 Phase C pass criteria

- [ ] Voice button records on iOS + Android
- [ ] Indonesian transcript appears within 3-7s
- [ ] LLM extract returns confidence per field
- [ ] Composite confidence renders chip color correctly
- [ ] Yellow chip auto-dismisses after 2s (5s for similar-names trap)
- [ ] Red chip persists with disambiguation card
- [ ] Voice → diary_entries → existing orders list shows entry

---

## 4. Phase D — Sensory signature (Week 6)

### D.1 Window state

`catatorder-app/src/lib/sensory/window.ts` (NEW):

```typescript
import { create } from "zustand";

type SignatureRole = "full" | "shortened" | "silent" | "batch_summary" | "reduced";
type Event = { at: number; role: SignatureRole; isMoney: boolean };

interface WindowState {
  events: Event[];
  lastFullSignatureDate: string | null;
  lastHapticAt: number;
  recordEvent: (role: SignatureRole, isMoney: boolean) => void;
  determineRole: (isMoney: boolean, reduceMotion: boolean) => SignatureRole;
  canFireHaptic: () => boolean;
  markHapticFired: () => void;
}

export const useSensoryWindow = create<WindowState>((set, get) => ({
  events: [],
  lastFullSignatureDate: null,
  lastHapticAt: 0,

  recordEvent(role, isMoney) {
    set(s => ({ events: [...s.events.filter(e => Date.now() - e.at < 5 * 60 * 1000), { at: Date.now(), role, isMoney }] }));
  },

  determineRole(isMoney, reduceMotion) {
    if (reduceMotion) return "reduced";

    // First-of-day rule (cycle 28 §1.5.1)
    const today = new Date().toISOString().slice(0, 10);
    if (get().lastFullSignatureDate !== today) {
      set({ lastFullSignatureDate: today });
      return "full";
    }

    // Decay envelope
    const cutoff = Date.now() - 5 * 60 * 1000;
    const recent = get().events.filter(e => e.at > cutoff);
    if (recent.length === 0) return "full";
    if (recent.length === 1) return "shortened";
    if (recent.length >= 2) return isMoney ? "reduced" : "silent";
    return "silent";
  },

  canFireHaptic() {
    return Date.now() - get().lastHapticAt >= 250;  // MIN_HAPTIC_GAP_MS
  },

  markHapticFired() {
    set({ lastHapticAt: Date.now() });
  }
}));
```

### D.2 Fire orchestration

`catatorder-app/src/lib/sensory/fire.ts` (NEW):

```typescript
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";  // expo-audio when SDK 54+
import { Vibration, AccessibilityInfo } from "react-native";
import { useSensoryWindow } from "./window";

let chimeSound: Audio.Sound | null = null;

export async function preloadChime() {
  const { sound } = await Audio.Sound.createAsync(require("@/assets/audio/chime.mp3"));
  chimeSound = sound;
}

export async function fireSensorySignature(opts: {
  isMoney?: boolean;
  visualTrigger?: () => void;  // Reanimated UI thread trigger
}) {
  const { isMoney = false, visualTrigger } = opts;
  const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
  const win = useSensoryWindow.getState();
  const role = win.determineRole(isMoney, reduceMotion);

  if (role === "silent") {
    win.recordEvent(role, isMoney);
    return;
  }

  // Visual
  if (role !== "reduced") {
    visualTrigger?.();  // 1.5s arc for full, 0.6s for shortened
  } else {
    visualTrigger?.();  // color flash only — handled in component
  }

  // Audio (skip for shortened/reduced/batch_summary in window)
  if ((role === "full" || role === "batch_summary") && chimeSound) {
    try { await chimeSound.replayAsync(); } catch {}
  }

  // Haptic
  if (win.canFireHaptic()) {
    try {
      if (role === "full") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (role === "shortened") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (role === "batch_summary") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (role === "reduced") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      win.markHapticFired();
    } catch {}
  }

  win.recordEvent(role, isMoney);
}
```

### D.3 Audio asset

`catatorder-app/assets/audio/chime.mp3` (NEW) — 256ms soft chime, AAC 96kbps, mono, 16kHz. Use a plain pleasant bell tone (not gamification fanfare per refuse #8).

### D.4 Phase D pass criteria

- [ ] First voice capture of day fires full ceremony
- [ ] 2nd capture within 5min fires shortened
- [ ] 3rd capture fires silent (or reduced for money)
- [ ] MIN_HAPTIC_GAP=250ms prevents rapid haptic merge
- [ ] Reduce Motion accessibility honored
- [ ] Drift bench on Redmi Note 12: <80ms

---

## 5. Phase E — Cerita tab + Now pin (Week 9-11)

### E.1 New tab in layout

`catatorder-app/app/(tabs)/_layout.tsx` modify:

- Add 6th tab "Cerita" with feather icon "book-open"
- Default route for fresh installs (check via `AsyncStorage.getItem('hasOnboarded')`)
- Existing v1.0.0 users: keep "index" (Pesanan) as initial; show one-time tooltip on Cerita tab

### E.2 Cerita screen

`catatorder-app/app/(tabs)/cerita.tsx` (NEW):

```typescript
import { View, Text } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useDiaryFeed, useDiarySync } from "@/api/diary";
import { NowPin } from "@/components/feed/NowPin";
import { FilterChips } from "@/components/feed/FilterChips";
import { DiaryEntryCard } from "@/components/feed/DiaryEntryCard";
import { TimeSection } from "@/components/feed/TimeSection";
import { useState, useMemo } from "react";

export default function CeritaScreen() {
  useDiarySync();  // background sync
  const { data: entries = [] } = useDiaryFeed(200);
  const [filter, setFilter] = useState<'all' | 'orders' | 'payments' | 'customers'>('all');

  const grouped = useMemo(() => groupByTimeSection(entries, filter), [entries, filter]);

  return (
    <View className="flex-1 bg-warm-bg">
      <NowPin entries={entries} />
      <FilterChips selected={filter} onChange={setFilter} />
      <FlashList
        data={grouped}
        renderItem={({ item }) => item.type === 'section' ? <TimeSection {...item} /> : <DiaryEntryCard entry={item.entry} />}
        estimatedItemSize={80}
        keyExtractor={(item, i) => `${item.type}-${i}`}
      />
    </View>
  );
}

function groupByTimeSection(entries, filter) {
  // Filter
  let filtered = entries;
  if (filter === 'orders') filtered = entries.filter(e => ['voice', 'text', 'image', 'forwarded_audio'].includes(e.kind));
  if (filter === 'payments') filtered = entries.filter(e => e.kind === 'payment_notification');
  if (filter === 'customers') filtered = entries.filter(e => e.extractedJson && JSON.parse(e.extractedJson).customer_name);

  // Group: Now (sticky pinned), Hari ini, Lebih lama
  const now: any[] = [];
  const today: any[] = [];
  const earlier: any[] = [];
  const todayStart = new Date().setHours(0, 0, 0, 0);
  for (const e of filtered) {
    const t = new Date(e.createdAt).getTime();
    if (e.status === 'pending_match' || e.status === 'open' && t > Date.now() - 30 * 60 * 1000) now.push(e);
    else if (t > todayStart) today.push(e);
    else earlier.push(e);
  }
  return [
    { type: 'section', title: 'Hari ini', entries: today },
    { type: 'section', title: 'Lebih lama', entries: earlier, collapsed: true },
  ].filter(s => s.entries.length > 0).flatMap(s => [s, ...s.entries.map(e => ({ type: 'entry', entry: e }))]);
}
```

### E.3 Components

```
catatorder-app/src/components/feed/
├── NowPin.tsx              # sticky pending claim cards + in-flight transcripts
├── FilterChips.tsx         # All/Orders/Payments/Customers
├── DiaryEntryCard.tsx      # individual row with ConfidenceChip
└── TimeSection.tsx         # Hari ini / Lebih lama collapsible
```

(Each ~100-150 lines; details deferred to cycle 040 implementation cycle.)

### E.4 Phase E pass criteria

- [ ] Cerita tab renders feed with Now pin + filter chips + sections
- [ ] Tap on Now-pin entry: inline action (claim/mark-paid)
- [ ] Long-press: edit
- [ ] Existing 5 tabs unchanged
- [ ] FlashList v2 60fps on Redmi Note 12 with 200 entries
- [ ] One-time tooltip for v1.0.0 users on first Cerita tab open

---

## 6. Phase F — Payment paths 4+5 (Week 12-13)

### F.1 Path 4 — WA screenshot Share Extension (existing PhotoOrderSheet enhanced)

Currently catatorder-app has `PhotoOrderSheet` (camera/library upload). To add iOS Share Sheet integration:

```bash
pnpm add expo-share-extension
```

Configure in `app.json`:

```json
{
  "expo": {
    "plugins": [
      ["expo-share-extension", {
        "iosShareView": "native-swiftui",  // not RN; cycle 33 iOS sev-9 #13
        "supportedTypes": ["image", "audio"]
      }]
    ]
  }
}
```

iOS: extension writes shared file URI to App Group (`group.id.catatorder.shared`); main app picks up on next launch.

Android: add intent-filter to `app.json` `android.intentFilters` for `image/*` and `audio/ogg`, `audio/opus`.

### F.2 Path 5 — Forwarded WA voice (.opus)

```bash
pnpm add react-native-audio-api
```

Pipeline: Share Extension receives .opus URI → main app on launch reads URI → `react-native-audio-api` decodes opus to PCM → feed to STT (same path as Path 1) → diary_entries.

### F.3 Backend reconciliation

The `/api/diary/reconcile` endpoint from Phase A.8 handles match. Mobile triggers:
- On every diary_entries POST that has `kind=payment_notification`
- On every diary_entries POST with extracted_json + items (orders that may match a queued payment)

### F.4 Phase F pass criteria

- [ ] Long-press WA screenshot → Share → CatatOrder → image OCR → diary_entries
- [ ] Long-press WA voice note → Share → CatatOrder → opus decode → STT → diary_entries
- [ ] Reconciliation engine matches payment to order with composite ≥ 0.92 → auto-link
- [ ] < 0.92 → claim card on Now pin

---

## 7. Phase G — Boundary contract enforcement (Week 7-8 parallel)

### G.1 ESLint vocab lint

`catatorder-app/.eslintrc.js`:

```javascript
module.exports = {
  rules: {
    'no-restricted-syntax': ['error',
      // Vocab lint adapted for Indonesian — cycle 28 §6 + bahasa
      {
        selector: 'Literal[value=/Whisper|STT|LLM|IDB|optimistic|sync pending|fuzzy match|extract|extraction|background twin|foreground assist|tier (1|2|3)|diary_entries|matched_entry_id|composite_confidence|NotificationListenerService|ActivityKit/i]',
        message: 'Engineering vocabulary cannot ship to user-facing surfaces. Use natural Indonesian via lib/copy/.',
      },
      // Reanimated mandate
      {
        selector: 'ImportDeclaration[source.value="react-native"] > ImportSpecifier[imported.name="Animated"]',
        message: 'Use react-native-reanimated, not the legacy Animated API.',
      },
    ],
  },
};
```

### G.2 Sentry

```bash
pnpm add @sentry/react-native
```

`catatorder-app/src/utils/sentry.ts` (NEW):

```typescript
import * as Sentry from "@sentry/react-native";

export function initSentry() {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    enableSessionReplay: false,  // Wave 1 disabled per refuse #6
    enableAppStartTracking: true,
    beforeSend: (event) => {
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(b => ({
          ...b,
          message: scrubPII(b.message),
          data: scrubPIIObject(b.data),
        }));
      }
      if (event.user) event.user = { id: event.user.id };
      return event;
    },
  });
}

function scrubPII(s?: string): string | undefined {
  if (!s) return s;
  return s
    .replace(/\b\d{8,}\b/g, '[number]')
    .replace(/\bRp\s?\d+(\.\d+)?\b/gi, '[Rp ?]')
    .replace(/[a-zA-Z]+@[a-zA-Z.]+/g, '[email]');
}
```

### G.3 Quota nudge simplification (D-A4)

`catatorder-app/src/utils/quota.ts` rewrite:

```typescript
// BEFORE: returns "soft" | "approaching" | "urgent" | "exhausted" | "none"
// AFTER (cycle 22 anti-anxiety + bible v1.2):
export type NudgeLevel = "none" | "exhausted";

export function getNudgeLevel(ordersUsed: number, limit: number): NudgeLevel {
  return ordersUsed >= limit ? "exhausted" : "none";
}
```

Update `QuotaBanner.tsx` to render only at "exhausted" — no 40/48 banners.

### G.4 Phase G pass criteria

- [ ] ESLint catches vocab violations
- [ ] ESLint blocks new RN `Animated` imports
- [ ] Sentry uploads stack traces without customer data in breadcrumbs
- [ ] No more 40/48 quota banners; only single banner at exhausted

---

## 8. Phase H — Cron job additions (Week 7-8 parallel)

### H.1 Hari Sepi variant in `morning-brief`

`catatorder-web/app/api/cron/morning-brief/route.ts` modify:

```typescript
// Existing: today's orders summary + cost trend alert
// Add: Hari Sepi variant when today_revenue < 0.3 * avg_7d AND avg_7d > 50000

const yesterday7Avg = await get7DayAvgRevenue(profile.id);
const todayRevenue = await getTodayRevenue(profile.id);
const isHariSepi = todayRevenue < 0.3 * yesterday7Avg && yesterday7Avg > 50000;

if (isHariSepi) {
  push({
    title: "Hari ini agak sepi ya",
    body: "Tarik napas dulu. Besok lebih ramai. Aku selalu di sini.",
    // No metrics, no comparison shaming (cycle 22 anti-anxiety)
  });
}
```

### H.2 Anniversary triggers

`catatorder-web/app/api/cron/engagement/route.ts` add:

```typescript
const anniversaryDays = [365, 365 * 3, 365 * 5];
const ageDays = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24));
if (anniversaryDays.includes(ageDays)) {
  const years = Math.floor(ageDays / 365);
  push({
    title: `Selamat ${years} tahun bersama CatatOrder`,
    body: `Aku catat ${profile.lifetime_orders} pesanan untukmu sejauh ini.`,
  });
}
```

### H.3 Customer Returns drip

```typescript
// Find customers with 3+ orders this month who haven't been pinged in 30d
const returns = await supabase
  .from("customers")
  .select("id, name, total_orders")
  .eq("user_id", profile.id)
  .gte("total_orders", 3)
  .eq("ping_drip_30d", false);

for (const c of returns) {
  push({
    title: `${c.name} sudah pesan ${c.total_orders} kali`,
    body: "Pelanggan setia. Senyum dulu sebelum tidur.",
  });
  // Mark drip
  await supabase.from("customers").update({ ping_drip_30d: true, ping_drip_at: new Date() }).eq("id", c.id);
}
```

### H.4 Pre-Ramadan triggers (hard-coded)

```typescript
const ramadanDates = {
  2027: '2027-02-17',  // Ramadan 1 Hijri 1448 (approximate per Indonesian Hisab)
  2028: '2028-02-06',
  2029: '2029-01-26',
  2030: '2030-01-15',
};
const today = new Date();
for (const [year, dateStr] of Object.entries(ramadanDates)) {
  const ramadan = new Date(dateStr);
  const daysBefore = Math.floor((ramadan.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysBefore === 14) {
    push({
      title: "Ramadan 14 hari lagi",
      body: "Stock kue lebaran sudah aman? Ada yang bisa aku bantu siapkan?",
    });
  }
}
```

### H.5 Phase H pass criteria

- [ ] Hari Sepi push fires when today revenue dips below threshold
- [ ] Anniversary push at 1y/3y/5y exact day
- [ ] Customer Returns push fires once per customer per 30d
- [ ] Pre-Ramadan push 14d before Ramadan 2027

---

## 9. Phase I — Wave 1.1 NotificationListener (Week 17-26 post-launch)

This phase only starts AFTER Wave 1 launch + Phase 1 Gate criteria pass. Spec already in cycle 35 MOBILE.md §4.6 + §6.

Key items:
- Custom Expo Module `expo-notification-observer` scaffold (5-7d spike)
- Tiered heartbeat (24h F-tier / 72h Samsung / 7d Pixel)
- Play Store policy declaration submission (4-8wk wall-clock parallel)
- Per-OEM coach-mark deeplinks
- Path 6 wired into reconciliation engine

---

## 10. Phase 0 spikes (ID-specific, before Phase A starts)

| # | Spike | Effort | Why ID-specific |
|---|---|---|---|
| **S1** | `@react-native-voice/voice` Bandung dialect bench (50 utterances) | 2d | A2-α decision — verify accuracy on Sari-style vocab ("aing", "atuh", "weh") |
| **S2** | Phase A backfill memory cost on production-scale data (10K+ orders) | 1d | Idempotent function exists; just measure |
| **S3** | Sensory drift bench on Snapdragon 685 (e.g., Redmi Note 12) | 2d | Confirm <80ms drift acceptable on most-common ID device |
| **S4** | Sentry Indonesian merchant volume cost projection | 0.5d | Get pricing for ~50→500→5K MAU |
| **S5** | Confidence calibration: hand-label 200 voice extracts, fit chip thresholds | 3d | 0.85/0.92 thresholds are Tokoflow-MY-priors; ID may differ |
| **S6** | Existing `/api/orders` POST + `/api/diary/entries` dual-write race test | 1d | Concurrent INSERT into orders + diary_entries; verify legacy_order_id linking |

**Total Phase 0: 9.5d.** Run in parallel with Phase A backend work.

---

## 11. Sequencing — concrete weekly plan (Wave 1 = 16 weeks)

```
W1-2:   Phase A backend
        → migrations 077-080 applied to staging
        → /api/diary/entries + /api/diary/reconcile + /api/voice/parse v2 deployed staging
        → Phase 0 spikes S1-S6 in parallel

W3:     Phase B mobile schema bridge
        → Drizzle schema + expo-sqlite installed
        → src/api/diary.ts hooks
        → Round-trip test: voice → diary local → server → existing orders list

W4-5:   Phase C voice path 1 wired
        → @react-native-voice/voice installed
        → VoiceOrderSheet rewrite
        → ConfidenceChip component

W6:     Phase D sensory signature
        → src/lib/sensory/* implemented
        → Drift bench on Redmi Note 12

W7-8:   Phase G boundary contract + Phase H cron additions (parallel)
        → ESLint vocab lint + Reanimated mandate
        → Sentry config
        → Quota refactor
        → Hari Sepi + Anniversary + Customer Returns + Pre-Ramadan crons

W9-11:  Phase E Cerita tab + Now pin
        → 6th tab added
        → FlashList v2 feed
        → NowPin / FilterChips / TimeSection components
        → Onboarding tooltip for v1.0.0 users

W12-13: Phase F payment paths 4+5
        → expo-share-extension installed
        → iOS Xcode share target (SwiftUI native UI)
        → Android intent-filter
        → react-native-audio-api opus decode

W14:    Integration testing + alpha cohort onboarding
        → 5 Bandung mompreneur recruit (D-A6 carry-over)
        → 5-device matrix (Pixel + Samsung + Redmi + Oppo + iPhone)

W15-16: Wave 1 Phase 1 Gate validation
        → Sean Ellis 40% / DAU 70% / NPS 8 / referral / 3hr/wk

Wave 1.1 (post-launch parallel):
W17-24: Phase I NotificationListener Expo Module
        → Module scaffold (8-12d)
        → M5 Play Store policy declaration (4-8wk wall-clock)

W25-26: Wave 1.1 release with Path 6 auto-claim
```

**Total: 16 weeks Wave 1 + 10 weeks Wave 1.1 = 26 weeks (6 months) to full architecture parity.**

---

## 12. Risk register (Wave 1 ID context)

| Risk | P × I | Mitigation |
|---|---|---|
| Existing v1.0.0 users churn during migration | 20% × MED | A3-β additive Cerita tab — opt-in not forced; D-A4 anti-anxiety preserved |
| Schema migration race during dual-write | 25% × HIGH | Idempotent INSERT with legacy_order_id dedup; coexist 30-60d |
| `@react-native-voice/voice` Bandung accuracy <70% | 30% × MED | S1 spike validates; fallback OpenRouter Gemini speech with permission |
| Phase A backfill OOM on production data | 10% × MED | Batched function with LIMIT 500; S2 measures |
| Sensory drift >80ms on Snapdragon 685 | 30% × LOW | S3 spike validates; downgrade to "felt" not "synced" if needed |
| Cerita tab usage <30% by Day 60 (D-A3 falsifiability) | 25% × LOW | Opt-in nature means low risk; abort full migration if signal weak |
| Apple App Review NSSpeechRecognitionUsageDescription rejected | 5% × LOW | Cycle 33 iOS sev-7 — benign with proper usage strings |
| Confidence threshold miscalibrated for ID context | 35% × MED | S5 spike validates; tune per ID-vs-MY distribution |
| Existing real merchants experience downtime | 5% × HIGH | Migrations applied with pgBouncer concurrent mode; coexist read-path |

---

## 13. What this playbook does NOT settle

- Exact Sentry pricing tier for catatorder Indonesian volume (S4 spike)
- Whether Apple Speech Recognition Bandung dialect accuracy meets bar (S1 spike)
- Whether 0.85/0.92 confidence thresholds are tuned for ID Bahasa (S5 spike)
- Whether 6-month timeline is acceptable to Aldi
- Phase 0 5+5 hostile interview gate — recommend SKIP given v4.6 PMF; user can override
- Whether existing v1.0.0 production data needs schema migration (legacy fields like `npwp`, `nitku`, `ppn_rate`) carry into diary_entries.extracted_json — assume YES for compat

---

## 14. Status

- ✅ All 5 critical decisions locked (D-A1 through D-A5)
- ✅ Phase A SQL written (migrations 077-080) ready to apply
- ✅ Phase A API contract (4 routes) specified
- ✅ Phase B mobile schema mirror + sync hooks specified
- ✅ Phase C voice rewrite plan
- ✅ Phase D sensory signature code skeleton
- ✅ Phase E Cerita tab structure
- ✅ Phase F payment paths sketched
- ✅ Phase G boundary contract concrete
- ✅ Phase H cron additions concrete
- ✅ Phase I Wave 1.1 path
- ✅ 6 Phase 0 spikes specified
- ✅ 16-week Wave 1 sequencing
- ✅ Risk register

**Next cycle (038): start Phase A — apply migration 077 to staging Supabase + write `/api/diary/entries` route.ts.**
