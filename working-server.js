import express from "express";
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, and } from "drizzle-orm";
import { habits, habitCompletions, moodEntries, chatMessages, coachingTips } from "./shared/schema.ts";

const app = express();

// Database setup
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Get all habits for user
app.get('/api/habits', async (req, res) => {
  try {
    const userHabits = await db.select().from(habits).where(
      and(
        eq(habits.userId, 1),
        eq(habits.isActive, true)
      )
    );
    res.json(userHabits);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Create new habit
app.post('/api/habits', async (req, res) => {
  try {
    const habitData = {
      userId: 1,
      name: req.body.name,
      category: req.body.category,
      frequency: req.body.frequency || 'daily',
      goal: req.body.goal || 1,
      unit: req.body.unit || 'times',
      reminderTime: req.body.reminderTime || null,
      streak: 0,
      isActive: true,
      createdAt: new Date()
    };
    
    const [newHabit] = await db.insert(habits).values(habitData).returning();
    res.status(201).json(newHabit);
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

// Get specific habit
app.get('/api/habits/:id', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    const [habit] = await db.select().from(habits).where(eq(habits.id, habitId));
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json(habit);
  } catch (error) {
    console.error('Error fetching habit:', error);
    res.status(500).json({ error: 'Failed to fetch habit' });
  }
});

// Update habit
app.patch('/api/habits/:id', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    const [updatedHabit] = await db.update(habits)
      .set(req.body)
      .where(eq(habits.id, habitId))
      .returning();
    
    if (!updatedHabit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json(updatedHabit);
  } catch (error) {
    console.error('Error updating habit:', error);
    res.status(500).json({ error: 'Failed to update habit' });
  }
});

// Delete habit
app.delete('/api/habits/:id', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    const [deletedHabit] = await db.update(habits)
      .set({ isActive: false })
      .where(eq(habits.id, habitId))
      .returning();
    
    if (!deletedHabit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

// Get habit completions
app.get('/api/habits/:id/completions', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    const completions = await db.select().from(habitCompletions)
      .where(eq(habitCompletions.habitId, habitId));
    res.json(completions);
  } catch (error) {
    console.error('Error fetching completions:', error);
    res.status(500).json({ error: 'Failed to fetch completions' });
  }
});

// Create habit completion
app.post('/api/habits/:id/completions', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    const completionData = {
      habitId,
      date: req.body.date || new Date().toISOString().split('T')[0],
      value: req.body.value || 1,
      notes: req.body.notes || '',
      completedAt: new Date()
    };
    
    const [completion] = await db.insert(habitCompletions)
      .values(completionData)
      .returning();
    res.status(201).json(completion);
  } catch (error) {
    console.error('Error creating completion:', error);
    res.status(500).json({ error: 'Failed to create completion' });
  }
});

// Get mood entries
app.get('/api/mood', async (req, res) => {
  try {
    const entries = await db.select().from(moodEntries)
      .where(eq(moodEntries.userId, 1));
    res.json(entries);
  } catch (error) {
    console.error('Error fetching mood entries:', error);
    res.status(500).json({ error: 'Failed to fetch mood entries' });
  }
});

// Create mood entry
app.post('/api/mood', async (req, res) => {
  try {
    const entryData = {
      userId: 1,
      mood: req.body.mood,
      energy: req.body.energy,
      stress: req.body.stress,
      notes: req.body.notes || '',
      date: req.body.date || new Date().toISOString().split('T')[0],
      createdAt: new Date()
    };
    
    const [entry] = await db.insert(moodEntries)
      .values(entryData)
      .returning();
    res.status(201).json(entry);
  } catch (error) {
    console.error('Error creating mood entry:', error);
    res.status(500).json({ error: 'Failed to create mood entry' });
  }
});

// Get coaching tips
app.get('/api/coaching', async (req, res) => {
  try {
    const tips = await db.select().from(coachingTips)
      .where(eq(coachingTips.userId, 1));
    res.json(tips);
  } catch (error) {
    console.error('Error fetching coaching tips:', error);
    res.status(500).json({ error: 'Failed to fetch coaching tips' });
  }
});

// Get chat messages
app.get('/api/chat', async (req, res) => {
  try {
    const messages = await db.select().from(chatMessages)
      .where(eq(chatMessages.userId, 1));
    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`HabitFlow API running on port ${PORT}`);
});