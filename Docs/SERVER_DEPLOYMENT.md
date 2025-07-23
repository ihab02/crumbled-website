# Server Deployment Guide

This guide explains how to safely deploy changes to the server without affecting the `node_modules` folder.

## Quick Deployment Steps

### Option 1: Using the Deployment Scripts

#### For Linux/Unix Servers:
```bash
# Make the script executable
chmod +x scripts/deploy-server.sh

# Run the deployment script
./scripts/deploy-server.sh
```

#### For Windows Servers:
```powershell
# Run the PowerShell deployment script
.\scripts\deploy-server.ps1
```

### Option 2: Manual Deployment

#### Step 1: Navigate to Project Directory
```bash
cd /path/to/your/crumbled-website
```

#### Step 2: Stash Any Local Changes (Optional)
```bash
git stash push -m "Auto-stash before deployment"
```

#### Step 3: Pull Latest Changes
```bash
git pull origin production-v1.0
```

#### Step 4: Check if Dependencies Changed
```bash
# Check if package.json or package-lock.json were modified
git diff --name-only HEAD~1 HEAD | grep -E "(package\.json|package-lock\.json)"
```

#### Step 5: Update Dependencies (Only if Changed)
If dependencies changed, run:
```bash
# Remove existing node_modules and lock file
rm -rf node_modules
rm -f package-lock.json

# Install dependencies
npm install --production
```

#### Step 6: Build the Application
```bash
npm run build
```

#### Step 7: Restart the Application
Choose the appropriate method based on your deployment setup:

**Using PM2:**
```bash
pm2 restart crumbled-website
```

**Using systemd:**
```bash
sudo systemctl restart crumbled-website
```

**Using Docker:**
```bash
docker-compose down && docker-compose up -d
```

## Why This Approach Works

1. **`.gitignore` Protection**: The `node_modules/` folder is excluded from git, so it won't be affected by pulls
2. **Smart Dependency Detection**: The scripts only reinstall dependencies when `package.json` or `package-lock.json` actually change
3. **Clean Installation**: When dependencies do change, we completely remove and reinstall to avoid conflicts
4. **Production Mode**: Using `npm install --production` only installs production dependencies, saving time and space

## Troubleshooting

### If you get permission errors:
```bash
# Make sure you have the right permissions
sudo chown -R $USER:$USER /path/to/your/crumbled-website
```

### If npm install fails:
```bash
# Clear npm cache
npm cache clean --force

# Try installing again
npm install --production
```

### If the build fails:
```bash
# Check for any missing dependencies
npm install

# Try building again
npm run build
```

## Best Practices

1. **Always backup before deployment**: Create a backup of your current working version
2. **Test on staging first**: If possible, test changes on a staging environment before production
3. **Monitor logs**: Check application logs after deployment to ensure everything is working
4. **Use deployment scripts**: The provided scripts handle edge cases and provide better error handling
5. **Keep node_modules out of git**: Never commit `node_modules` to version control

## Environment Variables

Make sure your server has the correct environment variables set:
- Database connection strings
- API keys
- Environment-specific configurations

The application expects these to be available in the production environment. 