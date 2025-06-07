import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

function killVite() {
  try {
    exec('pkill -f "vite" 2>/dev/null || true');
    exec('pkill -f "node.*vite" 2>/dev/null || true');
  } catch (e) {
    // Ignore
  }
}

function startServer() {
  // Kill any existing Vite processes
  killVite();
  
  // Start Express server with integrated Vite
  const server = spawn('tsx', ['server/index.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });

  server.on('error', (err) => {
    console.error('Express server error:', err);
    setTimeout(startServer, 2000); // Restart after 2 seconds
  });

  server.on('exit', (code) => {
    if (code !== 0) {
      console.log('Express server exited, restarting...');
      setTimeout(startServer, 1000);
    }
  });

  return server;
}

function monitor() {
  // Check every 5 seconds if Vite is running standalone
  setInterval(() => {
    exec('pgrep -f "vite" | grep -v tsx', (error, stdout) => {
      if (stdout.trim()) {
        console.log('Detected standalone Vite, killing and restarting Express server...');
        killVite();
      }
    });
  }, 5000);
}

// Start monitoring and server
monitor();
const server = startServer();

// Handle cleanup
process.on('SIGTERM', () => {
  server.kill();
  process.exit(0);
});

process.on('SIGINT', () => {
  server.kill();
  process.exit(0);
});