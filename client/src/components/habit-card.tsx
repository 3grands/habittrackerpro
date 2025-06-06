import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Check } from "lucide-react";
import { HabitWithProgress } from "@/lib/types";
import { sanitizeText } from "@/lib/sanitize";

interface HabitCardProps {
  habit: HabitWithProgress;
}

export function HabitCard({ habit }: HabitCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: async () => {
      setIsToggling(true);
      return apiRequest("POST", `/api/habits/${habit.id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits/stats"] });
    },
    onSettled: () => {
      setIsToggling(false);
    },
  });

  const progressPercentage = habit.goal > 0 ? (habit.todayProgress / habit.goal) * 100 : 0;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "health":
        return "💧";
      case "fitness":
        return "💪";
      case "mindfulness":
        return "🧘";
      case "learning":
        return "📚";
      case "productivity":
        return "⚡";
      default:
        return "🎯";
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => toggleMutation.mutate()}
            disabled={isToggling}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              habit.isCompletedToday
                ? "bg-primary border-2 border-primary text-white"
                : "border-2 border-primary hover:bg-primary hover:text-white"
            } disabled:opacity-50`}
          >
            <Check className={`w-3 h-3 ${habit.isCompletedToday ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
          </button>
          <div>
            <h3 className={`font-semibold text-gray-800 ${habit.isCompletedToday ? "line-through opacity-60" : ""}`}>
              {habit.name}
            </h3>
            <div className="flex items-center space-x-2 text-sm">
              {habit.isCompletedToday ? (
                <span className="text-success">✓ Completed</span>
              ) : (
                <span className="text-gray-500">
                  {habit.streak > 0 ? `🔥 ${habit.streak} day streak` : "Start your streak!"}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center text-sm">
            {getCategoryIcon(habit.category)}
          </div>
        </div>
      </div>
      
      {!habit.isCompletedToday && habit.goal > 1 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{habit.todayProgress}/{habit.goal}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
