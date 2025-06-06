import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Plus, Clock, Trash2, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { HabitWithProgress, Reminder } from "@/lib/types";

export function SmartReminders() {
  const [selectedHabitId, setSelectedHabitId] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("09:00");
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: habits = [] } = useQuery<HabitWithProgress[]>({
    queryKey: ["/api/habits"],
  });

  const { data: reminders = [] } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"],
  });

  const createReminderMutation = useMutation({
    mutationFn: async (data: { habitId: number; time: string }) => {
      return apiRequest("POST", "/api/reminders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      setSelectedHabitId("");
      setSelectedTime("09:00");
      setShowAddForm(false);
    },
  });

  const handleCreateReminder = () => {
    if (selectedHabitId && selectedTime) {
      createReminderMutation.mutate({
        habitId: parseInt(selectedHabitId),
        time: selectedTime,
      });
    }
  };

  const getHabitName = (habitId: number) => {
    const habit = habits.find(h => h.id === habitId);
    return habit?.name || "Unknown Habit";
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 6; hour <= 22; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const displayTime = formatTime(time);
      times.push({ value: time, label: displayTime });
    }
    return times;
  };

  const getOptimalReminderTime = (habit: HabitWithProgress) => {
    // Simple logic to suggest optimal times based on habit category
    switch (habit.category) {
      case "health":
        return "08:00"; // Morning for health habits
      case "fitness":
        return "07:00"; // Early morning for fitness
      case "mindfulness":
        return "21:00"; // Evening for mindfulness
      case "learning":
        return "19:00"; // Evening for learning
      case "productivity":
        return "09:00"; // Start of workday
      default:
        return "10:00";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BellRing className="w-5 h-5 text-primary" />
            <span>Smart Reminders</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-primary border-primary hover:bg-primary hover:text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add Reminder Form */}
        {showAddForm && (
          <div className="p-4 bg-gray-50 rounded-xl space-y-4">
            <h4 className="font-medium text-gray-700">Create New Reminder</h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Select Habit
                </label>
                <Select value={selectedHabitId} onValueChange={setSelectedHabitId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a habit" />
                  </SelectTrigger>
                  <SelectContent>
                    {habits.map((habit) => (
                      <SelectItem key={habit.id} value={habit.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <span>{habit.name}</span>
                          <span className="text-xs text-gray-500">
                            (Suggested: {formatTime(getOptimalReminderTime(habit))})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Reminder Time
                </label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {generateTimeOptions().map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleCreateReminder}
                  disabled={!selectedHabitId || !selectedTime || createReminderMutation.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {createReminderMutation.isPending ? "Creating..." : "Create Reminder"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Reminders */}
        <div className="space-y-3">
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No reminders set up yet</p>
              <p className="text-xs">Add reminders to stay on track with your habits</p>
            </div>
          ) : (
            <>
              <h4 className="font-medium text-gray-700 flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Active Reminders ({reminders.filter(r => r.isActive).length})</span>
              </h4>
              
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                      <Bell className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800">
                        {getHabitName(reminder.habitId)}
                      </h5>
                      <p className="text-sm text-gray-500">
                        {formatTime(reminder.time)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={reminder.isActive}
                      onCheckedChange={() => {
                        // TODO: Implement toggle reminder
                        console.log("Toggle reminder", reminder.id);
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        // TODO: Implement delete reminder
                        console.log("Delete reminder", reminder.id);
                      }}
                      className="text-gray-400 hover:text-red-500 w-8 h-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Smart Suggestions */}
        {habits.length > 0 && reminders.length === 0 && (
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center space-x-2">
              <BellRing className="w-4 h-4" />
              <span>Smart Suggestions</span>
            </h4>
            <p className="text-sm text-blue-700 mb-3">
              Based on your habits, here are optimal reminder times:
            </p>
            <div className="space-y-2">
              {habits.slice(0, 3).map((habit) => (
                <div key={habit.id} className="flex items-center justify-between text-sm">
                  <span className="text-blue-800">{habit.name}</span>
                  <span className="text-blue-600 font-medium">
                    {formatTime(getOptimalReminderTime(habit))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}