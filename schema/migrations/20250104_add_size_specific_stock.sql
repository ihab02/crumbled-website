-- Add size-specific stock management
-- Migration: 20250104_add_size_specific_stock.sql

-- Add size-specific stock fields to flavors table
ALTER TABLE flavors 
ADD COLUMN stock_quantity_mini INT DEFAULT 0,
ADD COLUMN stock_quantity_medium INT DEFAULT 0,
ADD COLUMN stock_quantity_large INT DEFAULT 0;

-- Migrate existing stock_quantity to large size (assuming existing stock was for large)
UPDATE flavors SET stock_quantity_large = stock_quantity WHERE stock_quantity IS NOT NULL;

-- Set default stock for all sizes if they're null
UPDATE flavors SET 
    stock_quantity_mini = 100 WHERE stock_quantity_mini IS NULL;
UPDATE flavors SET 
    stock_quantity_medium = 100 WHERE stock_quantity_medium IS NULL;
UPDATE flavors SET 
    stock_quantity_large = 100 WHERE stock_quantity_large IS NULL;

-- Add size column to stock_history table
ALTER TABLE stock_history 
ADD COLUMN size ENUM('mini', 'medium', 'large') DEFAULT 'large' AFTER item_type;

-- Update existing stock history records to have 'large' size
UPDATE stock_history SET size = 'large' WHERE size IS NULL;

-- Add indexes for better performance
CREATE INDEX idx_flavors_stock_sizes ON flavors(stock_quantity_mini, stock_quantity_medium, stock_quantity_large, is_available, is_enabled);
CREATE INDEX idx_stock_history_size ON stock_history(item_id, item_type, size, changed_at);

-- Add a computed column for total stock (for backward compatibility)
ALTER TABLE flavors 
ADD COLUMN total_stock AS (stock_quantity_mini + stock_quantity_medium + stock_quantity_large) STORED; 