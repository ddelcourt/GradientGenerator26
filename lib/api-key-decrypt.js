// ═════════════════════════════════════════════════════════════════════════════
// API KEY DECRYPTION MODULE
// Isolated, standalone module for API key decryption
// DO NOT MODIFY - This module is designed to be stable and dependency-free
// ═════════════════════════════════════════════════════════════════════════════

/**
 * XOR cipher - encrypt/decrypt a string with a key
 * @private
 */
function _xor(str, key) {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

/**
 * Decrypt an API key that was encrypted with Base64 + XOR
 * This is the ONLY function you need to decrypt the hardcoded API key
 * 
 * @param {string} encryptedKey - The Base64 + XOR encrypted API key
 * @returns {string} The decrypted API key
 * 
 * @example
 * const decrypted = decryptApiKey('BEEtH0dnC1o0TVgEdn9gBwoOLyJ8...');
 * // Returns: 't9AluW9lD54wDOR1zvCQNCKXEfKRCK...'
 */
export function decryptApiKey(encryptedKey) {
  // Encryption key components (reconstructed to avoid plaintext storage)
  const key = 'px' + 'ls' + '20' + '26'; // "pxls2026"
  
  // Step 1: Decode from Base64
  const base64Decoded = atob(encryptedKey);
  
  // Step 2: XOR decrypt with key
  const decrypted = _xor(base64Decoded, key);
  
  return decrypted;
}

/**
 * Test function to verify decryption works
 * @returns {boolean} true if decryption appears to work
 */
export function testDecryption() {
  try {
    // Test with the actual encrypted value from config.js
    const testEncrypted = 'BEEtH0dnC1o0TVgEdn9gBwoOLyJ8c3luNR4nIXF7fXgyFg4VWl1lTDgvJQBWaH1VFTAgGVADA1c=';
    const result = decryptApiKey(testEncrypted);
    
    // Should return a 56-character string starting with 't9'
    return result.length === 56 && result.startsWith('t9');
  } catch (e) {
    return false;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// END OF API KEY DECRYPTION MODULE
// ═════════════════════════════════════════════════════════════════════════════
