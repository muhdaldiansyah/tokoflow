import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between min-h-9">
        <Skeleton className="h-6 w-24" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg hidden lg:block" />
        </div>
      </div>

      {/* Search */}
      <Skeleton className="h-11 w-full rounded-lg" />

      {/* Hero Summary */}
      <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-10" />
          <Skeleton className="h-3 w-36" />
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-5 w-20 ml-auto" />
          <Skeleton className="h-3 w-14 ml-auto" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b">
        <div className="flex-1 h-10 flex items-center justify-center">
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex-1 h-10 flex items-center justify-center">
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      {/* Order Cards — grouped */}
      <div className="rounded-xl border bg-card shadow-sm divide-y divide-border">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-1/3" />
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-1/4" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
