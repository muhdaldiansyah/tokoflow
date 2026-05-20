"use client";

// Mounts once at app boot. Registers /sw.js for offline caching of static
// assets and previously-loaded pages. Skips registration in dev to avoid
// caching during HMR.

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => {
          // Don't blow up the app if registration fails — service worker is
          // a progressive enhancement.
          console.warn("[sw] registration failed:", err);
        });
    };

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    }
  }, []);

  return null;
}
