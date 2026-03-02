#!/bin/bash
# Clean all build artifacts

echo "🧹 Cleaning build artifacts..."
killall "PXLS Editor" 2>/dev/null || true
sleep 1
rm -rf src-tauri/target
rm -rf dist
echo "✅ Clean complete!"
