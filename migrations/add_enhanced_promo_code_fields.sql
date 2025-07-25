-- Migration: Add Enhanced Promo Code Fields
-- This migration adds enhanced fields to the existing promo_codes table
-- Date: 2025-01-03

-- Add enhanced fields to promo_codes table
ALTER TABLE promo_codes 
ADD COLUMN enhanced_type ENUM('basic', 'free_delivery', 'buy_x_get_y', 'category_specific', 'first_time_customer', 'loyalty_reward') DEFAULT 'basic' AFTER discount_type,
ADD COLUMN category_restrictions JSON NULL AFTER enhanced_type,
ADD COLUMN product_restrictions JSON NULL AFTER category_restrictions,
ADD COLUMN customer_group_restrictions JSON NULL AFTER product_restrictions,
ADD COLUMN first_time_only BOOLEAN DEFAULT false AFTER customer_group_restrictions,
ADD COLUMN minimum_quantity INT DEFAULT 0 AFTER first_time_only,
ADD COLUMN maximum_quantity INT DEFAULT 0 AFTER minimum_quantity,
ADD COLUMN combination_allowed BOOLEAN DEFAULT false AFTER maximum_quantity,
ADD COLUMN stack_with_pricing_rules BOOLEAN DEFAULT false AFTER combination_allowed,
ADD COLUMN buy_x_quantity INT DEFAULT 0 AFTER stack_with_pricing_rules,
ADD COLUMN get_y_quantity INT DEFAULT 0 AFTER buy_x_quantity,
ADD COLUMN get_y_discount_percentage DECIMAL(5,2) DEFAULT 100.00 AFTER get_y_quantity,
ADD COLUMN usage_per_customer INT DEFAULT 1 AFTER get_y_discount_percentage,
ADD COLUMN usage_per_order INT DEFAULT 1 AFTER usage_per_customer;

-- Update existing promo codes to have basic enhanced_type
UPDATE promo_codes SET enhanced_type = 'basic' WHERE enhanced_type IS NULL;

-- Create indexes for enhanced fields
CREATE INDEX idx_promo_codes_enhanced_type ON promo_codes(enhanced_type);
CREATE INDEX idx_promo_codes_first_time_only ON promo_codes(first_time_only);
CREATE INDEX idx_promo_codes_combination_allowed ON promo_codes(combination_allowed); 