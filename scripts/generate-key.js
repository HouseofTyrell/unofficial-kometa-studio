#!/usr/bin/env node

const crypto = require('crypto');

console.log('\n🔐 Generating master encryption key for Kometa Studio...\n');

const key = crypto.randomBytes(32).toString('base64');

console.log('Your master encryption key:');
console.log('\x1b[32m%s\x1b[0m', key);
console.log('\n⚠️  IMPORTANT:');
console.log('1. Copy this key to your apps/server/.env file');
console.log('2. Set it as: KOMETA_STUDIO_MASTER_KEY=' + key);
console.log('3. Keep this key secret and secure');
console.log('4. If you lose this key, encrypted secrets cannot be recovered\n');
