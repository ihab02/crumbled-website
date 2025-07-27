#!/bin/bash

# Smart Delta Deployment Script
# Only installs missing modules and updates outdated ones

set -e  # Exit on any error

echo "🚀 Starting smart delta deployment..."

# Navigate to project directory
cd /var/www/crumbled-website

# Stash any local changes (if any)
echo "📦 Stashing any local changes..."
git stash push -m "Auto-stash before deployment $(date)" || true

# Pull latest changes
echo "⬇️  Pulling latest changes from git..."
git pull origin production-v1.0

# Function to check if a module is missing
check_missing_modules() {
    echo "🔍 Checking for missing modules..."
    
    # Get list of dependencies from package.json
    local deps=$(node -e "
        const pkg = require('./package.json');
        const allDeps = {...pkg.dependencies, ...pkg.devDependencies};
        console.log(Object.keys(allDeps).join(' '));
    ")
    
    local missing_modules=""
    
    for dep in $deps; do
        if [ ! -d "node_modules/$dep" ]; then
            missing_modules="$missing_modules $dep"
        fi
    done
    
    echo "$missing_modules"
}

# Check if we need to install anything
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules directory missing, running full install..."
    npm install --production
elif [ ! -f "package-lock.json" ]; then
    echo "📦 package-lock.json missing, running npm install..."
    npm install --production
else
    # Check for missing modules
    missing=$(check_missing_modules)
    
    if [ -n "$missing" ]; then
        echo "📦 Installing missing modules: $missing"
        npm install --production --no-save $missing
    else
        echo "✅ All modules are present"
        
        # Check if package.json changed and update if needed
        if git diff --name-only HEAD~1 HEAD | grep -E "package\.json" > /dev/null; then
            echo "📦 package.json changed, updating dependencies..."
            npm install --production --no-save
        fi
    fi
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