# Health-Connect Auto-Start PowerShell Script
# Set execution policy for this script
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Color settings
$Host.UI.RawUI.WindowTitle = "Health-Connect Auto-Start"
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Health-Connect Auto-Start Script" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Step 1: Check Node.js
Write-Host "[1/5] Checking Node.js installation..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version 2>$null
    Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please download and install Node.js from: https://nodejs.org" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 2: Check npm
Write-Host ""
Write-Host "[2/5] Checking npm installation..." -ForegroundColor Cyan
try {
    $npmVersion = npm --version 2>$null
    Write-Host "npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm is not available!" -ForegroundColor Red
    Write-Host "Please reinstall Node.js." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 3: Clean npm cache
Write-Host ""
Write-Host "[3/5] Cleaning npm cache..." -ForegroundColor Cyan
try {
    npm cache clean --force 2>$null | Out-Null
    Write-Host "Cache cleaned successfully." -ForegroundColor Green
} catch {
    Write-Host "Warning: Cache cleaning failed, continuing..." -ForegroundColor Yellow
}

# Step 4: Install dependencies
Write-Host ""
Write-Host "[4/5] Installing/updating dependencies..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing fresh dependencies..." -ForegroundColor Yellow
    npm install --no-audit --no-fund
} else {
    Write-Host "Updating existing dependencies..." -ForegroundColor Yellow
    npm install --no-audit --no-fund
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
    Write-Host "Trying alternative installation..." -ForegroundColor Yellow
    npm install --legacy-peer-deps --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Installation failed completely!" -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "Alternative installation successful!" -ForegroundColor Green
} else {
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
}

# Step 5: Handle security issues
Write-Host ""
Write-Host "[5/5] Checking for security issues..." -ForegroundColor Cyan
npm audit --audit-level moderate 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Security vulnerabilities found." -ForegroundColor Yellow
    Write-Host "Running automatic fix..." -ForegroundColor Yellow
    npm audit fix --force --no-audit --no-fund 2>$null | Out-Null
    Write-Host "Security issues addressed." -ForegroundColor Green
} else {
    Write-Host "No critical security issues found." -ForegroundColor Green
}

# Start development server
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Starting Health-Connect Server" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Server will be available at: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "Starting in 3 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Try to start the server
try {
    npm run dev
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to start development server!" -ForegroundColor Red
    Write-Host "Trying alternative start method..." -ForegroundColor Yellow
    try {
        npx vite
    } catch {
        Write-Host "ERROR: All startup methods failed!" -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "Server stopped. Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
