-- Migration: Add Missing Enhanced Promo Code Fields
-- Date: 2025-01-27
-- Description: Add only the missing fields for enhanced promo codes

-- Add missing fields to promo_codes table (only if they don't exist)
ALTER TABLE promo_codes 
ADD COLUMN IF NOT EXISTS category_restrictions JSON NULL AFTER enhanced_type,
ADD COLUMN IF NOT EXISTS product_restrictions JSON NULL AFTER category_restrictions,
ADD COLUMN IF NOT EXISTS customer_group_restrictions JSON NULL AFTER product_restrictions,
ADD COLUMN IF NOT EXISTS first_time_only BOOLEAN DEFAULT FALSE AFTER customer_group_restrictions,
ADD COLUMN IF NOT EXISTS minimum_quantity INT NULL AFTER first_time_only,
ADD COLUMN IF NOT EXISTS maximum_quantity INT NULL AFTER minimum_quantity,
ADD COLUMN IF NOT EXISTS combination_allowed BOOLEAN DEFAULT TRUE AFTER maximum_quantity,
ADD COLUMN IF NOT EXISTS stack_with_pricing_rules BOOLEAN DEFAULT TRUE AFTER combination_allowed,
ADD COLUMN IF NOT EXISTS buy_x_quantity INT NULL AFTER stack_with_pricing_rules,
ADD COLUMN IF NOT EXISTS get_y_quantity INT NULL AFTER buy_x_quantity;

-- Add indexes for enhanced promo codes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_promo_codes_enhanced_type ON promo_codes(enhanced_type);
CREATE INDEX IF NOT EXISTS idx_promo_codes_category_restrictions ON promo_codes((CAST(category_restrictions AS CHAR(100))));
CREATE INDEX IF NOT EXISTS idx_promo_codes_customer_group ON promo_codes((CAST(customer_group_restrictions AS CHAR(100))));
CREATE INDEX IF NOT EXISTS idx_promo_codes_first_time_only ON promo_codes(first_time_only);

-- Update existing promo codes to enhanced type if not set
UPDATE promo_codes SET enhanced_type = 'basic' WHERE enhanced_type IS NULL; 