-- Fix payment_token column length to accommodate long Paymob tokens
ALTER TABLE `orders` 
MODIFY COLUMN `payment_token` VARCHAR(5000) NULL; 