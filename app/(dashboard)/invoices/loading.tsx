import { Skeleton } from "@/components/ui/skeleton";

export default function InvoicesLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between min-h-9">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b">
        <div className="flex-1 h-10 flex items-center justify-center">
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex-1 h-10 flex items-center justify-center">
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card p-3 shadow-sm space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>

      {/* Invoice cards */}
      <div className="rounded-xl border bg-card shadow-sm divide-y divide-border">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-1/3" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
