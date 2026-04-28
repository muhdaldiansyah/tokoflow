# Smoke Test Daily Tracking Template

> Copy this file as `tracking-day-NN.md` for each day of the 2-week test. Fill in throughout the day, finalize at end of day.

---

## Day [NN] — [Date]

**Merchant**: [Anonymized ID, e.g. M1]
**Day of week**: [Senin/Selasa/Rabu/Kamis/Jumat/Sabtu/Minggu]
**Special context**: [Holiday? Pre-Raya rush? Hari Sepi? Normal?]

---

## Time tracking

**Total hours Aldi spent today on this merchant**: ___ hours ___ min

Breakdown:

| Task category | Time | Count |
|---|---|---|
| Payment matching | ___ min | ___ items |
| Invoice generation | ___ min | ___ items |
| Status update sending | ___ min | ___ items |
| Stock tracking | ___ min | ___ items |
| Customer memory updates | ___ min | ___ items |
| Reply drafts (Foreground Assist) | ___ min | ___ drafts |
| Pattern surfacing alerts | ___ min | ___ alerts |
| Complaint draft handling | ___ min | ___ drafts |
| Merchant communication / questions | ___ min | n/a |
| Errors + recovery | ___ min | ___ incidents |
| **Total** | **___ min** | |

**Volume context**: merchant processed ___ orders today.

**Aldi-time-per-order**: ___ min (target: trending toward <5 min/order to validate AI scope)

---

## Background Twin actions (autonomous)

For each task type, count + flag any errors:

### Payment matching
- Total: ___ events
- Correctly matched: ___
- Errors / wrong match: ___ → describe: 
- Ambiguous (couldn't auto-match): ___ → escalated to merchant: yes / no

### Invoice generation
- Total: ___
- Sent automatically: ___
- Held for merchant review: ___
- Errors: ___ → describe:

### Status update sending
- Total: ___
- Sent on merchant's "siap" trigger: ___
- Errors / wrong customer / wrong message: ___

### Stock tracking
- Stock alerts triggered today: ___
- Stock-zero auto-disable triggered: ___

### Customer memory updates
- New customer profiles created: ___
- Existing customer updates: ___
- Loyalty patterns flagged: ___

---

## Foreground Assist drafts (suggested, merchant decides)

| Metric | Count |
|---|---|
| Total drafts sent to merchant | ___ |
| Approved without edit | ___ (target: >70%) |
| Edited then sent | ___ |
| Rejected (merchant wrote own) | ___ |
| Pattern alerts surfaced | ___ |
| Complaint drafts | ___ |

**Approve-rate today**: ___% (cumulative across days: ___%)

**Edits made by merchant** — capture verbatim 2-3 examples to learn voice:

1. _Aldi draft_: "..."
   _Merchant edit_: "..."
   _Why_:

2. _Aldi draft_: "..."
   _Merchant edit_: "..."
   _Why_:

---

## Trust signals

### From merchant

- Did merchant question any of my actions today? (Y/N) → Describe:
- Did merchant override any decision? (Y/N) → Describe:
- Did merchant proactively share more info / context with me today? (Y/N) → Describe:
- Did merchant express relief / frustration / surprise? Capture quotes:

### From customers

**Critical surveillance question**: did any customer act differently today?

- Did any customer ask "kenapa balasan kamu rasa lain hari ni?" or similar? (Y/N) → Describe:
- Did any customer go silent / not return after a Foreground Assist draft was sent? (Y/N) → Note:
- Did any customer compliment merchant on quick reply / good service today? (Y/N) → Note: (potential positive signal — merchant feels less burdened, replies feel more present)
- Any complaints today? (Y/N) → Describe + how handled:

---

## Errors I (Aldi) made

Be honest. Each error is a future AI bug we're identifying cheaply.

1. **Error**: 
   **Impact**: 
   **What an AI version would do differently**:

2. **Error**: 
   **Impact**: 
   **What an AI version would do differently**:

---

## Surprises / unexpected observations

Things I didn't predict:

1. 
2. 
3. 

---

## Three-Tier observation

**Tier 1 (Pure Craft) signals**:
- Did merchant mention craft / cooking time today? Quote:
- Did merchant seem more / less stressed about craft today?

**Tier 2 (Customer Relationship) signals**:
- Did merchant engage with any customer in a way that felt valuable to them (vs burdensome)?
- Did Foreground Assist draft feel like *helpful* vs *intrusive*?

**Tier 3 (Mechanical Residue) signals**:
- What residue did Background Twin remove today that merchant didn't notice?
- What residue did merchant explicitly thank me for handling?

---

## End-of-day merchant check-in (verbatim or paraphrased)

> Voice note exchange or chat:

Merchant: "..."
Aldi: "..."

---

## Aldi's self-rating (1-10)

- **Sustainability**: how sustainable is this volume of work? ___ (10 = could do this for 100 merchants in parallel; 1 = exhausted by this 1 merchant alone)
- **Quality of drafts**: ___ (vs my own intuitive merchant voice)
- **Architectural validation**: ___ (does the 2-layer pattern feel right today, or strained?)

**One thing I'd change in the architecture if I had to redesign tomorrow**:

---

*Day NN of 14 · See [README.md](./README.md) for protocol overview*
