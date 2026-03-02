// ═════════════════════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════
// Central application state object
// All modules can import and modify this shared state

export const State = {
  // API & Search
  apiKey:    localStorage.getItem('pxls_ak') || '',
  results:   [],
  page:      1,
  hasMore:   false,
  searching: false,
  
  // Image & Canvas
  selPhoto:  null,
  loadedImg: null,       // HTMLImageElement
  origW:     0,
  origH:     0,
  
  // Filters
  filters:   { blur: 0, brightness: 0, contrast: 0, saturation: 0 },
  
  // UI
  theme:     localStorage.getItem('pxls_theme') || 'dark',
  rendering: false,
  
  // Color Extraction
  extractedColors: [], // Array of 4 dominant colors in RGB format [r,g,b]
};
