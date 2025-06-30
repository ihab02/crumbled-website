-- Create payment methods settings
-- Migration: 20250101_create_payment_methods_settings.sql

-- Insert default payment methods settings
INSERT INTO site_settings (setting_key, setting_value) VALUES
('payment_methods', '{"cod": {"enabled": true, "name": "Cash on Delivery", "description": "Pay when you receive your order"}, "paymob": {"enabled": true, "name": "Paymob", "description": "Secure online payment"}}')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value); 