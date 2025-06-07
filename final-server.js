import express from "express";
import { Pool } from '@neondatabase/serverless';

const app = express();

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

// Initialize database connection
let pool;
try {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
} catch (error) {
  console.error('Database connection failed:', error);
}

// Get all habits
app.get('/api/habits', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM habits WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC',
      [1]
    );
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

// Create new habit
app.post('/api/habits', async (req, res) => {
  try {
    const { name, category, frequency = 'daily', goal = 1, unit = 'times', reminderTime } = req.body;
    
    const client = await pool.connect();
    const result = await client.query(
      `INSERT INTO habits (user_id, name, category, frequency, goal, unit, reminder_time, streak, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, true, NOW())
       RETURNING *`,
      [1, name, category, frequency, goal, unit, reminderTime]
    );
    client.release();
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

// Get specific habit
app.get('/api/habits/:id', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM habits WHERE id = $1', [habitId]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching habit:', error);
    res.status(500).json({ error: 'Failed to fetch habit' });
  }
});

// Update habit
app.patch('/api/habits/:id', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    const updates = req.body;
    
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
    
    values.push(habitId);
    
    const client = await pool.connect();
    const result = await client.query(
      `UPDATE habits SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating habit:', error);
    res.status(500).json({ error: 'Failed to update habit' });
  }
});

// Delete habit (soft delete)
app.delete('/api/habits/:id', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    
    const client = await pool.connect();
    const result = await client.query(
      'UPDATE habits SET is_active = false WHERE id = $1 RETURNING *',
      [habitId]
    );
    client.release();
    
    if (result.rows.length === 0) {
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
    
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM habit_completions WHERE habit_id = $1 ORDER BY date DESC',
      [habitId]
    );
    client.release();
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching completions:', error);
    res.status(500).json({ error: 'Failed to fetch completions' });
  }
});

// Create habit completion
app.post('/api/habits/:id/completions', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    const { date = new Date().toISOString().split('T')[0], progress = 1, isCompleted = true } = req.body;
    
    const client = await pool.connect();
    const result = await client.query(
      `INSERT INTO habit_completions (habit_id, date, progress, is_completed, completed_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [habitId, date, progress, isCompleted]
    );
    client.release();
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating completion:', error);
    res.status(500).json({ error: 'Failed to create completion' });
  }
});

// Get mood entries
app.get('/api/mood', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM mood_entries WHERE user_id = $1 ORDER BY date DESC',
      [1]
    );
    client.release();
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching mood entries:', error);
    res.status(500).json({ error: 'Failed to fetch mood entries' });
  }
});

// Create mood entry
app.post('/api/mood', async (req, res) => {
  try {
    const { mood, energy, notes = '', date = new Date().toISOString().split('T')[0] } = req.body;
    
    const client = await pool.connect();
    const result = await client.query(
      `INSERT INTO mood_entries (user_id, date, mood, energy, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [1, date, mood, energy, notes]
    );
    client.release();
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating mood entry:', error);
    res.status(500).json({ error: 'Failed to create mood entry' });
  }
});

// Get coaching tips
app.get('/api/coaching', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM coaching_tips WHERE user_id = $1 ORDER BY created_at DESC',
      [1]
    );
    client.release();
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching coaching tips:', error);
    res.status(500).json({ error: 'Failed to fetch coaching tips' });
  }
});

// Get chat messages
app.get('/api/chat', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY timestamp DESC',
      [1]
    );
    client.release();
    
    res.json(result.rows);
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
  console.log(`HabitFlow API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});