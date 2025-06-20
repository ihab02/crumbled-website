-- Drop existing foreign key constraints
ALTER TABLE cart_items DROP FOREIGN KEY cart_items_ibfk_2;

-- Rename flavor_id to product_id
ALTER TABLE cart_items CHANGE flavor_id product_id INT;

-- Add foreign key constraint for products table
ALTER TABLE cart_items ADD CONSTRAINT cart_items_ibfk_2 FOREIGN KEY (product_id) REFERENCES products(id);

-- Add is_pack column to cart_items
ALTER TABLE cart_items ADD COLUMN is_pack BOOLEAN DEFAULT FALSE;

-- Update existing cart items to set is_pack based on the product
UPDATE cart_items ci
JOIN products p ON ci.product_id = p.id
SET ci.is_pack = p.is_pack; 