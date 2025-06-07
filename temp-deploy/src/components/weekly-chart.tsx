import { HabitStats } from "@/lib/types";

interface WeeklyChartProps {
  stats: HabitStats;
}

export function WeeklyChart({ stats }: WeeklyChartProps) {
  const maxCompleted = Math.max(...stats.weeklyProgress.map(d => d.total), 1);

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">This Week</h3>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-end h-32 space-x-2">
          {stats.weeklyProgress.map((day, index) => {
            const height = day.total > 0 ? (day.completed / maxCompleted) * 100 : 0;
            const isToday = index === stats.weeklyProgress.length - 1;
            
            return (
              <div key={day.date} className="flex flex-col items-center flex-1">
                <div
                  className={`w-full rounded-t-lg mb-2 transition-all duration-300 ${
                    day.completed > 0 ? "bg-primary" : "bg-gray-200"
                  } ${isToday ? "opacity-100" : "opacity-75"} hover:opacity-100`}
                  style={{ height: `${Math.max(height, 10)}%` }}
                />
                <span className="text-xs text-gray-500">
                  {getDayName(day.date)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
