-- Migration: Enhance Order Items Storage
-- This migration adds fields to store product and flavor names at order time
-- Date: 2025-01-03

-- Add columns to order_items table to store product information at order time
ALTER TABLE order_items 
ADD COLUMN product_name VARCHAR(255) NULL AFTER product_instance_id,
ADD COLUMN product_type ENUM('individual', 'pack') NULL AFTER product_name,
ADD COLUMN pack_size VARCHAR(50) NULL AFTER product_type,
ADD COLUMN flavor_details JSON NULL AFTER pack_size;

-- Add columns to product_instance_flavor table to store flavor names at order time
ALTER TABLE product_instance_flavor 
ADD COLUMN flavor_name VARCHAR(255) NULL AFTER flavor_id,
ADD COLUMN size_name VARCHAR(50) NULL AFTER flavor_name;

-- Create indexes for better performance
CREATE INDEX idx_order_items_product_name ON order_items(product_name);
CREATE INDEX idx_order_items_product_type ON order_items(product_type);
CREATE INDEX idx_product_instance_flavor_flavor_name ON product_instance_flavor(flavor_name);

-- Add comment to explain the purpose
ALTER TABLE order_items 
MODIFY COLUMN product_name VARCHAR(255) NULL COMMENT 'Product name at time of order placement',
MODIFY COLUMN product_type ENUM('individual', 'pack') NULL COMMENT 'Type of product at order time',
MODIFY COLUMN pack_size VARCHAR(50) NULL COMMENT 'Size of pack (Mini, Medium, Large) at order time',
MODIFY COLUMN flavor_details JSON NULL COMMENT 'JSON array of flavor details at order time';

ALTER TABLE product_instance_flavor 
MODIFY COLUMN flavor_name VARCHAR(255) NULL COMMENT 'Flavor name at time of order placement',
MODIFY COLUMN size_name VARCHAR(50) NULL COMMENT 'Size name (Mini, Medium, Large) at order time'; 