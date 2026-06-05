"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { playNotificationSound } from "@/lib/utils/notification-sound";
import { getOrder } from "@/features/orders/services/order.service";
import { buildOrderConfirmation, buildPreorderConfirmation } from "@/lib/utils/wa-messages";
import { openWhatsApp } from "@/lib/utils/wa-open";

// Lifted from OrderList.tsx so the listener runs on every dashboard page,
// not just /orders. Single source of truth for new-order notifications:
// in-app toast + chime + mid-rush coaching + tab-title flash + unread badge.

const UNREAD_KEY = "tokoflow_unread_orders";
const LAST_SEEN_KEY = "tokoflow_last_seen_today";
const MIDRUSH_KEY = "tokoflow_midrush_last";

type RealtimeCtx = {
  unreadCount: number;
  lastSeenAt: number | null;
  markTodaySeen: () => void;
};

type SessionLookupResult = {
  data: { session: { user: { id: string } } | null };
};

const Ctx = createContext<RealtimeCtx>({
  unreadCount: 0,
  lastSeenAt: null,
  markTodaySeen: () => {},
});

export function useDashboardRealtime() {
  return useContext(Ctx);
}

function readNumber(key: string): number | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(key);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function DashboardRealtimeProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenAt, setLastSeenAt] = useState<number | null>(null);
  const recentOrderTimestamps = useRef<number[]>([]);
  const baseTitleRef = useRef<string>("Tokoflow");

  // Hydrate persisted state once
  useEffect(() => {
    queueMicrotask(() => {
      setUnreadCount(readNumber(UNREAD_KEY) ?? 0);
      setLastSeenAt(readNumber(LAST_SEEN_KEY));
      if (typeof document !== "undefined") {
        baseTitleRef.current = document.title.replace(/^\(\d+\)\s*/, "");
      }
    });
  }, []);

  // Reflect unreadCount → localStorage + tab title (only when tab hidden)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (unreadCount > 0) window.localStorage.setItem(UNREAD_KEY, String(unreadCount));
    else window.localStorage.removeItem(UNREAD_KEY);

    if (typeof document !== "undefined") {
      const base = baseTitleRef.current;
      const hidden = document.visibilityState === "hidden";
      document.title = hidden && unreadCount > 0 ? `(${unreadCount}) ${base}` : base;
    }
  }, [unreadCount]);

  // Reset title prefix when merchant returns to the tab; restore when hidden.
  useEffect(() => {
    function onVisibility() {
      const base = baseTitleRef.current;
      if (document.visibilityState === "visible") {
        document.title = base;
      } else if (unreadCount > 0) {
        document.title = `(${unreadCount}) ${base}`;
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [unreadCount]);

  const markTodaySeen = useCallback(() => {
    const now = Date.now();
    setLastSeenAt(now);
    setUnreadCount(0);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LAST_SEEN_KEY, String(now));
      window.localStorage.removeItem(UNREAD_KEY);
    }
  }, []);

  // Realtime — INSERT (new order) + UPDATE (customer claims paid)
  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    void supabase.auth.getSession().then((result: SessionLookupResult) => {
      const userId = result.data.session?.user.id;
      if (cancelled || !userId) return;

      channel = supabase
        .channel("dashboard-orders-notify")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "orders", filter: `user_id=eq.${userId}` },
          (payload: { new: { id?: string; source?: string; customer_name?: string; order_number?: string } }) => {
            if (payload.new.source === "order_link" || payload.new.source === "whatsapp") {
              const name = payload.new.customer_name || "Customer";
              const via = payload.new.source === "whatsapp" ? " via WA" : "";
              const messages = [
                `New order from ${name}${via}! 🔔`,
                `${name} just ordered${via}! ✨`,
                `Cha-ching! Order received from ${name}${via} 🎉`,
                `Sales rolling in! ${name} placed an order${via} 🔥`,
              ];
              const msg = messages[Math.floor(Math.random() * messages.length)];
              const orderId = payload.new.id;
              toast.success(msg, {
                description: payload.new.order_number,
                duration: 12000,
                action: orderId
                  ? {
                      label: "Confirm via WA",
                      onClick: async () => {
                        const found = await getOrder(orderId);
                        if (found) {
                          const waMsg = found.is_preorder
                            ? buildPreorderConfirmation(found)
                            : buildOrderConfirmation(found);
                          openWhatsApp(waMsg, found.customer_phone);
                        }
                      },
                    }
                  : undefined,
              });
              playNotificationSound();
              setUnreadCount((n) => n + 1);
            }

            // Mid-rush coaching — 5 orders in 30 min, suppressed for 1h after.
            const now = Date.now();
            const cutoff = now - 30 * 60 * 1000;
            recentOrderTimestamps.current = recentOrderTimestamps.current.filter((t) => t > cutoff);
            recentOrderTimestamps.current.push(now);
            if (recentOrderTimestamps.current.length === 5) {
              const lastShown = Number(sessionStorage.getItem(MIDRUSH_KEY) || "0");
              if (now - lastShown > 60 * 60 * 1000) {
                toast("Looks busy — go on, we've got chat covered", {
                  description: "5 orders in the last half hour. Focus on cooking, we'll watch the link.",
                  duration: 8000,
                });
                sessionStorage.setItem(MIDRUSH_KEY, String(now));
              }
            }
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "orders", filter: `user_id=eq.${userId}` },
          (payload: {
            old: { payment_claimed_at?: string | null; payment_status?: string | null };
            new: { payment_claimed_at?: string | null; payment_status?: string | null; source?: string | null; customer_name?: string; order_number?: string; total?: number };
          }) => {
            // Customer self-reports payment via receipt page ("I've paid" button).
            if (!payload.old.payment_claimed_at && payload.new.payment_claimed_at) {
              const name = payload.new.customer_name || "Customer";
              toast.info(`${name} reports payment`, {
                description: `${payload.new.order_number} — verify the payment, then mark as paid`,
                duration: 10000,
              });
              playNotificationSound();
              return;
            }
            // Billplz webhook auto-confirmed payment for a store-link order.
            // Old status was unpaid/partial; new status is paid; source is order_link.
            // This fires when the customer pays on the Billplz hosted page and the
            // webhook updates the order server-side — the merchant gets notified
            // without needing to refresh the dashboard.
            if (
              payload.old.payment_status !== "paid" &&
              payload.new.payment_status === "paid" &&
              payload.new.source === "order_link"
            ) {
              const name = payload.new.customer_name || "Customer";
              const amount = payload.new.total
                ? ` · Rp ${payload.new.total.toLocaleString("id-ID")}`
                : "";
              toast.success(`Payment received — ${name}${amount}`, {
                description: payload.new.order_number,
                duration: 8000,
              });
              playNotificationSound();
            }
          },
        )
        .subscribe();
    }).catch(() => {});

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  const value = useMemo(
    () => ({ unreadCount, lastSeenAt, markTodaySeen }),
    [unreadCount, lastSeenAt, markTodaySeen],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
