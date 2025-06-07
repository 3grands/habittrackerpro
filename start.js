import express from "express";
import { createServer } from "http";
import { storage } from "./server/storage.ts";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API Routes
app.get('/api/habits', async (req, res) => {
  try {
    const habits = await storage.getHabits(1);
    res.json(habits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/habits', async (req, res) => {
  try {
    const habit = await storage.createHabit({ ...req.body, userId: 1 });
    res.json(habit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/habits/:id', async (req, res) => {
  try {
    const habit = await storage.getHabit(parseInt(req.params.id));
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json(habit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/habits/:id', async (req, res) => {
  try {
    const habit = await storage.updateHabit(parseInt(req.params.id), req.body);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json(habit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/habits/:id', async (req, res) => {
  try {
    const success = await storage.deleteHabit(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Habit completions
app.get('/api/habits/:id/completions', async (req, res) => {
  try {
    const completions = await storage.getHabitCompletions(parseInt(req.params.id));
    res.json(completions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/habits/:id/completions', async (req, res) => {
  try {
    const completion = await storage.createHabitCompletion({
      habitId: parseInt(req.params.id),
      ...req.body
    });
    res.json(completion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mood tracking
app.get('/api/mood', async (req, res) => {
  try {
    const entries = await storage.getMoodEntries(1);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/mood', async (req, res) => {
  try {
    const entry = await storage.createMoodEntry({ ...req.body, userId: 1 });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Coaching tips
app.get('/api/coaching', async (req, res) => {
  try {
    const tips = await storage.getCoachingTips(1);
    res.json(tips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 HabitFlow server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
});