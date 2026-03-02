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

    // Determine the fetch URL and headers based on environment
    let fetchUrl;
    let headers = {};
    
    console.log('[PXLS] Environment check:', {
      IS_TAURI: CONFIG.IS_TAURI,
      IS_LOCALHOST: CONFIG.IS_LOCALHOST,
      PROXY_BASE: CONFIG.PROXY_BASE,
      PROXY_SEARCH: CONFIG.PROXY_SEARCH
    });
    
    if (CONFIG.IS_TAURI) {
      // Tauri: Direct API access (no proxy needed)
      fetchUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=21&page=${p}`;
      headers = { 'Authorization': key };
      console.log('[PXLS] Using Tauri mode - direct API');
    } else if (CONFIG.IS_LOCALHOST) {
      // Localhost: Node.js proxy
      fetchUrl = `${CONFIG.PROXY_SEARCH}?query=${encodeURIComponent(query)}&per_page=21&page=${p}`;
      headers = { 'x-api-key': key };
      console.log('[PXLS] Using localhost mode - proxy');
    } else {
      // Production web: PHP proxy
      fetchUrl = `${CONFIG.PROXY_SEARCH}?action=search&query=${encodeURIComponent(query)}&per_page=21&page=${p}`;
      headers = { 'x-api-key': key };
      console.log('[PXLS] Using production mode - PHP proxy');
    }
    
    console.log('[PXLS] Fetch URL:', fetchUrl);
    console.log('[PXLS] Headers:', headers);
    
    const r = await fetch(fetchUrl, { headers });

    console.log('[PXLS] response status:', r.status, r.statusText);

    const d = await r.json();
    console.log('[PXLS] response body:', d);
    console.log('[PXLS] photos count:', d.photos?.length);

    if (!r.ok) throw new Error(`HTTP ${r.status}: ${d.error || r.statusText}`);
    if (d.error) throw new Error(d.error);

    // Randomize order of photos for variety
    const photos = d.photos || [];
    const shuffled = photos.sort(() => Math.random() - 0.5);
    
    console.log('[PXLS] Setting State.results, count:', shuffled.length);
    State.results = fresh ? shuffled : [...State.results, ...shuffled];
    State.page    = fresh ? p + 1 : p + 1;  // Track next page for "load more"
    State.hasMore = !!d.next_page;
    console.log('[PXLS] State.results now has:', State.results.length, 'photos');

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
  console.log('[PXLS] renderResults called, State.results.length:', State.results.length);
  const area = document.getElementById('results-area');
  if (State.results.length === 0) {
    area.innerHTML = '<div class="empty"><span class="eico">⊡</span>No results yet</div>';
    console.log('[PXLS] No results to render');
    return;
  }

  console.log('[PXLS] Rendering', State.results.length, 'results');
  let html = '<div class="tgrid">';
  State.results.forEach(p => {
    const sel = State.selPhoto?.id === p.id ? ' sel' : '';
    
    // Determine image URL based on environment
    let imgUrl;
    if (CONFIG.IS_TAURI) {
      // Tauri: Use direct Pexels image URLs (no proxy needed)
      imgUrl = p.src.small;
    } else if (CONFIG.IS_LOCALHOST) {
      // Localhost: Node.js proxy
      imgUrl = `${CONFIG.PROXY_IMAGE}?url=${encodeURIComponent(p.src.small)}`;
    } else {
      // Production web: PHP proxy
      imgUrl = `${CONFIG.PROXY_IMAGE}?action=img&url=${encodeURIComponent(p.src.small)}`;
    }
    
    html += `
      <div class="titem${sel}" data-photo-id="${p.id}" title="${p.photographer}">
        <img src="${imgUrl}" loading="lazy" alt="" crossorigin="anonymous"/>
        <div class="tov"><span class="tauth">${p.photographer}</span></div>
      </div>`;
  });
  html += '</div>';

  if (State.hasMore) {
    html += `<div class="lmrow">
      <button class="abtn sec" data-action="load-more" style="width:100%">Load more</button>
    </div>`;
  }

  area.innerHTML = html;

  // Add event delegation for dynamically created elements
  area.addEventListener('click', (e) => {
    // Handle thumbnail clicks
    const thumbnail = e.target.closest('.titem[data-photo-id]');
    if (thumbnail) {
      const photoId = parseInt(thumbnail.getAttribute('data-photo-id'), 10);
      selectPhoto(photoId);
      return;
    }

    // Handle "Load more" button
    const loadMoreBtn = e.target.closest('[data-action="load-more"]');
    if (loadMoreBtn) {
      doSearch(false, loadImageFn);
      return;
    }
  });

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
