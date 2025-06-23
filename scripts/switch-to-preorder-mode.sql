-- Switch to preorder mode temporarily
-- This allows all orders regardless of stock levels

-- Update the order mode setting
UPDATE site_settings 
SET setting_value = 'preorder' 
WHERE setting_key = 'order_mode';

-- Verify the change
SELECT setting_key, setting_value 
FROM site_settings 
WHERE setting_key = 'order_mode'; 