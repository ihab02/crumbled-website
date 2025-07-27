#!/bin/bash

# Protected Deployment Script
# This script protects environment files and uses efficient dependency management

set -e  # Exit on any error

echo "🚀 Starting protected deployment..."

# Configuration
REMOTE_HOST="root@mail"
REMOTE_PATH="/var/www/crumbled-website"
LOCAL_PATH="."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Backup environment files on remote server
print_status "Backing up environment files on remote server..."
ssh $REMOTE_HOST "cd $REMOTE_PATH && cp .env.local .env.local.backup 2>/dev/null || echo 'No .env.local to backup'"
ssh $REMOTE_HOST "cd $REMOTE_PATH && cp .env .env.backup 2>/dev/null || echo 'No .env to backup'"

# Step 2: Transfer files (excluding node_modules and .env files)
print_status "Transferring files to remote server..."
rsync -avz --progress \
    --exclude 'node_modules/' \
    --exclude '.next/' \
    --exclude '.env*' \
    --exclude '.git/' \
    --exclude 'DB_VERSION_DUMBs/' \
    --exclude 'public/uploads/' \
    $LOCAL_PATH/ $REMOTE_HOST:$REMOTE_PATH/

# Step 3: Restore environment files
print_status "Restoring environment files..."
ssh $REMOTE_HOST "cd $REMOTE_PATH && mv .env.local.backup .env.local 2>/dev/null || echo 'No .env.local backup to restore'"
ssh $REMOTE_HOST "cd $REMOTE_PATH && mv .env.backup .env 2>/dev/null || echo 'No .env backup to restore'"

# Step 4: Check if node_modules exists and has content
print_status "Checking node_modules status..."
NODE_MODULES_STATUS=$(ssh $REMOTE_HOST "cd $REMOTE_PATH && if [ -d 'node_modules' ] && [ \"\$(ls -A node_modules)\" ]; then echo 'exists'; else echo 'missing'; fi")

if [ "$NODE_MODULES_STATUS" = "exists" ]; then
    print_status "node_modules exists, checking for dependency changes..."
    
    # Check if package.json or package-lock.json changed
    PACKAGE_CHANGED=$(ssh $REMOTE_HOST "cd $REMOTE_PATH && if git diff --name-only HEAD~1 | grep -E 'package\.json|package-lock\.json'; then echo 'changed'; else echo 'unchanged'; fi")
    
    if [ "$PACKAGE_CHANGED" = "changed" ]; then
        print_warning "Package files changed, reinstalling dependencies..."
        ssh $REMOTE_HOST "cd $REMOTE_PATH && npm ci --production"
    else
        print_success "No package changes detected, skipping npm install"
    fi
else
    print_warning "node_modules missing or empty, installing dependencies..."
    ssh $REMOTE_HOST "cd $REMOTE_PATH && npm ci --production"
fi

# Step 5: Build the application
print_status "Building the application..."
ssh $REMOTE_HOST "cd $REMOTE_PATH && npm run build"

# Step 6: Restart the application
print_status "Restarting the application..."
ssh $REMOTE_HOST "cd $REMOTE_PATH && pm2 restart crumbled-website || pm2 start npm --name 'crumbled-website' -- start"

# Step 7: Verify deployment
print_status "Verifying deployment..."
sleep 5
HTTP_STATUS=$(ssh $REMOTE_HOST "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001 || echo '000'")

if [ "$HTTP_STATUS" = "200" ]; then
    print_success "Deployment successful! Application is running on port 3001"
else
    print_error "Deployment may have issues. HTTP status: $HTTP_STATUS"
    print_status "Checking PM2 status..."
    ssh $REMOTE_HOST "cd $REMOTE_PATH && pm2 status"
fi

print_success "Protected deployment completed!"
print_status "Environment files have been preserved."
print_status "Dependencies were installed efficiently." 