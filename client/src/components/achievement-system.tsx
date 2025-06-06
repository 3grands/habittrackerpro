import { useQuery } from "@tanstack/react-query";
import { Trophy, Award, Star, Target, Zap, Crown, Medal, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const achievementDefinitions = [
  {
    id: "first_habit",
    name: "Getting Started",
    description: "Create your first habit",
    icon: Star,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    requirement: 1,
    type: "habits_created",
    points: 10
  },
  {
    id: "week_warrior",
    name: "Week Warrior",
    description: "Complete a 7-day streak",
    icon: Trophy,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    requirement: 7,
    type: "max_streak",
    points: 50
  },
  {
    id: "month_master",
    name: "Month Master",
    description: "Complete a 30-day streak",
    icon: Crown,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    requirement: 30,
    type: "max_streak",
    points: 200
  },
  {
    id: "perfect_week",
    name: "Perfect Week",
    description: "Complete all habits for 7 days straight",
    icon: Medal,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    requirement: 7,
    type: "perfect_days",
    points: 75
  },
  {
    id: "habit_collector",
    name: "Habit Collector",
    description: "Create 5 different habits",
    icon: Target,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    requirement: 5,
    type: "habits_created",
    points: 25
  },
  {
    id: "consistency_king",
    name: "Consistency King",
    description: "Maintain 80% completion rate for 30 days",
    icon: Zap,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    requirement: 80,
    type: "completion_rate",
    points: 150
  },
  {
    id: "centurion",
    name: "Centurion",
    description: "Complete 100 total habit check-ins",
    icon: Award,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    requirement: 100,
    type: "total_completions",
    points: 100
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Complete morning habits 10 times",
    icon: Gift,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
    requirement: 10,
    type: "morning_habits",
    points: 30
  }
];

export function AchievementSystem() {
  const { data: habits = [] } = useQuery({
    queryKey: ["/api/habits"]
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/habits/stats"]
  });

  // Calculate user progress for each achievement
  const calculateProgress = (achievement: any) => {
    const habitsArray = Array.isArray(habits) ? habits : [];
    
    switch (achievement.type) {
      case "habits_created":
        return Math.min(habitsArray.length, achievement.requirement);
      
      case "max_streak":
        const maxStreak = habitsArray.reduce((max: number, habit: any) => 
          Math.max(max, habit.streak || 0), 0);
        return Math.min(maxStreak, achievement.requirement);
      
      case "total_completions":
        // Mock calculation - would need actual completion data
        return Math.min(habitsArray.length * 5, achievement.requirement);
      
      case "completion_rate":
        const rate = (stats as any)?.completionRate || 0;
        return Math.min(Math.round(rate * 100), achievement.requirement);
      
      case "perfect_days":
        // Mock calculation - would need perfect day tracking
        return Math.min(2, achievement.requirement);
      
      case "morning_habits":
        const morningHabits = habitsArray.filter((habit: any) => 
          habit.reminderTime && parseInt(habit.reminderTime.split(':')[0]) < 12);
        return Math.min(morningHabits.length * 3, achievement.requirement);
      
      default:
        return 0;
    }
  };

  const isUnlocked = (achievement: any) => {
    return calculateProgress(achievement) >= achievement.requirement;
  };

  const getProgressPercentage = (achievement: any) => {
    return Math.min((calculateProgress(achievement) / achievement.requirement) * 100, 100);
  };

  const unlockedAchievements = achievementDefinitions.filter(isUnlocked);
  const inProgressAchievements = achievementDefinitions.filter(achievement => 
    !isUnlocked(achievement) && calculateProgress(achievement) > 0);
  const lockedAchievements = achievementDefinitions.filter(achievement => 
    !isUnlocked(achievement) && calculateProgress(achievement) === 0);

  const totalPoints = unlockedAchievements.reduce((sum, achievement) => sum + achievement.points, 0);

  return (
    <div className="space-y-6">
      {/* Achievement Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>Your Achievements</span>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {totalPoints} points
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{unlockedAchievements.length}</div>
              <div className="text-sm text-gray-600">Unlocked</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{inProgressAchievements.length}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-400">{lockedAchievements.length}</div>
              <div className="text-sm text-gray-600">Locked</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-green-500" />
              <span>Unlocked Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unlockedAchievements.map((achievement) => {
              const IconComponent = achievement.icon;
              return (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border ${achievement.borderColor} ${achievement.bgColor}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${achievement.bgColor} rounded-lg flex items-center justify-center border ${achievement.borderColor}`}>
                      <IconComponent className={`w-6 h-6 ${achievement.color}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{achievement.name}</h4>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {achievement.points} points
                        </Badge>
                        <Badge variant="default" className="text-xs bg-green-500">
                          Completed
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* In Progress Achievements */}
      {inProgressAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-orange-500" />
              <span>In Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inProgressAchievements.map((achievement) => {
              const IconComponent = achievement.icon;
              const progress = calculateProgress(achievement);
              const percentage = getProgressPercentage(achievement);
              
              return (
                <div
                  key={achievement.id}
                  className="p-4 rounded-lg border border-gray-200 bg-white"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{achievement.name}</h4>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {achievement.points} points
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {progress}/{achievement.requirement}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Medal className="w-5 h-5 text-gray-400" />
              <span>Locked Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lockedAchievements.slice(0, 3).map((achievement) => {
              const IconComponent = achievement.icon;
              
              return (
                <div
                  key={achievement.id}
                  className="p-4 rounded-lg border border-gray-200 bg-gray-50 opacity-75"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-600">{achievement.name}</h4>
                      <p className="text-sm text-gray-500">{achievement.description}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {achievement.points} points
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
            {lockedAchievements.length > 3 && (
              <div className="text-center text-sm text-gray-500 pt-2">
                +{lockedAchievements.length - 3} more achievements to unlock
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}