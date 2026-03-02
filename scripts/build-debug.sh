#!/bin/bash
# Build debug version (with DevTools)

export PATH="$HOME/.cargo/bin:$PATH"
echo "🔨 Building debug version..."
npm run tauri:build:debug

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Debug build complete!"
    echo "📦 App: src-tauri/target/debug/bundle/macos/PXLS Editor.app"
fi
