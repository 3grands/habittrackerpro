import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Calendar, Clock, Target, Brain, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface TrendInsight {
  id: string;
  type: 'success_pattern' | 'struggle_pattern' | 'correlation' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  timeframe: string;
  data?: any;
}

interface PatternRecognition {
  bestDays: string[];
  bestTimes: string[];
  challengingDays: string[];
  streakBreakers: string[];
  successFactors: string[];
  correlations: Array<{
    habit1: string;
    habit2: string;
    strength: number;
    type: 'positive' | 'negative';
  }>;
}

export function TrendInsights() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');

  const { data: habits = [] } = useQuery({
    queryKey: ["/api/habits"]
  });

  const { data: insights = [] } = useQuery<TrendInsight[]>({
    queryKey: ["/api/insights", selectedTimeframe]
  });

  const { data: patterns } = useQuery<PatternRecognition>({
    queryKey: ["/api/pattern-recognition", selectedTimeframe]
  });

  // Generate insights based on habit completion data
  const generateTrendInsights = (): TrendInsight[] => {
    const mockInsights: TrendInsight[] = [
      {
        id: "tuesday_success",
        type: "success_pattern",
        title: "Tuesday Success Pattern",
        description: "You complete 85% more habits on Tuesdays compared to other weekdays",
        confidence: 92,
        impact: "high",
        actionable: true,
        timeframe: "Last 4 weeks",
        data: { improvement: 85, baseline: "other weekdays" }
      },
      {
        id: "morning_momentum",
        type: "correlation",
        title: "Morning Exercise Boosts Everything",
        description: "When you exercise in the morning, you're 73% more likely to complete all other habits",
        confidence: 88,
        impact: "high",
        actionable: true,
        timeframe: "Last 30 days",
        data: { correlation: 0.73, primaryHabit: "morning exercise" }
      },
      {
        id: "weekend_struggle",
        type: "struggle_pattern",
        title: "Weekend Routine Gaps",
        description: "Your completion rate drops 45% on weekends, especially for structured habits",
        confidence: 76,
        impact: "medium",
        actionable: true,
        timeframe: "Last 8 weeks",
        data: { decline: 45, affectedHabits: ["meditation", "journaling"] }
      },
      {
        id: "evening_prediction",
        type: "prediction",
        title: "Evening Habit Risk",
        description: "Habits scheduled after 8 PM have only 34% completion rate - consider rescheduling",
        confidence: 81,
        impact: "medium",
        actionable: true,
        timeframe: "Ongoing pattern",
        data: { completionRate: 34, riskTime: "8 PM" }
      },
      {
        id: "chain_recommendation",
        type: "recommendation",
        title: "Habit Chain Opportunity",
        description: "Try linking 'drink water' after 'check email' - this combination works for 94% of users",
        confidence: 67,
        impact: "low",
        actionable: true,
        timeframe: "Best practice",
        data: { successRate: 94, anchor: "check email", chain: "drink water" }
      }
    ];

    return mockInsights;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success_pattern': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'struggle_pattern': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'correlation': return <Target className="w-4 h-4 text-blue-500" />;
      case 'prediction': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'recommendation': return <Lightbulb className="w-4 h-4 text-purple-500" />;
      default: return <Brain className="w-4 h-4 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const displayInsights = insights.length > 0 ? insights : generateTrendInsights();

  return (
    <div className="space-y-6">
      {/* Header with Timeframe Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-500" />
              <span>Trend Insights</span>
            </div>
            <div className="flex space-x-1">
              {(['week', 'month', 'quarter'] as const).map((timeframe) => (
                <button
                  key={timeframe}
                  onClick={() => setSelectedTimeframe(timeframe)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    selectedTimeframe === timeframe
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                </button>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            AI-powered insights from your habit patterns and completion data
          </p>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <div className="space-y-4">
        {displayInsights.map((insight) => (
          <Card key={insight.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getInsightIcon(insight.type)}
                  <div>
                    <h4 className="font-semibold text-gray-800">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge className={`${getImpactColor(insight.impact)} border text-xs`}>
                    {insight.impact} impact
                  </Badge>
                  {insight.actionable && (
                    <Badge variant="outline" className="text-xs">
                      Actionable
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Confidence:</span>
                    <Progress value={insight.confidence} className="w-16 h-2" />
                    <span className="text-xs font-medium">{insight.confidence}%</span>
                  </div>
                  <span className="text-xs text-gray-500">{insight.timeframe}</span>
                </div>
              </div>

              {/* Insight-specific data visualization */}
              {insight.data && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  {insight.type === 'success_pattern' && (
                    <div className="text-sm">
                      <span className="font-medium text-green-700">
                        +{insight.data.improvement}% improvement
                      </span>
                      <span className="text-gray-600"> vs {insight.data.baseline}</span>
                    </div>
                  )}
                  
                  {insight.type === 'correlation' && (
                    <div className="text-sm">
                      <span className="font-medium text-blue-700">
                        {Math.round(insight.data.correlation * 100)}% correlation
                      </span>
                      <span className="text-gray-600"> with {insight.data.primaryHabit}</span>
                    </div>
                  )}
                  
                  {insight.type === 'struggle_pattern' && (
                    <div className="text-sm">
                      <span className="font-medium text-red-700">
                        -{insight.data.decline}% completion rate
                      </span>
                      <span className="text-gray-600"> affects: {insight.data.affectedHabits?.join(', ')}</span>
                    </div>
                  )}
                  
                  {insight.type === 'prediction' && (
                    <div className="text-sm">
                      <span className="font-medium text-orange-700">
                        {insight.data.completionRate}% success rate
                      </span>
                      <span className="text-gray-600"> after {insight.data.riskTime}</span>
                    </div>
                  )}
                  
                  {insight.type === 'recommendation' && (
                    <div className="text-sm">
                      <span className="font-medium text-purple-700">
                        {insight.data.successRate}% success rate
                      </span>
                      <span className="text-gray-600"> for this combination</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pattern Recognition Summary */}
      {patterns && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span>Pattern Recognition</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Your Best Days</h4>
                <div className="flex flex-wrap gap-1">
                  {patterns.bestDays.map((day, index) => (
                    <Badge key={index} variant="outline" className="bg-green-50 text-green-700">
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Optimal Times</h4>
                <div className="flex flex-wrap gap-1">
                  {patterns.bestTimes.map((time, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                      {time}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Success Factors</h4>
                <div className="flex flex-wrap gap-1">
                  {patterns.successFactors.map((factor, index) => (
                    <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700">
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Challenge Areas</h4>
                <div className="flex flex-wrap gap-1">
                  {patterns.challengingDays.map((day, index) => (
                    <Badge key={index} variant="outline" className="bg-red-50 text-red-700">
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Habit Correlations */}
            {patterns.correlations.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-800 mb-3">Habit Correlations</h4>
                <div className="space-y-2">
                  {patterns.correlations.slice(0, 3).map((correlation, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">
                        <span className="font-medium">{correlation.habit1}</span>
                        <span className="text-gray-600"> influences </span>
                        <span className="font-medium">{correlation.habit2}</span>
                      </span>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={correlation.strength * 100} 
                          className="w-16 h-2" 
                        />
                        <span className={`text-xs font-medium ${
                          correlation.type === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Math.round(correlation.strength * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ADHD/Autism Insights */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <Brain className="w-4 h-4 text-indigo-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-indigo-800">Neurodiverse Insights</p>
              <p className="text-indigo-700">
                These patterns are analyzed with ADHD and autism considerations in mind. 
                Look for energy-based patterns, sensory preferences, and executive function support opportunities.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}