import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Home, ChartLine, Brain, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HabitStats } from "@/lib/types";
import { HabitInsights } from "@/components/habit-insights";
import { GoalSetting } from "@/components/goal-setting";
import { AchievementSystem } from "@/components/achievement-system";
import { Link, useLocation } from "wouter";

export default function ProgressPage() {
  const [location] = useLocation();

  const { data: stats, isLoading } = useQuery<HabitStats>({
    queryKey: ["/api/habits/stats"]
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
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">Progress</h1>
        </div>
      </div>

      <div className="p-4 pb-24">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="achievements">Rewards</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Today's Progress */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
              <h2 className="text-xl font-bold mb-2">Today's Progress</h2>
              <div className="text-3xl font-bold mb-1">
                {stats?.todayProgress || "0/0"}
              </div>
              <p className="text-blue-100">habits completed</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {stats?.totalStreak || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Streak</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold">#</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {stats?.totalHabits || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Habits</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 font-bold">🔥</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {stats?.todayCompleted || 0}
                    </div>
                    <div className="text-sm text-gray-600">Today Done</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-bold">%</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {stats?.completionRate ? Math.round(stats.completionRate * 100) : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Progress Chart */}
            {stats?.weeklyProgress && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Overview</h3>
                <div className="space-y-3">
                  {stats.weeklyProgress.map((day, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-16 text-sm text-gray-600">
                        {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 rounded-full h-2 transition-all duration-300"
                          style={{
                            width: day.total > 0 ? `${(day.completed / day.total) * 100}%` : "0%"
                          }}
                        />
                      </div>
                      <div className="w-12 text-sm text-gray-600 text-right">
                        {day.completed}/{day.total}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Motivational Message */}
            <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-xl p-6 text-white">
              <h3 className="text-lg font-bold mb-2">Keep Going!</h3>
              <p className="text-green-100">
                {stats?.completionRate && stats.completionRate > 0.8
                  ? "You're crushing it! Your consistency is inspiring."
                  : stats?.completionRate && stats.completionRate > 0.6
                  ? "Great progress! Small steps lead to big changes."
                  : "Every day is a new opportunity. You've got this!"}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <HabitInsights />
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <GoalSetting />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <AchievementSystem />
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around items-center">
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 px-3 ${location === "/" ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}
            asChild
          >
            <Link href="/">
              <Home className="w-5 h-5 mb-1" />
              <span className="text-xs">Home</span>
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
              <span className="text-xs font-medium">Progress</span>
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
            className={`flex flex-col items-center py-2 px-3 ${location === "/wellness" ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}
            asChild
          >
            <Link href="/wellness">
              <Heart className="w-5 h-5 mb-1" />
              <span className="text-xs">Wellness</span>
            </Link>
          </Button>
        </div>
      </nav>
    </>
  );
}