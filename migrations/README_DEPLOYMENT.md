# Cart System Migration - Production Deployment

This document provides instructions for deploying the cart system migration to your production Linux remote server.

## Files Included

1. **`migrations/production_cart_migration.sql`** - Complete migration script
2. **`scripts/deploy_cart_migration.sh`** - Deployment script (optional)
3. **`migrations/README_DEPLOYMENT.md`** - This file

## What This Migration Does

✅ **Creates `cart_settings` table** with default configuration
✅ **Adds `expires_at` column** to carts table for expiration tracking
✅ **Fixes foreign key constraint** to reference `customers` table instead of `users`
✅ **Updates existing carts** with expiration dates
✅ **Marks expired carts** as abandoned
✅ **Creates performance indexes** for better query performance
✅ **Provides verification queries** to confirm successful migration

## Deployment Methods

### Method 1: Direct MySQL Command (Recommended)

1. **Upload the migration file** to your server:
   ```bash
   scp migrations/production_cart_migration.sql user@your-server:/path/to/your/project/
   ```

2. **SSH into your server**:
   ```bash
   ssh user@your-server
   ```

3. **Navigate to your project directory**:
   ```bash
   cd /path/to/your/project/
   ```

4. **Run the migration**:
   ```bash
   mysql -u your_db_user -p your_database_name < migrations/production_cart_migration.sql
   ```

### Method 2: Using the Deployment Script

1. **Upload both files** to your server:
   ```bash
   scp migrations/production_cart_migration.sql scripts/deploy_cart_migration.sh user@your-server:/path/to/your/project/
   ```

2. **SSH into your server**:
   ```bash
   ssh user@your-server
   ```

3. **Navigate to your project directory**:
   ```bash
   cd /path/to/your/project/
   ```

4. **Make the script executable**:
   ```bash
   chmod +x scripts/deploy_cart_migration.sh
   ```

5. **Edit the script** to set your database credentials:
   ```bash
   nano scripts/deploy_cart_migration.sh
   ```
   Update these lines:
   ```bash
   DB_USER="your_actual_db_user"
   DB_NAME="your_actual_database_name"
   ```

6. **Run the deployment script**:
   ```bash
   ./scripts/deploy_cart_migration.sh
   ```

### Method 3: Manual Step-by-Step

If you prefer to run commands manually, you can copy and paste each section from the migration file into your MySQL client.

## Verification

After running the migration, you should see output similar to:

```
+-----------------------------+
| status                      |
+-----------------------------+
| === CART SYSTEM MIGRATION COMPLETED === |
+-----------------------------+

+---------------+--------------+
| table_name    | record_count |
+---------------+--------------+
| Cart Settings |            1 |
+---------------+--------------+

+---------------+-------------+------------+-------------+-----------------------+--------------+-----------------+
| summary       | total_carts | user_carts | guest_carts | carts_with_expiration | active_carts | abandoned_carts |
+---------------+-------------+------------+-------------+-----------------------+--------------+-----------------+
| Carts Summary |          68 |          0 |          68 |                    68 |           10 |              58 |
+---------------+-------------+------------+-------------+-----------------------+--------------+-----------------+
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Make sure your MySQL user has sufficient privileges
2. **File Not Found**: Verify the migration file path is correct
3. **Foreign Key Error**: The script handles this automatically by checking existing constraints
4. **Index Already Exists**: The script checks for existing indexes before creating new ones

### Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Drop the foreign key constraint
ALTER TABLE carts DROP FOREIGN KEY carts_ibfk_1;

-- Drop the indexes
DROP INDEX idx_carts_user_id_status ON carts;
DROP INDEX idx_carts_expires_at ON carts;
DROP INDEX idx_cart_items_cart_id ON cart_items;
DROP INDEX idx_cart_item_flavors_cart_item_id ON cart_item_flavors;

-- Drop the expires_at column
ALTER TABLE carts DROP COLUMN expires_at;

-- Drop the cart_settings table
DROP TABLE cart_settings;
```

## Post-Migration

After successful migration:

1. **Deploy your updated application code** (the cart API endpoints we created)
2. **Test the cart functionality** with both guest and logged-in users
3. **Monitor the application logs** for any cart-related errors
4. **Verify cart persistence** works correctly across browser sessions

## Support

If you encounter any issues during deployment, check:

1. MySQL error logs
2. Application logs
3. Database connection settings
4. User permissions

The migration script is designed to be idempotent, meaning it can be run multiple times safely.
