import fs from 'fs';
import path from 'path';

// Create dist directory
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Generate the static HTML with embedded HabitFlow interface
const staticHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HabitFlow - Smart Habit Tracking</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; }
    .container { max-width: 400px; margin: 0 auto; background: white; min-height: 100vh; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; }
    .user-info { display: flex; justify-content: space-between; align-items: center; }
    .avatar { width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
    .streak { text-align: right; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px; text-align: center; }
    .stat-item { background: #f1f5f9; padding: 15px; border-radius: 12px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1e293b; }
    .stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }
    .habits-section { padding: 20px; }
    .section-title { font-size: 18px; font-weight: bold; margin-bottom: 16px; color: #1e293b; }
    .habit-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .habit-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .habit-name { font-weight: 600; color: #1e293b; }
    .habit-meta { display: flex; gap: 8px; font-size: 12px; color: #64748b; }
    .badge { background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; }
    .streak-badge { background: #dcfce7; color: #166534; }
    .toggle-btn { background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
    .toggle-btn:hover { background: #059669; }
    .toggle-btn.completed { background: #6b7280; }
    .add-habit-btn { position: fixed; bottom: 20px; right: 20px; background: #667eea; color: white; border: none; width: 56px; height: 56px; border-radius: 50%; font-size: 24px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; }
    .modal-content { background: white; padding: 24px; border-radius: 12px; width: 90%; max-width: 400px; }
    .form-group { margin-bottom: 16px; }
    .form-label { display: block; margin-bottom: 4px; font-weight: 500; }
    .form-input, .form-select { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; }
    .btn-primary { background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-right: 8px; }
    .btn-secondary { background: #f3f4f6; color: #374151; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="user-info">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="avatar">S</div>
          <div>
            <div style="font-size: 14px; opacity: 0.9;">Good morning</div>
            <div style="font-weight: bold;">Sarah</div>
          </div>
        </div>
        <div class="streak">
          <div style="font-size: 12px; opacity: 0.9;">Current Streak</div>
          <div style="font-size: 20px; font-weight: bold;" id="total-streak">22 days</div>
        </div>
      </div>
    </header>

    <div class="stats">
      <div class="stat-item">
        <div class="stat-value" id="streak-stat">22</div>
        <div class="stat-label">Total Days</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" id="completion-stat">0%</div>
        <div class="stat-label">Completion</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" id="habits-stat">6</div>
        <div class="stat-label">Active Habits</div>
      </div>
    </div>

    <div class="habits-section">
      <h2 class="section-title">Today's Habits</h2>
      <div id="habits-list">
        <div class="habit-card">
          <div class="habit-header">
            <div class="habit-name">Morning Exercise</div>
            <button class="toggle-btn" onclick="toggleHabit(1)">Mark Done</button>
          </div>
          <div class="habit-meta">
            <span class="badge">health</span>
            <span class="badge">daily</span>
            <span class="badge streak-badge">5 day streak</span>
          </div>
        </div>
        <div class="habit-card">
          <div class="habit-header">
            <div class="habit-name">Drink 8 glasses of water</div>
            <button class="toggle-btn" onclick="toggleHabit(2)">Mark Done</button>
          </div>
          <div class="habit-meta">
            <span class="badge">health</span>
            <span class="badge">daily</span>
            <span class="badge streak-badge">3 day streak</span>
          </div>
        </div>
        <div class="habit-card">
          <div class="habit-header">
            <div class="habit-name">10-minute meditation</div>
            <button class="toggle-btn" onclick="toggleHabit(3)">Mark Done</button>
          </div>
          <div class="habit-meta">
            <span class="badge">mindfulness</span>
            <span class="badge">daily</span>
            <span class="badge streak-badge">7 day streak</span>
          </div>
        </div>
        <div class="habit-card">
          <div class="habit-header">
            <div class="habit-name">Read for 30 minutes</div>
            <button class="toggle-btn" onclick="toggleHabit(4)">Mark Done</button>
          </div>
          <div class="habit-meta">
            <span class="badge">learning</span>
            <span class="badge">daily</span>
            <span class="badge streak-badge">2 day streak</span>
          </div>
        </div>
        <div class="habit-card">
          <div class="habit-header">
            <div class="habit-name">50 push-ups</div>
            <button class="toggle-btn" onclick="toggleHabit(5)">Mark Done</button>
          </div>
          <div class="habit-meta">
            <span class="badge">fitness</span>
            <span class="badge">daily</span>
            <span class="badge streak-badge">1 day streak</span>
          </div>
        </div>
        <div class="habit-card">
          <div class="habit-header">
            <div class="habit-name">Write in gratitude journal</div>
            <button class="toggle-btn" onclick="toggleHabit(6)">Mark Done</button>
          </div>
          <div class="habit-meta">
            <span class="badge">mindfulness</span>
            <span class="badge">daily</span>
            <span class="badge streak-badge">4 day streak</span>
          </div>
        </div>
      </div>
    </div>

    <button class="add-habit-btn" onclick="openAddModal()">+</button>
  </div>

  <!-- Add Habit Modal -->
  <div id="add-modal" class="modal">
    <div class="modal-content">
      <h3 style="margin-bottom: 16px;">Add New Habit</h3>
      <form id="habit-form">
        <div class="form-group">
          <label class="form-label">Habit Name</label>
          <input type="text" id="habit-name" class="form-input" placeholder="e.g., Morning Exercise" required>
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select id="habit-category" class="form-select" required>
            <option value="">Select category</option>
            <option value="health">Health</option>
            <option value="fitness">Fitness</option>
            <option value="mindfulness">Mindfulness</option>
            <option value="learning">Learning</option>
            <option value="productivity">Productivity</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Frequency</label>
          <select id="habit-frequency" class="form-select" required>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 20px;">
          <button type="submit" class="btn-primary">Add Habit</button>
          <button type="button" class="btn-secondary" onclick="closeAddModal()">Cancel</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    let habits = [
      { id: 1, name: "Morning Exercise", category: "health", frequency: "daily", streak: 5, isCompletedToday: false },
      { id: 2, name: "Drink 8 glasses of water", category: "health", frequency: "daily", streak: 3, isCompletedToday: false },
      { id: 3, name: "10-minute meditation", category: "mindfulness", frequency: "daily", streak: 7, isCompletedToday: false },
      { id: 4, name: "Read for 30 minutes", category: "learning", frequency: "daily", streak: 2, isCompletedToday: false },
      { id: 5, name: "50 push-ups", category: "fitness", frequency: "daily", streak: 1, isCompletedToday: false },
      { id: 6, name: "Write in gratitude journal", category: "mindfulness", frequency: "daily", streak: 4, isCompletedToday: false }
    ];

    function renderHabits() {
      const container = document.getElementById('habits-list');
      container.innerHTML = habits.map(habit => 
        '<div class="habit-card">' +
          '<div class="habit-header">' +
            '<div class="habit-name">' + habit.name + '</div>' +
            '<button class="toggle-btn ' + (habit.isCompletedToday ? 'completed' : '') + '" ' +
                    'onclick="toggleHabit(' + habit.id + ')">' +
              (habit.isCompletedToday ? 'Done' : 'Mark Done') +
            '</button>' +
          '</div>' +
          '<div class="habit-meta">' +
            '<span class="badge">' + habit.category + '</span>' +
            '<span class="badge">' + habit.frequency + '</span>' +
            '<span class="badge streak-badge">' + habit.streak + ' day streak</span>' +
          '</div>' +
        '</div>'
      ).join('');
    }

    function toggleHabit(habitId) {
      const habit = habits.find(h => h.id === habitId);
      if (habit) {
        habit.isCompletedToday = !habit.isCompletedToday;
        if (habit.isCompletedToday) {
          habit.streak += 1;
        }
        renderHabits();
        updateStats();
      }
    }

    function updateStats() {
      const completedToday = habits.filter(h => h.isCompletedToday).length;
      const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);
      const completionRate = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0;
      
      document.getElementById('streak-stat').textContent = totalStreak;
      document.getElementById('completion-stat').textContent = completionRate + '%';
      document.getElementById('habits-stat').textContent = habits.length;
      document.getElementById('total-streak').textContent = totalStreak + ' days';
    }

    function openAddModal() {
      document.getElementById('add-modal').style.display = 'flex';
    }

    function closeAddModal() {
      document.getElementById('add-modal').style.display = 'none';
      document.getElementById('habit-form').reset();
    }

    document.getElementById('habit-form').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = {
        name: document.getElementById('habit-name').value,
        category: document.getElementById('habit-category').value,
        frequency: document.getElementById('habit-frequency').value
      };

      if (formData.name && formData.category && formData.frequency) {
        const newHabit = {
          id: habits.length + 1,
          name: formData.name,
          category: formData.category,
          frequency: formData.frequency,
          streak: 0,
          isCompletedToday: false
        };
        
        habits.push(newHabit);
        closeAddModal();
        renderHabits();
        updateStats();
      }
    });

    // Initialize app
    renderHabits();
    updateStats();
  </script>
</body>
</html>`;

// Write the static HTML file
fs.writeFileSync('dist/index.html', staticHTML);
console.log('Static build created successfully in dist/index.html');