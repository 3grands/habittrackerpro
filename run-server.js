import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Sample habits data
const habits = [
  { id: 1, userId: 1, name: "Morning Exercise", category: "health", frequency: "daily", goal: 1, unit: "times", streak: 5, isActive: true, createdAt: "2025-06-06T23:26:36.403Z" },
  { id: 2, userId: 1, name: "Drink 8 glasses of water", category: "health", frequency: "daily", goal: 8, unit: "glasses", streak: 3, isActive: true, createdAt: "2025-06-06T23:43:48.047Z" },
  { id: 3, userId: 1, name: "10-minute meditation", category: "mindfulness", frequency: "daily", goal: 10, unit: "minutes", streak: 7, isActive: true, createdAt: "2025-06-06T23:43:48.047Z" },
  { id: 4, userId: 1, name: "Read for 30 minutes", category: "learning", frequency: "daily", goal: 30, unit: "minutes", streak: 2, isActive: true, createdAt: "2025-06-06T23:43:48.047Z" },
  { id: 5, userId: 1, name: "50 push-ups", category: "fitness", frequency: "daily", goal: 50, unit: "times", streak: 1, isActive: true, createdAt: "2025-06-06T23:43:48.047Z" },
  { id: 6, userId: 1, name: "Write in gratitude journal", category: "mindfulness", frequency: "daily", goal: 1, unit: "times", streak: 4, isActive: true, createdAt: "2025-06-06T23:43:48.047Z" }
];

let habitIdCounter = 7;

// API Routes
app.get('/api/health', (req, res) => res.json({ status: 'healthy', timestamp: new Date().toISOString() }));

app.get('/api/habits', (req, res) => {
  const userHabits = habits.filter(h => h.isActive);
  res.json(userHabits);
});

app.get('/api/habits/:id', (req, res) => {
  const habit = habits.find(h => h.id === parseInt(req.params.id) && h.isActive);
  habit ? res.json(habit) : res.status(404).json({ error: 'Habit not found' });
});

app.post('/api/habits', (req, res) => {
  const { name, category, frequency, goal = 1, unit = 'times' } = req.body;
  if (!name || !category || !frequency) return res.status(400).json({ error: 'Missing required fields' });
  
  const newHabit = {
    id: habitIdCounter++,
    userId: 1,
    name, category, frequency, goal, unit,
    streak: 0, isActive: true,
    createdAt: new Date().toISOString()
  };
  
  habits.push(newHabit);
  res.status(201).json(newHabit);
});

app.patch('/api/habits/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const habitIndex = habits.findIndex(h => h.id === id);
  if (habitIndex === -1) return res.status(404).json({ error: 'Habit not found' });
  
  habits[habitIndex] = { ...habits[habitIndex], ...req.body };
  res.json(habits[habitIndex]);
});

app.delete('/api/habits/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const habitIndex = habits.findIndex(h => h.id === id);
  if (habitIndex === -1) return res.status(404).json({ error: 'Habit not found' });
  
  habits[habitIndex].isActive = false;
  res.status(204).send();
});

// Serve static files or development HTML
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API endpoint not found' });
  
  const distPath = join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(distPath)) {
    res.sendFile(distPath);
  } else {
    res.send(`<!DOCTYPE html>
<html><head><title>HabitFlow</title></head><body>
<h1>HabitFlow Server Running</h1>
<p>API available at: <a href="/api/habits">/api/habits</a></p>
<p>Frontend will be served when built.</p>
</body></html>`);
  }
});

// Start server immediately on port 5000
const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`HabitFlow server running on port ${PORT}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));