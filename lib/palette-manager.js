// ─────────────────────────────────────────────────────────────────────────────
// PALETTE MANAGER MODULE
// Manages draggable palettes, docking, collapse/expand, and position persistence
// ─────────────────────────────────────────────────────────────────────────────

const SNAP = 20; // Snap distance for edge docking
let gZ = 200;    // Global z-index counter

/**
 * Save palette position and collapsed state to localStorage
 * @param {string} id - Palette ID (api, search, colors, control)
 */
export function savePalettePos(id) {
  const el = document.getElementById('pal-' + id);
  if (!el) return;
  const state = {
    x: parseInt(el.style.left) || 0,
    y: parseInt(el.style.top) || 0,
    collapsed: el.querySelector('.pal-body').classList.contains('shut')
  };
  localStorage.setItem('pxls3_' + id, JSON.stringify(state));
}

/**
 * Restore all palette positions and states from localStorage
 */
export function restorePalettePositions() {
  ['api', 'search', 'colors', 'control'].forEach(id => {
    const el = document.getElementById('pal-' + id);
    if (!el) return;
    try {
      const s = JSON.parse(localStorage.getItem('pxls3_' + id) || 'null');
      if (!s) return;
      const x = Math.min(Math.max(0, s.x), window.innerWidth - 100);
      const y = Math.min(Math.max(0, s.y), window.innerHeight - 44);
      el.style.left = x + 'px';
      el.style.top  = y + 'px';
      if (s.collapsed) {
        el.querySelector('.pal-body').classList.add('shut');
        el.querySelector('.pal-body').style.maxHeight = '0';
        el.querySelector('.pal-coll').textContent = '▸';
      }
    } catch {}
  });
}

/**
 * Toggle palette collapse/expand state
 * @param {string} id - Palette ID (api, search, colors, control)
 */
export function toggleCollapse(id) {
  const body = document.getElementById('body-' + id);
  const btn  = document.getElementById('coll-' + id);
  const isShut = body.classList.toggle('shut');
  const heights = { api: '120px', search: '800px', colors: '380px', control: '380px' };
  body.style.maxHeight = isShut ? '0' : (heights[id] || '380px');
  btn.textContent = isShut ? '▸' : '▾';
  savePalettePos(id);
}

/**
 * Initialize drag-and-drop for all palettes
 * Call this once on page load
 */
export function initializePalettes() {
  document.querySelectorAll('.pal-bar').forEach(bar => {
    const palId = bar.id.replace('bar-', '');
    const pal   = document.getElementById('pal-' + palId);

    bar.addEventListener('mousedown', e => {
      if (e.target.closest('.pal-coll')) return;
      e.preventDefault();
      gZ++;
      pal.style.zIndex = gZ;

      const startX = e.clientX - parseInt(pal.style.left || 20);
      const startY = e.clientY - parseInt(pal.style.top || 70);

      function onMove(e) {
        let nx = e.clientX - startX;
        let ny = e.clientY - startY;
        const W = window.innerWidth, H = window.innerHeight;
        const pw = pal.offsetWidth;
        ny = Math.max(0, Math.min(H - 44, ny));

        let dock = null;
        if (nx <= SNAP)          { dock = 'l'; nx = 0; }
        else if (nx + pw >= W - SNAP) { dock = 'r'; nx = W - pw; }

        pal.style.left = nx + 'px';
        pal.style.top  = ny + 'px';
        pal.classList.toggle('dock-l', dock === 'l');
        pal.classList.toggle('dock-r', dock === 'r');
        document.getElementById('snap-l').classList.toggle('show', dock === 'l');
        document.getElementById('snap-r').classList.toggle('show', dock === 'r');
      }

      function onUp() {
        document.getElementById('snap-l').classList.remove('show');
        document.getElementById('snap-r').classList.remove('show');
        savePalettePos(palId);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup',   onUp);
      }

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup',   onUp);
    });

    pal.addEventListener('mousedown', () => { gZ++; pal.style.zIndex = gZ; });
  });
}
