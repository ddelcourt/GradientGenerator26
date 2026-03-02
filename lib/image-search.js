// ─────────────────────────────────────────────────────────────────────────────
// IMAGE SEARCH MODULE
// Pexels API integration for searching and selecting photos
// ─────────────────────────────────────────────────────────────────────────────

import { State } from './state.js';
import { API, CONFIG } from './config.js';
import { toast } from './ui.js';
import { decodeHardcodedKey } from './obfuscate.js';
import { clearImageCache } from './image-control.js';

/**
 * Get the actual API key (decrypt if hardcoded, otherwise use user input)
 * @returns {string} API key
 */
function getApiKey() {
  // If there's a hardcoded encrypted key, use that
  if (API) {
    try {
      return decodeHardcodedKey(API);
    } catch (e) {
      console.error('Failed to decrypt hardcoded API key:', e);
    }
  }
  
  // Otherwise use the key from input/localStorage
  return document.getElementById('api-key')?.value.trim() || State.apiKey || '';
}

/**
 * Save API key to state and localStorage with validation
 * @param {string} rawValue - Raw API key input
 */
export function saveApiKey(rawValue) {
  // Strip anything that isn't plain ASCII printable (32-126)
  // Catches em-dashes, smart quotes, newlines, zero-width chars, etc.
  const clean = rawValue.split('').filter(c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) <= 126).join('').trim();
  const input = document.getElementById('api-key');
  if (clean !== rawValue) input.value = clean;
  State.apiKey = clean;
  localStorage.setItem('pxls_ak', clean);
  
  // Show length hint
  let hint = document.getElementById('key-hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.id = 'key-hint';
    hint.style.cssText = 'font-size:10px;margin-top:4px;text-align:right;transition:color .2s';
    input.closest('.irow').insertAdjacentElement('afterend', hint);
  }
  
  if (clean.length === 0) {
    hint.textContent = '';
  } else if (clean.length < 30) {
    hint.style.color = 'var(--dng)';
    hint.textContent = clean.length + ' chars — key looks too short';
  } else {
    hint.style.color = 'var(--tx3)';
    hint.textContent = clean.length + ' chars ✓';
  }
}

/**
 * Search for photos on Pexels
 * @param {boolean} fresh - If true, start new search; if false, load more results
 * @param {Function} loadImageCallback - Callback to load image after selection
 */
export async function doSearch(fresh = true, loadImageCallback = null) {
  // Get API key (decrypted if hardcoded, otherwise from user input)
  const key   = getApiKey();
  const query = document.getElementById('search-query').value.trim();

  if (!key)   { toast('Paste your Pexels API key first'); return; }
  if (!query) { toast('Enter a search term'); return; }

  // Clear cache on new search (fresh === true)
  if (fresh) {
    clearImageCache();
  }

  // For fresh searches, randomly pick from first 10 pages to get variety
  const p = fresh ? Math.floor(Math.random() * 10) + 1 : State.page;
  State.searching = true;
  document.getElementById('search-btn').disabled = true;
  document.getElementById('search-btn').textContent = '…';
  if (fresh) { State.results = []; renderResults(loadImageCallback); }

  try {
    console.log('[PXLS] fetching:', query, '| key length:', key.length, '| page:', p);

    // Route through proxy (avoids CORS — see proxy.js or proxy.php)
    const proxyUrl = CONFIG.IS_LOCALHOST
      ? `${CONFIG.PROXY_SEARCH}?query=${encodeURIComponent(query)}&per_page=21&page=${p}`
      : `${CONFIG.PROXY_SEARCH}?action=search&query=${encodeURIComponent(query)}&per_page=21&page=${p}`;
    
    const r = await fetch(proxyUrl, { headers: { 'x-api-key': key } });

    console.log('[PXLS] response status:', r.status, r.statusText);

    const d = await r.json();
    console.log('[PXLS] response body:', d);

    if (!r.ok) throw new Error(`HTTP ${r.status}: ${d.error || r.statusText}`);
    if (d.error) throw new Error(d.error);

    // Randomize order of photos for variety
    const photos = d.photos || [];
    const shuffled = photos.sort(() => Math.random() - 0.5);
    
    State.results = fresh ? shuffled : [...State.results, ...shuffled];
    State.page    = fresh ? p + 1 : p + 1;  // Track next page for "load more"
    State.hasMore = !!d.next_page;

  } catch(e) {
    console.error('[PXLS] fetch error:', e);
    toast('Error: ' + e.message, 4000);
  }

  State.searching = false;
  document.getElementById('search-btn').disabled = false;
  document.getElementById('search-btn').textContent = 'Go';
  renderResults(loadImageCallback);
}

/**
 * Render search results in the UI
 * @param {Function} loadImageCallback - Callback to load image after selection
 */
export function renderResults(loadImageCallback = null) {
  const area = document.getElementById('results-area');
  if (State.results.length === 0) {
    area.innerHTML = '<div class="empty"><span class="eico">⊡</span>No results yet</div>';
    return;
  }

  let html = '<div class="tgrid">';
  State.results.forEach(p => {
    const sel = State.selPhoto?.id === p.id ? ' sel' : '';
    const imgProxyUrl = CONFIG.IS_LOCALHOST
      ? `${CONFIG.PROXY_IMAGE}?url=${encodeURIComponent(p.src.small)}`
      : `${CONFIG.PROXY_IMAGE}?action=img&url=${encodeURIComponent(p.src.small)}`;
    
    html += `
      <div class="titem${sel}" onclick="selectPhoto(${p.id})" title="${p.photographer}">
        <img src="${imgProxyUrl}" loading="lazy" alt="" crossorigin="anonymous"/>
        <div class="tov"><span class="tauth">${p.photographer}</span></div>
      </div>`;
  });
  html += '</div>';

  if (State.hasMore) {
    html += `<div class="lmrow">
      <button class="abtn sec" style="width:100%" onclick="doSearch(false)">Load more</button>
    </div>`;
  }

  area.innerHTML = html;

  // Store photos by id for retrieval
  window._photos = window._photos || {};
  State.results.forEach(p => { window._photos[p.id] = p; });
  
  // Store the callback for selectPhoto to use
  if (loadImageCallback) {
    window._loadImageCallback = loadImageCallback;
  }
}

/**
 * Select a photo from search results
 * @param {number} id - Pexels photo ID
 */
export function selectPhoto(id) {
  const photo = window._photos[id];
  if (!photo) return;
  State.selPhoto = photo;
  renderResults(); // re-render to show selection
  
  // Call the loadImage callback if available
  if (window._loadImageCallback) {
    window._loadImageCallback(photo.src.large2x);
  }
  
  // Show navigation arrows when image is loaded
  document.body.classList.add('has-image');
}

/**
 * Navigate to next/previous photo in results
 * @param {number} direction - Direction to navigate (-1 for prev, 1 for next)
 */
export function navigatePhoto(direction) {
  if (!State.selPhoto || State.results.length === 0) return;
  
  const currentIndex = State.results.findIndex(p => p.id === State.selPhoto.id);
  if (currentIndex === -1) return;
  
  let newIndex = currentIndex + direction;
  if (newIndex < 0) newIndex = State.results.length - 1; // wrap to end
  if (newIndex >= State.results.length) newIndex = 0; // wrap to start
  
  selectPhoto(State.results[newIndex].id);
}
