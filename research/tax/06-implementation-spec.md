# Tax Feature Implementation Spec — CatatOrder

**Date:** 2026-03-28
**Based on:** Codebase audit of all migrations (001-072), API routes, UI patterns, cron system

---

## CURRENT STATE SUMMARY

**Yang sudah ada:**
- e-Faktur XML generation (LIVE, TaxInvoice.xsd v1.6)
- Invoice CRUD + PPN 11% calculation
- PPN monthly summary (`/api/invoices/ppn-summary`)
- NPWP/NITKU storage di profiles + customers
- Push notification via Expo (4 cron jobs aktif)
- Bisnis tier gating (`isBisnis()`, Rp99K/mo)
- Omzet data implicit dari `orders.total`

**Yang belum ada:**
- PPh Final 0.5% calculation
- Omzet YTD dashboard + threshold Rp500jt
- Tax reminder cron
- Tab "Pajak" di dashboard
- Info billing (KAP/KJS)

---

## 1. DATABASE MIGRATION

**File:** `supabase/migrations/073_tax_pph_fields.sql`

```sql
-- Add WP type and registration year to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wp_type TEXT DEFAULT 'op'
  CHECK (wp_type IN ('op', 'badan', 'pt_perorangan'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wp_registered_year INT;
```

**Kenapa cuma 2 field:**
- PPh Final TIDAK perlu tabel terpisah — semua dihitung on-the-fly dari `SUM(orders.total)`
- `wp_type` menentukan: OP = permanen PPh Final (revisi PP 55/2022), Badan/CV = tidak bisa lagi
- `wp_registered_year` untuk info saja (masa berlaku sudah diperpanjang)
- Tidak perlu `pph_payments` table — user bayar di CoreTax, bukan di CatatOrder

---

## 2. API ROUTES

### 2A. GET /api/tax/omzet-summary

**Fungsi:** Omzet per bulan + kumulatif YTD + threshold status

**Query pattern:** Sama seperti `/api/recap/monthly` — fetch orders, aggregate client-side

**Parameters:**
- `year` (default: current year)

**Response:**
```json
{
  "year": 2026,
  "months": [
    { "month": 1, "omzet": 45000000, "orderCount": 120 },
    { "month": 2, "omzet": 52000000, "orderCount": 145 },
    { "month": 3, "omzet": 38000000, "orderCount": 98 }
  ],
  "ytdTotal": 135000000,
  "threshold": 500000000,
  "thresholdReached": false,
  "remainingToThreshold": 365000000,
  "percentToThreshold": 27
}
```

**Implementation notes:**
- Auth: `getAuthenticatedClient(request)`
- Query: `supabase.from("orders").select("total, created_at").eq("user_id", user.id).not("status", "eq", "cancelled").is("deleted_at", null).gte("created_at", yearStart).lte("created_at", yearEnd)`
- Aggregate: JS loop, group by month using `toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })`
- Threshold: hardcoded Rp500.000.000 (PTKP UMKM OP per PP 55/2022)

### 2B. GET /api/tax/pph-calculation

**Fungsi:** Hitung PPh Final per bulan berdasarkan omzet

**Parameters:**
- `year` (default: current year)

**Response:**
```json
{
  "year": 2026,
  "wpType": "op",
  "ppiThreshold": 500000000,
  "months": [
    { "month": 1, "omzet": 45000000, "cumulativeOmzet": 45000000, "pphDue": 0, "setorDeadline": "2026-02-15", "status": "under_threshold" },
    { "month": 2, "omzet": 52000000, "cumulativeOmzet": 97000000, "pphDue": 0, "setorDeadline": "2026-03-15", "status": "under_threshold" },
    ...
    { "month": 8, "omzet": 80000000, "cumulativeOmzet": 530000000, "pphDue": 150000, "setorDeadline": "2026-09-15", "status": "taxable" }
  ],
  "ytdOmzet": 530000000,
  "ytdPphDue": 150000,
  "nextSetorDeadline": "2026-09-15"
}
```

**Calculation logic:**
```
Per bulan:
  cumulativeOmzet += omzet_bulan_ini

  IF cumulativeOmzet <= 500.000.000:
    pphDue = 0
    status = "under_threshold"

  ELSE IF bulan ini adalah bulan pertama melewati threshold:
    taxableAmount = cumulativeOmzet - 500.000.000
    pphDue = taxableAmount × 0.5% (0.005)
    status = "first_taxable"

  ELSE (sudah di atas threshold):
    pphDue = omzet_bulan_ini × 0.5%
    status = "taxable"

  setorDeadline = tanggal 15 bulan berikutnya
```

**Notes:**
- Reuse query dari omzet-summary (atau call internally)
- Profile fetch untuk `wp_type` — jika bukan 'op', show warning "CV/PT tidak bisa pakai PPh Final mulai 2026"
- `setorDeadline` = tanggal 15 bulan berikutnya (format ISO)

### 2C. GET /api/tax/rekap

**Fungsi:** Rekap siap-copy ke CoreTax

**Parameters:**
- `year` (default: current year)

**Response:**
```json
{
  "year": 2026,
  "npwp": "1234567890123456",
  "businessName": "Warung Makan Bu Sari",
  "billingInfo": {
    "kap": "411128",
    "kjs": "420",
    "description": "PPh Final Pasal 4 ayat (2) — UMKM"
  },
  "months": [
    {
      "month": 1,
      "masaPajak": "01-2026",
      "omzet": 45000000,
      "pphDue": 0,
      "setorDeadline": "2026-02-15",
      "laporDeadline": "2026-02-20"
    }
  ],
  "annual": {
    "totalOmzet": 530000000,
    "totalPphDue": 150000,
    "sptDeadline": "2027-03-31"
  }
}
```

**Notes:**
- Fetch profile for npwp, business_name
- Same calculation as pph-calculation but with billing info added
- KAP 411128, KJS 420 = hardcoded (PPh Final UMKM)
- `laporDeadline` = tanggal 20 bulan berikutnya
- `sptDeadline` = 31 Maret tahun berikutnya

---

## 3. CRON JOB

**File:** `app/api/cron/tax-reminder/route.ts`

**Schedule:** `0 2 10 * *` (02:00 UTC = 09:00 WIB, tanggal 10 tiap bulan)

**Kenapa tanggal 10:** Setor PPh deadline tgl 15. Reminder 5 hari sebelumnya.

**Logic:**
1. Auth: Bearer CRON_SECRET
2. Service role Supabase client
3. Get all profiles with `push_token IS NOT NULL AND npwp IS NOT NULL`
4. For each user:
   - Check quiet hours
   - Check duplicate via `onboarding_drip.tax_reminder_YYYY_MM`
   - Query last month's omzet (`SUM(orders.total)` for previous month)
   - Query YTD cumulative omzet
   - Calculate PPh due for last month
   - Build push message
5. Batch send via Expo Push API (100 per request)
6. Update `onboarding_drip` with sent timestamp

**Push message examples:**
- Under threshold: "Omzet bulan lalu Rp45jt (YTD: Rp135jt/Rp500jt). PPh = Rp0. Tetap lapor SPT ya!"
- Over threshold: "Setor PPh Final Rp150rb sebelum tgl 15. KAP 411128, KJS 420."

**vercel.json addition:**
```json
{ "path": "/api/cron/tax-reminder", "schedule": "0 2 10 * *" }
```

---

## 4. UI — TAB PAJAK

### 4A. Navigation

**File:** `config/navigation.ts`

Add to navigation items (threshold 10+ orders, same as Faktur):
```
{ name: "Pajak", href: "/pajak", icon: ReceiptText, minOrders: 10 }
```

### 4B. Page

**File:** `app/(dashboard)/pajak/page.tsx`

**Structure:**
```
PajakPage
├── Profile check + loading skeleton
├── Bisnis tier check
│   ├── IF not Bisnis: Show upgrade CTA (omzet YTD visible tapi PPh di-blur)
│   └── IF Bisnis: Full access
├── Year picker (input type="number" or select)
├── Section 1: Omzet YTD
│   ├── Progress bar (omzet / Rp500jt)
│   ├── Angka: "Rp135.000.000 / Rp500.000.000"
│   ├── Status badge: "Belum kena pajak" (green) / "Sudah kena pajak" (yellow)
│   └── Note: "Omzet di bawah Rp500jt/tahun bebas PPh Final"
├── Section 2: PPh Final per Bulan
│   ├── Table/cards per bulan:
│   │   ├── Bulan | Omzet | Kumulatif | PPh Terutang | Deadline | Status
│   │   └── Status: ✓ Bebas / ⏳ Belum setor / ⚠️ Lewat deadline
│   └── Total YTD PPh di bottom
├── Section 3: Info Billing
│   ├── Card: KAP 411128, KJS 420, Masa Pajak, Nominal
│   ├── Tombol "Copy" (clipboard API)
│   └── Note: "Buat kode billing di CoreTax → coretaxdjp.pajak.go.id"
└── NPWP warning (if profiles.npwp is null)
    └── "Isi NPWP di Pengaturan untuk fitur pajak lengkap"
```

**Component patterns (from Faktur tab reference):**
- Container: `max-w-2xl mx-auto space-y-4`
- Cards: `rounded-xl border bg-card shadow-sm p-4`
- Loading: `h-7 w-32 bg-muted animate-pulse rounded`
- Currency: `formatRupiah()` from `lib/utils/format.ts`
- Toast: `toast.success("Info billing disalin!")` from sonner
- Analytics: `track("pajak_viewed", { year, ytdOmzet })`

### 4C. Service Layer

**File:** `features/tax/services/tax.service.ts`

```typescript
export async function getOmzetSummary(year?: number) {
  const params = year ? `?year=${year}` : "";
  const res = await fetch(`/api/tax/omzet-summary${params}`);
  if (!res.ok) return null;
  return res.json();
}

export async function getPphCalculation(year?: number) {
  const params = year ? `?year=${year}` : "";
  const res = await fetch(`/api/tax/pph-calculation${params}`);
  if (!res.ok) return null;
  return res.json();
}

export async function getTaxRekap(year?: number) {
  const params = year ? `?year=${year}` : "";
  const res = await fetch(`/api/tax/rekap${params}`);
  if (!res.ok) return null;
  return res.json();
}
```

### 4D. Types

**File:** `features/tax/types/tax.types.ts`

```typescript
export interface MonthlyOmzet {
  month: number;
  omzet: number;
  orderCount: number;
}

export interface OmzetSummary {
  year: number;
  months: MonthlyOmzet[];
  ytdTotal: number;
  threshold: number;
  thresholdReached: boolean;
  remainingToThreshold: number;
  percentToThreshold: number;
}

export interface MonthlyPph {
  month: number;
  omzet: number;
  cumulativeOmzet: number;
  pphDue: number;
  setorDeadline: string;
  status: "under_threshold" | "first_taxable" | "taxable";
}

export interface PphCalculation {
  year: number;
  wpType: string;
  ppiThreshold: number;
  months: MonthlyPph[];
  ytdOmzet: number;
  ytdPphDue: number;
  nextSetorDeadline: string | null;
}

export interface TaxRekap {
  year: number;
  npwp: string | null;
  businessName: string | null;
  billingInfo: {
    kap: string;
    kjs: string;
    description: string;
  };
  months: {
    month: number;
    masaPajak: string;
    omzet: number;
    pphDue: number;
    setorDeadline: string;
    laporDeadline: string;
  }[];
  annual: {
    totalOmzet: number;
    totalPphDue: number;
    sptDeadline: string;
  };
}
```

---

## 5. GATING RULES

| Feature | Free | Unlimited | Bisnis |
|---------|------|-----------|--------|
| Omzet YTD (angka + progress bar) | ✅ | ✅ | ✅ |
| PPh calculation detail | ❌ blur | ❌ blur | ✅ |
| Info billing (KAP/KJS) | ❌ blur | ❌ blur | ✅ |
| Tax reminder push | ❌ | ❌ | ✅ |
| Rekap siap-CoreTax | ❌ blur | ❌ blur | ✅ |

**Reasoning:** Omzet YTD gratis = hook untuk upgrade. "Kamu sudah Rp400jt, mau tahu berapa pajaknya? Upgrade ke Bisnis."

---

## 6. FILE LIST (yang perlu dibuat/diubah)

### Baru (7 files)
```
supabase/migrations/073_tax_pph_fields.sql          ← migration
app/api/tax/omzet-summary/route.ts                  ← API
app/api/tax/pph-calculation/route.ts                 ← API
app/api/tax/rekap/route.ts                           ← API
app/api/cron/tax-reminder/route.ts                   ← cron
app/(dashboard)/pajak/page.tsx                       ← UI page
features/tax/services/tax.service.ts                 ← service layer
features/tax/types/tax.types.ts                      ← types
```

### Diubah (2 files)
```
config/navigation.ts    ← tambah item "Pajak"
vercel.json             ← tambah cron schedule
```

**Total: 9 files. 7 baru, 2 edit.**

---

## 7. IMPLEMENTATION ORDER

| Step | What | Effort | Dependency |
|------|------|--------|------------|
| 1 | Migration 073 | 10 min | None |
| 2 | Types (`tax.types.ts`) | 20 min | None |
| 3 | API: `omzet-summary` | 2-3 jam | Migration |
| 4 | API: `pph-calculation` | 2-3 jam | omzet-summary (share query) |
| 5 | API: `rekap` | 1-2 jam | pph-calculation (extend) |
| 6 | Service layer | 30 min | APIs |
| 7 | UI: Tab Pajak page | 4-6 jam | Service layer |
| 8 | Navigation update | 10 min | UI page |
| 9 | Cron: tax-reminder | 2-3 jam | APIs + push pattern |
| 10 | vercel.json update | 5 min | Cron |

**Total: ~15-20 jam development = 2-3 hari focused work.**

---

## 8. PPh FINAL CALCULATION REFERENCE

```
PP 55/2022 + Revisi 2026:

TARIF:    0.5% dari omzet bruto
PTKP:     Rp500.000.000/tahun (hanya WP OP)
THRESHOLD: Rp4.800.000.000/tahun (batas atas PPh Final)
BERLAKU:  Permanen untuk WP OP (revisi PP 55/2022, berlaku 1 Jan 2026)
          CV/PT/Firma: TIDAK BISA LAGI pakai PPh Final

SETOR:    Tanggal 15 bulan berikutnya
LAPOR:    Tanggal 20 bulan berikutnya (SPT Masa, tapi WP PPh Final TIDAK wajib SPT Masa)
SPT:      31 Maret tahun berikutnya (SPT Tahunan OP)

KAP:      411128
KJS:      420
DESKRIPSI: PPh Final Pasal 4 ayat (2) — Usaha Mikro Kecil

PERHITUNGAN:
  Bulan 1: omzet 50jt, kumulatif 50jt → 50jt < 500jt → PPh = 0
  Bulan 2: omzet 60jt, kumulatif 110jt → 110jt < 500jt → PPh = 0
  ...
  Bulan 8: omzet 80jt, kumulatif 520jt → 520jt > 500jt
           taxable = 520jt - 500jt = 20jt
           PPh = 20jt × 0.5% = Rp100.000
  Bulan 9: omzet 70jt, kumulatif 590jt → sudah di atas threshold
           PPh = 70jt × 0.5% = Rp350.000
```
