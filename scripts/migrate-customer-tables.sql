-- Migration script to unify customer tables
-- This script will:
-- 1. Add missing columns to customers table
-- 2. Migrate data from customer table to customers table
-- 3. Update foreign key references
-- 4. Drop the customer table

-- Step 1: Add missing columns to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS mobile VARCHAR(20) AFTER phone,
ADD COLUMN IF NOT EXISTS mobile_verified TINYINT(1) DEFAULT 0 AFTER mobile,
ADD COLUMN IF NOT EXISTS email_verified TINYINT(1) DEFAULT 0 AFTER mobile_verified,
ADD COLUMN IF NOT EXISTS address TEXT AFTER email_verified,
ADD COLUMN IF NOT EXISTS zone_id INT AFTER address,
ADD COLUMN IF NOT EXISTS type ENUM('guest','registered') NOT NULL DEFAULT 'registered' AFTER zone_id;

-- Step 2: Add unique constraint on mobile if it doesn't exist
ALTER TABLE customers 
ADD UNIQUE KEY IF NOT EXISTS unique_mobile (mobile);

-- Step 3: Migrate data from customer table to customers table
-- Insert customers that don't already exist in customers table
INSERT IGNORE INTO customers (email, mobile, type, created_at)
SELECT email, mobile, type, created_at
FROM customer
WHERE email IS NOT NULL AND email NOT IN (SELECT email FROM customers WHERE email IS NOT NULL);

-- Update existing customers with data from customer table
UPDATE customers c
JOIN customer cu ON c.email = cu.email
SET 
    c.mobile = COALESCE(c.mobile, cu.mobile),
    c.mobile_verified = COALESCE(c.mobile_verified, cu.mobile_verified),
    c.email_verified = COALESCE(c.email_verified, cu.email_verified),
    c.address = COALESCE(c.address, cu.address),
    c.zone_id = COALESCE(c.zone_id, cu.zone_id),
    c.type = COALESCE(c.type, cu.type)
WHERE cu.email IS NOT NULL;

-- Step 4: Update orders table to reference customers table instead of customer table
-- First, create a temporary mapping of old customer IDs to new customer IDs
CREATE TEMPORARY TABLE customer_id_mapping AS
SELECT 
    cu.id as old_id,
    c.id as new_id
FROM customer cu
JOIN customers c ON cu.email = c.email
WHERE cu.email IS NOT NULL;

-- Update orders table to use new customer IDs
UPDATE orders o
JOIN customer_id_mapping cm ON o.customer_id = cm.old_id
SET o.customer_id = cm.new_id;

-- Step 5: Drop foreign key constraint from orders table
ALTER TABLE orders 
DROP FOREIGN KEY orders_ibfk_1;

-- Step 6: Add new foreign key constraint to reference customers table
ALTER TABLE orders 
ADD CONSTRAINT orders_ibfk_1 
FOREIGN KEY (customer_id) REFERENCES customers(id);

-- Step 7: Drop the customer table
DROP TABLE IF EXISTS customer;

-- Step 8: Clean up temporary table
DROP TEMPORARY TABLE IF EXISTS customer_id_mapping;

-- Step 9: Verify the migration
SELECT 'Migration completed successfully' as status;
SELECT COUNT(*) as total_customers FROM customers;
SELECT COUNT(*) as total_orders FROM orders; 