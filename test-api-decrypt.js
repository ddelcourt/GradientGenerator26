// ═════════════════════════════════════════════════════════════════════════════
// API KEY DECRYPTION TEST
// Simple standalone test to verify API key decryption works
// ═════════════════════════════════════════════════════════════════════════════

import { decryptApiKey, testDecryption } from './lib/api-key-decrypt.js';

console.log('═══════════════════════════════════════════════════════');
console.log('API KEY DECRYPTION TEST');
console.log('═══════════════════════════════════════════════════════\n');

// Test 1: Built-in test function
console.log('Test 1: Built-in test function');
const testResult = testDecryption();
console.log('Result:', testResult ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 2: Decrypt the actual encrypted API key
console.log('Test 2: Decrypt actual encrypted API key');
const encryptedKey = 'BEEtH0dnC1o0TVgEdn9gBwoOLyJ8c3luNR4nIXF7fXgyFg4VWl1lTDgvJQBWaH1VFTAgGVADA1c=';
console.log('Encrypted key length:', encryptedKey.length);

try {
  const decrypted = decryptApiKey(encryptedKey);
  console.log('✓ Decryption successful!');
  console.log('  - Decrypted length:', decrypted.length);
  console.log('  - First 10 chars:', decrypted.substring(0, 10) + '...');
  console.log('  - Last 4 chars:', '...' + decrypted.substring(decrypted.length - 4));
  console.log('  - Expected length: 56');
  console.log('  - Length matches:', decrypted.length === 56 ? '✓' : '✗');
  console.log('  - Full key:', decrypted);
} catch (e) {
  console.error('✗ Decryption failed!');
  console.error('Error:', e.message);
  console.error('Stack:', e.stack);
}

console.log('\n═══════════════════════════════════════════════════════');
