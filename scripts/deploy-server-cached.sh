#!/bin/bash

# Cached Deployment Script
# Uses npm ci with caching for maximum speed

set -e  # Exit on any error

echo "🚀 Starting cached deployment..."

# Navigate to project directory
cd /var/www/crumbled-website

# Stash any local changes (if any)
echo "📦 Stashing any local changes..."
git stash push -m "Auto-stash before deployment $(date)" || true

# Pull latest changes
echo "⬇️  Pulling latest changes from git..."
git pull origin production-v1.0

# Check if we need to install dependencies
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    echo "📦 Missing node_modules or package-lock.json, running npm ci..."
    npm ci --production
elif git diff --name-only HEAD~1 HEAD | grep -E "package-lock\.json" > /dev/null; then
    echo "📦 package-lock.json changed, running npm ci..."
    npm ci --production
else
    echo "✅ Dependencies are up to date, skipping npm install"
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