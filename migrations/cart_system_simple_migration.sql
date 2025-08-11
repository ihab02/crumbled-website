-- =====================================================
-- SIMPLE CART SYSTEM MIGRATION
-- Run these commands manually in your MySQL client
-- =====================================================

-- Step 1: Create cart_settings table
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

-- Step 3: Add expires_at column to carts table (run this only if the column doesn't exist)
-- ALTER TABLE carts ADD COLUMN expires_at TIMESTAMP NULL AFTER updated_at;

-- Step 4: Check existing foreign key constraints
-- Run this to see what constraints exist:
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'carts' 
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Step 5: Drop existing foreign key constraint (replace 'constraint_name' with actual name)
-- ALTER TABLE carts DROP FOREIGN KEY constraint_name;

-- Step 6: Add the correct foreign key constraint
ALTER TABLE carts 
ADD CONSTRAINT carts_ibfk_1 
FOREIGN KEY (user_id) REFERENCES customers(id) ON DELETE SET NULL;

-- Step 7: Update existing carts with expiration dates
UPDATE carts 
SET expires_at = DATE_ADD(created_at, INTERVAL 7 DAY)
WHERE expires_at IS NULL AND status = 'active';

-- Step 8: Mark expired carts as abandoned
UPDATE carts 
SET status = 'abandoned'
WHERE status = 'active' 
AND expires_at IS NOT NULL 
AND expires_at < NOW();

-- Step 9: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_carts_user_id_status ON carts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_carts_expires_at ON carts(expires_at);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_item_flavors_cart_item_id ON cart_item_flavors(cart_item_id);

-- Step 10: Verify the migration
SELECT '=== MIGRATION COMPLETED ===' as status;

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
