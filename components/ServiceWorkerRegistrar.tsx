"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/sw-register";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((registrations) => {
            registrations.forEach((registration) => registration.unregister());
          })
          .catch(() => {});
      }
      return;
    }

    registerServiceWorker();
  }, []);

  return null;
}
