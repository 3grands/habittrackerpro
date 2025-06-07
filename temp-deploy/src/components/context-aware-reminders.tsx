import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, MapPin, Cloud, Calendar, Zap, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface ContextualReminder {
  id: number;
  habitId: number;
  habitName: string;
  baseTime: string;
  contextualTime: string;
  context: {
    weather?: string;
    location?: string;
    dayType?: 'weekday' | 'weekend';
    energyLevel?: 'high' | 'medium' | 'low';
    previousSuccess?: boolean;
  };
  adaptiveMessage: string;
  priority: 'high' | 'medium' | 'low';
  streakRisk?: boolean;
}

export function ContextAwareReminders() {
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [streakProtectionEnabled, setStreakProtectionEnabled] = useState(true);
  const [currentContext, setCurrentContext] = useState({
    timeOfDay: new Date().getHours(),
    dayOfWeek: new Date().getDay(),
    weather: 'clear',
    location: 'home'
  });

  const queryClient = useQueryClient();

  const { data: habits = [] } = useQuery({
    queryKey: ["/api/habits"]
  });

  const { data: reminders = [] } = useQuery<ContextualReminder[]>({
    queryKey: ["/api/contextual-reminders"],
    refetchInterval: 60000 // Check every minute
  });

  const scheduleReminderMutation = useMutation({
    mutationFn: async (reminder: any) => {
      const response = await fetch("/api/contextual-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reminder)
      });
      if (!response.ok) throw new Error("Failed to schedule reminder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contextual-reminders"] });
    }
  });

  const generateContextualMessage = (habit: any, context: any) => {
    const messages = [];
    const timeGreeting = context.timeOfDay < 12 ? "Good morning" : 
                        context.timeOfDay < 17 ? "Good afternoon" : "Good evening";

    // Base message
    messages.push(`${timeGreeting}! Time for ${habit.name.toLowerCase()}`);

    // Weather context
    if (context.weather === 'rain' && habit.category.includes('fitness')) {
      messages.push("Perfect indoor workout weather!");
    } else if (context.weather === 'sunny' && habit.category.includes('fitness')) {
      messages.push("Beautiful day for outdoor activity!");
    }

    // Energy level context
    if (context.timeOfDay >= 6 && context.timeOfDay <= 10) {
      messages.push("Your energy is at its peak right now");
    } else if (context.timeOfDay >= 14 && context.timeOfDay <= 16) {
      messages.push("Great time to refocus and recharge");
    }

    // Streak context
    if (habit.streak > 0) {
      if (habit.streak >= 7) {
        messages.push(`Keep your ${habit.streak}-day streak alive!`);
      } else {
        messages.push(`Day ${habit.streak + 1} of building this habit`);
      }
    }

    // ADHD/Autism friendly additions
    if (habit.category.includes('mindfulness')) {
      messages.push("Find a quiet space and breathe");
    } else if (habit.category.includes('fitness')) {
      messages.push("Start small, you've got this");
    }

    return messages.join(". ");
  };

  const getStreakRiskHabits = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getHours();

    return habits.filter((habit: any) => {
      // Check if habit hasn't been completed today
      if (habit.isCompletedToday) return false;

      // Check if we're getting close to end of day
      const reminderHour = habit.reminderTime ? parseInt(habit.reminderTime.split(':')[0]) : 9;
      const hoursLate = currentHour - reminderHour;

      // Risk if more than 4 hours past reminder time or after 8 PM
      return hoursLate > 4 || currentHour >= 20;
    });
  };

  const createStreakProtectionReminder = (habit: any) => {
    const riskLevel = habit.streak >= 7 ? 'high' : habit.streak >= 3 ? 'medium' : 'low';
    
    return {
      habitId: habit.id,
      habitName: habit.name,
      type: 'streak_protection',
      message: `Don't break your ${habit.streak}-day streak! Quick ${habit.name.toLowerCase()} session?`,
      priority: riskLevel,
      suggestedActions: [
        'Do a 5-minute version',
        'Reschedule for tomorrow morning',
        'Set a gentle reminder in 1 hour'
      ]
    };
  };

  const scheduleAdaptiveReminder = (habit: any) => {
    const context = currentContext;
    const message = generateContextualMessage(habit, context);
    
    scheduleReminderMutation.mutate({
      habitId: habit.id,
      message,
      context,
      scheduledTime: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
    });
  };

  useEffect(() => {
    // Update context periodically
    const updateContext = () => {
      setCurrentContext({
        timeOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
        weather: 'clear', // Would integrate with weather API
        location: 'home' // Would integrate with geolocation
      });
    };

    const interval = setInterval(updateContext, 60000);
    return () => clearInterval(interval);
  }, []);

  const streakRiskHabits = getStreakRiskHabits();

  return (
    <div className="space-y-6">
      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-500" />
            <span>Smart Reminders</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Context-aware reminders</span>
              <p className="text-sm text-gray-600">Adapt messages based on time, weather, and energy</p>
            </div>
            <Switch
              checked={remindersEnabled}
              onCheckedChange={setRemindersEnabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Streak protection</span>
              <p className="text-sm text-gray-600">Alert when habits are at risk of breaking</p>
            </div>
            <Switch
              checked={streakProtectionEnabled}
              onCheckedChange={setStreakProtectionEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Streak Protection Alerts */}
      {streakProtectionEnabled && streakRiskHabits.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <Shield className="w-5 h-5" />
              <span>Streak Protection</span>
              <Badge variant="destructive">{streakRiskHabits.length} at risk</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {streakRiskHabits.map((habit: any) => {
              const protection = createStreakProtectionReminder(habit);
              return (
                <div key={habit.id} className="bg-white p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{habit.name}</span>
                    <Badge 
                      variant={protection.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {habit.streak} day streak
                    </Badge>
                  </div>
                  <p className="text-sm text-orange-700 mb-3">{protection.message}</p>
                  <div className="flex flex-wrap gap-2">
                    {protection.suggestedActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => scheduleAdaptiveReminder(habit)}
                        className="text-xs"
                      >
                        {action}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Current Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-green-500" />
            <span>Current Context</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Time of Day</p>
                <p className="text-xs text-gray-600">
                  {currentContext.timeOfDay < 12 ? 'Morning' : 
                   currentContext.timeOfDay < 17 ? 'Afternoon' : 'Evening'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Cloud className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Weather</p>
                <p className="text-xs text-gray-600 capitalize">{currentContext.weather}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MapPin className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-xs text-gray-600 capitalize">{currentContext.location}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Zap className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Energy Level</p>
                <p className="text-xs text-gray-600">
                  {currentContext.timeOfDay >= 6 && currentContext.timeOfDay <= 10 ? 'High' :
                   currentContext.timeOfDay >= 14 && currentContext.timeOfDay <= 16 ? 'Medium' : 'Low'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Reminders */}
      {reminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-purple-500" />
              <span>Upcoming Reminders</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reminders.slice(0, 3).map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-800">{reminder.habitName}</span>
                    <Badge 
                      variant={reminder.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {reminder.priority}
                    </Badge>
                    {reminder.streakRisk && (
                      <Badge variant="outline" className="text-xs text-orange-600">
                        Streak risk
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{reminder.adaptiveMessage}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {reminder.contextualTime} • {reminder.context.weather} • {reminder.context.location}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ADHD/Autism Friendly Tips */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <Zap className="w-4 h-4 text-purple-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-purple-800">Reminder Tips</p>
              <p className="text-purple-700">
                Reminders adapt to your energy levels and environment. 
                High-energy activities get scheduled during peak times, 
                while calming habits are suggested for wind-down periods.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}