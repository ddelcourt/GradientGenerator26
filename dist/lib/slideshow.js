// ─────────────────────────────────────────────────────────────────────────────
// SLIDESHOW MODULE
// Automatic image progression with pause on user interaction
// ─────────────────────────────────────────────────────────────────────────────
// Behavior:
// - When an image loads, slideshow timer starts (10 seconds)
// - After 10 seconds, automatically advance to next image  
// - When user interacts with UI (sliders, buttons, palettes), slideshow pauses
// - When a new image loads (manual or automatic), slideshow resumes
// - Navigation wraps around (last image → first image)
// ─────────────────────────────────────────────────────────────────────────────

import { State } from './state.js';

const SLIDESHOW_DELAY = 10000; // 10 seconds
let slideshowTimer = null;
let slideshowEnabled = true;

/**
 * Start slideshow timer
 * @param {Function} nextImageCallback - Function to call when timer expires
 */
export function startSlideshow(nextImageCallback) {
  clearSlideshow();
  
  if (!slideshowEnabled || !State.selPhoto) return;
  
  slideshowTimer = setTimeout(() => {
    if (slideshowEnabled) {
      nextImageCallback();
    }
  }, SLIDESHOW_DELAY);
}

/**
 * Clear/stop slideshow timer
 */
export function clearSlideshow() {
  if (slideshowTimer) {
    clearTimeout(slideshowTimer);
    slideshowTimer = null;
  }
}

/**
 * Pause slideshow (disable auto-advance)
 */
export function pauseSlideshow() {
  slideshowEnabled = false;
  clearSlideshow();
}

/**
 * Resume slideshow (re-enable auto-advance)
 * @param {Function} nextImageCallback - Function to call when timer expires
 */
export function resumeSlideshow(nextImageCallback) {
  slideshowEnabled = true;
  startSlideshow(nextImageCallback);
}

/**
 * Check if slideshow is currently enabled
 * @returns {boolean}
 */
export function isSlideshowEnabled() {
  return slideshowEnabled;
}

/**
 * Initialize slideshow pause triggers on interactive elements
 */
export function initializeSlideshowPauseTriggers() {
  // Pause on filter slider interactions
  const sliders = document.querySelectorAll('.fsl');
  sliders.forEach(slider => {
    slider.addEventListener('input', pauseSlideshow);
    slider.addEventListener('mousedown', pauseSlideshow);
    slider.addEventListener('touchstart', pauseSlideshow);
  });
  
  // Pause on button clicks (except navigation arrows and collapse buttons)
  const buttons = document.querySelectorAll('button:not(.nav-arrow):not(.pal-coll)');
  buttons.forEach(button => {
    button.addEventListener('click', pauseSlideshow);
  });
  
  // Pause on input field interaction (search, API key)
  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('focus', pauseSlideshow);
    input.addEventListener('input', pauseSlideshow);
  });
}
