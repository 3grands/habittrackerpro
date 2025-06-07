import { useState, useEffect } from "react";
import { Clock, Zap, Brain, Target } from "lucide-react";

interface SmartDefault {
  id: string;
  category: string;
  defaultTime: string;
  reason: string;
  frequency: string;
  goal: number;
  unit: string;
  adaptiveNote?: string;
}

export function useSmartDefaults() {
  const [userPatterns, setUserPatterns] = useState({
    wakeTime: "07:00",
    workStart: "09:00",
    lunchTime: "12:00",
    workEnd: "17:00",
    bedTime: "22:00",
    energyPeak: "10:00",
    focusPeak: "14:00"
  });

  const smartDefaults: SmartDefault[] = [
    {
      id: "exercise",
      category: "fitness",
      defaultTime: "07:30",
      reason: "Morning energy peak, fewer distractions",
      frequency: "daily",
      goal: 30,
      unit: "minutes",
      adaptiveNote: "Best done before daily stress accumulates"
    },
    {
      id: "meditation",
      category: "mindfulness",
      defaultTime: "08:00",
      reason: "Calm morning mind, sets positive tone",
      frequency: "daily",
      goal: 10,
      unit: "minutes",
      adaptiveNote: "Quiet environment aids sensory regulation"
    },
    {
      id: "water",
      category: "health",
      defaultTime: "09:00",
      reason: "Start hydration routine early",
      frequency: "daily",
      goal: 8,
      unit: "glasses",
      adaptiveNote: "Visual reminders work best for consistency"
    },
    {
      id: "reading",
      category: "learning",
      defaultTime: "20:00",
      reason: "Evening focus time, wind-down activity",
      frequency: "daily",
      goal: 20,
      unit: "minutes",
      adaptiveNote: "Perfect for hyperfocus sessions"
    },
    {
      id: "gratitude",
      category: "wellness",
      defaultTime: "21:30",
      reason: "End day with positive reflection",
      frequency: "daily",
      goal: 3,
      unit: "items",
      adaptiveNote: "Helps process daily experiences"
    },
    {
      id: "steps",
      category: "fitness",
      defaultTime: "12:00",
      reason: "Midday movement break",
      frequency: "daily",
      goal: 8000,
      unit: "steps",
      adaptiveNote: "Can be broken into smaller walks"
    }
  ];

  const getSmartDefault = (habitName: string, category?: string) => {
    const name = habitName.toLowerCase();
    const cat = category?.toLowerCase() || "";

    // Direct name matches
    if (name.includes("exercise") || name.includes("workout") || name.includes("gym")) {
      return smartDefaults.find(d => d.id === "exercise");
    }
    if (name.includes("meditat") || name.includes("mindful")) {
      return smartDefaults.find(d => d.id === "meditation");
    }
    if (name.includes("water") || name.includes("hydrat")) {
      return smartDefaults.find(d => d.id === "water");
    }
    if (name.includes("read") || name.includes("book")) {
      return smartDefaults.find(d => d.id === "reading");
    }
    if (name.includes("gratitude") || name.includes("grateful") || name.includes("journal")) {
      return smartDefaults.find(d => d.id === "gratitude");
    }
    if (name.includes("walk") || name.includes("step")) {
      return smartDefaults.find(d => d.id === "steps");
    }

    // Category-based defaults
    if (cat.includes("fitness") || cat.includes("exercise")) {
      return smartDefaults.find(d => d.id === "exercise");
    }
    if (cat.includes("mindful") || cat.includes("mental")) {
      return smartDefaults.find(d => d.id === "meditation");
    }
    if (cat.includes("health") || cat.includes("wellness")) {
      return smartDefaults.find(d => d.id === "water");
    }
    if (cat.includes("learning") || cat.includes("education")) {
      return smartDefaults.find(d => d.id === "reading");
    }

    // Generic defaults based on time of day
    return {
      id: "generic",
      category: cat || "general",
      defaultTime: "09:00",
      reason: "Morning productivity window",
      frequency: "daily",
      goal: 1,
      unit: "completion",
      adaptiveNote: "Start with consistency, adjust as needed"
    };
  };

  const getContextualTime = (category: string, currentTime?: Date) => {
    const now = currentTime || new Date();
    const hour = now.getHours();

    // Context-aware scheduling based on current time and category
    if (category.includes("fitness")) {
      if (hour < 8) return "07:30"; // Early morning
      if (hour < 12) return "11:00"; // Mid-morning
      if (hour < 17) return "17:30"; // After work
      return "19:00"; // Evening
    }

    if (category.includes("mindful")) {
      if (hour < 9) return "08:00"; // Morning calm
      if (hour < 13) return "12:30"; // Lunch break
      return "21:00"; // Evening wind-down
    }

    if (category.includes("learning")) {
      if (hour < 10) return "09:00"; // Morning focus
      if (hour < 15) return "14:00"; // Afternoon focus
      return "20:00"; // Evening study
    }

    // Default to next available productive hour
    if (hour < 9) return "09:00";
    if (hour < 14) return "14:00";
    if (hour < 18) return "18:00";
    return "20:00";
  };

  const getAdaptiveGoal = (habitName: string, userLevel: "beginner" | "intermediate" | "advanced" = "beginner") => {
    const name = habitName.toLowerCase();
    const multiplier = { beginner: 1, intermediate: 1.5, advanced: 2 }[userLevel];

    if (name.includes("exercise") || name.includes("workout")) {
      return Math.round(15 * multiplier); // 15-30-45 minutes
    }
    if (name.includes("meditat")) {
      return Math.round(5 * multiplier); // 5-7-10 minutes
    }
    if (name.includes("read")) {
      return Math.round(10 * multiplier); // 10-15-20 minutes
    }
    if (name.includes("water")) {
      return Math.round(6 * multiplier); // 6-9-12 glasses
    }
    if (name.includes("walk") || name.includes("step")) {
      return Math.round(5000 * multiplier); // 5k-7.5k-10k steps
    }

    return 1; // Default completion goal
  };

  return {
    getSmartDefault,
    getContextualTime,
    getAdaptiveGoal,
    smartDefaults,
    userPatterns
  };
}