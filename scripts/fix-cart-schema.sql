-- Fix cart schema issues
-- Add missing columns to cart_items and cart_item_flavors tables

-- Add is_pack column to cart_items table
ALTER TABLE cart_items ADD COLUMN is_pack TINYINT(1) NOT NULL DEFAULT 0;

-- Add size column to cart_item_flavors table
ALTER TABLE cart_item_flavors ADD COLUMN size ENUM('Mini', 'Medium', 'Large') NOT NULL DEFAULT 'Large';

-- Update existing cart items to set is_pack based on product type
UPDATE cart_items ci 
JOIN products p ON ci.product_id = p.id 
SET ci.is_pack = p.is_pack 
WHERE ci.is_pack = 0;

-- Show the updated table structures
DESCRIBE cart_items;
DESCRIBE cart_item_flavors; 