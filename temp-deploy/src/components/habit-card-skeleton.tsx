import { Skeleton } from "@/components/ui/skeleton";

export function HabitCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {/* Checkbox skeleton */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
          
          <div className="flex-1">
            {/* Habit name skeleton */}
            <div className="h-5 w-32 mb-2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
            
            {/* Status text skeleton */}
            <div className="h-4 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
          </div>
        </div>
        
        {/* Category icon skeleton */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
      </div>
      
      {/* Progress bar skeleton */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <div className="h-3 w-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
          <div className="h-3 w-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
        </div>
        <div className="w-full h-2 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
      </div>
    </div>
  );
}

export function HabitListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
        <HabitCardSkeleton key={i} />
      ))}
    </div>
  );
}