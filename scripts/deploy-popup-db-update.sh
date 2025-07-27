#!/bin/bash
# Deploy Popup Database Update to Production
# This script updates the production database with the missing overlay columns

set -e

echo "🚀 Starting Popup Database Update Deployment..."

# Configuration
PROJECT_NAME="crumbled-website"
REMOTE_SERVER="root@mail"
REMOTE_PATH="/var/www/crumbled-website"
DB_NAME="crumbled_nextDB"

echo "📋 Configuration:"
echo "  Project: $PROJECT_NAME"
echo "  Server: $REMOTE_SERVER"
echo "  Remote Path: $REMOTE_PATH"
echo "  Database: $DB_NAME"

# Step 1: Create deployment package
echo ""
echo "📦 Creating deployment package..."

DEPLOY_DIR="deploy-popup-db-update"
if [ -d "$DEPLOY_DIR" ]; then
    rm -rf "$DEPLOY_DIR"
fi
mkdir -p "$DEPLOY_DIR"

# Copy migration file
cp "migrations/add_overlay_columns_to_production.sql" "$DEPLOY_DIR/"
echo "  ✅ Copied migration file"

# Create deployment script
cat > "$DEPLOY_DIR/deploy.sh" << 'EOF'
#!/bin/bash
# Popup Database Update Deployment Script
# Run this on the production server

set -e

echo "🚀 Starting popup database update..."

# Navigate to project directory
cd /var/www/crumbled-website

# Backup current database
echo "📦 Creating database backup..."
mysqldump -u root -p crumbled_nextDB > backup_popup_$(date +%Y%m%d_%H%M%S).sql
echo "✅ Database backup created"

# Run the migration
echo "🔧 Running database migration..."
mysql -u root -p crumbled_nextDB < migrations/add_overlay_columns_to_production.sql
echo "✅ Database migration completed"

# Verify the update
echo "🔍 Verifying table structure..."
mysql -u root -p crumbled_nextDB -e "DESCRIBE popup_ads;"
echo "✅ Table structure verified"

# Restart the application
echo "🔄 Restarting application..."
pm2 restart crumbled-website
echo "✅ Application restarted"

echo "🎉 Popup database update completed successfully!"
EOF

chmod +x "$DEPLOY_DIR/deploy.sh"
echo "  ✅ Created deployment script"

# Create verification script
cat > "$DEPLOY_DIR/verify.sh" << 'EOF'
#!/bin/bash
# Verification script for popup database update

echo "🔍 Verifying popup_ads table structure..."

mysql -u root -p crumbled_nextDB -e "
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'crumbled_nextDB' 
  AND TABLE_NAME = 'popup_ads' 
ORDER BY ORDINAL_POSITION;
"

echo ""
echo "📊 Total columns:"
mysql -u root -p crumbled_nextDB -e "
SELECT COUNT(*) as total_columns 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'crumbled_nextDB' 
  AND TABLE_NAME = 'popup_ads';
"

echo ""
echo "✅ Verification complete!"
EOF

chmod +x "$DEPLOY_DIR/verify.sh"
echo "  ✅ Created verification script"

# Create package
PACKAGE_NAME="popup-db-update-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$PACKAGE_NAME" -C "$DEPLOY_DIR" .
echo "  ✅ Created package: $PACKAGE_NAME"

# Step 2: Deploy to server
echo ""
echo "🚀 Deploying to production server..."

# Copy package to server
echo "  📤 Uploading package to server..."
scp "$PACKAGE_NAME" "$REMOTE_SERVER:$REMOTE_PATH/"
echo "  ✅ Package uploaded"

# Extract and run on server
echo "  🔧 Running deployment on server..."
ssh "$REMOTE_SERVER" "cd $REMOTE_PATH && tar -xzf $PACKAGE_NAME && chmod +x deploy.sh && ./deploy.sh"

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Test popup creation on production"
echo "  2. Verify all overlay features work correctly"
echo "  3. Check that existing popups still work"

echo ""
echo "🔍 To verify the deployment, run:"
echo "  ssh $REMOTE_SERVER 'cd $REMOTE_PATH && ./verify.sh'"

# Cleanup
echo ""
echo "🧹 Cleaning up..."
rm -rf "$DEPLOY_DIR"
rm -f "$PACKAGE_NAME"
echo "  ✅ Cleanup completed"

echo ""
echo "✨ All done! The popup database has been updated on production." 