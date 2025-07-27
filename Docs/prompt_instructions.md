# 🤖 AI Assistant Prompt Instructions

## **Safe Database Deployment System**

### **System Overview**
This project has a comprehensive safe database deployment system with migration tracking. When working on database changes, always use the safe deployment tools to prevent data loss and ensure proper tracking.

### **Key Files and Scripts**

#### **Main Scripts**
- `scripts/enhanced-migration-runner.ps1` - Main migration runner with tracking and safety features
- `scripts/quick-deploy-reference.ps1` - Simple commands for common deployment tasks
- `scripts/safe-database-deployment.ps1` - Alternative deployment method with manual control

#### **Database Tracking**
- `migrations/create_migration_tracking.sql` - Creates migration tracking tables and views

#### **Documentation**
- `Docs/Safe_Database_Deployment_Guide.md` - Complete deployment guide
- `SAFE_DEPLOYMENT_SYSTEM_SUMMARY.md` - Detailed system summary
- `README_DEPLOYMENT.md` - Quick reference

### **Safe Deployment Commands**

#### **Quick Reference Commands**
```powershell
# Check migration status
.\scripts\quick-deploy-reference.ps1 status

# Create backup
.\scripts\quick-deploy-reference.ps1 backup

# Test migration (dry run)
.\scripts\quick-deploy-reference.ps1 test your_migration.sql

# Deploy migration safely
.\scripts\quick-deploy-reference.ps1 deploy your_migration.sql

# Rollback if needed
.\scripts\quick-deploy-reference.ps1 rollback
```

#### **Advanced Commands**
```powershell
# Enhanced migration runner
.\scripts\enhanced-migration-runner.ps1 -CheckStatus
.\scripts\enhanced-migration-runner.ps1 -MigrationFile "your_migration.sql" -DryRun
.\scripts\enhanced-migration-runner.ps1 -MigrationFile "your_migration.sql"

# Safe database deployment
.\scripts\safe-database-deployment.ps1 -MigrationFile "your_migration.sql" -DryRun
.\scripts\safe-database-deployment.ps1 -MigrationFile "your_migration.sql"
```

### **Safety Features**

#### **Automatic Protection**
1. **Backup Before Migration** - Always creates a backup first
2. **Migration Tracking** - Prevents duplicate migrations
3. **Integrity Checks** - Validates database before and after
4. **Automatic Rollback** - Restores from backup if migration fails
5. **Connection Validation** - Ensures database is accessible

#### **Manual Safety**
1. **Dry Run Mode** - Test migrations without applying changes
2. **Force Flag** - Override duplicate migration protection if needed
3. **Manual Rollback** - Restore from any backup file
4. **Status Checking** - Always know what's been applied

### **Migration Tracking System**

The system tracks:
- Which migrations were applied
- When they were applied
- Who applied them
- How long they took
- Success/failure status
- Error messages if any
- Backup file locations

### **Recommended Workflow**

#### **For New Database Features**
1. **Create Migration File** in `migrations/` folder
2. **Test on Development** using dry run mode
3. **Deploy to Production** using safe deployment
4. **Verify Success** by checking migration status

#### **Example Workflow**
```powershell
# 1. Create migration file: migrations/add_popup_ads.sql
# 2. Test migration
.\scripts\quick-deploy-reference.ps1 test add_popup_ads.sql

# 3. Deploy migration
.\scripts\quick-deploy-reference.ps1 deploy add_popup_ads.sql

# 4. Verify success
.\scripts\quick-deploy-reference.ps1 status
```

### **Emergency Procedures**

#### **If Migration Fails**
1. **Don't Panic** - Automatic rollback should handle this
2. **Check Migration Status** - Verify rollback was successful
3. **Review Error Logs** - Understand what went wrong
4. **Fix Migration File** - Correct the issue
5. **Test Again** - Use dry run mode first

#### **If Application Breaks**
1. **Check Application Logs** - Identify the issue
2. **Verify Database Schema** - Ensure tables exist
3. **Rollback if Necessary** - Use backup to restore
4. **Fix the Issue** - Correct the problem
5. **Redeploy Carefully** - Test thoroughly

### **Database Connection Details**

#### **Production Database**
- **Host**: localhost
- **User**: root
- **Password**: Goodmorning@1
- **Database**: crumbled_nextDB

#### **Backup Location**
- **Backup Directory**: `backups/`
- **Backup Format**: `backup_before_[migration_name]_[timestamp].sql`

### **Important Guidelines**

#### **Always Use Safe Deployment**
- Never run SQL migrations directly on production
- Always use the safe deployment scripts
- Always test with dry run mode first
- Always check migration status after deployment

#### **Migration File Naming**
- Use descriptive names: `add_popup_ads.sql`, `update_user_table.sql`
- Include date if needed: `20241201_add_new_feature.sql`
- Use prefixes: `add_`, `update_`, `fix_`, `remove_`

#### **Migration File Structure**
```sql
-- Migration: Add Popup Ads System
-- Description: Creates tables for popup advertisement management
-- Author: Your Name
-- Date: 2024-12-01
-- Version: 1.0

-- Create tables
CREATE TABLE IF NOT EXISTS `popup_ads` (
  -- table definition
);

-- Insert sample data (optional)
INSERT INTO `popup_ads` (`title`, `content_type`) VALUES 
('Welcome Popup', 'text');
```

### **For Future Conversations**

When starting a conversation about database changes, mention:

> "I have a safe database deployment system with migration tracking. The main script is `scripts/enhanced-migration-runner.ps1` and there's a quick reference at `scripts/quick-deploy-reference.ps1`. I also have a comprehensive guide at `Docs/Safe_Database_Deployment_Guide.md`. Always use the safe deployment tools for any database changes."

### **Key Benefits of This System**

1. **🛡️ Zero Risk** - Always have a backup and rollback plan
2. **📊 Full Visibility** - Know exactly what's been applied
3. **⚡ Fast Recovery** - Automatic rollback on failure
4. **🔍 Easy Monitoring** - Track all database changes
5. **🔄 Repeatable** - Consistent deployment process

### **Remember**
- **Always backup before changes**
- **Always test with dry run first**
- **Always check migration status**
- **Always use the safe deployment tools**
- **Never run raw SQL on production**

This system ensures safe, tracked, and recoverable database deployments for the Crumbled website project. 