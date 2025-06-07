import express from "express";
import { storage } from "./server/storage.ts";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS headers
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

// API routes
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

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});