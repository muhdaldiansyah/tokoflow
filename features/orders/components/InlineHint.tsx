"use client";

import { useState, useEffect } from "react";

interface InlineHintProps {
  hintId: string;
  text: string;
  maxShows?: number;
}

export function InlineHint({ hintId, text, maxShows = 3 }: InlineHintProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const key = `catatorder_hint_${hintId}`;
    const count = parseInt(localStorage.getItem(key) || "0");
    if (count < maxShows) {
      setVisible(true);
      localStorage.setItem(key, String(count + 1));
    }
  }, [hintId, maxShows]);

  if (!visible) return null;

  return (
    <p className="text-xs text-muted-foreground italic">{text}</p>
  );
}
