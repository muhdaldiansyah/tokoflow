"use client";

import { useState, useEffect } from "react";

interface UnlockState {
  bulkActions: boolean;
  advancedFilters: boolean;
}

const STORAGE_KEY = "catatorder_feature_unlock";

export function useFeatureUnlock(ordersUsed: number): UnlockState {
  const [state, setState] = useState<UnlockState>({
    bulkActions: false,
    advancedFilters: false,
  });

  useEffect(() => {
    // Read persisted state
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UnlockState;
        // Once unlocked, stays unlocked
        const next: UnlockState = {
          bulkActions: parsed.bulkActions || ordersUsed >= 10,
          advancedFilters: parsed.advancedFilters || ordersUsed >= 20,
        };
        setState(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return;
      }
    } catch {
      // ignore
    }

    const next: UnlockState = {
      bulkActions: ordersUsed >= 10,
      advancedFilters: ordersUsed >= 20,
    };
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, [ordersUsed]);

  return state;
}
