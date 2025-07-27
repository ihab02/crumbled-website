# Popup Ads System - Production Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the Popup Ads System to production safely and efficiently.

## Prerequisites
- Access to production database with sufficient privileges
- MySQL client tools installed (`mysql`, `mysqldump`)
- For Windows: PowerShell execution policy allowing script execution
- For Linux: Bash shell with execute permissions
- Backup of production database (recommended)

## Files Included

### Core Files
1. **Migration File**: `migrations/deploy_popup_ads_system_to_production.sql`
2. **Windows Deployment Script**: `scripts/deploy-popup-ads-to-production.ps1`
3. **Linux Deployment Script**: `scripts/deploy-popup-ads-to-production.sh` (Enhanced with Git revert points)
4. **Linux Rollback Script**: `scripts/rollback-popup-ads-deployment.sh` (Enhanced with Git support)
5. **This Guide**: `Docs/POPUP_ADS_PRODUCTION_DEPLOYMENT.md`

### Generated Files (During Deployment)
- `logs/popup-ads-deployment-YYYYMMDD-HHMMSS.log` - Deployment execution log
- `logs/popup-ads-deployment-YYYYMMDD-HHMMSS.info` - Deployment information file with rollback commands
- `backups/popup-ads-backup-YYYYMMDD-HHMMSS.sql` - Database backup file

## What the Migration Includes

### Database Tables
- **`popup_ads`**: Main table for storing popup advertisements
- **`popup_analytics`**: Analytics tracking for popup performance

### New Features
- ✅ Rich text content support (HTML formatting)
- ✅ Content overlay on images/videos
- ✅ Overlay positioning (9 positions: top-left, top-center, etc.)
- ✅ Overlay effects (fade, slide, bounce, glow, shadow)
- ✅ Transparent overlay backgrounds (rgba support)
- ✅ Optional button display
- ✅ Auto-close timer functionality
- ✅ YouTube video support with autoplay
- ✅ Analytics tracking (impressions, clicks, closes)
- ✅ Page targeting and exclusion
- ✅ Date range scheduling
- ✅ Priority-based display order

### Database Views
- **`active_popups`**: Shows currently active popups
- **`popup_analytics_summary`**: Analytics summary with click rates

## Deployment Options

### Option 1: Automated Deployment (Recommended)

#### For Windows (PowerShell)
```powershell
# Basic deployment
.\scripts\deploy-popup-ads-to-production.ps1 -DatabaseName "your_db_name" -DatabaseUser "your_user" -DatabasePassword "your_password"

# With custom host and port
.\scripts\deploy-popup-ads-to-production.ps1 -DatabaseName "your_db_name" -DatabaseUser "your_user" -DatabasePassword "your_password" -DatabaseHost "your_host" -DatabasePort 3306

# Dry run (test without making changes)
.\scripts\deploy-popup-ads-to-production.ps1 -DatabaseName "your_db_name" -DatabaseUser "your_user" -DatabasePassword "your_password" -DryRun

# Skip backup (not recommended for production)
.\scripts\deploy-popup-ads-to-production.ps1 -DatabaseName "your_db_name" -DatabaseUser "your_user" -DatabasePassword "your_password" -SkipBackup
```

#### For Linux/Ubuntu (Bash)
```bash
# Make script executable (first time only)
chmod +x scripts/deploy-popup-ads-to-production.sh

# Basic deployment (password will be prompted securely)
./scripts/deploy-popup-ads-to-production.sh -d your_db_name -u your_user

# With custom host and port
./scripts/deploy-popup-ads-to-production.sh -d your_db_name -u your_user -h your_host -P 3306

# Dry run (test without making changes)
./scripts/deploy-popup-ads-to-production.sh -d your_db_name -u your_user --dry-run

# Skip backup (not recommended for production)
./scripts/deploy-popup-ads-to-production.sh -d your_db_name -u your_user --skip-backup

# Show help
./scripts/deploy-popup-ads-to-production.sh --help
```

### Option 2: Manual Deployment
If you prefer manual deployment:

```bash
# 1. Create backup (recommended)
mysqldump -h your_host -P 3306 -u your_user -p your_db_name > backup_before_popup_ads.sql

# 2. Apply migration
mysql -h your_host -P 3306 -u your_user -p your_db_name < migrations/deploy_popup_ads_system_to_production.sql
```

## Deployment Process

### What the Script Does
1. **Git Repository Check**: Validates Git repository exists
2. **Git Revert Point**: Creates deployment tag for rollback
3. **Secure Password Prompt**: Prompts for database password securely
4. **Connection Test**: Verifies database connectivity
5. **Backup Creation**: Creates full database backup (if table exists)
6. **Table Check**: Determines if popup_ads table already exists
7. **Migration Application**: Applies the migration safely
8. **Verification**: Confirms all tables, columns, and views are created
9. **Deployment Info**: Saves deployment information with rollback commands
10. **Logging**: Records all actions in detailed log file

### Safety Features
- ✅ **Idempotent**: Can be run multiple times safely
- ✅ **Column Checks**: Only adds missing columns
- ✅ **Backup Creation**: Automatic backup before changes
- ✅ **Git Revert Points**: Creates deployment tags for safe rollback
- ✅ **Secure Password Handling**: Prompts for password securely (not in command line)
- ✅ **Deployment Tracking**: Saves deployment information for rollback coordination
- ✅ **Dry Run Mode**: Test deployment without making changes
- ✅ **Error Handling**: Comprehensive error checking and reporting
- ✅ **Logging**: Detailed logs of all operations

## Verification Steps

### After Deployment
1. **Check Tables Exist**:
   ```sql
   SHOW TABLES LIKE 'popup_ads';
   SHOW TABLES LIKE 'popup_analytics';
   ```

2. **Verify Views**:
   ```sql
   SHOW TABLES LIKE 'active_popups';
   SHOW TABLES LIKE 'popup_analytics_summary';
   ```

3. **Check Column Structure**:
   ```sql
   DESCRIBE popup_ads;
   ```

4. **Test Sample Data**:
   ```sql
   SELECT * FROM popup_ads LIMIT 5;
   ```

### Expected Columns in `popup_ads` Table
- `id` (Primary Key)
- `title` (VARCHAR)
- `content_type` (ENUM: image, text, html, video)
- `content` (TEXT)
- `content_overlay` (BOOLEAN) - **NEW**
- `overlay_position` (ENUM) - **NEW**
- `overlay_effect` (ENUM) - **NEW**
- `overlay_background` (VARCHAR) - **NEW**
- `overlay_padding` (INT) - **NEW**
- `overlay_border_radius` (INT) - **NEW**
- `image_url` (VARCHAR)
- `video_url` (VARCHAR)
- `background_color` (VARCHAR)
- `text_color` (VARCHAR)
- `button_text` (VARCHAR)
- `button_color` (VARCHAR)
- `button_url` (VARCHAR)
- `show_button` (BOOLEAN) - **NEW**
- `auto_close_seconds` (INT) - **NEW**
- `width` (INT)
- `height` (INT)
- `position` (ENUM)
- `animation` (ENUM)
- `delay_seconds` (INT)
- `show_frequency` (ENUM)
- `target_pages` (JSON)
- `exclude_pages` (JSON)
- `start_date` (DATETIME)
- `end_date` (DATETIME)
- `is_active` (BOOLEAN)
- `priority` (INT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Rollback Plan

### Automated Rollback (Recommended)
Use the enhanced rollback script for safe, automated rollback with multiple options:

#### For Linux/Ubuntu
```bash
# Make script executable (first time only)
chmod +x scripts/rollback-popup-ads-deployment.sh

# Basic rollback (uses latest backup)
./scripts/rollback-popup-ads-deployment.sh -d your_db_name -u your_user -p your_password

# Git rollback to previous commit (with database backup)
./scripts/rollback-popup-ads-deployment.sh -d your_db_name -u your_user -p your_password --git-rollback

# Git rollback to specific commit
./scripts/rollback-popup-ads-deployment.sh -d your_db_name -u your_user -p your_password --git-commit abc1234

# Restore from specific backup file
./scripts/rollback-popup-ads-deployment.sh -d your_db_name -u your_user -p your_password --restore-backup -b backups/popup-ads-backup-20241201-143022.sql

# Create backup only (no rollback)
./scripts/rollback-popup-ads-deployment.sh -d your_db_name -u your_user -p your_password --create-backup

# Force rollback without confirmation
./scripts/rollback-popup-ads-deployment.sh -d your_db_name -u your_user -p your_password --force

# Show help
./scripts/rollback-popup-ads-deployment.sh --help
```

### Manual Rollback
If you prefer manual rollback:

```bash
# 1. Stop the application if popup ads are causing problems
# 2. Restore from backup
mysql -h your_host -P 3306 -u your_user -p your_db_name < backup_before_popup_ads.sql

# 3. Or drop tables manually
mysql -h your_host -P 3306 -u your_user -p your_db_name -e "
DROP VIEW IF EXISTS active_popups;
DROP VIEW IF EXISTS popup_analytics_summary;
DROP TABLE IF EXISTS popup_analytics;
DROP TABLE IF EXISTS popup_ads;
"
```

### Rollback Scenarios

#### 1. **Git Rollback Scenarios**
- **Code deployment fails** - Rollback to previous working commit
- **Application crashes** after code changes - Revert to stable version
- **Configuration issues** - Rollback to known good configuration
- **Feature deployment problems** - Revert to pre-feature state

#### 2. **Database Rollback Scenarios**
- **Database migration fails** - Restore from backup
- **Data corruption** after deployment - Restore clean database state
- **Performance issues** - Rollback database changes
- **Schema conflicts** - Restore previous database structure

#### 3. **Emergency Rollback Scenarios**
- **Security vulnerabilities** discovered
- **Critical bugs** in production
- **Service outages** caused by deployment
- **Data loss** or corruption

### When to Use Each Rollback Method

#### **Use Git Rollback When:**
- Code changes are causing issues
- Application is crashing or behaving unexpectedly
- You need to revert to a specific working version
- Configuration changes are problematic

#### **Use Database Rollback When:**
- Database schema changes are causing issues
- Data has been corrupted or lost
- Performance problems are database-related
- Migration failed partially

#### **Use Combined Rollback When:**
- Both code and database changes need to be reverted
- Complete system state needs to be restored
- Multiple components are affected

### Backup Location
- **Deployment backups**: `backups/popup-ads-backup-YYYYMMDD-HHMMSS.sql`
- **Pre-rollback backups**: `backups/pre-rollback-backup-YYYYMMDD-HHMMSS.sql`
- **Git rollback backups**: `backups/git-rollback-backup-YYYYMMDD-HHMMSS.sql`
- **Manual backups**: `backups/manual-backup-YYYYMMDD-HHMMSS.sql`
- **Deployment logs**: `logs/popup-ads-deployment-YYYYMMDD-HHMMSS.log`
- **Rollback logs**: `logs/popup-ads-rollback-YYYYMMDD-HHMMSS.log`

## Post-Deployment Checklist

### Application Configuration
- [ ] Verify admin panel access to popup ads management
- [ ] Test popup creation with different content types
- [ ] Test rich text editor functionality
- [ ] Test overlay positioning and effects
- [ ] Test YouTube video embedding
- [ ] Test analytics tracking

### Frontend Testing
- [ ] Test popup display on different pages
- [ ] Verify rich text rendering
- [ ] Test overlay content positioning
- [ ] Test auto-close functionality
- [ ] Test button visibility controls
- [ ] Verify analytics collection

### Performance Monitoring
- [ ] Monitor database performance
- [ ] Check for any slow queries
- [ ] Monitor analytics table growth
- [ ] Verify backup processes

## Troubleshooting

### Common Issues

**1. Migration Fails with "Column Already Exists"**
- This is normal and safe - the migration handles existing columns
- Check the log file for details

**2. Foreign Key Constraint Errors**
- Ensure the `customers` table exists (for analytics foreign key)
- The migration will fail gracefully if dependencies are missing

**3. Permission Errors**
- Ensure database user has CREATE, ALTER, INSERT privileges
- Check if user can create tables and views

**4. Backup Creation Fails**
- Ensure sufficient disk space
- Check if mysqldump is available
- Verify user has SELECT privileges on all tables

### Rollback Issues

**1. Rollback Script Can't Find Backup File**
```bash
# Check available backups
ls -la backups/popup-ads-backup-*.sql

# Use specific backup file
./scripts/rollback-popup-ads-deployment.sh -d mydb -u myuser -p mypassword -b backups/specific-backup-file.sql
```

**2. Rollback Fails During Restore**
- Check if the backup file is corrupted: `head -20 backups/popup-ads-backup-*.sql`
- Try manual restore: `mysql -u user -p database < backup_file.sql`
- Check disk space: `df -h`

**3. Partial Rollback (Some Tables Remain)**
```bash
# Manual cleanup
mysql -u user -p database -e "
DROP VIEW IF EXISTS active_popups;
DROP VIEW IF EXISTS popup_analytics_summary;
DROP TABLE IF EXISTS popup_analytics;
DROP TABLE IF EXISTS popup_ads;
"
```

**4. Application Still Shows Popup Ads After Rollback**
- Clear application cache
- Restart the application server
- Check if popup ads component is still loaded in the frontend

### Emergency Rollback Procedures

**If Rollback Script Fails Completely:**
```bash
# 1. Stop the application immediately
sudo systemctl stop your-app-service

# 2. Manual database restore
mysql -h your_host -u your_user -p your_db_name < backups/popup-ads-backup-YYYYMMDD-HHMMSS.sql

# 3. Verify restoration
mysql -u your_user -p your_db_name -e "SHOW TABLES LIKE 'popup_ads';"

# 4. Restart application
sudo systemctl start your-app-service
```

**If Git Rollback Fails:**
```bash
# 1. Check Git status
git status
git log --oneline -5

# 2. Manual Git rollback
git reset --hard HEAD~1
# OR to specific commit
git reset --hard abc1234

# 3. Restart application
sudo systemctl restart your-app-service
```

**If No Backup Available:**
```bash
# 1. Create emergency backup of current state
mysqldump -u your_user -p your_db_name > emergency-backup-$(date +%Y%m%d-%H%M%S).sql

# 2. Drop popup ads objects
mysql -u your_user -p your_db_name -e "
DROP VIEW IF EXISTS active_popups;
DROP VIEW IF EXISTS popup_analytics_summary;
DROP TABLE IF EXISTS popup_analytics;
DROP TABLE IF EXISTS popup_ads;
"

# 3. Restart application
sudo systemctl restart your-app-service
```

**Complete System Rollback (Code + Database):**
```bash
# 1. Stop application
sudo systemctl stop your-app-service

# 2. Git rollback to previous commit
git reset --hard HEAD~1

# 3. Database rollback
mysql -u your_user -p your_db_name < backups/popup-ads-backup-YYYYMMDD-HHMMSS.sql

# 4. Restart application
sudo systemctl start your-app-service
```

### Log Analysis
- Check log files in `logs/` directory
- Look for ERROR level messages
- Verify all INFO messages show successful completion
- **Deployment logs**: `logs/popup-ads-deployment-*.log`
- **Rollback logs**: `logs/popup-ads-rollback-*.log`

## Support

If you encounter issues during deployment:
1. Check the log file for detailed error messages
2. Verify database connectivity and permissions
3. Ensure all prerequisites are met
4. Consider running in dry-run mode first

## Migration Safety

This migration is designed to be **production-safe**:
- ✅ Uses `CREATE TABLE IF NOT EXISTS`
- ✅ Uses `CREATE OR REPLACE VIEW`
- ✅ Checks column existence before adding
- ✅ Provides default values for all new columns
- ✅ Includes comprehensive error handling
- ✅ Creates automatic backups
- ✅ Supports rollback procedures

---

**Deployment Date**: 2024-12-01  
**Version**: 1.0  
**Author**: AI Assistant  
**Status**: Production Ready ✅ 