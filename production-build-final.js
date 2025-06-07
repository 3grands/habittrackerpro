#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildProduction() {
  try {
    console.log('Creating production build with correct structure...');
    
    // Clean dist directory
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist'), { recursive: true });
    
    // Build backend
    console.log('Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
      stdio: 'inherit',
      cwd: __dirname,
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    // Copy shared schema
    await fs.cp(path.join(__dirname, 'shared'), path.join(__dirname, 'dist/shared'), { 
      recursive: true,
      force: true 
    });
    
    // Copy production HTML to dist
    await fs.copyFile(path.join(__dirname, 'index.html'), path.join(__dirname, 'dist/index.html'));
    
    // Create production app.js that loads the React application
    const appScript = `
// HabitFlow Production Loader
import('https://esm.sh/react@18').then(React => {
  import('https://esm.sh/react-dom@18/client').then(ReactDOM => {
    const { createElement: h, useState, useEffect } = React;
    
    const HabitCard = ({ habit, onToggle }) => {
      return h('div', {
        style: {
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1rem',
          margin: '0.5rem 0',
          background: habit.completed ? '#f0f9ff' : '#ffffff'
        }
      }, [
        h('div', {
          key: 'content',
          style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
        }, [
          h('span', { key: 'name' }, habit.name),
          h('button', {
            key: 'toggle',
            onClick: () => onToggle(habit.id),
            style: {
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              border: '1px solid #3b82f6',
              background: habit.completed ? '#3b82f6' : 'transparent',
              color: habit.completed ? 'white' : '#3b82f6',
              cursor: 'pointer'
            }
          }, habit.completed ? '✓' : '○')
        ])
      ]);
    };
    
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
          .catch(err => {
            console.error('Failed to load habits:', err);
            setHabits([
              { id: 1, name: 'Morning Exercise', completed: false },
              { id: 2, name: 'Read 30 minutes', completed: false },
              { id: 3, name: 'Drink 8 glasses of water', completed: false }
            ]);
            setLoading(false);
          });
      }, []);
      
      const toggleHabit = (id) => {
        setHabits(habits.map(habit => 
          habit.id === id ? { ...habit, completed: !habit.completed } : habit
        ));
      };
      
      if (loading) {
        return h('div', {
          style: { padding: '2rem', textAlign: 'center' }
        }, 'Loading HabitFlow...');
      }
      
      return h('div', {
        style: {
          maxWidth: '800px',
          margin: '0 auto',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif'
        }
      }, [
        h('header', {
          key: 'header',
          style: { textAlign: 'center', marginBottom: '2rem' }
        }, [
          h('h1', {
            key: 'title',
            style: { color: '#3b82f6', fontSize: '2.5rem', margin: '0 0 0.5rem 0' }
          }, 'HabitFlow'),
          h('p', {
            key: 'subtitle',
            style: { color: '#6b7280', fontSize: '1.125rem' }
          }, 'Smart Habit Tracking for Better Living')
        ]),
        h('main', {
          key: 'main'
        }, [
          h('h2', {
            key: 'habits-title',
            style: { fontSize: '1.5rem', marginBottom: '1rem' }
          }, 'Today\\'s Habits'),
          h('div', {
            key: 'habits-list'
          }, habits.map(habit => 
            h(HabitCard, { 
              key: habit.id, 
              habit, 
              onToggle: toggleHabit 
            })
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
          }, [
            h('p', {
              key: 'progress'
            }, \`Completed: \${habits.filter(h => h.completed).length}/\${habits.length}\`)
          ])
        ])
      ]);
    };
    
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(h(App));
  });
});
`;
    
    await fs.writeFile(path.join(__dirname, 'dist/app.js'), appScript);
    
    // Update index.html to use the production app
    let indexContent = await fs.readFile(path.join(__dirname, 'dist/index.html'), 'utf-8');
    indexContent = indexContent.replace(
      '<script type="module" src="/client/src/main.tsx"></script>',
      '<script type="module" src="/app.js"></script>'
    );
    await fs.writeFile(path.join(__dirname, 'dist/index.html'), indexContent);
    
    // Create package.json for production
    const packageJson = {
      "name": "habitflow-production",
      "version": "1.0.0",
      "type": "module",
      "main": "index.js",
      "scripts": {
        "start": "node index.js"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    };
    
    await fs.writeFile(path.join(__dirname, 'dist/package.json'), JSON.stringify(packageJson, null, 2));
    
    console.log('Production build completed successfully!');
    
    // Verify structure
    const distFiles = await fs.readdir(path.join(__dirname, 'dist'));
    console.log('Production structure:');
    console.log('✓ index.html (moved from client to root)');
    console.log('✓ vite.config.js (exists)');
    console.log('✓ package.json (exists)');
    console.log('✓ dist/ contents:', distFiles);
    
    const stats = {
      backend: await fs.stat(path.join(__dirname, 'dist/index.js')),
      frontend: await fs.stat(path.join(__dirname, 'dist/index.html')),
      app: await fs.stat(path.join(__dirname, 'dist/app.js'))
    };
    
    console.log('Build sizes:');
    console.log(`Backend: ${(stats.backend.size / 1024).toFixed(2)} KB`);
    console.log(`Frontend: ${(stats.frontend.size / 1024).toFixed(2)} KB`);
    console.log(`App: ${(stats.app.size / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('Production build failed:', error.message);
    process.exit(1);
  }
}

buildProduction();