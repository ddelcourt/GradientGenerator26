#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# PXLS Image Editor - Stop Script
# ═══════════════════════════════════════════════════════════════════════════
# This script stops the proxy server gracefully
# ═══════════════════════════════════════════════════════════════════════════

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}   Stopping PXLS Proxy Server...    ${BLUE}║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# Check if .proxy_pid file exists
if [ -f "$SCRIPT_DIR/.proxy_pid" ]; then
    PID=$(cat "$SCRIPT_DIR/.proxy_pid")
    
    # Check if the process is still running
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID 2>/dev/null
        echo -e "${GREEN}✓${NC} Stopped proxy server (PID: $PID)"
        rm "$SCRIPT_DIR/.proxy_pid"
    else
        echo -e "${YELLOW}⚠${NC} Process $PID not found (already stopped?)"
        rm "$SCRIPT_DIR/.proxy_pid"
    fi
else
    # Try to find and kill any process on port 3131
    if lsof -Pi :3131 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        PID=$(lsof -ti:3131)
        kill $PID 2>/dev/null
        echo -e "${GREEN}✓${NC} Stopped process on port 3131 (PID: $PID)"
    else
        echo -e "${YELLOW}⚠${NC} No proxy server found running on port 3131"
    fi
fi

echo ""
echo -e "${GREEN}Done!${NC}"
echo ""
