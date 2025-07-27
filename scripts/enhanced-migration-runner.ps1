# Enhanced Migration Runner with Tracking
# This script runs migrations safely and tracks their status

param(
    [Parameter(Mandatory=$true)]
    [string]$MigrationFile,
    
    [string]$DB_HOST = "localhost",
    [string]$DB_USER = "root",
    [string]$DB_PASSWORD = "Goodmorning@1",
    [string]$DB_NAME = "crumbled_nextDB",
    [switch]$DryRun,
    [switch]$Force,
    [switch]$ListMigrations,
    [switch]$CheckStatus
)

# Set error action preference
$ErrorActionPreference = "Stop"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-MigrationTrackingTable {
    try {
        $query = "SELECT COUNT(*) FROM migration_history;"
        $mysqlCmd = "mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e `"$query`""
        $result = Invoke-Expression $mysqlCmd 2>$null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

function Initialize-MigrationTracking {
    Write-ColorOutput "🔧 Initializing migration tracking..." "Yellow"
    
    $trackingMigration = "migrations/create_migration_tracking.sql"
    if (Test-Path $trackingMigration) {
        $mysqlCmd = "mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < $trackingMigration"
        Invoke-Expression $mysqlCmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Migration tracking initialized!" "Green"
            return $true
        } else {
            Write-ColorOutput "❌ Failed to initialize migration tracking" "Red"
            return $false
        }
    } else {
        Write-ColorOutput "❌ Migration tracking file not found: $trackingMigration" "Red"
        return $false
    }
}

function Get-MigrationStatus {
    if (!(Test-MigrationTrackingTable)) {
        if (!(Initialize-MigrationTracking)) {
            return @()
        }
    }
    
    try {
        $query = "SELECT migration_name, migration_file, applied_at, status, applied_by FROM migration_history ORDER BY applied_at DESC;"
        $mysqlCmd = "mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e `"$query`""
        $result = Invoke-Expression $mysqlCmd 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            return $result | Select-Object -Skip 1 | ForEach-Object {
                $parts = $_ -split '\t'
                if ($parts.Length -ge 5) {
                    [PSCustomObject]@{
                        MigrationName = $parts[0]
                        MigrationFile = $parts[1]
                        AppliedAt = $parts[2]
                        Status = $parts[3]
                        AppliedBy = $parts[4]
                    }
                }
            }
        }
    } catch {
        Write-ColorOutput "❌ Error getting migration status: $_" "Red"
    }
    
    return @()
}

function Show-MigrationStatus {
    Write-ColorOutput "📋 Migration Status" "Cyan"
    Write-ColorOutput "==================" "Cyan"
    
    $migrations = Get-MigrationStatus
    
    if ($migrations.Count -eq 0) {
        Write-ColorOutput "No migrations found in tracking table." "Yellow"
        return
    }
    
    foreach ($migration in $migrations) {
        $statusColor = switch ($migration.Status) {
            "success" { "Green" }
            "failed" { "Red" }
            "rolled_back" { "Yellow" }
            default { "White" }
        }
        
        Write-ColorOutput "📄 $($migration.MigrationName)" "White"
        Write-ColorOutput "   File: $($migration.MigrationFile)" "Gray"
        Write-ColorOutput "   Applied: $($migration.AppliedAt)" "Gray"
        Write-ColorOutput "   Status: $($migration.Status)" $statusColor
        Write-ColorOutput "   By: $($migration.AppliedBy)" "Gray"
        Write-ColorOutput ""
    }
}

function Test-MigrationAlreadyApplied {
    param([string]$MigrationName)
    
    if (!(Test-MigrationTrackingTable)) {
        return $false
    }
    
    try {
        $query = "SELECT COUNT(*) FROM migration_history WHERE migration_name = '$MigrationName' AND status = 'success';"
        $mysqlCmd = "mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e `"$query`""
        $result = Invoke-Expression $mysqlCmd 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            $count = ($result | Select-Object -Last 1).Trim()
            return [int]$count -gt 0
        }
    } catch {
        Write-ColorOutput "❌ Error checking migration status: $_" "Red"
    }
    
    return $false
}

function Record-MigrationStart {
    param([string]$MigrationName, [string]$MigrationFile)
    
    try {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $query = "INSERT INTO migration_history (migration_name, migration_file, applied_at, applied_by, status) VALUES ('$MigrationName', '$MigrationFile', '$timestamp', '$(whoami)', 'running');"
        $mysqlCmd = "mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e `"$query`""
        Invoke-Expression $mysqlCmd 2>$null
        return $LASTEXITCODE -eq 0
    } catch {
        Write-ColorOutput "❌ Error recording migration start: $_" "Red"
        return $false
    }
}

function Update-MigrationStatus {
    param([string]$MigrationName, [string]$Status, [string]$ErrorMessage = $null, [string]$BackupFile = $null, [int]$ExecutionTime = $null)
    
    try {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $errorClause = if ($ErrorMessage) { ", error_message = '$ErrorMessage'" } else { "" }
        $backupClause = if ($BackupFile) { ", backup_file = '$BackupFile'" } else { "" }
        $timeClause = if ($ExecutionTime) { ", execution_time_ms = $ExecutionTime" } else { "" }
        
        $query = "UPDATE migration_history SET status = '$Status', applied_at = '$timestamp'$errorClause$backupClause$timeClause WHERE migration_name = '$MigrationName';"
        $mysqlCmd = "mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e `"$query`""
        Invoke-Expression $mysqlCmd 2>$null
        return $LASTEXITCODE -eq 0
    } catch {
        Write-ColorOutput "❌ Error updating migration status: $_" "Red"
        return $false
    }
}

function Execute-SafeMigration {
    param([string]$MigrationFile)
    
    $startTime = Get-Date
    $migrationName = [System.IO.Path]::GetFileNameWithoutExtension($MigrationFile)
    $migrationPath = if ([System.IO.Path]::IsPathRooted($MigrationFile)) {
        $MigrationFile
    } else {
        Join-Path "migrations" $MigrationFile
    }
    
    Write-ColorOutput "🚀 Executing migration: $migrationName" "Yellow"
    
    # Check if already applied
    if (Test-MigrationAlreadyApplied $migrationName) {
        Write-ColorOutput "ℹ️  Migration '$migrationName' has already been applied successfully." "Cyan"
        if (!$Force) {
            Write-ColorOutput "Use -Force to reapply the migration." "Yellow"
            return $true
        }
    }
    
    # Record migration start
    if (!(Record-MigrationStart $migrationName $migrationFile)) {
        Write-ColorOutput "❌ Failed to record migration start" "Red"
        return $false
    }
    
    # Create backup
    $backupFile = $null
    if (!$DryRun) {
        $backupScript = "scripts/safe-database-deployment.ps1"
        if (Test-Path $backupScript) {
            $backupFile = "backups/${migrationName}_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
            if (!(Test-Path "backups")) {
                New-Item -ItemType Directory -Path "backups" | Out-Null
            }
            
            $mysqldumpCmd = "mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > $backupFile"
            Invoke-Expression $mysqldumpCmd
            
            if ($LASTEXITCODE -ne 0) {
                Write-ColorOutput "❌ Backup failed" "Red"
                Update-MigrationStatus $migrationName "failed" "Backup failed"
                return $false
            }
            
            Write-ColorOutput "✅ Backup created: $backupFile" "Green"
        }
    }
    
    # Execute migration
    try {
        if ($DryRun) {
            Write-ColorOutput "🔍 DRY RUN MODE - No changes will be made" "Cyan"
            $content = Get-Content $migrationPath -Raw
            Write-ColorOutput "Migration content preview:" "Cyan"
            Write-ColorOutput $content.Substring(0, [Math]::Min(500, $content.Length)) "Cyan"
            Update-MigrationStatus $migrationName "success" $null $backupFile 0
            return $true
        }
        
        $mysqlCmd = "mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < $migrationPath"
        Invoke-Expression $mysqlCmd
        
        $endTime = Get-Date
        $executionTime = [int]($endTime - $startTime).TotalMilliseconds
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Migration executed successfully!" "Green"
            Update-MigrationStatus $migrationName "success" $null $backupFile $executionTime
            return $true
        } else {
            Write-ColorOutput "❌ Migration failed with exit code: $LASTEXITCODE" "Red"
            Update-MigrationStatus $migrationName "failed" "Migration execution failed" $backupFile $executionTime
            return $false
        }
    } catch {
        $endTime = Get-Date
        $executionTime = [int]($endTime - $startTime).TotalMilliseconds
        Write-ColorOutput "❌ Migration error: $_" "Red"
        Update-MigrationStatus $migrationName "failed" $_.Exception.Message $backupFile $executionTime
        return $false
    }
}

# Main execution
try {
    Write-ColorOutput "🛡️  Enhanced Migration Runner" "Cyan"
    Write-ColorOutput "=============================" "Cyan"
    
    if ($ListMigrations) {
        Show-MigrationStatus
        return
    }
    
    if ($CheckStatus) {
        Show-MigrationStatus
        return
    }
    
    if ([string]::IsNullOrWhiteSpace($MigrationFile)) {
        throw "Migration file parameter is required"
    }
    
    # Initialize migration tracking if needed
    if (!(Test-MigrationTrackingTable)) {
        if (!(Initialize-MigrationTracking)) {
            throw "Failed to initialize migration tracking system"
        }
    }
    
    # Execute migration
    $success = Execute-SafeMigration $MigrationFile
    
    if ($success) {
        Write-ColorOutput "🎉 Migration completed successfully!" "Green"
    } else {
        Write-ColorOutput "❌ Migration failed!" "Red"
        exit 1
    }
    
} catch {
    Write-ColorOutput "❌ Migration runner failed: $_" "Red"
    exit 1
} 