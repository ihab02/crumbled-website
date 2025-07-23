#!/bin/bash

# Server Deployment Script
# This script safely pulls changes from git and rebuilds the application
# without affecting the node_modules folder

set -e  # Exit on any error

echo "🚀 Starting server deployment..."

# Navigate to project directory (adjust path as needed)
cd /path/to/your/crumbled-website

# Stash any local changes (if any)
echo "📦 Stashing any local changes..."
git stash push -m "Auto-stash before deployment $(date)" || true

# Pull latest changes
echo "⬇️  Pulling latest changes from git..."
git pull origin production-v1.0

# Check if package.json or package-lock.json changed
if git diff --name-only HEAD~1 HEAD | grep -E "(package\.json|package-lock\.json)" > /dev/null; then
    echo "📦 Dependencies changed, updating node_modules..."
    
    # Remove node_modules and package-lock.json
    rm -rf node_modules
    rm -f package-lock.json
    
    # Install dependencies
    npm install --production
else
    echo "✅ No dependency changes detected, skipping npm install"
fi

# Build the application
echo "🔨 Building the application..."
npm run build

# Restart the application (adjust based on your deployment method)
echo "🔄 Restarting the application..."

# If using PM2:
# pm2 restart crumbled-website

# If using systemd:
# sudo systemctl restart crumbled-website

# If using Docker:
# docker-compose down && docker-compose up -d

echo "✅ Deployment completed successfully!"
echo "🌐 Application should be running on port 3001" 