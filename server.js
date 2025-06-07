import { spawn } from 'child_process';

// Start Express server in background
const server = spawn('tsx', ['server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  },
  detached: true
});

server.unref();

console.log('Express server started in background on port 5000');

// Keep process alive
setInterval(() => {
  // Check if server is still running
  try {
    fetch('http://localhost:5000/api/habits')
      .then(() => console.log('Backend healthy'))
      .catch(() => console.log('Backend check failed'));
  } catch (e) {
    // Ignore errors
  }
}, 30000);