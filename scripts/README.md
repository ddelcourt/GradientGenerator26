# Build Scripts

This folder contains all build and development scripts for the PXLS Editor Tauri application.

## Available Scripts

### Development
- **`dev.sh`** - Start Tauri development mode with hot reload
  - Run with: `npm run dev` or `./scripts/dev.sh`
  - Opens development app with live code changes

### Building
- **`build-production.sh`** - Build optimized production version
  - Run with: `npm run build` or `./scripts/build-production.sh`
  - Creates release build in `src-tauri/target/release/bundle/`
  - Outputs `.app` and `.dmg` files

- **`build-debug.sh`** - Build debug version with DevTools
  - Run with: `npm run build:debug` or `./scripts/build-debug.sh`
  - Creates debug build in `src-tauri/target/debug/bundle/`
  - Includes DevTools for production debugging

### Maintenance
- **`clean.sh`** - Remove all build artifacts
  - Run with: `npm run clean` or `./scripts/clean.sh`
  - Removes `src-tauri/target/` and `dist/` folders
  - Kills any running PXLS Editor instances

- **`clean-and-build.sh`** - Clean everything and build fresh production version
  - Run with: `npm run fresh-build` or `./scripts/clean-and-build.sh`
  - Combines clean + build + auto-launch
  - Recommended when switching between versions or troubleshooting

## VS Code Integration

All scripts are available in VS Code:

1. **NPM Scripts Panel** (left sidebar):
   - Click the NPM Scripts icon
   - Expand "pxls-editor"
   - Click any script to run

2. **Tasks Menu**:
   - Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "Run Task"
   - Select from the list of build tasks

3. **Command Line**:
   - Use npm: `npm run dev`, `npm run build`, etc.
   - Or directly: `./scripts/dev.sh`, `./scripts/build-production.sh`, etc.

## Requirements

- Rust toolchain (automatically configured in scripts via PATH)
- Node.js and npm
- Tauri CLI (`@tauri-apps/cli` in devDependencies)
