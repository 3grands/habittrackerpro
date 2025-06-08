import express from "express";
import pg from "pg";
const { Pool } = pg;

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

// Database configuration with connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3, // Reduced connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get habits with error handling
app.get('/api/habits', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM habits WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC',
      [1]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: 'Failed to fetch habits' });
  } finally {
    if (client) client.release();
  }
});

// Create habit
app.post('/api/habits', async (req, res) => {
  let client;
  try {
    const { name, category, frequency = 'daily', goal = 1, unit = 'times' } = req.body;
    
    client = await pool.connect();
    const result = await client.query(
      `INSERT INTO habits (user_id, name, category, frequency, goal, unit, streak, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 0, true, NOW()) RETURNING *`,
      [1, name, category, frequency, goal, unit]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: 'Failed to create habit' });
  } finally {
    if (client) client.release();
  }
});

// Update habit
app.patch('/api/habits/:id', async (req, res) => {
  let client;
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
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(habitId);
    
    client = await pool.connect();
    const result = await client.query(
      `UPDATE habits SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating habit:', error);
    res.status(500).json({ error: 'Failed to update habit' });
  } finally {
    if (client) client.release();
  }
});

// Delete habit (soft delete)
app.delete('/api/habits/:id', async (req, res) => {
  let client;
  try {
    const habitId = parseInt(req.params.id);
    
    client = await pool.connect();
    const result = await client.query(
      'UPDATE habits SET is_active = false WHERE id = $1 RETURNING *',
      [habitId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ error: 'Failed to delete habit' });
  } finally {
    if (client) client.release();
  }
});

// Get habit completions
app.get('/api/habits/:id/completions', async (req, res) => {
  let client;
  try {
    const habitId = parseInt(req.params.id);
    
    client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM habit_completions WHERE habit_id = $1 ORDER BY date DESC',
      [habitId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching completions:', error);
    res.status(500).json({ error: 'Failed to fetch completions' });
  } finally {
    if (client) client.release();
  }
});

// Create habit completion
app.post('/api/habits/:id/completions', async (req, res) => {
  let client;
  try {
    const habitId = parseInt(req.params.id);
    const { date = new Date().toISOString().split('T')[0], progress = 1 } = req.body;
    
    client = await pool.connect();
    const result = await client.query(
      `INSERT INTO habit_completions (habit_id, date, progress, is_completed, completed_at)
       VALUES ($1, $2, $3, true, NOW()) RETURNING *`,
      [habitId, date, progress]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating completion:', error);
    res.status(500).json({ error: 'Failed to create completion' });
  } finally {
    if (client) client.release();
  }
});

// Get mood entries
app.get('/api/mood', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM mood_entries WHERE user_id = $1 ORDER BY date DESC',
      [1]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching mood entries:', error);
    res.status(500).json({ error: 'Failed to fetch mood entries' });
  } finally {
    if (client) client.release();
  }
});

// Create mood entry
app.post('/api/mood', async (req, res) => {
  let client;
  try {
    const { mood, energy, notes = '', date = new Date().toISOString().split('T')[0] } = req.body;
    
    client = await pool.connect();
    const result = await client.query(
      `INSERT INTO mood_entries (user_id, date, mood, energy, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [1, date, mood, energy, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating mood entry:', error);
    res.status(500).json({ error: 'Failed to create mood entry' });
  } finally {
    if (client) client.release();
  }
});

// Get coaching tips
app.get('/api/coaching', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM coaching_tips WHERE user_id = $1 ORDER BY created_at DESC',
      [1]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching coaching tips:', error);
    res.status(500).json({ error: 'Failed to fetch coaching tips' });
  } finally {
    if (client) client.release();
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`HabitFlow API running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});