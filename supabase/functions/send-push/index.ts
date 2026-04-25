import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface WebhookPayload {
  type: "INSERT" | "UPDATE";
  table: string;
  schema: string;
  record: Record<string, unknown>;
  old_record: Record<string, unknown> | null;
}

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();
    const { type, record, old_record } = payload;

    // Determine notification content
    let title = "";
    let body = "";
    const userId = record.user_id as string;
    const orderId = record.id as string;

    if (type === "INSERT") {
      // New order from store link or WhatsApp
      const source = record.source as string;
      if (source === "manual") {
        return new Response(JSON.stringify({ skipped: "manual order" }), { status: 200 });
      }
      const customerName = (record.customer_name as string) || "Customer";
      const total = record.total as number;
      const via = source === "order_link" ? "Store link" : "WhatsApp";
      title = "New order! 🔔";
      body = `${customerName} ordered via ${via} — RM ${total?.toLocaleString("en-MY") || "0"}`;
    } else if (type === "UPDATE") {
      // Payment claim
      const oldClaimed = old_record?.payment_claimed_at;
      const newClaimed = record.payment_claimed_at;
      if (!oldClaimed && newClaimed) {
        const customerName = (record.customer_name as string) || "Customer";
        title = "Payment claimed? 💰";
        body = `${customerName} says they've paid — check and mark as paid`;
      } else {
        return new Response(JSON.stringify({ skipped: "not a payment claim" }), { status: 200 });
      }
    } else {
      return new Response(JSON.stringify({ skipped: "unhandled event type" }), { status: 200 });
    }

    // Get push token from profiles
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await supabase
      .from("profiles")
      .select("push_token, quiet_hours_start, quiet_hours_end")
      .eq("id", userId)
      .single();

    if (!profile?.push_token) {
      return new Response(JSON.stringify({ skipped: "no push token" }), { status: 200 });
    }

    // Quiet hours check: suppress sound during rest mode (order still recorded)
    const qStart = profile.quiet_hours_start || "22:00";
    const qEnd = profile.quiet_hours_end || "06:00";
    const nowMYT = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const hhmm = `${String(nowMYT.getUTCHours()).padStart(2, "0")}:${String(nowMYT.getUTCMinutes()).padStart(2, "0")}`;
    const inQuietHours = qStart > qEnd
      ? (hhmm >= qStart || hhmm < qEnd)  // overnight: 22:00-06:00
      : (hhmm >= qStart && hhmm < qEnd); // same-day: 13:00-15:00

    if (inQuietHours) {
      console.log("[send-push] Quiet hours active, suppressing notification for", userId);
      return new Response(JSON.stringify({ skipped: "quiet hours", order: orderId }), { status: 200 });
    }

    // Send via Expo Push API
    const pushRes = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: profile.push_token,
        title,
        body,
        sound: "default",
        priority: "high",
        channelId: "orders",
        data: { orderId },
      }),
    });

    const pushResult = await pushRes.json();
    console.log("[send-push]", title, "→", profile.push_token.slice(0, 30), "→", JSON.stringify(pushResult));

    return new Response(JSON.stringify({ success: true, result: pushResult }), { status: 200 });
  } catch (err) {
    console.error("[send-push] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
