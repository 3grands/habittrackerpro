export interface HabitWithProgress {
  id: number;
  userId: number;
  name: string;
  category: string;
  frequency: string;
  goal: number;
  unit: string;
  reminderTime?: string;
  streak: number;
  isActive: boolean;
  createdAt: Date;
  todayProgress: number;
  isCompletedToday: boolean;
}

export interface HabitStats {
  todayProgress: string;
  totalHabits: number;
  totalStreak: number;
  todayCompleted: number;
  weeklyProgress: Array<{
    date: string;
    completed: number;
    total: number;
  }>;
  completionRate: number;
}

export interface CoachingAdvice {
  advice: string;
}

export interface CoachingTip {
  tip: string;
}
