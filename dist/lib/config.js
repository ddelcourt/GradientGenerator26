// ═════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════
// App configuration and obfuscated secrets

// ─────────────────────────────────────────────────────────────────────────────
// OBFUSCATED API KEY
// ─────────────────────────────────────────────────────────────────────────────
// To embed your Pexels API key:
// 1. Run: node encrypt-key.js "your-actual-api-key"
// 2. Copy the encrypted output
// 3. Paste it here as the value
// 4. The API key input palette will hide automatically
//
// Leave empty string '' to require users to enter their own key
export const API = 'BEEtH0dnC1o0TVgEdn9gBwoOLyJ8c3luNR4nIXF7fXgyFg4VWl1lTDgvJQBWaH1VFTAgGVADA1c=';

// ─────────────────────────────────────────────────────────────────────────────
// APP SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

// Auto-detect environment (Tauri desktop, localhost dev, or production web)
// Tauri provides a global __TAURI__ object - this is the most reliable detection
const isTauri = typeof window.__TAURI__ !== 'undefined';

const isLocalhost = !isTauri && (
  window.location.hostname === 'localhost' 
  || window.location.hostname === '127.0.0.1'
  || window.location.hostname.includes('localhost')
);

console.log('[CONFIG] Environment detection:', {
  isTauri,
  isLocalhost,
  hasTauriObject: typeof window.__TAURI__,
  hostname: window.location.hostname,
  protocol: window.location.protocol
});

// Proxy configuration:
// - Tauri: No proxy needed (CORS not an issue in desktop apps)
// - Localhost: Node.js proxy on port 3131
// - Production web: PHP proxy at same origin
const PROXY_BASE = isTauri
  ? null  // Direct API access in Tauri
  : isLocalhost 
    ? 'http://localhost:3131'  // Node.js proxy (proxy.js)
    : window.location.origin;   // PHP proxy (proxy.php) at same origin

export const CONFIG = {
  // Proxy configuration
  PROXY_BASE,
  IS_LOCALHOST: isLocalhost,
  IS_TAURI: isTauri,
  
  // Proxy endpoints
  PROXY_SEARCH: isTauri
    ? 'https://api.pexels.com/v1/search'  // Direct API in Tauri
    : isLocalhost 
      ? `${PROXY_BASE}/search`
      : `${PROXY_BASE}/proxy.php`,
  
  PROXY_IMAGE: isTauri
    ? null  // Direct image URLs in Tauri
    : isLocalhost
      ? `${PROXY_BASE}/img`
      : `${PROXY_BASE}/proxy.php`,
  
  // Search settings
  PEXELS_PER_PAGE: 21,
  RANDOM_PAGE_RANGE: 10, // Pick from first N pages for variety
  
  // LocalStorage keys
  STORAGE_KEYS: {
    API_KEY: 'pxls_ak',
    THEME: 'pxls_theme',
    PALETTE_PREFIX: 'pxls3_'
  },
  
  // Theme
  DEFAULT_THEME: 'dark',
  
  // Toast duration (ms)
  TOAST_DURATION: 2400
};
