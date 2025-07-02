-- Fix status column size to accommodate longer status values
-- This allows status values like "out_for_delivery" to be stored properly

-- Increase the status column size to VARCHAR(50) to accommodate longer status values
ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending';

-- Verify the change
DESCRIBE orders; 