// Test decryption
import { API } from './lib/config.js';
import { decodeHardcodedKey } from './lib/obfuscate.js';

console.log('=== DECRYPTION TEST ===');
console.log('API constant exists:', !!API);
console.log('API length:', API ? API.length : 0);
console.log('API value (first 30):', API ? API.substring(0, 30) : 'EMPTY');

if (API) {
  try {
    const decrypted = decodeHardcodedKey(API);
    console.log('✓ Decryption SUCCESS');
    console.log('Decrypted length:', decrypted.length);
    console.log('Decrypted (first 20):', decrypted.substring(0, 20));
  } catch (e) {
    console.error('✗ Decryption FAILED:', e.message);
  }
} else {
  console.error('✗ API constant is empty or undefined');
}
