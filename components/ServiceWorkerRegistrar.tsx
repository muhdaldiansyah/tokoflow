"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/sw-register";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
