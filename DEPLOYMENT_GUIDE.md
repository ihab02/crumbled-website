# Deployment Guide

## Quick Deployment Steps (on Linux Server)

### 1. Pull Latest Changes
```bash
cd /var/www/crumbled-website
git pull origin production-v1.0
```

### 2. Use Protected Deployment Script
```bash
# Make script executable (first time only)
chmod +x scripts/deploy-server-protected.sh

# Run protected deployment
./scripts/deploy-server-protected.sh
```

## What the Protected Script Does

✅ **Protects Environment Files:**
- Backs up `.env.local` and `.env` before deployment
- Excludes them from file transfer
- Restores them after deployment

✅ **Smart Dependency Management:**
- Only reinstalls if `package.json` or `package-lock.json` changed
- Uses `npm ci` for faster, reliable installs
- Skips install if no changes detected

✅ **Complete Deployment:**
- Transfers all files (excluding protected ones)
- Builds the application
- Restarts PM2 process
- Verifies deployment success

## Alternative Scripts Available

- `scripts/deploy-server-cached.sh` - Uses npm cache for fastest installs
- `scripts/deploy-server-delta.sh` - Only installs missing modules
- `scripts/deploy-server-force-install.sh` - Always reinstalls (use if having issues)

## Manual Deployment (if scripts fail)

```bash
# 1. Backup environment files
cp .env.local .env.local.backup
cp .env .env.backup

# 2. Pull changes
git pull origin production-v1.0

# 3. Restore environment files
mv .env.local.backup .env.local
mv .env.backup .env

# 4. Install dependencies (if needed)
npm ci --production

# 5. Build application
npm run build

# 6. Restart application
pm2 restart crumbled-website
```

## Troubleshooting

### Environment Files Corrupted
```bash
# Restore from backup
mv .env.local.backup .env.local
mv .env.backup .env
```

### Dependencies Issues
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm ci --production
```

### PM2 Issues
```bash
# Check PM2 status
pm2 status

# Restart if needed
pm2 restart crumbled-website

# Or start fresh
pm2 delete crumbled-website
pm2 start npm --name 'crumbled-website' -- start
``` 