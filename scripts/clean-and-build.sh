#!/bin/bash
# Clean all artifacts and build fresh production version

set -e

echo "🧹 Cleaning old builds..."
killall "PXLS Editor" 2>/dev/null || true
sleep 1
rm -rf src-tauri/target
rm -rf dist
echo "✓ Cleaned: src-tauri/target/ and dist/"

echo ""
echo "🔨 Building fresh production version..."
export PATH="$HOME/.cargo/bin:$PATH"
npm run tauri:build

echo ""
echo "✅ Build complete!"
echo ""
echo "📦 App: src-tauri/target/release/bundle/macos/PXLS Editor.app"
echo "💿 DMG: src-tauri/target/release/bundle/dmg/PXLS Editor_1.0.0_aarch64.dmg"
echo ""
echo "🚀 Launching production app..."
open "src-tauri/target/release/bundle/macos/PXLS Editor.app"
