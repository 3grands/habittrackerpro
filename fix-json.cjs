const fs = require('fs');

try {
  console.log('Reading package.json...');
  let content = fs.readFileSync('package.json', 'utf8');
  
  console.log('Applying fix...');
  
  // Create a properly structured package.json
  const fixedJson = {
    "name": "rest-express",
    "version": "1.0.0",
    "type": "module",
    "license": "MIT",
    "scripts": {
      "dev": "vite",
      "build": "vite build && cross-env SKIP_SERVER_START=true esbuild server/start.ts --platform=node --bundle --format=esm --outfile=dist/server.js",
      "preview": "vite preview --port=$PORT",
      "start": "NODE_ENV=production node dist/index.js",
      "check": "tsc",
      "db:push": "drizzle-kit push"
    }
  };

  // Extract dependencies from the original (they should be intact)
  const lines = content.split('\n');
  let dependenciesStarted = false;
  let devDependenciesStarted = false;
  let optionalDependenciesStarted = false;
  let currentSection = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('"dependencies":')) {
      dependenciesStarted = true;
      currentSection = 'dependencies';
      fixedJson.dependencies = {};
      continue;
    }
    
    if (line.includes('"devDependencies":')) {
      devDependenciesStarted = true;
      currentSection = 'devDependencies';
      fixedJson.devDependencies = {};
      continue;
    }
    
    if (line.includes('"optionalDependencies":')) {
      optionalDependenciesStarted = true;
      currentSection = 'optionalDependencies';
      fixedJson.optionalDependencies = {};
      continue;
    }
    
    if ((dependenciesStarted || devDependenciesStarted || optionalDependenciesStarted) && line.includes(':')) {
      const match = line.match(/"([^"]+)":\s*"([^"]+)"/);
      if (match && currentSection) {
        fixedJson[currentSection][match[1]] = match[2];
      }
    }
    
    if (line === '}' && (dependenciesStarted || devDependenciesStarted || optionalDependenciesStarted)) {
      if (currentSection === 'dependencies') dependenciesStarted = false;
      if (currentSection === 'devDependencies') devDependenciesStarted = false;
      if (currentSection === 'optionalDependencies') optionalDependenciesStarted = false;
      currentSection = '';
    }
  }
  
  // Write the fixed JSON
  fs.writeFileSync('package.json', JSON.stringify(fixedJson, null, 2) + '\n', 'utf8');
  console.log('✅ Successfully fixed package.json');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}