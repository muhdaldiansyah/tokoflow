# 04 · Design System

> Bagaimana Apple-grade execution diterjemahkan ke pixel, motion, sound, dan kata.

---

## Design Philosophy

> **"Design is not just what it looks like and feels like. Design is how it works."** — Steve Jobs

Tokoflow design system bukan style guide. Tokoflow design system adalah **manifestasi filosofi**: setiap pixel, gerakan, suara, dan kata harus mengirim pesan yang konsisten dengan [manifesto](./00-manifesto.md).

5 prinsip utama:

1. **Restraint** — Apa yang kami **tidak** tambah sama pentingnya dengan apa yang kami tambah
2. **Coherence** — Setiap elemen terasa belong to a whole
3. **Calm** — Tidak ada urgensi palsu, tidak ada anxiety
4. **Dignity** — User merasa dimuliakan, bukan dimanfaatkan
5. **Magic in the details** — Yang user tidak sadari secara explicit tetap mereka rasakan

---

## Visual System

### Color Palette

**Background**:
- Primary BG: `hsl(35 20% 97%)` — warm off-white (existing CatatOrder color, retain)
- Card BG: `hsl(36 15% 99%)` — slightly brighter than BG, soft contrast
- **NOT** pure white (`#FFFFFF`)—dingin, klinis, anti-thesis

**Brand accent**:
- Primary: warm green `#2d6a4f` (existing brand, retain)
- Dark variant: `#1a4d35`
- Light variant: `#f0fdf4`
- Text accent: `#15803d`

**Status colors** (semantic, restrained):
- Success: warm green (sama dengan brand)
- Warning: amber, soft (`#f59e0b` dengan low opacity wash)
- Error: rose, NOT harsh red (`#e11d48` dengan dignity)
- Info: muted blue (`#3b82f6` low saturation)

**Anti-pattern**:
- ❌ Multiple bright accent colors
- ❌ Gradients yang loud (subtle gradients OK)
- ❌ Pure black `#000000`—gunakan `hsl(0 0% 10%)` or warmer
- ❌ Neon, vibrant, "trendy" colors

### Typography

**Font family**: Inter (primary) atau system font fallback (`-apple-system`, `BlinkMacSystemFont`)

**Weights**:
- Regular (400) — body text
- Semibold (600) — emphasis, headings
- **2 weights only.** Apple discipline.

**Hierarchy**:

| Level | Use case | Style |
|---|---|---|
| L1 | Page title | Semibold, text-foreground (full opacity) |
| L2 | Numeric values, prices | Semibold, larger, brand color sometimes |
| L3 | Body text | Regular, text-foreground |
| L4 | Hint, caption, secondary | Regular, text-muted-foreground |

**Sizes** (Tailwind):
- xs (12px) — captions only, sparse
- sm (14px) — body secondary
- base (16px) — body default
- lg (18px) — emphasis body
- xl (20px) — section titles
- 2xl (24px) — page titles
- **No sizes above 2xl** kecuali specific landing hero

**Line height**: generous (1.5-1.75 for body, 1.2-1.3 for headings)

**Anti-pattern**:
- ❌ 5+ font weights
- ❌ Fancy display fonts untuk body
- ❌ All caps untuk paragraphs
- ❌ Tiny text <12px

### Spacing

**Scale**: 4px base, multiples of 4

**Touch targets**: minimum 44px (h-11 in Tailwind)

**Card padding**: 16-24px breathing room
**Section spacing**: 24-48px between groups
**Page padding**: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8

**White space generous** — Apple-style breathing room. Resist temptation to fill every pixel.

### Borders & Shadows

**Border radius**:
- Cards: `rounded-xl` (12px)
- Buttons: `rounded-lg` (8px)
- Inputs: `rounded-lg` (8px)
- Avatar/profile: `rounded-full`

**Shadows**:
- Cards: `shadow-sm` (subtle)
- Modals: `shadow-lg` (clear elevation)
- **Avoid `shadow-xl`+** (too dramatic, loud)

**Borders**: 1px, soft color (existing border color)

### Iconography

**Library**: Phosphor Icons or Lucide (consistent set, monochrome)
**Weight**: 1.5px outline
**Size**: 20-24px default
**Color**: monochrome, inherit text color

**Anti-pattern**:
- ❌ Multiple icon libraries mixed
- ❌ Filled + outline mix in same screen
- ❌ Custom illustrations untuk fungsional UI
- ❌ Multi-color icons

### Photography & Imagery

**Product photos**:
- Real Malaysian/Indonesian merchants—natural light, authentic
- AI-enhanced for clarity but never fake
- Subject-centered composition
- Soft natural shadow (not harsh)

**Marketing photos**:
- Real merchants doing real work (cooking, packing, delivering)
- Hands visible (work-honoring)
- Indonesian/Malaysian context (warung kitchen, home dapur, real environment)
- **NOT stock photos** of generic businesspeople

**Anti-pattern**:
- ❌ Western stock photos
- ❌ Heavy filters (Instagram-style)
- ❌ Studio-perfect plastic look
- ❌ AI-generated faces (uncanny valley risk)

---

## Motion System

Apple uses motion to communicate **causality and continuity**. Motion is not decoration—it's communication.

### Transition Principles

**Spring animations** (NOT linear ease):
- Duration: 200-300ms typical
- Damping: comfortable, not bouncy/playful
- Use `transform` + `opacity`, not `width`/`height` (performance)

**Page transitions**:
- Horizontal slide (going forward = slide left, back = slide right)
- Never fade between pages (unclear causality)
- Hierarchy clear (parent → child = slide right)

**Micro-interactions**:

| Element | Behavior |
|---|---|
| Tap on button | Scale 0.97, 150ms spring, +haptic on mobile |
| Card hover (web) | Subtle lift, shadow increase, 200ms |
| Modal open | Slide up + fade in, 300ms spring |
| Loading | Skeleton shimmer (NOT spinner) |
| Success | Checkmark draw + brief haptic, 400ms |
| Error | Subtle shake (3-cycle, low amplitude), 200ms |

### Haptic Feedback (mobile only)

| Event | Haptic |
|---|---|
| Pesanan masuk (vibrate) | Soft notification haptic, 1× |
| Tap button confirm | Light haptic |
| Status advance (swipe) | Medium haptic + visual confirmation |
| Error / invalid | Warning haptic (3 short pulses) |
| Success major (first order, anniversary) | Success haptic + light celebration |
| Default | Light haptic for all interactive taps |

### Anti-Motion Patterns

- ❌ Bouncy, playful animations (Tokoflow is dignified, not toy-like)
- ❌ Confetti, celebration explosions (overdone)
- ❌ Long durations >500ms (slow feels broken)
- ❌ Animations that block interaction
- ❌ Auto-rotating carousels (annoying)
- ❌ Parallax effects (distracting)

---

## Sound System

Sound is part of brand. Apple's notification sounds are iconic. Tokoflow needs same intentionality.

### Default Sound Mode

**Vibrate-only by default.** No sound unless user explicitly enables.

Rationale: respect for owner's environment (cooking, ngobrol, family time). Sound only on-demand.

### Custom Sounds (when sound is enabled)

| Event | Sound spec |
|---|---|
| Pesanan masuk | Custom-designed chime, 0.8s, dignified |
| Order completed | Soft warm note, 0.4s |
| Error | Calm low tone, 0.3s (NOT harsh buzz) |
| Success major | Warmer chime, 0.6s |

**Sound design principles**:
- All sounds composed in same musical key (coherence)
- Acoustic instruments base (warm, not synthetic)
- Short durations (under 1 second)
- Volume default at 60% (room for adjustment)

### Anti-Sound Patterns

- ❌ Default OS notification sound (generic, unbranded)
- ❌ Loud, attention-grabbing alerts
- ❌ Voice notifications ("You have a new order!") — too much
- ❌ Music in app (not iPod, no need)

---

## Microcopy System

Where Apple shines. Every word is crafted.

### Microcopy Principles

1. **Konteks-aware**: copy berbeda untuk situasi berbeda
2. **Aktif, bukan pasif**: "saya cek" bukan "sistem memproses"
3. **Personal, sebut nama**: "Pak Andi" bukan "customer"
4. **Empati di momen sulit**: hari sepi, error, complaint
5. **Confident di success**: jangan over-celebrate
6. **Hindari teknis jargon**: tidak ada "slug," "API," "UUID" di user-facing

### Microcopy Library (samples)

#### Empty States

| Konteks | ✅ DO | ❌ DON'T |
|---|---|---|
| No orders today | "Belum ada pesanan hari ini. Selamat menikmati pagi." | "No orders yet" |
| No products | "Yuk tambah produk pertamamu. Cukup foto, sisanya saya bantu." | "Add a product to get started" |
| No customers | "Customer akan muncul di sini setelah pesanan pertama." | "Customer list is empty" |
| No invoice | "Belum ada faktur. Akan otomatis dibuat saat ada pesanan." | "No invoices found" |

#### Errors

| Konteks | ✅ DO | ❌ DON'T |
|---|---|---|
| Network error | "Sebentar ya, sambungannya kurang stabil. Saya coba lagi." | "Network Error: Connection failed" |
| Validation | "Harga harus lebih besar dari 0. Coba cek lagi." | "Invalid price value" |
| Permission denied | "Sebentar, ini perlu izin akses kamera. Mau buka pengaturan?" | "Camera access denied" |
| Server error | "Wah, ada yang tidak beres di sisi kami. Sedang diperbaiki." | "500 Internal Server Error" |

#### Loading

| Durasi | ✅ DO | ❌ DON'T |
|---|---|---|
| <1s | (skeleton shimmer, no text) | "Loading..." |
| 1-3s | "Sebentar..." | "Please wait..." |
| >3s | "Sedang menyiapkan tokomu..." | "Loading, please wait..." |

#### Confirmations

| Konteks | ✅ DO | ❌ DON'T |
|---|---|---|
| Delete product | "Hapus produk ini? Bisa tambah lagi kapan saja." | "Are you sure you want to delete?" |
| Cancel order | "Batalkan pesanan? Customer akan diberitahu otomatis." | "Cancel this order?" |
| Refund | "Kembalikan uang RM 45 ke Pak Andi? Otomatis ke akun mereka." | "Process refund?" |
| Log out | "Keluar dari Tokoflow? Bisa masuk lagi kapan saja." | "Sign out?" |

#### Success

| Konteks | ✅ DO | ❌ DON'T |
|---|---|---|
| Order created | "Pesanan tercatat. Bu Aisyah sudah dikabari." | "Order placed successfully!" |
| Payment received | "Uang masuk RM 75. Kamu sudah bisa mulai masak." | "Payment received: RM 75" |
| Product added | "Ayam crispy ditambah ke menu kamu." | "Product added successfully" |
| Status updated | "Pesanan Pak Andi sudah siap. Customer dikabari." | "Status updated to Ready" |

### CTA Button Copy

| Konteks | ✅ DO | ❌ DON'T |
|---|---|---|
| Add product | "Tambah Produk" | "Create New Product" |
| Save | "Simpan" atau "Beres" | "Submit" / "Save Changes" |
| Cancel | "Batal" | "Cancel" |
| Confirm payment | "Pesan Sekarang" | "Place Order" |
| Try Tokoflow | "Coba Sekarang" | "Sign Up Free" |

### Settings Labels

Replace technical:

| Technical | Human |
|---|---|
| "Slug" | "Alamat toko" |
| "API token" | (sembunyikan, jangan expose) |
| "Webhook URL" | (sembunyikan) |
| "TIN/BRN/SST ID" | "Pajak (untuk Business)" |
| "Quota used" | (sembunyikan kalau bisa) |
| "Push notification settings" | "Notifikasi" |

### Internal Architecture Names — NEVER expose to user

These are precision terms for engineering + strategy docs. **Customer-facing UI must never show these.** Honest, but jargon-free.

| Internal name (docs/code) | Customer-facing language |
|---|---|
| "Digital twin" / "twin" | (never expose) — use "Tokoflow" or first-person *"saya"* |
| "AI agent" / "agent" | (never expose) — use *"Tokoflow"* or *"otomatis"* |
| "Background Twin" | (never expose) — describe *what was done*, not *who did it*: *"sudah saya urus"*, *"otomatis"* |
| "Foreground Assist" | (never expose) — describe action: *"saya saran balas..."* |
| "Mechanical residue" / "Tier 3" | (never expose) — describe specifics: *"admin"*, *"invoice"*, *"pajak"* |
| "Three-Tier Reality" | (never expose) — internal compass only |
| "Trust progression" | (never expose) — visible as track record number, not framework name |

**Rule**: when describing what Tokoflow does, **describe the outcome (what happened) not the architecture (who did it)**. Bu Aisyah cares that her invoices are sent — not that "Background Twin" sent them.

**Test the copy**: kalau Bu Aisyah baca, apakah dia perlu tanya "apa itu twin/agent/Tier 3?" Kalau ya → ganti.

---

## Component Principles

### Buttons

- Primary CTA: filled, brand color, white text, `h-11` (44px touch target)
- Secondary: outlined, brand color text
- Tertiary/text: text-only, brand color
- **Maximum 1 primary CTA per screen** (focus discipline)

### Cards

- `rounded-xl border bg-card shadow-sm`
- Padding 16-24px
- Single primary action per card

### Inputs

- `h-11 px-3 bg-card border rounded-lg shadow-sm`
- Placeholder text in muted color
- Helper text below, not floating
- Error inline, not modal

### Modals

- Bottom-sheet on mobile (NOT center modal—respect thumb zone)
- Center modal on desktop
- Always 1 primary action + 1 cancel
- No nested modals (trap)

### Lists

- Generous spacing between items
- Tap entire row, not just text
- Swipe gestures for actions (mobile)
- 300ms search debounce

---

## Accessibility

Apple-grade also means accessible.

- Color contrast WCAG AA minimum (AAA aspirational)
- Touch targets 44px minimum
- Voice-over labels for all interactive elements
- Keyboard navigation (web)
- Reduced motion mode (respect OS setting)
- Indonesian-language screen readers compatible

---

## Cross-references

- Why this matters (philosophy): [`00-manifesto.md`](./00-manifesto.md)
- Voice & tone (microcopy): [`02-product-soul.md`](./02-product-soul.md#ai-personality--voice)
- Feature implementation: [`03-features.md`](./03-features.md)

---

*Versi 1.1 · 28 April 2026 · Design system adalah manifestasi philosophy. Setiap pixel mengirim pesan.*

*Changelog 1.1:* Added "Internal Architecture Names — NEVER expose" section to Settings Labels. Customer-facing copy never uses "twin", "AI agent", "Tier 3", or any architecture jargon. Honest about being AI but specific about what was done, not who did it.
