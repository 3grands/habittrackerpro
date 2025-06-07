import express from "express";
import pg from "pg";
const { Pool } = pg;

const app = express();

// Basic middleware
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test database connection
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Database connected successfully');
  }
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get habits
app.get('/api/habits', (req, res) => {
  pool.query(
    'SELECT * FROM habits WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC',
    [1],
    (err, result) => {
      if (err) {
        console.error('Query error:', err);
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json(result.rows);
      }
    }
  );
});

// Create habit
app.post('/api/habits', (req, res) => {
  const { name, category, frequency = 'daily', goal = 1, unit = 'times' } = req.body;
  
  pool.query(
    `INSERT INTO habits (user_id, name, category, frequency, goal, unit, streak, is_active, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, 0, true, NOW()) RETURNING *`,
    [1, name, category, frequency, goal, unit],
    (err, result) => {
      if (err) {
        console.error('Insert error:', err);
        res.status(500).json({ error: 'Failed to create habit' });
      } else {
        res.status(201).json(result.rows[0]);
      }
    }
  );
});

// Update habit
app.patch('/api/habits/:id', (req, res) => {
  const habitId = parseInt(req.params.id);
  const { name, category, frequency, goal, unit, streak } = req.body;
  
  const updates = [];
  const values = [];
  let paramCount = 1;
  
  if (name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(name);
  }
  if (category !== undefined) {
    updates.push(`category = $${paramCount++}`);
    values.push(category);
  }
  if (frequency !== undefined) {
    updates.push(`frequency = $${paramCount++}`);
    values.push(frequency);
  }
  if (goal !== undefined) {
    updates.push(`goal = $${paramCount++}`);
    values.push(goal);
  }
  if (unit !== undefined) {
    updates.push(`unit = $${paramCount++}`);
    values.push(unit);
  }
  if (streak !== undefined) {
    updates.push(`streak = $${paramCount++}`);
    values.push(streak);
  }
  
  values.push(habitId);
  
  pool.query(
    `UPDATE habits SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values,
    (err, result) => {
      if (err) {
        console.error('Update error:', err);
        res.status(500).json({ error: 'Failed to update habit' });
      } else if (result.rows.length === 0) {
        res.status(404).json({ error: 'Habit not found' });
      } else {
        res.json(result.rows[0]);
      }
    }
  );
});

// Delete habit
app.delete('/api/habits/:id', (req, res) => {
  const habitId = parseInt(req.params.id);
  
  pool.query(
    'UPDATE habits SET is_active = false WHERE id = $1',
    [habitId],
    (err, result) => {
      if (err) {
        console.error('Delete error:', err);
        res.status(500).json({ error: 'Failed to delete habit' });
      } else {
        res.json({ success: true });
      }
    }
  );
});

// Habit completions
app.get('/api/habits/:id/completions', (req, res) => {
  const habitId = parseInt(req.params.id);
  
  pool.query(
    'SELECT * FROM habit_completions WHERE habit_id = $1 ORDER BY date DESC',
    [habitId],
    (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json(result.rows);
      }
    }
  );
});

app.post('/api/habits/:id/completions', (req, res) => {
  const habitId = parseInt(req.params.id);
  const { date = new Date().toISOString().split('T')[0], progress = 1 } = req.body;
  
  pool.query(
    `INSERT INTO habit_completions (habit_id, date, progress, is_completed, completed_at)
     VALUES ($1, $2, $3, true, NOW()) RETURNING *`,
    [habitId, date, progress],
    (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Failed to create completion' });
      } else {
        res.status(201).json(result.rows[0]);
      }
    }
  );
});

// Mood entries
app.get('/api/mood', (req, res) => {
  pool.query(
    'SELECT * FROM mood_entries WHERE user_id = $1 ORDER BY date DESC',
    [1],
    (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json(result.rows);
      }
    }
  );
});

app.post('/api/mood', (req, res) => {
  const { mood, energy, notes = '', date = new Date().toISOString().split('T')[0] } = req.body;
  
  pool.query(
    `INSERT INTO mood_entries (user_id, date, mood, energy, notes, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
    [1, date, mood, energy, notes],
    (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Failed to create mood entry' });
      } else {
        res.status(201).json(result.rows[0]);
      }
    }
  );
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);
});