// ─────────────────────────────────────────────────────────────────────────────
// CANVAS RENDERER MODULE
// Handles canvas drawing, filter application, and blur processing
// ─────────────────────────────────────────────────────────────────────────────

import { State } from './state.js';
import { updateExtractedColors } from './color-extraction.js';

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

  // Use an offscreen canvas to apply pixel filters
  const off = document.createElement('canvas');
  off.width  = Math.round(dw);
  off.height = Math.round(dh);
  const octx = off.getContext('2d', {
    alpha: true,
    colorSpace: 'srgb',
    willReadFrequently: false
  });
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
 * Render full-resolution image with filters for download
 * @returns {Promise<HTMLCanvasElement>} Canvas with processed image
 */
export function renderFullResolution() {
  return new Promise((resolve, reject) => {
    try {
      const f   = State.filters;
      const off = document.createElement('canvas');
      off.width  = State.origW;
      off.height = State.origH;
      const octx = off.getContext('2d', {
        alpha: true,
        colorSpace: 'srgb',
        willReadFrequently: false
      });
      octx.drawImage(State.loadedImg, 0, 0);

      if (f.brightness !== 0 || f.contrast !== 0 || f.saturation !== 0) {
        const id = octx.getImageData(0, 0, off.width, off.height);
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
        octx.putImageData(id, 0, 0);
      }

// Blur at full res
      // For Tauri/WebKit compatibility, use a manual blur algorithm instead of ctx.filter
      let finalCanvas = off;
      if (f.blur > 0) {
        // Apply manual box blur for export compatibility
        finalCanvas = applyBoxBlur(off, f.blur);
      }

      resolve(finalCanvas);
    } catch(e) {
      reject(e);
    }
  });
}

/**
 * Apply box blur to a canvas (compatible with all browsers including WebKit)
 * @param {HTMLCanvasElement} sourceCanvas - Source canvas
 * @param {number} radius - Blur radius in pixels
 * @returns {HTMLCanvasElement} Blurred canvas
 */
function applyBoxBlur(sourceCanvas, radius) {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const ctx = canvas.getContext('2d');
  
  // Draw source to new canvas
  ctx.drawImage(sourceCanvas, 0, 0);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  // Apply horizontal box blur
  const tempData = new Uint8ClampedArray(pixels);
  const r = Math.min(Math.ceil(radius / 2), 100); // Limit radius for performance
  
  // Horizontal pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
      
      for (let kx = -r; kx <= r; kx++) {
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
      
      for (let ky = -r; ky <= r; ky++) {
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
  
  // Put blurred image data back
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
