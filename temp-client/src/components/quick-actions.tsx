import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, RotateCcw, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { HabitWithProgress } from "@/lib/types";

export function QuickActions() {
  const [completingHabits, setCompletingHabits] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: habits = [], isLoading } = useQuery<HabitWithProgress[]>({
    queryKey: ["/api/habits"]
  });

  const completeHabitMutation = useMutation({
    mutationFn: async (habitId: number) => {
      const response = await fetch(`/api/habits/${habitId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error("Failed to complete habit");
      return response.json();
    },
    onMutate: (habitId) => {
      setCompletingHabits(prev => new Set(prev.add(habitId)));
    },
    onSuccess: (data, habitId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits/stats"] });
      setCompletingHabits(prev => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
      
      toast({
        title: "Great job!",
        description: data.message || "Habit completed successfully",
      });
    },
    onError: (error, habitId) => {
      setCompletingHabits(prev => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
      
      toast({
        title: "Oops!",
        description: "Failed to complete habit. Try again.",
        variant: "destructive"
      });
    }
  });

  const undoCompletionMutation = useMutation({
    mutationFn: async (habitId: number) => {
      const response = await fetch(`/api/habits/${habitId}/undo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error("Failed to undo completion");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits/stats"] });
      
      toast({
        title: "Undone",
        description: "Habit completion removed",
      });
    }
  });

  const incompleteHabits = habits.filter(habit => !habit.isCompletedToday && habit.isActive);
  const completedHabits = habits.filter(habit => habit.isCompletedToday);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Incomplete Habits - Quick Complete */}
      {incompleteHabits.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <span>Quick Complete</span>
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {incompleteHabits.map((habit) => (
                <div
                  key={habit.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-800">{habit.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {habit.category}
                      </Badge>
                      {habit.reminderTime && (
                        <Badge variant="secondary" className="text-xs flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{habit.reminderTime}</span>
                        </Badge>
                      )}
                    </div>
                    {habit.streak > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        🔥 {habit.streak} day streak
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => completeHabitMutation.mutate(habit.id)}
                    disabled={completingHabits.has(habit.id)}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    {completingHabits.has(habit.id) ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Done
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Habits - Show with Undo Option */}
      {completedHabits.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Completed Today</span>
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {completedHabits.map((habit) => (
                <div
                  key={habit.id}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-800 line-through decoration-green-500">
                        {habit.name}
                      </span>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        ✓ Complete
                      </Badge>
                    </div>
                    {habit.streak > 0 && (
                      <p className="text-sm text-green-600 mt-1">
                        🔥 {habit.streak} day streak
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => undoCompletionMutation.mutate(habit.id)}
                    disabled={undoCompletionMutation.isPending}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Undo
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Habits State */}
      {habits.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Plus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h3 className="font-medium text-gray-800 mb-2">Ready to start?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Add your first habit to begin building better routines
            </p>
          </CardContent>
        </Card>
      )}

      {/* All Done State */}
      {habits.length > 0 && incompleteHabits.length === 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-6 text-center">
            <Check className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <h3 className="font-medium text-green-800 mb-2">All done for today!</h3>
            <p className="text-sm text-green-600">
              You've completed all your habits. Great consistency! 🎉
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}