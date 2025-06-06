import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Brain, Heart, Clock, Zap, Target, CheckCircle, AlertTriangle, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NeurodiverseRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'adhd' | 'autism' | 'both';
  difficulty: 'easy' | 'medium' | 'hard';
  timeEstimate: string;
  sensoryConsiderations: string[];
  executiveFunctionSupport: string[];
  adaptations: string[];
  evidenceBased: boolean;
  habitTemplate?: {
    name: string;
    frequency: string;
    goal: number;
    unit: string;
    reminderTime: string;
  };
}

export function NeurodiverseRecommendations() {
  const [selectedCategory, setSelectedCategory] = useState<'adhd' | 'autism' | 'both'>('both');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  const { data: userProfile } = useQuery({
    queryKey: ["/api/user/profile"]
  });

  const { data: currentHabits = [] } = useQuery({
    queryKey: ["/api/habits"]
  });

  const createHabitMutation = useMutation({
    mutationFn: async (habitTemplate: any) => {
      const response = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(habitTemplate)
      });
      if (!response.ok) throw new Error("Failed to create habit");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
    }
  });

  const recommendations: NeurodiverseRecommendation[] = [
    {
      id: "body-doubling",
      title: "Virtual Body Doubling",
      description: "Work alongside others online for accountability and focus",
      category: "adhd",
      difficulty: "easy",
      timeEstimate: "15-60 minutes",
      sensoryConsiderations: ["Adjustable background sounds", "Video optional"],
      executiveFunctionSupport: ["External accountability", "Reduced decision fatigue"],
      adaptations: ["Start with 15-minute sessions", "Use familiar platforms"],
      evidenceBased: true,
      habitTemplate: {
        name: "Body Doubling Session",
        frequency: "daily",
        goal: 1,
        unit: "session",
        reminderTime: "14:00"
      }
    },
    {
      id: "sensory-break",
      title: "Scheduled Sensory Breaks",
      description: "Regular breaks for sensory regulation and processing",
      category: "autism",
      difficulty: "easy",
      timeEstimate: "5-15 minutes",
      sensoryConsiderations: ["Quiet space", "Dim lighting", "Comfortable temperature"],
      executiveFunctionSupport: ["Timer-based", "Visual cues", "Routine building"],
      adaptations: ["Use noise-canceling headphones", "Create a sensory kit"],
      evidenceBased: true,
      habitTemplate: {
        name: "Sensory Break",
        frequency: "daily",
        goal: 3,
        unit: "breaks",
        reminderTime: "11:00"
      }
    },
    {
      id: "transition-ritual",
      title: "Transition Rituals",
      description: "Structured activities to ease between tasks or environments",
      category: "both",
      difficulty: "medium",
      timeEstimate: "3-10 minutes",
      sensoryConsiderations: ["Consistent sensory input", "Predictable sequence"],
      executiveFunctionSupport: ["Clear structure", "Reduces cognitive load"],
      adaptations: ["Create visual sequence cards", "Start with 3-step ritual"],
      evidenceBased: true,
      habitTemplate: {
        name: "Transition Ritual",
        frequency: "daily",
        goal: 5,
        unit: "transitions",
        reminderTime: "09:00"
      }
    },
    {
      id: "dopamine-menu",
      title: "Dopamine Menu Planning",
      description: "Pre-planned list of activities that provide dopamine hits",
      category: "adhd",
      difficulty: "medium",
      timeEstimate: "10-30 minutes",
      sensoryConsiderations: ["Varied sensory experiences", "Quick gratification"],
      executiveFunctionSupport: ["Reduces decision paralysis", "Pre-planned options"],
      adaptations: ["Create categories: small, medium, large rewards", "Visual menu format"],
      evidenceBased: true,
      habitTemplate: {
        name: "Check Dopamine Menu",
        frequency: "daily",
        goal: 1,
        unit: "review",
        reminderTime: "16:00"
      }
    },
    {
      id: "special-interest-integration",
      title: "Special Interest Integration",
      description: "Incorporate special interests into daily routines and goals",
      category: "autism",
      difficulty: "easy",
      timeEstimate: "20-60 minutes",
      sensoryConsiderations: ["Engaging and motivating", "Familiar patterns"],
      executiveFunctionSupport: ["High intrinsic motivation", "Natural focus"],
      adaptations: ["Link to existing interests", "Allow flexibility in expression"],
      evidenceBased: true,
      habitTemplate: {
        name: "Special Interest Time",
        frequency: "daily",
        goal: 30,
        unit: "minutes",
        reminderTime: "19:00"
      }
    },
    {
      id: "pomodoro-modified",
      title: "Modified Pomodoro Technique",
      description: "Adapted time-blocking with ADHD/autism considerations",
      category: "both",
      difficulty: "medium",
      timeEstimate: "25-45 minutes",
      sensoryConsiderations: ["Gentle timer sounds", "Visual time indicators"],
      executiveFunctionSupport: ["Structured work periods", "Built-in breaks"],
      adaptations: ["Flexible timing (15-25 min)", "Sensory break activities"],
      evidenceBased: true,
      habitTemplate: {
        name: "Modified Pomodoro",
        frequency: "daily",
        goal: 3,
        unit: "sessions",
        reminderTime: "10:00"
      }
    },
    {
      id: "stim-scheduling",
      title: "Scheduled Stimming",
      description: "Intentional time for self-regulation through stimming",
      category: "autism",
      difficulty: "easy",
      timeEstimate: "5-20 minutes",
      sensoryConsiderations: ["Safe stimming tools", "Private space"],
      executiveFunctionSupport: ["Proactive regulation", "Prevents overwhelm"],
      adaptations: ["Variety of stim tools", "No judgment approach"],
      evidenceBased: true,
      habitTemplate: {
        name: "Stimming Break",
        frequency: "daily",
        goal: 2,
        unit: "sessions",
        reminderTime: "15:30"
      }
    },
    {
      id: "hyperfocus-management",
      title: "Hyperfocus Management",
      description: "Strategies to harness and manage hyperfocus periods",
      category: "adhd",
      difficulty: "hard",
      timeEstimate: "Variable",
      sensoryConsiderations: ["Minimize interruptions", "Comfortable environment"],
      executiveFunctionSupport: ["External reminders", "Boundary setting"],
      adaptations: ["Hydration/snack reminders", "Movement breaks"],
      evidenceBased: true,
      habitTemplate: {
        name: "Hyperfocus Check-in",
        frequency: "daily",
        goal: 3,
        unit: "checks",
        reminderTime: "12:00"
      }
    }
  ];

  const filteredRecommendations = recommendations.filter(rec => 
    selectedCategory === 'both' || rec.category === selectedCategory || rec.category === 'both'
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'adhd': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'autism': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'both': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isHabitAlreadyCreated = (template: any) => {
    return (currentHabits as any[]).some((habit: any) => 
      habit.name.toLowerCase().includes(template.name.toLowerCase()) ||
      template.name.toLowerCase().includes(habit.name.toLowerCase())
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span>Neurodiverse-Friendly Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="adhd">ADHD Focus</TabsTrigger>
              <TabsTrigger value="autism">Autism Focus</TabsTrigger>
              <TabsTrigger value="both">All Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedCategory} className="space-y-4 mt-6">
              {filteredRecommendations.map((rec) => (
                <Card 
                  key={rec.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setExpandedCard(expandedCard === rec.id ? null : rec.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-2">{rec.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={`${getCategoryColor(rec.category)} border text-xs`}>
                            {rec.category === 'both' ? 'ADHD + Autism' : rec.category.toUpperCase()}
                          </Badge>
                          <Badge className={`${getDifficultyColor(rec.difficulty)} border text-xs`}>
                            {rec.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {rec.timeEstimate}
                          </Badge>
                          {rec.evidenceBased && (
                            <Badge variant="outline" className="text-xs text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Evidence-based
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedCard === rec.id && (
                      <div className="space-y-4 border-t pt-4">
                        {/* Sensory Considerations */}
                        <div>
                          <h5 className="font-medium text-gray-800 mb-2 flex items-center space-x-1">
                            <Heart className="w-4 h-4 text-pink-500" />
                            <span>Sensory Considerations</span>
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {rec.sensoryConsiderations.map((consideration, index) => (
                              <span key={index} className="text-xs bg-pink-50 text-pink-700 px-2 py-1 rounded border border-pink-200">
                                {consideration}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Executive Function Support */}
                        <div>
                          <h5 className="font-medium text-gray-800 mb-2 flex items-center space-x-1">
                            <Target className="w-4 h-4 text-blue-500" />
                            <span>Executive Function Support</span>
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {rec.executiveFunctionSupport.map((support, index) => (
                              <span key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                                {support}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Adaptations */}
                        <div>
                          <h5 className="font-medium text-gray-800 mb-2 flex items-center space-x-1">
                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                            <span>Helpful Adaptations</span>
                          </h5>
                          <ul className="space-y-1">
                            {rec.adaptations.map((adaptation, index) => (
                              <li key={index} className="text-xs text-gray-600 flex items-start space-x-2">
                                <span className="text-yellow-500 mt-0.5">•</span>
                                <span>{adaptation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Action Button */}
                        {rec.habitTemplate && (
                          <div className="flex justify-between items-center pt-3 border-t">
                            <div className="text-sm text-gray-600">
                              Ready to try this as a habit?
                            </div>
                            {isHabitAlreadyCreated(rec.habitTemplate) ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Already added
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  createHabitMutation.mutate(rec.habitTemplate);
                                }}
                                disabled={createHabitMutation.isPending}
                              >
                                {createHabitMutation.isPending ? "Adding..." : "Add as Habit"}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          {/* Educational Note */}
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 mt-6">
            <div className="flex items-start space-x-2">
              <Brain className="w-4 h-4 text-indigo-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-indigo-800">Personalized for Neurodiversity</p>
                <p className="text-indigo-700">
                  These recommendations are based on research and community feedback from ADHD and autistic individuals. 
                  Each suggestion includes sensory considerations, executive function support, and practical adaptations. 
                  Start with one recommendation and adjust based on your specific needs and preferences.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}