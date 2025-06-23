-- Increase Chocolate stock to ensure sufficient availability
-- This adds more stock to prevent stock-based restrictions

-- Increase Chocolate large size stock from 2 to 10 units
UPDATE flavors 
SET stock_quantity_large = 10 
WHERE id = 1 AND name = 'Chocolate';

-- Verify the change
SELECT id, name, 
       stock_quantity_mini as mini_stock,
       stock_quantity_medium as medium_stock,
       stock_quantity_large as large_stock
FROM flavors 
WHERE id = 1; 