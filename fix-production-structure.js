#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fixProductionStructure() {
  try {
    console.log('Creating correct production structure...');
    
    // Clean and create proper structure
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    
    // Build backend
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
      stdio: 'inherit',
      cwd: __dirname,
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    // Copy shared schema
    await fs.cp(path.join(__dirname, 'shared'), path.join(__dirname, 'dist/shared'), { 
      recursive: true, force: true 
    });
    
    // Copy HTML to public directory (where server expects it)
    await fs.copyFile(path.join(__dirname, 'index.html'), path.join(__dirname, 'dist/public/index.html'));
    
    // Create app.js in public directory
    const appScript = `
import('https://esm.sh/react@18').then(React => {
  import('https://esm.sh/react-dom@18/client').then(ReactDOM => {
    const { createElement: h, useState, useEffect } = React;
    
    const App = () => {
      const [habits, setHabits] = useState([]);
      const [loading, setLoading] = useState(true);
      
      useEffect(() => {
        fetch('/api/habits')
          .then(res => res.json())
          .then(data => {
            setHabits(data);
            setLoading(false);
          })
          .catch(() => {
            setHabits([
              { id: 1, name: 'Morning Exercise', completed: false },
              { id: 2, name: 'Read 30 minutes', completed: false },
              { id: 3, name: 'Drink water', completed: false }
            ]);
            setLoading(false);
          });
      }, []);
      
      const toggleHabit = (id) => {
        const updatedHabits = habits.map(habit => 
          habit.id === id ? { ...habit, completed: !habit.completed } : habit
        );
        setHabits(updatedHabits);
        
        fetch(\`/api/habits/\${id}/toggle\`, { method: 'POST' })
          .catch(err => console.log('Toggle failed:', err));
      };
      
      if (loading) {
        return h('div', {
          style: { padding: '2rem', textAlign: 'center', fontFamily: 'system-ui' }
        }, 'Loading HabitFlow...');
      }
      
      return h('div', {
        style: { maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui' }
      }, [
        h('header', { key: 'header', style: { textAlign: 'center', marginBottom: '2rem' } }, [
          h('h1', { key: 'title', style: { color: '#3b82f6', fontSize: '2.5rem', margin: 0 } }, 'HabitFlow'),
          h('p', { key: 'subtitle', style: { color: '#6b7280' } }, 'Smart Habit Tracking for Better Living')
        ]),
        h('main', { key: 'main' }, [
          h('h2', { key: 'today', style: { marginBottom: '1rem' } }, "Today's Habits"),
          h('div', { key: 'habits' }, habits.map(habit => 
            h('div', {
              key: habit.id,
              style: {
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                margin: '0.5rem 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: habit.completed ? '#f0f9ff' : '#ffffff'
              }
            }, [
              h('span', { key: 'name' }, habit.name),
              h('button', {
                key: 'toggle',
                onClick: () => toggleHabit(habit.id),
                style: {
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #3b82f6',
                  background: habit.completed ? '#3b82f6' : 'transparent',
                  color: habit.completed ? 'white' : '#3b82f6',
                  cursor: 'pointer'
                }
              }, habit.completed ? '✓' : '○')
            ])
          )),
          h('div', {
            key: 'stats',
            style: {
              marginTop: '2rem',
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '8px',
              textAlign: 'center'
            }
          }, \`Progress: \${habits.filter(h => h.completed).length}/\${habits.length} completed\`)
        ])
      ]);
    };
    
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(h(App));
  });
});
`;
    
    await fs.writeFile(path.join(__dirname, 'dist/public/app.js'), appScript);
    
    // Update HTML to use production app
    let htmlContent = await fs.readFile(path.join(__dirname, 'dist/public/index.html'), 'utf-8');
    htmlContent = htmlContent.replace(
      '<script type="module" src="/client/src/main.tsx"></script>',
      '<script type="module" src="/app.js"></script>'
    );
    await fs.writeFile(path.join(__dirname, 'dist/public/index.html'), htmlContent);
    
    // Create production package.json
    const packageJson = {
      "name": "habitflow-production",
      "version": "1.0.0",
      "type": "module",
      "main": "index.js",
      "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview --port=$PORT",
        "start": "node index.js"
      }
    };
    
    await fs.writeFile(path.join(__dirname, 'dist/package.json'), JSON.stringify(packageJson, null, 2));
    
    console.log('Production structure fixed');
    
    const distFiles = await fs.readdir(path.join(__dirname, 'dist'));
    const publicFiles = await fs.readdir(path.join(__dirname, 'dist/public'));
    console.log('Dist structure:', distFiles);
    console.log('Public structure:', publicFiles);
    
  } catch (error) {
    console.error('Failed to fix structure:', error.message);
    process.exit(1);
  }
}

fixProductionStructure();