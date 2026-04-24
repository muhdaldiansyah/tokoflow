"use client";

import { useState, useEffect } from "react";

export function usePeakMode(): boolean {
  const [isPeak, setIsPeak] = useState(false);

  useEffect(() => {
    function check() {
      const hour = new Date().getHours();
      setIsPeak(hour >= 11 && hour < 14);
    }
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  return isPeak;
}
