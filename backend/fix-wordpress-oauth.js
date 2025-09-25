#!/usr/bin/env node

/**
 * WordPress OAuth Fix Script
 * 
 * This script identifies the exact issues with your WordPress OAuth setup
 * and provides the specific fixes needed.
 */

require('dotenv').config();

console.log('🔧 WordPress OAuth Issue Diagnosis');
console.log('===================================\n');

console.log('📋 Current Configuration:');
console.log('WORDPRESS_CLIENT_ID:', process.env.WORDPRESS_CLIENT_ID || 'NOT_SET');
console.log('WORDPRESS_CLIENT_SECRET:', process.env.WORDPRESS_CLIENT_SECRET ? 'SET (length: ' + process.env.WORDPRESS_CLIENT_SECRET.length + ')' : 'NOT_SET');
console.log('WORDPRESS_REDIRECT_URI:', process.env.WORDPRESS_REDIRECT_URI || 'NOT_SET');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'NOT_SET');
console.log('APP_URL:', process.env.APP_URL || 'NOT_SET');
console.log('');

// Check issues
let issues = [];

if (!process.env.WORDPRESS_CLIENT_ID) {
  issues.push('WORDPRESS_CLIENT_ID is not set');
}

if (!process.env.WORDPRESS_CLIENT_SECRET) {
  issues.push('WORDPRESS_CLIENT_SECRET is not set');
}

if (!process.env.WORDPRESS_REDIRECT_URI) {
  issues.push('WORDPRESS_REDIRECT_URI is not set');
} else if (process.env.WORDPRESS_REDIRECT_URI !== 'http://localhost:5000/api/v1/wordpress-oauth/callback') {
  issues.push('WORDPRESS_REDIRECT_URI is incorrect - should be "http://localhost:5000/api/v1/wordpress-oauth/callback"');
}

if (!process.env.FRONTEND_URL) {
  issues.push('FRONTEND_URL is not set');
}

if (issues.length === 0) {
  console.log('✅ All WordPress OAuth configuration looks correct!');
  console.log('');
  console.log('If you\'re still having issues, try:');
  console.log('1. Restart your backend server');
  console.log('2. Clear your browser cache');
  console.log('3. Check that your WordPress.com app redirect URI matches exactly');
} else {
  console.log('❌ Issues Found:');
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
  
  console.log('');
  console.log('🔧 Required Fixes:');
  console.log('==================');
  console.log('');
  console.log('Update your backend/.env file with these corrections:');
  console.log('');
  
  if (process.env.WORDPRESS_REDIRECT_URI !== 'http://localhost:5000/api/v1/wordpress-oauth/callback') {
    console.log('# Fix the redirect URI (note: wordpress-oauth, not wordpress)');
    console.log('WORDPRESS_REDIRECT_URI=http://localhost:5000/api/v1/wordpress-oauth/callback');
    console.log('');
  }
  
  if (!process.env.FRONTEND_URL) {
    console.log('# Add the frontend URL');
    console.log('FRONTEND_URL=http://localhost:5174');
    console.log('');
  }
  
  console.log('🌐 WordPress.com App Settings:');
  console.log('===============================');
  console.log('Make sure your WordPress.com OAuth app at https://developer.wordpress.com/apps/');
  console.log('has this EXACT redirect URI:');
  console.log('http://localhost:5000/api/v1/wordpress-oauth/callback');
  console.log('');
  console.log('⚠️  Important: The redirect URI must match EXACTLY in both places!');
  console.log('');
  console.log('🔄 After making changes:');
  console.log('1. Save the .env file');
  console.log('2. Restart your backend server (npm start)');
  console.log('3. Try the WordPress connection again');
}

console.log('');
console.log('💡 The original error "client_id parameter is missing" happens when:');
console.log('   - OAuth credentials are missing OR');
console.log('   - The redirect URI doesn\'t match between WordPress.com and your .env file');
console.log('');
console.log('🔗 For detailed setup instructions, see: WORDPRESS_OAUTH_SETUP.md');
