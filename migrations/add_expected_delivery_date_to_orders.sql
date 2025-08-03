-- Migration: Add expected_delivery_date column to orders table
-- This migration adds the expected_delivery_date column to track when orders should be delivered
-- Date: 2025-01-07

-- Add expected_delivery_date column to orders table
ALTER TABLE `orders` 
ADD COLUMN `expected_delivery_date` TIMESTAMP NULL AFTER `subtotal`;

-- Create index for better query performance
CREATE INDEX idx_orders_expected_delivery_date ON orders(expected_delivery_date); 