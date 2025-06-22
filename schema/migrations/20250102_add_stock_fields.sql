-- Add stock management fields
-- Migration: 20250102_add_stock_fields.sql

-- Add stock_quantity and is_available to products table
ALTER TABLE products 
ADD COLUMN stock_quantity INT DEFAULT 0,
ADD COLUMN is_available BOOLEAN DEFAULT TRUE;

-- Add stock_quantity and is_available to flavors table
ALTER TABLE flavors 
ADD COLUMN stock_quantity INT DEFAULT 0,
ADD COLUMN is_available BOOLEAN DEFAULT TRUE;

-- Update existing products to have default stock
UPDATE products SET stock_quantity = 100, is_available = TRUE WHERE stock_quantity IS NULL;

-- Update existing flavors to have default stock
UPDATE flavors SET stock_quantity = 100, is_available = TRUE WHERE stock_quantity IS NULL;

-- Add indexes for better performance
CREATE INDEX idx_products_stock_available ON products(stock_quantity, is_available, is_active);
CREATE INDEX idx_flavors_stock_available ON flavors(stock_quantity, is_available, is_active); 