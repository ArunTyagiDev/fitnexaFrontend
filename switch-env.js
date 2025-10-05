#!/usr/bin/env node

/**
 * Environment Switcher Script
 * Usage: node switch-env.js [local|production]
 */

const fs = require('fs');
const path = require('path');

const environments = {
  local: {
    VITE_API_BASE_URL: 'http://localhost:8000/api',
    VITE_ENVIRONMENT: 'local'
  },
  production: {
    VITE_API_BASE_URL: 'https://shrijigroup.co.in/public/api',
    VITE_ENVIRONMENT: 'production'
  },
  vercel: {
    VITE_API_BASE_URL: 'https://shrijigroup.co.in/public/api',
    VITE_ENVIRONMENT: 'production'
  }
};

function switchEnvironment(env) {
  if (!environments[env]) {
    console.error(`❌ Invalid environment: ${env}`);
    console.log('Available environments: local, production, vercel');
    process.exit(1);
  }

  const envFile = path.join(__dirname, '.env');
  const envContent = Object.entries(environments[env])
    .map(([key, value]) => `${key}=${value}`)
    .join('\n') + '\n';

  try {
    fs.writeFileSync(envFile, envContent);
    console.log(`✅ Switched to ${env} environment`);
    console.log(`📝 API URL: ${environments[env].VITE_API_BASE_URL}`);
    console.log('🔄 Please restart your development server');
  } catch (error) {
    console.error('❌ Failed to write .env file:', error.message);
    process.exit(1);
  }
}

// Get environment from command line argument
const targetEnv = process.argv[2];

if (!targetEnv) {
  console.log('🔧 Environment Switcher');
  console.log('Usage: node switch-env.js [local|production|vercel]');
  console.log('');
  console.log('Current configuration:');
  console.log('  Local:      http://localhost:8000/api');
  console.log('  Production: https://shrijigroup.co.in/public/api');
  console.log('  Vercel:     https://shrijigroup.co.in/public/api');
  process.exit(0);
}

switchEnvironment(targetEnv);
