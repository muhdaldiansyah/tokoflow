# POST 1 — Slide-by-Slide Image Production Briefs

> AI-first production using **Gemini Nano Banana Pro** (Thinking mode) + Canva for final polish.
> Canvas: 1080 x 1920 px. Export: PNG. Primary tool: Nano Banana Pro. Polish: Canva.

---

## Production Method: AI-First Workflow

### Why Nano Banana Pro?

- Best-in-class **text rendering** — handles Indonesian text accurately
- Native **9:16 vertical** format support
- Understands **WhatsApp UI patterns** (chat mockups, inbox layouts)
- **Iterative editing** — refine via conversation instead of rebuilding
- **Multi-image reference** — upload Slide 1 as style reference for Slides 2-7 consistency

### Workflow per Slide

```
1. Generate with Nano Banana Pro (Thinking mode, NOT Fast mode)
2. Iterate 2-3x via conversation ("make the number bigger", "move text up")
3. Download PNG (1080x1920)
4. Open in Canva for final polish (fix any text errors, adjust spacing, add logo)
5. Export from Canva as PNG, full quality
```

### Nano Banana Pro Prompting Rules

| Rule | Why |
|------|-----|
| **1-3 sentences max** | Model drops details from long prompts |
| **Critical instructions FIRST** | Later details may be ignored |
| **Text in quotation marks** | Ensures exact text rendering |
| **Font style in plain language** | "bold sans-serif" not "Montserrat 700" |
| **Limit to 1-3 text blocks** | More text blocks = more rendering errors |
| **State placement explicitly** | "top-left", "centered bottom", etc. |
| **Use Thinking mode** | Required for text-heavy social media slides |
| **Iterate, don't re-roll** | If 80% right, edit via conversation |

### Prompting Formula

```
[Format + Dimensions] + [Background + Style] + [Main Visual Elements] + [Text with exact copy in quotes] + [What to exclude]
```

---

## Global Specs (Apply to All Slides)

```
Canvas:          1080 x 1920 px (9:16 vertical)
Safe zone:       x=120 to x=960, y=131 to y=1553 (840 x 1422 px usable)
Top avoid:       131px (TikTok Following/For You tabs)
Bottom avoid:    367px (caption overlay, buttons, navigation bar)
Left avoid:      120px
Right avoid:     120px (like/comment/share/bookmark stack)
Export:          PNG, full quality, NO compression
Color profile:   sRGB
```

### Color Palette (Reference for All Prompts)

| Color | Hex | Usage |
|-------|-----|-------|
| Dark forest green | `#1B4332` | Slide 1 background, Slide 7 text |
| Dark gray-green | `#2D3E36` | Slides 2-3 background |
| Medium green | `#344E41` | Slides 4-5 background |
| Lighter green | `#3A5A40` | Slide 6 background |
| Warning red | `#C0392B` | Mistake badges, stat callouts |
| Warning orange | `#E67E22` | Slides 5-6 badges (cool-down) |
| Light gold | `#F0E68C` | Sub-hook text, accent |
| Off-white | `#F8F9FA` | Slide 7 background |
| CTA green | `#16A34A` | Checkmarks on Slide 7 |

### Font Mapping (Canva Polish)

| Role | Canva Font | Weight | Nano Banana Equivalent |
|------|-----------|--------|----------------------|
| Hero numbers | League Gothic | Regular | "tall condensed bold sans-serif" |
| Titles | Montserrat | Bold (700) | "bold sans-serif" |
| Body text | DM Sans | Regular (400) | "clean sans-serif" |
| CTA/accent | Poppins | SemiBold (600) | "medium-weight modern sans-serif" |

---

## SLIDE 1 — Hook

### Layout Blueprint

```
┌──────────────────────────────────┐
│ ▒▒▒▒▒ TOP AVOID 131px ▒▒▒▒▒▒▒▒ │
│                          "1/7"   │
│                                  │
│  ┌─────────────┐  ┌──────────┐  │
│  │             │  │          │  │
│  │    "5"      │  │  PERSON  │  │
│  │  (huge)     │  │  CUTOUT  │  │
│  │             │  │          │  │
│  │ Kesalahan   │  │  (waist  │  │
│  │ Fatal Saat  │  │   up,    │  │
│  │ Terima      │  │  shocked │  │
│  │ Order       │  │  face)   │  │
│  │ dari WA     │  │          │  │
│  │             │  └──────────┘  │
│  │ ────────────│                │
│  │ Yang ke-3   │                │
│  │ paling      │                │
│  │ sering bikin│                │
│  │ rugi        │                │
│  └─────────────┘                │
│                                  │
│   order WA · jualan online       │
│ ▒▒▒▒▒ BOTTOM AVOID 367px ▒▒▒▒▒ │
└──────────────────────────────────┘
```

### Nano Banana Pro Prompt

**Step 1 — Generate person cutout (separate image):**

```
Photo of a young Indonesian man in his late 20s, waist-up, shocked surprised expression, hand on forehead in "oh no" gesture, wearing a casual polo shirt, looking to his left, plain solid dark green background, natural soft lighting, portrait photography, high quality, 4:5 aspect ratio.
```

**Step 2 — Generate full slide (upload Step 1 as reference):**

```
Create a TikTok carousel slide, 9:16 vertical format, 1080x1920 pixels.

Dark forest green solid background (#1B4332). Left side: giant white bold condensed number "5" extremely large at top-left dominating 25% of the slide, below it bold white sans-serif text "Kesalahan Fatal Saat Terima Order dari WA" in 3 lines, below that in smaller italic light gold (#F0E68C) text "Yang ke-3 paling sering bikin rugi". Right side: place the person from the reference image as a cutout with background removed, waist-up, facing left toward the text. Top-right corner small white text "1/7" at 60% opacity. Bottom center very subtle white text "order WA · jualan online" at 40% opacity. Clean minimal design, no decorations, no logo, no border, no emojis.
```

**Step 3 — Iterative refinements:**

```
→ "Make the number 5 much bigger — it should be the scroll-stopping element"
→ "Move the person slightly right, the text needs more breathing room on the left"
→ "Make the gold text more clearly italic and slightly smaller than the white title"
→ "Ensure text stays within the safe zone — nothing in the top 131px or bottom 367px"
```

### Element Specs (for Canva Polish)

**Background:**
- Solid fill: `#1B4332` (dark forest green)
- No gradient, no texture, no pattern — clean authority

**Hero Number "5":**
- Text: `5`
- Font: League Gothic, Regular
- Size: 200px
- Color: `#FFFFFF` (white)
- Position: left-aligned, x=140, y=250
- Takes up approximately 25% of the vertical safe zone
- This is the single most prominent element — the scroll-stopper

**Main Hook Text:**
- Text: `Kesalahan Fatal\nSaat Terima\nOrder dari WA`
- Font: Montserrat, Bold (700)
- Size: 80px
- Color: `#FFFFFF`
- Line height: 1.2x (96px)
- Position: left-aligned, x=140, directly below the "5" (y=480)
- Max width: 520px (leaves room for person cutout on right)
- 3-4 lines of text

**Sub-Hook Text:**
- Text: `Yang ke-3 paling sering bikin rugi`
- Font: DM Sans, Regular (400)
- Size: 42px
- Color: `#F0E68C` (light gold — distinct from white to signal secondary info)
- Style: italic
- Position: left-aligned, x=140, y=820 (below main text, with 30px gap)
- This creates a specific curiosity loop for Slide 4

**Person Cutout:**
- Type: Photo of a person (waist-up), with background removed
- Expression: shocked, surprised, or hand-on-head "oh no" gesture
- Size: approximately 450px wide x 700px tall
- Position: right third of slide, x=580, y=350
- The person should slightly overlap the text area on the left (creates depth)
- Flip horizontally if needed so the person faces/looks toward the text

**Slide Counter:**
- Text: `1/7`
- Font: DM Sans, Regular, 32px
- Color: `#FFFFFF` at 60% opacity
- Position: top-right corner, x=880, y=150

**TikTok Search Keywords:**
- Text: `order WA · jualan online`
- Font: DM Sans, Regular, 28px
- Color: `#FFFFFF` at 40% opacity (subtle — visible but not distracting)
- Position: bottom of safe zone, centered, y=1500

**What NOT to include:**
- No logo (Slide 1 must be clean — logo only on Slide 7)
- No watermarks
- No decorative elements that compete with the hook text
- No emojis on the slide itself

---

## SLIDE 2 — Mistake #1: "Balas 'siap kak' tanpa catat"

### Layout Blueprint

```
┌──────────────────────────────────┐
│ ▒▒▒▒▒ TOP AVOID 131px ▒▒▒▒▒▒▒▒ │
│                          "2/7"   │
│  ┌──┐                           │
│  │1 │ ← red badge               │
│  └──┘                           │
│  Balas "siap kak"               │
│  tanpa catat                    │
│  ────── red divider             │
│  Lupa item, salah harga,        │
│  customer marah. Dan kamu       │
│  bahkan gak sadar ini           │
│  terjadi tiap hari.             │
│                                  │
│  ┌────────────────────────────┐  │
│  │   WA CHAT MOCKUP           │  │
│  │  ┌──────────────────────┐  │  │
│  │  │ Customer:            │  │  │
│  │  │ "Kak mau pesan       │  │  │
│  │  │  nasi box 50 porsi"  │  │  │
│  │  └──────────────────────┘  │  │
│  │       ┌─────────────────┐  │  │
│  │       │ Seller:         │  │  │
│  │       │ "Siap kak ✅"   │  │  │
│  │       └─────────────────┘  │  │
│  │              ❌             │  │
│  └────────────────────────────┘  │
│                                  │
│ ▒▒▒▒▒ BOTTOM AVOID 367px ▒▒▒▒▒ │
└──────────────────────────────────┘
```

### Nano Banana Pro Prompt

**Upload Slide 1 as style reference, then:**

```
Create a TikTok carousel slide matching the style of the reference image, 9:16 vertical, 1080x1920px.

Dark gray-green solid background (#2D3E36). Top-left: red circle badge (#C0392B) with white bold "1" inside. Below it: bold white sans-serif title "Balas 'siap kak' tanpa catat" in 2 lines. Below a short red divider line: smaller white text "Lupa item, salah harga, customer marah. Dan kamu bahkan gak sadar ini terjadi tiap hari." with the last line in italic. Bottom half: a WhatsApp chat mockup — dark rounded rectangle containing two chat bubbles. Left white bubble: "Kak mau pesan nasi box 50 porsi untuk acara Sabtu". Right green bubble: "Siap kak" with a large red X overlay on the green bubble. Top-right: white "2/7" at 60% opacity. Clean design, no logo, no border.
```

**Iterative refinements:**

```
→ "Make the WhatsApp chat mockup look more realistic — use actual WA bubble shapes"
→ "The red X should be larger and more prominent over the seller reply"
→ "Make the last line of the consequence text italic for emphasis"
```

### Element Specs (for Canva Polish)

**Background:** Solid fill `#2D3E36` (dark gray-green)

**Number Badge:** Circle 90px, fill `#C0392B`, text `1` in Montserrat Bold 48px white, position x=140, y=170

**Mistake Title:** `Balas "siap kak"\ntanpa catat` — Montserrat Bold 72px white, x=140, y=280, max width 700px

**Red Accent Divider:** Rectangle 200px x 3px, `#C0392B`, x=140, y=450

**Consequence Text:** `Lupa item, salah harga, customer marah.\nDan kamu bahkan gak sadar\nini terjadi tiap hari.` — DM Sans Regular 42px, white 90%, x=140, y=480. Last line italic.

**WA Chat Mockup:**
- Container: rounded rectangle 700px x 450px, fill `#0B141A` (WA dark mode), radius 20px, centered y=750
- Customer bubble: left-aligned, white fill, text `Kak mau pesan nasi box 50 porsi untuk acara Sabtu`, DM Sans Regular 32px
- Seller bubble: right-aligned, green fill `#DCF8C6`, text `Siap kak`, DM Sans Regular 32px
- Red X overlay: 80px, centered over seller bubble, 90% opacity

**Slide Counter:** `2/7`, DM Sans Regular 32px, white 60% opacity, x=880, y=150

---

## SLIDE 3 — Mistake #2: "Catat pesanan di buku tulis / notes HP"

### Layout Blueprint

```
┌──────────────────────────────────┐
│ ▒▒▒▒▒ TOP AVOID 131px ▒▒▒▒▒▒▒▒ │
│                          "3/7"   │
│  ┌──┐                           │
│  │2 │ ← red badge               │
│  └──┘                           │
│  Catat pesanan di               │
│  buku tulis / notes HP          │
│  ────── red divider             │
│  Hilang, gak bisa search,       │
│  gak ada rekap.                 │
│                                  │
│  ┌─ Error rate ──┐              │
│  │    60%        │              │
│  └───────────────┘              │
│                                  │
│  ┌─────────┐  ┌─────────────┐  │
│  │ MESSY   │  │ CLEAN       │  │
│  │ NOTE-   │  │ DIGITAL     │  │
│  │ BOOK    │  │ LIST        │  │
│  │ (red    │  │ (green      │  │
│  │  tint)  │  │  tint)      │  │
│  └─────────┘  └─────────────┘  │
│      ❌              ✅         │
│                                  │
│  Tapi yang ke-3 ini             │
│  lebih parah...                 │
│ ▒▒▒▒▒ BOTTOM AVOID 367px ▒▒▒▒▒ │
└──────────────────────────────────┘
```

### Nano Banana Pro Prompt

```
Create a TikTok carousel slide matching the style of the reference, 9:16 vertical, 1080x1920px.

Dark gray-green solid background (#2D3E36). Top-left: red circle badge with white "2". Below: bold white title "Catat pesanan di buku tulis / notes HP". Below a red divider: white text "Hilang, gak bisa search, gak ada rekap." Then a red rounded badge with white text "Error rate 60%". Middle: side-by-side comparison — left image shows a messy handwritten notebook with red tint and a red X below it, right image shows a clean digital order list on a phone screen with green tint and a green checkmark below it. Bottom: italic white text "Tapi yang ke-3 ini lebih parah..." as a teaser. Top-right: white "3/7". No logo, no border.
```

**Iterative refinements:**

```
→ "Make the messy notebook look like a real Indonesian order book with handwritten entries"
→ "The clean digital list should look like a mobile app with organized order rows"
→ "Make the red/green tints more subtle — 20% opacity overlay"
→ "The cliffhanger text at the bottom should be clearly italic"
```

### Element Specs (for Canva Polish)

**Background:** Solid fill `#2D3E36`

**Number Badge:** Circle 90px, fill `#C0392B`, text `2`, x=140, y=170

**Mistake Title:** `Catat pesanan di\nbuku tulis / notes HP` — Montserrat Bold 72px white, x=140, y=280

**Red Accent Divider:** 200px x 3px, `#C0392B`, x=140, y=430

**Consequence Text:** `Hilang, gak bisa search, gak ada rekap.` — DM Sans Regular 42px, white 90%, x=140, y=460

**Stat Callout Badge:** Rounded rectangle 280px x 80px, fill `#C0392B`, radius 12px, text `Error rate 60%` Montserrat Bold 36px white, x=140, y=560. Source: Pasuruan study.

**Split Visual (Before/After):**
- Two images side by side, 350px each with 20px gap, height 400px, centered y=680
- Left: messy notebook photo, red tint overlay 20%, red X below
- Right: clean digital order list (CatatOrder screenshot if possible), green tint 15%, green checkmark below
- Both with border radius 12px

**Micro-Cliffhanger:** `Tapi yang ke-3 ini lebih parah...` — DM Sans Regular 36px white italic, x=140, y=1180

**Slide Counter:** `3/7`

---

## SLIDE 4 — Mistake #3: "Chat pelanggan tenggelam" (SHOCK SLIDE)

### Layout Blueprint

```
┌──────────────────────────────────┐
│ ▒▒▒▒▒ TOP AVOID 131px ▒▒▒▒▒▒▒▒ │
│                          "4/7"   │
│  ┌──┐                           │
│  │3 │ ← RED badge (strongest)   │
│  └──┘                           │
│  Chat pelanggan                 │
│  tenggelam di antara            │
│  grup keluarga                  │
│  ────── red divider (wider)     │
│  Order masuk tapi kamu          │
│  gak lihat — hilang             │
│  tanpa jejak.                   │
│                                  │
│  ┌────────────────────────────┐  │
│  │    WA INBOX MOCKUP         │  │
│  │  ┌──────────────────────┐  │  │
│  │  │ 🔴 Grup Alumni (47) │  │  │
│  │  │ 🔴 Keluarga Bsr (23)│  │  │
│  │  │ 🔴 Promo Shopee (12)│  │  │
│  │  │ 🔴 Grup RT (8)      │  │  │
│  │  │ 🔴 Arisan (5)       │  │  │
│  │  │ ...                  │  │  │
│  │  │ ░░ Bu Rina - order ░░│  │  │ ← barely visible
│  │  └──────────────────────┘  │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌── 30-50% peluang ──────────┐ │
│  │ transaksi hilang           │ │
│  └────────────────────────────┘ │
│ ▒▒▒▒▒ BOTTOM AVOID 367px ▒▒▒▒▒ │
└──────────────────────────────────┘
```

### Nano Banana Pro Prompt

**This is the most complex slide. Use a 2-step approach:**

**Step 1 — Generate WA inbox mockup separately:**

```
Create a realistic WhatsApp chat list screenshot mockup, white background, showing 7 chat rows stacked vertically. Each row has a colored circle avatar on the left, a chat name in bold, a preview text in gray, and a notification badge with unread count on the right. Row content from top to bottom: "Grup Alumni SMA" (47 unread), "Keluarga Besar" (23), "Promo Shopee" (12), "Grup RT 05" (8), "Arisan Ibu-ibu" (5), "Mama" (2). The last row "Bu Rina - Pesan nasi box" (1 unread) should be very faded and dim at 50% opacity, barely visible at the bottom — this is the buried order. The notification badges should be green circles with white numbers. Make it look like an actual WhatsApp interface. Clean UI design, 3:4 aspect ratio.
```

**Step 2 — Generate full slide (upload WA mockup + Slide 1 as references):**

```
Create a TikTok carousel slide matching the dark green style, 9:16 vertical, 1080x1920px.

Medium dark green background (#344E41). Top-left: red circle badge (#C0392B) slightly larger than usual with white "3" — add a subtle red glow behind it. Below: bold white title "Chat pelanggan tenggelam di antara grup keluarga" in 3 lines. Below a wider red divider line: white text "Order masuk tapi kamu gak lihat — hilang tanpa jejak." Center: place the WhatsApp inbox mockup from the reference image in a rounded rectangle container. Below the mockup: a full-width red rounded badge with bold white text "30-50% peluang transaksi hilang". Top-right: white "4/7". No logo, no border.
```

**Iterative refinements:**

```
→ "Make the last chat row (Bu Rina) more faded — it should be almost invisible"
→ "Add a subtle red dotted outline around the Bu Rina row to draw attention to what's missed"
→ "The red divider should be wider than on other slides — about 280px instead of 200px"
→ "The red badge with the 3 should have a slight glow effect"
```

### Element Specs (for Canva Polish)

**Background:** Solid fill `#344E41`

**Number Badge:** Circle 100px (larger than other slides), fill `#C0392B`, subtle red glow (2px, 30% opacity, 10px blur), text `3` Montserrat Bold 48px white, x=140, y=170

**Mistake Title:** `Chat pelanggan\ntenggelam di antara\ngrup keluarga` — Montserrat Bold 72px white, x=140, y=280

**Red Accent Divider:** WIDER: 280px x 3px (vs 200px on other slides), `#C0392B`, x=140, y=500

**Consequence Text:** `Order masuk tapi kamu gak lihat —\ntertutup chat alumni, promo, grup RT.\nHilang tanpa jejak.` — DM Sans Regular 42px, white 90%, x=140, y=530

**WA Inbox Mockup (KEY VISUAL):**
- Container: rounded rectangle 750px x 500px, fill white or `#111B21`, radius 16px, centered y=750
- 7 chat rows, each 750px x 65px with divider lines
- Each row: circle avatar (40px) + chat name (DM Sans Bold 28px) + preview (DM Sans Regular 24px gray) + notification badge (circle 30px, green with white number)

| # | Avatar | Name | Preview | Badge |
|---|--------|------|---------|-------|
| 1 | Blue | Grup Alumni SMA | Reunion tahun ini gimana... | (47) |
| 2 | Green | Keluarga Besar | Foto liburan kemarin... | (23) |
| 3 | Orange | Promo Shopee | Flash sale! Diskon 50%... | (12) |
| 4 | Yellow | Grup RT 05 | Iuran bulan ini... | (8) |
| 5 | Pink | Arisan Ibu-ibu | Giliran bulan depan... | (5) |
| 6 | Gray | Mama | Jangan lupa makan siang | (2) |
| 7 | **Dim** | **Bu Rina - Pesan nasi box** | **Kak mau order 50 pors...** | **(1)** |

- Last row (Bu Rina) at 50% opacity, barely visible — the visual punchline
- Optional: subtle red dotted outline around Bu Rina row

**Stat Callout Badge:** Rounded rectangle 700px x 70px, fill `#C0392B`, radius 12px, text `30-50% peluang transaksi hilang` Montserrat Bold 32px white, centered y=1300. Source: CRM.id.

**Slide Counter:** `4/7`

---

## SLIDE 5 — Mistake #4: "Customer nanya terus"

### Layout Blueprint

```
┌──────────────────────────────────┐
│ ▒▒▒▒▒ TOP AVOID 131px ▒▒▒▒▒▒▒▒ │
│                          "5/7"   │
│  ┌──┐                           │
│  │4 │ ← ORANGE badge (softer)   │
│  └──┘                           │
│  Customer nanya terus:          │
│  "Kak pesanan saya              │
│   gimana?"                      │
│  ────── orange divider          │
│  Kamu harus scroll 200 chat     │
│  buat cari jawabannya.          │
│  Capek, malu, dan pelanggan     │
│  makin gak percaya.             │
│                                  │
│  ┌────────────────────────────┐  │
│  │   REPEATING CHAT BUBBLES   │  │
│  │                            │  │
│  │  "Kak udah dikirim blm?"   │  │
│  │  "Kak pesanan saya yg mn?" │  │
│  │  "Kak kok blm diproses?"   │  │
│  │  "Kak status pesanan gmn?" │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  😩 (tired/overwhelmed icon)     │
│                                  │
│  Dan ada satu lagi yang          │
│  sering diabaikan...             │
│ ▒▒▒▒▒ BOTTOM AVOID 367px ▒▒▒▒▒ │
└──────────────────────────────────┘
```

### Nano Banana Pro Prompt

```
Create a TikTok carousel slide matching the dark green style, 9:16 vertical, 1080x1920px.

Medium dark green background (#344E41). Top-left: orange circle badge (#E67E22) with white "4". Below: bold white title with "Customer nanya terus:" on line 1, then in light gold italic (#F0E68C) quote "Kak pesanan saya gimana?" on lines 2-3. Below an orange divider line: white text "Kamu harus scroll 200 chat buat cari jawabannya. Capek, malu, dan pelanggan makin gak percaya." Center: four WhatsApp-style green incoming message bubbles stacked vertically, each saying a different complaint — "Kak udah dikirim belum?", "Kak pesanan saya yang mana ya?", "Kak kok belum diproses?", "Kak status pesanan gimana?". Below the bubbles: a small tired face emoji. Bottom: italic white text "Dan ada satu lagi yang sering diabaikan..." Top-right: white "5/7". No logo, no border.
```

**Iterative refinements:**

```
→ "The four chat bubbles should look like WhatsApp incoming messages — green rounded rectangles"
→ "Make them slightly faded/transparent to create a sense of overwhelming repetition"
→ "The customer quote in the title should be clearly different from the white text — use italic gold"
→ "Add bold emphasis on 'Capek, malu' in the consequence text"
```

### Element Specs (for Canva Polish)

**Background:** Solid fill `#344E41`

**Number Badge:** Circle 90px, fill `#E67E22` (ORANGE — tonal cool-down), text `4` Montserrat Bold 48px white, x=140, y=170

**Mistake Title:** `Customer nanya terus:\n"Kak pesanan saya\ngimana?"` — Montserrat Bold 68px white, quote part in italic light gold `#F0E68C`, x=140, y=280

**Orange Accent Divider:** 200px x 3px, `#E67E22`, x=140, y=520

**Consequence Text:** `Kamu harus scroll 200 chat buat cari jawabannya. Capek, malu, dan pelanggan makin gak percaya.` — DM Sans Regular 42px, white 90%, x=140, y=550. "Capek, malu" in bold.

**Repeating Chat Bubbles:**
- 4 incoming WA bubbles stacked vertically, 700px wide area, y=780
- Each: rounded rectangle 550px x 55px, left-aligned, fill `#E2F7CB` at 70% opacity, DM Sans Regular 28px dark gray, 12px spacing
- Content: `Kak udah dikirim belum?` / `Kak pesanan saya yang mana ya?` / `Kak kok belum diproses?` / `Kak status pesanan gimana?`

**Tired Icon:** 60px, centered y=1080

**Micro-Cliffhanger:** `Dan ada satu lagi yang sering diabaikan...` — DM Sans Regular 36px white italic, x=140, y=1160

**Slide Counter:** `5/7`

---

## SLIDE 6 — Mistake #5: "Hitung omzet manual tiap malam"

### Layout Blueprint

```
┌──────────────────────────────────┐
│ ▒▒▒▒▒ TOP AVOID 131px ▒▒▒▒▒▒▒▒ │
│                          "6/7"   │
│  ┌──┐                           │
│  │5 │ ← orange badge            │
│  └──┘                           │
│  Tiap malam hitung              │
│  omzet manual                   │
│  ────── orange divider          │
│  Kerja keras seharian tapi      │
│  gak pernah tau untung berapa.  │
│                                  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │      15 JAM/bulan          │  │
│  │     cuma buat hitung       │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌──────────┐  ┌──────────┐     │
│  │ 🕐 Clock │  │ 🔢 Calc  │     │
│  │  30-60   │  │  manual  │     │
│  │  menit   │  │  errors  │     │
│  └──────────┘  └──────────┘     │
│                                  │
│  Semua kesalahan ini punya satu  │
│  akar: gak punya sistem.        │
│ ▒▒▒▒▒ BOTTOM AVOID 367px ▒▒▒▒▒ │
└──────────────────────────────────┘
```

### Nano Banana Pro Prompt

```
Create a TikTok carousel slide matching the dark green style, 9:16 vertical, 1080x1920px.

Slightly lighter green background (#3A5A40). Top-left: orange circle badge (#E67E22) with white "5". Below: bold white title "Tiap malam hitung omzet manual". Below an orange divider: white text "Kerja keras seharian tapi gak pernah tau untung berapa." Center: large stat card — a rounded rectangle with subtle red border, inside it bold red text "15 JAM/bulan" very large, below it smaller white text "cuma buat hitung". Below the stat card: two small dark cards side by side — left card has a clock icon with "30-60 menit tiap malam", right card has a calculator icon with "Hitung manual sering salah". Bottom: italic white text "Semua kesalahan ini punya satu akar: gak punya sistem." with "gak punya sistem" in bold gold. Top-right: white "6/7". No logo, no border.
```

**Iterative refinements:**

```
→ "Make '15 JAM/bulan' the dominant visual — it should be screenshot-worthy on its own"
→ "The stat card should have a subtle red (#C0392B) border, not a filled background"
→ "Make the two small cards have darker green backgrounds (#2D3E36) than the slide background"
→ "The bridge text 'gak punya sistem' should be in bold gold (#F0E68C) for emphasis"
```

### Element Specs (for Canva Polish)

**Background:** Solid fill `#3A5A40` (slightly lighter — signals movement toward resolution)

**Number Badge:** Circle 90px, fill `#E67E22`, text `5` Montserrat Bold 48px white, x=140, y=170

**Mistake Title:** `Tiap malam hitung\nomzet manual` — Montserrat Bold 72px white, x=140, y=280

**Orange Accent Divider:** 200px x 3px, `#E67E22`, x=140, y=440

**Consequence Text:** `Kerja keras seharian tapi\ngak pernah tau untung berapa.` — DM Sans Regular 42px, white 90%, x=140, y=470

**Hero Stat "15 JAM/bulan" (Most Shareable Element):**
- Container: rounded rectangle 700px x 160px, no fill, `#C0392B` border 2px, radius 16px, centered y=600
- `15 JAM/bulan` — Montserrat Bold 72px, `#C0392B`
- `cuma buat hitung` — DM Sans Regular 36px, white 80%
- Both centered. This is the most screenshot-worthy element.

**Time + Calculator Icon Cards:**
- Two cards side by side, 330px each with 20px gap, centered y=800
- Left: rounded rectangle 330px x 130px, fill `#2D3E36`, clock icon 50px white, text `30-60 menit\ntiap malam` DM Sans Regular 28px white
- Right: rounded rectangle 330px x 130px, fill `#2D3E36`, calculator icon 50px white, text `Hitung manual\nsering salah` DM Sans Regular 28px white

**Bridge Text:** `Semua kesalahan ini punya satu akar:\ngak punya sistem.` — DM Sans Regular 38px white, "gak punya sistem" in bold gold `#F0E68C`, x=140, y=1140

**Slide Counter:** `6/7`

---

## SLIDE 7 — Solution / CTA (Relief)

### Layout Blueprint

```
┌──────────────────────────────────┐
│ ▒▒▒▒▒ TOP AVOID 131px ▒▒▒▒▒▒▒▒ │
│                          "7/7"   │
│                                  │
│  Gak perlu ngalamin             │
│  semua itu lagi.                │
│                                  │
│  Satu sistem, semua             │
│  terselesaikan:                 │
│                                  │
│  ✅ Catat pesanan otomatis      │
│     dari chat WA                │
│                                  │
│  ✅ Satu tempat — pisah         │
│     dari chat pribadi           │
│                                  │
│  ✅ Track status: Baru →        │
│     Diproses → Dikirim →        │
│     Selesai                     │
│                                  │
│  ✅ Rekap harian otomatis       │
│     — 0 menit                   │
│                                  │
│  ✅ Gratis untuk 150            │
│     pesanan pertama             │
│                                  │
│  ┌────────────────────────────┐  │
│  │ 🔖 Simpan checklist ini!  │  │
│  └────────────────────────────┘  │
│                                  │
│       [CatatOrder logo]         │
│        @catatorder              │
│   catat pesanan WA              │
│ ▒▒▒▒▒ BOTTOM AVOID 367px ▒▒▒▒▒ │
└──────────────────────────────────┘
```

### Nano Banana Pro Prompt

```
Create a TikTok carousel slide, 9:16 vertical, 1080x1920px. DRAMATIC style shift from dark to light.

Off-white clean background (#F8F9FA). Top: dark green (#1B4332) semi-bold text "Gak perlu ngalamin semua itu lagi." Below in gray: "Satu sistem, semua terselesaikan:" Then a checklist of 5 items, each with a green checkmark icon, dark text on the light background: "Catat pesanan otomatis dari chat WA", "Satu tempat — pisah dari chat pribadi", "Track status: Baru → Diproses → Dikirim → Selesai", "Rekap harian otomatis — 0 menit", "Gratis untuk 150 pesanan pertama". Below the checklist: a dark green outlined rounded button with bookmark icon and text "Simpan checklist ini!". Bottom: small gray text "@catatorder". Top-right: gray "7/7". Clean, minimal, professional. No decorations.
```

**Iterative refinements:**

```
→ "Make the background truly off-white, not pure white — it should feel warm and relieving"
→ "The checkmarks should be bright green (#16A34A), clearly visible"
→ "Add even spacing between checklist items — generous 50px gaps for easy scanning"
→ "The CTA button should have a subtle dark green tint background with dark green border"
```

**After AI generation — add in Canva:**
- CatatOrder logo PNG (centered, below CTA button)
- TikTok search keyword text `catat pesanan WA` at bottom

### Element Specs (for Canva Polish)

**Background:** Solid fill `#F8F9FA` (off-white — DRAMATIC shift from dark slides 1-6)

**Empathy Bridge:** `Gak perlu ngalamin\nsemua itu lagi.` — Montserrat SemiBold 52px, `#1B4332`, x=140, y=200

**Subtitle:** `Satu sistem, semua terselesaikan:` — DM Sans Regular 38px, `#6B7280`, x=140, y=340

**Checklist Items (5 items):**
- Start y=420, spacing 50px between items
- Green checkmark in `#16A34A`, 36px, x=140
- Text: DM Sans Regular 38px, `#111827`, x=190, max width 650px

| # | Text | Resolves Mistake |
|---|------|-----------------|
| 1 | Catat pesanan otomatis dari chat WA | #1 (siap kak) |
| 2 | Satu tempat — pisah dari chat pribadi | #3 (chat campur) |
| 3 | Track status: Baru → Diproses → Dikirim → Selesai | #4 (gak tracking) |
| 4 | Rekap harian otomatis — 0 menit | #5 (hitung manual) |
| 5 | Gratis untuk 150 pesanan pertama | Barrier removal |

**CTA Block:**
- Rounded rectangle 600px x 70px, fill `#1B4332` at 10% opacity, border 2px `#1B4332`, radius 16px, centered y=960
- Bookmark icon 36px + text `Simpan checklist ini!` Poppins SemiBold 36px `#1B4332`

**CatatOrder Logo:** PNG transparent, ~140px wide, bottom-center y=1100

**Handle:** `@catatorder` — DM Sans Regular 30px, `#9CA3AF`, centered y=1170

**TikTok Search Keywords:** `catat pesanan WA` — DM Sans Regular 28px, `#9CA3AF` 60% opacity, centered y=1210

**Slide Counter:** `7/7` — DM Sans Regular 32px, `#9CA3AF` (gray on white — inverted)

---

## Consistency Workflow — Generating All 7 Slides

### Recommended Order

```
1. Generate Slide 1 person cutout (Step 1) → save
2. Generate Slide 1 full slide (Step 2 with cutout reference) → save
3. Upload Slide 1 as STYLE REFERENCE for all remaining slides
4. Generate Slide 4 WA inbox mockup separately → save
5. Generate Slides 2, 3, 5, 6 (upload Slide 1 as style reference each time)
6. Generate Slide 4 full slide (upload inbox mockup + Slide 1 as references)
7. Generate Slide 7 LAST (intentional style break — no need for Slide 1 reference)
8. Open ALL 7 PNGs in Canva for final polish pass
```

### Style Reference Prompt (Use for Slides 2-6)

When uploading Slide 1 as reference:

```
Match the visual style of the reference image — same font treatment, same clean layout, same text hierarchy. Use the same dark green color family but with the background color specified in this prompt.
```

### Canva Final Polish Checklist

After all 7 slides are AI-generated:

- [ ] Fix any text rendering errors (misspellings, wrong characters)
- [ ] Ensure fonts match: League Gothic (numbers), Montserrat Bold (titles), DM Sans (body)
- [ ] Verify all text is within the safe zone (not in top 131px or bottom 367px)
- [ ] Add CatatOrder logo to Slide 7 (AI won't have your logo file)
- [ ] Check color accuracy against hex values
- [ ] Ensure consistent text sizes across all slides
- [ ] Add slide counters if AI missed any
- [ ] Adjust spacing/alignment for pixel-perfect consistency

---

## Asset Preparation (Before Starting AI Generation)

### Required Before Prompting

| Asset | Purpose | How to Get |
|-------|---------|-----------|
| Person photo (Slide 1) | Generate cutout OR use as reference | Take your own photo (best) OR generate with Step 1 prompt |
| CatatOrder logo PNG | Add to Slide 7 in Canva | Export from existing brand assets |

### Optional — Let AI Generate Instead

| Asset | Old Method (Canva) | New Method (Nano Banana) |
|-------|-------------------|------------------------|
| WA chat mockup (Slide 2) | Build manually with rectangles | AI generates from prompt |
| Messy notebook (Slide 3) | Take real photo or Canva stock | AI generates realistic version |
| WA inbox mockup (Slide 4) | Build 7 rows manually (~25 min) | AI generates from prompt (separate step) |
| Chat bubbles (Slide 5) | Build 4 rectangles manually | AI generates from prompt |
| Clock/calculator icons (Slide 6) | Search Canva elements | AI generates integrated with layout |

---

## Production Time Estimate (AI-First)

| Slide | AI Generation | Canva Polish | Total | Notes |
|:-----:|:------------:|:------------:|:-----:|-------|
| 1 | 8 min (2 steps + 2-3 iterations) | 5 min | **13 min** | Person cutout + full slide |
| 2 | 5 min (1 step + 1-2 iterations) | 3 min | **8 min** | WA chat mockup is AI-friendly |
| 3 | 5 min (1 step + 2 iterations) | 5 min | **10 min** | May need to swap in real CatatOrder screenshot |
| 4 | 10 min (2 steps + 3 iterations) | 5 min | **15 min** | WA inbox mockup is complex — generate separately |
| 5 | 5 min (1 step + 1 iteration) | 3 min | **8 min** | Repeating bubbles are simple for AI |
| 6 | 5 min (1 step + 2 iterations) | 3 min | **8 min** | Stat card + icon cards |
| 7 | 5 min (1 step + 2 iterations) | 5 min | **10 min** | Add logo in Canva |
| **Total** | **43 min** | **29 min** | **~72 min** | **33 min saved** vs Canva-only (was ~105 min) |

---

## Export & Upload Checklist

- [ ] Export all 7 slides as PNG from Canva (Download → PNG → All pages → Full quality)
- [ ] Verify each image is 1080 x 1920 px
- [ ] Check text readability at 50% zoom (simulates mobile viewing)
- [ ] Check safe zones — no important content in top 131px or bottom 367px
- [ ] Upload to TikTok → Photo Mode → select all 7 images in order
- [ ] Add trending sound (search TikTok trending sounds in Business/Education category)
- [ ] Paste caption (from caption section in tiktok-carousel-plan.md)
- [ ] Set cover image to Slide 1
- [ ] Post at Tuesday 11:30 WIB

---

*Production guide created: 2026-02-15*
*Updated to AI-first workflow (Gemini Nano Banana Pro): 2026-02-15*
