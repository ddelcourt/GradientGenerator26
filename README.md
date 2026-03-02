# PXLS Image Editor

A modular browser-based image editor for searching and editing Pexels stock photos with real-time filters.

## 🎨 Features

- **Image Search** - Search Pexels API for stock photos
- **Real-time Filters** - Blur, brightness, contrast, saturation
- **Color Extraction** - K-means algorithm extracts 4 dominant colors
- **High-Quality Export** - Download as 32-bit RGBA PNG at original resolution
- **Slideshow Mode** - Auto-advance through images with smart pause
- **Image Cache** - In-memory cache for instant navigation
- **Dark/Light Theme** - Toggle UI themes
- **Draggable Palettes** - Snap-to-edge UI panels
- **Keyboard Shortcuts** - Tab, Enter, Esc, R, Arrow keys

## 🚀 Quick Start

### Prerequisites

- Node.js (for local development proxy) OR PHP 7.0+ (alternative)
- Pexels API key ([Get one free here](https://www.pexels.com/api/))

### Local Development

**Option 1: Node.js Proxy**
```bash
# 1. Start the proxy server
node proxy.js

# 2. Open index.html in your browser (via Live Server or local web server)
# VS Code: Use Live Server extension
# Or: python -m http.server 8000
```

**Option 2: PHP Built-in Server**
```bash
# Runs proxy and web server together
php -S localhost:8000
```

### Configuration

1. **Copy config template:**
   ```bash
   cp lib/config.js.example lib/config.js
   ```

2. **Option A: Use encrypted API key (recommended for deployment)**
   ```bash
   node encrypt-key.js "your-pexels-api-key"
   # Copy the encrypted output to lib/config.js
   ```

3. **Option B: Enter API key in the app UI**
   - Leave `lib/config.js` API constant as empty string
   - Enter key in the app's API Key palette

## 📦 Project Structure

```
├── index.html              # Main HTML file
├── app.js                  # Application entry point
├── proxy.js               # Node.js CORS proxy (local dev)
├── proxy.php              # PHP CORS proxy (production)
├── css/
│   └── style.css          # Application styles
├── lib/                   # Modular ES6 libraries
│   ├── state.js          # Central state management
│   ├── config.js         # Configuration (create from .example)
│   ├── ui.js             # Theme and toast utilities
│   ├── color-extraction.js # K-means color algorithm
│   ├── palette-manager.js  # Draggable UI palettes
│   ├── image-search.js     # Pexels API integration
│   ├── canvas-renderer.js  # Canvas rendering pipeline
│   ├── image-control.js    # Image operations + cache
│   └── slideshow.js        # Auto-advance slideshow
└── README.md              # This file
```

## 🌐 Production Deployment

### Apache/Shared Hosting

1. Upload all files to your web server (FTP/SFTP)
2. Ensure `proxy.php` is included in the root folder
3. PHP 7.0+ should be enabled (standard on most hosting)
4. App auto-detects production mode and uses PHP proxy

**Files to upload:**
- `index.html`
- `app.js`
- `proxy.php` ⭐ (Important!)
- `css/` folder
- `lib/` folder (with your configured `config.js`)

**Do NOT upload:**
- `proxy.js` (Node.js version, not needed)
- `encrypt-key.js` (development tool)
- `node_modules/` (if any)
- `Documentation/` (keep private)
- `_ bak/` (backup files)

### Requirements

- ✅ PHP 7.0+ (standard on Apache hosting)
- ✅ `cURL` extension OR `allow_url_fopen` enabled (usually default)
- ✅ No Apache configuration needed

## ⌨️ Keyboard Shortcuts

- `Enter` - Toggle fullscreen
- `Tab` - Hide/show UI
- `R` - Reset all filters
- `Esc` - Exit fullscreen
- `←` `→` - Navigate images

## 🎯 Feature Highlights

### Auto-Detection Proxy System
- **Localhost** → Uses Node.js proxy (`proxy.js`)
- **Production** → Uses PHP proxy (`proxy.php`)
- Seamless environment detection

### Image Cache
- In-memory cache for instant loading
- Clears on: app start, new search, window close
- No disk clutter

### Slideshow Mode
- 10-second auto-advance
- Smart pause: pauses on filters, continues on navigation
- Resumes automatically

### Color Extraction
- K-means clustering algorithm
- Extracts 4 dominant colors
- Copy as HSL array to clipboard

## 🔧 Tech Stack

- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Canvas API**: Image manipulation and filters
- **Proxy**: Node.js (dev) + PHP (production)
- **Storage**: LocalStorage for preferences
- **Architecture**: Modular ES6 with dependency injection

## 📄 License

This project is for personal/educational use. Respect Pexels API terms of service.

## 🙏 Credits

- Photos from [Pexels](https://www.pexels.com/)
- Built with vanilla JavaScript
