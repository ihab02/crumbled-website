-- Migration: Add Promo Codes System
-- This migration implements a comprehensive promo code system
-- Date: 2025-01-03

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type ENUM('percentage', 'fixed_amount') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_order_amount DECIMAL(10,2) DEFAULT 0.00,
    maximum_discount DECIMAL(10,2) NULL,
    usage_limit INT NULL, -- NULL means unlimited
    used_count INT DEFAULT 0,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT true,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Create promo_code_usage table to track usage
CREATE TABLE IF NOT EXISTS promo_code_usage (
    id INT PRIMARY KEY AUTO_INCREMENT,
    promo_code_id INT NOT NULL,
    order_id INT NOT NULL,
    customer_id INT NULL,
    customer_email VARCHAR(255) NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    order_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX idx_promo_codes_valid_until ON promo_codes(valid_until);
CREATE INDEX idx_promo_code_usage_promo_code_id ON promo_code_usage(promo_code_id);
CREATE INDEX idx_promo_code_usage_order_id ON promo_code_usage(order_id);
CREATE INDEX idx_promo_code_usage_customer_id ON promo_code_usage(customer_id);

-- Insert some sample promo codes
INSERT INTO promo_codes (code, name, description, discount_type, discount_value, minimum_order_amount, usage_limit, valid_until) VALUES
('WELCOME10', 'Welcome Discount', '10% off for new customers', 'percentage', 10.00, 50.00, 100, DATE_ADD(NOW(), INTERVAL 30 DAY)),
('SAVE20', 'Save 20%', '20% off on orders above 100', 'percentage', 20.00, 100.00, 50, DATE_ADD(NOW(), INTERVAL 60 DAY)),
('FREESHIP', 'Free Shipping', 'Free shipping on orders above 200', 'fixed_amount', 50.00, 200.00, 200, DATE_ADD(NOW(), INTERVAL 90 DAY)),
('FLASH25', 'Flash Sale', '25% off flash sale', 'percentage', 25.00, 75.00, 25, DATE_ADD(NOW(), INTERVAL 7 DAY));

-- Add promo code columns to orders table
ALTER TABLE orders 
ADD COLUMN promo_code_id INT NULL AFTER payment_status,
ADD COLUMN promo_code VARCHAR(50) NULL AFTER promo_code_id,
ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0.00 AFTER promo_code,
ADD FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE SET NULL;

-- Create index for orders promo code
CREATE INDEX idx_orders_promo_code ON orders(promo_code); 