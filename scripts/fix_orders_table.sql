-- Fix orders table by adding missing delivery information columns
-- Check if columns exist first, then add them if they don't

-- Add delivery_address column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'crumbled_nextDB' 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'delivery_address') = 0,
    'ALTER TABLE `orders` ADD COLUMN `delivery_address` TEXT NULL AFTER `payment_method`',
    'SELECT "delivery_address column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add delivery_additional_info column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'crumbled_nextDB' 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'delivery_additional_info') = 0,
    'ALTER TABLE `orders` ADD COLUMN `delivery_additional_info` TEXT NULL AFTER `delivery_address`',
    'SELECT "delivery_additional_info column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add delivery_city column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'crumbled_nextDB' 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'delivery_city') = 0,
    'ALTER TABLE `orders` ADD COLUMN `delivery_city` VARCHAR(255) NULL AFTER `delivery_additional_info`',
    'SELECT "delivery_city column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add delivery_zone column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'crumbled_nextDB' 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'delivery_zone') = 0,
    'ALTER TABLE `orders` ADD COLUMN `delivery_zone` VARCHAR(255) NULL AFTER `delivery_city`',
    'SELECT "delivery_zone column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add delivery_fee column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'crumbled_nextDB' 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'delivery_fee') = 0,
    'ALTER TABLE `orders` ADD COLUMN `delivery_fee` DECIMAL(10,2) NULL AFTER `delivery_zone`',
    'SELECT "delivery_fee column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add subtotal column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'crumbled_nextDB' 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'subtotal') = 0,
    'ALTER TABLE `orders` ADD COLUMN `subtotal` DECIMAL(10,2) NULL AFTER `delivery_fee`',
    'SELECT "subtotal column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing orders with default values for the new columns
UPDATE `orders` SET 
  `delivery_address` = COALESCE(`delivery_address`, 'Address will be provided during delivery'),
  `delivery_city` = COALESCE(`delivery_city`, 'Cairo'),
  `delivery_zone` = COALESCE(`delivery_zone`, 'General'),
  `delivery_fee` = COALESCE(`delivery_fee`, 30.00),
  `subtotal` = COALESCE(`subtotal`, `total` - COALESCE(`delivery_fee`, 30.00))
WHERE `delivery_address` IS NULL OR `delivery_city` IS NULL OR `delivery_zone` IS NULL;

SELECT 'Orders table migration completed successfully' as status; 