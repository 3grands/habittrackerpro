import express from "express";
import { storage } from "./server/storage.ts";

const app = express();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    server: 'HabitFlow API'
  });
});

// Habits API
app.get('/api/habits', async (req, res) => {
  try {
    console.log('Fetching habits for user 1...');
    const habits = await storage.getHabits(1);
    console.log(`Found ${habits.length} habits`);
    res.json(habits);
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: 'Failed to fetch habits', details: error.message });
  }
});

app.post('/api/habits', async (req, res) => {
  try {
    console.log('Creating new habit:', req.body);
    const habitData = { 
      ...req.body, 
      userId: 1,
      isActive: true,
      streak: 0,
      createdAt: new Date().toISOString()
    };
    const habit = await storage.createHabit(habitData);
    console.log('Created habit:', habit);
    res.status(201).json(habit);
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: 'Failed to create habit', details: error.message });
  }
});

app.get('/api/habits/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid habit ID' });
    }
    
    const habit = await storage.getHabit(id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json(habit);
  } catch (error) {
    console.error('Error fetching habit:', error);
    res.status(500).json({ error: 'Failed to fetch habit', details: error.message });
  }
});

app.patch('/api/habits/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid habit ID' });
    }
    
    const habit = await storage.updateHabit(id, req.body);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json(habit);
  } catch (error) {
    console.error('Error updating habit:', error);
    res.status(500).json({ error: 'Failed to update habit', details: error.message });
  }
});

app.delete('/api/habits/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid habit ID' });
    }
    
    const success = await storage.deleteHabit(id);
    if (!success) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json({ success: true, message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ error: 'Failed to delete habit', details: error.message });
  }
});

// Habit completions
app.get('/api/habits/:id/completions', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    if (isNaN(habitId)) {
      return res.status(400).json({ error: 'Invalid habit ID' });
    }
    
    const completions = await storage.getHabitCompletions(habitId);
    res.json(completions);
  } catch (error) {
    console.error('Error fetching completions:', error);
    res.status(500).json({ error: 'Failed to fetch completions', details: error.message });
  }
});

app.post('/api/habits/:id/completions', async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    if (isNaN(habitId)) {
      return res.status(400).json({ error: 'Invalid habit ID' });
    }
    
    const completionData = {
      habitId,
      date: req.body.date || new Date().toISOString().split('T')[0],
      value: req.body.value || 1,
      notes: req.body.notes || '',
      completedAt: new Date().toISOString()
    };
    
    const completion = await storage.createHabitCompletion(completionData);
    res.status(201).json(completion);
  } catch (error) {
    console.error('Error creating completion:', error);
    res.status(500).json({ error: 'Failed to create completion', details: error.message });
  }
});

// Mood tracking
app.get('/api/mood', async (req, res) => {
  try {
    const entries = await storage.getMoodEntries(1);
    res.json(entries);
  } catch (error) {
    console.error('Error fetching mood entries:', error);
    res.status(500).json({ error: 'Failed to fetch mood entries', details: error.message });
  }
});

app.post('/api/mood', async (req, res) => {
  try {
    const entryData = {
      ...req.body,
      userId: 1,
      date: req.body.date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    const entry = await storage.createMoodEntry(entryData);
    res.status(201).json(entry);
  } catch (error) {
    console.error('Error creating mood entry:', error);
    res.status(500).json({ error: 'Failed to create mood entry', details: error.message });
  }
});

// Coaching tips
app.get('/api/coaching', async (req, res) => {
  try {
    const tips = await storage.getCoachingTips(1);
    res.json(tips);
  } catch (error) {
    console.error('Error fetching coaching tips:', error);
    res.status(500).json({ error: 'Failed to fetch coaching tips', details: error.message });
  }
});

// Chat messages
app.get('/api/chat', async (req, res) => {
  try {
    const messages = await storage.getChatMessages(1);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages', details: error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const messageData = {
      ...req.body,
      userId: 1,
      timestamp: new Date().toISOString()
    };
    const message = await storage.createChatMessage(messageData);
    res.status(201).json(message);
  } catch (error) {
    console.error('Error creating chat message:', error);
    res.status(500).json({ error: 'Failed to create chat message', details: error.message });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 HabitFlow API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 Habits API: http://localhost:${PORT}/api/habits`);
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

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});