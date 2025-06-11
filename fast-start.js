#!/usr/bin/env node

import express from 'express';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app immediately
const app = express();
const server = createServer(app);

// Essential middleware only
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// In-memory habits storage
const habits = [
  { id: 1, userId: 1, name: "Morning Exercise", category: "health", frequency: "daily", goal: 1, unit: "times", streak: 5, isActive: true, createdAt: "2025-06-06T23:26:36.403Z", todayProgress: 0, isCompletedToday: false },
  { id: 2, userId: 1, name: "Drink 8 glasses of water", category: "health", frequency: "daily", goal: 8, unit: "glasses", streak: 3, isActive: true, createdAt: "2025-06-06T23:43:48.047Z", todayProgress: 0, isCompletedToday: false },
  { id: 3, userId: 1, name: "10-minute meditation", category: "mindfulness", frequency: "daily", goal: 10, unit: "minutes", streak: 7, isActive: true, createdAt: "2025-06-06T23:43:48.047Z", todayProgress: 0, isCompletedToday: false },
  { id: 4, userId: 1, name: "Read for 30 minutes", category: "learning", frequency: "daily", goal: 30, unit: "minutes", streak: 2, isActive: true, createdAt: "2025-06-06T23:43:48.047Z", todayProgress: 0, isCompletedToday: false },
  { id: 5, userId: 1, name: "50 push-ups", category: "fitness", frequency: "daily", goal: 50, unit: "times", streak: 1, isActive: true, createdAt: "2025-06-06T23:43:48.047Z", todayProgress: 0, isCompletedToday: false },
  { id: 6, userId: 1, name: "Write in gratitude journal", category: "mindfulness", frequency: "daily", goal: 1, unit: "times", streak: 4, isActive: true, createdAt: "2025-06-06T23:43:48.047Z", todayProgress: 0, isCompletedToday: false }
];

let habitCounter = 7;

// API Routes - Essential endpoints only
app.get('/api/health', (req, res) => res.json({ status: 'healthy', service: 'HabitFlow' }));

app.get('/api/habits', (req, res) => {
  try {
    const activeHabits = habits.filter(h => h.isActive);
    res.json(activeHabits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

app.post('/api/habits', (req, res) => {
  try {
    const { name, category, frequency, goal = 1, unit = 'times' } = req.body;
    if (!name || !category || !frequency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newHabit = {
      id: habitCounter++,
      userId: 1,
      name, category, frequency, goal, unit,
      streak: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      todayProgress: 0,
      isCompletedToday: false
    };
    
    habits.push(newHabit);
    res.status(201).json(newHabit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

app.patch('/api/habits/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const habitIndex = habits.findIndex(h => h.id === id);
    if (habitIndex === -1) return res.status(404).json({ error: 'Habit not found' });
    
    // Only allow specific safe properties to be updated
    const { name, category, frequency, goal, unit, streak, todayProgress, isCompletedToday } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (frequency !== undefined) updates.frequency = frequency;
    if (goal !== undefined) updates.goal = goal;
    if (unit !== undefined) updates.unit = unit;
    if (streak !== undefined) updates.streak = streak;
    if (todayProgress !== undefined) updates.todayProgress = todayProgress;
    if (isCompletedToday !== undefined) updates.isCompletedToday = isCompletedToday;
    
    habits[habitIndex] = { ...habits[habitIndex], ...updates };
    res.json(habits[habitIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update habit' });
  }
});

app.delete('/api/habits/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const habitIndex = habits.findIndex(h => h.id === id);
    if (habitIndex === -1) return res.status(404).json({ error: 'Habit not found' });
    
    habits[habitIndex].isActive = false;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

// Toggle habit completion for today
app.post('/api/habits/:id/toggle', (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    const habit = habits.find(h => h.id === habitId && h.isActive);
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    
    habit.isCompletedToday = !habit.isCompletedToday;
    habit.todayProgress = habit.isCompletedToday ? habit.goal : 0;
    
    // Update streak
    if (habit.isCompletedToday) {
      habit.streak += 1;
    } else {
      habit.streak = Math.max(0, habit.streak - 1);
    }
    
    res.json({
      id: Date.now(),
      habitId,
      date: new Date().toISOString().split('T')[0],
      progress: habit.todayProgress,
      isCompleted: habit.isCompletedToday
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle habit' });
  }
});

// Get habit statistics
app.get('/api/habits/stats', (req, res) => {
  try {
    const activeHabits = habits.filter(h => h.isActive);
    const todayCompleted = activeHabits.filter(h => h.isCompletedToday).length;
    const totalStreak = activeHabits.reduce((sum, h) => sum + h.streak, 0);
    
    // Generate weekly progress (mock data for demo)
    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const completed = Math.floor(Math.random() * activeHabits.length);
      weeklyProgress.push({
        date: dateStr,
        completed,
        total: activeHabits.length
      });
    }
    
    res.json({
      todayProgress: `${todayCompleted}/${activeHabits.length}`,
      totalHabits: activeHabits.length,
      totalStreak,
      todayCompleted,
      weeklyProgress,
      completionRate: activeHabits.length > 0 ? Math.round((todayCompleted / activeHabits.length) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get latest coaching tip
app.get('/api/coaching/latest', (req, res) => {
  try {
    const tips = [
      "Start small and be consistent. Focus on building one habit at a time for lasting success!",
      "Track your progress daily to stay motivated and see how far you've come.",
      "When you miss a day, don't break the chain - just get back on track tomorrow.",
      "Celebrate small wins! Every completed habit is a step toward your goals.",
      "Link new habits to existing routines to make them easier to remember."
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    res.json({ tip: randomTip });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coaching tip' });
  }
});

// Post AI coaching advice request
app.post('/api/coaching/advice', (req, res) => {
  try {
    const activeHabits = habits.filter(h => h.isActive);
    const todayCompleted = activeHabits.filter(h => h.isCompletedToday).length;
    
    // Generate contextual advice based on progress
    let advice;
    const completionRate = activeHabits.length > 0 ? (todayCompleted / activeHabits.length) : 0;
    
    if (completionRate >= 0.8) {
      advice = "Outstanding progress! You're building incredible momentum. Keep this consistency going and consider adding a new challenge to push yourself further.";
    } else if (completionRate >= 0.5) {
      advice = "Good work on maintaining your habits! Focus on the ones you missed today and try to complete them tomorrow. Small consistent actions lead to big results.";
    } else {
      advice = "Every journey starts with a single step. Pick one habit to focus on today and give it your full attention. Building habits is about progress, not perfection.";
    }
    
    res.json({ advice });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate advice' });
  }
});

// Basic mood tracking
app.get('/api/mood/entries', (req, res) => {
  try {
    // Return sample mood data
    const moodEntries = [
      { id: 1, date: new Date().toISOString().split('T')[0], mood: 'good', notes: 'Feeling productive today' },
      { id: 2, date: new Date(Date.now() - 86400000).toISOString().split('T')[0], mood: 'great', notes: 'Completed all habits!' }
    ];
    res.json(moodEntries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mood entries' });
  }
});

app.post('/api/mood/entries', (req, res) => {
  try {
    const { mood, notes } = req.body;
    const entry = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      mood,
      notes: notes || ''
    };
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create mood entry' });
  }
});

// Serve frontend files or development placeholder
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Try to serve built frontend first
  const indexPath = join(__dirname, 'dist', 'public', 'index.html');
  if (existsSync(indexPath)) {
    try {
      const html = readFileSync(indexPath, 'utf8');
      res.send(html);
      return;
    } catch (err) {
      console.log('Could not serve built frontend, serving development page');
    }
  }
  
  // Development page with API access
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HabitFlow - Development Server</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 900px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 40px; }
        .status { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .endpoints { display: grid; gap: 10px; margin: 20px 0; }
        .endpoint { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff; }
        .endpoint code { background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: 'Monaco', monospace; }
        .demo { background: #e7f5e7; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .habits-list { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .habit-item { padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .habit-item:last-child { border-bottom: none; }
        .habit-name { font-weight: 600; color: #333; }
        .habit-meta { font-size: 0.9em; color: #666; }
        .streak { background: #28a745; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8em; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🌟 HabitFlow Development Server</h1>
        <p>Smart habit tracking with AI-powered coaching</p>
      </div>
      
      <div class="status">
        <h3>✅ Server Status: Running Successfully</h3>
        <p>Port: 5000 | API: Operational | Storage: In-Memory</p>
      </div>

      <div class="demo">
        <h3>📝 Sample Habits Data</h3>
        <div class="habits-list">
          ${habits.filter(h => h.isActive).map(habit => `
            <div class="habit-item">
              <div>
                <div class="habit-name">${habit.name}</div>
                <div class="habit-meta">${habit.category} • ${habit.frequency} • ${habit.goal} ${habit.unit}</div>
              </div>
              <div class="streak">${habit.streak} day streak</div>
            </div>
          `).join('')}
        </div>
      </div>

      <h3>🔌 Available API Endpoints</h3>
      <div class="endpoints">
        <div class="endpoint">
          <strong>Health Check:</strong> <code>GET /api/health</code>
          <br><small>Verify server status and connectivity</small>
        </div>
        <div class="endpoint">
          <strong>Get Habits:</strong> <code>GET /api/habits</code>
          <br><small>Retrieve all active habits for the user</small>
        </div>
        <div class="endpoint">
          <strong>Create Habit:</strong> <code>POST /api/habits</code>
          <br><small>Add a new habit with name, category, frequency</small>
        </div>
        <div class="endpoint">
          <strong>Update Habit:</strong> <code>PATCH /api/habits/:id</code>
          <br><small>Modify habit details or progress</small>
        </div>
        <div class="endpoint">
          <strong>Delete Habit:</strong> <code>DELETE /api/habits/:id</code>
          <br><small>Remove a habit (soft delete)</small>
        </div>
      </div>

      <script>
        // Test API connectivity
        fetch('/api/health')
          .then(res => res.json())
          .then(data => console.log('API Health Check:', data))
          .catch(err => console.error('API Error:', err));
      </script>
    </body>
    </html>
  `);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server on port 5000 immediately
const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`HabitFlow server running on port ${PORT}`);
  console.log(`Access: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/habits`);
});

// Graceful shutdown
process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));