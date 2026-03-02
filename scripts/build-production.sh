#!/bin/bash
# Build production version

export PATH="$HOME/.cargo/bin:$PATH"
echo "🔨 Building production version..."
npm run tauri:build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Production build complete!"
    echo "📦 App: src-tauri/target/release/bundle/macos/PXLS Editor.app"
    echo "💿 DMG: src-tauri/target/release/bundle/dmg/PXLS Editor_1.0.0_aarch64.dmg"
fi
