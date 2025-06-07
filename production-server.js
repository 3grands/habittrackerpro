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

// Database connection with minimal configuration
let dbPool;
try {
  dbPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 1000,
    connectionTimeoutMillis: 3000,
  });
} catch (error) {
  console.error('Database pool creation failed:', error);
}

// Safe database query function
async function safeQuery(text, params = []) {
  if (!dbPool) {
    throw new Error('Database not available');
  }
  
  let client;
  try {
    client = await dbPool.connect();
    const result = await client.query(text, params);
    return result;
  } finally {
    if (client) client.release();
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', server: 'HabitFlow' });
});

app.get('/api/habits', async (req, res) => {
  try {
    const result = await safeQuery(
      'SELECT * FROM habits WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC',
      [1]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error.message);
    res.status(500).json({ error: 'Unable to fetch habits' });
  }
});

app.post('/api/habits', async (req, res) => {
  try {
    const { name, category, frequency = 'daily', goal = 1, unit = 'times' } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }
    
    const result = await safeQuery(
      `INSERT INTO habits (user_id, name, category, frequency, goal, unit, streak, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 0, true, NOW()) RETURNING *`,
      [1, name, category, frequency, goal, unit]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create habit error:', error.message);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

app.patch('/api/habits/:id', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    if (isNaN(habitId)) {
      return res.status(400).json({ error: 'Invalid habit ID' });
    }
    
    const updates = req.body;
    const validFields = ['name', 'category', 'frequency', 'goal', 'unit', 'streak', 'reminderTime'];
    const fields = Object.keys(updates).filter(key => validFields.includes(key));
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(habitId);
    
    const result = await safeQuery(
      `UPDATE habits SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update habit error:', error.message);
    res.status(500).json({ error: 'Failed to update habit' });
  }
});

app.delete('/api/habits/:id', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    if (isNaN(habitId)) {
      return res.status(400).json({ error: 'Invalid habit ID' });
    }
    
    const result = await safeQuery(
      'UPDATE habits SET is_active = false WHERE id = $1 RETURNING *',
      [habitId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    res.json({ success: true, message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Delete habit error:', error.message);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

// Habit completions
app.get('/api/habits/:id/completions', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    if (isNaN(habitId)) {
      return res.status(400).json({ error: 'Invalid habit ID' });
    }
    
    const result = await safeQuery(
      'SELECT * FROM habit_completions WHERE habit_id = $1 ORDER BY date DESC',
      [habitId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch completions error:', error.message);
    res.status(500).json({ error: 'Failed to fetch completions' });
  }
});

app.post('/api/habits/:id/completions', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    if (isNaN(habitId)) {
      return res.status(400).json({ error: 'Invalid habit ID' });
    }
    
    const { date = new Date().toISOString().split('T')[0], progress = 1, notes = '' } = req.body;
    
    const result = await safeQuery(
      `INSERT INTO habit_completions (habit_id, date, progress, is_completed, completed_at)
       VALUES ($1, $2, $3, true, NOW()) RETURNING *`,
      [habitId, date, progress]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create completion error:', error.message);
    res.status(500).json({ error: 'Failed to create completion' });
  }
});

// Mood tracking
app.get('/api/mood', async (req, res) => {
  try {
    const result = await safeQuery(
      'SELECT * FROM mood_entries WHERE user_id = $1 ORDER BY date DESC LIMIT 30',
      [1]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch mood error:', error.message);
    res.status(500).json({ error: 'Failed to fetch mood entries' });
  }
});

app.post('/api/mood', async (req, res) => {
  try {
    const { mood, energy, notes = '', date = new Date().toISOString().split('T')[0] } = req.body;
    
    if (!mood || !energy) {
      return res.status(400).json({ error: 'Mood and energy are required' });
    }
    
    const result = await safeQuery(
      `INSERT INTO mood_entries (user_id, date, mood, energy, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [1, date, mood, energy, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create mood error:', error.message);
    res.status(500).json({ error: 'Failed to create mood entry' });
  }
});

// Coaching tips
app.get('/api/coaching', async (req, res) => {
  try {
    const result = await safeQuery(
      'SELECT * FROM coaching_tips WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
      [1]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch coaching error:', error.message);
    res.status(500).json({ error: 'Failed to fetch coaching tips' });
  }
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
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
    },
    optimizeDeps: {
      include: ['react', 'react-dom']
    }
  });
  
  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);
  
  return vite;
}

const PORT = 5000;

async function startServer() {
  try {
    console.log('Starting HabitFlow development server...');
    
    const vite = await setupDevServer();
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 HabitFlow running on port ${PORT}`);
      console.log(`📱 Frontend: http://localhost:${PORT}`);
      console.log(`🔌 API: http://localhost:${PORT}/api/habits`);
      console.log(`💚 Health: http://localhost:${PORT}/api/health`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('Shutting down gracefully...');
      server.close(async () => {
        await vite.close();
        if (dbPool) await dbPool.end();
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();