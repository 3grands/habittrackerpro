import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Target, Clock, BarChart3, PieChart, Activity, Zap, Brain, Download } from "lucide-react";
import { LineChart, Line, AreaChart, Area, PieChart as RechartsPieChart, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Pie } from "recharts";

interface HabitAnalytics {
  habitName: string;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  weeklyTrend: number;
  timeOfDay: string;
  categoryColor: string;
}

const ANALYTICS_DATA = {
  weeklyProgress: [
    { day: 'Mon', completed: 8, total: 10, percentage: 80 },
    { day: 'Tue', completed: 9, total: 10, percentage: 90 },
    { day: 'Wed', completed: 7, total: 10, percentage: 70 },
    { day: 'Thu', completed: 10, total: 10, percentage: 100 },
    { day: 'Fri', completed: 8, total: 10, percentage: 80 },
    { day: 'Sat', completed: 6, total: 10, percentage: 60 },
    { day: 'Sun', completed: 9, total: 10, percentage: 90 }
  ],
  monthlyTrend: [
    { month: 'Oct', rate: 65 },
    { month: 'Nov', rate: 72 },
    { month: 'Dec', rate: 85 },
    { month: 'Jan', rate: 78 },
    { month: 'Feb', rate: 88 },
    { month: 'Mar', rate: 92 }
  ],
  categoryBreakdown: [
    { category: 'Health', value: 40, color: '#10B981' },
    { category: 'Productivity', value: 30, color: '#3B82F6' },
    { category: 'Learning', value: 20, color: '#8B5CF6' },
    { category: 'Wellness', value: 10, color: '#F59E0B' }
  ],
  timeDistribution: [
    { time: '6AM', habits: 4 },
    { time: '8AM', habits: 3 },
    { time: '12PM', habits: 2 },
    { time: '6PM', habits: 3 },
    { time: '9PM', habits: 2 }
  ],
  topHabits: [
    {
      habitName: "Morning Meditation",
      completionRate: 94,
      currentStreak: 23,
      longestStreak: 45,
      totalCompletions: 156,
      weeklyTrend: 12,
      timeOfDay: "6:30 AM",
      categoryColor: "#10B981"
    },
    {
      habitName: "Daily Exercise",
      completionRate: 87,
      currentStreak: 12,
      longestStreak: 28,
      totalCompletions: 134,
      weeklyTrend: 8,
      timeOfDay: "7:00 AM",
      categoryColor: "#EF4444"
    },
    {
      habitName: "Read 20 Pages",
      completionRate: 91,
      currentStreak: 18,
      longestStreak: 31,
      totalCompletions: 142,
      weeklyTrend: 15,
      timeOfDay: "9:00 PM",
      categoryColor: "#8B5CF6"
    }
  ]
};

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const generatePDFReport = () => {
    // PDF generation logic would go here
    console.log('Generating PDF report...');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Deep insights into your habit patterns and progress trends
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-muted p-1 rounded-lg">
            {(['week', 'month', 'quarter'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="capitalize"
              >
                {range}
              </Button>
            ))}
          </div>
          
          <Button onClick={generatePDFReport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Completion</p>
                <p className="text-3xl font-bold text-green-600">87%</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +5% from last month
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-3xl font-bold text-orange-600">23</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Longest: 45 days
                </p>
              </div>
              <Zap className="h-8 w-8 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Habits</p>
                <p className="text-3xl font-bold text-blue-600">12</p>
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                  <Activity className="h-3 w-3" />
                  3 added this week
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Focus Score</p>
                <p className="text-3xl font-bold text-purple-600">8.4</p>
                <p className="text-xs text-muted-foreground mt-1">
                  AI-calculated rating
                </p>
              </div>
              <Brain className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Progress Trend</CardTitle>
            <CardDescription>
              Daily completion rates over the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={ANALYTICS_DATA.weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
                <Area 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Improvement</CardTitle>
            <CardDescription>
              Completion rate trend over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ANALYTICS_DATA.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category & Time Analysis */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Habit Categories</CardTitle>
            <CardDescription>
              Distribution of habits by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={ANALYTICS_DATA.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ category, value }: any) => `${category} (${value}%)`}
                >
                  {ANALYTICS_DATA.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Optimal Time Analysis</CardTitle>
            <CardDescription>
              When you're most likely to complete habits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ANALYTICS_DATA.timeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}`, 'Habits Completed']} />
                <Bar dataKey="habits" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Habits */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Habits</CardTitle>
          <CardDescription>
            Your most consistent and successful habits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ANALYTICS_DATA.topHabits.map((habit, index) => (
              <div key={habit.habitName} className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: habit.categoryColor }}
                    />
                  </div>
                  
                  <div>
                    <p className="font-medium">{habit.habitName}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Best time: {habit.timeOfDay}</span>
                      <span>Current streak: {habit.currentStreak} days</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{habit.completionRate}%</p>
                    <p className="text-xs text-muted-foreground">Completion</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-lg font-bold">{habit.totalCompletions}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{habit.weeklyTrend}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights Card */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Insights & Recommendations
              </h3>
              <div className="space-y-2 opacity-90">
                <p>• Your morning habits have 23% higher completion rates</p>
                <p>• Consider grouping "Exercise" and "Meditation" for better consistency</p>
                <p>• Weekend completion drops by 15% - try smaller weekend goals</p>
                <p>• Your optimal habit count appears to be 8-10 daily habits</p>
              </div>
            </div>
            <Button variant="secondary" size="lg">
              Get Full AI Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}