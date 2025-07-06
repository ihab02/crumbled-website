-- Migration: Add Customer Marketing Attributes
-- This migration adds comprehensive marketing-relevant fields to the customers table
-- Date: 2025-01-03

-- Phase 1: Core Demographics
ALTER TABLE customers 
ADD COLUMN birth_date DATE NULL,
ADD COLUMN age_group ENUM('13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+') NULL,
ADD COLUMN gender ENUM('male', 'female', 'other', 'prefer_not_to_say') NULL,
ADD COLUMN occupation VARCHAR(100) NULL;

-- Phase 2: Behavioral & Preferences
ALTER TABLE customers 
ADD COLUMN preferred_payment_method ENUM('cash', 'card', 'mobile_wallet') NULL,
ADD COLUMN average_order_value DECIMAL(10,2) NULL,
ADD COLUMN total_orders INT DEFAULT 0,
ADD COLUMN last_order_date TIMESTAMP NULL,
ADD COLUMN first_order_date TIMESTAMP NULL,
ADD COLUMN dietary_restrictions JSON NULL,
ADD COLUMN favorite_flavors JSON NULL,
ADD COLUMN preferred_delivery_time ENUM('morning', 'afternoon', 'evening', 'any') NULL,
ADD COLUMN preferred_delivery_days JSON NULL;

-- Phase 3: Engagement & Loyalty
ALTER TABLE customers 
ADD COLUMN last_login_date TIMESTAMP NULL,
ADD COLUMN total_logins INT DEFAULT 0,
ADD COLUMN days_since_last_activity INT NULL,
ADD COLUMN engagement_score INT DEFAULT 0,
ADD COLUMN loyalty_points INT DEFAULT 0,
ADD COLUMN loyalty_tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze',
ADD COLUMN referral_code VARCHAR(20) UNIQUE NULL,
ADD COLUMN referred_by INT NULL,
ADD COLUMN total_referrals INT DEFAULT 0,
ADD COLUMN social_media_platforms JSON NULL,
ADD COLUMN social_media_handles JSON NULL;

-- Phase 4: Marketing & Communication
ALTER TABLE customers 
ADD COLUMN marketing_emails_enabled BOOLEAN DEFAULT true,
ADD COLUMN sms_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN push_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN preferred_contact_method ENUM('email', 'sms', 'phone') DEFAULT 'email',
ADD COLUMN signup_source ENUM('organic', 'google_ads', 'facebook_ads', 'instagram', 'referral', 'email', 'other') NULL,
ADD COLUMN utm_source VARCHAR(100) NULL,
ADD COLUMN utm_medium VARCHAR(100) NULL,
ADD COLUMN utm_campaign VARCHAR(100) NULL,
ADD COLUMN landing_page VARCHAR(255) NULL,
ADD COLUMN email_subscription_status ENUM('subscribed', 'unsubscribed', 'pending') DEFAULT 'subscribed',
ADD COLUMN email_subscription_date TIMESTAMP NULL,
ADD COLUMN email_unsubscribe_date TIMESTAMP NULL,
ADD COLUMN email_bounce_count INT DEFAULT 0,
ADD COLUMN email_open_rate DECIMAL(5,2) NULL,
ADD COLUMN email_click_rate DECIMAL(5,2) NULL,
ADD COLUMN sms_subscription_status ENUM('subscribed', 'unsubscribed', 'pending') DEFAULT 'subscribed',
ADD COLUMN sms_subscription_date TIMESTAMP NULL,
ADD COLUMN sms_unsubscribe_date TIMESTAMP NULL;

-- Phase 5: Customer Lifecycle & Segmentation
ALTER TABLE customers 
ADD COLUMN customer_lifecycle_stage ENUM('new', 'active', 'at_risk', 'churned', 'reactivated') DEFAULT 'new',
ADD COLUMN customer_segment ENUM('high_value', 'medium_value', 'low_value', 'inactive') DEFAULT 'low_value',
ADD COLUMN churn_risk_score DECIMAL(3,2) NULL,
ADD COLUMN lifetime_value DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN is_vip BOOLEAN DEFAULT false,
ADD COLUMN vip_since TIMESTAMP NULL,
ADD COLUMN is_wholesale BOOLEAN DEFAULT false,
ADD COLUMN is_corporate BOOLEAN DEFAULT false,
ADD COLUMN corporate_account_id INT NULL;

-- Phase 6: Technical & Analytics
ALTER TABLE customers 
ADD COLUMN preferred_device ENUM('mobile', 'desktop', 'tablet') NULL,
ADD COLUMN preferred_browser VARCHAR(50) NULL,
ADD COLUMN preferred_os VARCHAR(50) NULL,
ADD COLUMN timezone VARCHAR(50) NULL,
ADD COLUMN language_preference ENUM('en', 'ar') DEFAULT 'en',
ADD COLUMN currency_preference ENUM('EGP', 'USD', 'EUR') DEFAULT 'EGP';

-- Add indexes for performance
CREATE INDEX idx_customers_age_group ON customers(age_group);
CREATE INDEX idx_customers_gender ON customers(gender);
CREATE INDEX idx_customers_loyalty_tier ON customers(loyalty_tier);
CREATE INDEX idx_customers_customer_segment ON customers(customer_segment);
CREATE INDEX idx_customers_lifecycle_stage ON customers(customer_lifecycle_stage);
CREATE INDEX idx_customers_signup_source ON customers(signup_source);
CREATE INDEX idx_customers_last_order_date ON customers(last_order_date);
CREATE INDEX idx_customers_engagement_score ON customers(engagement_score);
CREATE INDEX idx_customers_churn_risk_score ON customers(churn_risk_score);
CREATE INDEX idx_customers_lifetime_value ON customers(lifetime_value);
CREATE INDEX idx_customers_referral_code ON customers(referral_code);

-- Add foreign key for referred_by
ALTER TABLE customers 
ADD CONSTRAINT fk_customers_referred_by 
FOREIGN KEY (referred_by) REFERENCES customers(id) ON DELETE SET NULL;

-- Create customer_behavior_logs table for tracking behavioral changes
CREATE TABLE customer_behavior_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    behavior_type ENUM('purchase', 'login', 'email_open', 'email_click', 'sms_click', 'page_view', 'cart_abandon', 'review') NOT NULL,
    behavior_data JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer_behavior (customer_id, behavior_type, created_at)
);

-- Create customer_segments table for dynamic segmentation
CREATE TABLE customer_segments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    criteria JSON NOT NULL, -- Store segment criteria as JSON
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_segments_active (is_active)
);

-- Create customer_segment_members table for many-to-many relationship
CREATE TABLE customer_segment_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    segment_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (segment_id) REFERENCES customer_segments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_customer_segment (customer_id, segment_id),
    INDEX idx_segment_members (segment_id, customer_id)
);

-- Insert default segments
INSERT INTO customer_segments (name, description, criteria) VALUES
('High Value Customers', 'Customers with high lifetime value and frequent purchases', 
 '{"lifetime_value": {"min": 1000}, "total_orders": {"min": 5}, "average_order_value": {"min": 200}}'),
('At Risk Customers', 'Customers who haven\'t ordered recently', 
 '{"days_since_last_activity": {"min": 30}, "total_orders": {"min": 1}}'),
('New Customers', 'Recently registered customers', 
 '{"created_at": {"min": "30 days ago"}, "total_orders": {"max": 2}}'),
('Loyal Customers', 'Customers with high engagement and loyalty', 
 '{"loyalty_tier": ["gold", "platinum"], "engagement_score": {"min": 70}}');

-- Create triggers for automatic behavioral updates
DELIMITER //

CREATE TRIGGER update_customer_behavior_after_order
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
    UPDATE customers 
    SET 
        total_orders = total_orders + 1,
        last_order_date = NOW(),
        first_order_date = COALESCE(first_order_date, NOW()),
        average_order_value = (
            SELECT AVG(total) 
            FROM orders 
            WHERE customer_id = NEW.customer_id
        ),
        lifetime_value = (
            SELECT SUM(total) 
            FROM orders 
            WHERE customer_id = NEW.customer_id
        ),
        days_since_last_activity = 0,
        customer_lifecycle_stage = CASE 
            WHEN total_orders = 1 THEN 'new'
            WHEN total_orders > 1 THEN 'active'
            ELSE customer_lifecycle_stage
        END
    WHERE id = NEW.customer_id;
    
    -- Log the purchase behavior
    INSERT INTO customer_behavior_logs (customer_id, behavior_type, behavior_data)
    VALUES (NEW.customer_id, 'purchase', JSON_OBJECT('order_id', NEW.id, 'amount', NEW.total));
END//

CREATE TRIGGER update_customer_engagement_after_login
AFTER UPDATE ON customers
FOR EACH ROW
BEGIN
    IF NEW.last_login_date != OLD.last_login_date THEN
        UPDATE customers 
        SET 
            total_logins = total_logins + 1,
            days_since_last_activity = 0,
            engagement_score = LEAST(100, engagement_score + 5)
        WHERE id = NEW.id;
        
        -- Log the login behavior
        INSERT INTO customer_behavior_logs (customer_id, behavior_type, behavior_data)
        VALUES (NEW.id, 'login', JSON_OBJECT('login_count', NEW.total_logins));
    END IF;
END//

DELIMITER ;

-- Update existing customers with default values
UPDATE customers 
SET 
    customer_lifecycle_stage = CASE 
        WHEN total_orders = 0 THEN 'new'
        WHEN total_orders > 0 THEN 'active'
        ELSE 'new'
    END,
    customer_segment = CASE 
        WHEN total_orders >= 5 THEN 'high_value'
        WHEN total_orders >= 2 THEN 'medium_value'
        ELSE 'low_value'
    END,
    engagement_score = CASE 
        WHEN total_orders >= 5 THEN 80
        WHEN total_orders >= 2 THEN 60
        WHEN total_orders >= 1 THEN 40
        ELSE 20
    END;

-- Generate referral codes for existing customers
UPDATE customers 
SET referral_code = CONCAT('REF', LPAD(id, 6, '0'))
WHERE referral_code IS NULL;

COMMIT; 