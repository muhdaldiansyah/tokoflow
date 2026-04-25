import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <Skeleton className="h-6 w-24" />

      {/* Profile Card */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </div>

        {/* Link Section */}
        <div className="border-t px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
          <Skeleton className="h-11 w-full rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-16 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Kuota Card */}
      <div className="rounded-lg border bg-card px-4 py-4 shadow-sm space-y-3">
        <Skeleton className="h-3 w-28" />
        <div className="flex flex-col items-center gap-1 py-2">
          <Skeleton className="h-9 w-14" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <div className="space-y-2 pt-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>

      {/* Account Card */}
      <div className="rounded-lg border bg-card shadow-sm divide-y divide-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="px-4 py-3 flex items-center gap-3">
          <Skeleton className="h-4 w-14" />
        </div>
      </div>
    </div>
  );
}
