"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ConfirmResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "not_found" | "already" | "failed" };

// Atomic single-use confirm: only succeeds if customer_ack_at is still
// NULL. A second tap on the same link returns "already" — the page
// will re-render and display the post-ack thank-you state.
export async function confirmReceipt(token: string): Promise<ConfirmResult> {
  if (!UUID_RE.test(token)) return { ok: false, error: "invalid" };

  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("orders")
    .update({ customer_ack_at: new Date().toISOString() })
    .eq("customer_ack_token", token)
    .is("customer_ack_at", null)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: "failed" };

  if (!data) {
    // Either no row matched the token or the order was already acked.
    // Disambiguate so the UI can pick the right copy.
    const { data: probe } = await supabase
      .from("orders")
      .select("customer_ack_at")
      .eq("customer_ack_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (!probe) return { ok: false, error: "not_found" };
    return { ok: false, error: "already" };
  }

  revalidatePath(`/a/${token}`);
  return { ok: true };
}
