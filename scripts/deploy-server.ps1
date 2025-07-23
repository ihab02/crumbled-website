# Server Deployment Script for Windows
# This script safely pulls changes from git and rebuilds the application
# without affecting the node_modules folder

param(
    [string]$Branch = "production-v1.0",
    [string]$ProjectPath = "C:\path\to\your\crumbled-website"
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting server deployment..." -ForegroundColor Green

# Navigate to project directory
Set-Location $ProjectPath

# Stash any local changes (if any)
Write-Host "📦 Stashing any local changes..." -ForegroundColor Yellow
try {
    git stash push -m "Auto-stash before deployment $(Get-Date)" | Out-Null
    Write-Host "✅ Changes stashed successfully" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  No changes to stash" -ForegroundColor Cyan
}

# Pull latest changes
Write-Host "⬇️  Pulling latest changes from git..." -ForegroundColor Yellow
git pull origin $Branch

# Check if package.json or package-lock.json changed
Write-Host "🔍 Checking for dependency changes..." -ForegroundColor Yellow
$changedFiles = git diff --name-only HEAD~1 HEAD
$depsChanged = $changedFiles | Where-Object { $_ -match "(package\.json|package-lock\.json)" }

if ($depsChanged) {
    Write-Host "📦 Dependencies changed, updating node_modules..." -ForegroundColor Yellow
    
    # Remove node_modules and package-lock.json
    if (Test-Path "node_modules") {
        Remove-Item -Recurse -Force "node_modules"
    }
    if (Test-Path "package-lock.json") {
        Remove-Item -Force "package-lock.json"
    }
    
    # Install dependencies
    Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
    npm install --production
} else {
    Write-Host "✅ No dependency changes detected, skipping npm install" -ForegroundColor Green
}

# Build the application
Write-Host "🔨 Building the application..." -ForegroundColor Yellow
npm run build

# Restart the application (adjust based on your deployment method)
Write-Host "🔄 Restarting the application..." -ForegroundColor Yellow

# If using PM2:
# pm2 restart crumbled-website

# If using Windows Service:
# Restart-Service -Name "crumbled-website"

# If using IIS:
# iisreset

# If using Docker:
# docker-compose down
# docker-compose up -d

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Application should be running on port 3001" -ForegroundColor Cyan 