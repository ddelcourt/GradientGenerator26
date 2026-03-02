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
import { initializeCanvas, loadImage, onFilter, resetFilter, resetAllFilters, triggerDownload, initializeKeyboard, initializeFilters, clearImageCache, initCursorAutoHide } from './lib/image-control.js';
import { redraw } from './lib/canvas-renderer.js';
import { decodeHardcodedKey } from './lib/obfuscate.js';
import { initializeSlideshowPauseTriggers } from './lib/slideshow.js';

// ─────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────

// Log environment mode
console.log(`[PXLS] Environment: ${CONFIG.IS_TAURI ? 'TAURI (Desktop)' : CONFIG.IS_LOCALHOST ? 'LOCAL (Node.js)' : 'PRODUCTION (PHP)'}`);
console.log(`[PXLS] Proxy base: ${CONFIG.PROXY_BASE || 'Direct API'}`);

// Load Tauri performance optimizations if running in desktop app
if (CONFIG.IS_TAURI) {
  const perfCSS = document.createElement('link');
  perfCSS.rel = 'stylesheet';
  perfCSS.href = 'css/tauri-performance.css';
  document.head.appendChild(perfCSS);
  console.log('[PXLS] Loaded Tauri performance optimizations');
}

// Handle API key initialization
if (API) {
  // If there's a hardcoded encrypted key, hide the API key input palette
  try {
    console.log('[PXLS] Encrypted API key found, length:', API.length);
    const decryptedKey = decodeHardcodedKey(API);
    console.log('[PXLS] Decrypted API key, length:', decryptedKey.length);
    State.apiKey = decryptedKey;
    // Hide the API key palette since it's hardcoded
    const apiPalette = document.getElementById('pal-api');
    if (apiPalette) {
      apiPalette.style.display = 'none';
      console.log('[PXLS] API key palette hidden');
    }
    console.log('[PXLS] Using app API key');
  } catch (e) {
    console.error('[PXLS] Failed to decrypt hardcoded API key:', e);
    console.error('[PXLS] API constant value:', API.substring(0, 20) + '...');
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

// Initialize cursor auto-hide for fullscreen
initCursorAutoHide();

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
// EVENT LISTENERS INITIALIZATION (CSP-compliant, no inline handlers)
// ─────────────────────────────────────────────────────────────────────────────

function initializeEventListeners() {
  // Theme toggle button
  const themeBtn = document.getElementById('theme-btn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Navigation arrows
  const navLeft = document.getElementById('nav-left');
  const navRight = document.getElementById('nav-right');
  if (navLeft) navLeft.addEventListener('click', () => navigatePhoto(-1));
  if (navRight) navRight.addEventListener('click', () => navigatePhoto(1));

  // Collapse buttons
  const collApi = document.getElementById('coll-api');
  const collSearch = document.getElementById('coll-search');
  const collColors = document.getElementById('coll-colors');
  const collControl = document.getElementById('coll-control');
  if (collApi) collApi.addEventListener('click', () => toggleCollapse('api'));
  if (collSearch) collSearch.addEventListener('click', () => toggleCollapse('search'));
  if (collColors) collColors.addEventListener('click', () => toggleCollapse('colors'));
  if (collControl) collControl.addEventListener('click', () => toggleCollapse('control'));

  // API key input
  const apiKeyInput = document.getElementById('api-key');
  if (apiKeyInput) apiKeyInput.addEventListener('input', (e) => saveApiKey(e.target.value));

  // Search input and button
  const searchQuery = document.getElementById('search-query');
  const searchBtn = document.getElementById('search-btn');
  if (searchQuery) {
    searchQuery.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.stopPropagation();
        doSearch(true, loadImage);
      }
    });
  }
  if (searchBtn) searchBtn.addEventListener('click', () => doSearch(true, loadImage));

  // Color extraction buttons
  const copyBtn = document.getElementById('copy-btn');
  const downloadPaletteBtn = document.getElementById('download-palette-btn');
  if (copyBtn) copyBtn.addEventListener('click', copyHslArray);
  if (downloadPaletteBtn) downloadPaletteBtn.addEventListener('click', downloadPaletteImage);

  // Filter sliders
  const blurSlider = document.getElementById('f-blur');
  const brightnessSlider = document.getElementById('f-brightness');
  const contrastSlider = document.getElementById('f-contrast');
  const saturationSlider = document.getElementById('f-saturation');
  
  if (blurSlider) blurSlider.addEventListener('input', (e) => onFilter('blur', +e.target.value));
  if (brightnessSlider) brightnessSlider.addEventListener('input', (e) => onFilter('brightness', +e.target.value));
  if (contrastSlider) contrastSlider.addEventListener('input', (e) => onFilter('contrast', +e.target.value));
  if (saturationSlider) saturationSlider.addEventListener('input', (e) => onFilter('saturation', +e.target.value));

  // Filter reset buttons (using data-filter attribute)
  const filterResetButtons = document.querySelectorAll('.frst[data-filter]');
  filterResetButtons.forEach(btn => {
    const filterName = btn.getAttribute('data-filter');
    btn.addEventListener('click', () => resetFilter(filterName));
  });

  // Reset all filters button
  const resetAllBtn = document.getElementById('reset-all-btn');
  if (resetAllBtn) resetAllBtn.addEventListener('click', resetAllFilters);

  // Download button
  const dlBtn = document.getElementById('dl-btn');
  if (dlBtn) dlBtn.addEventListener('click', triggerDownload);

  console.log('[PXLS] Event listeners initialized (CSP-compliant)');
}

// Initialize event listeners after DOM is ready
initializeEventListeners();

// Export selectPhoto for dynamic results (called by renderResults)
window.selectPhoto = selectPhoto;

console.log('[PXLS] Editor initialized');
