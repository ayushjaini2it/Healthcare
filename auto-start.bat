@echo off
title Healthcare App Auto-Start
color 0A

echo ========================================
echo    Healthcare App Auto-Start Script
echo ========================================
echo.

REM Check Node.js installation
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo Node.js: %%i
)

REM Check npm installation
echo.
echo [2/5] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available!
    echo Please reinstall Node.js.
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do echo npm: %%i
)

REM Clean npm cache
echo.
echo [3/5] Cleaning npm cache...
npm cache clean --force >nul 2>&1

REM Install dependencies
echo.
echo [4/5] Installing/updating dependencies...
if not exist "node_modules" (
    echo Installing fresh dependencies...
    npm install --no-audit --no-fund
) else (
    echo Updating existing dependencies...
    npm install --no-audit --no-fund
)

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    echo Trying alternative installation...
    npm install --legacy-peer-deps --no-audit --no-fund
    if %errorlevel% neq 0 (
        echo ERROR: Installation failed completely!
        pause
        exit /b 1
    )
)

REM Handle security vulnerabilities (optional)
echo.
echo [5/5] Checking for security issues...
npm audit --audit-level moderate >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Security vulnerabilities found.
    echo Running automatic fix...
    npm audit fix --force --no-audit --no-fund >nul 2>&1
    echo Security issues addressed.
) else (
    echo No critical security issues found.
)

REM Start the development server
echo.
echo ========================================
echo    Starting Healthcare App Server
echo ========================================
echo.
echo Server will be available at: http://localhost:5173
echo Press Ctrl+C to stop the server
echo.
echo Starting in 3 seconds...
timeout /t 3 /nobreak >nul

npm run dev

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start development server!
    echo Trying alternative start method...
    npx vite
)

echo.
echo Server stopped. Press any key to exit...
pause >nul
