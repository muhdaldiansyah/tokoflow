import { Skeleton } from "@/components/ui/skeleton";

export default function RekapLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-16" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b bg-card rounded-t-lg">
        <div className="h-10 px-6 flex items-center">
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="h-10 px-6 flex items-center">
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      {/* Recap Card */}
      <div className="rounded-lg border bg-card px-4 py-4 space-y-4 shadow-sm">
        {/* Pendapatan Section */}
        <Skeleton className="h-3 w-24" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>

        <div className="border-t pt-4" />

        {/* Pembayaran Section */}
        <Skeleton className="h-3 w-24" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* WA Section */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-36" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-11 flex-1 rounded-lg" />
          <Skeleton className="h-11 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
