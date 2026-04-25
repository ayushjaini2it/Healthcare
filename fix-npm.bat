@echo off
title Fix npm Recognition Issue
color 0B

echo ========================================
echo    Fix npm Recognition Issue
echo ========================================
echo.

REM Force change to correct directory
cd /d "C:\Users\hp\Downloads\app"
echo Current directory: %CD%
echo.

REM Check if package.json exists
if exist "package.json" (
    echo [✓] package.json found in current directory
    echo.
    echo package.json contents:
    type package.json
    echo.
) else (
    echo [✗] package.json NOT found!
    echo Creating new package.json...
    npm init -y
)

REM Show npm version and node path
echo Node.js path: where node
echo.
echo npm version:
"C:\Program Files\nodejs\npm.cmd" --version
echo.

REM Try to run npm with explicit project path
echo.
echo Attempting to run npm with explicit project path...
"C:\Program Files\nodejs\npm.cmd" --prefix "%CD%" run start

if %errorlevel% neq 0 (
    echo.
    echo [✗] npm run start failed!
    echo.
    echo Trying alternative method...
    "C:\Program Files\nodejs\npm.cmd" install
    echo.
    echo Now starting development server...
    "C:\Program Files\nodejs\npm.cmd" run dev
)

echo.
echo Press any key to exit...
pause >nul
