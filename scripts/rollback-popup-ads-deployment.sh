#!/bin/bash

# Popup Ads System - Enhanced Rollback Script (Linux/Ubuntu)
# This script safely rolls back the popup ads system deployment
# Includes Git rollback and enhanced database backup/restore
# Author: AI Assistant
# Date: 2024-12-01
# Version: 2.0

# Default values
DB_HOST="localhost"
DB_PORT="3306"
FORCE_ROLLBACK=false
KEEP_BACKUP=true
GIT_ROLLBACK=false
GIT_COMMIT=""
CREATE_BACKUP=false
RESTORE_FROM_BACKUP=false
BACKUP_FILE=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[$timestamp] [INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[$timestamp] [WARN]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[$timestamp] [ERROR]${NC} $message"
            ;;
        "DEBUG")
            echo -e "${BLUE}[$timestamp] [DEBUG]${NC} $message"
            ;;
    esac
    
    # Also write to log file
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Function to handle errors
handle_error() {
    local error_message=$1
    local exit_code=${2:-1}
    print_log "ERROR" "$error_message"
    print_log "ERROR" "Rollback failed. Check the log file: $LOG_FILE"
    exit $exit_code
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Required:"
    echo "  -d, --database    Database name"
    echo "  -u, --user        Database user"
    echo "  -p, --password    Database password"
    echo ""
    echo "Rollback Options (choose one):"
    echo "  --git-rollback    Rollback to previous Git commit"
    echo "  --git-commit      Specific Git commit hash to rollback to"
    echo "  --restore-backup  Restore from existing backup file"
    echo "  --create-backup   Create backup and rollback (default)"
    echo ""
    echo "Optional:"
    echo "  -h, --host        Database host (default: localhost)"
    echo "  -P, --port        Database port (default: 3306)"
    echo "  -b, --backup      Backup file to restore from"
    echo "  --force           Force rollback without confirmation"
    echo "  --keep-backup     Keep backup file after rollback (default: true)"
    echo "  --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  # Standard rollback (create backup and rollback)"
    echo "  $0 -d mydb -u myuser -p mypassword"
    echo ""
    echo "  # Git rollback to previous commit"
    echo "  $0 -d mydb -u myuser -p mypassword --git-rollback"
    echo ""
    echo "  # Git rollback to specific commit"
    echo "  $0 -d mydb -u myuser -p mypassword --git-commit abc1234"
    echo ""
    echo "  # Restore from specific backup file"
    echo "  $0 -d mydb -u myuser -p mypassword --restore-backup -b backups/backup.sql"
    echo ""
    echo "  # Create backup only (no rollback)"
    echo "  $0 -d mydb -u myuser -p mypassword --create-backup"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--database)
            DB_NAME="$2"
            shift 2
            ;;
        -u|--user)
            DB_USER="$2"
            shift 2
            ;;
        -p|--password)
            DB_PASSWORD="$2"
            shift 2
            ;;
        -h|--host)
            DB_HOST="$2"
            shift 2
            ;;
        -P|--port)
            DB_PORT="$2"
            shift 2
            ;;
        -b|--backup)
            BACKUP_FILE="$2"
            shift 2
            ;;
        --git-rollback)
            GIT_ROLLBACK=true
            shift
            ;;
        --git-commit)
            GIT_COMMIT="$2"
            GIT_ROLLBACK=true
            shift 2
            ;;
        --restore-backup)
            RESTORE_FROM_BACKUP=true
            shift
            ;;
        --create-backup)
            CREATE_BACKUP=true
            shift
            ;;
        --force)
            FORCE_ROLLBACK=true
            shift
            ;;
        --keep-backup)
            KEEP_BACKUP="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Check required parameters
if [[ -z "$DB_NAME" || -z "$DB_USER" || -z "$DB_PASSWORD" ]]; then
    echo "Error: Database name, user, and password are required"
    show_usage
    exit 1
fi

# Get script directory and set up paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_FILE="$PROJECT_ROOT/logs/popup-ads-rollback-$(date +%Y%m%d-%H%M%S).log"

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Function to test database connection
test_database_connection() {
    print_log "INFO" "Testing database connection..."
    
    local test_result
    test_result=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT 1 as test;" 2>&1)
    
    if [[ $? -ne 0 ]]; then
        handle_error "Failed to connect to database. Error: $test_result"
    fi
    
    print_log "INFO" "Database connection successful"
}

# Function to check if Git repository exists
check_git_repository() {
    print_log "INFO" "Checking if Git repository exists..."
    
    if [[ ! -d "$PROJECT_ROOT/.git" ]]; then
        handle_error "Git repository not found in $PROJECT_ROOT"
    fi
    
    print_log "INFO" "Git repository found"
}

# Function to get current Git commit
get_current_git_commit() {
    local current_commit
    current_commit=$(cd "$PROJECT_ROOT" && git rev-parse HEAD 2>/dev/null)
    
    if [[ $? -ne 0 ]]; then
        handle_error "Failed to get current Git commit"
    fi
    
    echo "$current_commit"
}

# Function to get Git commit history
get_git_commit_history() {
    print_log "INFO" "Getting Git commit history..."
    
    local commit_history
    commit_history=$(cd "$PROJECT_ROOT" && git log --oneline -10 2>/dev/null)
    
    if [[ $? -ne 0 ]]; then
        handle_error "Failed to get Git commit history"
    fi
    
    echo "$commit_history"
}

# Function to perform Git rollback
perform_git_rollback() {
    local target_commit=$1
    
    print_log "INFO" "Performing Git rollback to commit: $target_commit"
    
    # Get current commit for reference
    local current_commit
    current_commit=$(get_current_git_commit)
    print_log "INFO" "Current commit: $current_commit"
    
    # Check if target commit exists
    local commit_exists
    commit_exists=$(cd "$PROJECT_ROOT" && git rev-parse --verify "$target_commit" 2>/dev/null)
    
    if [[ $? -ne 0 ]]; then
        handle_error "Target commit $target_commit does not exist"
    fi
    
    # Create backup before Git rollback
    local git_backup_file
    git_backup_file=$(create_database_backup "git-rollback-backup")
    
    # Perform Git rollback
    print_log "INFO" "Executing Git rollback..."
    
    local git_result
    git_result=$(cd "$PROJECT_ROOT" && git reset --hard "$target_commit" 2>&1)
    
    if [[ $? -ne 0 ]]; then
        print_log "ERROR" "Git rollback failed. Error: $git_result"
        print_log "ERROR" "You can manually restore from: $git_backup_file"
        return 1
    fi
    
    print_log "INFO" "Git rollback completed successfully"
    print_log "INFO" "Database backup saved as: $git_backup_file"
    
    # Show commit information
    local commit_info
    commit_info=$(cd "$PROJECT_ROOT" && git log --oneline -1 "$target_commit" 2>/dev/null)
    print_log "INFO" "Rolled back to: $commit_info"
}

# Function to create database backup
create_database_backup() {
    local backup_type=${1:-"rollback-backup"}
    print_log "INFO" "Creating database backup ($backup_type)..."
    
    local backup_file="$BACKUP_DIR/${backup_type}-$(date +%Y%m%d-%H%M%S).sql"
    
    local backup_result
    backup_result=$(mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
        --single-transaction --routines --triggers "$DB_NAME" > "$backup_file" 2>&1)
    
    if [[ $? -ne 0 ]]; then
        print_log "ERROR" "Failed to create backup. Error: $backup_result"
        return 1
    fi
    
    print_log "INFO" "Backup created successfully: $backup_file"
    echo "$backup_file"
}

# Function to find the most recent deployment info file
find_latest_deployment_info() {
    print_log "INFO" "Finding the most recent deployment info file..."
    
    local latest_info_file
    latest_info_file=$(find "$PROJECT_ROOT/logs" -name "popup-ads-deployment-*.info" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [[ -z "$latest_info_file" ]]; then
        print_log "WARN" "No deployment info files found"
        return 1
    fi
    
    if [[ ! -f "$latest_info_file" ]]; then
        print_log "WARN" "Latest deployment info file not found: $latest_info_file"
        return 1
    fi
    
    print_log "INFO" "Found latest deployment info file: $latest_info_file"
    echo "$latest_info_file"
}

# Function to load deployment information
load_deployment_info() {
    local info_file=$1
    
    if [[ ! -f "$info_file" ]]; then
        print_log "WARN" "Deployment info file not found: $info_file"
        return 1
    fi
    
    print_log "INFO" "Loading deployment information from: $info_file"
    
    # Source the deployment info file
    source "$info_file"
    
    # Set variables from deployment info
    if [[ -n "$BACKUP_FILE" ]]; then
        print_log "INFO" "Found backup file from deployment info: $BACKUP_FILE"
    fi
    
    if [[ -n "$GIT_REVERT_POINT" ]]; then
        print_log "INFO" "Found Git revert point from deployment info: $GIT_REVERT_POINT"
    fi
    
    if [[ -n "$ROLLBACK_COMMAND" ]]; then
        print_log "INFO" "Found rollback command from deployment info: $ROLLBACK_COMMAND"
    fi
}

# Function to find the most recent backup file
find_latest_backup() {
    print_log "INFO" "Finding the most recent backup file..."
    
    if [[ -n "$BACKUP_FILE" ]]; then
        if [[ -f "$BACKUP_FILE" ]]; then
            print_log "INFO" "Using specified backup file: $BACKUP_FILE"
            echo "$BACKUP_FILE"
            return 0
        else
            handle_error "Specified backup file not found: $BACKUP_FILE"
        fi
    fi
    
    # Try to load from latest deployment info first
    local latest_info_file
    latest_info_file=$(find_latest_deployment_info)
    if [[ $? -eq 0 ]]; then
        load_deployment_info "$latest_info_file"
        if [[ -n "$BACKUP_FILE" ]] && [[ -f "$BACKUP_FILE" ]]; then
            print_log "INFO" "Using backup file from deployment info: $BACKUP_FILE"
            echo "$BACKUP_FILE"
            return 0
        fi
    fi
    
    # Fallback to finding the most recent backup file
    local latest_backup
    latest_backup=$(find "$BACKUP_DIR" -name "popup-ads-backup-*.sql" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [[ -z "$latest_backup" ]]; then
        handle_error "No backup files found in $BACKUP_DIR"
    fi
    
    if [[ ! -f "$latest_backup" ]]; then
        handle_error "Latest backup file not found: $latest_backup"
    fi
    
    print_log "INFO" "Found latest backup file: $latest_backup"
    echo "$latest_backup"
}

# Function to check if popup_ads table exists
check_popup_ads_table() {
    print_log "INFO" "Checking if popup_ads table exists..."
    
    local check_result
    check_result=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
        -e "SELECT COUNT(*) as table_exists FROM information_schema.tables WHERE table_schema = '$DB_NAME' AND table_name = 'popup_ads';" 2>&1)
    
    if [[ $? -ne 0 ]]; then
        print_log "WARN" "Failed to check table existence. Error: $check_result"
        return 1
    fi
    
    local table_exists
    table_exists=$(echo "$check_result" | grep -E '^[0-9]+$' | head -1)
    
    if [[ "$table_exists" == "1" ]]; then
        print_log "INFO" "popup_ads table exists"
        return 0
    else
        print_log "INFO" "popup_ads table does not exist"
        return 1
    fi
}

# Function to get current table structure
get_current_structure() {
    print_log "INFO" "Getting current table structure..."
    
    local structure_query="
    SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE, 
        COLUMN_DEFAULT,
        ORDINAL_POSITION
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = '$DB_NAME' 
      AND TABLE_NAME = 'popup_ads' 
    ORDER BY ORDINAL_POSITION
    "
    
    local structure_result
    structure_result=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "$structure_query" 2>&1)
    
    if [[ $? -ne 0 ]]; then
        print_log "WARN" "Failed to get table structure. Error: $structure_result"
        return 1
    fi
    
    echo "$structure_result"
}

# Function to restore from backup
restore_from_backup() {
    local backup_file=$1
    
    print_log "INFO" "Restoring database from backup: $backup_file"
    
    # Create pre-rollback backup
    local pre_rollback_backup
    pre_rollback_backup=$(create_database_backup "pre-rollback-backup")
    
    # Restore the database
    local restore_result
    restore_result=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$backup_file" 2>&1)
    
    if [[ $? -ne 0 ]]; then
        print_log "ERROR" "Failed to restore from backup. Error: $restore_result"
        print_log "ERROR" "You can manually restore from: $pre_rollback_backup"
        return 1
    fi
    
    print_log "INFO" "Database restored successfully from backup"
    print_log "INFO" "Pre-rollback backup saved as: $pre_rollback_backup"
}

# Function to drop popup_ads tables and views
drop_popup_ads_objects() {
    print_log "INFO" "Dropping popup_ads tables and views..."
    
    # Create pre-rollback backup
    local pre_rollback_backup
    pre_rollback_backup=$(create_database_backup "pre-rollback-backup")
    
    # Drop views first
    local drop_views_result
    drop_views_result=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
        -e "DROP VIEW IF EXISTS active_popups; DROP VIEW IF EXISTS popup_analytics_summary;" 2>&1)
    
    if [[ $? -ne 0 ]]; then
        print_log "WARN" "Failed to drop views. Error: $drop_views_result"
    else
        print_log "INFO" "Views dropped successfully"
    fi
    
    # Drop tables
    local drop_tables_result
    drop_tables_result=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
        -e "DROP TABLE IF EXISTS popup_analytics; DROP TABLE IF EXISTS popup_ads;" 2>&1)
    
    if [[ $? -ne 0 ]]; then
        print_log "ERROR" "Failed to drop tables. Error: $drop_tables_result"
        print_log "ERROR" "You can manually restore from: $pre_rollback_backup"
        return 1
    fi
    
    print_log "INFO" "Tables dropped successfully"
    print_log "INFO" "Pre-rollback backup saved as: $pre_rollback_backup"
}

# Function to verify rollback
verify_rollback() {
    print_log "INFO" "Verifying rollback..."
    
    # Check if popup_ads table is gone
    if check_popup_ads_table; then
        print_log "WARN" "popup_ads table still exists after rollback"
        return 1
    else
        print_log "INFO" "popup_ads table successfully removed"
    fi
    
    # Check if views are gone
    local views_result
    views_result=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
        -e "SHOW TABLES LIKE 'active_popups';" 2>&1)
    
    if [[ $? -eq 0 ]] && [[ "$views_result" =~ active_popups ]]; then
        print_log "WARN" "active_popups view still exists after rollback"
        return 1
    else
        print_log "INFO" "Views successfully removed"
    fi
    
    print_log "INFO" "Rollback verification successful"
}

# Function to show rollback summary
show_rollback_summary() {
    print_log "INFO" "=== ROLLBACK SUMMARY ==="
    print_log "INFO" "Database: $DB_NAME@$DB_HOST:$DB_PORT"
    print_log "INFO" "User: $DB_USER"
    print_log "INFO" "Git Rollback: $GIT_ROLLBACK"
    if [[ -n "$GIT_COMMIT" ]]; then
        print_log "INFO" "Git Commit: $GIT_COMMIT"
    fi
    print_log "INFO" "Restore from Backup: $RESTORE_FROM_BACKUP"
    print_log "INFO" "Create Backup Only: $CREATE_BACKUP"
    print_log "INFO" "Backup File: $BACKUP_FILE"
    print_log "INFO" "Force Rollback: $FORCE_ROLLBACK"
    print_log "INFO" "Keep Backup: $KEEP_BACKUP"
    print_log "INFO" "Log File: $LOG_FILE"
    print_log "INFO" "========================="
}

# Function to confirm rollback
confirm_rollback() {
    if [[ "$FORCE_ROLLBACK" == true ]]; then
        print_log "INFO" "Force rollback enabled - skipping confirmation"
        return 0
    fi
    
    echo ""
    echo -e "${YELLOW}⚠️  WARNING: This will rollback the popup ads system deployment${NC}"
    echo ""
    
    if [[ "$GIT_ROLLBACK" == true ]]; then
        echo "This action will:"
        echo "  - Rollback Git repository to previous commit"
        echo "  - Create database backup before rollback"
        if [[ -n "$GIT_COMMIT" ]]; then
            echo "  - Rollback to specific commit: $GIT_COMMIT"
        else
            echo "  - Rollback to previous commit"
        fi
    elif [[ "$RESTORE_FROM_BACKUP" == true ]]; then
        echo "This action will:"
        echo "  - Restore database from backup file"
        echo "  - Create pre-rollback backup for safety"
        echo "  - Restore to previous database state"
    elif [[ "$CREATE_BACKUP" == true ]]; then
        echo "This action will:"
        echo "  - Create database backup only"
        echo "  - No rollback will be performed"
    else
        echo "This action will:"
        echo "  - Remove the popup_ads table"
        echo "  - Remove the popup_analytics table"
        echo "  - Remove the active_popups view"
        echo "  - Remove the popup_analytics_summary view"
        echo "  - Restore the database to its previous state"
    fi
    
    if [[ -n "$BACKUP_FILE" ]]; then
        echo ""
        echo -e "Backup file: ${BLUE}$BACKUP_FILE${NC}"
    fi
    
    echo ""
    
    read -p "Are you sure you want to proceed with the rollback? (yes/no): " confirm
    
    if [[ "$confirm" != "yes" ]]; then
        print_log "INFO" "Rollback cancelled by user"
        exit 0
    fi
    
    print_log "INFO" "Rollback confirmed by user"
}

# Main rollback function
main() {
    print_log "INFO" "Starting Enhanced Popup Ads System rollback"
    show_rollback_summary
    
    # Test database connection
    test_database_connection
    
    # Handle different rollback scenarios
    if [[ "$CREATE_BACKUP" == true ]]; then
        print_log "INFO" "Creating backup only (no rollback)"
        local backup_file
        backup_file=$(create_database_backup "manual-backup")
        print_log "INFO" "Backup created successfully: $backup_file"
        exit 0
    fi
    
    if [[ "$GIT_ROLLBACK" == true ]]; then
        print_log "INFO" "Performing Git rollback"
        
        # Check Git repository
        check_git_repository
        
        # Show current Git status
        print_log "INFO" "Current Git status:"
        local git_status
        git_status=$(cd "$PROJECT_ROOT" && git status --porcelain 2>/dev/null)
        if [[ -n "$git_status" ]]; then
            print_log "WARN" "Git repository has uncommitted changes:"
            echo "$git_status"
        else
            print_log "INFO" "Git repository is clean"
        fi
        
        # Show recent commits
        print_log "INFO" "Recent Git commits:"
        local commit_history
        commit_history=$(get_git_commit_history)
        echo "$commit_history"
        
        # Determine target commit
        local target_commit
        if [[ -n "$GIT_COMMIT" ]]; then
            target_commit="$GIT_COMMIT"
        else
            # Get previous commit
            target_commit=$(cd "$PROJECT_ROOT" && git rev-parse HEAD~1 2>/dev/null)
            if [[ $? -ne 0 ]]; then
                handle_error "No previous commit found for rollback"
            fi
        fi
        
        # Confirm rollback
        confirm_rollback
        
        # Perform Git rollback
        if ! perform_git_rollback "$target_commit"; then
            handle_error "Git rollback failed"
        fi
        
        print_log "INFO" "Git rollback completed successfully!"
        exit 0
    fi
    
    if [[ "$RESTORE_FROM_BACKUP" == true ]]; then
        print_log "INFO" "Performing backup restore"
        
        # Find or use specified backup file
        if [[ -z "$BACKUP_FILE" ]]; then
            BACKUP_FILE=$(find_latest_backup)
        fi
        
        # Confirm rollback
        confirm_rollback
        
        # Restore from backup
        if ! restore_from_backup "$BACKUP_FILE"; then
            handle_error "Backup restore failed"
        fi
        
        print_log "INFO" "Backup restore completed successfully!"
        exit 0
    fi
    
    # Standard rollback (default behavior)
    print_log "INFO" "Performing standard rollback"
    
    # Find backup file
    BACKUP_FILE=$(find_latest_backup)
    
    # Check if popup_ads table exists
    local table_exists=false
    if check_popup_ads_table; then
        table_exists=true
        print_log "INFO" "popup_ads table found - will perform full rollback"
    else
        print_log "INFO" "popup_ads table not found - no rollback needed"
        print_log "INFO" "Rollback completed (nothing to rollback)"
        exit 0
    fi
    
    # Get current structure for reference
    if [[ "$table_exists" == true ]]; then
        local current_structure
        current_structure=$(get_current_structure)
        if [[ $? -eq 0 ]]; then
            print_log "INFO" "Current table structure captured for reference"
        fi
    fi
    
    # Confirm rollback
    confirm_rollback
    
    # Perform rollback
    if [[ -f "$BACKUP_FILE" ]]; then
        print_log "INFO" "Performing full database restore from backup"
        if ! restore_from_backup "$BACKUP_FILE"; then
            handle_error "Failed to restore from backup"
        fi
    else
        print_log "INFO" "Performing selective rollback (dropping tables/views)"
        if ! drop_popup_ads_objects; then
            handle_error "Failed to drop popup_ads objects"
        fi
    fi
    
    # Verify rollback
    verify_rollback
    
    # Clean up backup file if requested
    if [[ "$KEEP_BACKUP" == "false" ]] && [[ -f "$BACKUP_FILE" ]]; then
        print_log "INFO" "Removing backup file as requested"
        rm "$BACKUP_FILE"
    fi
    
    print_log "INFO" "Popup Ads System rollback completed successfully!"
    print_log "INFO" "Log file: $LOG_FILE"
}

# Execute main function
main "$@" 