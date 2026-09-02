#!/usr/bin/env bash
# WhatsApp Bot Web App - Auto Localhost Runner (:4044)
set -e

echo "========================================================"
echo "  WhatsApp Bot Web Application - Auto Localhost Runner  "
echo "  Target URL: http://localhost:4044                     "
echo "========================================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "[1/3] Dependencies missing. Running npm install..."
    npm install
else
    echo "[1/3] Dependencies verified (node_modules ready)."
fi

export PORT=4044
echo "[2/3] Setting server environment to PORT 4044..."

echo "[3/3] Launching web browser to http://localhost:4044..."
if command -v xdg-open &> /dev/null; then
    (sleep 2 && xdg-open "http://localhost:4044") &
elif command -v open &> /dev/null; then
    (sleep 2 && open "http://localhost:4044") &
fi

echo ""
echo "========================================================"
echo "  Server is active at http://localhost:4044"
echo "  - Persistent Forever Session enabled"
echo "  - Multi-Device WhatsApp pairing ready"
echo "  - Groq LLaMA-3.1 AI auto-replies enabled"
echo "  Press Ctrl+C to stop the server."
echo "========================================================"
echo ""

npx tsx server.ts
