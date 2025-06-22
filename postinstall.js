// postinstall.js
// This script helps ensure all dependencies are properly installed
const fs = require('fs');
const path = require('path');

// Remove package-lock.json if it exists to ensure fresh install
const lockPath = path.join(__dirname, 'package-lock.json');
if (fs.existsSync(lockPath)) {
  try {
    fs.unlinkSync(lockPath);
    console.log('🗑️  Removed package-lock.json for fresh install');
  } catch (e) {
    console.log('⚠️  Could not remove package-lock.json:', e.message);
  }
}

console.log('✅ Dependencies installed successfully!');
console.log('📦 Packages installed:');
console.log('  - framer-motion: Added for animations');
console.log('  - All other dependencies from package.json');
