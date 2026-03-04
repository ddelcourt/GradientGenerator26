#!/bin/bash
# Build production version WITH DMG installer

export PATH="$HOME/.cargo/bin:$PATH"
echo "🔨 Building production version with DMG..."
npm run tauri:build:dmg

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Production build complete!"
    echo "📦 App: src-tauri/target/universal-apple-darwin/release/bundle/macos/PXLS Editor.app"
    echo "💿 DMG: src-tauri/target/universal-apple-darwin/release/bundle/dmg/"
    echo ""
    echo "This is a Universal Binary (works on both Intel and Apple Silicon Macs)"
fi
