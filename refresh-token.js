#!/usr/bin/env node

/**
 * Quick script to refresh your Google OAuth token
 * Run this when you get "invalid_grant" errors
 */

const dotenv = require('dotenv');
const { OAuth2Client } = require('google-auth-library');
const readline = require('readline');

// Load environment variables
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🔄 Google OAuth Token Refresher\n');
  console.log('This script will help you get a new refresh token.\n');

  // Check for required env vars
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3009/auth/callback';

  if (!clientId || !clientSecret) {
    console.error('❌ Error: Missing Google OAuth credentials in .env file!\n');
    console.log('Please add to your .env file:');
    console.log('  GOOGLE_OAUTH_CLIENT_ID=your_client_id');
    console.log('  GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret');
    console.log('  GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3009/auth/callback\n');
    process.exit(1);
  }

  // Create OAuth2 client
  const oauth2Client = new OAuth2Client(
    clientId,
    clientSecret,
    redirectUri
  );

  // Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ],
    prompt: 'consent' // Force consent to get refresh token
  });

  console.log('📋 STEP 1: Visit this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n📋 STEP 2: Sign in and grant permissions\n');
  console.log('📋 STEP 3: Copy the authorization code from the redirect URL\n');

  const code = await question('Paste the authorization code here: ');

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('\n✅ Success! Here is your new refresh token:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(tokens.refresh_token);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 Add this to your .env file as:\n');
    console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    console.log('💡 Then restart your server for changes to take effect.\n');
    
    console.log('⚠️  IMPORTANT: To make this token permanent:');
    console.log('   1. Go to Google Cloud Console');
    console.log('   2. Navigate to "OAuth consent screen"');
    console.log('   3. Change from "Testing" to "Production"');
    console.log('   4. This prevents tokens from expiring after 7 days\n');

  } catch (error) {
    console.error('\n❌ Error getting token:', error.message);
    console.log('\nMake sure:');
    console.log('  - The authorization code is correct');
    console.log('  - Your OAuth credentials are valid');
    console.log('  - The redirect URI matches Google Cloud Console settings\n');
    process.exit(1);
  }

  rl.close();
}

main().catch(console.error);

