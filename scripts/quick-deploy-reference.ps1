# Quick Deployment Reference
# Common commands for safe database deployment

param(
    [string]$Command = "help"
)

function Show-Help {
    Write-Host "🛡️  Quick Database Deployment Reference" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Available Commands:" -ForegroundColor Yellow
    Write-Host "  status     - Check migration status" -ForegroundColor White
    Write-Host "  backup     - Create database backup" -ForegroundColor White
    Write-Host "  test       - Test migration (dry run)" -ForegroundColor White
    Write-Host "  deploy     - Deploy migration safely" -ForegroundColor White
    Write-Host "  rollback   - Rollback last migration" -ForegroundColor White
    Write-Host "  help       - Show this help" -ForegroundColor White
    Write-Host ""
    Write-Host "Usage Examples:" -ForegroundColor Yellow
    Write-Host "  .\scripts\quick-deploy-reference.ps1 status" -ForegroundColor Gray
    Write-Host "  .\scripts\quick-deploy-reference.ps1 backup" -ForegroundColor Gray
    Write-Host "  .\scripts\quick-deploy-reference.ps1 test add_popup_ads.sql" -ForegroundColor Gray
    Write-Host "  .\scripts\quick-deploy-reference.ps1 deploy add_popup_ads.sql" -ForegroundColor Gray
}

function Show-Status {
    Write-Host "📊 Checking migration status..." -ForegroundColor Yellow
    & ".\scripts\enhanced-migration-runner.ps1" -CheckStatus
}

function Create-Backup {
    Write-Host "📦 Creating database backup..." -ForegroundColor Yellow
    & ".\backup-database.ps1"
}

function Test-Migration {
    param([string]$MigrationFile)
    
    if ([string]::IsNullOrWhiteSpace($MigrationFile)) {
        Write-Host "❌ Migration file required. Usage: test <migration_file>" -ForegroundColor Red
        return
    }
    
    Write-Host "🔍 Testing migration: $MigrationFile" -ForegroundColor Yellow
    & ".\scripts\enhanced-migration-runner.ps1" -MigrationFile $MigrationFile -DryRun
}

function Deploy-Migration {
    param([string]$MigrationFile)
    
    if ([string]::IsNullOrWhiteSpace($MigrationFile)) {
        Write-Host "❌ Migration file required. Usage: deploy <migration_file>" -ForegroundColor Red
        return
    }
    
    Write-Host "🚀 Deploying migration: $MigrationFile" -ForegroundColor Yellow
    & ".\scripts\enhanced-migration-runner.ps1" -MigrationFile $MigrationFile
}

function Rollback-Migration {
    Write-Host "🔄 Rolling back last migration..." -ForegroundColor Yellow
    Write-Host "⚠️  This will restore from the most recent backup" -ForegroundColor Red
    Write-Host "Press any key to continue or Ctrl+C to cancel..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    # Find most recent backup
    $backups = Get-ChildItem "backups\*.sql" | Sort-Object LastWriteTime -Descending
    if ($backups.Count -eq 0) {
        Write-Host "❌ No backup files found!" -ForegroundColor Red
        return
    }
    
    $latestBackup = $backups[0]
    Write-Host "📦 Restoring from: $($latestBackup.Name)" -ForegroundColor Yellow
    
    # Restore from backup
    $mysqlCmd = "mysql -h localhost -u root -pGoodmorning@1 crumbled_nextDB < `"$($latestBackup.FullName)`""
    Invoke-Expression $mysqlCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Rollback completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Rollback failed!" -ForegroundColor Red
    }
}

# Main execution
switch ($Command.ToLower()) {
    "status" { Show-Status }
    "backup" { Create-Backup }
    "test" { Test-Migration $args[0] }
    "deploy" { Deploy-Migration $args[0] }
    "rollback" { Rollback-Migration }
    default { Show-Help }
} 