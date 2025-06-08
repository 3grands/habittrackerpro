import express from "express";
import { Pool } from '@neondatabase/serverless';

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

// Database with minimal configuration
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1
});

// Database query with retry logic
async function dbQuery(text, params = []) {
  let retries = 3;
  while (retries > 0) {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get habits
app.get('/api/habits', async (req, res) => {
  try {
    const result = await dbQuery(
      'SELECT * FROM habits WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC',
      [1]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error.message);
    res.status(500).json({ error: 'Database unavailable' });
  }
});

// Create habit
app.post('/api/habits', async (req, res) => {
  try {
    const { name, category, frequency = 'daily', goal = 1, unit = 'times' } = req.body;
    const result = await dbQuery(
      `INSERT INTO habits (user_id, name, category, frequency, goal, unit, streak, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 0, true, NOW()) RETURNING *`,
      [1, name, category, frequency, goal, unit]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create error:', error.message);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

// Update habit
app.patch('/api/habits/:id', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    const updates = req.body;
    
    // Whitelist of allowed fields to prevent SQL injection
    const allowedFields = {
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
      if (allowedFields[key]) {
        setClauses.push(`${allowedFields[key]} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    values.push(habitId);
    
    const result = await dbQuery(
      `UPDATE habits SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update error:', error.message);
    res.status(500).json({ error: 'Failed to update habit' });
  }
});

// Delete habit
app.delete('/api/habits/:id', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    const result = await dbQuery(
      'UPDATE habits SET is_active = false WHERE id = $1 RETURNING *',
      [habitId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

// Habit completions
app.get('/api/habits/:id/completions', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    const result = await dbQuery(
      'SELECT * FROM habit_completions WHERE habit_id = $1 ORDER BY date DESC',
      [habitId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Completions error:', error.message);
    res.status(500).json({ error: 'Failed to fetch completions' });
  }
});

app.post('/api/habits/:id/completions', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    const { date = new Date().toISOString().split('T')[0], progress = 1 } = req.body;
    
    const result = await dbQuery(
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

// Mood tracking
app.get('/api/mood', async (req, res) => {
  try {
    const result = await dbQuery(
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
    const result = await dbQuery(
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

// Coaching tips
app.get('/api/coaching', async (req, res) => {
  try {
    const result = await dbQuery(
      'SELECT * FROM coaching_tips WHERE user_id = $1 ORDER BY created_at DESC',
      [1]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Coaching error:', error.message);
    res.status(500).json({ error: 'Failed to fetch coaching tips' });
  }
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on port ${PORT}`);
});