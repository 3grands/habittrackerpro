import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Calendar, Target, Award, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function HabitInsights() {
  const { data: habits = [] } = useQuery({
    queryKey: ["/api/habits"]
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/habits/stats"]
  });

  // Calculate insights
  const getStreakInsights = () => {
    if (!Array.isArray(habits) || habits.length === 0) return null;
    
    const longestStreak = Math.max(...habits.map((h: any) => h.streak || 0));
    const avgStreak = habits.reduce((sum: number, h: any) => sum + (h.streak || 0), 0) / habits.length;
    const streakingHabits = habits.filter((h: any) => (h.streak || 0) > 7);
    
    return {
      longestStreak,
      avgStreak: Math.round(avgStreak * 10) / 10,
      streakingHabits: streakingHabits.length
    };
  };

  const getCompletionRate = () => {
    if (!stats) return 0;
    return Math.round((stats.completionRate || 0) * 100);
  };

  const getWeeklyTrend = () => {
    if (!stats?.weeklyProgress || !Array.isArray(stats.weeklyProgress)) return "stable";
    
    const recentDays = stats.weeklyProgress.slice(-3);
    const olderDays = stats.weeklyProgress.slice(0, -3);
    
    if (recentDays.length === 0 || olderDays.length === 0) return "stable";
    
    const recentAvg = recentDays.reduce((sum: number, day: any) => 
      sum + (day.total > 0 ? day.completed / day.total : 0), 0) / recentDays.length;
    const olderAvg = olderDays.reduce((sum: number, day: any) => 
      sum + (day.total > 0 ? day.completed / day.total : 0), 0) / olderDays.length;
    
    if (recentAvg > olderAvg + 0.1) return "improving";
    if (recentAvg < olderAvg - 0.1) return "declining";
    return "stable";
  };

  const getRecommendations = () => {
    const recommendations = [];
    const completionRate = getCompletionRate();
    const streakInsights = getStreakInsights();
    const trend = getWeeklyTrend();

    if (completionRate < 60) {
      recommendations.push({
        type: "warning",
        title: "Focus on Consistency",
        message: "Try reducing your daily goals to build stronger habits first."
      });
    }

    if (streakInsights && streakInsights.longestStreak < 7) {
      recommendations.push({
        type: "tip",
        title: "Build Your First Week",
        message: "Focus on completing one habit for 7 days straight to build momentum."
      });
    }

    if (trend === "declining") {
      recommendations.push({
        type: "alert",
        title: "Performance Declining",
        message: "Consider simplifying your routine or adjusting your goals."
      });
    }

    if (habits.length > 5) {
      recommendations.push({
        type: "tip",
        title: "Too Many Habits",
        message: "Research shows focusing on 2-3 habits at a time leads to better success."
      });
    }

    return recommendations;
  };

  const streakInsights = getStreakInsights();
  const completionRate = getCompletionRate();
  const trend = getWeeklyTrend();
  const recommendations = getRecommendations();

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span>Performance Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{completionRate}%</div>
              <div className="text-sm text-blue-700">Completion Rate</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {streakInsights?.longestStreak || 0}
              </div>
              <div className="text-sm text-green-700">Longest Streak</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Weekly Progress</span>
              <Badge variant={trend === "improving" ? "default" : trend === "declining" ? "destructive" : "secondary"}>
                {trend === "improving" ? "↗ Improving" : trend === "declining" ? "↘ Declining" : "→ Stable"}
              </Badge>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Streak Insights */}
      {streakInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-orange-500" />
              <span>Streak Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Streak</span>
              <span className="font-semibold">{streakInsights.avgStreak} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Habits with 7+ day streaks</span>
              <span className="font-semibold">{streakInsights.streakingHabits}</span>
            </div>
            {streakInsights.longestStreak >= 30 && (
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">
                    30+ Day Achievement!
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-500" />
              <span>Personalized Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  rec.type === "warning" ? "bg-yellow-50 border-yellow-200" :
                  rec.type === "alert" ? "bg-red-50 border-red-200" :
                  "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex items-start space-x-2">
                  <AlertCircle className={`w-4 h-4 mt-0.5 ${
                    rec.type === "warning" ? "text-yellow-600" :
                    rec.type === "alert" ? "text-red-600" :
                    "text-blue-600"
                  }`} />
                  <div>
                    <h4 className={`font-medium text-sm ${
                      rec.type === "warning" ? "text-yellow-800" :
                      rec.type === "alert" ? "text-red-800" :
                      "text-blue-800"
                    }`}>
                      {rec.title}
                    </h4>
                    <p className={`text-sm ${
                      rec.type === "warning" ? "text-yellow-700" :
                      rec.type === "alert" ? "text-red-700" :
                      "text-blue-700"
                    }`}>
                      {rec.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}