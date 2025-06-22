// prebuild.js
// This script runs before the build to ensure a clean environment

const fs = require('fs');
const path = require('path');

console.log('🧹 Preparing for build...\n');

// 1. Remove .next directory if it exists
const nextDir = path.join(__dirname, '.next');
if (fs.existsSync(nextDir)) {
  console.log('📁 Removing .next directory...');
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('✅ .next directory removed');
}

// 2. Remove node_modules/.cache if it exists
const cacheDir = path.join(__dirname, 'node_modules', '.cache');
if (fs.existsSync(cacheDir)) {
  console.log('📁 Removing node_modules/.cache...');
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log('✅ Cache cleared');
}

// 3. Create required directories
const requiredDirs = [
  'public/images',
  'public/portfolio'
];

requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`📁 Creating ${dir} directory...`);
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ ${dir} directory created`);
  }
});

console.log('\n✨ Build preparation complete!');
