# Safe Database Deployment Script for Production
# This script ensures safe database migrations with backup, validation, and rollback capabilities

param(
    [Parameter(Mandatory=$true)]
    [string]$MigrationFile,
    
    [string]$DB_HOST = "localhost",
    [string]$DB_USER = "root",
    [string]$DB_PASSWORD = "Goodmorning@1",
    [string]$DB_NAME = "crumbled_nextDB",
    [switch]$DryRun,
    [switch]$Force
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-DatabaseConnection {
    try {
        $connectionString = "mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e 'SELECT 1;'"
        $result = Invoke-Expression $connectionString 2>$null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

function Create-DatabaseBackup {
    param([string]$BackupName)
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "backups/${BackupName}_$timestamp.sql"
    
    # Create backups directory if it doesn't exist
    if (!(Test-Path "backups")) {
        New-Item -ItemType Directory -Path "backups" | Out-Null
    }
    
    Write-ColorOutput "📦 Creating database backup: $backupFile" $Yellow
    
    $mysqldumpCmd = "mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > $backupFile"
    
    try {
        Invoke-Expression $mysqldumpCmd
        if ($LASTEXITCODE -eq 0) {
            $fileSize = (Get-Item $backupFile).Length
            Write-ColorOutput "✅ Backup created successfully: $backupFile ($fileSize bytes)" $Green
            return $backupFile
        } else {
            throw "Backup failed with exit code: $LASTEXITCODE"
        }
    } catch {
        Write-ColorOutput "❌ Backup failed: $_" $Red
        throw
    }
}

function Test-MigrationFile {
    param([string]$MigrationPath)
    
    if (!(Test-Path $MigrationPath)) {
        throw "Migration file not found: $MigrationPath"
    }
    
    $content = Get-Content $MigrationPath -Raw
    if ([string]::IsNullOrWhiteSpace($content)) {
        throw "Migration file is empty: $MigrationPath"
    }
    
    Write-ColorOutput "✅ Migration file validated: $MigrationPath" $Green
    return $content
}

function Execute-Migration {
    param([string]$MigrationPath, [string]$BackupFile)
    
    Write-ColorOutput "🚀 Executing migration..." $Yellow
    
    if ($DryRun) {
        Write-ColorOutput "🔍 DRY RUN MODE - No changes will be made" $Cyan
        $content = Get-Content $MigrationPath -Raw
        Write-ColorOutput "Migration content preview:" $Cyan
        Write-ColorOutput $content.Substring(0, [Math]::Min(500, $content.Length)) $Cyan
        return $true
    }
    
    try {
        # Execute migration
        $mysqlCmd = "mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < $MigrationPath"
        Invoke-Expression $mysqlCmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Migration executed successfully!" $Green
            return $true
        } else {
            throw "Migration failed with exit code: $LASTEXITCODE"
        }
    } catch {
        Write-ColorOutput "❌ Migration failed: $_" $Red
        Write-ColorOutput "🔄 Attempting rollback..." $Yellow
        Restore-FromBackup $BackupFile
        throw
    }
}

function Restore-FromBackup {
    param([string]$BackupFile)
    
    if (!(Test-Path $BackupFile)) {
        Write-ColorOutput "❌ Backup file not found for rollback: $BackupFile" $Red
        return $false
    }
    
    Write-ColorOutput "🔄 Restoring from backup: $BackupFile" $Yellow
    
    try {
        $mysqlCmd = "mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < $BackupFile"
        Invoke-Expression $mysqlCmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Rollback completed successfully!" $Green
            return $true
        } else {
            Write-ColorOutput "❌ Rollback failed!" $Red
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Rollback error: $_" $Red
        return $false
    }
}

function Test-DatabaseIntegrity {
    Write-ColorOutput "🔍 Testing database integrity..." $Yellow
    
    try {
        # Test basic connectivity and common tables
        $testQueries = @(
            "SELECT COUNT(*) FROM customers;",
            "SELECT COUNT(*) FROM orders;",
            "SELECT COUNT(*) FROM products;"
        )
        
        foreach ($query in $testQueries) {
            $mysqlCmd = "mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e `"$query`""
            $result = Invoke-Expression $mysqlCmd 2>$null
            
            if ($LASTEXITCODE -ne 0) {
                throw "Database integrity test failed on query: $query"
            }
        }
        
        Write-ColorOutput "✅ Database integrity tests passed!" $Green
        return $true
    } catch {
        Write-ColorOutput "❌ Database integrity test failed: $_" $Red
        return $false
    }
}

# Main execution
try {
    Write-ColorOutput "🛡️  Safe Database Deployment Script" $Cyan
    Write-ColorOutput "=====================================" $Cyan
    
    # Validate parameters
    if ([string]::IsNullOrWhiteSpace($MigrationFile)) {
        throw "Migration file parameter is required"
    }
    
    # Check if migration file exists
    $migrationPath = if ([System.IO.Path]::IsPathRooted($MigrationFile)) {
        $MigrationFile
    } else {
        Join-Path "migrations" $MigrationFile
    }
    
    # Test database connection
    Write-ColorOutput "🔌 Testing database connection..." $Yellow
    if (!(Test-DatabaseConnection)) {
        throw "Cannot connect to database. Please check connection parameters."
    }
    Write-ColorOutput "✅ Database connection successful!" $Green
    
    # Validate migration file
    $migrationContent = Test-MigrationFile $migrationPath
    
    # Create backup
    $backupFile = Create-DatabaseBackup "before_$(Split-Path $MigrationFile -LeafBase)"
    
    # Test database integrity before migration
    if (!(Test-DatabaseIntegrity)) {
        throw "Database integrity check failed before migration"
    }
    
    # Execute migration
    $success = Execute-Migration $migrationPath $backupFile
    
    if ($success -and !$DryRun) {
        # Test database integrity after migration
        if (Test-DatabaseIntegrity) {
            Write-ColorOutput "✅ Migration completed successfully!" $Green
            Write-ColorOutput "📦 Backup available at: $backupFile" $Cyan
        } else {
            Write-ColorOutput "❌ Database integrity check failed after migration" $Red
            Write-ColorOutput "🔄 Rolling back changes..." $Yellow
            Restore-FromBackup $backupFile
            throw "Migration rolled back due to integrity check failure"
        }
    }
    
} catch {
    Write-ColorOutput "❌ Deployment failed: $_" $Red
    Write-ColorOutput "📞 Please contact your database administrator" $Yellow
    exit 1
}

Write-ColorOutput "🎉 Safe deployment completed!" $Green 