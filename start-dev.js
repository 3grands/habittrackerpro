#!/usr/bin/env node

import { execSync } from 'child_process';

try {
  execSync('tsx server/index.ts', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });
} catch (error) {
  process.exit(1);
}