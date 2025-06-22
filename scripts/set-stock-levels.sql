-- Set reasonable stock levels for flavors
-- Script: set-stock-levels.sql

-- Update stock levels for all flavors
UPDATE flavors SET stock_quantity = 100, is_available = 1 WHERE name = 'Chocolate';
UPDATE flavors SET stock_quantity = 85, is_available = 1 WHERE name = 'Vanilla';
UPDATE flavors SET stock_quantity = 75, is_available = 1 WHERE name = 'Strawberry';
UPDATE flavors SET stock_quantity = 90, is_available = 1 WHERE name = 'Oreo';
UPDATE flavors SET stock_quantity = 80, is_available = 1 WHERE name = 'Caramel';
UPDATE flavors SET stock_quantity = 70, is_available = 1 WHERE name = 'Mint Chocolate';
UPDATE flavors SET stock_quantity = 95, is_available = 1 WHERE name = 'Cookies & Cream';
UPDATE flavors SET stock_quantity = 65, is_available = 1 WHERE name = 'Blueberry';
UPDATE flavors SET stock_quantity = 60, is_available = 1 WHERE name = 'Red Velvet';
UPDATE flavors SET stock_quantity = 55, is_available = 1 WHERE name = 'Lemon';

-- Set allow_out_of_stock_order to false for all flavors (stock-based mode)
UPDATE flavors SET allow_out_of_stock_order = 0;

-- Show updated stock levels
SELECT name, stock_quantity, is_available, allow_out_of_stock_order FROM flavors ORDER BY name; 