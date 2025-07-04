import { Skeleton } from "@/components/ui/skeleton";

export function StatsOverviewSkeleton() {
  return (
    <div className="p-4 bg-white animate-pulse">
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="text-center">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-full flex items-center justify-center mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer rounded-full" />
            </div>
            <div className="h-4 w-12 mx-auto mb-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
            <div className="h-3 w-16 mx-auto bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CoachingCardSkeleton() {
  return (
    <div className="p-4 animate-pulse">
      <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-32 bg-white/30 rounded animate-shimmer" />
          <div className="w-8 h-8 rounded bg-white/30 animate-shimmer" />
        </div>
        <div className="space-y-2 mb-3">
          <div className="h-4 w-full bg-white/30 rounded animate-shimmer" />
          <div className="h-4 w-3/4 bg-white/30 rounded animate-shimmer" />
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-white/30 animate-shimmer" />
          <div className="h-3 w-24 bg-white/30 rounded animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

export function WeeklyChartSkeleton() {
  return (
    <div className="p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex items-end justify-between space-x-2 h-32">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex flex-col items-center space-y-2 flex-1">
            <Skeleton 
              className="w-full rounded-t" 
              style={{ height: `${Math.random() * 80 + 20}px` }}
            />
            <Skeleton className="h-3 w-6" />
          </div>
        ))}
      </div>
    </div>
  );
}