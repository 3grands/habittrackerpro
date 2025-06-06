import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Home, ChartLine, Brain, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HabitStats } from "@/lib/types";
import { Link, useLocation } from "wouter";

export default function ProgressPage() {
  const [location] = useLocation();

  const { data: stats, isLoading } = useQuery<HabitStats>({
    queryKey: ["/api/habits/stats"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">Progress</h1>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="bg-primary bg-opacity-10 text-primary border-primary">
              Week
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-500">
              Month
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-500">
              Year
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 pb-24">
        {/* Overall Progress */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Progress</h3>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-primary"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${stats?.completionRate || 0}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold text-gray-800">{stats?.completionRate || 0}%</span>
                <span className="text-xs text-gray-500">Complete</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{stats?.todayCompleted || 0}</p>
              <p className="text-sm text-gray-500">Completed Today</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats?.totalStreak || 0}</p>
              <p className="text-sm text-gray-500">Total Streak</p>
            </div>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Overview</h3>
          <div className="flex justify-between items-end h-32 space-x-2">
            {stats?.weeklyProgress.map((day, index) => {
              const height = day.total > 0 ? (day.completed / day.total) * 100 : 0;
              const getDayName = (dateStr: string) => {
                const date = new Date(dateStr);
                return date.toLocaleDateString("en-US", { weekday: "short" });
              };
              
              return (
                <div key={day.date} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-full rounded-t-lg mb-2 transition-all duration-300 ${
                      day.completed > 0 ? "bg-primary" : "bg-gray-200"
                    }`}
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

        {/* Habit Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">This Week's Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-primary bg-opacity-10 rounded-xl">
              <p className="text-2xl font-bold text-primary">{stats?.totalHabits || 0}</p>
              <p className="text-sm text-gray-600">Active Habits</p>
            </div>
            <div className="text-center p-4 bg-secondary bg-opacity-10 rounded-xl">
              <p className="text-2xl font-bold text-secondary">
                {stats?.weeklyProgress.reduce((acc, day) => acc + day.completed, 0) || 0}
              </p>
              <p className="text-sm text-gray-600">Total Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around items-center">
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 px-3 ${location === "/" ? "text-primary" : "text-gray-400"}`}
            asChild
          >
            <Link href="/">
              <Home className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Home</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 px-3 ${location === "/progress" ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}
            asChild
          >
            <Link href="/progress">
              <ChartLine className="w-5 h-5 mb-1" />
              <span className="text-xs">Progress</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 px-3 ${location === "/coaching" ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}
            asChild
          >
            <Link href="/coaching">
              <Brain className="w-5 h-5 mb-1" />
              <span className="text-xs">Coaching</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center py-2 px-3 text-gray-400 hover:text-gray-600"
          >
            <Settings className="w-5 h-5 mb-1" />
            <span className="text-xs">Settings</span>
          </Button>
        </div>
      </nav>
    </>
  );
}
