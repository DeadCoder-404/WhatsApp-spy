@echo off
title WhatsApp Bot Desktop Hub (Multi-Device & Groq AI)
echo ======================================================
echo    Starting WhatsApp Bot Native Desktop Program...
echo ======================================================

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python 3 is not installed or not in PATH!
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

python whatsapp_desktop.py
if %errorlevel% neq 0 (
    echo.
    echo Desktop program exited with code %errorlevel%
    pause
)
