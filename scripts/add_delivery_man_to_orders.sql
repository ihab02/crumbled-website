-- Add delivery_man_id column to orders table
-- This allows tracking which delivery person is assigned to each order

-- Add delivery_man_id column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'crumbled_nextDB' 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'delivery_man_id') = 0,
    'ALTER TABLE `orders` ADD COLUMN `delivery_man_id` INT NULL AFTER `subtotal`',
    'SELECT "delivery_man_id column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_SCHEMA = 'crumbled_nextDB' 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'delivery_man_id'
     AND REFERENCED_TABLE_NAME = 'delivery_men') = 0,
    'ALTER TABLE `orders` ADD CONSTRAINT `fk_orders_delivery_man` FOREIGN KEY (`delivery_man_id`) REFERENCES `delivery_men`(`id`) ON DELETE SET NULL',
    'SELECT "foreign key constraint already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for better performance
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = 'crumbled_nextDB' 
     AND TABLE_NAME = 'orders' 
     AND INDEX_NAME = 'idx_orders_delivery_man') = 0,
    'CREATE INDEX `idx_orders_delivery_man` ON `orders`(`delivery_man_id`)',
    'SELECT "index already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Orders table updated with delivery_man_id column successfully' as status; 