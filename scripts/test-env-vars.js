#!/usr/bin/env node

/**
 * Environment Variables Test Script
 * 
 * This script tests if environment variables are being loaded properly
 */

console.log('🔍 Testing Environment Variables...\n');

// Test all Paymob-related environment variables
const envVars = [
  'PAYMOB_API_KEY',
  'PAYMOB_INTEGRATION_ID', 
  'PAYMOB_BASE_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXTAUTH_URL'
];

console.log('📋 Environment Variables Status:');
console.log('================================');

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: Set (${value.length} characters)`);
    if (varName === 'PAYMOB_API_KEY') {
      console.log(`   Preview: ${value.substring(0, 20)}...`);
    }
  } else {
    console.log(`❌ ${varName}: Not Set`);
  }
});

console.log('\n🔍 All Environment Variables:');
console.log('============================');
Object.keys(process.env).forEach(key => {
  if (key.includes('PAYMOB') || key.includes('NEXT') || key.includes('NEXTAUTH')) {
    const value = process.env[key];
    console.log(`${key}: ${value ? 'Set' : 'Not Set'}`);
  }
});

console.log('\n🔍 Node.js Environment Info:');
console.log('===========================');
console.log(`Node.js version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Current working directory: ${process.cwd()}`);

// Test if we can read the .env.local file directly
const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(process.cwd(), '.env.local');

if (fs.existsSync(envLocalPath)) {
  console.log('\n✅ .env.local file exists');
  const stats = fs.statSync(envLocalPath);
  console.log(`   Size: ${stats.size} bytes`);
  console.log(`   Modified: ${stats.mtime}`);
  
  // Read first few lines to check format
  const content = fs.readFileSync(envLocalPath, 'utf8');
  const lines = content.split('\n').slice(0, 5);
  console.log('\n📋 First 5 lines of .env.local:');
  lines.forEach((line, index) => {
    console.log(`   ${index + 1}: ${line.trim()}`);
  });
} else {
  console.log('\n❌ .env.local file does not exist');
} 