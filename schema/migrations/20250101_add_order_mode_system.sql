-- Add order mode system
-- Migration: 20250101_add_order_mode_system.sql

-- Add order_mode to site_settings table
ALTER TABLE site_settings 
ADD COLUMN order_mode ENUM('stock_based', 'preorder') DEFAULT 'stock_based';

-- Add allow_out_of_stock_order flag to products table
ALTER TABLE products 
ADD COLUMN allow_out_of_stock_order BOOLEAN DEFAULT FALSE;

-- Add allow_out_of_stock_order flag to flavors table
ALTER TABLE flavors 
ADD COLUMN allow_out_of_stock_order BOOLEAN DEFAULT FALSE;

-- Insert default site setting for order mode
INSERT INTO site_settings (setting_key, setting_value, created_at) 
VALUES ('order_mode', 'stock_based', NOW())
ON DUPLICATE KEY UPDATE setting_value = 'stock_based';

-- Add indexes for better performance
CREATE INDEX idx_products_stock_order ON products(stock_quantity, allow_out_of_stock_order, is_active);
CREATE INDEX idx_flavors_stock_order ON flavors(allow_out_of_stock_order, is_active); 