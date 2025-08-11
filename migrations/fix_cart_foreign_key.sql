-- Fix cart foreign key constraint to reference customers table instead of users table
-- This migration fixes the foreign key constraint issue

-- First, drop the existing foreign key constraint
ALTER TABLE carts DROP FOREIGN KEY carts_ibfk_1;

-- Add the correct foreign key constraint that references customers table
ALTER TABLE carts 
ADD CONSTRAINT carts_ibfk_1 
FOREIGN KEY (user_id) REFERENCES customers(id) ON DELETE SET NULL;

-- Verify the change
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'carts' 
AND CONSTRAINT_NAME = 'carts_ibfk_1';
