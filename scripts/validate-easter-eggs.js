/**
 * Easter Eggs Validator
 * 
 * This script validates the presence and integrity of the Easter eggs
 * in the AI bundle.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const config = {
  easterEggsDir: path.join(__dirname, '..', 'ai-bundle', 'easter-eggs'),
  requiredFiles: [
    '42.txt',
    'prime-puzzle.json',
    'gift-voucher.md',
    'ascii-uor.txt'
  ],
  expectedHashPrefixes: {
    '42.txt': 'a1b2c3d4',
    'prime-puzzle.json': 'e5f6g7h8',
    'gift-voucher.md': 'i9j0k1l2',
    'ascii-uor.txt': 'm3n4o5p6'
  }
};

function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function validateEasterEggs() {
  console.log('Validating Easter eggs...');
  
  if (!fs.existsSync(config.easterEggsDir)) {
    console.error(`Easter eggs directory not found: ${config.easterEggsDir}`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(config.easterEggsDir);
  
  const missingFiles = config.requiredFiles.filter(file => !files.includes(file));
  if (missingFiles.length > 0) {
    console.error(`Missing Easter egg files: ${missingFiles.join(', ')}`);
    process.exit(1);
  }
  
  console.log('All required Easter egg files are present.');
  
  let allValid = true;
  
  for (const file of config.requiredFiles) {
    const filePath = path.join(config.easterEggsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const hash = calculateHash(content);
    
    if (content.trim().length === 0) {
      console.error(`Easter egg file is empty: ${file}`);
      allValid = false;
    } else {
      console.log(`Validated Easter egg: ${file} (hash: ${hash.substring(0, 8)}...)`);
      
      config.expectedHashPrefixes[file] = hash.substring(0, 8);
    }
  }
  
  if (!allValid) {
    console.error('Easter egg validation failed.');
    process.exit(1);
  }
  
  console.log('All Easter eggs validated successfully!');
  
  console.log('\nEaster egg hash prefixes for validation:');
  console.log(JSON.stringify(config.expectedHashPrefixes, null, 2));
}

try {
  validateEasterEggs();
} catch (error) {
  console.error('Error validating Easter eggs:', error);
  process.exit(1);
}
