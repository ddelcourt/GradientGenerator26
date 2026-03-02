# Tauri Desktop Application Setup

## Overview

PXLS Editor is now structured for **Tauri** compilation, allowing you to build native desktop applications for macOS, Windows, and Linux.

## What is Tauri?

Tauri is a framework for building lightweight, secure desktop applications using web technologies (HTML, CSS, JavaScript) with a Rust backend. Unlike Electron, Tauri:
- Uses the system's native webview (smaller bundle size)
- Has a more secure architecture
- Produces faster, more efficient applications

## Project Structure

```
GradientGenerator26/
├── src-tauri/               # Tauri/Rust backend
│   ├── Cargo.toml          # Rust dependencies
│   ├── tauri.conf.json     # Tauri configuration
│   ├── build.rs            # Build script
│   ├── src/
│   │   └── main.rs         # Rust backend entry point
│   └── icons/              # Application icons (create these)
├── index.html              # Web frontend (entry point)
├── app.js                  # Application logic
├── css/                    # Stylesheets
├── lib/                    # ES6 modules
├── package.json            # NPM scripts for Tauri
└── .gitignore              # Updated with Tauri ignores
```

## Prerequisites

### 1. Install Rust
```bash
# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Follow the prompts to complete installation
# Restart your terminal after installation
```

### 2. Install Tauri CLI
```bash
npm install --save-dev @tauri-apps/cli
```

### 3. Install System Dependencies

**macOS:**
```bash
xcode-select --install
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.0-dev \
  build-essential \
  curl \
  wget \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

**Windows:**
- Install [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- Install [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/#download-section)

## Configuration

### API Key Setup

**IMPORTANT**: Before building, you must configure your Pexels API key:

1. Copy `lib/config.js.example` to `lib/config.js`
2. Add your API key:
```javascript
export const API = 'your_pexels_api_key_here';
```

Or use the encrypted approach (see `Documentation/API_KEY_OBFUSCATION.md`)

### Tauri Configuration

The app is pre-configured in `src-tauri/tauri.conf.json` with:
- **Window size**: 1400×900 (min 800×600)
- **Security**: CSP configured for Pexels API access
- **Permissions**: Minimal permissions (window control, shell open)
- **Bundle ID**: `com.pxls.editor`

## Development

### Run in Development Mode
```bash
npm run tauri:dev
```

This will:
1. Start the Tauri development window
2. Enable hot-reload for web changes
3. Open DevTools automatically (in debug builds)

### Development Tips
- Web changes auto-reload
- Rust changes require restart
- Use `console.log()` for frontend debugging
- Check terminal for backend logs

## Building

### Production Build
```bash
npm run tauri:build
```

This creates optimized binaries in `src-tauri/target/release/bundle/`:
- **macOS**: `.app` bundle and `.dmg` installer
- **Windows**: `.exe` and `.msi` installer
- **Linux**: `.deb`, `.AppImage`, or `.rpm`

### Debug Build (faster, for testing)
```bash
npm run tauri:build:debug
```

### Build Output Locations

**macOS:**
- App: `src-tauri/target/release/bundle/macos/PXLS Editor.app`
- DMG: `src-tauri/target/release/bundle/dmg/PXLS Editor_1.0.0_x64.dmg`

**Windows:**
- EXE: `src-tauri/target/release/bundle/nsis/PXLS Editor_1.0.0_x64-setup.exe`
- MSI: `src-tauri/target/release/bundle/msi/PXLS Editor_1.0.0_x64_en-US.msi`

**Linux:**
- DEB: `src-tauri/target/release/bundle/deb/pxls-editor_1.0.0_amd64.deb`
- AppImage: `src-tauri/target/release/bundle/appimage/pxls-editor_1.0.0_amd64.AppImage`

## Application Icons

You need to create application icons in `src-tauri/icons/`:
- `32x32.png` (32×32)
- `128x128.png` (128×128)
- `128x128@2x.png` (256×256)
- `icon.icns` (macOS bundle)
- `icon.ico` (Windows)

**Quick Icon Generation:**
Use an online tool like [app-icon.com](https://www.app-icon.com/) or ImageMagick:
```bash
# From a 1024×1024 source image
convert source.png -resize 32x32 src-tauri/icons/32x32.png
convert source.png -resize 128x128 src-tauri/icons/128x128.png
convert source.png -resize 256x256 src-tauri/icons/128x128@2x.png
```

## Proxy Configuration

### Development (npm run tauri:dev)
The app runs at `http://localhost` (custom protocol), so:
- `CONFIG.IS_LOCALHOST` will be `true`
- Uses Node.js proxy (`proxy.js` on port 3131)
- **You must start the proxy separately:**
  ```bash
  node proxy.js
  ```

### Production (built app)
The app uses the `tauri://` protocol, so:
- `CONFIG.IS_LOCALHOST` will be `false`
- Proxies are not needed (direct API calls)
- API key is bundled in the app

**IMPORTANT**: For production builds, ensure CSP in `tauri.conf.json` allows Pexels domains:
```json
"csp": "connect-src 'self' https://api.pexels.com https://images.pexels.com"
```

## Security Considerations

### API Key Protection
In a desktop app, the API key is bundled in the JavaScript. While obfuscated, it's not truly secure. Consider:

1. **Personal Use**: Current approach is fine
2. **Public Distribution**: Implement a backend service:
   - Host your own API proxy server
   - Proxy requests through your server
   - Keep the API key on the server only

### Content Security Policy
The CSP in `tauri.conf.json` restricts what the app can load:
- Only allows Pexels domains for API/images
- Blocks external scripts (except Inter font)
- Prevents XSS attacks

## Troubleshooting

### "cargo: command not found"
- Rust is not installed or not in PATH
- Solution: Install Rust and restart terminal

### "webkit2gtk not found" (Linux)
- Missing system dependencies
- Solution: Install webkit2gtk-4.0-dev

### "API key not working"
- Check `lib/config.js` exists (not just .example)
- Verify API key is correct
- Check browser console for errors

### "Blank window in dev mode"
- Ensure proxy.js is running (for localhost detection)
- Or update `CONFIG.IS_LOCALHOST` logic in `lib/config.js`

### Build fails with CSP error
- Images/API blocked by Content Security Policy
- Solution: Update CSP in `tauri.conf.json` to allow required domains

## Distribution

### macOS
1. Build: `npm run tauri:build`
2. Sign (optional): Use Apple Developer certificate
3. Notarize (optional): Required for distribution
4. Distribute: `.dmg` file or Mac App Store

### Windows
1. Build: `npm run tauri:build`
2. Sign (optional): Use code signing certificate
3. Distribute: `.exe` or `.msi` installer

### Linux
1. Build: `npm run tauri:build`
2. Distribute: `.deb` for Debian/Ubuntu, `.AppImage` for universal

## Updating Version

Update version in **both**:
1. `package.json`: `"version": "1.0.0"`
2. `src-tauri/Cargo.toml`: `version = "1.0.0"`
3. `src-tauri/tauri.conf.json`: `"version": "1.0.0"`

## Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Tauri API Reference](https://tauri.app/v1/api/js/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [Cargo Documentation](https://doc.rust-lang.org/cargo/)

## Next Steps

1. ✅ Project structured for Tauri
2. ⏳ Install Rust and dependencies
3. ⏳ Create application icons
4. ⏳ Configure API key
5. ⏳ Test with `npm run tauri:dev`
6. ⏳ Build production app
7. ⏳ Distribute!

## Backup

A backup was created before restructuring:
- Location: `../GradientGenerator26_BACKUP_YYYYMMDD_HHMMSS.tar.gz`
- To restore: Extract the archive and replace current directory
