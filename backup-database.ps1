# Database Backup Script for Crumbled
# This script creates a backup of the database before running migrations

param(
    [string]$DB_HOST = "localhost",
    [string]$DB_USER = "root",
    [string]$DB_PASSWORD = "Goodmorning@1",
    [string]$DB_NAME = "crumbled_nextDB"
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "backup_before_promo_codes_$timestamp.sql"

Write-Host "Creating database backup: $backupFile" -ForegroundColor Green

# Create backup using mysqldump
$mysqldumpCmd = "mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > $backupFile"

try {
    Invoke-Expression $mysqldumpCmd
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database backup created successfully: $backupFile" -ForegroundColor Green
        Write-Host "Backup file size: $((Get-Item $backupFile).Length) bytes" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Database backup failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error creating backup: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Backup completed successfully!" -ForegroundColor Green 