#!/usr/bin/env node

/**
 * WordPress OAuth Setup Script
 * 
 * This script helps configure WordPress.com OAuth for Snowball.
 * Run this script to set up the required environment variables.
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '.env');

console.log('🔧 WordPress OAuth Setup for Snowball');
console.log('=====================================\n');

// Check if .env file exists
if (!fs.existsSync(ENV_FILE)) {
  console.error('❌ .env file not found!');
  console.log('Please create a .env file in the backend directory first.');
  process.exit(1);
}

// Read current .env file
let envContent = fs.readFileSync(ENV_FILE, 'utf8');

console.log('📋 Current WordPress OAuth Configuration:');
console.log('=========================================');

// Check current WordPress OAuth variables
const wordpressVars = [
  'WORDPRESS_CLIENT_ID',
  'WORDPRESS_CLIENT_SECRET', 
  'WORDPRESS_REDIRECT_URI'
];

let missingVars = [];

wordpressVars.forEach(varName => {
  const regex = new RegExp(`^${varName}=(.*)$`, 'm');
  const match = envContent.match(regex);
  
  if (match && match[1] && match[1] !== 'your_wordpress_client_id_here' && match[1] !== 'your_wordpress_client_secret_here' && match[1] !== 'your_wordpress_redirect_uri_here') {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    missingVars.push(varName);
  }
});

// Check FRONTEND_URL
const frontendUrlRegex = /^FRONTEND_URL=(.*)$/m;
const frontendUrlMatch = envContent.match(frontendUrlRegex);

if (frontendUrlMatch && frontendUrlMatch[1]) {
  console.log(`✅ FRONTEND_URL: ${frontendUrlMatch[1]}`);
} else {
  console.log(`❌ FRONTEND_URL: NOT SET`);
  missingVars.push('FRONTEND_URL');
}

console.log('\n📝 Setup Instructions:');
console.log('======================');

if (missingVars.length === 0) {
  console.log('✅ All WordPress OAuth variables are configured!');
  console.log('You can now use WordPress OAuth in your application.');
} else {
  console.log('❌ Missing WordPress OAuth configuration.');
  console.log('\nTo fix this issue:');
  console.log('');
  console.log('1. 🌐 Create a WordPress.com OAuth Application:');
  console.log('   - Go to: https://developer.wordpress.com/apps/');
  console.log('   - Click "Create New Application"');
  console.log('   - Fill in application details:');
  console.log('     • Name: Snowball Content Publisher');
  console.log('     • Description: AI-powered content publishing platform');
  console.log('     • Website URL: http://localhost:5000');
  console.log('     • Redirect URLs: http://localhost:5000/api/v1/wordpress-oauth/callback');
  console.log('   - Click "Create Application"');
  console.log('   - Copy the Client ID and Client Secret');
  console.log('');
  console.log('2. 📝 Update your .env file with the following variables:');
  console.log('');
  
  if (missingVars.includes('WORDPRESS_CLIENT_ID')) {
    console.log('   WORDPRESS_CLIENT_ID=your_client_id_from_step_1');
  }
  if (missingVars.includes('WORDPRESS_CLIENT_SECRET')) {
    console.log('   WORDPRESS_CLIENT_SECRET=your_client_secret_from_step_1');
  }
  if (missingVars.includes('WORDPRESS_REDIRECT_URI')) {
    console.log('   WORDPRESS_REDIRECT_URI=http://localhost:5000/api/v1/wordpress-oauth/callback');
  }
  if (missingVars.includes('FRONTEND_URL')) {
    console.log('   FRONTEND_URL=http://localhost:5174');
  }
  
  console.log('');
  console.log('3. 🔄 Restart your backend server');
  console.log('');
  console.log('4. 🧪 Test the WordPress connection in your frontend');
}

console.log('\n💡 Additional Notes:');
console.log('===================');
console.log('• The redirect URI must match exactly what you set in WordPress.com');
console.log('• Make sure your backend server is running on port 5000');
console.log('• Make sure your frontend server is running on port 5174');
console.log('• Keep your Client Secret secure and never commit it to version control');
console.log('');
console.log('🔗 For more help, see: backend/WORDPRESS_SETUP.md');
