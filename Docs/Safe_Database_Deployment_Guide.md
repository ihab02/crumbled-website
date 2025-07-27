# 🛡️ Safe Database Deployment Guide for Production

## **Overview**
This guide provides a comprehensive strategy for safely deploying database changes to your production server without risking data loss or service interruption.

---

## **📋 Pre-Deployment Checklist**

### **✅ Before Any Database Changes**

1. **Backup Current Database**
   ```powershell
   # Create a full backup
   .\backup-database.ps1
   ```

2. **Check Current Migration Status**
   ```powershell
   # View all applied migrations
   .\scripts\enhanced-migration-runner.ps1 -CheckStatus
   ```

3. **Test Migration in Dry Run Mode**
   ```powershell
   # Test migration without applying changes
   .\scripts\enhanced-migration-runner.ps1 -MigrationFile "your_migration.sql" -DryRun
   ```

4. **Verify Database Connection**
   ```powershell
   # Test connection to production database
   .\scripts\safe-database-deployment.ps1 -MigrationFile "test.sql" -DryRun
   ```

---

## **🚀 Safe Deployment Methods**

### **Method 1: Enhanced Migration Runner (Recommended)**

This is the safest method with automatic tracking and rollback capabilities.

```powershell
# Step 1: Check migration status
.\scripts\enhanced-migration-runner.ps1 -CheckStatus

# Step 2: Run migration safely
.\scripts\enhanced-migration-runner.ps1 -MigrationFile "add_popup_ads.sql"

# Step 3: Verify migration was applied
.\scripts\enhanced-migration-runner.ps1 -CheckStatus
```

**Features:**
- ✅ Automatic backup before migration
- ✅ Migration tracking and history
- ✅ Prevents duplicate migrations
- ✅ Automatic rollback on failure
- ✅ Execution time tracking
- ✅ Detailed error reporting

### **Method 2: Safe Database Deployment Script**

For more control and manual oversight.

```powershell
# Step 1: Test migration safely
.\scripts\safe-database-deployment.ps1 -MigrationFile "add_popup_ads.sql" -DryRun

# Step 2: Execute migration with backup
.\scripts\safe-database-deployment.ps1 -MigrationFile "add_popup_ads.sql"
```

**Features:**
- ✅ Automatic backup creation
- ✅ Database integrity checks
- ✅ Rollback capability
- ✅ Connection validation
- ✅ Migration file validation

### **Method 3: Manual Backup + Migration**

For maximum control and visibility.

```powershell
# Step 1: Create manual backup
.\backup-database.ps1

# Step 2: Run migration manually
mysql -h localhost -u root -p crumbled_nextDB < migrations/add_popup_ads.sql

# Step 3: Verify changes
mysql -h localhost -u root -p crumbled_nextDB -e "SHOW TABLES;"
```

---

## **📊 Migration Tracking System**

### **View Migration History**
```powershell
# List all migrations and their status
.\scripts\enhanced-migration-runner.ps1 -ListMigrations
```

### **Check Specific Migration**
```sql
-- Query migration history directly
SELECT * FROM migration_history WHERE migration_name = 'add_popup_ads';
```

### **Migration Status Meanings**
- **✅ success**: Migration applied successfully
- **❌ failed**: Migration failed and was rolled back
- **🔄 rolled_back**: Migration was manually rolled back
- **⏳ running**: Migration is currently executing

---

## **🔄 Rollback Procedures**

### **Automatic Rollback**
The enhanced migration runner automatically rolls back failed migrations.

### **Manual Rollback**
```powershell
# Step 1: Find backup file
Get-ChildItem backups\*add_popup_ads*.sql

# Step 2: Restore from backup
mysql -h localhost -u root -p crumbled_nextDB < backups\backup_before_add_popup_ads_20241201_143022.sql

# Step 3: Update migration status
mysql -h localhost -u root -p crumbled_nextDB -e "UPDATE migration_history SET status = 'rolled_back' WHERE migration_name = 'add_popup_ads';"
```

---

## **🔧 Creating New Migrations**

### **Migration File Naming Convention**
```
migrations/
├── add_popup_ads.sql              # Add new feature
├── update_popup_ads_structure.sql # Modify existing feature
├── fix_popup_ads_bug.sql          # Bug fix
└── remove_old_popup_ads.sql       # Remove deprecated feature
```

### **Migration File Structure**
```sql
-- Migration: Add Popup Ads System
-- Description: Creates tables for popup advertisement management
-- Author: Your Name
-- Date: 2024-12-01
-- Version: 1.0

-- Create popup_ads table
CREATE TABLE IF NOT EXISTS `popup_ads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  -- ... other fields
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create popup_analytics table
CREATE TABLE IF NOT EXISTS `popup_analytics` (
  -- ... table definition
);

-- Insert sample data (optional)
INSERT INTO `popup_ads` (`title`, `content_type`) VALUES 
('Welcome Popup', 'text'),
('Special Offer', 'image');
```

---

## **⚠️ Safety Best Practices**

### **1. Always Test First**
```powershell
# Test migration on development database first
.\scripts\enhanced-migration-runner.ps1 -MigrationFile "add_popup_ads.sql" -DryRun
```

### **2. Use Dry Run Mode**
```powershell
# Preview migration without applying changes
.\scripts\safe-database-deployment.ps1 -MigrationFile "add_popup_ads.sql" -DryRun
```

### **3. Schedule During Low Traffic**
- Deploy during off-peak hours
- Monitor application performance
- Have rollback plan ready

### **4. Monitor After Deployment**
```powershell
# Check application logs
Get-Content logs\application.log -Tail 50

# Monitor database performance
mysql -h localhost -u root -p -e "SHOW PROCESSLIST;"
```

### **5. Keep Backups Organized**
```powershell
# Create organized backup structure
New-Item -ItemType Directory -Path "backups\$(Get-Date -Format 'yyyy-MM')" -Force
```

---

## **🚨 Emergency Procedures**

### **If Migration Fails**
1. **Don't Panic** - Automatic rollback should handle this
2. **Check Migration Status** - Verify rollback was successful
3. **Review Error Logs** - Understand what went wrong
4. **Fix Migration File** - Correct the issue
5. **Test Again** - Use dry run mode first

### **If Application Breaks**
1. **Check Application Logs** - Identify the issue
2. **Verify Database Schema** - Ensure tables exist
3. **Rollback if Necessary** - Use backup to restore
4. **Fix the Issue** - Correct the problem
5. **Redeploy Carefully** - Test thoroughly

### **If Data is Lost**
1. **Stop All Operations** - Prevent further data loss
2. **Locate Latest Backup** - Find most recent backup
3. **Restore from Backup** - Use backup-database.ps1
4. **Verify Data Integrity** - Check all critical tables
5. **Investigate Root Cause** - Understand what happened

---

## **📞 Support and Troubleshooting**

### **Common Issues**

**Connection Failed**
```powershell
# Check database connection
mysql -h localhost -u root -p -e "SELECT 1;"
```

**Permission Denied**
```powershell
# Check file permissions
Get-Acl "migrations\add_popup_ads.sql"
```

**Migration Already Applied**
```powershell
# Check migration history
.\scripts\enhanced-migration-runner.ps1 -CheckStatus
```

**Backup Failed**
```powershell
# Check disk space
Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, FreeSpace, Size
```

### **Getting Help**
1. **Check Migration Logs** - Review detailed error messages
2. **Review Migration History** - See what was applied
3. **Contact Database Admin** - For complex issues
4. **Use Backup** - If all else fails

---

## **📈 Monitoring and Maintenance**

### **Regular Maintenance Tasks**
```powershell
# Weekly: Check migration status
.\scripts\enhanced-migration-runner.ps1 -CheckStatus

# Monthly: Clean old backups (keep last 30 days)
Get-ChildItem backups\*.sql | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Remove-Item

# Quarterly: Verify database integrity
mysqlcheck -h localhost -u root -p --all-databases
```

### **Performance Monitoring**
```sql
-- Check table sizes
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'crumbled_nextDB'
ORDER BY (data_length + index_length) DESC;
```

---

## **🎯 Summary**

This safe deployment strategy provides:

1. **🛡️ Protection** - Automatic backups and rollback
2. **📊 Tracking** - Complete migration history
3. **🔍 Visibility** - Clear status and progress
4. **⚡ Speed** - Efficient deployment process
5. **🔄 Recovery** - Multiple rollback options

**Remember**: Always test in development first, use dry run mode, and keep backups organized! 