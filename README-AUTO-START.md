# Healthcare App - Automatic Startup Guide

## Quick Start Options

### Option 1: Double-Click Startup (Windows)
1. **Batch File**: Double-click `start-dev.bat`
2. **PowerShell**: Right-click `start-dev.ps1` and select "Run with PowerShell"

### Option 2: Command Line Startup
```bash
# Install dependencies and start server
npm start

# Alternative command
npm run auto-start

# Setup only (install dependencies)
npm run setup
```

### Option 3: Manual Startup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## What Happens Automatically
1. **Checks Node.js** - Verifies Node.js is installed
2. **Checks npm** - Verifies npm is available
3. **Installs Dependencies** - Only if node_modules doesn't exist
4. **Starts Server** - Launches development server at http://localhost:5173

## Server Information
- **URL**: http://localhost:5173
- **Auto-reload**: Enabled (changes appear automatically)
- **Stop Server**: Press `Ctrl+C` in terminal

## Troubleshooting
- **Node.js not found**: Install Node.js from https://nodejs.org
- **Port occupied**: Server will automatically find next available port
- **Permission issues**: Run as administrator if needed

## Features Enabled
- Hot Module Replacement (instant updates)
- TypeScript compilation
- Tailwind CSS processing
- React development tools
