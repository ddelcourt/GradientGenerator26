# PXLS Editor

A native desktop app for browsing, editing, and exporting stunning Pexels stock photos with real-time filters and color extraction.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📖 Table of Contents

- [How to Use](#-how-to-use)
  - [Installation](#installation)
  - [Getting Started](#getting-started)
  - [Features Guide](#features-guide)
  - [Keyboard Shortcuts](#keyboard-shortcuts)
- [Project Architecture](#-project-architecture)
- [For Developers](#-for-developers)
  - [Requirements](#requirements)
  - [Building from Source](#building-from-source)
  - [Project Structure](#project-structure)
  - [Tech Stack](#tech-stack)

---

## 🎯 How to Use

### Installation

#### macOS
1. Download `PXLS Editor_1.0.0_universal.dmg`
2. Double-click the DMG file
3. Drag **PXLS Editor** to your Applications folder
4. Launch from Applications (works on both Intel & Apple Silicon Macs)

#### Windows
1. Download the `.msi` installer or `.exe` portable version
2. Run the installer and follow the prompts
3. Launch **PXLS Editor** from Start Menu

#### Linux
1. Download the `.deb` (Debian/Ubuntu) or `.AppImage` (universal)
2. For `.deb`: `sudo dpkg -i PXLS-Editor_1.0.0_amd64.deb`
3. For `.AppImage`: Make executable and run: `chmod +x *.AppImage && ./PXLS*.AppImage`

### Getting Started

#### First Launch

When you first open PXLS Editor, the app comes with a built-in encrypted API key. It might be revoked, the API key is allowed 20'000 requests per month globally. You can use your personal Pexels API Key if that limit is reached.

#### Basic Workflow

1. **Search for Images**
   - Type your search term (e.g., "sunset", "forest", "city")
   - Press **Enter** or click **Go**
   - Browse thumbnail results

2. **Select an Image**
   - Click any thumbnail to load it full-screen
   - Navigate with **arrow keys** or **on-screen arrows**

3. **Apply Filters**
   - Adjust **Blur**, **Brightness**, **Contrast**, **Saturation**.
   - Changes apply in real-time.
   - Reset individual filters or press **R** to reset all.

4. **Extract Colors**
   - **Extracted Colors** palette will analyze dominant colors.
   - **Copy as HSL** to clipboard for use in design tools.
   - Or downlaod image palette for color picker.

5. **Export**
   - Click **Download Image**
   - Saves full-resolution PNG with all filters applied
   - Original quality preserved with filters baked in

---

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Toggle fullscreen mode |
| `Tab` | Hide/show all UI panels |
| `R` | Reset all filters to default |
| `Esc` | Exit fullscreen |
| `←` `→` | Navigate previous/next image |

---

### Features

#### 🔍 **Image Search**
- Image source photos are retrieved from Pexels
- Navigate results with thumbnail grid, mouse-click, keyboard left and right arrows

#### 🎨 **Real-Time Filters**
- **Blur** - Gaussian blur effect
- **Brightness** - Lighten or darken
- **Contrast** - Adjust contrast
- **Saturation** - Color intensity

#### 🌈 **Color Extraction**
- Uses K-means clustering algorithm
- Extracts 4 dominant colors from current image
- ClickCopy color palettes as HSL array
- Download color palette as a PNG image

#### 📥 **Export**
- **High Quality**: Full original resolution
- **32-bit RGBA PNG**: Lossless format
- **Filters Applied**: Adjustments are baked into export
- **Processing**: Quality blur algorithm

#### 🎬 **Slideshow as auto-mode**
- **Auto-advances** through search results every 10 seconds if you don't interact with image
- **Pause**: Automatically pauses when you adjust filters
- **Auto-Resume**: Continues when you select a new image

#### 🎭 **Themes**
- **Dark Mode** as (default) / **Light Mode**

#### 🖱️ **Palettes**
- All UI panels can be dragged around
- Snap to screen edges automatically (soon)
- Collapse/expand

---

## 🏗️ Project Architecture

### Overview

PXLS Editor is built as a **native desktop application** using Tauri, combining a Rust backend with a modular JavaScript frontend.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PXLS Editor (Tauri App)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐         ┌────────────────────────┐    │
│  │   Rust Backend  │◄────────┤   JavaScript Frontend   │    │
│  │   (Tauri Core)  │         │   (ES6 Modules)         │    │
│  └────────┬────────┘         └───────────┬────────────┘    │
│           │                               │                  │
│           │ • File System Access          │                  │
│           │ • Native Dialogs              │ • Canvas API     │
│           │ • Window Management           │ • DOM Rendering  │
│           │                               │ • Event Handling │
│           │                               │                  │
│  ┌────────▼──────────────────────────────▼────────────┐    │
│  │              WebKit/WebView2                        │    │
│  │        (Native OS Browser Engine)                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │    Pexels API         │
            │  (External Service)   │
            └───────────────────────┘
```

### Frontend Modules

The frontend is organized into focused, reusable ES6 modules:

#### **Core Modules**

- **`app.js`** - Application entry point, initialization
- **`lib/state.js`** - Centralized state management
- **`lib/config.js`** - Configuration and encrypted API key

#### **API & Data**

- **`lib/api-key-decrypt.js`** - Isolated API key decryption (XOR + Base64)
- **`lib/image-search.js`** - Pexels API integration
- **`lib/image-control.js`** - Image loading, caching (LRU), keyboard controls

#### **Rendering & Effects**

- **`lib/canvas-renderer.js`** - Canvas rendering pipeline, filter application
  - CSS filters for real-time display (GPU-accelerated)
  - 3-pass box blur for exports (CPU, approximates Gaussian)
  - Resolution scaling for high-quality exports
- **`lib/color-extraction.js`** - K-means clustering for dominant colors

#### **UI Components**

- **`lib/ui.js`** - Theme system, toast notifications
- **`lib/palette-manager.js`** - Draggable palette system (snap-to-edge)
- **`lib/slideshow.js`** - Auto-advance slideshow with smart pause

### Data Flow

```
User Input → State Update → Canvas Render → Visual Feedback
     ↓            ↓              ↓              ↓
Keyboard    State Module   Renderer Module   DOM Update
Mouse       (state.js)     (canvas-        (ui updates)
Events                     renderer.js)
```

### Memory Management

- **LRU Cache**: Stores up to 10 images in memory
- **Automatic Cleanup**: Removes old images when limit reached
- **Reusable Canvas**: Single offscreen canvas for all export operations
- **Event Listener Management**: Proper cleanup to prevent memory leaks

### Security

- **Content Security Policy (CSP)**: No inline scripts or eval
- **API Key Encryption**: XOR cipher + Base64 (obfuscation, not cryptographic)
- **Isolated Decryption Module**: Prevents accidental breakage during development

---

## 👨‍💻 For Developers

### Requirements

#### Desktop App Development

- **Node.js** 18+ and npm
- **Rust** 1.70+ (`rustup` recommended)
- **Tauri CLI** (installed via npm)

#### Platform-Specific

**macOS**:
- Xcode Command Line Tools: `xcode-select --install`
- Both targets for Universal Binary:
  ```bash
  rustup target add aarch64-apple-darwin  # Apple Silicon
  rustup target add x86_64-apple-darwin   # Intel
  ```

**Windows**:
- Visual Studio with C++ tools
- WebView2 (usually pre-installed on Windows 10/11)

**Linux**:
- Build essentials: `build-essential`, `libwebkit2gtk-4.0-dev`, `libssl-dev`, `libgtk-3-dev`

### Building from Source

#### Clone Repository

```bash
git clone <repository-url>
cd GradientGenerator26
npm install
```

#### Development Mode

Fast iteration with hot-reload:

```bash
npm run dev
# or
npm run tauri:dev
```

#### Production Builds

**macOS Universal Binary** (Intel + Apple Silicon):
```bash
npm run build
# Output: src-tauri/target/universal-apple-darwin/release/bundle/macos/PXLS Editor.app
```

**DMG Installer**:
```bash
npm run build:dmg
# Output: src-tauri/target/universal-apple-darwin/release/bundle/dmg/PXLS Editor_1.0.0_universal.dmg
```

**Debug Build** (faster compilation):
```bash
npm run build:debug
# Output: src-tauri/target/debug/bundle/macos/PXLS Editor.app
```

**Windows**:
```bash
npm run build
# Outputs: .msi installer and .exe in src-tauri/target/release/bundle/
```

**Linux**:
```bash
npm run build
# Outputs: .deb and .AppImage in src-tauri/target/release/bundle/
```

### Project Structure

```
PXLS-Editor/
├── index.html                 # Main HTML structure
├── app.js                     # Application entry point
├── package.json               # npm scripts & dependencies
│
├── src-tauri/                 # Tauri (Rust) backend
│   ├── src/
│   │   └── main.rs           # Rust backend code
│   ├── tauri.conf.json       # Tauri configuration
│   ├── Cargo.toml            # Rust dependencies
│   └── icons/                # App icons (all platforms)
│
├── css/                       # Modular stylesheets
│   ├── main.css              # Import hub (loads all modules)
│   ├── theme.css             # CSS variables (dark/light themes)
│   ├── base.css              # HTML/body base styles
│   ├── canvas.css            # Canvas and placeholder
│   ├── palette.css           # Draggable palette system
│   ├── components.css        # UI components (thumbnails, colors, filters)
│   └── utilities.css         # Helper classes
│
├── lib/                       # JavaScript ES6 modules
│   ├── state.js              # Central state management
│   ├── config.js             # Configuration (API key)
│   ├── api-key-decrypt.js    # Isolated decryption module
│   ├── ui.js                 # Theme & toast utilities
│   ├── palette-manager.js    # Draggable UI palettes
│   ├── image-search.js       # Pexels API integration
│   ├── canvas-renderer.js    # Canvas rendering + filters
│   ├── image-control.js      # Image ops + LRU cache
│   ├── color-extraction.js   # K-means color algorithm
│   └── slideshow.js          # Auto-advance slideshow
│
├── scripts/                   # Build automation
│   ├── build-production.sh   # Production build script
│   ├── build-debug.sh        # Debug build script
│   ├── build-with-dmg.sh     # DMG installer build
│   └── dev.sh                # Development mode
│
└── dist/                      # Build output (generated)
    ├── index.html
    ├── app.js
    ├── css/
    └── lib/
```

### Tech Stack

#### Frontend
- **Vanilla JavaScript** (ES6 modules) - No frameworks, pure web standards
- **Canvas API** - Image manipulation and rendering
- **CSS3** - Modern layouts (Flexbox, Grid), animations
- **LocalStorage** - Preferences persistence

#### Backend
- **Rust** - High-performance, memory-safe backend
- **Tauri** - Native desktop framework
  - **WebKit** (macOS/Linux) or **WebView2** (Windows)
  - ~5MB overhead vs Electron's ~150MB

#### Algorithms
- **K-means Clustering** - Color extraction (optimized convergence)
- **3-Pass Box Blur** - Export blur (Central Limit Theorem approximation)
- **LRU Cache** - Efficient image memory management

#### Build Tools
- **npm** - Package management & scripts
- **Cargo** - Rust compilation & dependencies
- **Tauri CLI** - Cross-platform bundling

### Configuration

#### API Key Setup

**For Distribution** with obfuscated API key:

```bash
# 1. Encrypt your Pexels API key
node encrypt-key.js "your-pexels-api-key-here"

# 2. Copy-paste the encrypted output to lib/config.js
export const API = '...';

# \ API key palette will hide in builds
```

**For Development** (manual entry):
```javascript
// lib/config.js
export const API = ''; // Leave empty
// Users enter key in app's API palette
```

#### Blur Export Calibration

The blur multiplier can be adjusted if export blur doesn't match display:

```javascript
// lib/canvas-renderer.js (line 18)
const BLUR_EXPORT_MULTIPLIER = 1.25; // Adjust 1.0-2.5 as needed
```

### NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development mode with hot-reload |
| `npm run build` | Production build (optimized, universal binary on macOS) |
| `npm run build:debug` | Debug build (faster compilation, larger file) |
| `npm run build:dmg` | Build DMG installer (macOS) |
| `npm run tauri:dev` | Tauri development mode (same as `dev`) |
| `npm run tauri:build` | Direct Tauri build command |

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

### Testing

Test the built app:

```bash
# macOS
open "src-tauri/target/universal-apple-darwin/release/bundle/macos/PXLS Editor.app"

# Windows
start "src-tauri/target/release/bundle/msi/PXLS Editor_1.0.0_x64_en-US.msi"

# Linux
./src-tauri/target/release/bundle/appimage/pxls-editor_1.0.0_amd64.AppImage
```

Check for:
- ✅ API key auto-detects (palette hidden)
- ✅ Image search works
- ✅ Filters apply correctly
- ✅ Export produces correct resolution and quality
- ✅ Memory usage stable after 20+ images

---

## 📄 License

MIT License - Free for personal and commercial use.

## 🙏 Credits

- **Photos**: [Pexels](https://www.pexels.com/) - Free stock photos
- **Framework**: [Tauri](https://tauri.app/) - Native desktop framework
- **Built with**: Rust + Vanilla JavaScript

## 📞 Support

- **Issues**: [GitHub Issues](repository-url/issues)
- **Documentation**: [Tauri Docs](https://tauri.app/v1/guides/)
- **Pexels API**: [API Documentation](https://www.pexels.com/api/documentation/)

---

**Made with patience using Rust and JavaScript**
