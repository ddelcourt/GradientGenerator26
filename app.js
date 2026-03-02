// ─────────────────────────────────────────────────────────────────────────────
// PEXELS EDITOR - MAIN ENTRY POINT
// Modular Pexels image editor with color extraction
// ─────────────────────────────────────────────────────────────────────────────

import { State } from './lib/state.js';
import { API, CONFIG } from './lib/config.js';
import { toggleTheme, applyTheme, setRedrawCallback } from './lib/ui.js';
import { copyHslArray, downloadPaletteImage } from './lib/color-extraction.js';
import { initializePalettes, restorePalettePositions, toggleCollapse } from './lib/palette-manager.js';
import { saveApiKey, doSearch, renderResults, selectPhoto, navigatePhoto } from './lib/image-search.js';
import { initializeCanvas, loadImage, onFilter, resetFilter, resetAllFilters, triggerDownload, initializeKeyboard, initializeFilters, clearImageCache } from './lib/image-control.js';
import { redraw } from './lib/canvas-renderer.js';
import { decodeHardcodedKey } from './lib/obfuscate.js';
import { initializeSlideshowPauseTriggers } from './lib/slideshow.js';

// ─────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────

// Log proxy mode
console.log(`[PXLS] Proxy mode: ${CONFIG.IS_LOCALHOST ? 'LOCAL (Node.js)' : 'PRODUCTION (PHP)'}`);
console.log(`[PXLS] Proxy base: ${CONFIG.PROXY_BASE}`);

// Handle API key initialization
if (API) {
  // If there's a hardcoded encrypted key, hide the API key input palette
  try {
    const decryptedKey = decodeHardcodedKey(API);
    State.apiKey = decryptedKey;
    // Hide the API key palette since it's hardcoded
    const apiPalette = document.getElementById('pal-api');
    if (apiPalette) {
      apiPalette.style.display = 'none';
    }
    console.log('[PXLS] Using app API key');
  } catch (e) {
    console.error('[PXLS] Failed to decrypt hardcoded API key:', e);
  }
} else {
  // Restore API key from localStorage if no hardcoded key
  const savedKey = localStorage.getItem('pxls_ak');
  if (savedKey) {
    State.apiKey = savedKey;
    const apiInput = document.getElementById('api-key');
    if (apiInput) apiInput.value = savedKey;
  }
}

// Clear image cache on app initialization (fresh start every session)
clearImageCache();

// Apply theme
const savedTheme = localStorage.getItem('pxls_theme') || 'dark';
State.theme = savedTheme;
applyTheme(savedTheme);

// Initialize canvas and resize handling
initializeCanvas();

// Initialize filter UI (sync sliders with State)
initializeFilters();

// Set up redraw callback for theme changes
setRedrawCallback(redraw);

// Initialize keyboard shortcuts
initializeKeyboard();

// Initialize draggable palettes
initializePalettes();

// Restore palette positions from localStorage
restorePalettePositions();

// Initialize slideshow pause triggers on interactive elements
initializeSlideshowPauseTriggers();

// Auto-collapse search palette when image control is used
const imageControlBody = document.getElementById('body-control');
if (imageControlBody) {
  // Collapse search palette on filter slider interaction
  imageControlBody.addEventListener('input', () => {
    const searchPalette = document.getElementById('pal-search');
    const searchBody = document.getElementById('body-search');
    if (searchPalette && searchBody && !searchBody.classList.contains('shut')) {
      toggleCollapse('search');
    }
  });
  
  // Collapse search palette on button clicks
  imageControlBody.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const searchPalette = document.getElementById('pal-search');
      const searchBody = document.getElementById('body-search');
      if (searchPalette && searchBody && !searchBody.classList.contains('shut')) {
        toggleCollapse('search');
      }
    }
  });
}

// Clear cache when window/tab is closed
window.addEventListener('beforeunload', () => {
  clearImageCache();
  console.log('[PXLS] Cache cleared on window close');
});

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT GLOBAL FUNCTIONS (called by HTML onclick/oninput handlers)
// ─────────────────────────────────────────────────────────────────────────────

// Make functions globally accessible for HTML onclick handlers
window.toggleTheme = toggleTheme;
window.navigatePhoto = navigatePhoto;
window.toggleCollapse = toggleCollapse;
window.doSearch = (fresh) => doSearch(fresh, loadImage);
window.copyHslArray = copyHslArray;
window.downloadPaletteImage = downloadPaletteImage;
window.resetFilter = resetFilter;
window.resetAllFilters = resetAllFilters;
window.triggerDownload = triggerDownload;
window.saveApiKey = saveApiKey;
window.onFilter = onFilter;
window.selectPhoto = selectPhoto;

console.log('[PXLS] Editor initialized');
