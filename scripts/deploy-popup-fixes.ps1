# Deploy Popup Ads API Fixes
# This script deploys the JSON handling fixes for the popup ads system

Write-Host "🚀 Deploying Popup Ads API Fixes..." -ForegroundColor Green

# Configuration
$PROJECT_DIR = "C:\Users\ASUS\AngularWebApp\crumbled-website"
$REMOTE_SERVER = "your-server-ip-or-domain"
$REMOTE_USER = "your-username"
$REMOTE_PATH = "/path/to/your/project"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "  Project Directory: $PROJECT_DIR"
Write-Host "  Remote Server: $REMOTE_SERVER"
Write-Host "  Remote User: $REMOTE_USER"
Write-Host "  Remote Path: $REMOTE_PATH"
Write-Host ""

# Step 1: Build the project
Write-Host "🔨 Step 1: Building the project..." -ForegroundColor Cyan
Set-Location $PROJECT_DIR

try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed with exit code $LASTEXITCODE"
    }
    Write-Host "✅ Build completed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Create deployment package
Write-Host "📦 Step 2: Creating deployment package..." -ForegroundColor Cyan

$DEPLOY_DIR = "deploy-popup-fixes-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $DEPLOY_DIR -Force | Out-Null

# Copy only the necessary files
$FILES_TO_DEPLOY = @(
    "app\api\admin\popup-ads\route.ts",
    "app\api\admin\popup-ads\[id]\route.ts",
    "app\api\popup-ads\active\route.ts",
    "components\PopupAds.tsx",
    "components\PopupAdsWrapper.tsx",
    "app\admin\popup-ads\page.tsx",
    ".next",
    "package.json",
    "next.config.js"
)

foreach ($file in $FILES_TO_DEPLOY) {
    if (Test-Path $file) {
        $destPath = Join-Path $DEPLOY_DIR $file
        $destDir = Split-Path $destPath -Parent
        if (!(Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Copy-Item $file $destPath -Recurse -Force
        Write-Host "  ✅ Copied: $file" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ File not found: $file" -ForegroundColor Yellow
    }
}

# Step 3: Create deployment script for remote server
$REMOTE_SCRIPT = @"
#!/bin/bash
# Remote deployment script for popup ads fixes

echo "🚀 Deploying popup ads fixes to production..."

# Navigate to project directory
cd $REMOTE_PATH

# Create backup
echo "📦 Creating backup..."
BACKUP_DIR="backup-\$(date +%Y%m%d-%H%M%S)"
mkdir -p \$BACKUP_DIR

# Backup current files
cp -r app/api/admin/popup-ads \$BACKUP_DIR/ 2>/dev/null || true
cp -r app/api/popup-ads \$BACKUP_DIR/ 2>/dev/null || true
cp -r components/PopupAds* \$BACKUP_DIR/ 2>/dev/null || true
cp -r app/admin/popup-ads \$BACKUP_DIR/ 2>/dev/null || true

echo "✅ Backup created in \$BACKUP_DIR"

# Stop the application
echo "🛑 Stopping application..."
pm2 stop crumbled-website || true

# Deploy new files
echo "📤 Deploying new files..."
cp -r app/api/admin/popup-ads/* app/api/admin/popup-ads/
cp -r app/api/popup-ads/* app/api/popup-ads/
cp -r components/PopupAds* components/
cp -r app/admin/popup-ads/* app/admin/popup-ads/

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Start the application
echo "🚀 Starting application..."
pm2 start crumbled-website

# Check status
echo "📊 Checking application status..."
pm2 status crumbled-website

echo "✅ Deployment completed!"
echo "🔍 Check the logs with: pm2 logs crumbled-website"
"@

$REMOTE_SCRIPT_PATH = Join-Path $DEPLOY_DIR "deploy.sh"
$REMOTE_SCRIPT | Out-File -FilePath $REMOTE_SCRIPT_PATH -Encoding UTF8

Write-Host "✅ Deployment package created in: $DEPLOY_DIR" -ForegroundColor Green

# Step 4: Instructions for manual deployment
Write-Host ""
Write-Host "📋 Manual Deployment Instructions:" -ForegroundColor Yellow
Write-Host "1. Upload the '$DEPLOY_DIR' folder to your server" -ForegroundColor White
Write-Host "2. SSH into your server: ssh $REMOTE_USER@$REMOTE_SERVER" -ForegroundColor White
Write-Host "3. Navigate to the uploaded folder" -ForegroundColor White
Write-Host "4. Run: chmod +x deploy.sh && ./deploy.sh" -ForegroundColor White
Write-Host ""
Write-Host "🔍 After deployment, test the popup ads system:" -ForegroundColor Yellow
Write-Host "1. Visit: https://crumbled-eg.com/admin/popup-ads" -ForegroundColor White
Write-Host "2. Try creating or editing a popup ad" -ForegroundColor White
Write-Host "3. Check that the JSON fields (target_pages, exclude_pages) work correctly" -ForegroundColor White
Write-Host ""

# Step 5: Create a quick test script
$TEST_SCRIPT = @"
# Quick test for popup ads API
echo "🧪 Testing popup ads API..."

# Test the active popups endpoint
echo "Testing /api/popup-ads/active..."
curl -s "https://crumbled-eg.com/api/popup-ads/active?path=/" | jq '.'

# Test admin endpoint (requires authentication)
echo "Testing /api/admin/popup-ads..."
curl -s "https://crumbled-eg.com/api/admin/popup-ads" | jq '.'

echo "✅ API tests completed"
"@

$TEST_SCRIPT_PATH = Join-Path $DEPLOY_DIR "test-api.sh"
$TEST_SCRIPT | Out-File -FilePath $TEST_SCRIPT_PATH -Encoding UTF8

Write-Host "📝 Additional files created:" -ForegroundColor Yellow
Write-Host "  - deploy.sh: Remote deployment script" -ForegroundColor White
Write-Host "  - test-api.sh: API testing script" -ForegroundColor White
Write-Host ""

Write-Host "🎉 Deployment package ready!" -ForegroundColor Green
Write-Host "Upload the '$DEPLOY_DIR' folder to your server and run the deployment script." -ForegroundColor White 