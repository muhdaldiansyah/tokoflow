"use client";

import { WifiOff, CloudUpload } from "lucide-react";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";

export function OfflineIndicator() {
  const { isOnline, pendingCount } = useOnlineStatus();

  if (isOnline && pendingCount === 0) return null;

  // Online but has pending orders = syncing
  const isSyncing = isOnline && pendingCount > 0;

  return (
    <div className="flex items-center justify-center gap-2 h-8 bg-amber-50 text-amber-700 border-b border-amber-200 text-xs font-medium shrink-0">
      {isSyncing ? (
        <>
          <CloudUpload className="w-3.5 h-3.5 animate-pulse" />
          <span>Menyinkronkan {pendingCount} pesanan...</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span>
            Mode offline — data dari cache lokal
            {pendingCount > 0 && ` · ${pendingCount} pesanan menunggu`}
          </span>
        </>
      )}
    </div>
  );
}
