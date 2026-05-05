"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

/**
 * Admin AI testing page — manually exercise Background Twin + Foreground
 * Assist endpoints with synthetic inputs. Useful before Phase 0 smoke test
 * to calibrate prompts on realistic Klang Valley merchant scenarios.
 *
 * Per SYNTHESIS-2026-05-05.md §6.4: Background Twin scope (full autonomous
 * vs assist-only) is a Phase 0 deferred decision. This page lets us validate
 * outputs in isolation before exposing to real merchants.
 */

type Mode = "payment-match" | "reply-draft";

const SAMPLE_PAYMENT_NOTIF =
  "Penerimaan DuitNow: RM 75.00 from AISYAH BINTI ABDULLAH at 14:32. Ref: TXN8723612";

const SAMPLE_OPEN_ORDERS = JSON.stringify(
  [
    {
      order_number: "CO-260506-001234",
      customer_name: "Aisyah Abdullah",
      total_amount: 75,
      customer_phone: "60123456789",
    },
    {
      order_number: "CO-260506-001235",
      customer_name: "Mariam Hassan",
      total_amount: 75,
      customer_phone: "60198765432",
    },
    {
      order_number: "CO-260506-001236",
      customer_name: "Aliya Aziz",
      total_amount: 120,
      customer_phone: "60134567890",
    },
  ],
  null,
  2,
);

const SAMPLE_CUSTOMER_MSG =
  "Kak boleh tak hantar esok? Anak saya birthday, nak surprise dia.";

const SAMPLE_HISTORY = JSON.stringify(
  [
    {
      from: "customer",
      text: "Kak nak order kek lapis 1, brownies 1. Berapa total?",
    },
    {
      from: "merchant",
      text: "Hai sis, kek lapis RM 25, brownies RM 30. Total RM 55. Boleh hantar bila?",
    },
    {
      from: "customer",
      text: "Okay sis nak yang Ahad ni boleh?",
    },
    {
      from: "merchant",
      text: "Boleh sis, Ahad ada slot pagi atau petang?",
    },
  ],
  null,
  2,
);

export default function AITestPage() {
  const [mode, setMode] = useState<Mode>("payment-match");

  // Payment match state
  const [pmNotif, setPmNotif] = useState(SAMPLE_PAYMENT_NOTIF);
  const [pmOrders, setPmOrders] = useState(SAMPLE_OPEN_ORDERS);
  const [pmResult, setPmResult] = useState<unknown>(null);
  const [pmLoading, setPmLoading] = useState(false);

  // Reply draft state
  const [rdMsg, setRdMsg] = useState(SAMPLE_CUSTOMER_MSG);
  const [rdHistory, setRdHistory] = useState(SAMPLE_HISTORY);
  const [rdMerchantVoice, setRdMerchantVoice] = useState(
    "Warm Malaysian SMB voice, BM with English code-switch, calls customers 'sis' or by name",
  );
  const [rdResult, setRdResult] = useState<unknown>(null);
  const [rdLoading, setRdLoading] = useState(false);

  async function runPaymentMatch() {
    let parsedOrders: unknown[];
    try {
      parsedOrders = JSON.parse(pmOrders);
    } catch {
      toast.error("Open orders JSON malformed");
      return;
    }
    setPmLoading(true);
    setPmResult(null);
    try {
      const r = await fetch("/api/twin/payment-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notification: pmNotif,
          candidate_orders: parsedOrders,
        }),
      });
      const data = await r.json();
      setPmResult(data);
      if (!r.ok) toast.error(data.error || "Request failed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Network error");
    } finally {
      setPmLoading(false);
    }
  }

  async function runReplyDraft() {
    let parsedHistory: unknown[];
    try {
      parsedHistory = JSON.parse(rdHistory);
    } catch {
      toast.error("History JSON malformed");
      return;
    }
    setRdLoading(true);
    setRdResult(null);
    try {
      const r = await fetch("/api/assist/reply-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_message: rdMsg,
          history: parsedHistory,
          merchant_voice_notes: rdMerchantVoice,
        }),
      });
      const data = await r.json();
      setRdResult(data);
      if (!r.ok) toast.error(data.error || "Request failed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Network error");
    } finally {
      setRdLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="h-9 w-9 inline-flex items-center justify-center rounded-lg border bg-card hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">AI Test Console</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Exercise Background Twin + Foreground Assist before Phase 0 smoke test
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-amber-50/50 p-3 text-xs text-amber-900">
        <strong>Note:</strong> Synthesis Year 2 features pulled forward 2026-05-06. Smoke test (Phase 0 Track 0.5) still gates production rollout. If customer detects AI tone OR merchant trust degrades, scope reduces or kills.
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setMode("payment-match")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === "payment-match"
              ? "border-warm-green text-warm-green"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Payment matcher (Tier 3)
        </button>
        <button
          onClick={() => setMode("reply-draft")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === "reply-draft"
              ? "border-warm-green text-warm-green"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Reply draft (Tier 2)
        </button>
      </div>

      {mode === "payment-match" && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Bank notification text
            </label>
            <textarea
              value={pmNotif}
              onChange={(e) => setPmNotif(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Candidate open orders (JSON)
            </label>
            <textarea
              value={pmOrders}
              onChange={(e) => setPmOrders(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 rounded-lg border bg-background text-xs font-mono"
            />
          </div>

          <button
            onClick={runPaymentMatch}
            disabled={pmLoading}
            className="h-10 px-4 inline-flex items-center gap-2 rounded-lg bg-warm-green text-white font-medium hover:bg-warm-green-hover disabled:opacity-50"
          >
            {pmLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Run match
          </button>

          {pmResult !== null && (
            <div className="rounded-xl border bg-card p-4">
              <h3 className="text-sm font-semibold mb-2">Result</h3>
              <pre className="text-xs font-mono whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                {JSON.stringify(pmResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {mode === "reply-draft" && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Customer&apos;s most recent message
            </label>
            <textarea
              value={rdMsg}
              onChange={(e) => setRdMsg(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Conversation history (JSON, customer/merchant turns)
            </label>
            <textarea
              value={rdHistory}
              onChange={(e) => setRdHistory(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 rounded-lg border bg-background text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Merchant voice notes (optional)
            </label>
            <input
              type="text"
              value={rdMerchantVoice}
              onChange={(e) => setRdMerchantVoice(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border bg-background text-sm"
            />
          </div>

          <button
            onClick={runReplyDraft}
            disabled={rdLoading}
            className="h-10 px-4 inline-flex items-center gap-2 rounded-lg bg-warm-green text-white font-medium hover:bg-warm-green-hover disabled:opacity-50"
          >
            {rdLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Generate draft
          </button>

          {rdResult !== null && (
            <div className="rounded-xl border bg-card p-4">
              <h3 className="text-sm font-semibold mb-2">Result</h3>
              <pre className="text-xs font-mono whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                {JSON.stringify(rdResult, null, 2)}
              </pre>
              <div className="mt-3 text-xs text-muted-foreground italic">
                Reminder: Tokoflow drafts. You send. Customer relationship stays with you.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
