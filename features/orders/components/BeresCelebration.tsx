"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

interface BeresCelebrationProps {
  onDismiss: () => void;
}

export function BeresCelebration({ onDismiss }: BeresCelebrationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
      onClick={() => { setVisible(false); onDismiss(); }}
      style={{ animation: "beres-wash 3.5s ease-in-out forwards" }}
    >
      <div className="absolute inset-0 bg-warm-green" />
      <div
        className="relative flex flex-col items-center gap-4"
        style={{ animation: "beres-scale 3.5s ease-out forwards" }}
      >
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Beres!</h1>
        <p className="text-white/80 text-sm">Semua pesanan hari ini selesai</p>
      </div>
    </div>
  );
}
