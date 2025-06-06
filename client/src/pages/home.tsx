import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, ChartLine, Brain, Settings, Home, Heart, Wifi, WifiOff, Zap, Crown, Users, Store, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HabitCard } from "@/components/habit-card";
import { AddHabitModal } from "@/components/add-habit-modal";
import { HabitTemplates } from "@/components/habit-templates";
import { WeeklyChart } from "@/components/weekly-chart";
import { CoachingCard } from "@/components/coaching-card";
import { QuickActions } from "@/components/quick-actions";
import { QuickSetupWizard } from "@/components/quick-setup-wizard";
import { HabitListSkeleton } from "@/components/habit-card-skeleton";
import { StatsOverviewSkeleton, CoachingCardSkeleton, WeeklyChartSkeleton } from "@/components/stats-skeleton";
import { HabitWithProgress, HabitStats } from "@/lib/types";
import { offlineStorage } from "@/lib/offline-storage";
import { Link, useLocation } from "wouter";

export default function HomePage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState(offlineStorage.getSyncStatus());
  const [location] = useLocation();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Update sync status periodically
    const interval = setInterval(() => {
      setSyncStatus(offlineStorage.getSyncStatus());
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const { data: habits, isLoading: habitsLoading } = useQuery<HabitWithProgress[]>({
    queryKey: ["/api/habits"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<HabitStats>({
    queryKey: ["/api/habits/stats"],
  });

  if (habitsLoading || statsLoading) {
    return (
      <>
        {/* Header Skeleton */}
        <header className="bg-gradient-to-r from-gray-300 to-gray-400 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full"></div>
              <div>
                <div className="w-20 h-3 bg-white bg-opacity-20 rounded mb-1"></div>
                <div className="w-12 h-4 bg-white bg-opacity-30 rounded"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="w-16 h-3 bg-white bg-opacity-20 rounded mb-1"></div>
              <div className="w-10 h-5 bg-white bg-opacity-30 rounded"></div>
            </div>
          </div>
        </header>

        {/* Stats Overview Skeleton */}
        <StatsOverviewSkeleton />

        {/* Quick Actions Skeleton */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Habits List Skeleton */}
        <div className="p-4">
          <HabitListSkeleton />
        </div>

        {/* Weekly Chart Skeleton */}
        <WeeklyChartSkeleton />

        {/* Coaching Card Skeleton */}
        <CoachingCardSkeleton />

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-2 py-2">
          <div className="flex justify-around items-center">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center py-2 px-2">
                <div className="w-4 h-4 bg-gray-200 rounded mb-1"></div>
                <div className="w-8 h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </nav>
      </>
    );
  }

  return (
    <>
      {/* Header with Offline Status */}
      <header className="bg-gradient-to-r from-primary to-success p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">S</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-sm opacity-90">Good morning</p>
                {!isOnline && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                    <WifiOff className="w-3 h-3 mr-1" />
                    Offline
                  </Badge>
                )}
                {syncStatus.pendingActions > 0 && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                    {syncStatus.pendingActions} syncing
                  </Badge>
                )}
              </div>
              <p className="font-semibold">Sarah</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-90">Current Streak</p>
            <p className="text-xl font-bold">{stats?.totalStreak || 0} days</p>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="p-4 bg-white">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-primary bg-opacity-10 rounded-full flex items-center justify-center mb-2">
              <span className="text-primary text-xl">🔥</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats?.totalStreak || 0}</p>
            <p className="text-xs text-gray-500">Total Days</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-secondary bg-opacity-10 rounded-full flex items-center justify-center mb-2">
              <span className="text-secondary text-xl">🎯</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats?.completionRate || 0}%</p>
            <p className="text-xs text-gray-500">Completion</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-accent bg-opacity-10 rounded-full flex items-center justify-center mb-2">
              <span className="text-accent text-xl">🏆</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats?.totalHabits || 0}</p>
            <p className="text-xs text-gray-500">Active Habits</p>
          </div>
        </div>
      </div>

      {/* Quick Actions - Prominent placement */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-orange-500" />
            <span>Quick Actions</span>
          </h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Habit
          </Button>
        </div>

        <QuickActions />
      </div>

      {/* All Habits */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">All Habits</h2>
          <span className="text-sm text-gray-500">
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        <div className="space-y-3">
          {habits && habits.length > 0 ? (
            habits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} />
            ))
          ) : (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto bg-primary bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <p className="text-gray-700 font-medium mb-2">Ready to build better habits?</p>
                <p className="text-gray-500 text-sm mb-6">Get started with our smart setup wizard or choose from templates</p>
                
                <div className="flex flex-col space-y-3">
                  <Button 
                    onClick={() => setShowSetupWizard(true)} 
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Quick Setup (3 steps)
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Custom Habit
                  </Button>
                </div>
              </div>
              <HabitTemplates />
            </div>
          )}
        </div>
      </div>

      {/* Weekly Progress */}
      {stats && <WeeklyChart stats={stats} />}

      {/* Coaching Card */}
      <CoachingCard />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-2 py-2">
        <div className="flex justify-around items-center">
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 px-2 ${location === "/" ? "text-primary" : "text-gray-400"}`}
            asChild
          >
            <Link href="/">
              <Home className="w-4 h-4 mb-1" />
              <span className="text-xs font-medium">Home</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 px-2 ${location === "/marketplace" ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}
            asChild
          >
            <Link href="/marketplace">
              <Store className="w-4 h-4 mb-1" />
              <span className="text-xs">Store</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 px-2 ${location === "/community" ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}
            asChild
          >
            <Link href="/community">
              <Users className="w-4 h-4 mb-1" />
              <span className="text-xs">Community</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 px-2 ${location === "/analytics" ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}
            asChild
          >
            <Link href="/analytics">
              <BarChart3 className="w-4 h-4 mb-1" />
              <span className="text-xs">Analytics</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 px-2 ${location === "/coaching" ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}
            asChild
          >
            <Link href="/coaching">
              <Brain className="w-4 h-4 mb-1" />
              <span className="text-xs">Coach</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 px-2 ${location === "/pricing" ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}
            asChild
          >
            <Link href="/pricing">
              <Crown className="w-4 h-4 mb-1" />
              <span className="text-xs">Pro</span>
            </Link>
          </Button>
        </div>
      </nav>

      {/* Floating Action Button */}
      <Button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary hover:bg-primary/90 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Add Habit Modal */}
      <AddHabitModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />

      {/* Quick Setup Wizard Modal */}
      {showSetupWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
            <QuickSetupWizard onComplete={() => setShowSetupWizard(false)} />
          </div>
        </div>
      )}
    </>
  );
}
