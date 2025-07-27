#!/bin/bash

# Efficient Server Deployment Script
# Uses npm ci for faster installs and only installs missing modules

set -e  # Exit on any error

echo "🚀 Starting efficient server deployment..."

# Navigate to project directory
cd /var/www/crumbled-website

# Stash any local changes (if any)
echo "📦 Stashing any local changes..."
git stash push -m "Auto-stash before deployment $(date)" || true

# Pull latest changes
echo "⬇️  Pulling latest changes from git..."
git pull origin production-v1.0

# Check if package-lock.json exists and is newer than node_modules
if [ ! -f "package-lock.json" ]; then
    echo "📦 No package-lock.json found, running npm install..."
    npm install --production
elif [ ! -d "node_modules" ] || [ "package-lock.json" -nt "node_modules" ]; then
    echo "📦 package-lock.json is newer than node_modules, running npm ci..."
    npm ci --production
else
    echo "✅ node_modules are up to date, checking for missing modules..."
    # Check for missing modules and install only those
    npm install --production --no-save
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