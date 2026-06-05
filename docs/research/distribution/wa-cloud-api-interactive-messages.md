# WhatsApp Cloud API: Interactive Messages & Flows Deep Dive

> Research for CatatOrder WA bot capabilities
> Last updated: 2026-02-13

---

## Table of Contents

1. [Interactive Reply Buttons](#1-interactive-reply-buttons)
2. [Interactive List Messages](#2-interactive-list-messages)
3. [WhatsApp Flows](#3-whatsapp-flows)
4. [Message Templates](#4-message-templates)
5. [Rich Message Types](#5-rich-message-types)
6. [Conversation Patterns for Order Bots](#6-conversation-patterns-for-order-bots)
7. [CatatOrder Implementation Recommendations](#7-catatorder-implementation-recommendations)

---

## 1. Interactive Reply Buttons

### Overview

Reply buttons let the recipient tap one of up to **3 buttons** to respond. Each button has a unique ID for backend routing. Buttons render natively in WhatsApp -- no typing required from the user.

### Complete JSON Payload

**Endpoint:** `POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages`

**Headers:**
```
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json
```

**Request Body:**
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "6281234567890",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "header": {
      "type": "text",
      "text": "Konfirmasi Pesanan #WO-20260213-0001"
    },
    "body": {
      "text": "Pesanan dari *Ibu Sari*:\n\n1. Nasi Goreng x2 — Rp30.000\n2. Es Teh x2 — Rp10.000\n\n*Total: Rp40.000*\n\nApakah pesanan sudah benar?"
    },
    "footer": {
      "text": "Dibuat dengan CatatOrder"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "confirm_order_WO001",
            "title": "Konfirmasi"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "edit_order_WO001",
            "title": "Ubah Pesanan"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "cancel_order_WO001",
            "title": "Batalkan"
          }
        }
      ]
    }
  }
}
```

### Character Limits

| Field | Max Length | Notes |
|-------|-----------|-------|
| `header.text` | 60 chars | Optional. Can also be image/video/document instead of text |
| `body.text` | **1,024 chars** | Required. Supports bold (*text*), italic (_text_), strikethrough (~text~), monospace (```text```) |
| `footer.text` | 60 chars | Optional |
| `action.buttons[].reply.title` | **20 chars** | Required. No emojis or markdown. Must be unique |
| `action.buttons[].reply.id` | **256 chars** | Required. Must be unique. Not visible to user |
| Number of buttons | **1-3** | Hard limit |

### Header Types

The header can be one of:
- `"type": "text"` -- text string (60 chars max)
- `"type": "image"` -- `{ "link": "https://..." }` or `{ "id": "MEDIA_ID" }`
- `"type": "video"` -- `{ "link": "https://..." }` or `{ "id": "MEDIA_ID" }`
- `"type": "document"` -- `{ "link": "https://...", "filename": "struk.pdf" }` or `{ "id": "MEDIA_ID" }`

### Webhook Payload (When User Taps a Button)

When a customer taps a reply button, WhatsApp sends this webhook:

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "628111222333",
              "phone_number_id": "PHONE_NUMBER_ID"
            },
            "contacts": [
              {
                "profile": { "name": "Ibu Sari" },
                "wa_id": "6281234567890"
              }
            ],
            "messages": [
              {
                "from": "6281234567890",
                "id": "wamid.ABGGFlCGg0cvAgo-sJQh43L5Pe4W",
                "timestamp": "1708300000",
                "type": "interactive",
                "interactive": {
                  "type": "button_reply",
                  "button_reply": {
                    "id": "confirm_order_WO001",
                    "title": "Konfirmasi"
                  }
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Key fields to parse:**
- `messages[0].type` === `"interactive"`
- `messages[0].interactive.type` === `"button_reply"`
- `messages[0].interactive.button_reply.id` -- your button ID for routing
- `messages[0].interactive.button_reply.title` -- the button label user saw

### CatatOrder Order Confirmation Example

```json
{
  "messaging_product": "whatsapp",
  "to": "6281234567890",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "header": {
      "type": "text",
      "text": "Pesanan Baru #WO-20260213-0042"
    },
    "body": {
      "text": "Dari: *Ibu Sari* (081234567890)\n\n1. Kue Lapis Legit x1 — Rp150.000\n2. Kue Nastar x2 box — Rp80.000\n3. Bolu Pandan x1 — Rp45.000\n\n*Subtotal: Rp275.000*\nDiskon: Rp0\n*Total: Rp275.000*\n\nStatus: Belum Bayar"
    },
    "footer": {
      "text": "Dibuat dengan CatatOrder — catatorder.id"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "PROSES_WO-20260213-0042",
            "title": "Proses Pesanan"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "BAYAR_WO-20260213-0042",
            "title": "Tandai Lunas"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "UBAH_WO-20260213-0042",
            "title": "Ubah"
          }
        }
      ]
    }
  }
}
```

---

## 2. Interactive List Messages

### Overview

List messages show a menu button that expands into a scrollable list of options organized in sections. Great for catalogs, order item selection, and multi-option menus. Maximum **10 rows** total across all sections.

### Complete JSON Payload

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "6281234567890",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "header": {
      "type": "text",
      "text": "Menu Pesanan"
    },
    "body": {
      "text": "Silakan pilih item yang ingin ditambahkan ke pesanan:"
    },
    "footer": {
      "text": "Ketik 'selesai' untuk checkout"
    },
    "action": {
      "button": "Lihat Menu",
      "sections": [
        {
          "title": "Kue Basah",
          "rows": [
            {
              "id": "KUE_LAPIS_50K",
              "title": "Kue Lapis Legit",
              "description": "Rp50.000/loyang — Original"
            },
            {
              "id": "KUE_NASTAR_40K",
              "title": "Nastar",
              "description": "Rp40.000/box — Isi 30 pcs"
            },
            {
              "id": "KUE_RISOL_35K",
              "title": "Risol Mayo",
              "description": "Rp35.000/box — Isi 20 pcs"
            }
          ]
        },
        {
          "title": "Kue Kering",
          "rows": [
            {
              "id": "KUE_PUTRI_45K",
              "title": "Putri Salju",
              "description": "Rp45.000/toples — 250gr"
            },
            {
              "id": "KUE_KASTENGEL_55K",
              "title": "Kastengel",
              "description": "Rp55.000/toples — 250gr"
            }
          ]
        },
        {
          "title": "Minuman",
          "rows": [
            {
              "id": "MINUM_ESTEH_5K",
              "title": "Es Teh Manis",
              "description": "Rp5.000 — Gelas"
            },
            {
              "id": "MINUM_KOPI_8K",
              "title": "Kopi Susu",
              "description": "Rp8.000 — Gelas"
            }
          ]
        }
      ]
    }
  }
}
```

### Character Limits

| Field | Max Length | Notes |
|-------|-----------|-------|
| `header.text` | 60 chars | Optional. Text only (no media in list messages) |
| `body.text` | **1,024 chars** | Required |
| `footer.text` | 60 chars | Optional |
| `action.button` | **20 chars** | Required. The button label that opens the list |
| `sections[].title` | **24 chars** | Required if >1 section |
| `sections[].rows[].id` | **200 chars** | Required. Unique. Not visible to user |
| `sections[].rows[].title` | **24 chars** | Required |
| `sections[].rows[].description` | **72 chars** | Optional |
| Max sections | **10** | |
| Max total rows | **10** | Across ALL sections combined |

### Webhook Payload (When User Selects a List Item)

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "628111222333",
              "phone_number_id": "PHONE_NUMBER_ID"
            },
            "contacts": [
              {
                "profile": { "name": "Ibu Sari" },
                "wa_id": "6281234567890"
              }
            ],
            "messages": [
              {
                "from": "6281234567890",
                "id": "wamid.ABGGFlCGg0cvAgo-sJQh43L5Pe4W",
                "timestamp": "1708300000",
                "type": "interactive",
                "interactive": {
                  "type": "list_reply",
                  "list_reply": {
                    "id": "KUE_LAPIS_50K",
                    "title": "Kue Lapis Legit",
                    "description": "Rp50.000/loyang — Original"
                  }
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Key fields to parse:**
- `messages[0].type` === `"interactive"`
- `messages[0].interactive.type` === `"list_reply"`
- `messages[0].interactive.list_reply.id` -- your row ID for routing
- `messages[0].interactive.list_reply.title` -- row title
- `messages[0].interactive.list_reply.description` -- row description (if provided)

### CatatOrder Use Case: Edit Order Items

When a customer taps "Ubah" on an order confirmation, send a list of current items for editing:

```json
{
  "messaging_product": "whatsapp",
  "to": "6281234567890",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "header": {
      "type": "text",
      "text": "Ubah Pesanan #WO-20260213-0042"
    },
    "body": {
      "text": "Pilih item yang ingin diubah atau hapus:"
    },
    "footer": {
      "text": "Dibuat dengan CatatOrder"
    },
    "action": {
      "button": "Lihat Item",
      "sections": [
        {
          "title": "Item Pesanan",
          "rows": [
            {
              "id": "EDIT_ITEM_1",
              "title": "Kue Lapis Legit x1",
              "description": "Rp150.000 — Ubah jumlah/hapus"
            },
            {
              "id": "EDIT_ITEM_2",
              "title": "Nastar x2 box",
              "description": "Rp80.000 — Ubah jumlah/hapus"
            },
            {
              "id": "EDIT_ITEM_3",
              "title": "Bolu Pandan x1",
              "description": "Rp45.000 — Ubah jumlah/hapus"
            },
            {
              "id": "ADD_ITEM",
              "title": "Tambah Item Baru",
              "description": "Tambahkan item ke pesanan"
            },
            {
              "id": "DONE_EDIT",
              "title": "Selesai",
              "description": "Konfirmasi pesanan akhir"
            }
          ]
        }
      ]
    }
  }
}
```

### Limitation: 10-Row Cap Workaround

If you have more than 10 items (e.g., a large menu), strategies include:
- **Pagination:** Include a "Selanjutnya >" row as the 10th item to load more
- **Categories first:** Show category list (Kue Basah, Kue Kering, Minuman), then show items within selected category
- **Search fallback:** If >10, ask user to type a keyword: "Ketik nama item yang dicari"

---

## 3. WhatsApp Flows

### What Are WhatsApp Flows?

WhatsApp Flows allow businesses to create **multi-screen, form-based experiences** natively inside WhatsApp. Think of them as mini web apps embedded in the chat -- users fill out forms, select options, upload files, and navigate between screens without leaving WhatsApp.

### How Flows Differ from Buttons/Lists

| Feature | Reply Buttons | List Messages | WhatsApp Flows |
|---------|--------------|---------------|----------------|
| Interaction | 1-tap selection | 1-tap from list | Multi-step forms |
| Screens | Single message | Single message | **Multiple screens** |
| Input types | Button tap only | List tap only | Text, number, email, phone, date, dropdown, checkbox, radio, file upload |
| Max options | 3 | 10 | Unlimited (across screens) |
| Validation | None | None | Pattern matching, required fields |
| Dynamic data | None | None | **Server endpoint for real-time data** |
| Complexity | Trivial | Easy | Medium-High |
| Template needed | No (within 24h window) | No (within 24h window) | **Yes** (CTA button launches Flow) |

### Flow JSON Structure

```json
{
  "version": "3.0",
  "data_api_version": "3.0",
  "routing_model": {},
  "screens": [
    {
      "id": "ORDER_FORM",
      "title": "Pesanan Baru",
      "data": [],
      "layout": {
        "type": "SINGLE_COLUMN",
        "children": [
          {
            "type": "text_heading",
            "text": "Detail Pesanan"
          },
          {
            "type": "form",
            "name": "order_form",
            "children": [
              {
                "type": "text_input",
                "name": "customer_name",
                "label": "Nama Pelanggan",
                "input_type": "TEXT",
                "required": true,
                "max_chars": 100
              },
              {
                "type": "text_input",
                "name": "customer_phone",
                "label": "No. WhatsApp",
                "input_type": "PHONE",
                "required": true
              },
              {
                "type": "text_area",
                "name": "items",
                "label": "Daftar Pesanan",
                "required": true,
                "max_length": 500
              },
              {
                "type": "dropdown",
                "name": "payment_method",
                "label": "Metode Bayar",
                "data_source": [
                  { "id": "cash", "title": "Tunai" },
                  { "id": "transfer", "title": "Transfer Bank" },
                  { "id": "qris", "title": "QRIS" }
                ]
              },
              {
                "type": "date_picker",
                "name": "delivery_date",
                "label": "Tanggal Pengiriman"
              }
            ]
          },
          {
            "type": "footer",
            "label": "Kirim Pesanan",
            "on_click_action": {
              "type": "data_exchange",
              "payload": {
                "customer_name": "${form.customer_name}",
                "customer_phone": "${form.customer_phone}",
                "items": "${form.items}",
                "payment_method": "${form.payment_method}",
                "delivery_date": "${form.delivery_date}"
              }
            }
          }
        ]
      }
    },
    {
      "id": "CONFIRMATION",
      "title": "Konfirmasi",
      "terminal": true,
      "data": [
        { "key": "order_number", "example": "WO-20260213-0001" },
        { "key": "total", "example": "Rp275.000" }
      ],
      "layout": {
        "type": "SINGLE_COLUMN",
        "children": [
          {
            "type": "text_heading",
            "text": "Pesanan Diterima!"
          },
          {
            "type": "text_body",
            "text": "Nomor pesanan: ${data.order_number}\nTotal: ${data.total}\n\nPesanan akan segera diproses."
          },
          {
            "type": "footer",
            "label": "Selesai",
            "on_click_action": {
              "type": "complete",
              "payload": {}
            }
          }
        ]
      }
    }
  ]
}
```

### Supported Components

| Component | Type | Notes |
|-----------|------|-------|
| `text_heading` | Display | Max 80 chars |
| `text_subheading` | Display | Max 80 chars |
| `text_body` | Display | Max 4,096 chars |
| `text_caption` | Display | Max 4,096 chars |
| `rich_text` | Display | Markdown support (v5.1+) |
| `text_input` | Input | Types: TEXT, NUMBER, EMAIL, PASSWORD, PASSCODE, PHONE |
| `text_area` | Input | Multi-line text |
| `dropdown` | Input | 1-200 items in data_source |
| `radio_button` | Input | Single selection |
| `checkbox` | Input | Multiple selection, min/max items |
| `opt_in` | Input | Consent checkbox |
| `date_picker` | Input | Calendar widget |
| `photo_picker` | Input | Camera/gallery upload |
| `document_picker` | Input | File upload |
| `image` | Display | ScaleType: FILL, FIT, STRETCH |
| `navigation_list` | Display | Rich list items with images (v6.2+) |
| `embedded_link` | Display | Clickable link (max 2 per screen) |
| `footer` | Action | Required on terminal screens. Submit button |

### Screen Constraints

- Max **50 components** per screen
- Max **5** OptIn elements per screen
- Max **2** EmbeddedLink per screen
- Max **2** NavigationList per screen
- Max **10** branches/navigation routes in routing_model
- `"SUCCESS"` is a reserved screen ID -- do not use

### Requirements

| Requirement | Detail |
|-------------|--------|
| Business verification | **Verified WhatsApp Business Account** required |
| Quality rating | Must maintain **high-quality rating** |
| Display name | Must be **approved** |
| API access | WhatsApp Business API (Cloud API) |
| Template | Flows launch from **pre-approved message templates** with CTA button |
| Endpoint (dynamic) | HTTPS server endpoint for `data_exchange` actions |
| Immutable after publish | Once published, **cannot be edited** -- must clone and create new version |

### Implementation Complexity

| Flow Type | Complexity | Description |
|-----------|------------|-------------|
| Static forms | Medium | No backend needed. Like Google Forms. Create via WhatsApp Manager UI or JSON |
| Dynamic forms | High | Requires HTTPS endpoint that responds to POST requests with screen data. Real-time validation, conditional logic, database queries |
| Multi-screen with branching | High | Conditional navigation, data passing between screens, complex routing_model |

### Availability

- Available to **all businesses with verified WABA** (WhatsApp Business Account)
- Works via **WhatsApp Cloud API** (no On-Premises API support -- On-Premises sunset Oct 23, 2025)
- Can be created via **WhatsApp Manager UI** (no-code) or **Flows API** (programmatic)
- Available in **Indonesia** and all WhatsApp Business API supported countries
- **Free to create** -- costs are per-message (template message pricing applies when initiating a Flow)

### CatatOrder Assessment

**Verdict: Not recommended for Phase 1.**

Reasons:
- Requires verified WABA (CatatOrder currently uses Fonnte, not official Cloud API)
- Template approval needed for every Flow launch
- Cannot edit published Flows
- High implementation complexity for dynamic order forms
- Better suited for Phase 2 when CatatOrder has enough volume to justify official WABA setup

**Better Phase 1 approach:** Interactive buttons + list messages via Cloud API (or continue with wa.me deep links + Fonnte for server-side sends).

---

## 4. Message Templates

### Overview

Templates are **pre-approved message formats** required for initiating conversations outside the 24-hour customer service window. They must be submitted to Meta for review before use.

### Template Categories

| Category | Purpose | Examples | Pricing (Jul 2025+) |
|----------|---------|----------|---------------------|
| **UTILITY** | Transactional updates | Order confirmations, shipping updates, payment receipts | Free within 24h service window; per-message otherwise (volume discounts available) |
| **MARKETING** | Promotions | Sales announcements, product launches, re-engagement | Always per-message (no volume discounts). Indonesia: ~$0.0432/msg |
| **AUTHENTICATION** | Security | OTP codes, login verification | Per-message (volume discounts available) |

### Creating a Template (API)

**Endpoint:** `POST https://graph.facebook.com/v21.0/{WABA_ID}/message_templates`

```json
{
  "name": "order_confirmation_id",
  "language": "id",
  "category": "UTILITY",
  "components": [
    {
      "type": "HEADER",
      "format": "TEXT",
      "text": "Pesanan {{1}} Diterima"
    },
    {
      "type": "BODY",
      "text": "Halo {{1}}, pesanan Anda #{{2}} senilai {{3}} sudah diterima.\n\nItem:\n{{4}}\n\nStatus: {{5}}\n\nTerima kasih telah berbelanja!"
    },
    {
      "type": "FOOTER",
      "text": "Dibuat dengan CatatOrder"
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "QUICK_REPLY",
          "text": "Lihat Detail"
        },
        {
          "type": "QUICK_REPLY",
          "text": "Hubungi Penjual"
        },
        {
          "type": "URL",
          "text": "Lacak Pesanan",
          "url": "https://catatorder.id/track/{{1}}"
        }
      ]
    }
  ]
}
```

### Template with CTA Buttons Example

```json
{
  "name": "payment_reminder_id",
  "language": "id",
  "category": "UTILITY",
  "components": [
    {
      "type": "HEADER",
      "format": "TEXT",
      "text": "Pengingat Pembayaran"
    },
    {
      "type": "BODY",
      "text": "Halo {{1}}, pesanan #{{2}} senilai *{{3}}* belum dibayar.\n\nSisa tagihan: *{{4}}*\nJatuh tempo: {{5}}\n\nSegera lakukan pembayaran."
    },
    {
      "type": "FOOTER",
      "text": "CatatOrder — catatorder.id"
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "URL",
          "text": "Bayar Sekarang",
          "url": "https://catatorder.id/pay/{{1}}"
        },
        {
          "type": "PHONE_NUMBER",
          "text": "Hubungi Toko",
          "phone_number": "+628111222333"
        }
      ]
    }
  ]
}
```

### Sending a Template Message

```json
{
  "messaging_product": "whatsapp",
  "to": "6281234567890",
  "type": "template",
  "template": {
    "name": "order_confirmation_id",
    "language": {
      "code": "id"
    },
    "components": [
      {
        "type": "header",
        "parameters": [
          { "type": "text", "text": "#WO-20260213-0042" }
        ]
      },
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Ibu Sari" },
          { "type": "text", "text": "WO-20260213-0042" },
          { "type": "text", "text": "Rp275.000" },
          { "type": "text", "text": "1. Kue Lapis x1\n2. Nastar x2\n3. Bolu x1" },
          { "type": "text", "text": "Baru" }
        ]
      },
      {
        "type": "button",
        "sub_type": "quick_reply",
        "index": 0,
        "parameters": [
          { "type": "payload", "payload": "VIEW_ORDER_WO-20260213-0042" }
        ]
      },
      {
        "type": "button",
        "sub_type": "quick_reply",
        "index": 1,
        "parameters": [
          { "type": "payload", "payload": "CONTACT_SELLER" }
        ]
      },
      {
        "type": "button",
        "sub_type": "url",
        "index": 2,
        "parameters": [
          { "type": "text", "text": "WO-20260213-0042" }
        ]
      }
    ]
  }
}
```

### Button Types in Templates

| Button Type | Max per Template | Description |
|-------------|-----------------|-------------|
| `QUICK_REPLY` | 3 | User taps to send a pre-set payload back to your webhook |
| `URL` | 2 | Opens a URL. Supports 1 dynamic variable at end of URL |
| `PHONE_NUMBER` | 1 | Opens phone dialer with pre-filled number |
| `COPY_CODE` | 1 | Copies a code to clipboard (for promo codes) |
| **Total buttons** | **Max 3** per template (mix of types, but max 3 total) |

### Template Variable Rules

- Variables use `{{1}}`, `{{2}}`, `{{3}}` format (positional)
- Header: max 1 variable
- Body: unlimited variables
- URL button: max 1 variable (appended to URL)
- Must provide **sample values** when submitting for review
- Language code must exactly match template text language

### Approval Process

| Step | Detail |
|------|--------|
| Submit | Via API (`POST /message_templates`) or WhatsApp Manager UI |
| Review | Automated ML review first; edge cases get human review |
| Typical time | **Minutes to 24 hours** (most utility templates: < 1 hour) |
| Max time | Up to 48 hours for complex/marketing templates |
| Rejection reasons | Policy violations, unclear purpose, misleading content, wrong category |
| Limit | **250 templates** per WABA |
| Re-submission | Can edit and resubmit rejected templates |

### Template Character Limits

| Component | Max Length |
|-----------|-----------|
| Template name | 512 chars (lowercase, underscores, no spaces) |
| Header text | 60 chars |
| Body text | 1,024 chars |
| Footer text | 60 chars |
| Button text | 25 chars |
| URL button URL | 2,000 chars |

---

## 5. Rich Message Types

### Location Messages

For delivery address collection or store location sharing:

```json
{
  "messaging_product": "whatsapp",
  "to": "6281234567890",
  "type": "location",
  "location": {
    "latitude": -6.200000,
    "longitude": 106.816666,
    "name": "Toko Kue Ibu Sari",
    "address": "Jl. Raya Kebayoran No. 42, Jakarta Selatan"
  }
}
```

**Constraints:**
- `latitude`: -90 to 90 (required)
- `longitude`: -180 to 180 (required)
- `name`: optional, location label
- `address`: optional, street address

**Use case:** Send store location for pickup orders; request customer to share location for delivery.

### Contact Messages

For sharing business contact cards:

```json
{
  "messaging_product": "whatsapp",
  "to": "6281234567890",
  "type": "contacts",
  "contacts": [
    {
      "name": {
        "formatted_name": "Toko Kue Ibu Sari",
        "first_name": "Toko Kue",
        "last_name": "Ibu Sari"
      },
      "phones": [
        {
          "phone": "+6281234567890",
          "type": "WORK",
          "wa_id": "6281234567890"
        }
      ],
      "emails": [
        {
          "email": "tokokuebusari@gmail.com",
          "type": "WORK"
        }
      ],
      "addresses": [
        {
          "street": "Jl. Raya Kebayoran No. 42",
          "city": "Jakarta Selatan",
          "state": "DKI Jakarta",
          "zip": "12160",
          "country": "Indonesia",
          "country_code": "ID",
          "type": "WORK"
        }
      ],
      "urls": [
        {
          "url": "https://catatorder.id",
          "type": "WORK"
        }
      ]
    }
  ]
}
```

### Image Messages with Captions

```json
{
  "messaging_product": "whatsapp",
  "to": "6281234567890",
  "type": "image",
  "image": {
    "link": "https://example.com/receipt-WO-20260213-0042.png",
    "caption": "Struk Pesanan #WO-20260213-0042\nTotal: Rp275.000\nStatus: Lunas\n\nTerima kasih, Ibu Sari!"
  }
}
```

**Constraints:**
- Supported formats: JPEG, PNG
- Max file size: **5 MB**
- Caption: optional, supports formatting (bold, italic, etc.)
- Can use `link` (URL) or `id` (pre-uploaded Media ID)
- Captions are **NOT supported** in interactive messages or templates (only standalone image messages)

### Document Messages

For sending receipts, invoices, or order summaries as PDF/Excel:

```json
{
  "messaging_product": "whatsapp",
  "to": "6281234567890",
  "type": "document",
  "document": {
    "link": "https://example.com/invoice-WO-20260213-0042.pdf",
    "caption": "Invoice Pesanan #WO-20260213-0042",
    "filename": "Invoice-WO-20260213-0042.pdf"
  }
}
```

**Constraints:**
- Supported formats: PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT
- Max file size: **100 MB**
- `filename`: required for proper display (only document messages have this field)
- `caption`: optional

### Video Messages

```json
{
  "messaging_product": "whatsapp",
  "to": "6281234567890",
  "type": "video",
  "video": {
    "link": "https://example.com/tutorial.mp4",
    "caption": "Tutorial: Cara catat pesanan di CatatOrder"
  }
}
```

**Constraints:**
- Supported formats: MP4, 3GPP
- Max file size: **16 MB**
- Only H.264 and AAC codecs

### Audio Messages

```json
{
  "messaging_product": "whatsapp",
  "to": "6281234567890",
  "type": "audio",
  "audio": {
    "link": "https://example.com/voice-note.ogg"
  }
}
```

**Constraints:**
- Supported formats: AAC, AMR, MP3, MP4, OGG (OPUS codec only)
- Max file size: **16 MB**
- No caption support

### Reaction Messages

React to a specific message with an emoji:

```json
{
  "messaging_product": "whatsapp",
  "to": "6281234567890",
  "type": "reaction",
  "reaction": {
    "message_id": "wamid.ABGGFlCGg0cvAgo-sJQh43L5Pe4W",
    "emoji": "\u2705"
  }
}
```

**Key points:**
- `message_id`: the `wamid.*` ID of the message to react to (required)
- `emoji`: any single emoji character (required)
- Set `emoji` to `""` (empty string) to **remove** a reaction
- Reaction messages do **not** support read receipts
- Great for lightweight acknowledgments (e.g., react with a checkmark when order is processed)

**CatatOrder use case:** When an order is confirmed, react to the original order message with a checkmark. When shipped, react with a truck emoji.

---

## 6. Conversation Patterns for Order Bots

### Order Confirmation Flow (Best Practice)

```
Customer sends WA chat:
  "Bu, pesan nasi goreng 2, mie ayam 3, es teh 5"
          │
          ▼
Bot parses with AI (Gemini) and responds with REPLY BUTTONS:
  ┌─────────────────────────────────────┐
  │ Konfirmasi Pesanan #WO-20260213-001 │
  │                                     │
  │ Pesanan dari *Ibu Sari*:            │
  │ 1. Nasi Goreng x2 — Rp30.000       │
  │ 2. Mie Ayam x3 — Rp45.000          │
  │ 3. Es Teh x5 — Rp25.000            │
  │                                     │
  │ *Total: Rp100.000*                  │
  │                                     │
  │ [Konfirmasi] [Ubah] [Batalkan]      │
  └─────────────────────────────────────┘
          │
     ┌────┼────┐
     ▼    ▼    ▼
  Konfirmasi  Ubah   Batalkan
     │         │        │
     ▼         ▼        ▼
  Save to    LIST     Cancel
  database   MSG      message
  + send     with     + cleanup
  receipt    items
```

### Multi-Step Conversation Design

**Principle: Minimize steps, maximize structure.**

```
Step 1: Customer sends free-text order (or taps menu)
Step 2: Bot parses and shows confirmation (REPLY BUTTONS: Konfirmasi/Ubah/Batal)
Step 3a: If "Konfirmasi" → Save order + send receipt + react with checkmark
Step 3b: If "Ubah" → Show LIST MESSAGE with items → customer selects → edit flow
Step 3c: If "Batalkan" → Confirm cancellation (REPLY BUTTONS: Ya/Tidak)
Step 4: Follow-up payment status (REPLY BUTTONS: Sudah Bayar/Nanti)
```

### Error Recovery Patterns

When the customer says something unexpected:

```
Customer: "gimana ya bu pesanan saya"
                  │
                  ▼
Bot (fallback):
  ┌─────────────────────────────────────┐
  │ Maaf, saya belum mengerti.          │
  │ Silakan pilih:                      │
  │                                     │
  │ [Cek Pesanan] [Pesan Baru] [Bantuan]│
  └─────────────────────────────────────┘
```

**Key patterns:**
1. **Always provide structured options** as fallback (never leave user stuck)
2. **Repeat the last question** if input doesn't match expected format
3. **Escalation path:** "Ketik 'cs' untuk bicara langsung dengan penjual"
4. **Timeout handling:** If no response in 1 hour, send gentle reminder; after 24 hours, close conversation

### Handling "Ubah" (Edit) After Confirmation

This is the most complex interaction. Recommended pattern:

```
Customer taps "Ubah"
        │
        ▼
Bot sends LIST MESSAGE:
  ┌─────────────────────────────┐
  │ Pilih yang ingin diubah:    │
  │                             │
  │ [Lihat Item]                │
  │  ├── Nasi Goreng x2 (ubah) │
  │  ├── Mie Ayam x3 (ubah)    │
  │  ├── Es Teh x5 (ubah)      │
  │  ├── + Tambah Item          │
  │  └── Selesai Ubah           │
  └─────────────────────────────┘
        │
Customer selects "Nasi Goreng x2"
        │
        ▼
Bot sends REPLY BUTTONS:
  ┌─────────────────────────────┐
  │ Nasi Goreng x2 — Rp30.000  │
  │                             │
  │ Mau diapakan?               │
  │                             │
  │ [Ubah Jumlah] [Hapus] [Batal]│
  └─────────────────────────────┘
        │
Customer taps "Ubah Jumlah"
        │
        ▼
Bot: "Berapa jumlah baru untuk Nasi Goreng?"
        │
Customer: "3"
        │
        ▼
Bot: Updated confirmation with REPLY BUTTONS
  ┌─────────────────────────────────────┐
  │ Pesanan diperbarui:                 │
  │ 1. Nasi Goreng x3 — Rp45.000 ← ubah│
  │ 2. Mie Ayam x3 — Rp45.000          │
  │ 3. Es Teh x5 — Rp25.000            │
  │                                     │
  │ *Total: Rp115.000*                  │
  │                                     │
  │ [Konfirmasi] [Ubah Lagi] [Batalkan] │
  └─────────────────────────────────────┘
```

### Daily Recap via Bot

```json
{
  "messaging_product": "whatsapp",
  "to": "6281234567890",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "header": {
      "type": "text",
      "text": "Rekap Harian — 13 Feb 2026"
    },
    "body": {
      "text": "Pesanan hari ini: *12*\nTotal penjualan: *Rp1.450.000*\nBelum dibayar: *Rp350.000* (3 pesanan)\nPelanggan baru: *2*\n\nPesanan terbanyak: Kue Lapis (5x)"
    },
    "footer": {
      "text": "Dibuat dengan CatatOrder — catatorder.id"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "VIEW_UNPAID",
            "title": "Lihat Belum Bayar"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "SEND_REMINDERS",
            "title": "Kirim Pengingat"
          }
        }
      ]
    }
  }
}
```

### Payment Reminder Pattern

```json
{
  "messaging_product": "whatsapp",
  "to": "6281234567890",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": {
      "text": "Halo Ibu Sari,\n\nPesanan #WO-20260213-0042 senilai *Rp275.000* belum dilunasi.\n\nSudah dibayar: Rp100.000 (DP)\nSisa: *Rp175.000*\n\nMohon segera lakukan pembayaran. Terima kasih!"
    },
    "footer": {
      "text": "Dibuat dengan CatatOrder — catatorder.id"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "PAID_WO042",
            "title": "Sudah Bayar"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "LATER_WO042",
            "title": "Nanti"
          }
        }
      ]
    }
  }
}
```

---

## 7. CatatOrder Implementation Recommendations

### Phase 1: Current State (Fonnte + wa.me Deep Links)

What CatatOrder has today:
- **Fonnte** for server-side WA sends (payment reminders, daily recaps, onboarding drip)
- **wa.me deep links** for client-initiated shares (order confirmation, receipt, etc.)
- Text-only messages with formatting (bold, italic, line breaks)

**Limitation:** No interactive elements. All messages are plain text. Users cannot tap to respond -- they must manually type or the link pre-fills a text message.

### Phase 2: WhatsApp Cloud API (Interactive Messages)

**When:** After first 50-100 active users justify the migration cost.

**What to implement first:**
1. **Reply buttons on order confirmations** -- Konfirmasi / Ubah / Batalkan
2. **Reply buttons on payment reminders** -- Sudah Bayar / Nanti
3. **Reply buttons on daily recaps** -- Lihat Belum Bayar / Kirim Pengingat
4. **List messages for order editing** -- show items for modification
5. **Reaction messages** -- react to original order when status changes

**Migration requirements:**
- Register for **WhatsApp Cloud API** (free via Meta Developer portal)
- Get a **dedicated phone number** for the business (not personal WA)
- Complete **Meta Business Verification** (24-72 hours)
- Set up **webhook endpoint** to receive button/list replies
- Migrate from Fonnte to Cloud API send endpoint
- Implement **conversation state machine** in backend (track which step each customer is in)

**Estimated effort:** 3-5 days for basic interactive messages.

### Phase 3: WhatsApp Flows (Optional, Future)

**When:** After 500+ active users, if order entry conversion is low.

**What to implement:**
- Structured order entry form (name, phone, items, delivery date, payment method)
- Customer feedback form
- Product catalog browser

**Not recommended until:**
- CatatOrder has enough volume to justify WABA verification
- Template approval process is familiar
- Backend infrastructure is ready for Flow data exchange endpoints

### API Comparison: Fonnte vs Cloud API

| Feature | Fonnte | WhatsApp Cloud API |
|---------|--------|--------------------|
| Setup | API key only | WABA verification + phone number |
| Interactive messages | Not supported | Reply buttons, lists, products |
| Templates | Not needed | Required for business-initiated |
| Webhooks | Basic | Full (message status, button clicks) |
| Cost | Per-message (Fonnte pricing) | Per-message (Meta pricing: ~Rp680/utility msg in ID) |
| Branding | Custom footer in text | Official business profile |
| Reliability | Third-party | Direct Meta API |
| Rate limits | Fonnte limits | Tier-based (1K-unlimited/day) |
| Green checkmark | Not possible | Available with verified business |

### Complete Character Limits Reference

| Message Type | Field | Max Length |
|-------------|-------|-----------|
| **Text message** | body | 4,096 chars |
| **Interactive (button/list)** | header.text | 60 chars |
| **Interactive (button/list)** | body.text | 1,024 chars |
| **Interactive (button/list)** | footer.text | 60 chars |
| **Reply button** | title | 20 chars |
| **Reply button** | id | 256 chars |
| **Reply buttons** | count | 1-3 |
| **List** | action.button (menu label) | 20 chars |
| **List** | section title | 24 chars |
| **List** | row title | 24 chars |
| **List** | row description | 72 chars |
| **List** | row id | 200 chars |
| **List** | total rows | 10 |
| **List** | total sections | 10 |
| **Template** | name | 512 chars (lowercase, underscores) |
| **Template** | header text | 60 chars |
| **Template** | body text | 1,024 chars |
| **Template** | footer text | 60 chars |
| **Template** | button text | 25 chars |
| **Template** | URL in button | 2,000 chars |
| **Template** | max buttons | 3 |
| **Template** | max quick_reply | 3 |
| **Template** | max URL buttons | 2 |
| **Template** | max phone buttons | 1 |
| **Image** | file size | 5 MB |
| **Document** | file size | 100 MB |
| **Video** | file size | 16 MB |
| **Audio** | file size | 16 MB |
| **Sticker (static)** | file size | 100 KB (512x512px) |
| **Sticker (animated)** | file size | 500 KB (512x512px) |

---

## Sources

- [WhatsApp Business Platform Node.js SDK - Interactive Messages](https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/messages/interactive/)
- [YCloud WhatsApp Messaging Examples](https://docs.ycloud.com/reference/whatsapp-messaging-examples)
- [WhatsApp Cloud API Postman Collection](https://www.postman.com/meta/whatsapp-business-platform/collection/wlk6lh4/whatsapp-cloud-api)
- [Picky Assist - WhatsApp Character Limits](https://help.pickyassist.com/general-guidelines/character-limits-whatsapp)
- [WhatsApp Flows Complete Guide 2025 (Sanoflow)](https://sanoflow.io/en/collection/whatsapp-business-api/whatsapp-flows-complete-guide/)
- [PyWA Flow JSON Documentation](https://pywa.readthedocs.io/en/latest/content/flows/flow_json.html)
- [Meta - How to Manage Message Templates](https://business.whatsapp.com/blog/manage-message-templates-whatsapp-business-api)
- [WhatsApp Business Platform Pricing](https://business.whatsapp.com/products/platform-pricing)
- [WhatsApp API Pricing July 2025 Changes](https://www.eesel.ai/blog/whatsapp-business-api-latest-pricing-and-policy-changes)
- [360dialog - Interactive Messages](https://docs.360dialog.com/docs/waba-messaging/interactive-messages)
- [Infobip - WhatsApp Interactive Buttons](https://www.infobip.com/blog/how-to-use-whatsapp-interactive-buttons)
- [Infobip - Build WhatsApp Flows](https://www.infobip.com/docs/whatsapp/whatsapp-flows/build-whatsapp-flows)
- [WhatsApp Template Categories Guide (Sanuker)](https://sanuker.com/guideline-to-whatsapp-template-message-categories/)
- [MessageBlink - Template Compliance & Approvals](https://www.messageblink.com/whatsapp-template-compliance-waba-approvals/)
- [Cognigy - WhatsApp Message Types and Payload Examples](https://support.cognigy.com/hc/en-us/articles/5326454286108-WhatsApp-Endpoint-Message-Types-and-Payload-Examples)
- [Vonage - WhatsApp Reaction Messages](https://developer.vonage.com/en/messages/code-snippets/whatsapp/send-reaction)
- [WuSeller - WhatsApp Flows Use Cases 2025](https://www.wuseller.com/blog/whatsapp-flows-in-2025-what-they-are-and-12-high-converting-use-cases/)
