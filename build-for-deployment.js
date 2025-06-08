import fs from 'fs';

// Create a clean build without server conflicts
console.log('Creating deployment build...');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Copy our working static files
if (fs.existsSync('dist/index.html')) {
  console.log('Using existing static build');
} else {
  console.log('Creating new static build...');
  // Run our static build generator
  await import('./create-static-build.js');
}

// Create additional deployment files
const packageInfo = {
  name: "habitflow",
  version: "1.0.0",
  main: "index.html",
  type: "static"
};

fs.writeFileSync('dist/package.json', JSON.stringify(packageInfo, null, 2));

// Create a simple server fallback for dynamic deployment
const serverFallback = `
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static('.'));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('HabitFlow deployed on port', PORT);
});
`;

fs.writeFileSync('dist/server.js', serverFallback);

console.log('Deployment build completed successfully');
console.log('Files created:', fs.readdirSync('dist'));