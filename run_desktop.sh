#!/usr/bin/env bash
# WhatsApp Bot Desktop Program Launcher (macOS / Linux / Termux)
echo "======================================================"
echo "   Starting WhatsApp Bot Native Desktop Program...    "
echo "======================================================"

if command -v python3 &>/dev/null; then
    PYTHON_CMD=python3
elif command -v python &>/dev/null; then
    PYTHON_CMD=python
else
    echo "[ERROR] Python 3 is not installed!"
    echo "Please install Python 3.8+ to run the desktop program."
    exit 1
fi

$PYTHON_CMD whatsapp_desktop.py
