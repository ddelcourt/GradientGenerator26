// proxy.js — run with: node proxy.js
// Handles two routes:
//   GET /search?query=...   → forwards to Pexels API (needs x-api-key header)
//   GET /img?url=...        → proxies any images.pexels.com image (no auth needed)

const http  = require('http');
const https = require('https');

const PORT = 3131;

http.createServer((req, res) => {

  // CORS headers on every response
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // ── /search  ─────────────────────────────────────────────────────────────
  if (url.pathname === '/search') {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) { res.writeHead(400); res.end(JSON.stringify({ error: 'Missing x-api-key header' })); return; }

    const pexelsUrl = `https://api.pexels.com/v1/search${url.search}`;
    console.log('[proxy] API →', pexelsUrl);

    https.get(pexelsUrl, { headers: { Authorization: apiKey } }, pres => {
      console.log('[proxy] API ←', pres.statusCode);
      res.writeHead(pres.statusCode, { 'Content-Type': 'application/json' });
      pres.pipe(res);
    }).on('error', e => {
      console.error('[proxy] API error:', e.message);
      res.writeHead(502); res.end(JSON.stringify({ error: e.message }));
    });
    return;
  }

  // ── /img  ─────────────────────────────────────────────────────────────────
  if (url.pathname === '/img') {
    const imgUrl = url.searchParams.get('url');
    if (!imgUrl) { res.writeHead(400); res.end('Missing url param'); return; }

    // Only allow pexels image domains for safety
    let parsed;
    try { parsed = new URL(imgUrl); } catch { res.writeHead(400); res.end('Bad url'); return; }
    if (!parsed.hostname.endsWith('pexels.com')) {
      res.writeHead(403); res.end('Only pexels.com images allowed'); return;
    }

    console.log('[proxy] IMG →', imgUrl);

    https.get(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, pres => {
      console.log('[proxy] IMG ←', pres.statusCode, parsed.pathname.slice(0,50));
      const ct = pres.headers['content-type'] || 'image/jpeg';
      res.writeHead(pres.statusCode, {
        'Content-Type': ct,
        'Cache-Control': 'public, max-age=86400',  // cache images for 1 day
      });
      pres.pipe(res);
    }).on('error', e => {
      console.error('[proxy] IMG error:', e.message);
      res.writeHead(502); res.end('Image fetch failed');
    });
    return;
  }

  res.writeHead(404); res.end('Not found');

}).listen(PORT, () => {
  console.log(`\nPexels proxy running at http://localhost:${PORT}`);
  console.log(`Routes:`);
  console.log(`  GET /search?query=...  — Pexels API (send x-api-key header)`);
  console.log(`  GET /img?url=...       — image proxy (no auth needed)\n`);
});
