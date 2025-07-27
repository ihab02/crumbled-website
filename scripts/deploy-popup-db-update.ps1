# Deploy Popup Database Update to Production
# This script updates the production database with the missing overlay columns

Write-Host "🚀 Starting Popup Database Update Deployment..." -ForegroundColor Green

# Configuration
$PROJECT_NAME = "crumbled-website"
$REMOTE_SERVER = "root@mail"
$REMOTE_PATH = "/var/www/crumbled-website"
$DB_NAME = "crumbled_nextDB"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "  Project: $PROJECT_NAME" -ForegroundColor White
Write-Host "  Server: $REMOTE_SERVER" -ForegroundColor White
Write-Host "  Remote Path: $REMOTE_PATH" -ForegroundColor White
Write-Host "  Database: $DB_NAME" -ForegroundColor White

# Step 1: Create deployment package
Write-Host "`n📦 Creating deployment package..." -ForegroundColor Yellow

$DEPLOY_DIR = "deploy-popup-db-update"
if (Test-Path $DEPLOY_DIR) {
    Remove-Item $DEPLOY_DIR -Recurse -Force
}
New-Item -ItemType Directory -Path $DEPLOY_DIR | Out-Null

# Copy migration file
Copy-Item "migrations/add_overlay_columns_to_production.sql" "$DEPLOY_DIR/"
Write-Host "  ✅ Copied migration file" -ForegroundColor Green

# Create deployment script
$DEPLOY_SCRIPT = @"
#!/bin/bash
# Popup Database Update Deployment Script
# Run this on the production server

set -e

echo "🚀 Starting popup database update..."

# Navigate to project directory
cd $REMOTE_PATH

# Backup current database
echo "📦 Creating database backup..."
mysqldump -u root -p $DB_NAME > backup_popup_$(date +%Y%m%d_%H%M%S).sql
echo "✅ Database backup created"

# Run the migration
echo "🔧 Running database migration..."
mysql -u root -p $DB_NAME < migrations/add_overlay_columns_to_production.sql
echo "✅ Database migration completed"

# Verify the update
echo "🔍 Verifying table structure..."
mysql -u root -p $DB_NAME -e "DESCRIBE popup_ads;"
echo "✅ Table structure verified"

# Restart the application
echo "🔄 Restarting application..."
pm2 restart crumbled-website
echo "✅ Application restarted"

echo "🎉 Popup database update completed successfully!"
"@

$DEPLOY_SCRIPT | Out-File -FilePath "$DEPLOY_DIR/deploy.sh" -Encoding UTF8
Write-Host "  ✅ Created deployment script" -ForegroundColor Green

# Create verification script
$VERIFY_SCRIPT = @"
#!/bin/bash
# Verification script for popup database update

echo "🔍 Verifying popup_ads table structure..."

mysql -u root -p $DB_NAME -e "
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = '$DB_NAME' 
  AND TABLE_NAME = 'popup_ads' 
ORDER BY ORDINAL_POSITION;
"

echo "`n📊 Total columns:"
mysql -u root -p $DB_NAME -e "
SELECT COUNT(*) as total_columns 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = '$DB_NAME' 
  AND TABLE_NAME = 'popup_ads';
"

echo "`n✅ Verification complete!"
"@

$VERIFY_SCRIPT | Out-File -FilePath "$DEPLOY_DIR/verify.sh" -Encoding UTF8
Write-Host "  ✅ Created verification script" -ForegroundColor Green

# Create package
$PACKAGE_NAME = "popup-db-update-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
Compress-Archive -Path "$DEPLOY_DIR/*" -DestinationPath $PACKAGE_NAME
Write-Host "  ✅ Created package: $PACKAGE_NAME" -ForegroundColor Green

# Step 2: Deploy to server
Write-Host "`n🚀 Deploying to production server..." -ForegroundColor Yellow

# Copy package to server
Write-Host "  📤 Uploading package to server..." -ForegroundColor White
scp $PACKAGE_NAME $REMOTE_SERVER`:$REMOTE_PATH/
Write-Host "  ✅ Package uploaded" -ForegroundColor Green

# Extract and run on server
Write-Host "  🔧 Running deployment on server..." -ForegroundColor White
$EXTRACT_CMD = "cd $REMOTE_PATH && unzip -o $PACKAGE_NAME && chmod +x deploy.sh && ./deploy.sh"
ssh $REMOTE_SERVER $EXTRACT_CMD

Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test popup creation on production" -ForegroundColor White
Write-Host "  2. Verify all overlay features work correctly" -ForegroundColor White
Write-Host "  3. Check that existing popups still work" -ForegroundColor White

Write-Host "`n🔍 To verify the deployment, run:" -ForegroundColor Cyan
Write-Host "  ssh $REMOTE_SERVER 'cd $REMOTE_PATH && ./verify.sh'" -ForegroundColor White

# Cleanup
Write-Host "`n🧹 Cleaning up..." -ForegroundColor Yellow
Remove-Item $DEPLOY_DIR -Recurse -Force
Remove-Item $PACKAGE_NAME -Force
Write-Host "  ✅ Cleanup completed" -ForegroundColor Green

Write-Host "`n✨ All done! The popup database has been updated on production." -ForegroundColor Green 