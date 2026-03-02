// Simple decryption test without importing config.js (which needs browser)
import { decodeHardcodedKey } from './lib/obfuscate.js';

const encryptedKey = 'BEEtH0dnC1o0TVgEdn9gBwoOLyJ8c3luNR4nIXF7fXgyFg4VWl1lTDgvJQBWaH1VFTAgGVADA1c=';

console.log('=== DECRYPTION TEST ===');
console.log('Encrypted length:', encryptedKey.length);

try {
  const decrypted = decodeHardcodedKey(encryptedKey);
  console.log('✓ Decryption SUCCESS');
  console.log('Decrypted length:', decrypted.length);
  console.log('Decrypted value:', decrypted);
} catch (e) {
  console.error('✗ Decryption FAILED:', e.message);
  console.error(e.stack);
}
