-- Migration: Add Pricing Management System (Fixed)
-- Date: 2025-01-27
-- Description: Add pricing management system tables and fields with proper MySQL syntax

-- =====================================================
-- PRICING MANAGEMENT SYSTEM
-- =====================================================

-- Create pricing_rules table
CREATE TABLE IF NOT EXISTS pricing_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rule_type ENUM('product', 'category', 'flavor', 'time', 'location', 'customer_group') NOT NULL,
  target_id INT NULL,
  target_value VARCHAR(255) NULL,
  discount_type ENUM('percentage', 'fixed_amount', 'free_delivery') NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  minimum_order_amount DECIMAL(10, 2) DEFAULT 0.00,
  maximum_discount DECIMAL(10, 2) NULL,
  start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_date DATETIME NULL,
  is_active BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 0,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_rule_type (rule_type),
  INDEX idx_target_id (target_id),
  INDEX idx_start_date (start_date),
  INDEX idx_end_date (end_date),
  INDEX idx_is_active (is_active),
  INDEX idx_priority (priority),
  INDEX idx_rule_active_valid (is_active, start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create product_prices table
CREATE TABLE IF NOT EXISTS product_prices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  price_type ENUM('regular', 'sale', 'member', 'wholesale') NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_date DATETIME NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_product_id (product_id),
  INDEX idx_price_type (price_type),
  INDEX idx_start_date (start_date),
  INDEX idx_end_date (end_date),
  INDEX idx_is_active (is_active),
  INDEX idx_product_active_valid (product_id, is_active, start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create pricing_categories table
CREATE TABLE IF NOT EXISTS pricing_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_type ENUM('product_type', 'flavor_category', 'size_category', 'customer_group') NOT NULL,
  target_value VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category_type (category_type),
  INDEX idx_target_value (target_value),
  INDEX idx_is_active (is_active),
  UNIQUE KEY uk_category_type_value (category_type, target_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create pricing_rule_usage table to track pricing rule usage
CREATE TABLE IF NOT EXISTS pricing_rule_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pricing_rule_id INT NOT NULL,
  order_id INT NOT NULL,
  customer_id INT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pricing_rule_id) REFERENCES pricing_rules(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_pricing_rule_id (pricing_rule_id),
  INDEX idx_order_id (order_id),
  INDEX idx_customer_id (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- UPDATE EXISTING TABLES (with proper error handling)
-- =====================================================

-- Update products table with pricing fields (using stored procedure to handle errors)
DELIMITER //
CREATE PROCEDURE AddProductPricingColumns()
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    
    -- Add original_price column
    ALTER TABLE products ADD COLUMN original_price DECIMAL(10, 2) NULL AFTER base_price;
    
    -- Add sale_price column
    ALTER TABLE products ADD COLUMN sale_price DECIMAL(10, 2) NULL AFTER original_price;
    
    -- Add sale_start_date column
    ALTER TABLE products ADD COLUMN sale_start_date DATETIME NULL AFTER sale_price;
    
    -- Add sale_end_date column
    ALTER TABLE products ADD COLUMN sale_end_date DATETIME NULL AFTER sale_start_date;
    
    -- Add is_on_sale column
    ALTER TABLE products ADD COLUMN is_on_sale BOOLEAN DEFAULT FALSE AFTER sale_end_date;
    
    -- Add indexes
    CREATE INDEX idx_is_on_sale ON products(is_on_sale);
    CREATE INDEX idx_sale_start_date ON products(sale_start_date);
    CREATE INDEX idx_sale_end_date ON products(sale_end_date);
    CREATE INDEX idx_sale_active ON products(is_on_sale, sale_start_date, sale_end_date);
END //
DELIMITER ;

CALL AddProductPricingColumns();
DROP PROCEDURE AddProductPricingColumns;

-- Update orders table to track both pricing rules and promo codes
DELIMITER //
CREATE PROCEDURE AddOrderPricingColumns()
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    
    -- Add applied_pricing_rules column
    ALTER TABLE orders ADD COLUMN applied_pricing_rules JSON NULL AFTER promo_code;
    
    -- Add pricing_discount_amount column
    ALTER TABLE orders ADD COLUMN pricing_discount_amount DECIMAL(10, 2) DEFAULT 0.00 AFTER discount_amount;
    
    -- Add total_discount_amount as generated column
    ALTER TABLE orders ADD COLUMN total_discount_amount DECIMAL(10, 2) GENERATED ALWAYS AS (discount_amount + pricing_discount_amount) STORED;
END //
DELIMITER ;

CALL AddOrderPricingColumns();
DROP PROCEDURE AddOrderPricingColumns;

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample enhanced promo codes
INSERT IGNORE INTO promo_codes (
  code, name, description, discount_type, enhanced_type, discount_value, 
  minimum_order_amount, usage_limit, valid_until, is_active, created_by
) VALUES 
('FREESHIP200', 'Free Delivery', 'Free delivery for orders above 200 EGP', 'fixed_amount', 'free_delivery', 50.00, 200.00, 100, DATE_ADD(NOW(), INTERVAL 90 DAY), true, 1),
('B2G1CHOCO', 'Buy 2 Get 1 Free Chocolate', 'Buy 2 chocolate cookies, get 1 free', 'percentage', 'buy_x_get_y', 100.00, 50.00, 50, DATE_ADD(NOW(), INTERVAL 30 DAY), true, 1),
('FIRSTORDER', 'First Order Discount', '15% off your first order', 'percentage', 'first_time_customer', 15.00, 50.00, 200, DATE_ADD(NOW(), INTERVAL 60 DAY), true, 1),
('VIP20', 'VIP Member Discount', '20% off for VIP members', 'percentage', 'loyalty_reward', 20.00, 100.00, 100, DATE_ADD(NOW(), INTERVAL 90 DAY), true, 1);

-- Insert sample pricing rules
INSERT IGNORE INTO pricing_rules (
  name, description, rule_type, target_value, discount_type, discount_value, 
  minimum_order_amount, priority, is_active, created_by
) VALUES 
('Chocolate Lovers Discount', '15% off all chocolate flavors', 'category', 'chocolate', 'percentage', 15.00, 0.00, 1, true, 1),
('VIP Member Pricing', '10% off for VIP members', 'customer_group', 'vip', 'percentage', 10.00, 0.00, 2, true, 1),
('Large Size Premium', '5% premium for large size cookies', 'category', 'large', 'percentage', -5.00, 0.00, 3, true, 1),
('Bulk Order Discount', '20% off for orders above 300 EGP', 'time', 'bulk', 'percentage', 20.00, 300.00, 4, true, 1);

-- Insert sample pricing categories
INSERT IGNORE INTO pricing_categories (name, description, category_type, target_value) VALUES 
('Chocolate Flavors', 'All chocolate-based cookie flavors', 'flavor_category', 'chocolate'),
('Large Size', 'Large size cookies', 'size_category', 'large'),
('VIP Members', 'VIP customer group', 'customer_group', 'vip'),
('Bulk Orders', 'Large quantity orders', 'customer_group', 'bulk');

-- Insert sample product prices (using actual product IDs from database)
INSERT IGNORE INTO product_prices (product_id, price_type, price, is_active, created_by) VALUES 
(1, 'regular', 25.00, true, 1),
(1, 'sale', 20.00, true, 1),
(1, 'member', 22.50, true, 1),
(2, 'regular', 30.00, true, 1),
(2, 'sale', 25.00, true, 1),
(5, 'regular', 35.00, true, 1),
(5, 'member', 31.50, true, 1),
(11, 'regular', 45.00, true, 1),
(11, 'sale', 40.00, true, 1),
(6, 'regular', 15.00, true, 1),
(6, 'member', 13.50, true, 1);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify enhanced promo codes
SELECT 'Enhanced Promo Codes' as table_name, COUNT(*) as count FROM promo_codes WHERE enhanced_type != 'basic'
UNION ALL
SELECT 'Basic Promo Codes' as table_name, COUNT(*) as count FROM promo_codes WHERE enhanced_type = 'basic'
UNION ALL
SELECT 'Pricing Rules' as table_name, COUNT(*) as count FROM pricing_rules
UNION ALL
SELECT 'Product Prices' as table_name, COUNT(*) as count FROM product_prices
UNION ALL
SELECT 'Pricing Categories' as table_name, COUNT(*) as count FROM pricing_categories;

-- Show sample enhanced promo codes
SELECT code, name, enhanced_type, discount_value, minimum_order_amount FROM promo_codes WHERE enhanced_type != 'basic';

-- Show sample pricing rules
SELECT name, rule_type, target_value, discount_type, discount_value, priority FROM pricing_rules; 