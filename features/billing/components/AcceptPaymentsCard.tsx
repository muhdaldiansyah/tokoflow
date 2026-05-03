"use client";

import { useState } from "react";
import { Loader2, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/features/receipts/types/receipt.types";
import { updateProfile } from "@/features/receipts/services/receipt.service";
import { track } from "@/lib/analytics";

interface AcceptPaymentsCardProps {
  profile: Profile;
  onProfileChange: (next: Partial<Profile>) => void;
}

// Settings → Accept payments. Onboarding wizard for per-merchant Billplz
// connect. ADR 0001 — funds settle to merchant's Billplz account, never
// Tokoflow's; this UI captures + validates the keys, then exposes the
// payment-enabled toggle once credentials are verified.
export function AcceptPaymentsCard({ profile, onProfileChange }: AcceptPaymentsCardProps) {
  const isConnected = !!profile.billplz_collection_id;
  const isEnabled = !!profile.billplz_payment_enabled;

  const [showForm, setShowForm] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [xSignatureKey, setXSignatureKey] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  async function handleConnect() {
    if (!apiKey.trim() || !xSignatureKey.trim() || !collectionId.trim()) {
      toast.error("All three fields are required");
      return;
    }
    setIsValidating(true);
    try {
      const res = await fetch("/api/payments/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim(), xSignatureKey: xSignatureKey.trim(), collectionId: collectionId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not validate Billplz credentials");
        return;
      }
      onProfileChange({ billplz_collection_id: collectionId.trim() });
      track("billplz_connected", { collection_title: data.collectionTitle });
      toast.success(`Connected to "${data.collectionTitle}"`);
      setShowForm(false);
      setApiKey("");
      setXSignatureKey("");
      setCollectionId("");
    } catch {
      toast.error("Could not reach Billplz. Try again.");
    } finally {
      setIsValidating(false);
    }
  }

  async function handleToggleEnabled() {
    setIsToggling(true);
    const next = !isEnabled;
    const ok = await updateProfile({ billplz_payment_enabled: next });
    if (ok) {
      onProfileChange({ billplz_payment_enabled: next });
      track("billplz_payment_toggled", { enabled: next });
      toast.success(next ? "Customers can now pay through your link" : "In-flow payment paused — falling back to QR");
    } else {
      toast.error("Could not save");
    }
    setIsToggling(false);
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect Billplz? Customers will fall back to your DuitNow QR with manual verification.")) return;
    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/payments/connect", { method: "DELETE" });
      if (res.ok) {
        onProfileChange({
          billplz_collection_id: null,
          billplz_payment_enabled: false,
        });
        track("billplz_disconnected", {});
        toast.success("Disconnected. Falling back to QR.");
      } else {
        toast.error("Could not disconnect");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsDisconnecting(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card px-4 py-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-muted-foreground" />
        <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
          Accept payments
        </p>
      </div>

      {!isConnected && !showForm && (
        <>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Let customers pay you instantly through the order link via DuitNow QR, FPX, or card.
            Funds go directly to your bank — Tokoflow never touches the money.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="h-9 px-4 rounded-lg bg-warm-green text-white text-xs font-medium hover:bg-warm-green-hover transition-colors"
          >
            Connect Billplz
          </button>
          <p className="text-[10px] text-muted-foreground">
            Don&rsquo;t have a Billplz account yet?{" "}
            <a
              href="https://www.billplz.com/enterprise"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Sign up here
            </a>{" "}
            (1-3 days for verification).
          </p>
        </>
      )}

      {!isConnected && showForm && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Find these in your Billplz dashboard under <span className="font-medium text-foreground">Settings → API Keys</span>.
            Paste them here — we validate and encrypt before saving.
          </p>
          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                API key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Your Billplz secret key"
                className="w-full h-10 px-3 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                X-Signature key
              </label>
              <input
                type="password"
                value={xSignatureKey}
                onChange={(e) => setXSignatureKey(e.target.value)}
                placeholder="Your Billplz X-Signature key"
                className="w-full h-10 px-3 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                Collection ID
              </label>
              <input
                type="text"
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                placeholder="e.g. abcd1234"
                className="w-full h-10 px-3 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleConnect}
              disabled={isValidating}
              className="h-9 px-4 rounded-lg bg-warm-green text-white text-xs font-medium hover:bg-warm-green-hover disabled:opacity-50 transition-colors"
            >
              {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validate & save"}
            </button>
            <button
              onClick={() => { setShowForm(false); setApiKey(""); setXSignatureKey(""); setCollectionId(""); }}
              disabled={isValidating}
              className="h-9 px-3 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isConnected && (
        <>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-warm-green shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">Billplz connected</p>
              <p className="text-[11px] text-muted-foreground truncate">
                Collection: {profile.billplz_collection_id}
              </p>
            </div>
          </div>

          <label className="flex items-center justify-between py-1 cursor-pointer">
            <span className="text-xs text-muted-foreground">
              Show &ldquo;Pay&rdquo; button on the order link
            </span>
            <button
              type="button"
              onClick={handleToggleEnabled}
              disabled={isToggling}
              className={`relative w-9 h-5 rounded-full transition-colors disabled:opacity-50 ${isEnabled ? "bg-warm-green" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isEnabled ? "translate-x-4" : ""}`} />
            </button>
          </label>

          {!isEnabled && (
            <div className="flex items-start gap-2 rounded-lg bg-warm-amber-light/40 px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 text-warm-amber shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground">
                Connection saved but payment is paused. Toggle on when you&rsquo;re ready for customers to pay through Tokoflow.
              </p>
            </div>
          )}

          <button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="text-[11px] text-muted-foreground hover:text-warm-rose underline disabled:opacity-50"
          >
            {isDisconnecting ? "Disconnecting…" : "Disconnect Billplz"}
          </button>
        </>
      )}
    </div>
  );
}
