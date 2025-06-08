import express from "express";
import { Pool } from '@neondatabase/serverless';
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

// Database with retry logic
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  idleTimeoutMillis: 5000
});

async function queryWithRetry(text, params = [], retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error) {
      if (i === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/habits', async (req, res) => {
  try {
    const result = await queryWithRetry(
      'SELECT * FROM habits WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC',
      [1]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Habits fetch error:', error.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.post('/api/habits', async (req, res) => {
  try {
    const { name, category, frequency = 'daily', goal = 1, unit = 'times' } = req.body;
    const result = await queryWithRetry(
      `INSERT INTO habits (user_id, name, category, frequency, goal, unit, streak, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 0, true, NOW()) RETURNING *`,
      [1, name, category, frequency, goal, unit]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Habit create error:', error.message);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

app.patch('/api/habits/:id', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    const updates = req.body;
    
    // Use explicit field mapping to prevent SQL injection
    const fieldMap = {
      'name': 'name',
      'category': 'category',
      'frequency': 'frequency',
      'goal': 'goal',
      'unit': 'unit',
      'streak': 'streak',
      'is_active': 'is_active',
      'reminder_time': 'reminder_time'
    };
    
    const setClauses = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && fieldMap[key]) {
        setClauses.push(`${fieldMap[key]} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    values.push(habitId);
    
    const result = await queryWithRetry(
      `UPDATE habits SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Habit update error:', error.message);
    res.status(500).json({ error: 'Failed to update habit' });
  }
});

app.delete('/api/habits/:id', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    const result = await queryWithRetry(
      'UPDATE habits SET is_active = false WHERE id = $1 RETURNING *',
      [habitId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Habit delete error:', error.message);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

app.get('/api/habits/:id/completions', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    const result = await queryWithRetry(
      'SELECT * FROM habit_completions WHERE habit_id = $1 ORDER BY date DESC',
      [habitId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Completions fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch completions' });
  }
});

app.post('/api/habits/:id/completions', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    const { date = new Date().toISOString().split('T')[0], progress = 1 } = req.body;
    
    const result = await queryWithRetry(
      `INSERT INTO habit_completions (habit_id, date, progress, is_completed, completed_at)
       VALUES ($1, $2, $3, true, NOW()) RETURNING *`,
      [habitId, date, progress]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Completion create error:', error.message);
    res.status(500).json({ error: 'Failed to create completion' });
  }
});

app.get('/api/mood', async (req, res) => {
  try {
    const result = await queryWithRetry(
      'SELECT * FROM mood_entries WHERE user_id = $1 ORDER BY date DESC',
      [1]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Mood fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch mood entries' });
  }
});

app.post('/api/mood', async (req, res) => {
  try {
    const { mood, energy, notes = '', date = new Date().toISOString().split('T')[0] } = req.body;
    const result = await queryWithRetry(
      `INSERT INTO mood_entries (user_id, date, mood, energy, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [1, date, mood, energy, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Mood create error:', error.message);
    res.status(500).json({ error: 'Failed to create mood entry' });
  }
});

app.get('/api/coaching', async (req, res) => {
  try {
    const result = await queryWithRetry(
      'SELECT * FROM coaching_tips WHERE user_id = $1 ORDER BY created_at DESC',
      [1]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Coaching fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch coaching tips' });
  }
});

// Setup Vite for development
async function setupViteServer() {
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
}

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await setupViteServer();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Frontend: http://localhost:${PORT}`);
      console.log(`API: http://localhost:${PORT}/api/habits`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

startServer();