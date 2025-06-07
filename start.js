import { execSync } from 'child_process';

try {
  console.log('Starting HabitFlow server...');
  execSync('NODE_ENV=development npx tsx server/index.ts', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
} catch (error) {
  console.error('Server startup failed:', error.message);
  process.exit(1);
}