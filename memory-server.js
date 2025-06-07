import express from "express";
import { createServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// In-memory data storage
let habits = [
  {
    id: 1,
    userId: 1,
    name: "Morning Exercise",
    category: "health",
    frequency: "daily",
    goal: 1,
    unit: "times",
    reminderTime: null,
    streak: 5,
    isActive: true,
    createdAt: new Date("2025-06-06T23:26:36.403Z")
  },
  {
    id: 2,
    userId: 1,
    name: "Drink 8 glasses of water",
    category: "health",
    frequency: "daily",
    goal: 8,
    unit: "glasses",
    reminderTime: null,
    streak: 3,
    isActive: true,
    createdAt: new Date("2025-06-06T23:43:48.047Z")
  },
  {
    id: 3,
    userId: 1,
    name: "10-minute meditation",
    category: "mindfulness",
    frequency: "daily",
    goal: 10,
    unit: "minutes",
    reminderTime: null,
    streak: 7,
    isActive: true,
    createdAt: new Date("2025-06-06T23:43:48.047Z")
  },
  {
    id: 4,
    userId: 1,
    name: "Read for 30 minutes",
    category: "learning",
    frequency: "daily",
    goal: 30,
    unit: "minutes",
    reminderTime: null,
    streak: 2,
    isActive: true,
    createdAt: new Date("2025-06-06T23:43:48.047Z")
  },
  {
    id: 5,
    userId: 1,
    name: "50 push-ups",
    category: "fitness",
    frequency: "daily",
    goal: 50,
    unit: "times",
    reminderTime: null,
    streak: 1,
    isActive: true,
    createdAt: new Date("2025-06-06T23:43:48.047Z")
  },
  {
    id: 6,
    userId: 1,
    name: "Write in gratitude journal",
    category: "mindfulness",
    frequency: "daily",
    goal: 1,
    unit: "times",
    reminderTime: null,
    streak: 4,
    isActive: true,
    createdAt: new Date("2025-06-06T23:43:48.047Z")
  }
];

let habitCompletions = [];
let moodEntries = [];
let coachingTips = [
  {
    id: 1,
    userId: 1,
    tip: "Start small and build momentum. Even 5 minutes of exercise is better than none.",
    category: "motivation",
    createdAt: new Date()
  },
  {
    id: 2,
    userId: 1,
    tip: "Track your water intake to stay hydrated throughout the day.",
    category: "health",
    createdAt: new Date()
  }
];

let nextHabitId = 7;
let nextCompletionId = 1;
let nextMoodId = 1;
let nextTipId = 3;

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', server: 'HabitFlow' });
});

app.get('/api/habits', (req, res) => {
  const activeHabits = habits.filter(h => h.isActive && h.userId === 1);
  res.json(activeHabits);
});

app.post('/api/habits', (req, res) => {
  const { name, category, frequency = 'daily', goal = 1, unit = 'times', reminderTime } = req.body;
  
  if (!name || !category) {
    return res.status(400).json({ error: 'Name and category are required' });
  }
  
  const newHabit = {
    id: nextHabitId++,
    userId: 1,
    name,
    category,
    frequency,
    goal: parseInt(goal),
    unit,
    reminderTime,
    streak: 0,
    isActive: true,
    createdAt: new Date()
  };
  
  habits.push(newHabit);
  res.status(201).json(newHabit);
});

app.get('/api/habits/:id', (req, res) => {
  const habitId = parseInt(req.params.id);
  const habit = habits.find(h => h.id === habitId && h.isActive);
  
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found' });
  }
  
  res.json(habit);
});

app.patch('/api/habits/:id', (req, res) => {
  const habitId = parseInt(req.params.id);
  const habitIndex = habits.findIndex(h => h.id === habitId && h.isActive);
  
  if (habitIndex === -1) {
    return res.status(404).json({ error: 'Habit not found' });
  }
  
  const updates = req.body;
  const validFields = ['name', 'category', 'frequency', 'goal', 'unit', 'streak', 'reminderTime'];
  
  for (const [key, value] of Object.entries(updates)) {
    if (validFields.includes(key)) {
      habits[habitIndex][key] = value;
    }
  }
  
  res.json(habits[habitIndex]);
});

app.delete('/api/habits/:id', (req, res) => {
  const habitId = parseInt(req.params.id);
  const habitIndex = habits.findIndex(h => h.id === habitId && h.isActive);
  
  if (habitIndex === -1) {
    return res.status(404).json({ error: 'Habit not found' });
  }
  
  habits[habitIndex].isActive = false;
  res.json({ success: true, message: 'Habit deleted successfully' });
});

// Habit completions
app.get('/api/habits/:id/completions', (req, res) => {
  const habitId = parseInt(req.params.id);
  const completions = habitCompletions
    .filter(c => c.habitId === habitId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(completions);
});

app.post('/api/habits/:id/completions', (req, res) => {
  const habitId = parseInt(req.params.id);
  const { date = new Date().toISOString().split('T')[0], progress = 1, notes = '' } = req.body;
  
  const completion = {
    id: nextCompletionId++,
    habitId,
    date,
    progress: parseInt(progress),
    isCompleted: true,
    completedAt: new Date(),
    notes
  };
  
  habitCompletions.push(completion);
  
  // Update habit streak
  const habit = habits.find(h => h.id === habitId);
  if (habit) {
    habit.streak += 1;
  }
  
  res.status(201).json(completion);
});

// Mood tracking
app.get('/api/mood', (req, res) => {
  const userMoodEntries = moodEntries
    .filter(m => m.userId === 1)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 30);
  res.json(userMoodEntries);
});

app.post('/api/mood', (req, res) => {
  const { mood, energy, notes = '', date = new Date().toISOString().split('T')[0] } = req.body;
  
  if (!mood || !energy) {
    return res.status(400).json({ error: 'Mood and energy are required' });
  }
  
  const moodEntry = {
    id: nextMoodId++,
    userId: 1,
    date,
    mood: parseInt(mood),
    energy: parseInt(energy),
    notes,
    createdAt: new Date()
  };
  
  moodEntries.push(moodEntry);
  res.status(201).json(moodEntry);
});

// Coaching tips
app.get('/api/coaching', (req, res) => {
  const userTips = coachingTips
    .filter(t => t.userId === 1)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);
  res.json(userTips);
});

app.post('/api/coaching', (req, res) => {
  const { tip, category } = req.body;
  
  if (!tip || !category) {
    return res.status(400).json({ error: 'Tip and category are required' });
  }
  
  const newTip = {
    id: nextTipId++,
    userId: 1,
    tip,
    category,
    createdAt: new Date()
  };
  
  coachingTips.push(newTip);
  res.status(201).json(newTip);
});

// Chat messages (placeholder)
app.get('/api/chat', (req, res) => {
  res.json([]);
});

app.post('/api/chat', (req, res) => {
  const { message, isUser = true } = req.body;
  
  const chatMessage = {
    id: Date.now(),
    userId: 1,
    message,
    isUser,
    timestamp: new Date()
  };
  
  res.status(201).json(chatMessage);
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Vite development server setup
async function setupDevServer() {
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: __dirname,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './client/src'),
        '@assets': path.resolve(__dirname, './attached_assets'),
        '@shared': path.resolve(__dirname, './shared')
      }
    }
  });
  
  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);
  
  return vite;
}

const PORT = 5000;

async function startServer() {
  try {
    console.log('Starting HabitFlow server...');
    
    const vite = await setupDevServer();
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`HabitFlow running on port ${PORT}`);
      console.log(`Frontend: http://localhost:${PORT}`);
      console.log(`API: http://localhost:${PORT}/api/habits`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      server.close(async () => {
        await vite.close();
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

startServer();