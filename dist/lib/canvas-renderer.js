// ─────────────────────────────────────────────────────────────────────────────
// CANVAS RENDERER MODULE
// Handles canvas drawing, filter application, and blur processing
// ─────────────────────────────────────────────────────────────────────────────

import { State } from './state.js';
import { updateExtractedColors } from './color-extraction.js';

// ─────────────────────────────────────────────────────────────────────────────
// BLUR CALIBRATION
// ─────────────────────────────────────────────────────────────────────────────
// Adjust this multiplier to match exported blur to screen CSS blur
// CSS blur uses true Gaussian blur (GPU-accelerated)
// Our export uses 3-pass box blur (approximation)
// 
// To calibrate:
// 1. Set blur slider to a known value (e.g. 10px)
// 2. Export image and compare visually to screen
// 3. Adjust multiplier up if export is too weak, down if too strong
// 4. Typical range: 1.0-2.5 (start at 1.25)
const BLUR_EXPORT_MULTIPLIER = 1.25;

// ─────────────────────────────────────────────────────────────────────────────
// OFFSCREEN CANVAS POOL (reuse to prevent memory leaks)
// ─────────────────────────────────────────────────────────────────────────────
let offscreenCanvas = null;
let offscreenCtx = null;

/**
 * Get or reuse offscreen canvas for rendering
 * Reusing a single canvas prevents memory leaks in Tauri
 */
function getOffscreenCanvas(width, height) {
  if (!offscreenCanvas) {
    offscreenCanvas = document.createElement('canvas');
    offscreenCtx = offscreenCanvas.getContext('2d', {
      alpha: true,
      colorSpace: 'srgb',
      willReadFrequently: false
    });
    console.log('[PXLS] Created reusable offscreen canvas');
  }
  
  // Only resize if dimensions changed
  if (offscreenCanvas.width !== width || offscreenCanvas.height !== height) {
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
  }
  
  // Clear before use
  offscreenCtx.clearRect(0, 0, width, height);
  
  return { canvas: offscreenCanvas, ctx: offscreenCtx };
}

/**
 * Redraw the canvas with current image and filters
 * Uses padded canvas technique for clean blur edges
 */
export function redraw() {
  const canvas = document.getElementById('main-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  
  // Get bg color from CSS
  const bg = getComputedStyle(document.body).getPropertyValue('--bg').trim() || '#0d0d0f';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  if (!State.loadedImg) return;

  // Fit image
  const ir = State.loadedImg.width / State.loadedImg.height;
  const cr = W / H;
  let dw, dh;
  if (ir > cr) { dw = W; dh = W / ir; } else { dh = H; dw = H * ir; }
  const dx = (W - dw) / 2, dy = (H - dh) / 2;

  const f = State.filters;

  // Use reusable offscreen canvas (critical for memory management)
  const { canvas: off, ctx: octx } = getOffscreenCanvas(Math.round(dw), Math.round(dh));
  octx.drawImage(State.loadedImg, 0, 0, off.width, off.height);

  // Apply pixel-level filters (brightness, contrast, saturation)
  if (f.brightness !== 0 || f.contrast !== 0 || f.saturation !== 0) {
    const id   = octx.getImageData(0, 0, off.width, off.height);
    const px   = id.data;
    const br   = f.brightness * 2.55;
    const cf   = f.contrast !== 0 ? (259 * (f.contrast + 255)) / (255 * (259 - f.contrast)) : 1;
    const sf   = (f.saturation + 100) / 100;
    for (let i = 0; i < px.length; i += 4) {
      let r = px[i], g = px[i + 1], b = px[i + 2];
      if (f.brightness !== 0)  { r += br; g += br; b += br; }
      if (f.contrast !== 0)    { r = cf * (r - 128) + 128; g = cf * (g - 128) + 128; b = cf * (b - 128) + 128; }
      if (f.saturation !== 0)  { const l = 0.299 * r + 0.587 * g + 0.114 * b; r = l + sf * (r - l); g = l + sf * (g - l); b = l + sf * (b - l); }
      px[i]   = Math.max(0, Math.min(255, r));
      px[i + 1] = Math.max(0, Math.min(255, g));
      px[i + 2] = Math.max(0, Math.min(255, b));
    }
    octx.putImageData(id, 0, 0);
  }

  // Apply CSS blur filter (fast, GPU-accelerated)
  // For Tauri/WebKit compatibility, we apply blur as a CSS filter on the canvas element
  // instead of using ctx.filter (which has limited WebKit support)
  if (f.blur > 0) {
    // Apply CSS filter directly to canvas element for better compatibility
    canvas.style.filter = `blur(${f.blur}px)`;
    ctx.drawImage(off, dx, dy, dw, dh);
  } else {
    // Remove any blur filter
    canvas.style.filter = 'none';
    ctx.drawImage(off, dx, dy, dw, dh);
  }
  
  // Extract dominant colors after rendering (only from image region)
  updateExtractedColors(dx, dy, dw, dh);
}

/**
 * Render canvas for download - exports with scaled filters for full resolution
 * @returns {Promise<HTMLCanvasElement>} Canvas with processed image
 */
export function renderFullResolution() {
  return new Promise((resolve, reject) => {
    try {
      const f = State.filters;
      const mainCanvas = document.getElementById('main-canvas');
      
      // Calculate the fitted image display size (same logic as redraw())
      const W = mainCanvas.width;
      const H = mainCanvas.height;
      const ir = State.loadedImg.width / State.loadedImg.height;
      const cr = W / H;
      let dw, dh;
      if (ir > cr) { 
        dw = W; 
        dh = W / ir; 
      } else { 
        dh = H; 
        dw = H * ir; 
      }
      
      // Calculate blur scale ratio based on actual fitted image size
      // This ensures blur looks the same relative to image content
      const blurScale = State.origW / dw;
      
      // Detect retina/high-DPI display for debugging
      const devicePixelRatio = window.devicePixelRatio || 1;
      
      // Note: CSS blur() is already DPI-aware and operates in CSS pixels
      // We don't need to adjust for devicePixelRatio because both the display
      // and the blur are measured in CSS pixels, which abstract physical pixels
      
      // Debug logging
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[PXLS Export] BLUR CALIBRATION DATA');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[PXLS Export] Screen blur setting:', f.blur, 'px (CSS blur value)');
      console.log('[PXLS Export] Display canvas size:', W, 'x', H, 'CSS pixels');
      console.log('[PXLS Export] Fitted display size:', Math.round(dw), 'x', Math.round(dh), 'CSS pixels');
      console.log('[PXLS Export] Original image size:', State.origW, 'x', State.origH, 'physical pixels');
      console.log('[PXLS Export] Device pixel ratio:', devicePixelRatio, devicePixelRatio === 2 ? '(Retina)' : devicePixelRatio > 2 ? '(High-DPI)' : '(Standard)');
      console.log('[PXLS Export] Resolution scale:', blurScale.toFixed(3), 'x (full res / fitted display)');
      console.log('[PXLS Export] Blur multiplier:', BLUR_EXPORT_MULTIPLIER, '(adjustable constant)');
      console.log('───────────────────────────────────────────────────────────');
      
      // Create full resolution canvas
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = State.origW;
      exportCanvas.height = State.origH;
      const ctx = exportCanvas.getContext('2d');
      
      // Draw original image
      ctx.drawImage(State.loadedImg, 0, 0);
      console.log('[PXLS Export] Drew original image');
      
      // Apply pixel-level filters (brightness, contrast, saturation)
      if (f.brightness !== 0 || f.contrast !== 0 || f.saturation !== 0) {
        console.log('[PXLS Export] Applying brightness/contrast/saturation...');
        const id = ctx.getImageData(0, 0, exportCanvas.width, exportCanvas.height);
        const px = id.data;
        const br = f.brightness * 2.55;
        const cf = f.contrast !== 0 ? (259 * (f.contrast + 255)) / (255 * (259 - f.contrast)) : 1;
        const sf = (f.saturation + 100) / 100;
        for (let i = 0; i < px.length; i += 4) {
          let r = px[i], g = px[i + 1], b = px[i + 2];
          if (f.brightness !== 0) { r += br; g += br; b += br; }
          if (f.contrast !== 0)   { r = cf * (r - 128) + 128; g = cf * (g - 128) + 128; b = cf * (b - 128) + 128; }
          if (f.saturation !== 0) { const l = 0.299 * r + 0.587 * g + 0.114 * b; r = l + sf * (r - l); g = l + sf * (g - l); b = l + sf * (b - l); }
          px[i]   = Math.max(0, Math.min(255, r));
          px[i + 1] = Math.max(0, Math.min(255, g));
          px[i + 2] = Math.max(0, Math.min(255, b));
        }
        ctx.putImageData(id, 0, 0);
        console.log('[PXLS Export] Applied color filters');
      }
      
      // Apply Gaussian blur scaled to full resolution
      // Multiply by calibration constant to match CSS blur appearance
      if (f.blur > 0) {
        const scaledBlur = Math.round(f.blur * blurScale * BLUR_EXPORT_MULTIPLIER);
        console.log('[PXLS Export] Blur calculation:');
        console.log('  Formula: screenBlur × resolutionScale × multiplier');
        console.log('  Values:', f.blur, '×', blurScale.toFixed(3), '×', BLUR_EXPORT_MULTIPLIER);
        console.log('  Result:', scaledBlur, 'px (applied to full-res image)');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('[PXLS Export] Applying 3-pass box blur...');
        const blurred = applyGaussianBlur(exportCanvas, scaledBlur);
        console.log('[PXLS Export] ✓ Blur complete');
        console.log('═══════════════════════════════════════════════════════════');
        resolve(blurred);
      } else {
        console.log('[PXLS Export] No blur, returning canvas');
        resolve(exportCanvas);
      }
    } catch(e) {
      console.error('[PXLS Export] Error:', e);
      reject(e);
    }
  });
}

/**
 * Apply Gaussian blur to canvas using multiple box blur passes
 * Approximates true Gaussian blur for export
 * CSS blur(r) ≈ Gaussian with stdDev = r (approximately)
 */
function applyGaussianBlur(sourceCanvas, radius) {
  if (radius <= 0) return sourceCanvas;
  
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0);
  
  // CSS blur(r) uses Gaussian with stdDev ≈ r (W3C spec)
  // For 3 box blur passes to approximate Gaussian:
  // Each pass radius = sqrt((stdDev^2) / passes) = sqrt(r^2 / 3)
  const passes = 3;
  const stdDev = radius;
  const boxRadius = Math.ceil(Math.sqrt((stdDev * stdDev) / passes));
  
  console.log(`[PXLS Blur] Radius: ${radius}px → stdDev: ${stdDev} → box radius: ${boxRadius}px × ${passes} passes`);
  
  for (let pass = 0; pass < passes; pass++) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    const tempData = new Uint8ClampedArray(pixels);
    
    // Horizontal pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
        
        for (let kx = -boxRadius; kx <= boxRadius; kx++) {
          const px = x + kx;
          if (px >= 0 && px < width) {
            const idx = (y * width + px) * 4;
            rSum += pixels[idx];
            gSum += pixels[idx + 1];
            bSum += pixels[idx + 2];
            aSum += pixels[idx + 3];
            count++;
          }
        }
        
        const idx = (y * width + x) * 4;
        tempData[idx] = rSum / count;
        tempData[idx + 1] = gSum / count;
        tempData[idx + 2] = bSum / count;
        tempData[idx + 3] = aSum / count;
      }
    }
    
    // Vertical pass
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
        
        for (let ky = -boxRadius; ky <= boxRadius; ky++) {
          const py = y + ky;
          if (py >= 0 && py < height) {
            const idx = (py * width + x) * 4;
            rSum += tempData[idx];
            gSum += tempData[idx + 1];
            bSum += tempData[idx + 2];
            aSum += tempData[idx + 3];
            count++;
          }
        }
        
        const idx = (y * width + x) * 4;
        pixels[idx] = rSum / count;
        pixels[idx + 1] = gSum / count;
        pixels[idx + 2] = bSum / count;
        pixels[idx + 3] = aSum / count;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  return canvas;
}
