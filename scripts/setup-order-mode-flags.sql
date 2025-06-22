-- Setup order mode flags for existing products and flavors
-- This script sets default values for the new allow_out_of_stock_order flags

-- Set default order mode to stock_based if not already set
INSERT INTO site_settings (setting_key, setting_value, created_at) 
VALUES ('order_mode', 'stock_based', NOW())
ON DUPLICATE KEY UPDATE setting_value = 'stock_based';

-- Set allow_out_of_stock_order = false for all existing products (default behavior)
UPDATE products 
SET allow_out_of_stock_order = FALSE 
WHERE allow_out_of_stock_order IS NULL;

-- Set allow_out_of_stock_order = false for all existing flavors (default behavior)
UPDATE flavors 
SET allow_out_of_stock_order = FALSE 
WHERE allow_out_of_stock_order IS NULL;

-- Example: Allow out-of-stock orders for specific products (customize as needed)
-- UPDATE products SET allow_out_of_stock_order = TRUE WHERE id IN (1, 2, 3);

-- Example: Allow out-of-stock orders for specific flavors (customize as needed)
-- UPDATE flavors SET allow_out_of_stock_order = TRUE WHERE id IN (1, 2, 3);

-- Verify the setup
SELECT 'Site Settings:' as info;
SELECT setting_key, setting_value FROM site_settings WHERE setting_key = 'order_mode';

SELECT 'Products with allow_out_of_stock_order = TRUE:' as info;
SELECT id, name, allow_out_of_stock_order FROM products WHERE allow_out_of_stock_order = TRUE;

SELECT 'Flavors with allow_out_of_stock_order = TRUE:' as info;
SELECT id, name, allow_out_of_stock_order FROM flavors WHERE allow_out_of_stock_order = TRUE; 