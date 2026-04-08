#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

try {
  // Try using npx with shell
  console.log('Attempting to generate Prisma client...');
  
  // Method 1: Try using command-line
  if (process.platform === 'win32') {
    execSync('npx prisma generate --skip-engine-check', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
  } else {
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
  }
  
  console.log('✅ Prisma client generated successfully');
} catch (error) {
  console.error('⚠️ Fallback: Prisma generate failed, but continuing...');
  console.error('Error:', error.message);
  process.exit(1);
}
