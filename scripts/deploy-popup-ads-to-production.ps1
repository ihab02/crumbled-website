# Popup Ads System - Production Deployment Script
# This script safely deploys the popup ads system to production
# Author: AI Assistant
# Date: 2024-12-01
# Version: 1.0

param(
    [Parameter(Mandatory=$true)]
    [string]$DatabaseName,
    
    [Parameter(Mandatory=$true)]
    [string]$DatabaseUser,
    
    [Parameter(Mandatory=$true)]
    [string]$DatabasePassword,
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseHost = "localhost",
    
    [Parameter(Mandatory=$false)]
    [int]$DatabasePort = 3306,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBackup
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$MigrationFile = Join-Path $ProjectRoot "migrations\deploy_popup_ads_system_to_production.sql"
$BackupDir = Join-Path $ProjectRoot "backups"
$LogFile = Join-Path $ProjectRoot "logs\popup-ads-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Create directories if they don't exist
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

if (!(Test-Path (Split-Path $LogFile))) {
    New-Item -ItemType Directory -Path (Split-Path $LogFile) -Force | Out-Null
}

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    Add-Content -Path $LogFile -Value $logMessage
}

# Error handling function
function Handle-Error {
    param([string]$ErrorMessage, [int]$ExitCode = 1)
    Write-Log "ERROR: $ErrorMessage" "ERROR"
    Write-Log "Deployment failed. Check the log file: $LogFile" "ERROR"
    exit $ExitCode
}

# Test database connection
function Test-DatabaseConnection {
    Write-Log "Testing database connection..."
    
    $testQuery = "SELECT 1 as test"
    $testResult = mysql -h $DatabaseHost -P $DatabasePort -u $DatabaseUser -p$DatabasePassword $DatabaseName -e $testQuery 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Handle-Error "Failed to connect to database. Error: $testResult"
    }
    
    Write-Log "Database connection successful"
}

# Create backup
function Create-Backup {
    if ($SkipBackup) {
        Write-Log "Skipping backup as requested"
        return
    }
    
    Write-Log "Creating database backup..."
    $backupFile = Join-Path $BackupDir "popup-ads-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"
    
    $backupResult = mysqldump -h $DatabaseHost -P $DatabasePort -u $DatabaseUser -p$DatabasePassword --single-transaction --routines --triggers $DatabaseName > $backupFile 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Handle-Error "Failed to create backup. Error: $backupResult"
    }
    
    Write-Log "Backup created successfully: $backupFile"
    return $backupFile
}

# Check if popup_ads table exists
function Test-PopupAdsTable {
    Write-Log "Checking if popup_ads table exists..."
    
    $checkQuery = "SELECT COUNT(*) as table_exists FROM information_schema.tables WHERE table_schema = '$DatabaseName' AND table_name = 'popup_ads'"
    $checkResult = mysql -h $DatabaseHost -P $DatabasePort -u $DatabaseUser -p$DatabasePassword $DatabaseName -e $checkQuery 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Handle-Error "Failed to check table existence. Error: $checkResult"
    }
    
    $tableExists = $checkResult | Select-String -Pattern "\d+" | ForEach-Object { $_.Matches[0].Value }
    
    if ($tableExists -eq "1") {
        Write-Log "popup_ads table already exists"
        return $true
    } else {
        Write-Log "popup_ads table does not exist"
        return $false
    }
}

# Get current table structure
function Get-TableStructure {
    Write-Log "Getting current table structure..."
    
    $structureQuery = @"
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT,
    ORDINAL_POSITION
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = '$DatabaseName' 
  AND TABLE_NAME = 'popup_ads' 
ORDER BY ORDINAL_POSITION
"@
    
    $structureResult = mysql -h $DatabaseHost -P $DatabasePort -u $DatabaseUser -p$DatabasePassword $DatabaseName -e $structureQuery 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Handle-Log "Failed to get table structure. Error: $structureResult"
        return $null
    }
    
    return $structureResult
}

# Apply migration
function Apply-Migration {
    param([string]$MigrationFile)
    
    Write-Log "Applying migration from: $MigrationFile"
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would apply migration (no changes made)"
        return
    }
    
    $migrationResult = mysql -h $DatabaseHost -P $DatabasePort -u $DatabaseUser -p$DatabasePassword $DatabaseName < $MigrationFile 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Handle-Error "Failed to apply migration. Error: $migrationResult"
    }
    
    Write-Log "Migration applied successfully"
}

# Verify deployment
function Verify-Deployment {
    Write-Log "Verifying deployment..."
    
    # Check if tables exist
    $tablesQuery = "SHOW TABLES LIKE 'popup_ads'"
    $tablesResult = mysql -h $DatabaseHost -P $DatabasePort -u $DatabaseUser -p$DatabasePassword $DatabaseName -e $tablesQuery 2>&1
    
    if ($LASTEXITCODE -ne 0 -or $tablesResult -notmatch "popup_ads") {
        Handle-Error "popup_ads table not found after migration"
    }
    
    # Check if views exist
    $viewsQuery = "SHOW TABLES LIKE 'active_popups'"
    $viewsResult = mysql -h $DatabaseHost -P $DatabasePort -u $DatabaseUser -p$DatabasePassword $DatabaseName -e $viewsQuery 2>&1
    
    if ($LASTEXITCODE -ne 0 -or $viewsResult -notmatch "active_popups") {
        Handle-Error "active_popups view not found after migration"
    }
    
    # Check table structure
    $structure = Get-TableStructure
    if ($structure -notmatch "content_overlay") {
        Handle-Error "content_overlay column not found after migration"
    }
    
    if ($structure -notmatch "show_button") {
        Handle-Error "show_button column not found after migration"
    }
    
    if ($structure -notmatch "auto_close_seconds") {
        Handle-Error "auto_close_seconds column not found after migration"
    }
    
    Write-Log "Deployment verification successful"
}

# Main deployment process
function Start-Deployment {
    Write-Log "Starting Popup Ads System deployment to production"
    Write-Log "Database: $DatabaseName@$DatabaseHost:$DatabasePort"
    Write-Log "User: $DatabaseUser"
    Write-Log "Dry Run: $DryRun"
    Write-Log "Skip Backup: $SkipBackup"
    
    # Check if migration file exists
    if (!(Test-Path $MigrationFile)) {
        Handle-Error "Migration file not found: $MigrationFile"
    }
    
    # Test database connection
    Test-DatabaseConnection
    
    # Check if table exists
    $tableExists = Test-PopupAdsTable
    
    # Create backup if table exists
    if ($tableExists -and !$SkipBackup) {
        $backupFile = Create-Backup
    }
    
    # Get current structure if table exists
    if ($tableExists) {
        $currentStructure = Get-TableStructure
        Write-Log "Current table structure detected"
    }
    
    # Apply migration
    Apply-Migration -MigrationFile $MigrationFile
    
    # Verify deployment
    Verify-Deployment
    
    Write-Log "Popup Ads System deployment completed successfully!"
    Write-Log "Log file: $LogFile"
    
    if ($backupFile) {
        Write-Log "Backup file: $backupFile"
    }
}

# Execute deployment
try {
    Start-Deployment
} catch {
    Handle-Error "Unexpected error: $($_.Exception.Message)"
} 