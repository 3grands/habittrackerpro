import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Smile, Frown, Meh, Heart, Battery } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { MoodEntry } from "@/lib/types";

export function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<number>(3);
  const [selectedEnergy, setSelectedEnergy] = useState<number>(3);
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: todaysMood } = useQuery<MoodEntry | null>({
    queryKey: ["/api/mood/today"],
  });

  const saveMoodMutation = useMutation({
    mutationFn: async (data: { mood: number; energy: number; notes?: string }) => {
      return apiRequest("POST", "/api/mood", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mood/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mood"] });
    },
  });

  const handleSaveMood = () => {
    saveMoodMutation.mutate({
      mood: selectedMood,
      energy: selectedEnergy,
      notes: notes.trim() || undefined,
    });
  };

  const moodIcons = [
    { value: 1, icon: <Frown className="w-6 h-6" />, label: "Very Low", color: "text-red-500" },
    { value: 2, icon: <Frown className="w-6 h-6" />, label: "Low", color: "text-orange-500" },
    { value: 3, icon: <Meh className="w-6 h-6" />, label: "Neutral", color: "text-yellow-500" },
    { value: 4, icon: <Smile className="w-6 h-6" />, label: "Good", color: "text-green-500" },
    { value: 5, icon: <Heart className="w-6 h-6" />, label: "Excellent", color: "text-emerald-500" },
  ];

  const energyLevels = [
    { value: 1, label: "Exhausted", color: "text-red-500" },
    { value: 2, label: "Tired", color: "text-orange-500" },
    { value: 3, label: "Okay", color: "text-yellow-500" },
    { value: 4, label: "Energetic", color: "text-green-500" },
    { value: 5, label: "High Energy", color: "text-emerald-500" },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Heart className="w-5 h-5 text-primary" />
          <span>How are you feeling today?</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mood Selection */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Mood</h4>
          <div className="flex justify-between space-x-2">
            {moodIcons.map((mood) => (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                  selectedMood === mood.value
                    ? "bg-primary bg-opacity-10 border-2 border-primary"
                    : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                }`}
              >
                <div className={selectedMood === mood.value ? "text-primary" : mood.color}>
                  {mood.icon}
                </div>
                <span className="text-xs font-medium mt-1">{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy Selection */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3 flex items-center space-x-2">
            <Battery className="w-4 h-4" />
            <span>Energy Level</span>
          </h4>
          <div className="flex justify-between space-x-2">
            {energyLevels.map((energy) => (
              <button
                key={energy.value}
                onClick={() => setSelectedEnergy(energy.value)}
                className={`flex-1 p-2 rounded-lg text-center transition-all ${
                  selectedEnergy === energy.value
                    ? "bg-primary bg-opacity-10 border-2 border-primary text-primary"
                    : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                }`}
              >
                <div className="text-lg font-bold">{energy.value}</div>
                <div className="text-xs">{energy.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Notes (optional)</h4>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How was your day? Any thoughts or reflections..."
            className="resize-none"
            rows={3}
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSaveMood}
          disabled={saveMoodMutation.isPending}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {saveMoodMutation.isPending ? "Saving..." : todaysMood ? "Update Today's Mood" : "Save Mood"}
        </Button>

        {/* Current Mood Display */}
        {todaysMood && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <h5 className="font-medium text-gray-700 mb-2">Today's Entry</h5>
            <div className="flex items-center space-x-4 text-sm">
              <span className="flex items-center space-x-1">
                <Heart className="w-4 h-4" />
                <span>Mood: {todaysMood.mood}/5</span>
              </span>
              <span className="flex items-center space-x-1">
                <Battery className="w-4 h-4" />
                <span>Energy: {todaysMood.energy}/5</span>
              </span>
            </div>
            {todaysMood.notes && (
              <p className="text-sm text-gray-600 mt-2">{todaysMood.notes}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}