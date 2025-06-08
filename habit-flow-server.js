import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Sample habits data
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
    createdAt: "2025-06-06T23:26:36.403Z"
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
    createdAt: "2025-06-06T23:43:48.047Z"
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
    createdAt: "2025-06-06T23:43:48.047Z"
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
    createdAt: "2025-06-06T23:43:48.047Z"
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
    createdAt: "2025-06-06T23:43:48.047Z"
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
    createdAt: "2025-06-06T23:43:48.047Z"
  }
];

let habitIdCounter = 7;

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'HabitFlow API'
  });
});

app.get('/api/habits', (req, res) => {
  try {
    const userId = req.query.userId || 1;
    const userHabits = habits.filter(h => h.userId == userId && h.isActive);
    console.log(`Returning ${userHabits.length} habits for user ${userId}`);
    res.json(userHabits);
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

app.get('/api/habits/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const habit = habits.find(h => h.id === id && h.isActive);
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    res.json(habit);
  } catch (error) {
    console.error('Error fetching habit:', error);
    res.status(500).json({ error: 'Failed to fetch habit' });
  }
});

app.post('/api/habits', (req, res) => {
  try {
    const { name, category, frequency, goal, unit, reminderTime } = req.body;
    
    if (!name || !category || !frequency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newHabit = {
      id: habitIdCounter++,
      userId: 1,
      name,
      category,
      frequency,
      goal: goal || 1,
      unit: unit || 'times',
      reminderTime: reminderTime || null,
      streak: 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    habits.push(newHabit);
    console.log(`Created new habit: ${newHabit.name}`);
    res.status(201).json(newHabit);
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

app.patch('/api/habits/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const habitIndex = habits.findIndex(h => h.id === id);
    
    if (habitIndex === -1) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    // Only allow specific safe properties to be updated
    const allowedFields = ['name', 'category', 'frequency', 'goal', 'unit', 'reminderTime', 'streak'];
    const updates = {};
    
    for (const field of allowedFields) {
      if (req.body.hasOwnProperty(field)) {
        updates[field] = req.body[field];
      }
    }
    
    const updatedHabit = { ...habits[habitIndex], ...updates };
    habits[habitIndex] = updatedHabit;
    
    console.log(`Updated habit: ${updatedHabit.name}`);
    res.json(updatedHabit);
  } catch (error) {
    console.error('Error updating habit:', error);
    res.status(500).json({ error: 'Failed to update habit' });
  }
});

app.delete('/api/habits/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const habitIndex = habits.findIndex(h => h.id === id);
    
    if (habitIndex === -1) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    // Soft delete by setting isActive to false
    habits[habitIndex].isActive = false;
    console.log(`Deleted habit with id: ${id}`);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

// Coaching tips endpoint
app.get('/api/coaching-tips', (req, res) => {
  const tips = [
    {
      id: 1,
      userId: 1,
      tip: "Start small and build momentum. Even 5 minutes of exercise is better than none.",
      category: "motivation",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      userId: 1,
      tip: "Track your water intake to stay hydrated throughout the day.",
      category: "health",
      createdAt: new Date().toISOString()
    }
  ];
  res.json(tips);
});

// Serve static frontend files
app.use(express.static(join(__dirname, 'dist')));

// Catch-all handler for frontend routing
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // For frontend routes, serve index.html
  res.sendFile(join(__dirname, 'dist', 'index.html'), (err) => {
    if (err) {
      console.log('Frontend files not built yet, serving development message');
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>HabitFlow - Development</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .status { background: #e7f5e7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .endpoint { background: #f5f5f5; padding: 10px; margin: 5px 0; border-radius: 3px; }
          </style>
        </head>
        <body>
          <h1>🌟 HabitFlow Backend Server</h1>
          <div class="status">
            <strong>✅ Server Status:</strong> Running successfully on port 5000
          </div>
          
          <h2>Available API Endpoints:</h2>
          <div class="endpoint">GET /api/health - Health check</div>
          <div class="endpoint">GET /api/habits - Get all habits</div>
          <div class="endpoint">POST /api/habits - Create new habit</div>
          <div class="endpoint">GET /api/habits/:id - Get specific habit</div>
          <div class="endpoint">PATCH /api/habits/:id - Update habit</div>
          <div class="endpoint">DELETE /api/habits/:id - Delete habit</div>
          <div class="endpoint">GET /api/coaching-tips - Get coaching tips</div>
          
          <p><strong>Next steps:</strong> Frontend will be available once the build process completes.</p>
        </body>
        </html>
      `);
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 HabitFlow server running on http://${HOST}:${PORT}`);
  console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📝 Habits API: http://localhost:${PORT}/api/habits`);
  console.log(`⏰ Server started at: ${new Date().toISOString()}`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }
    console.log('Server closed successfully');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});