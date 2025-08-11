-- Create indexes for cart system performance
-- Run this script after the main migration

-- Add index for better performance on user cart queries
CREATE INDEX idx_carts_user_id_status ON carts(user_id, status);
CREATE INDEX idx_carts_expires_at ON carts(expires_at);

-- Add index for cart items queries
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_item_flavors_cart_item_id ON cart_item_flavors(cart_item_id);

-- Verify indexes were created
SELECT 
    table_name,
    index_name,
    column_name
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE table_schema = DATABASE() 
AND table_name IN ('carts', 'cart_items', 'cart_item_flavors')
AND index_name LIKE 'idx_%'
ORDER BY table_name, index_name;
