#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# PXLS Image Editor - Launch Script
# ═══════════════════════════════════════════════════════════════════════════
# This script starts the proxy server and opens the app in your browser
# ═══════════════════════════════════════════════════════════════════════════

# Color codes for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}     PXLS Image Editor - Launcher    ${BLUE}║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Error: Node.js is not installed${NC}"
    echo -e "${YELLOW}  Please install Node.js from https://nodejs.org/${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js found: $(node --version)"

# Check if proxy.js exists
if [ ! -f "$SCRIPT_DIR/proxy.js" ]; then
    echo -e "${RED}✗ Error: proxy.js not found in $SCRIPT_DIR${NC}"
    exit 1
fi

# Check if pexels-editor.html exists
if [ ! -f "$SCRIPT_DIR/pexels-editor.html" ]; then
    echo -e "${RED}✗ Error: pexels-editor.html not found in $SCRIPT_DIR${NC}"
    exit 1
fi

# Check if port 3131 is already in use
if lsof -Pi :3131 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠ Warning: Port 3131 is already in use${NC}"
    echo -e "${YELLOW}  The proxy server may already be running${NC}"
    echo -e "${YELLOW}  Or another application is using this port${NC}"
    echo ""
    read -p "Would you like to kill the existing process and continue? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        PID=$(lsof -ti:3131)
        kill $PID 2>/dev/null
        echo -e "${GREEN}✓${NC} Killed process $PID on port 3131"
        sleep 1
    else
        echo -e "${YELLOW}→ Skipping proxy server startup${NC}"
        echo -e "${YELLOW}  Opening app anyway (proxy must be running separately)${NC}"
        sleep 2
        open "$SCRIPT_DIR/pexels-editor.html"
        exit 0
    fi
fi

# Start the proxy server in the background
echo ""
echo -e "${BLUE}→${NC} Starting proxy server..."
cd "$SCRIPT_DIR"
node proxy.js > /dev/null 2>&1 &
PROXY_PID=$!

# Wait a moment for the server to start
sleep 1

# Check if the proxy server started successfully
if ps -p $PROXY_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Proxy server started successfully"
    echo -e "${GREEN}  Process ID: ${PROXY_PID}${NC}"
    echo -e "${GREEN}  Running on: http://localhost:3131${NC}"
else
    echo -e "${RED}✗ Error: Failed to start proxy server${NC}"
    echo -e "${YELLOW}  Try running manually: node proxy.js${NC}"
    exit 1
fi

# Open the HTML file in the default browser
echo ""
echo -e "${BLUE}→${NC} Opening PXLS Image Editor..."
sleep 1

# Try different commands based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$SCRIPT_DIR/pexels-editor.html"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "$SCRIPT_DIR/pexels-editor.html" 2>/dev/null || \
    sensible-browser "$SCRIPT_DIR/pexels-editor.html" 2>/dev/null
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows Git Bash
    start "$SCRIPT_DIR/pexels-editor.html"
else
    echo -e "${YELLOW}⚠ Could not detect OS to open browser${NC}"
    echo -e "${YELLOW}  Please open pexels-editor.html manually${NC}"
fi

echo -e "${GREEN}✓${NC} App opened in browser"
echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}  App is running!${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""
echo -e "  ${YELLOW}Proxy PID:${NC} $PROXY_PID"
echo -e "  ${YELLOW}To stop the proxy server:${NC}"
echo -e "    kill $PROXY_PID"
echo -e "  ${YELLOW}Or:${NC}"
echo -e "    lsof -ti:3131 | xargs kill"
echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Save PID to a file for easy cleanup later
echo $PROXY_PID > "$SCRIPT_DIR/.proxy_pid"

# Optionally, keep the script running and monitor the proxy
# Uncomment the following lines if you want the script to wait:

# echo "Press Ctrl+C to stop the proxy server and exit"
# trap "kill $PROXY_PID 2>/dev/null; echo ''; echo 'Proxy server stopped'; exit 0" INT
# wait $PROXY_PID
