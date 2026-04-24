"use client";

import { useSyncExternalStore, useState, useEffect } from "react";
import { getPendingCount } from "./db";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true; // SSR assumes online
}

export function useOnlineStatus() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function check() {
      const count = await getPendingCount();
      if (mounted) setPendingCount(count);
    }
    check();

    // Re-check on online/offline transitions
    const handler = () => { check(); };
    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);

    return () => {
      mounted = false;
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", handler);
    };
  }, []);

  /** Call this after sync to refresh the count */
  function refreshPendingCount() {
    getPendingCount().then(setPendingCount);
  }

  return { isOnline, pendingCount, refreshPendingCount };
}
