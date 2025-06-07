import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, Plus, Calendar, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function GoalSetting() {
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalType, setGoalType] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [description, setDescription] = useState("");

  const queryClient = useQueryClient();

  const { data: goals = [] } = useQuery({
    queryKey: ["/api/goals"]
  });

  const { data: habits = [] } = useQuery({
    queryKey: ["/api/habits"]
  });

  const createGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalData)
      });
      if (!response.ok) throw new Error("Failed to create goal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setShowGoalForm(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setGoalTitle("");
    setGoalType("");
    setTargetValue("");
    setTimeframe("");
    setDescription("");
  };

  const handleCreateGoal = () => {
    if (!goalTitle || !goalType || !targetValue || !timeframe) return;

    createGoalMutation.mutate({
      title: goalTitle,
      type: goalType,
      targetValue: parseInt(targetValue),
      timeframe,
      description,
      status: "active"
    });
  };

  const calculateGoalProgress = (goal: any) => {
    if (goal.type === "streak") {
      const habit = habits.find((h: any) => h.name.toLowerCase().includes(goal.title.toLowerCase()));
      return habit ? Math.min(((habit.streak || 0) / goal.targetValue) * 100, 100) : 0;
    }
    return Math.random() * 100; // Placeholder for other goal types
  };

  const getGoalStatus = (goal: any) => {
    const progress = calculateGoalProgress(goal);
    if (progress >= 100) return "completed";
    if (progress >= 75) return "on-track";
    if (progress >= 50) return "progress";
    return "behind";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "on-track": return "bg-blue-500";
      case "progress": return "bg-yellow-500";
      default: return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Completed";
      case "on-track": return "On Track";
      case "progress": return "In Progress";
      default: return "Behind";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-purple-500" />
            <span>Goals & Milestones</span>
          </div>
          <Dialog open={showGoalForm} onOpenChange={setShowGoalForm}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <span>New Goal</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="goal-title">Goal Title</Label>
                  <Input
                    id="goal-title"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="e.g., 30-day meditation streak"
                  />
                </div>
                
                <div>
                  <Label htmlFor="goal-type">Goal Type</Label>
                  <Select value={goalType} onValueChange={setGoalType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select goal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="streak">Streak Goal</SelectItem>
                      <SelectItem value="frequency">Frequency Goal</SelectItem>
                      <SelectItem value="total">Total Completions</SelectItem>
                      <SelectItem value="milestone">Personal Milestone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="target-value">Target Value</Label>
                  <Input
                    id="target-value"
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="e.g., 30 (days)"
                  />
                </div>

                <div>
                  <Label htmlFor="timeframe">Timeframe</Label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-week">1 Week</SelectItem>
                      <SelectItem value="2-weeks">2 Weeks</SelectItem>
                      <SelectItem value="1-month">1 Month</SelectItem>
                      <SelectItem value="3-months">3 Months</SelectItem>
                      <SelectItem value="6-months">6 Months</SelectItem>
                      <SelectItem value="1-year">1 Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Why is this goal important to you?"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button 
                    onClick={handleCreateGoal}
                    disabled={!goalTitle || !goalType || !targetValue || !timeframe || createGoalMutation.isPending}
                    className="flex-1"
                  >
                    {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowGoalForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!Array.isArray(goals) || goals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No goals set yet</p>
            <p className="text-sm">Set goals to track your long-term progress</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(goals as any[]).map((goal: any) => {
              const progress = calculateGoalProgress(goal);
              const status = getGoalStatus(goal);
              
              return (
                <div key={goal.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{goal.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {goal.type}
                        </Badge>
                        <Badge className={`text-xs text-white ${getStatusColor(status)}`}>
                          {getStatusText(status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-600">
                        {Math.round(progress)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {goal.timeframe}
                      </div>
                    </div>
                  </div>
                  
                  <Progress value={progress} className="h-2" />
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Target: {goal.targetValue} {goal.type === "streak" ? "days" : "times"}</span>
                    {status === "completed" && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <Trophy className="w-4 h-4" />
                        <span>Completed!</span>
                      </div>
                    )}
                  </div>
                  
                  {goal.description && (
                    <p className="text-sm text-gray-600 italic">{goal.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Goal Suggestions */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-purple-800">Goal Suggestions</span>
          </div>
          <div className="space-y-1 text-sm text-purple-700">
            <p>• Set a 7-day streak goal for your most important habit</p>
            <p>• Create a monthly completion target (e.g., 20 out of 30 days)</p>
            <p>• Plan a 90-day transformation milestone</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}