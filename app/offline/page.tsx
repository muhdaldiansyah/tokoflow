"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">📡</div>
        <h1 className="text-lg font-semibold text-foreground mb-2">
          Tidak ada koneksi internet
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Periksa koneksi internetmu dan coba lagi.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
