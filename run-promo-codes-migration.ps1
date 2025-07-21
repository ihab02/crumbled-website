# Promo Codes Migration Script for Crumbled
# This script runs the promo codes migration after creating a backup

param(
    [string]$DB_HOST = "localhost",
    [string]$DB_USER = "root",
    [string]$DB_PASSWORD = "Goodmorning@1",
    [string]$DB_NAME = "crumbled_nextDB"
)

Write-Host "🚀 Starting Promo Codes Migration" -ForegroundColor Green
Write-Host "Database: $DB_NAME on $DB_HOST" -ForegroundColor Cyan

# Step 1: Create backup
Write-Host "`n📦 Step 1: Creating database backup..." -ForegroundColor Yellow
& "$PSScriptRoot\backup-database.ps1" -DB_HOST $DB_HOST -DB_USER $DB_USER -DB_PASSWORD $DB_PASSWORD -DB_NAME $DB_NAME

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backup failed! Aborting migration." -ForegroundColor Red
    exit 1
}

# Step 2: Run migration
Write-Host "`n🔧 Step 2: Running promo codes migration..." -ForegroundColor Yellow

$migrationFile = "migrations\add_promo_codes.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Found migration file: $migrationFile" -ForegroundColor Green

# Run the migration using mysql command with proper PowerShell syntax
try {
    Write-Host "Executing migration..." -ForegroundColor Cyan
    Get-Content $migrationFile | mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Migration failed!" -ForegroundColor Red
        Write-Host "You can restore from the backup if needed." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Error running migration: $_" -ForegroundColor Red
    Write-Host "You can restore from the backup if needed." -ForegroundColor Yellow
    exit 1
}

# Step 3: Verify migration
Write-Host "`n🔍 Step 3: Verifying migration..." -ForegroundColor Yellow

$verifyCmd = "mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e `"SHOW TABLES LIKE 'promo_codes';`""

try {
    $result = Invoke-Expression $verifyCmd
    if ($result -match "promo_codes") {
        Write-Host "✅ Promo codes table created successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Promo codes table not found!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error verifying migration: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 Migration completed successfully!" -ForegroundColor Green
Write-Host "The promo codes system is now ready to use." -ForegroundColor Cyan 