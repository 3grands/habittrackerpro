import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Zap, Brain, Calendar, Sparkles, Play, Pause } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";

interface SmartScheduleData {
  optimalTimes: Array<{
    habitId: number;
    habitName: string;
    suggestedTime: string;
    reason: string;
    energyLevel: 'high' | 'medium' | 'low';
    conflictRisk: number;
    adaptationNote?: string;
  }>;
  energyPattern: Array<{
    hour: number;
    energyLevel: number;
    focusLevel: number;
  }>;
  weeklyRecommendations: Array<{
    day: string;
    loadRecommendation: 'light' | 'moderate' | 'full';
    reason: string;
  }>;
}

export function SmartScheduling() {
  const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const queryClient = useQueryClient();

  const { data: habits = [] } = useQuery({
    queryKey: ["/api/habits"]
  });

  const { data: scheduleData } = useQuery<SmartScheduleData>({
    queryKey: ["/api/smart-schedule"],
    refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes
  });

  const applyScheduleMutation = useMutation({
    mutationFn: async (scheduleItem: any) => {
      const response = await fetch("/api/habits/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitId: scheduleItem.habitId,
          scheduledTime: scheduleItem.suggestedTime,
          reason: scheduleItem.reason
        })
      });
      if (!response.ok) throw new Error("Failed to apply schedule");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/smart-schedule"] });
    }
  });

  // Update current time every minute for real-time suggestions
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getCurrentEnergyLevel = () => {
    const currentHour = currentTime.getHours();
    const energyData = scheduleData?.energyPattern?.find(p => p.hour === currentHour);
    return energyData?.energyLevel || 50;
  };

  const getNextOptimalHabit = () => {
    if (!scheduleData?.optimalTimes) return null;
    
    const currentHour = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
    
    return scheduleData.optimalTimes.find(item => {
      const [itemHour, itemMinute] = item.suggestedTime.split(':').map(Number);
      const itemTimeInMinutes = itemHour * 60 + itemMinute;
      const currentTimeInMinutes = currentHour * 60 + currentMinutes;
      
      // Suggest habits within the next 30 minutes
      return itemTimeInMinutes >= currentTimeInMinutes && itemTimeInMinutes <= currentTimeInMinutes + 30;
    });
  };

  const getEnergyColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getAdhdFriendlyTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${displayHour}:${minute} ${period}`;
  };

  const nextHabit = getNextOptimalHabit();
  const currentEnergy = getCurrentEnergyLevel();

  return (
    <div className="space-y-6">
      {/* Current Energy & Next Habit */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <span>Right Now</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Auto-schedule</span>
              <Switch
                checked={autoScheduleEnabled}
                onCheckedChange={setAutoScheduleEnabled}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Energy Level</p>
              <div className="flex items-center space-x-2 mt-1">
                <Progress value={currentEnergy} className="w-20 h-2" />
                <span className="text-lg font-bold text-blue-600">{currentEnergy}%</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Time</p>
              <p className="text-xl font-bold text-gray-800">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </p>
            </div>
          </div>

          {nextHabit && (
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800">Suggested Next:</h4>
                <Badge className={`${getEnergyColor(nextHabit.energyLevel)} border`}>
                  {nextHabit.energyLevel} energy
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-700">{nextHabit.habitName}</p>
                  <p className="text-sm text-gray-600">Best time: {getAdhdFriendlyTime(nextHabit.suggestedTime)}</p>
                  <p className="text-xs text-gray-500 mt-1">{nextHabit.reason}</p>
                  {nextHabit.adaptationNote && (
                    <p className="text-xs text-purple-600 mt-1 font-medium">
                      💡 {nextHabit.adaptationNote}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => applyScheduleMutation.mutate(nextHabit)}
                  disabled={applyScheduleMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Start Now
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Energy Pattern */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            <span>Your Energy Pattern</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scheduleData?.energyPattern ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Based on your habits and completion patterns, here's when you typically have the most energy:
              </p>
              <div className="grid grid-cols-6 gap-2">
                {scheduleData.energyPattern.map((period) => {
                  const hour = period.hour;
                  const energy = period.energyLevel;
                  const timeLabel = hour === 0 ? '12 AM' : 
                                   hour < 12 ? `${hour} AM` : 
                                   hour === 12 ? '12 PM' : 
                                   `${hour - 12} PM`;
                  
                  return (
                    <div key={hour} className="text-center">
                      <div 
                        className="w-full h-8 rounded mb-1 border"
                        style={{
                          backgroundColor: `hsl(${energy * 1.2}, 70%, ${85 - energy * 0.3}%)`
                        }}
                      />
                      <span className="text-xs text-gray-600">{timeLabel}</span>
                      <div className="text-xs font-medium text-gray-700">{energy}%</div>
                    </div>
                  );
                })}
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 mt-4">
                <div className="flex items-start space-x-2">
                  <Brain className="w-4 h-4 text-purple-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-purple-800">ADHD-Friendly Insight</p>
                    <p className="text-purple-700">
                      Your peak energy times are highlighted. Schedule demanding habits during these windows 
                      and save easier routines for lower-energy periods.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Complete a few habits to see your energy pattern</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Smart Schedule Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <span>Optimized Schedule</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scheduleData?.optimalTimes && scheduleData.optimalTimes.length > 0 ? (
            <div className="space-y-3">
              {scheduleData.optimalTimes.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-medium text-gray-800">{item.habitName}</span>
                      <Badge className={`${getEnergyColor(item.energyLevel)} border text-xs`}>
                        {item.energyLevel}
                      </Badge>
                      {item.conflictRisk > 70 && (
                        <Badge variant="destructive" className="text-xs">
                          High conflict risk
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{getAdhdFriendlyTime(item.suggestedTime)}</span>
                      </span>
                      <span>{item.reason}</span>
                    </div>
                    {item.adaptationNote && (
                      <p className="text-xs text-purple-600 mt-2 font-medium bg-purple-50 p-2 rounded">
                        💡 Neurodiverse tip: {item.adaptationNote}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyScheduleMutation.mutate(item)}
                      disabled={applyScheduleMutation.isPending}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mt-4">
                <div className="flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-orange-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-orange-800">Smart Scheduling Active</p>
                    <p className="text-orange-700">
                      These times are calculated based on your energy patterns, past success rates, 
                      and sensory considerations. Times are automatically adjusted for ADHD and autistic needs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Building your personalized schedule...</p>
              <p className="text-sm">Complete a few habits to generate smart recommendations</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Load Recommendations */}
      {scheduleData?.weeklyRecommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-500" />
              <span>Weekly Planning</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {scheduleData.weeklyRecommendations.map((day, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                >
                  <div>
                    <span className="font-medium text-gray-800">{day.day}</span>
                    <p className="text-sm text-gray-600">{day.reason}</p>
                  </div>
                  <Badge
                    variant={day.loadRecommendation === 'light' ? 'secondary' : 
                             day.loadRecommendation === 'moderate' ? 'default' : 'destructive'}
                  >
                    {day.loadRecommendation} day
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}