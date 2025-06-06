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

  const httpServer = createServer(app);
  return httpServer;
}
