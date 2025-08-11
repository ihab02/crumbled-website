-- =====================================================
-- COMPLETE CART SYSTEM MIGRATION
-- This script implements the full cart enhancement system
-- Run this on your production server
-- =====================================================

-- Step 1: Create cart_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS cart_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cart_lifetime_days INT NOT NULL DEFAULT 7,
    debug_mode BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Step 2: Insert default cart settings
INSERT INTO cart_settings (cart_lifetime_days, debug_mode) 
VALUES (7, FALSE) 
ON DUPLICATE KEY UPDATE cart_lifetime_days = 7;

-- Step 3: Add expires_at column to carts table if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'carts' 
     AND COLUMN_NAME = 'expires_at') = 0,
    'ALTER TABLE carts ADD COLUMN expires_at TIMESTAMP NULL AFTER updated_at',
    'SELECT "Column expires_at already exists in carts table"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Fix foreign key constraint to reference customers table instead of users table
-- First, check what foreign key constraints exist on the carts table
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'carts' 
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Drop any existing foreign key constraints on user_id column
-- We'll use a dynamic approach to handle different constraint names
SET @constraints = (SELECT GROUP_CONCAT(CONSTRAINT_NAME) 
                   FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'carts' 
                   AND COLUMN_NAME = 'user_id'
                   AND REFERENCED_TABLE_NAME IS NOT NULL);

-- If there are constraints, drop them
SET @sql = (SELECT IF(
    @constraints IS NOT NULL,
    CONCAT('ALTER TABLE carts DROP FOREIGN KEY ', @constraints),
    'SELECT "No foreign key constraints found on user_id column"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add the correct foreign key constraint that references customers table
ALTER TABLE carts 
ADD CONSTRAINT carts_ibfk_1 
FOREIGN KEY (user_id) REFERENCES customers(id) ON DELETE SET NULL;

-- Step 5: Update existing carts with expiration dates (7 days from creation)
UPDATE carts 
SET expires_at = DATE_ADD(created_at, INTERVAL 7 DAY)
WHERE expires_at IS NULL AND status = 'active';

-- Step 6: Mark expired carts as abandoned
UPDATE carts 
SET status = 'abandoned'
WHERE status = 'active' 
AND expires_at IS NOT NULL 
AND expires_at < NOW();

-- Step 7: Create performance indexes
-- Check if indexes exist before creating them
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                     WHERE TABLE_SCHEMA = DATABASE() 
                     AND TABLE_NAME = 'carts' 
                     AND INDEX_NAME = 'idx_carts_user_id_status');

SET @sql = (SELECT IF(
    @index_exists = 0,
    'CREATE INDEX idx_carts_user_id_status ON carts(user_id, status)',
    'SELECT "Index idx_carts_user_id_status already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                     WHERE TABLE_SCHEMA = DATABASE() 
                     AND TABLE_NAME = 'carts' 
                     AND INDEX_NAME = 'idx_carts_expires_at');

SET @sql = (SELECT IF(
    @index_exists = 0,
    'CREATE INDEX idx_carts_expires_at ON carts(expires_at)',
    'SELECT "Index idx_carts_expires_at already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                     WHERE TABLE_SCHEMA = DATABASE() 
                     AND TABLE_NAME = 'cart_items' 
                     AND INDEX_NAME = 'idx_cart_items_cart_id');

SET @sql = (SELECT IF(
    @index_exists = 0,
    'CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id)',
    'SELECT "Index idx_cart_items_cart_id already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                     WHERE TABLE_SCHEMA = DATABASE() 
                     AND TABLE_NAME = 'cart_item_flavors' 
                     AND INDEX_NAME = 'idx_cart_item_flavors_cart_item_id');

SET @sql = (SELECT IF(
    @index_exists = 0,
    'CREATE INDEX idx_cart_item_flavors_cart_item_id ON cart_item_flavors(cart_item_id)',
    'SELECT "Index idx_cart_item_flavors_cart_item_id already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 8: Verify the migration results
SELECT 
    '=== CART SYSTEM MIGRATION COMPLETED ===' as status;

SELECT 
    'Cart Settings' as table_name,
    COUNT(*) as record_count
FROM cart_settings;

SELECT 
    'Carts Summary' as summary,
    COUNT(*) as total_carts,
    SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) as user_carts,
    SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) as guest_carts,
    SUM(CASE WHEN expires_at IS NOT NULL THEN 1 ELSE 0 END) as carts_with_expiration,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_carts,
    SUM(CASE WHEN status = 'abandoned' THEN 1 ELSE 0 END) as abandoned_carts
FROM carts;

SELECT 
    'Foreign Key Verification' as verification,
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'carts' 
AND CONSTRAINT_NAME = 'carts_ibfk_1';

SELECT 
    'Indexes Created' as indexes,
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('carts', 'cart_items', 'cart_item_flavors')
AND INDEX_NAME LIKE 'idx_%'
ORDER BY TABLE_NAME, INDEX_NAME;

-- Step 9: Final status
SELECT 
    '=== MIGRATION STATUS ===' as status,
    '✅ Cart settings table created/updated' as step1,
    '✅ Foreign key constraint fixed (customers table)' as step2,
    '✅ Expiration dates added to existing carts' as step3,
    '✅ Expired carts marked as abandoned' as step4,
    '✅ Performance indexes created' as step5,
    '✅ Cart system ready for production' as step6;
