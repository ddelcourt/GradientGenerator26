// ─────────────────────────────────────────────────────────────────────────────
// OBFUSCATION UTILITIES
// Simple XOR + Base64 encryption for API key obfuscation
// Note: This is NOT cryptographically secure - it's security through obscurity
// ─────────────────────────────────────────────────────────────────────────────

/**
 * XOR encrypt/decrypt a string with a key
 * @param {string} str - String to encrypt/decrypt
 * @param {string} key - Encryption key
 * @returns {string} XOR result
 */
function xorCipher(str, key) {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

/**
 * Encrypt a string (XOR + Base64)
 * @param {string} text - Plain text to encrypt
 * @param {string} key - Encryption key
 * @returns {string} Encrypted string (base64)
 */
export function encrypt(text, key) {
  const xored = xorCipher(text, key);
  const encoded = btoa(xored);
  return encoded;
}

/**
 * Decrypt a string (Base64 + XOR)
 * @param {string} encrypted - Encrypted string (base64)
 * @param {string} key - Encryption key
 * @returns {string} Decrypted plain text
 */
export function decrypt(encrypted, key) {
  const decoded = atob(encrypted);
  const xored = xorCipher(decoded, key);
  return xored;
}

// ─────────────────────────────────────────────────────────────────────────────
// OBFUSCATED STORAGE
// ─────────────────────────────────────────────────────────────────────────────

// Split encryption key across multiple variables to make it less obvious
const _k1 = 'px';
const _k2 = 'ls';
const _k3 = '20';
const _k4 = '26';

// Reconstruction function
const _getKey = () => _k1 + _k2 + _k3 + _k4; // "pxls2026"

/**
 * Store encrypted API key in localStorage
 * @param {string} plainKey - Plain API key
 */
export function storeKey(plainKey) {
  const encrypted = encrypt(plainKey, _getKey());
  localStorage.setItem('_pk', encrypted);
}

/**
 * Retrieve and decrypt API key from localStorage
 * @returns {string|null} Decrypted API key or null
 */
export function retrieveKey() {
  const encrypted = localStorage.getItem('_pk');
  if (!encrypted) return null;
  try {
    return decrypt(encrypted, _getKey());
  } catch {
    return null;
  }
}

/**
 * Decode a hardcoded obfuscated key
 * @param {string} obfuscated - Base64 + XOR encrypted key
 * @returns {string} Decrypted key
 */
export function decodeHardcodedKey(obfuscated) {
  return decrypt(obfuscated, _getKey());
}
