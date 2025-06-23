-- Revert allow_out_of_stock_order settings back to false
-- This restores the original strict stock-based behavior

-- Set allow_out_of_stock_order back to false for all flavors
UPDATE flavors 
SET allow_out_of_stock_order = FALSE;

-- Verify the changes
SELECT id, name, allow_out_of_stock_order, 
       stock_quantity_large as large_stock
FROM flavors 
WHERE id IN (1, 2, 3) 
ORDER BY name; 