# Cycle 002 — Jobs Review

You scored yourselves 9.4/10. That's the first lie. Let me cut.

## 1. Where it's still software-y / feature-listy

- *"orders, customers, payments, inventory, reminders"* — five nouns in one sentence. You're listing CRUD modules with a microphone glued on. A merchant doesn't think "I have an inventory module."
- *"Lists exist only as voice-queryable views"* — you preserved the lists. You just changed the input. Coward's pivot.
- *"Pricing (proposed): Free / Pro RM 49 / Business RM 99 ... staff accounts, multi-outlet, accounting export, API access"* — API access? On a voice diary for mompreneurs? Are you building for Bu Aisyah or for the procurement department of Petronas?
- *"4 compounding loops"*, *"voice corpus moat"*, *"workflow IP"* — investor deck vocabulary. None of this is in the product. Cut it from the bible. It leaks.
- *"Tier 1 / Tier 2 / Tier 3"*, *"Audio-Diary is the new mechanism for Tier 3"* — you said this is internal. Then why is it in the customer positioning doc? Internal docs don't need this much scaffolding either. The framework has become the comfort blanket.
- *"50 events/month"* — "events." That's a Mixpanel word.

## 2. DELETE these — you're attached, get over it

1. **The Three-Tier table.** Useful in 2025. Now it's training wheels. The product either feels right or it doesn't. You don't need a 3-row matrix to ship.
2. **Pricing tiers in the positioning doc.** RM 49 / RM 99 is not positioning. It's a SKU sheet. Pricing belongs nowhere near the magic moment.
3. **The "What we PRESERVE / What we KILL" lists.** This is changelog, not product. Cut both. The doc should read like the product is the only thing that ever existed.
4. **"4 compounding loops."** Defensibility-by-PowerPoint. Replace with one sentence or none.
5. **The Refuse list of 10.** Ten is too many. The first three are the brand. The other seven are a manifesto nobody finishes reading.

## 3. Magic Moment — "Saya cakap, dia catat semua."

Almost. *"I talk, it records"* describes a dictaphone. Grandma had one in 1978. The gasp isn't recording — it's that **she walked away from a lunch rush, said one paragraph, and the day was DONE.** The receipts are sent. Aishah got her WhatsApp. Stock is reordered. Pak Lee is on Saturday's calendar. **The merchant didn't do admin — admin disappeared while she talked about her day.**

Reframe: not "I talk, it records." Reframe: **"I told someone about my afternoon and the afternoon filed itself."**

That's the gasp. Yours is still useful.

## 4. The 60-second demo

47 seconds, fine. But it ends on *"She taps send."* You closed on a tap. You should close on **the customer's reply landing on her screen** — *"Terima kasih kak, dah dapat resit"* — proof the loop closed without her doing the loop. Right now the demo demos competence. End on the world responding to her, not her sending into it.

Also delete the bullet list of receipts on screen. Don't show the system thinking. Show her shoulders drop. Show her put the phone down and pick up a cake.

## 5. The voice metaphor — comfort-zone choice?

Yes. Voice is right but you framed it as **input modality**. That's safe. The real metaphor is **confession / tukang dengar / pillow-talk-with-the-shop**. Voice notes already dominate WhatsApp in MY — merchants leave voice notes for HUSBANDS, not for software. You're not replacing forms. You're replacing the *anak yang tolong jaga buku* she never had. Position it as a presence, not an input method. Otherwise Gojek ships voice-order in 90 days and you're cooked.

## 6. Analog precedent

You cited Touch ID. Touch ID replaced something everyone hated (passwords) with something invisible. Fine.
But the closer analog is **Shazam**. Before Shazam: *"what's this song?"* was unanswerable. After: hold up phone, song appears. **Magical because the act of asking IS the act of solving.** That's your model. *"Cerita je"* IS the bookkeeping. Not a path to it.

You are not the iPod of admin. You are the **Shazam of running a kedai**. Steal that frame.

## 7. RADICALISM: **7/10**

Voice-only is genuinely radical for SMB software. But you preserved the schema underneath (orders, customers, invoices, stock). A 10 would be: there is no schema. There is only the diary, and *queries* generate views on demand. You stopped one floor short.

## 8. GASP-FACTOR: **6/10**

People will nod. The 9-year-olds at TikTok will not stitch this. Voice-to-CRUD is impressive on demo day, forgettable by Friday. Gasp comes from the *closure* — proof the world acted because she spoke. You haven't shown that yet.

## ONE concrete suggestion

**Delete every list view in the product. Replace the home screen with a single timeline of voice notes she's left, each one expanding into what it became.** No /orders. No /customers. No /invoices. She scrolls her own voice. Tapping a voice note shows the receipts, stock changes, messages it spawned. The diary IS the database. That's a 10. That's the gasp. That's *"oh god there's no app, it's just me talking to myself and the shop runs."*

Bonus: ship a weekly auto-generated 60-second audio recap in her own cadence — *"this week you served 47 customers, Aishah came back twice…"* — voice in, voice out. The shop talks back.

## MY VERDICT: **REWORK**

Right direction, one floor too timid — kill the schema-shaped UI, make the diary itself the product, then we ship.
