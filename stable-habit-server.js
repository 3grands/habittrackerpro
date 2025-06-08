import express from 'express';
import { createServer } from 'http';
import path from 'path';

const app = express();
const server = createServer(app);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// In-memory storage for habits
const habits = [
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

// API Routes
app.get('/api/habits', (req, res) => {
  try {
    console.log('GET /api/habits - returning', habits.length, 'habits');
    res.json(habits);
  } catch (error) {
    console.error('Error in /api/habits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/habits/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const habit = habits.find(h => h.id === id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json(habit);
  } catch (error) {
    console.error('Error in /api/habits/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/habits', (req, res) => {
  try {
    const newHabit = {
      id: habits.length + 1,
      userId: 1,
      ...req.body,
      isActive: true,
      createdAt: new Date()
    };
    habits.push(newHabit);
    console.log('POST /api/habits - created habit:', newHabit.name);
    res.status(201).json(newHabit);
  } catch (error) {
    console.error('Error in POST /api/habits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/habits/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const habitIndex = habits.findIndex(h => h.id === id);
    if (habitIndex === -1) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    // Only allow updating specific safe properties
    const allowedFields = ['name', 'category', 'frequency', 'goal', 'unit', 'reminderTime', 'streak', 'isActive'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    
    habits[habitIndex] = { ...habits[habitIndex], ...updates };
    console.log('PATCH /api/habits/:id - updated habit:', habits[habitIndex].name);
    res.json(habits[habitIndex]);
  } catch (error) {
    console.error('Error in PATCH /api/habits/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/habits/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const habitIndex = habits.findIndex(h => h.id === id);
    if (habitIndex === -1) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    habits.splice(habitIndex, 1);
    console.log('DELETE /api/habits/:id - deleted habit with id:', id);
    res.status(204).send();
  } catch (error) {
    console.error('Error in DELETE /api/habits/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  // Development - serve a simple response for non-API routes
  app.get('*', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>HabitFlow - Development Server</title>
        </head>
        <body>
          <h1>HabitFlow Backend Running</h1>
          <p>API endpoints available at:</p>
          <ul>
            <li>GET /api/health</li>
            <li>GET /api/habits</li>
            <li>POST /api/habits</li>
            <li>PATCH /api/habits/:id</li>
            <li>DELETE /api/habits/:id</li>
          </ul>
        </body>
      </html>
    `);
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`HabitFlow server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Habits API: http://localhost:${PORT}/api/habits`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});