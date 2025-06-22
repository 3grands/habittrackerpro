import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw, Brain, Send, Home, LineChart, Heart, Lightbulb, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CoachChat } from "@/components/coach-chat";
import { apiRequest } from "@/lib/queryClient";
import { CoachingAdvice } from "@/lib/types";
import { Link, useLocation } from "wouter";

export default function CoachingPage() {
  const [location] = useLocation();
  const [userQuestion, setUserQuestion] = useState("");
  const [isGettingAdvice, setIsGettingAdvice] = useState(false);
  const [currentAdvice, setCurrentAdvice] = useState("");
  const queryClient = useQueryClient();

  const { data: latestTip } = useQuery({
    queryKey: ["/api/coaching/latest"],
  });

  const getAdviceMutation = useMutation({
    mutationFn: async () => {
      setIsGettingAdvice(true);
      const response = await apiRequest("POST", "/api/coaching/advice");
      return response.json() as Promise<CoachingAdvice>;
    },
    onSuccess: (data) => {
      setCurrentAdvice(data.advice);
      queryClient.invalidateQueries({ queryKey: ["/api/coaching/latest"] });
    },
    onSettled: () => {
      setIsGettingAdvice(false);
    },
  });

  const askCoachMutation = useMutation({
    mutationFn: async (question: string) => {
      setIsGettingAdvice(true);
      const response = await apiRequest("POST", "/api/coaching/advice");
      return response.json() as Promise<CoachingAdvice>;
    },
    onSuccess: (data) => {
      setCurrentAdvice(data.advice);
      setUserQuestion("");
    },
    onSettled: () => {
      setIsGettingAdvice(false);
    },
  });

  const quickTips = [
    {
      icon: <Lightbulb className="w-4 h-4 text-primary" />,
      title: "Start Small",
      description: "Begin with tiny habits that take less than 2 minutes",
      bgColor: "bg-primary bg-opacity-10",
    },
    {
      icon: <Clock className="w-4 h-4 text-accent" />,
      title: "Be Consistent",
      description: "Focus on showing up daily rather than perfection",
      bgColor: "bg-accent bg-opacity-10",
    },
    {
      icon: <Target className="w-4 h-4 text-success" />,
      title: "Stack Habits",
      description: "Link new habits to existing routines",
      bgColor: "bg-success bg-opacity-10",
    },
    {
      icon: <ChartLine className="w-4 h-4 text-purple-600" />,
      title: "Track Progress",
      description: "Celebrate small wins to stay motivated",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">AI Coaching</h1>
        </div>
      </div>

      <div className="p-4 pb-24">
        {/* Coaching Tips Card */}
        <div className="bg-gradient-to-r from-secondary to-blue-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Personalized Advice</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => getAdviceMutation.mutate()}
              disabled={isGettingAdvice}
              className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white"
            >
              <RefreshCw className={`w-5 h-5 ${isGettingAdvice ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <div className="space-y-4">
            <p className="leading-relaxed">
{currentAdvice || (latestTip && 'tip' in latestTip ? latestTip.tip : "Based on your recent progress, I notice you're building great momentum! Keep focusing on consistency over perfection. Small daily actions create lasting change.")}
            </p>
            <div className="flex items-center space-x-2 text-sm opacity-75">
              <Brain className="w-4 h-4" />
              <span>Generated based on your habit patterns</span>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Tips</h3>
          <div className="grid grid-cols-2 gap-4">
            {quickTips.map((tip, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className={`w-8 h-8 ${tip.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                  {tip.icon}
                </div>
                <h4 className="font-medium text-gray-800 mb-2">{tip.title}</h4>
                <p className="text-sm text-gray-600">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Coach Chat */}
        <CoachChat />
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around items-center">
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 px-3 ${location === "/" ? "text-primary" : "text-gray-400"}`}
            asChild
          >
            <Link href="/">
              <Home className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Home</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 px-3 ${location === "/progress" ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}
            asChild
          >
            <Link href="/progress">
              <ChartLine className="w-5 h-5 mb-1" />
              <span className="text-xs">Progress</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 px-3 ${location === "/coaching" ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}
            asChild
          >
            <Link href="/coaching">
              <Brain className="w-5 h-5 mb-1" />
              <span className="text-xs">Coaching</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 px-3 ${location === "/wellness" ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}
            asChild
          >
            <Link href="/wellness">
              <Heart className="w-5 h-5 mb-1" />
              <span className="text-xs">Wellness</span>
            </Link>
          </Button>
        </div>
      </nav>
    </>
  );
}
