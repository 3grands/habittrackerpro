const fs = require('fs');

// Read the corrupted package.json as text
const packageText = fs.readFileSync('package.json', 'utf8');

// Fix the malformed JSON by replacing the broken build script section
const fixedText = packageText.replace(
  /"build": "scripts": \{\s*"build": "vite build"\s*\}\s*--platform=node --bundle --format=esm --outfile=dist\/server\.js"/,
  '"build": "vite build && cross-env SKIP_SERVER_START=true esbuild server/start.ts --platform=node --bundle --format=esm --outfile=dist/server.js"'
);

// Write the fixed package.json
fs.writeFileSync('package.json', fixedText);
console.log('✅ Fixed package.json JSON syntax');