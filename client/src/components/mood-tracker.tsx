import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, TrendingUp, Heart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

const moodEmojis = [
  { value: 1, emoji: "😢", label: "Very Sad" },
  { value: 2, emoji: "😕", label: "Sad" },
  { value: 3, emoji: "😐", label: "Neutral" },
  { value: 4, emoji: "😊", label: "Happy" },
  { value: 5, emoji: "😄", label: "Very Happy" }
];

const energyEmojis = [
  { value: 1, emoji: "😴", label: "Very Low" },
  { value: 2, emoji: "😪", label: "Low" },
  { value: 3, emoji: "😌", label: "Moderate" },
  { value: 4, emoji: "⚡", label: "High" },
  { value: 5, emoji: "🔥", label: "Very High" }
];

export function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedEnergy, setSelectedEnergy] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);
  
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: todayMood } = useQuery({
    queryKey: ["/api/mood", today],
    enabled: !showForm
  });

  const { data: recentMoods } = useQuery({
    queryKey: ["/api/mood/recent"]
  });

  const saveMoodMutation = useMutation({
    mutationFn: async (data: { mood: number; energy: number; notes?: string }) => {
      const response = await fetch("/api/mood", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: today,
          mood: data.mood,
          energy: data.energy,
          notes: data.notes
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to save mood entry");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mood"] });
      setShowForm(false);
      setSelectedMood(null);
      setSelectedEnergy(null);
      setNotes("");
    }
  });

  const handleSave = () => {
    if (selectedMood && selectedEnergy) {
      saveMoodMutation.mutate({
        mood: selectedMood,
        energy: selectedEnergy,
        notes: notes.trim() || undefined
      });
    }
  };

  const getAverageMood = () => {
    if (!recentMoods || recentMoods.length === 0) return 0;
    const sum = recentMoods.reduce((acc: number, mood: any) => acc + mood.mood, 0);
    return (sum / recentMoods.length).toFixed(1);
  };

  const getAverageEnergy = () => {
    if (!recentMoods || recentMoods.length === 0) return 0;
    const sum = recentMoods.reduce((acc: number, mood: any) => acc + mood.energy, 0);
    return (sum / recentMoods.length).toFixed(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Heart className="w-5 h-5 text-red-500" />
          <span>Daily Mood Check-in</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {todayMood && !showForm ? (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-green-800">Today's Check-in Complete!</h4>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{moodEmojis.find(m => m.value === todayMood.mood)?.emoji}</span>
                      <span className="text-sm text-green-700">Mood</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{energyEmojis.find(e => e.value === todayMood.energy)?.emoji}</span>
                      <span className="text-sm text-green-700">Energy</span>
                    </div>
                  </div>
                  {todayMood.notes && (
                    <p className="text-sm text-green-700 mt-2 italic">"{todayMood.notes}"</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(true)}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  Update
                </Button>
              </div>
            </div>

            {/* Recent Trends */}
            {recentMoods && recentMoods.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-800">7-Day Average</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{getAverageMood()}</div>
                    <div className="text-xs text-gray-600">Mood</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{getAverageEnergy()}</div>
                    <div className="text-xs text-gray-600">Energy</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Mood Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How are you feeling today?
              </label>
              <div className="flex justify-between space-x-2">
                {moodEmojis.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => setSelectedMood(mood.value)}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      selectedMood === mood.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl mb-1">{mood.emoji}</span>
                    <span className="text-xs text-gray-600">{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Energy Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Zap className="w-4 h-4 inline mr-1" />
                What's your energy level?
              </label>
              <div className="flex justify-between space-x-2">
                {energyEmojis.map((energy) => (
                  <button
                    key={energy.value}
                    onClick={() => setSelectedEnergy(energy.value)}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      selectedEnergy === energy.value
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl mb-1">{energy.emoji}</span>
                    <span className="text-xs text-gray-600">{energy.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Any notes? (optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What influenced your mood today?"
                className="resize-none"
                rows={3}
              />
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={!selectedMood || !selectedEnergy || saveMoodMutation.isPending}
              className="w-full"
            >
              {saveMoodMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Saving...</span>
                </div>
              ) : (
                "Save Check-in"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}