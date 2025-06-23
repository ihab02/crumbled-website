-- Enable out-of-stock orders for specific flavors
-- This allows customers to order these flavors even when stock is low

-- Enable out-of-stock orders for Chocolate, Vanilla, and Strawberry
UPDATE flavors 
SET allow_out_of_stock_order = TRUE 
WHERE id IN (1, 2, 3) AND name IN ('Chocolate', 'Vanilla', 'Strawberry');

-- Verify the changes
SELECT id, name, allow_out_of_stock_order, 
       stock_quantity_large as large_stock
FROM flavors 
WHERE id IN (1, 2, 3) 
ORDER BY name; 