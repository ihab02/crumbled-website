-- Add payment-related columns to orders table
ALTER TABLE `orders` 
ADD COLUMN `payment_token` VARCHAR(255) NULL AFTER `payment_method`,
ADD COLUMN `payment_status` ENUM('pending', 'paid', 'failed', 'cancelled') DEFAULT 'pending' AFTER `payment_token`,
ADD COLUMN `transaction_id` VARCHAR(255) NULL AFTER `payment_status`,
ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`; 