#!/bin/bash

# Server Deployment Script (Force Install Version)
# This script always installs dependencies to ensure they're never missing

set -e  # Exit on any error

echo "🚀 Starting server deployment with force install..."

# Navigate to project directory
cd /var/www/crumbled-website

# Stash any local changes (if any)
echo "📦 Stashing any local changes..."
git stash push -m "Auto-stash before deployment $(date)" || true

# Pull latest changes
echo "⬇️  Pulling latest changes from git..."
git pull origin production-v1.0

# Always install dependencies to ensure they're available
echo "📦 Installing dependencies..."
npm install --production

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