import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <Skeleton className="h-11 w-11 rounded-2xl" />
              <Skeleton className="h-8 w-12" />
            </div>
            <Skeleton className="mt-5 h-5 w-32" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
        ))}
      </div>
      {/* Main content area */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-6 xl:col-span-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-1 h-4 w-56" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <Skeleton className="h-10 w-10 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-1 h-4 w-40" />
          <div className="mt-6 grid place-items-center">
            <Skeleton className="h-40 w-40 rounded-full" />
          </div>
          <div className="mt-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
