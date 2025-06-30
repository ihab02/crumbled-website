-- Simple migration to unify customer tables

-- Step 1: Add missing columns to customers table
ALTER TABLE customers 
ADD COLUMN mobile VARCHAR(20) AFTER phone,
ADD COLUMN mobile_verified TINYINT(1) DEFAULT 0 AFTER mobile,
ADD COLUMN email_verified TINYINT(1) DEFAULT 0 AFTER mobile_verified,
ADD COLUMN address TEXT AFTER email_verified,
ADD COLUMN zone_id INT AFTER address,
ADD COLUMN type ENUM('guest','registered') NOT NULL DEFAULT 'registered' AFTER zone_id;

-- Step 2: Add unique constraint on mobile
ALTER TABLE customers 
ADD UNIQUE KEY unique_mobile (mobile);

-- Step 3: Update existing customers to have type 'registered'
UPDATE customers SET type = 'registered' WHERE type IS NULL;

-- Step 4: Drop foreign key constraint from orders table
ALTER TABLE orders 
DROP FOREIGN KEY orders_ibfk_1;

-- Step 5: Add new foreign key constraint to reference customers table
ALTER TABLE orders 
ADD CONSTRAINT orders_ibfk_1 
FOREIGN KEY (customer_id) REFERENCES customers(id);

-- Step 6: Drop the customer table
DROP TABLE IF EXISTS customer; 