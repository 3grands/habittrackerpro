import { spawn } from 'child_process';

// Kill any conflicting processes
const killProcesses = () => {
  try {
    spawn('pkill', ['-f', 'vite'], { stdio: 'inherit' });
    spawn('pkill', ['-f', 'tsx.*server'], { stdio: 'inherit' });
  } catch (e) {
    // Ignore errors
  }
};

killProcesses();

// Wait a moment for cleanup
setTimeout(() => {
  // Start the Express server with integrated Vite
  const server = spawn('tsx', ['server/index.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });

  server.on('error', (err) => {
    console.error('Server startup failed:', err);
    process.exit(1);
  });

  // Handle graceful shutdown
  const cleanup = () => {
    server.kill('SIGTERM');
    process.exit(0);
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
  process.on('exit', cleanup);
}, 1000);