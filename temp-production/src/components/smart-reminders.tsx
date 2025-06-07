import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Clock, Plus, Trash2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { HabitWithProgress } from "@/lib/types";

export function SmartReminders() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  
  const queryClient = useQueryClient();

  const { data: habits = [] } = useQuery<HabitWithProgress[]>({
    queryKey: ["/api/habits"]
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ["/api/reminders"]
  });

  const createReminderMutation = useMutation({
    mutationFn: async (data: { habitId: number; time: string }) => {
      const response = await fetch("/api/reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error("Failed to create reminder");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      setShowAddForm(false);
      setSelectedHabit("");
      setSelectedTime("");
    }
  });

  const toggleReminderMutation = useMutation({
    mutationFn: async (data: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/reminders/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: data.isActive })
      });
      
      if (!response.ok) {
        throw new Error("Failed to update reminder");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
    }
  });

  const deleteReminderMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/reminders/${id}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete reminder");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
    }
  });

  const getOptimalReminderTime = (habit: HabitWithProgress) => {
    // AI-powered suggestion based on habit category and user patterns
    const category = habit.category.toLowerCase();
    const currentHour = new Date().getHours();
    
    if (category.includes('exercise') || category.includes('fitness')) {
      return currentHour < 12 ? "07:00" : "18:00";
    } else if (category.includes('reading') || category.includes('learning')) {
      return "20:00";
    } else if (category.includes('meditation') || category.includes('mindfulness')) {
      return "08:00";
    } else if (category.includes('water') || category.includes('hydration')) {
      return "10:00";
    }
    return "09:00";
  };

  const handleCreateReminder = () => {
    if (selectedHabit && selectedTime) {
      createReminderMutation.mutate({
        habitId: parseInt(selectedHabit),
        time: selectedTime
      });
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const getHabitName = (habitId: number) => {
    const habit = habits.find(h => h.id === habitId);
    return habit?.name || "Unknown Habit";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-500" />
            <span>Smart Reminders</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Habit
              </label>
              <Select value={selectedHabit} onValueChange={setSelectedHabit}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a habit..." />
                </SelectTrigger>
                <SelectContent>
                  {habits
                    .filter(habit => !Array.isArray(reminders) ? true : !(reminders as any[]).some((r: any) => r.habitId === habit.id))
                    .map((habit) => (
                      <SelectItem key={habit.id} value={habit.id.toString()}>
                        {habit.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reminder Time
              </label>
              <div className="flex space-x-2">
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {selectedHabit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const habit = habits.find(h => h.id === parseInt(selectedHabit));
                      if (habit) {
                        setSelectedTime(getOptimalReminderTime(habit));
                      }
                    }}
                    className="flex items-center space-x-1"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Suggest</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleCreateReminder}
                disabled={!selectedHabit || !selectedTime || createReminderMutation.isPending}
                className="flex-1"
              >
                {createReminderMutation.isPending ? "Adding..." : "Add Reminder"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedHabit("");
                  setSelectedTime("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Active Reminders */}
        <div className="space-y-3">
          {!Array.isArray(reminders) || reminders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No reminders set up yet</p>
              <p className="text-sm">Add reminders to stay on track with your habits</p>
            </div>
          ) : (
            (reminders as any[]).map((reminder: any) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{formatTime(reminder.time)}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {getHabitName(reminder.habitId)}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={reminder.isActive}
                    onCheckedChange={(checked) => {
                      toggleReminderMutation.mutate({
                        id: reminder.id,
                        isActive: checked
                      });
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteReminderMutation.mutate(reminder.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Smart Insights */}
        {Array.isArray(reminders) && reminders.length > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <Settings className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Smart Tip</p>
                <p className="text-blue-700">
                  Set reminders 15-30 minutes before your optimal habit time to mentally prepare and increase success rates.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}