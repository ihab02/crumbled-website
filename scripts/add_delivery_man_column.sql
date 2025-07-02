-- Add delivery_man_id column to orders table
-- This allows tracking which delivery person is assigned to each order

-- Check if column already exists
SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'crumbled_nextDB' 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME = 'delivery_man_id'
);

-- Add column if it doesn't exist
SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE orders ADD COLUMN delivery_man_id INT NULL AFTER subtotal',
  'SELECT "delivery_man_id column already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if foreign key constraint exists
SET @fk_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = 'crumbled_nextDB' 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME = 'delivery_man_id'
  AND REFERENCED_TABLE_NAME = 'delivery_men'
);

-- Add foreign key constraint if it doesn't exist
SET @sql = IF(@fk_exists = 0, 
  'ALTER TABLE orders ADD CONSTRAINT fk_orders_delivery_man FOREIGN KEY (delivery_man_id) REFERENCES delivery_men(id) ON DELETE SET NULL',
  'SELECT "foreign key constraint already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if index exists
SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'crumbled_nextDB' 
  AND TABLE_NAME = 'orders' 
  AND INDEX_NAME = 'idx_orders_delivery_man'
);

-- Add index if it doesn't exist
SET @sql = IF(@index_exists = 0, 
  'CREATE INDEX idx_orders_delivery_man ON orders(delivery_man_id)',
  'SELECT "index already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Show the result
SELECT 'Orders table updated with delivery_man_id column successfully' as status; 