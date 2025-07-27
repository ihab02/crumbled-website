#!/bin/bash

# Popup Ads System - Production Deployment Script (Linux/Ubuntu)
# This script safely deploys the popup ads system to production
# Author: AI Assistant
# Date: 2024-12-01
# Version: 1.0

# Default values
DB_HOST="localhost"
DB_PORT="3306"
DRY_RUN=false
SKIP_BACKUP=false
GIT_REVERT_POINT=""
DEPLOYMENT_ID=""

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
    print_log "ERROR" "Deployment failed. Check the log file: $LOG_FILE"
    exit $exit_code
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Required:"
    echo "  -d, --database    Database name"
    echo "  -u, --user        Database user"
    echo ""
    echo "Optional:"
    echo "  -h, --host        Database host (default: localhost)"
    echo "  -P, --port        Database port (default: 3306)"
    echo "  --dry-run         Test deployment without making changes"
    echo "  --skip-backup     Skip backup creation"
    echo "  --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -d mydb -u myuser"
    echo "  $0 -d mydb -u myuser -h 192.168.1.100 -P 3306"
    echo "  $0 -d mydb -u myuser --dry-run"
    echo "  $0 -d mydb -u myuser --skip-backup"
    echo ""
    echo "Note: Database password will be prompted securely during execution"
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
        -h|--host)
            DB_HOST="$2"
            shift 2
            ;;
        -P|--port)
            DB_PORT="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
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
if [[ -z "$DB_NAME" || -z "$DB_USER" ]]; then
    echo "Error: Database name and user are required"
    show_usage
    exit 1
fi

# Prompt for database password securely
prompt_for_password() {
    echo -n "Enter database password for $DB_USER@$DB_HOST:$DB_PORT: "
    read -s DB_PASSWORD
    echo ""
    
    if [[ -z "$DB_PASSWORD" ]]; then
        handle_error "Database password is required"
    fi
}

# Prompt for password
prompt_for_password

# Get script directory and set up paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATION_FILE="$PROJECT_ROOT/migrations/deploy_popup_ads_system_to_production.sql"
BACKUP_DIR="$PROJECT_ROOT/backups"
DEPLOYMENT_ID="popup-ads-deployment-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$PROJECT_ROOT/logs/${DEPLOYMENT_ID}.log"
DEPLOYMENT_INFO_FILE="$PROJECT_ROOT/logs/${DEPLOYMENT_ID}.info"

# Create directories if they don't exist
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Function to check if Git repository exists
check_git_repository() {
    print_log "INFO" "Checking if Git repository exists..."
    
    if [[ ! -d "$PROJECT_ROOT/.git" ]]; then
        handle_error "Git repository not found in $PROJECT_ROOT"
    fi
    
    print_log "INFO" "Git repository found"
}

# Function to create Git revert point
create_git_revert_point() {
    print_log "INFO" "Creating Git revert point..."
    
    # Get current commit
    local current_commit
    current_commit=$(cd "$PROJECT_ROOT" && git rev-parse HEAD 2>/dev/null)
    
    if [[ $? -ne 0 ]]; then
        handle_error "Failed to get current Git commit"
    fi
    
    # Create a deployment tag
    local deployment_tag="deployment-${DEPLOYMENT_ID}"
    local tag_result
    tag_result=$(cd "$PROJECT_ROOT" && git tag "$deployment_tag" 2>&1)
    
    if [[ $? -ne 0 ]]; then
        print_log "WARN" "Failed to create deployment tag. Error: $tag_result"
        print_log "WARN" "Using commit hash as revert point"
        GIT_REVERT_POINT="$current_commit"
    else
        print_log "INFO" "Created deployment tag: $deployment_tag"
        GIT_REVERT_POINT="$deployment_tag"
    fi
    
    # Save revert point information
    echo "GIT_REVERT_POINT=$GIT_REVERT_POINT" >> "$DEPLOYMENT_INFO_FILE"
    echo "GIT_COMMIT_HASH=$current_commit" >> "$DEPLOYMENT_INFO_FILE"
    echo "DEPLOYMENT_TAG=$deployment_tag" >> "$DEPLOYMENT_INFO_FILE"
    
    print_log "INFO" "Git revert point created: $GIT_REVERT_POINT"
}

# Function to save deployment information
save_deployment_info() {
    print_log "INFO" "Saving deployment information..."
    
    cat > "$DEPLOYMENT_INFO_FILE" << EOF
# Popup Ads System Deployment Information
# Generated: $(date)
# Deployment ID: $DEPLOYMENT_ID

# Database Information
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT

# Git Information
GIT_REVERT_POINT=$GIT_REVERT_POINT
GIT_COMMIT_HASH=$(cd "$PROJECT_ROOT" && git rev-parse HEAD 2>/dev/null)
DEPLOYMENT_TAG=deployment-${DEPLOYMENT_ID}

# Backup Information
BACKUP_FILE=$BACKUP_FILE

# Migration Information
MIGRATION_FILE=$MIGRATION_FILE
MIGRATION_APPLIED=true

# Rollback Information
ROLLBACK_SCRIPT=scripts/rollback-popup-ads-deployment.sh
ROLLBACK_COMMAND="./scripts/rollback-popup-ads-deployment.sh -d $DB_NAME -u $DB_USER --restore-backup -b $BACKUP_FILE"

# Git Rollback Information
GIT_ROLLBACK_COMMAND="./scripts/rollback-popup-ads-deployment.sh -d $DB_NAME -u $DB_USER --git-rollback"

# Deployment Status
DEPLOYMENT_STATUS=success
DEPLOYMENT_TIMESTAMP=$(date +%Y-%m-%d\ %H:%M:%S)
EOF

    print_log "INFO" "Deployment information saved to: $DEPLOYMENT_INFO_FILE"
}

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

# Function to create backup
create_backup() {
    if [[ "$SKIP_BACKUP" == true ]]; then
        print_log "INFO" "Skipping backup as requested"
        return
    fi
    
    print_log "INFO" "Creating database backup..."
    BACKUP_FILE="$BACKUP_DIR/popup-ads-backup-${DEPLOYMENT_ID}.sql"
    
    local backup_result
    backup_result=$(mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
        --single-transaction --routines --triggers "$DB_NAME" > "$BACKUP_FILE" 2>&1)
    
    if [[ $? -ne 0 ]]; then
        handle_error "Failed to create backup. Error: $backup_result"
    fi
    
    print_log "INFO" "Backup created successfully: $BACKUP_FILE"
    
    # Save backup file path to deployment info
    echo "BACKUP_FILE=$BACKUP_FILE" >> "$DEPLOYMENT_INFO_FILE"
}

# Function to check if popup_ads table exists
check_popup_ads_table() {
    print_log "INFO" "Checking if popup_ads table exists..."
    
    local check_result
    check_result=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
        -e "SELECT COUNT(*) as table_exists FROM information_schema.tables WHERE table_schema = '$DB_NAME' AND table_name = 'popup_ads';" 2>&1)
    
    if [[ $? -ne 0 ]]; then
        handle_error "Failed to check table existence. Error: $check_result"
    fi
    
    local table_exists
    table_exists=$(echo "$check_result" | grep -E '^[0-9]+$' | head -1)
    
    if [[ "$table_exists" == "1" ]]; then
        print_log "INFO" "popup_ads table already exists"
        return 0
    else
        print_log "INFO" "popup_ads table does not exist"
        return 1
    fi
}

# Function to get current table structure
get_table_structure() {
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

# Function to apply migration
apply_migration() {
    local migration_file=$1
    
    print_log "INFO" "Applying migration from: $migration_file"
    
    if [[ "$DRY_RUN" == true ]]; then
        print_log "INFO" "DRY RUN: Would apply migration (no changes made)"
        return
    fi
    
    local migration_result
    migration_result=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$migration_file" 2>&1)
    
    if [[ $? -ne 0 ]]; then
        handle_error "Failed to apply migration. Error: $migration_result"
    fi
    
    print_log "INFO" "Migration applied successfully"
}

# Function to verify deployment
verify_deployment() {
    print_log "INFO" "Verifying deployment..."
    
    # Check if tables exist
    local tables_result
    tables_result=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
        -e "SHOW TABLES LIKE 'popup_ads';" 2>&1)
    
    if [[ $? -ne 0 ]] || [[ ! "$tables_result" =~ popup_ads ]]; then
        handle_error "popup_ads table not found after migration"
    fi
    
    # Check if views exist
    local views_result
    views_result=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
        -e "SHOW TABLES LIKE 'active_popups';" 2>&1)
    
    if [[ $? -ne 0 ]] || [[ ! "$views_result" =~ active_popups ]]; then
        handle_error "active_popups view not found after migration"
    fi
    
    # Check table structure
    local structure
    structure=$(get_table_structure)
    if [[ $? -eq 0 ]]; then
        if [[ ! "$structure" =~ content_overlay ]]; then
            handle_error "content_overlay column not found after migration"
        fi
        
        if [[ ! "$structure" =~ show_button ]]; then
            handle_error "show_button column not found after migration"
        fi
        
        if [[ ! "$structure" =~ auto_close_seconds ]]; then
            handle_error "auto_close_seconds column not found after migration"
        fi
    fi
    
    print_log "INFO" "Deployment verification successful"
}

# Function to show deployment summary
show_deployment_summary() {
    print_log "INFO" "=== DEPLOYMENT SUMMARY ==="
    print_log "INFO" "Database: $DB_NAME@$DB_HOST:$DB_PORT"
    print_log "INFO" "User: $DB_USER"
    print_log "INFO" "Deployment ID: $DEPLOYMENT_ID"
    print_log "INFO" "Dry Run: $DRY_RUN"
    print_log "INFO" "Skip Backup: $SKIP_BACKUP"
    print_log "INFO" "Log File: $LOG_FILE"
    print_log "INFO" "Deployment Info: $DEPLOYMENT_INFO_FILE"
    
    if [[ -n "$BACKUP_FILE" ]]; then
        print_log "INFO" "Backup File: $BACKUP_FILE"
    fi
    
    if [[ -n "$GIT_REVERT_POINT" ]]; then
        print_log "INFO" "Git Revert Point: $GIT_REVERT_POINT"
    fi
    
    print_log "INFO" "=========================="
}

# Main deployment function
main() {
    print_log "INFO" "Starting Popup Ads System deployment to production"
    show_deployment_summary
    
    # Check if migration file exists
    if [[ ! -f "$MIGRATION_FILE" ]]; then
        handle_error "Migration file not found: $MIGRATION_FILE"
    fi
    
    # Check Git repository and create revert point
    check_git_repository
    create_git_revert_point
    
    # Test database connection
    test_database_connection
    
    # Check if table exists
    local table_exists=false
    if check_popup_ads_table; then
        table_exists=true
    fi
    
    # Create backup if table exists
    if [[ "$table_exists" == true ]] && [[ "$SKIP_BACKUP" == false ]]; then
        create_backup
    fi
    
    # Get current structure if table exists
    if [[ "$table_exists" == true ]]; then
        local current_structure
        current_structure=$(get_table_structure)
        if [[ $? -eq 0 ]]; then
            print_log "INFO" "Current table structure detected"
        fi
    fi
    
    # Apply migration
    apply_migration "$MIGRATION_FILE"
    
    # Verify deployment
    verify_deployment
    
    # Save deployment information
    save_deployment_info
    
    print_log "INFO" "Popup Ads System deployment completed successfully!"
    print_log "INFO" "Log file: $LOG_FILE"
    print_log "INFO" "Deployment info: $DEPLOYMENT_INFO_FILE"
    
    if [[ -n "$BACKUP_FILE" ]]; then
        print_log "INFO" "Backup file: $BACKUP_FILE"
    fi
    
    print_log "INFO" "Git revert point: $GIT_REVERT_POINT"
    print_log "INFO" ""
    print_log "INFO" "=== ROLLBACK COMMANDS ==="
    print_log "INFO" "To rollback database: ./scripts/rollback-popup-ads-deployment.sh -d $DB_NAME -u $DB_USER --restore-backup -b $BACKUP_FILE"
    print_log "INFO" "To rollback Git: ./scripts/rollback-popup-ads-deployment.sh -d $DB_NAME -u $DB_USER --git-rollback"
    print_log "INFO" "=========================="
}

# Execute main function
main "$@" 