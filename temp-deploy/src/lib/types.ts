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

export interface MoodEntry {
  id: number;
  userId: number;
  date: string;
  mood: number; // 1-5 scale
  energy: number; // 1-5 scale
  notes?: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: number;
  userId: number;
  message: string;
  response: string;
  createdAt: Date;
}

export interface Reminder {
  id: number;
  habitId: number;
  userId: number;
  time: string;
  isActive: boolean;
  lastSent?: Date;
  createdAt: Date;
}
