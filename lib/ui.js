// ═════════════════════════════════════════════════════════════════════════════
// UI UTILITIES
// ═════════════════════════════════════════════════════════════════════════════
// Toast notifications and theme management

import { State } from './state.js';

// ─────────────────────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────────────────────

// Store redraw callback (set by app.js to avoid circular dependency)
let _redrawCallback = null;

export function setRedrawCallback(callback) {
  _redrawCallback = callback;
}

export function toggleTheme() {
  State.theme = State.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('pxls_theme', State.theme);
  applyTheme(State.theme);
}

export function applyTheme(theme) {
  document.body.classList.remove('dark', 'light');
  document.body.classList.add(theme);
  document.getElementById('theme-btn').textContent = theme === 'dark' ? '☀' : '☾';
  
  // Redraw canvas to pick up new background color
  if (_redrawCallback) {
    _redrawCallback();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

let toastTimeout;

export function toast(message, duration = 2400) {
  const el = document.getElementById('toast');
  if (!el) return;
  
  clearTimeout(toastTimeout);
  el.textContent = message;
  el.classList.add('show');
  
  toastTimeout = setTimeout(() => {
    el.classList.remove('show');
  }, duration);
}
