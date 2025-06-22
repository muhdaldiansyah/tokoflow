// verify-imports.js
// This script helps verify that all import paths are correct

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying import paths in (public) directory...\n');

const publicDir = path.join(__dirname, 'app', '(public)');

function checkImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.relative(__dirname, filePath);
  
  // Check for incorrect import patterns
  const incorrectPatterns = [
    { pattern: /from ['"]\.\.\/components\//g, correct: '../../components/' },
    { pattern: /from ['"]\.\.\/page_data['"]/g, correct: '../../page_data' }
  ];
  
  let hasIssues = false;
  incorrectPatterns.forEach(({ pattern, correct }) => {
    const matches = content.match(pattern);
    if (matches) {
      console.log(`❌ ${fileName}`);
      console.log(`   Found: ${matches[0]}`);
      console.log(`   Should be: from '${correct}...'`);
      hasIssues = true;
    }
  });
  
  if (!hasIssues && (content.includes('../../components/') || content.includes('../../page_data'))) {
    console.log(`✅ ${fileName} - imports look correct`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && file !== 'node_modules') {
      walkDir(filePath);
    } else if (file.endsWith('.js') && file.includes('Client')) {
      checkImports(filePath);
    }
  });
}

try {
  walkDir(publicDir);
  console.log('\n✨ Import verification complete!');
} catch (error) {
  console.error('Error during verification:', error);
}
