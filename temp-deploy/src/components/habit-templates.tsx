import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Dumbbell, Heart, Brain, Coffee, Droplets, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const habitTemplates = [
  {
    id: 1,
    name: "Morning Meditation",
    category: "Mindfulness",
    icon: Brain,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    frequency: "daily",
    goal: 1,
    unit: "session",
    reminderTime: "07:00",
    description: "Start your day with 10 minutes of mindfulness",
    tags: ["morning", "mental-health", "stress-relief"]
  },
  {
    id: 2,
    name: "Daily Exercise",
    category: "Fitness",
    icon: Dumbbell,
    color: "text-red-600",
    bgColor: "bg-red-50",
    frequency: "daily",
    goal: 30,
    unit: "minutes",
    reminderTime: "18:00",
    description: "30 minutes of physical activity",
    tags: ["fitness", "health", "energy"]
  },
  {
    id: 3,
    name: "Read Books",
    category: "Learning",
    icon: BookOpen,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    frequency: "daily",
    goal: 20,
    unit: "pages",
    reminderTime: "20:00",
    description: "Read 20 pages of a book daily",
    tags: ["learning", "knowledge", "evening"]
  },
  {
    id: 4,
    name: "Drink Water",
    category: "Health",
    icon: Droplets,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    frequency: "daily",
    goal: 8,
    unit: "glasses",
    reminderTime: "10:00",
    description: "Stay hydrated with 8 glasses of water",
    tags: ["health", "hydration", "wellness"]
  },
  {
    id: 5,
    name: "Gratitude Journal",
    category: "Mindfulness",
    icon: Heart,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    frequency: "daily",
    goal: 3,
    unit: "items",
    reminderTime: "21:00",
    description: "Write down 3 things you're grateful for",
    tags: ["gratitude", "mindfulness", "evening"]
  },
  {
    id: 6,
    name: "Morning Coffee Ritual",
    category: "Routine",
    icon: Coffee,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    frequency: "daily",
    goal: 1,
    unit: "cup",
    reminderTime: "08:00",
    description: "Mindful morning coffee routine",
    tags: ["morning", "routine", "mindfulness"]
  },
  {
    id: 7,
    name: "Early Bedtime",
    category: "Sleep",
    icon: Moon,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    frequency: "daily",
    goal: 1,
    unit: "bedtime",
    reminderTime: "22:00",
    description: "Get to bed by 10 PM for better sleep",
    tags: ["sleep", "health", "routine"]
  },
  {
    id: 8,
    name: "Morning Sunlight",
    category: "Health",
    icon: Sun,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    frequency: "daily",
    goal: 10,
    unit: "minutes",
    reminderTime: "07:30",
    description: "Get 10 minutes of natural sunlight",
    tags: ["morning", "health", "vitamin-d"]
  }
];

export function HabitTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createHabitFromTemplate = useMutation({
    mutationFn: async (template: any) => {
      const response = await fetch("/api/habits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: template.name,
          category: template.category,
          frequency: template.frequency,
          goal: template.goal,
          unit: template.unit,
          reminderTime: template.reminderTime
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to create habit");
      }
      
      return response.json();
    },
    onSuccess: (data, template) => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Habit Created!",
        description: `${template.name} has been added to your habits.`,
      });
      setSelectedTemplate(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create habit. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleCreateHabit = (template: any) => {
    createHabitFromTemplate.mutate(template);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-green-500" />
          <span>Popular Habit Templates</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {habitTemplates.map((template) => {
            const IconComponent = template.icon;
            const isSelected = selectedTemplate === template.id;
            
            return (
              <div
                key={template.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedTemplate(isSelected ? null : template.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`w-10 h-10 ${template.bgColor} rounded-lg flex items-center justify-center`}>
                      <IconComponent className={`w-5 h-5 ${template.color}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{template.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {template.goal} {template.unit}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <div className="flex space-x-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateHabit(template);
                        }}
                        disabled={createHabitFromTemplate.isPending}
                        className="flex-1"
                        size="sm"
                      >
                        {createHabitFromTemplate.isPending ? "Adding..." : "Add This Habit"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemplate(null);
                        }}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-600 space-y-1">
                      <div>⏰ Reminder: {template.reminderTime}</div>
                      <div>📅 Frequency: {template.frequency}</div>
                      <div>🎯 Goal: {template.goal} {template.unit} per day</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-start space-x-2">
            <BookOpen className="w-4 h-4 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-800">Quick Start Tips</p>
              <p className="text-green-700">
                These templates are scientifically-backed habits that thousands of people have successfully built. 
                Start with 1-2 habits and gradually add more as they become automatic.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}