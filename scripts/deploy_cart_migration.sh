#!/bin/bash

# =====================================================
# CART SYSTEM MIGRATION DEPLOYMENT SCRIPT
# Run this on your Linux remote server
# =====================================================

# Configuration
DB_HOST="localhost"
DB_USER="your_db_user"
DB_NAME="your_database_name"
MIGRATION_FILE="migrations/production_cart_migration.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}CART SYSTEM MIGRATION DEPLOYMENT${NC}"
echo -e "${GREEN}=====================================================${NC}"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}Error: Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

# Prompt for database password
echo -e "${YELLOW}Enter your MySQL password:${NC}"
read -s DB_PASSWORD

echo -e "${GREEN}Starting cart system migration...${NC}"

# Run the migration
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$MIGRATION_FILE"

# Check if migration was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration completed successfully!${NC}"
    echo -e "${GREEN}Cart system is now ready for production.${NC}"
else
    echo -e "${RED}❌ Migration failed! Please check the error messages above.${NC}"
    exit 1
fi

echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}MIGRATION COMPLETED${NC}"
echo -e "${GREEN}=====================================================${NC}"
