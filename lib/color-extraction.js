// ─────────────────────────────────────────────────────────────────────────────
// COLOR EXTRACTION MODULE
// K-means clustering algorithm for extracting dominant colors from images
// ─────────────────────────────────────────────────────────────────────────────

import { State } from './state.js';
import { toast } from './ui.js';

/**
 * Convert RGB values to HSL
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {number[]} [hue (0-360), saturation (0-100), lightness (0-100)]
 */
export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * Format RGB color array as HSL array string
 * @param {number[][]} colors - Array of RGB colors [[r,g,b], ...]
 * @returns {string} Formatted string: "[hsl(...), hsl(...), ...]"
 */
export function formatHslArray(colors) {
  const hslColors = colors.map(([r, g, b]) => {
    const [h, s, l] = rgbToHsl(r, g, b);
    return `hsl(${h}, ${s}%, ${l}%)`;
  });
  return `[${hslColors.join(', ')}]`;
}

/**
 * Extract dominant colors from image data using k-means clustering
 * @param {ImageData} imageData - Canvas ImageData object
 * @param {number} k - Number of colors to extract (default: 4)
 * @param {number} maxIterations - Maximum k-means iterations (default: 10)
 * @returns {number[][]} Array of RGB colors [[r,g,b], ...]
 */
export function extractDominantColors(imageData, k = 4, maxIterations = 10) {
  const pixels = [];
  const data = imageData.data;
  
  // Sample pixels (every 10th pixel for performance)
  for (let i = 0; i < data.length; i += 40) {
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  
  if (pixels.length < k) return pixels;
  
  // Initialize centroids randomly
  let centroids = [];
  const used = new Set();
  while (centroids.length < k) {
    const idx = Math.floor(Math.random() * pixels.length);
    if (!used.has(idx)) {
      centroids.push([...pixels[idx]]);
      used.add(idx);
    }
  }
  
  // K-means iterations
  for (let iter = 0; iter < maxIterations; iter++) {
    const clusters = Array.from({ length: k }, () => []);
    
    // Assign pixels to nearest centroid
    pixels.forEach(pixel => {
      let minDist = Infinity;
      let clusterIdx = 0;
      centroids.forEach((centroid, i) => {
        const dist = Math.sqrt(
          Math.pow(pixel[0] - centroid[0], 2) +
          Math.pow(pixel[1] - centroid[1], 2) +
          Math.pow(pixel[2] - centroid[2], 2)
        );
        if (dist < minDist) {
          minDist = dist;
          clusterIdx = i;
        }
      });
      clusters[clusterIdx].push(pixel);
    });
    
    // Update centroids
    const newCentroids = clusters.map(cluster => {
      if (cluster.length === 0) return centroids[clusters.indexOf(cluster)];
      const sum = cluster.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]);
      return [Math.round(sum[0] / cluster.length), Math.round(sum[1] / cluster.length), Math.round(sum[2] / cluster.length)];
    });
    
    // Check convergence
    const converged = centroids.every((c, i) => 
      c[0] === newCentroids[i][0] && c[1] === newCentroids[i][1] && c[2] === newCentroids[i][2]
    );
    
    centroids = newCentroids;
    if (converged) break;
  }
  
  // Sort by luminance for consistent ordering
  return centroids.sort((a, b) => {
    const lumA = 0.299 * a[0] + 0.587 * a[1] + 0.114 * a[2];
    const lumB = 0.299 * b[0] + 0.587 * b[1] + 0.114 * b[2];
    return lumB - lumA;
  });
}

/**
 * Update extracted colors from canvas image region
 * @param {number} dx - X coordinate of image region
 * @param {number} dy - Y coordinate of image region
 * @param {number} dw - Width of image region
 * @param {number} dh - Height of image region
 */
export function updateExtractedColors(dx, dy, dw, dh) {
  const canvas = document.getElementById('main-canvas');
  if (!canvas || !State.loadedImg || dw <= 0 || dh <= 0) return;
  
  const ctx = canvas.getContext('2d');
  // Extract colors only from the image region, not the canvas background
  const imageData = ctx.getImageData(Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
  State.extractedColors = extractDominantColors(imageData, 4);
  displayExtractedColors();
}

/**
 * Display extracted colors in the UI with smooth transitions
 */
export function displayExtractedColors() {
  const container = document.getElementById('extracted-colors-grid');
  if (!container) return;
  
  // Get existing swatches or create new ones
  let swatches = container.querySelectorAll('.color-swatch');
  
  State.extractedColors.forEach((color, i) => {
    const [r, g, b] = color;
    const [h, s, l] = rgbToHsl(r, g, b);
    
    let colorDiv = swatches[i];
    if (!colorDiv) {
      // Create new swatch if it doesn't exist
      colorDiv = document.createElement('div');
      colorDiv.className = 'color-swatch';
      colorDiv.innerHTML = `
        <div class="color-info">
          <div class="color-label">Color ${i + 1}</div>
          <div class="color-value"></div>
        </div>
      `;
      container.appendChild(colorDiv);
    }
    
    // Update background color (will transition smoothly)
    colorDiv.style.background = `rgb(${r}, ${g}, ${b})`;
    
    // Update the HSL value text
    const valueEl = colorDiv.querySelector('.color-value');
    if (valueEl) valueEl.textContent = `hsl(${h}, ${s}%, ${l}%)`;
  });
  
  // Show copy button when colors are extracted
  document.getElementById('colors-copy-area').style.display = 'block';
}

/**
 * Copy extracted colors as HSL array to clipboard
 */
export function copyHslArray() {
  if (State.extractedColors.length === 0) {
    toast('No colors extracted yet');
    return;
  }
  
  const hslArray = formatHslArray(State.extractedColors);
  navigator.clipboard.writeText(hslArray).then(() => {
    toast('HSL array copied ✓');
  }).catch(() => {
    toast('Failed to copy');
  });
}

/**
 * Download extracted colors palette as PNG image
 */
export function downloadPaletteImage() {
  if (State.extractedColors.length === 0) {
    toast('No colors extracted yet');
    return;
  }
  
  // Create canvas for palette (4 color swatches side by side)
  const swatchWidth = 200;
  const swatchHeight = 200;
  const canvas = document.createElement('canvas');
  canvas.width = swatchWidth * 4;
  canvas.height = swatchHeight;
  
  const ctx = canvas.getContext('2d');
  
  // Draw each color swatch
  State.extractedColors.forEach((rgb, index) => {
    const x = index * swatchWidth;
    ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    ctx.fillRect(x, 0, swatchWidth, swatchHeight);
  });
  
  // Convert to blob and download
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pxls_palette_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Palette downloaded ✓');
  }, 'image/png');
}
