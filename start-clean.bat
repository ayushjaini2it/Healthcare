@echo off
title Healthcare App - Clean Start
color 0A

echo ========================================
echo    Healthcare App - Clean Start
echo ========================================
echo.

REM Force change to correct directory
cd /d "C:\Users\hp\Downloads\app"
echo Working directory: %CD%
echo.

REM Check Node.js
echo [1/4] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo Node.js: %%i

REM Check npm
echo.
echo [2/4] Checking npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm not found!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do echo npm: %%i

REM Install dependencies
echo.
echo [3/4] Installing dependencies...
if not exist "node_modules" (
    echo Fresh install...
    "C:\Program Files\nodejs\npm.cmd" install --no-audit --no-fund
) else (
    echo Updating existing...
    "C:\Program Files\nodejs\npm.cmd" install --no-audit --no-fund
)

if %errorlevel% neq 0 (
    echo ERROR: Install failed! Trying legacy mode...
    "C:\Program Files\nodejs\npm.cmd" install --legacy-peer-deps --no-audit --no-fund
    if %errorlevel% neq 0 (
        echo ERROR: Complete failure!
        pause
        exit /b 1
    )
)

REM Start server
echo.
echo [4/4] Starting server...
echo Server: http://localhost:5173
echo Press Ctrl+C to stop
echo.

"C:\Program Files\nodejs\npm.cmd" run dev

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Server start failed! Trying direct Vite...
    "C:\Program Files\nodejs\npm.cmd" install vite@latest --no-audit --no-fund
    npx vite
)

pause
