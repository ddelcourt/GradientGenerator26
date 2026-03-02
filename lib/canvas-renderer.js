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
  // To get clean edges, we apply blur to the padded canvas FIRST, then draw without additional filtering
  if (f.blur > 0) {
    // To avoid vignette effect at edges, render to a larger canvas with padding
    // Padding needs to be at least 2x the blur radius to prevent edge clipping
    const padding = Math.ceil(f.blur * 2.5);
    const blurCanvas = document.createElement('canvas');
    blurCanvas.width = Math.round(dw + padding * 2);
    blurCanvas.height = Math.round(dh + padding * 2);
    const bctx = blurCanvas.getContext('2d');
    
    // Fill with background color to avoid transparent edges
    bctx.fillStyle = bg;
    bctx.fillRect(0, 0, blurCanvas.width, blurCanvas.height);
    
    // Draw the filtered image with padding offset
    bctx.drawImage(off, padding, padding, dw, dh);
    
    // Apply blur to the padded canvas itself (this gives clean edges!)
    // For values > 200px, apply in multiple passes (browser limitation)
    const maxBlurPerPass = 200;
    let remainingBlur = f.blur;
    
    while (remainingBlur > 0) {
      const blurAmount = Math.min(remainingBlur, maxBlurPerPass);
      
      // Create temp canvas for this pass
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = blurCanvas.width;
      tempCanvas.height = blurCanvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(blurCanvas, 0, 0);
      
      // Clear and redraw with blur applied
      bctx.filter = `blur(${blurAmount}px)`;
      bctx.clearRect(0, 0, blurCanvas.width, blurCanvas.height);
      bctx.drawImage(tempCanvas, 0, 0);
      
      remainingBlur -= maxBlurPerPass;
    }
    bctx.filter = 'none';
    
    // Draw final pre-blurred result to main canvas (no additional filter needed!)
    ctx.drawImage(blurCanvas, padding, padding, dw, dh, dx, dy, dw, dh);
  } else {
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

      // Blur at full res using padded canvas to avoid edge vignette
      // To get clean edges, we apply blur to the padded canvas FIRST, then draw without additional filtering
      let finalCanvas = off;
      if (f.blur > 0) {
        const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
        const padding = Math.ceil(f.blur * 2.5);
        const blurCanvas = document.createElement('canvas');
        blurCanvas.width  = State.origW + padding * 2;
        blurCanvas.height = State.origH + padding * 2;
        const bctx = blurCanvas.getContext('2d');
        bctx.fillStyle = bg;
        bctx.fillRect(0, 0, blurCanvas.width, blurCanvas.height);
        bctx.drawImage(off, padding, padding);
        
        // Apply blur to the padded canvas itself (this gives clean edges!)
        // For values > 200px, apply in multiple passes (browser limitation)
        const maxBlurPerPass = 200;
        let remainingBlur = f.blur;
        
        while (remainingBlur > 0) {
          const blurAmount = Math.min(remainingBlur, maxBlurPerPass);
          
          // Create temp canvas for this pass
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = blurCanvas.width;
          tempCanvas.height = blurCanvas.height;
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.drawImage(blurCanvas, 0, 0);
          
          // Clear and redraw with blur applied
          bctx.filter = `blur(${blurAmount}px)`;
          bctx.clearRect(0, 0, blurCanvas.width, blurCanvas.height);
          bctx.drawImage(tempCanvas, 0, 0);
          
          remainingBlur -= maxBlurPerPass;
        }
        bctx.filter = 'none';
        
        // Draw final pre-blurred result to export canvas (no additional filter needed!)
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width  = State.origW;
        exportCanvas.height = State.origH;
        const ectx = exportCanvas.getContext('2d');
        ectx.drawImage(blurCanvas, padding, padding, State.origW, State.origH, 0, 0, State.origW, State.origH);
        finalCanvas = exportCanvas;
      }

      resolve(finalCanvas);
    } catch(e) {
      reject(e);
    }
  });
}
