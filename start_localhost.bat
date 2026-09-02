@echo off
setlocal enabledelayedexpansion
title WhatsApp Bot Web App (Auto Localhost :4044)
echo ========================================================
echo   WhatsApp Bot Web Application - Auto Localhost Runner
echo   Target URL: http://localhost:4044
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH!
    echo Please install Node.js (v18 or newer) from https://nodejs.org
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [1/3] Dependencies not found. Running npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install encountered an error.
        pause
        exit /b 1
    )
) else (
    echo [1/3] Dependencies verified (node_modules ready).
)

echo [2/3] Setting server environment to PORT 4044...
set PORT=4044

echo [3/3] Launching web browser to http://localhost:4044...
start "" http://localhost:4044

echo.
echo ========================================================
echo   Server is active at http://localhost:4044
echo   - Persistent Forever Session enabled
echo   - Multi-Device WhatsApp pairing ready
echo   - Groq LLaMA-3.1 AI auto-replies enabled
echo   Press Ctrl+C in this window to stop the server.
echo ========================================================
echo.

call npx tsx server.ts
if %errorlevel% neq 0 (
    echo.
    echo Server process exited with code %errorlevel%
    pause
)
