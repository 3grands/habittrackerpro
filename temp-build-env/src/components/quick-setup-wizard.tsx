import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, ChevronLeft, Check, Sparkles, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSmartDefaults } from "./smart-defaults";
import { useToast } from "@/hooks/use-toast";

interface QuickHabit {
  name: string;
  category: string;
  icon: string;
  selected: boolean;
  time?: string;
  goal?: number;
  unit?: string;
}

interface SetupWizardProps {
  onComplete: () => void;
}

export function QuickSetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [userLevel, setUserLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [selectedHabits, setSelectedHabits] = useState<QuickHabit[]>([
    { name: "Morning Exercise", category: "fitness", icon: "💪", selected: false },
    { name: "Meditation", category: "mindfulness", icon: "🧘", selected: false },
    { name: "Drink Water", category: "health", icon: "💧", selected: false },
    { name: "Read Books", category: "learning", icon: "📚", selected: false },
    { name: "Gratitude Journal", category: "wellness", icon: "🙏", selected: false },
    { name: "Walk 8000 Steps", category: "fitness", icon: "🚶", selected: false }
  ]);

  const { getSmartDefault, getContextualTime, getAdaptiveGoal } = useSmartDefaults();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createHabitsMutation = useMutation({
    mutationFn: async (habits: any[]) => {
      const results = [];
      for (const habit of habits) {
        const response = await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(habit)
        });
        if (response.ok) {
          results.push(await response.json());
        }
      }
      return results;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Welcome aboard!",
        description: `${data.length} habits created successfully. Start building your routine!`
      });
      onComplete();
    }
  });

  const toggleHabit = (index: number) => {
    setSelectedHabits(prev => 
      prev.map((habit, i) => 
        i === index ? { ...habit, selected: !habit.selected } : habit
      )
    );
  };

  const generateSmartHabits = () => {
    return selectedHabits
      .filter(habit => habit.selected)
      .map(habit => {
        const smartDefault = getSmartDefault(habit.name, habit.category);
        const contextualTime = getContextualTime(habit.category);
        const adaptiveGoal = getAdaptiveGoal(habit.name, userLevel);

        return {
          name: habit.name,
          category: habit.category,
          frequency: "daily",
          goal: smartDefault?.goal || adaptiveGoal,
          unit: smartDefault?.unit || "completion",
          reminderTime: smartDefault?.defaultTime || contextualTime,
          isActive: true
        };
      });
  };

  const handleFinish = () => {
    const habitsToCreate = generateSmartHabits();
    if (habitsToCreate.length > 0) {
      createHabitsMutation.mutate(habitsToCreate);
    } else {
      onComplete();
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span>Quick Setup</span>
          <Badge variant="outline">{step}/3</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Experience Level */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">What's your experience with habits?</h3>
              <p className="text-sm text-gray-600 mb-4">
                We'll customize your goals based on your experience level
              </p>
            </div>
            
            <div className="space-y-2">
              {[
                { level: "beginner" as const, label: "Just starting out", desc: "Gentle goals, focus on consistency" },
                { level: "intermediate" as const, label: "Some experience", desc: "Moderate goals, building momentum" },
                { level: "advanced" as const, label: "Habit expert", desc: "Challenging goals, optimizing routines" }
              ].map(({ level, label, desc }) => (
                <div
                  key={level}
                  onClick={() => setUserLevel(level)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    userLevel === level 
                      ? "border-primary bg-primary/5 text-primary" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium">{label}</div>
                  <div className="text-sm text-gray-600">{desc}</div>
                </div>
              ))}
            </div>

            <Button onClick={() => setStep(2)} className="w-full">
              <span>Continue</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 2: Wake Time */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">When do you usually wake up?</h3>
              <p className="text-sm text-gray-600 mb-4">
                This helps us schedule your habits at optimal times
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Smart scheduling:</strong> We'll suggest habit times based on your wake time and energy patterns
              </p>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                <span>Continue</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Select Habits */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Pick your starter habits</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select 2-4 habits to begin with. You can add more anytime.
              </p>
            </div>

            <div className="space-y-2">
              {selectedHabits.map((habit, index) => {
                const smartDefault = getSmartDefault(habit.name, habit.category);
                const goal = getAdaptiveGoal(habit.name, userLevel);
                
                return (
                  <div
                    key={index}
                    onClick={() => toggleHabit(index)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      habit.selected 
                        ? "border-primary bg-primary/5" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{habit.icon}</span>
                        <div>
                          <div className="font-medium">{habit.name}</div>
                          <div className="text-sm text-gray-600">
                            {smartDefault?.defaultTime} • {goal} {smartDefault?.unit}
                          </div>
                        </div>
                      </div>
                      {habit.selected && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    {habit.selected && smartDefault?.adaptiveNote && (
                      <div className="mt-2 text-xs text-primary bg-primary/10 p-2 rounded">
                        💡 {smartDefault.adaptiveNote}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-sm text-green-700">
                <strong>Smart tip:</strong> Start with 2-3 habits for the first week, then gradually add more
              </p>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button 
                onClick={handleFinish} 
                disabled={createHabitsMutation.isPending || selectedHabits.filter(h => h.selected).length === 0}
                className="flex-1"
              >
                {createHabitsMutation.isPending ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Start Journey
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}