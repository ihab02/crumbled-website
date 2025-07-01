-- Add delivery information columns to orders table
ALTER TABLE `orders` 
ADD COLUMN `delivery_address` TEXT NULL AFTER `payment_method`,
ADD COLUMN `delivery_additional_info` TEXT NULL AFTER `delivery_address`,
ADD COLUMN `delivery_city` VARCHAR(255) NULL AFTER `delivery_additional_info`,
ADD COLUMN `delivery_zone` VARCHAR(255) NULL AFTER `delivery_city`,
ADD COLUMN `delivery_fee` DECIMAL(10,2) NULL AFTER `delivery_zone`,
ADD COLUMN `subtotal` DECIMAL(10,2) NULL AFTER `delivery_fee`; 