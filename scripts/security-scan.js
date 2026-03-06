#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Running Security Scan...\n');

let hasErrors = false;

// 1. NPM Audit
console.log('📦 Checking for vulnerable dependencies...');
try {
  execSync('npm audit --audit-level=moderate', { stdio: 'inherit' });
  console.log('✅ No vulnerable dependencies found\n');
} catch (error) {
  console.log('❌ Found vulnerable dependencies\n');
  hasErrors = true;
}

// 2. Check for hardcoded secrets
console.log('🔍 Scanning for hardcoded secrets...');
const secretPatterns = [
  /sk_test_[a-zA-Z0-9_]+/g,          // Stripe test keys
  /sk_live_[a-zA-Z0-9_]+/g,          // Stripe live keys  
  /pk_test_[a-zA-Z0-9_]+/g,          // Stripe publishable test keys
  /pk_live_[a-zA-Z0-9_]+/g,          // Stripe publishable live keys
  /xkeysib-[a-zA-Z0-9_-]+/g,         // Brevo API keys
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Email addresses
  /postgres:\/\/[^:]+:[^@]+@[^\/]+\/[^\s]+/g,         // Database URLs
];

const excludePatterns = [
  'placeholder',
  'example',
  'test',
  'demo',
  'sample'
];

function scanDirectory(dir, extensions = ['.ts', '.js', '.tsx', '.jsx']) {
  const files = fs.readdirSync(dir);
  let foundSecrets = false;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      if (scanDirectory(filePath, extensions)) {
        foundSecrets = true;
      }
    } else if (extensions.some(ext => file.endsWith(ext))) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      for (const pattern of secretPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          const realSecrets = matches.filter(match => 
            !excludePatterns.some(exclude => 
              match.toLowerCase().includes(exclude)
            )
          );
          
          if (realSecrets.length > 0) {
            console.log(`⚠️  Potential secrets found in ${filePath}:`);
            realSecrets.forEach(secret => {
              console.log(`   ${secret.substring(0, 8)}...`);
            });
            foundSecrets = true;
          }
        }
      }
    }
  }
  
  return foundSecrets;
}

if (scanDirectory('./src')) {
  console.log('❌ Found potential secrets in source code');
  hasErrors = true;
} else {
  console.log('✅ No hardcoded secrets found');
}

// 3. Check environment security
console.log('\n🌍 Checking environment configuration...');
const envFile = '.env.local';
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  
  // Check for production secrets in local env
  if (envContent.includes('sk_live_') || envContent.includes('pk_live_')) {
    console.log('❌ Production keys found in local environment file');
    hasErrors = true;
  } else {
    console.log('✅ Environment configuration looks secure');
  }
} else {
  console.log('ℹ️  No .env.local file found');
}

// 4. Check file permissions (on Unix systems)
if (process.platform !== 'win32') {
  console.log('\n📁 Checking sensitive file permissions...');
  const sensitiveFiles = ['.env.local', '.env.production'];
  let permissionIssues = false;
  
  for (const file of sensitiveFiles) {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      const mode = stats.mode & parseInt('777', 8);
      
      if (mode > parseInt('644', 8)) {
        console.log(`⚠️  ${file} has overly permissive permissions (${mode.toString(8)})`);
        permissionIssues = true;
      }
    }
  }
  
  if (!permissionIssues) {
    console.log('✅ File permissions are secure');
  }
}

// 5. Check for exposed debug/development endpoints
console.log('\n🔍 Checking for debug endpoints...');
const debugPatterns = [
  /\/api\/debug/g,
  /\/api\/test/g,
  /console\.log\(/g,
  /debugger;/g
];

let foundDebugCode = false;
function checkDebugCode(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      checkDebugCode(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      for (const pattern of debugPatterns) {
        if (pattern.test(content)) {
          if (pattern.source.includes('console.log') && content.includes('NODE_ENV')) {
            continue; // Skip conditional console.logs
          }
          console.log(`⚠️  Debug code found in ${filePath}`);
          foundDebugCode = true;
          break;
        }
      }
    }
  }
}

checkDebugCode('./src');
if (!foundDebugCode) {
  console.log('✅ No debug endpoints or code found');
}

console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Security scan completed with issues');
  console.log('Please review and fix the security issues above');
  process.exit(1);
} else {
  console.log('✅ Security scan passed');
  console.log('No major security issues detected');
}