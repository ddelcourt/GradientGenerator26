// ─────────────────────────────────────────────────────────────────────────────
// IMAGE CONTROL MODULE
// Handles canvas setup, image loading, filters, download, and fullscreen
// ─────────────────────────────────────────────────────────────────────────────

import { State } from './state.js';
import { CONFIG } from './config.js';
import { toast } from './ui.js';
import { redraw, renderFullResolution } from './canvas-renderer.js';
import { navigatePhoto } from './image-search.js';
import { resumeSlideshow, pauseSlideshow } from './slideshow.js';

let isFullscreen = false;
let isHidden = false;

// ─────────────────────────────────────────────────────────────────────────────
// CURSOR AUTO-HIDE (for fullscreen mode)
// ─────────────────────────────────────────────────────────────────────────────
let cursorHideTimer = null;

/**
 * Initialize cursor auto-hide for fullscreen mode
 * Hides cursor after 1 second of inactivity
 */
export function initCursorAutoHide() {
  let isMouseMoving = false;
  
  document.addEventListener('mousemove', () => {
    // Show cursor immediately on movement
    if (isFullscreen && document.body.classList.contains('cursor-hidden')) {
      document.body.classList.remove('cursor-hidden');
    }
    
    // Clear existing timer
    if (cursorHideTimer) {
      clearTimeout(cursorHideTimer);
    }
    
    // Set timer to hide cursor after 1 second of no movement
    if (isFullscreen) {
      cursorHideTimer = setTimeout(() => {
        document.body.classList.add('cursor-hidden');
      }, 1000);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE CACHE (in-memory, clears on page reload)
// ─────────────────────────────────────────────────────────────────────────────
const imageCache = new Map(); // URL → HTMLImageElement

/**
 * Clear image cache (automatic on page reload, can also be called manually)
 */
export function clearImageCache() {
  imageCache.clear();
  console.log('[PXLS] Image cache cleared');
}

/**
 * Get cache statistics
 * @returns {object} Cache stats
 */
export function getCacheStats() {
  return {
    size: imageCache.size,
    urls: Array.from(imageCache.keys())
  };
}

/**
 * Resize canvas to fill viewport
 */
function resizeCanvas() {
  const canvas = document.getElementById('main-canvas');
  if (!canvas) return;
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  redraw();
}

/**
 * Initialize canvas and resize handler
 */
export function initializeCanvas() {
  const canvas = document.getElementById('main-canvas');
  
  if (canvas) {
    State.mainCanvas = canvas;
    State.ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: false,
      colorSpace: 'srgb',
      willReadFrequently: false
    });
    
    redraw();
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

/**
 * Load image from URL
 * @param {string} url - Image URL to load
 */
export function loadImage(url) {
  // Check if image is already cached
  const cachedImage = imageCache.get(url);
  if (cachedImage) {
    console.log('[PXLS] Using cached image:', url.slice(-30));
    toast('Image loaded from cache ✓');
    
    // Reuse cached image immediately
    State.loadedImg = cachedImage;
    State.origW = cachedImage.naturalWidth;
    State.origH = cachedImage.naturalHeight;
    document.getElementById('res-info').style.display = 'block';
    document.getElementById('res-info').innerHTML = `<strong>${State.origW} × ${State.origH}</strong> · PNG 32-bit RGBA`;
    document.getElementById('dl-btn').disabled = false;
    document.getElementById('pal-control').style.display = 'block';
    document.getElementById('pal-colors').style.display = 'block';
    
    const ph = document.getElementById('ph');
    if (ph) ph.style.display = 'none';
    document.body.classList.add('has-image');
    
    redraw();
    
    // Start slideshow
    resumeSlideshow(() => navigatePhoto(1));
    return;
  }
  
  // Not cached - load from network
  toast('Loading image…');
  const ph = document.getElementById('ph');
  if (ph) ph.style.display = 'none';
  document.body.classList.add('has-image');
  
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    // Cache the loaded image
    imageCache.set(url, img);
    console.log('[PXLS] Image cached:', url.slice(-30), `(cache size: ${imageCache.size})`);
    
    State.loadedImg = img;
    State.origW = img.naturalWidth;
    State.origH = img.naturalHeight;
    document.getElementById('res-info').style.display = 'block';
    document.getElementById('res-info').innerHTML = `<strong>${State.origW} × ${State.origH}</strong> · PNG 32-bit RGBA`;
    document.getElementById('dl-btn').disabled = false;
    document.getElementById('pal-control').style.display = 'block';
    document.getElementById('pal-colors').style.display = 'block';
    toast('Image loaded ✓');
    redraw();
    
    // Start slideshow (auto-advance after 10 seconds)
    resumeSlideshow(() => navigatePhoto(1));
  };
  img.onerror = () => toast('Could not load image');
  
  // Route image URL based on environment
  let imgUrl;
  if (CONFIG.IS_TAURI) {
    // Tauri: Use direct Pexels image URLs (no CORS issues in desktop app)
    imgUrl = url;
  } else if (CONFIG.IS_LOCALHOST) {
    // Localhost: Node.js proxy
    imgUrl = `${CONFIG.PROXY_IMAGE}?url=${encodeURIComponent(url)}`;
  } else {
    // Production web: PHP proxy
    imgUrl = `${CONFIG.PROXY_IMAGE}?action=img&url=${encodeURIComponent(url)}`;
  }
  
  img.src = imgUrl;
}

/**
 * Handle filter slider change
 * @param {string} key - Filter key (blur, brightness, contrast, saturation)
 * @param {number} val - Filter value
 */
export function onFilter(key, val) {
  State.filters[key] = val;
  const unit = key === 'blur' ? 'px' : '';
  const sign = val > 0 && key !== 'blur' ? '+' : '';
  document.getElementById('v-' + key).textContent = sign + val + unit;
  redraw();
  
  // Pause slideshow when user adjusts filters
  pauseSlideshow();
}

/**
 * Reset a single filter to default
 * @param {string} key - Filter key to reset
 */
export function resetFilter(key) {
  State.filters[key] = 0;
  document.getElementById('f-' + key).value = 0;
  document.getElementById('v-' + key).textContent = key === 'blur' ? '0px' : '0';
  redraw();
}

/**
 * Reset all filters to default
 */
export function resetAllFilters() {
  ['blur', 'brightness', 'contrast', 'saturation'].forEach(k => resetFilter(k));
  toast('Filters reset');
}

/**
 * Trigger download of processed image
 */
export async function triggerDownload() {
  if (!State.loadedImg || State.rendering) return;
  State.rendering = true;
  const btn = document.getElementById('dl-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spin" style="width:13px;height:13px;border-top-color:var(--acfg);margin:0"></span> Processing…';
  toast('Preparing download…');

  setTimeout(async () => {
    try {
      const finalCanvas = await renderFullResolution();
      const defaultFilename = `pxls_${State.selPhoto?.id || 'image'}_edited.png`;
      
      // Debug: Log Tauri API availability
      console.log('CONFIG.IS_TAURI:', CONFIG.IS_TAURI);
      console.log('window.__TAURI__:', typeof window.__TAURI__);
      if (window.__TAURI__) {
        console.log('__TAURI__ keys:', Object.keys(window.__TAURI__));
        console.log('__TAURI__.dialog:', typeof window.__TAURI__.dialog);
        console.log('__TAURI__.fs:', typeof window.__TAURI__.fs);
      }
      
      // Tauri: Use native save dialog
      if (CONFIG.IS_TAURI && window.__TAURI__ && window.__TAURI__.dialog && window.__TAURI__.fs) {
        const filePath = await window.__TAURI__.dialog.save({
          defaultPath: defaultFilename,
          filters: [{
            name: 'PNG Image',
            extensions: ['png']
          }]
        });
        
        if (filePath) {
          // Convert canvas to Uint8Array
          const blob = await new Promise(resolve => finalCanvas.toBlob(resolve, 'image/png'));
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          await window.__TAURI__.fs.writeBinaryFile(filePath, uint8Array);
          
          State.rendering = false;
          btn.disabled = false;
          btn.innerHTML = '<span>↓</span> Download PNG';
          toast('Saved ✓');
        } else {
          // User cancelled
          State.rendering = false;
          btn.disabled = false;
          btn.innerHTML = '<span>↓</span> Download PNG';
        }
      } else {
        // Browser: Standard download
        finalCanvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const a   = document.createElement('a');
          a.href     = url;
          a.download = defaultFilename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          State.rendering = false;
          btn.disabled = false;
          btn.innerHTML = '<span>↓</span> Download PNG';
          toast('Downloaded ✓');
        }, 'image/png');
      }
    } catch(e) {
      console.error(e);
      State.rendering = false;
      btn.disabled = false;
      btn.innerHTML = '<span>↓</span> Download PNG';
      toast('Save failed');
    }
  }, 60);
}

/**
 * Set fullscreen mode
 * @param {boolean} v - True to enter fullscreen, false to exit
 */
export function setFullscreen(v) {
  isFullscreen = v;
  document.body.classList.toggle('fs-mode', v);
  
  // Use browser's native fullscreen API (like YouTube)
  if (v) {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Fullscreen request failed:', err);
        // Fallback to just CSS fullscreen if API fails
      });
    }
    
    // Start cursor auto-hide timer when entering fullscreen
    if (cursorHideTimer) {
      clearTimeout(cursorHideTimer);
    }
    cursorHideTimer = setTimeout(() => {
      document.body.classList.add('cursor-hidden');
    }, 1000);
  } else {
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen();
    }
    
    // Clear timer and show cursor when exiting fullscreen
    if (cursorHideTimer) {
      clearTimeout(cursorHideTimer);
      cursorHideTimer = null;
    }
    document.body.classList.remove('cursor-hidden');
  }
}

/**
 * Initialize filter UI - sync sliders and display values with State
 */
export function initializeFilters() {
  const filters = ['blur', 'brightness', 'contrast', 'saturation'];
  filters.forEach(key => {
    const value = State.filters[key];
    const slider = document.getElementById('f-' + key);
    const display = document.getElementById('v-' + key);
    
    if (slider) slider.value = value;
    if (display) {
      const unit = key === 'blur' ? 'px' : '';
      const sign = value > 0 && key !== 'blur' ? '+' : '';
      display.textContent = sign + value + unit;
    }
  });
}

/**
 * Initialize keyboard shortcuts
 */
export function initializeKeyboard() {
  window.addEventListener('keydown', e => {
    const inInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);

    if (e.key === 'Tab') {
      e.preventDefault();
      isHidden = !isHidden;
      document.body.classList.toggle('ui-hidden', isHidden);
      return;
    }
    if (e.key === 'Escape' && isFullscreen) {
      setFullscreen(false); return;
    }
    if (e.key === 'Enter' && !inInput) {
      e.preventDefault();
      setFullscreen(!isFullscreen); return;
    }
    if ((e.key === 'r' || e.key === 'R') && !inInput) {
      resetAllFilters();
    }
    if (e.key === 'ArrowRight' && !inInput) {
      e.preventDefault();
      navigatePhoto(1); // next
    }
    if (e.key === 'ArrowLeft' && !inInput) {
      e.preventDefault();
      navigatePhoto(-1); // previous
    }
  });
}
