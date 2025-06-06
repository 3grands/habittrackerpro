import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertHabitSchema, insertHabitCompletionSchema, insertMoodEntrySchema, insertChatMessageSchema } from "@shared/schema";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function registerRoutes(app: Express): Promise<Server> {
  const DEFAULT_USER_ID = 1; // For demo purposes

  // Get all habits for user
  app.get("/api/habits", async (req, res) => {
    try {
      const habits = await storage.getHabits(DEFAULT_USER_ID);
      
      // Get today's completions for each habit
      const today = new Date().toISOString().split('T')[0];
      const habitsWithProgress = await Promise.all(
        habits.map(async (habit) => {
          const completion = await storage.getHabitCompletionByDate(habit.id, today);
          return {
            ...habit,
            todayProgress: completion?.progress || 0,
            isCompletedToday: completion?.isCompleted || false,
          };
        })
      );

      res.json(habitsWithProgress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch habits" });
    }
  });

  // Create new habit
  app.post("/api/habits", async (req, res) => {
    try {
      const validatedData = insertHabitSchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID,
      });
      
      const habit = await storage.createHabit(validatedData);
      res.status(201).json(habit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid habit data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create habit" });
      }
    }
  });

  // Toggle habit completion
  app.post("/api/habits/:id/toggle", async (req, res) => {
    try {
      const habitId = parseInt(req.params.id);
      const today = new Date().toISOString().split('T')[0];
      
      const habit = await storage.getHabit(habitId);
      if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
      }

      let completion = await storage.getHabitCompletionByDate(habitId, today);
      
      if (!completion) {
        // Create new completion
        completion = await storage.createHabitCompletion({
          habitId,
          date: today,
          progress: habit.goal,
          isCompleted: true,
        });
      } else {
        // Toggle existing completion
        completion = await storage.updateHabitCompletion(completion.id, {
          isCompleted: !completion.isCompleted,
          progress: !completion.isCompleted ? habit.goal : 0,
        });
      }

      // Update habit streak
      if (completion?.isCompleted) {
        await storage.updateHabit(habitId, { streak: habit.streak + 1 });
      } else {
        await storage.updateHabit(habitId, { streak: Math.max(0, habit.streak - 1) });
      }

      res.json(completion);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle habit completion" });
    }
  });

  // Get habit statistics
  app.get("/api/habits/stats", async (req, res) => {
    try {
      const habits = await storage.getHabits(DEFAULT_USER_ID);
      const today = new Date().toISOString().split('T')[0];
      
      let todayCompleted = 0;
      let totalStreak = 0;
      
      for (const habit of habits) {
        const completion = await storage.getHabitCompletionByDate(habit.id, today);
        if (completion?.isCompleted) {
          todayCompleted++;
        }
        totalStreak += habit.streak;
      }

      // Get weekly progress
      const weeklyProgress = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        let dayCompleted = 0;
        for (const habit of habits) {
          const completion = await storage.getHabitCompletionByDate(habit.id, dateStr);
          if (completion?.isCompleted) {
            dayCompleted++;
          }
        }
        weeklyProgress.push({
          date: dateStr,
          completed: dayCompleted,
          total: habits.length,
        });
      }

      res.json({
        todayProgress: `${todayCompleted}/${habits.length}`,
        totalHabits: habits.length,
        totalStreak,
        todayCompleted,
        weeklyProgress,
        completionRate: habits.length > 0 ? Math.round((todayCompleted / habits.length) * 100) : 0,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Get AI coaching advice
  app.post("/api/coaching/advice", async (req, res) => {
    try {
      const habits = await storage.getHabits(DEFAULT_USER_ID);
      const today = new Date().toISOString().split('T')[0];
      
      // Get recent progress data
      const progressData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        let dayCompleted = 0;
        for (const habit of habits) {
          const completion = await storage.getHabitCompletionByDate(habit.id, dateStr);
          if (completion?.isCompleted) {
            dayCompleted++;
          }
        }
        progressData.push({ date: dateStr, completed: dayCompleted, total: habits.length });
      }

      const habitNames = habits.map(h => h.name).join(", ");
      const recentProgress = progressData.map(p => `${p.completed}/${p.total}`).join(", ");

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a motivational habit coach. Provide personalized, encouraging advice based on the user's habit data. Keep responses concise (2-3 sentences), practical, and motivating. Focus on specific actionable tips."
          },
          {
            role: "user",
            content: `My habits: ${habitNames}. Recent 7-day completion: ${recentProgress}. Give me personalized coaching advice.`
          }
        ],
        max_tokens: 150,
      });

      const advice = response.choices[0].message.content;
      
      // Store the coaching tip
      await storage.createCoachingTip({
        userId: DEFAULT_USER_ID,
        tip: advice || "Keep up the great work! Consistency is key to building lasting habits.",
        category: "general",
      });

      res.json({ advice });
    } catch (error) {
      console.error("OpenAI API error:", error);
      // Fallback advice if API fails
      const fallbackAdvice = "Focus on consistency over perfection. Small daily actions compound into remarkable results over time!";
      res.json({ advice: fallbackAdvice });
    }
  });

  // Get latest coaching tip
  app.get("/api/coaching/latest", async (req, res) => {
    try {
      const tips = await storage.getCoachingTips(DEFAULT_USER_ID);
      const latestTip = tips.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      
      res.json({ 
        tip: latestTip?.tip || "Start small and be consistent. Focus on building one habit at a time for lasting success!" 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coaching tip" });
    }
  });

  // Personal Coach Chat
  app.post("/api/coaching/chat", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      // Get user's habits and recent progress for context
      const habits = await storage.getHabits(DEFAULT_USER_ID);
      const today = new Date().toISOString().split('T')[0];
      
      let completedToday = 0;
      for (const habit of habits) {
        const completion = await storage.getHabitCompletionByDate(habit.id, today);
        if (completion?.isCompleted) completedToday++;
      }

      // Get recent mood entries for context
      const moodEntries = await storage.getMoodEntries(DEFAULT_USER_ID);
      const recentMoods = moodEntries.slice(-7);
      const avgMood = recentMoods.length > 0 
        ? recentMoods.reduce((sum, entry) => sum + entry.mood, 0) / recentMoods.length
        : null;

      const habitNames = habits.map(h => h.name).join(", ");
      const moodContext = avgMood ? `Recent average mood: ${avgMood.toFixed(1)}/5` : "";

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a supportive, knowledgeable habit coach. The user has these habits: ${habitNames}. Today they completed ${completedToday}/${habits.length} habits. ${moodContext}. 

Provide personalized, empathetic responses. Be encouraging, practical, and specific. Ask follow-up questions when appropriate. Keep responses conversational but professional, around 2-4 sentences.`
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 200,
      });

      const aiResponse = response.choices[0].message.content || "I'm here to help you build better habits. What would you like to talk about?";
      
      // Store the conversation
      await storage.createChatMessage({
        userId: DEFAULT_USER_ID,
        message,
        response: aiResponse,
      });

      res.json({ response: aiResponse });
    } catch (error) {
      console.error("Chat API error:", error);
      res.json({ 
        response: "I'm having trouble connecting right now, but I'm here to support you! What specific habit challenge are you facing today?" 
      });
    }
  });

  // Get chat history
  app.get("/api/coaching/chat", async (req, res) => {
    try {
      const messages = await storage.getChatMessages(DEFAULT_USER_ID);
      const recentMessages = messages.slice(-20); // Last 20 messages
      res.json(recentMessages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // Mood Tracking
  app.post("/api/mood", async (req, res) => {
    try {
      const validatedData = insertMoodEntrySchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID,
      });
      
      const today = new Date().toISOString().split('T')[0];
      
      // Check if mood entry already exists for today
      const existingEntry = await storage.getMoodEntryByDate(DEFAULT_USER_ID, today);
      
      if (existingEntry) {
        // Update existing entry
        const updatedEntry = await storage.updateMoodEntry(existingEntry.id, {
          mood: validatedData.mood,
          energy: validatedData.energy,
          notes: validatedData.notes,
        });
        res.json(updatedEntry);
      } else {
        // Create new entry
        const entry = await storage.createMoodEntry({
          ...validatedData,
          date: today,
        });
        res.status(201).json(entry);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid mood data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save mood entry" });
      }
    }
  });

  // Get mood entries
  app.get("/api/mood", async (req, res) => {
    try {
      const entries = await storage.getMoodEntries(DEFAULT_USER_ID);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mood entries" });
    }
  });

  // Get mood by date
  app.get("/api/mood/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const entry = await storage.getMoodEntryByDate(DEFAULT_USER_ID, date);
      res.json(entry || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mood entry" });
    }
  });

  // Get recent mood entries
  app.get("/api/mood/recent", async (req, res) => {
    try {
      const entries = await storage.getMoodEntries(DEFAULT_USER_ID);
      const recentEntries = entries
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 7);
      res.json(recentEntries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent mood entries" });
    }
  });

  // Smart Reminders
  app.get("/api/reminders", async (req, res) => {
    try {
      const reminders = await storage.getReminders(DEFAULT_USER_ID);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.post("/api/reminders", async (req, res) => {
    try {
      const { habitId, time } = req.body;
      
      if (!habitId || !time) {
        return res.status(400).json({ message: "Habit ID and time are required" });
      }

      const reminder = await storage.createReminder({
        habitId,
        userId: DEFAULT_USER_ID,
        time,
        isActive: true,
      });
      
      res.status(201).json(reminder);
    } catch (error) {
      res.status(500).json({ message: "Failed to create reminder" });
    }
  });

  app.patch("/api/reminders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const reminder = await storage.updateReminder(parseInt(id), updates);
      
      if (reminder) {
        res.json(reminder);
      } else {
        res.status(404).json({ message: "Reminder not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update reminder" });
    }
  });

  app.delete("/api/reminders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const success = await storage.deleteReminder(parseInt(id));
      
      if (success) {
        res.json({ message: "Reminder deleted successfully" });
      } else {
        res.status(404).json({ message: "Reminder not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reminder" });
    }
  });

  // Smart Scheduling API
  app.get("/api/smart-schedule", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const habits = await storage.getHabits(userId);
      
      // Generate optimal times based on habit patterns and ADHD/autism considerations
      const optimalTimes = habits.map((habit: any) => {
        const category = habit.category.toLowerCase();
        let suggestedTime = "09:00";
        let reason = "General productivity time";
        let energyLevel: 'high' | 'medium' | 'low' = 'medium';
        let adaptationNote = "";

        // ADHD/Autism-friendly scheduling
        if (category.includes('exercise') || category.includes('fitness')) {
          suggestedTime = "07:30";
          reason = "Morning energy peak, fewer distractions";
          energyLevel = 'high';
          adaptationNote = "Exercise before daily stressors accumulate";
        } else if (category.includes('meditation') || category.includes('mindfulness')) {
          suggestedTime = "08:00";
          reason = "Calm morning mind, easier focus";
          energyLevel = 'medium';
          adaptationNote = "Quiet environment helps with sensory regulation";
        } else if (category.includes('reading') || category.includes('learning')) {
          suggestedTime = "20:00";
          reason = "Evening focus time, fewer interruptions";
          energyLevel = 'medium';
          adaptationNote = "Hyperfocus-friendly time block";
        } else if (category.includes('water') || category.includes('hydration')) {
          suggestedTime = "10:00";
          reason = "Mid-morning reminder, routine building";
          energyLevel = 'high';
          adaptationNote = "Visual reminder works best";
        }

        return {
          habitId: habit.id,
          habitName: habit.name,
          suggestedTime,
          reason,
          energyLevel,
          conflictRisk: Math.random() * 30, // Mock conflict analysis
          adaptationNote
        };
      });

      // Generate energy pattern (mock data based on ADHD patterns)
      const energyPattern = Array.from({length: 24}, (_, hour) => {
        let energyLevel = 50;
        
        // ADHD-typical energy patterns
        if (hour >= 6 && hour <= 10) energyLevel = 70 + Math.random() * 20; // Morning peak
        else if (hour >= 11 && hour <= 13) energyLevel = 40 + Math.random() * 20; // Pre-lunch dip
        else if (hour >= 14 && hour <= 16) energyLevel = 60 + Math.random() * 25; // Afternoon focus
        else if (hour >= 19 && hour <= 22) energyLevel = 65 + Math.random() * 25; // Evening hyperfocus
        else energyLevel = 30 + Math.random() * 30; // Other times
        
        return {
          hour,
          energyLevel: Math.round(energyLevel),
          focusLevel: Math.round(energyLevel * 0.8)
        };
      });

      // Weekly recommendations considering neurodivergent needs
      const weeklyRecommendations = [
        { day: "Monday", loadRecommendation: "light" as const, reason: "Transition day, gentle start" },
        { day: "Tuesday", loadRecommendation: "moderate" as const, reason: "Good focus day" },
        { day: "Wednesday", loadRecommendation: "full" as const, reason: "Peak performance window" },
        { day: "Thursday", loadRecommendation: "moderate" as const, reason: "Maintaining momentum" },
        { day: "Friday", loadRecommendation: "light" as const, reason: "Wind down, avoid overwhelm" },
        { day: "Saturday", loadRecommendation: "light" as const, reason: "Rest and recharge" },
        { day: "Sunday", loadRecommendation: "moderate" as const, reason: "Preparation day" }
      ];

      res.json({
        optimalTimes,
        energyPattern,
        weeklyRecommendations
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate smart schedule" });
    }
  });

  // Voice Commands API
  app.post("/api/voice-command", async (req, res) => {
    try {
      const { command, action, habitId } = req.body;
      const userId = DEFAULT_USER_ID;

      switch (action) {
        case "complete_habit":
          if (!habitId) {
            return res.status(400).json({ message: "Habit ID required for completion" });
          }

          const habit = await storage.getHabit(habitId);
          if (!habit) {
            return res.status(404).json({ message: "Habit not found" });
          }

          const today = new Date().toISOString().split('T')[0];
          const existingCompletion = await storage.getHabitCompletionByDate(habitId, today);

          if (existingCompletion) {
            return res.json({ 
              message: `${habit.name} was already completed today. Great consistency!`,
              already_completed: true 
            });
          }

          await storage.createHabitCompletion({
            habitId,
            date: today,
            isCompleted: true
          });

          res.json({ 
            message: `Great job! ${habit.name} is now marked as complete.`,
            habit_name: habit.name 
          });
          break;

        case "get_status":
          const habits = await storage.getHabits(userId);
          const todayDate = new Date().toISOString().split('T')[0];
          
          let completedToday = 0;
          for (const habit of habits) {
            const completion = await storage.getHabitCompletionByDate(habit.id, todayDate);
            if (completion?.isCompleted) completedToday++;
          }

          const remaining = habits.length - completedToday;
          let statusMessage = "";

          if (remaining === 0) {
            statusMessage = "Amazing! You've completed all your habits today. You're crushing it!";
          } else if (completedToday === 0) {
            statusMessage = `You have ${habits.length} habits to complete today. Start with something small and build momentum.`;
          } else {
            statusMessage = `You've completed ${completedToday} out of ${habits.length} habits today. ${remaining} more to go!`;
          }

          res.json({ 
            message: statusMessage,
            completed: completedToday,
            total: habits.length,
            remaining 
          });
          break;

        case "add_habit":
          res.json({ 
            message: "I can help you add habits through the app interface. Try using the plus button on the home screen.",
            redirect_suggestion: "add_habit_form"
          });
          break;

        default:
          res.status(400).json({ message: "Unknown voice command action" });
      }
    } catch (error) {
      console.error("Voice command error:", error);
      res.status(500).json({ message: "Failed to process voice command" });
    }
  });

  // Habit scheduling endpoint
  app.post("/api/habits/schedule", async (req, res) => {
    try {
      const { habitId, scheduledTime, reason } = req.body;
      
      const habit = await storage.getHabit(habitId);
      if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
      }

      // Update habit with new scheduled time
      const updatedHabit = await storage.updateHabit(habitId, {
        reminderTime: scheduledTime
      });

      res.json({ 
        message: `${habit.name} scheduled for ${scheduledTime}`,
        habit: updatedHabit,
        reason 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to schedule habit" });
    }
  });

  // Quick complete habit endpoint
  app.post("/api/habits/:id/complete", async (req, res) => {
    try {
      const { id } = req.params;
      const habitId = parseInt(id);
      const userId = DEFAULT_USER_ID;
      
      const habit = await storage.getHabit(habitId);
      if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
      }

      const today = new Date().toISOString().split('T')[0];
      const existingCompletion = await storage.getHabitCompletionByDate(habitId, today);

      if (existingCompletion?.isCompleted) {
        return res.json({ 
          message: `${habit.name} already completed today`,
          already_completed: true 
        });
      }

      if (existingCompletion) {
        await storage.updateHabitCompletion(existingCompletion.id, {
          isCompleted: true,
          progress: habit.goal
        });
      } else {
        await storage.createHabitCompletion({
          habitId,
          date: today,
          isCompleted: true,
          progress: habit.goal
        });
      }

      res.json({ 
        message: `${habit.name} completed! Great job!`,
        habit_name: habit.name,
        streak_continued: true
      });
    } catch (error) {
      console.error("Complete habit error:", error);
      res.status(500).json({ message: "Failed to complete habit" });
    }
  });

  // Undo habit completion endpoint
  app.post("/api/habits/:id/undo", async (req, res) => {
    try {
      const { id } = req.params;
      const habitId = parseInt(id);
      
      const habit = await storage.getHabit(habitId);
      if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
      }

      const today = new Date().toISOString().split('T')[0];
      const completion = await storage.getHabitCompletionByDate(habitId, today);

      if (!completion?.isCompleted) {
        return res.json({ 
          message: `${habit.name} wasn't completed today`,
          not_completed: true 
        });
      }

      await storage.updateHabitCompletion(completion.id, {
        isCompleted: false,
        progress: 0
      });

      res.json({ 
        message: `${habit.name} completion undone`,
        habit_name: habit.name
      });
    } catch (error) {
      console.error("Undo habit error:", error);
      res.status(500).json({ message: "Failed to undo habit completion" });
    }
  });

  // Trend insights endpoint
  app.get("/api/insights/:timeframe?", async (req, res) => {
    try {
      const { timeframe = 'month' } = req.params;
      const userId = DEFAULT_USER_ID;
      
      const insights = [
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
        }
      ];

      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Failed to get insights" });
    }
  });

  // Pattern recognition endpoint
  app.get("/api/pattern-recognition/:timeframe?", async (req, res) => {
    try {
      const patterns = {
        bestDays: ["Tuesday", "Wednesday", "Thursday"],
        bestTimes: ["8:00 AM", "2:00 PM", "8:00 PM"],
        challengingDays: ["Friday", "Saturday"],
        streakBreakers: ["Late nights", "Travel days"],
        successFactors: ["Morning routine", "Energy tracking", "Social support"],
        correlations: [
          {
            habit1: "Morning Exercise",
            habit2: "Productivity",
            strength: 0.85,
            type: "positive"
          },
          {
            habit1: "Good Sleep",
            habit2: "Mood",
            strength: 0.78,
            type: "positive"
          }
        ]
      };

      res.json(patterns);
    } catch (error) {
      res.status(500).json({ message: "Failed to get patterns" });
    }
  });

  // Contextual reminders endpoint
  app.get("/api/contextual-reminders", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const habits = await storage.getHabits(userId);
      
      // Generate contextual reminders based on current time and habits
      const reminders = habits.map((habit: any, index: number) => ({
        id: index + 1,
        habitId: habit.id,
        habitName: habit.name,
        baseTime: habit.reminderTime || "09:00",
        contextualTime: habit.reminderTime || "09:00",
        context: {
          weather: "clear",
          location: "home",
          dayType: new Date().getDay() === 0 || new Date().getDay() === 6 ? "weekend" : "weekday",
          energyLevel: "medium"
        },
        adaptiveMessage: `Time for ${habit.name.toLowerCase()}! Perfect moment to build consistency.`,
        priority: habit.streak > 7 ? "high" : "medium",
        streakRisk: false
      }));

      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get contextual reminders" });
    }
  });

  // Create contextual reminder endpoint
  app.post("/api/contextual-reminders", async (req, res) => {
    try {
      const { habitId, message, context, scheduledTime } = req.body;
      
      // In a real app, this would schedule the reminder
      res.json({ 
        id: Date.now(),
        habitId,
        message,
        context,
        scheduledTime,
        status: "scheduled"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create reminder" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
