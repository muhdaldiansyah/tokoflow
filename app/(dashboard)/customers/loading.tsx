import { Skeleton } from "@/components/ui/skeleton";

export default function PelangganLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-8" />
      </div>

      {/* Search */}
      <Skeleton className="h-11 w-full rounded-lg" />

      {/* Piutang Summary */}
      <div className="rounded-lg border bg-card px-4 py-3 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-3 w-36" />
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b">
        <div className="flex-1 h-10 flex items-center justify-center">
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="flex-1 h-10 flex items-center justify-center">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Customer Rows */}
      <div className="rounded-xl border bg-card divide-y shadow-sm">
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-4 py-3 flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="text-right space-y-1.5">
              <Skeleton className="h-4 w-20 ml-auto" />
              <Skeleton className="h-3 w-16 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
