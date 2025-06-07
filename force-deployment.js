import fs from 'fs';
import { execSync } from 'child_process';

// Force a complete rebuild to bypass deployment cache
const timestamp = Date.now();

// Create a versioned index file
const indexContent = fs.readFileSync('dist/index.html', 'utf8');
const versionedContent = indexContent.replace(
  '<title>HabitFlow - Smart Habit Tracking</title>',
  `<title>HabitFlow - Smart Habit Tracking</title>
  <meta name="version" content="${timestamp}">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">`
);

fs.writeFileSync('dist/index.html', versionedContent);

// Create a cache-busting manifest
fs.writeFileSync('dist/manifest.json', JSON.stringify({
  name: "HabitFlow",
  version: timestamp,
  buildTime: new Date().toISOString()
}));

console.log(`Deployment build updated with version ${timestamp}`);