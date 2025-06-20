-- Drop existing foreign key constraints
ALTER TABLE cart_items
DROP FOREIGN KEY cart_items_ibfk_2;

-- Add new foreign key constraint with CASCADE
ALTER TABLE cart_items
ADD CONSTRAINT cart_items_ibfk_2
FOREIGN KEY (product_id) REFERENCES products(id)
ON DELETE CASCADE; 