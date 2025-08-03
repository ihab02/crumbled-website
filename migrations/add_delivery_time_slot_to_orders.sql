-- Add delivery time slot columns to orders table
ALTER TABLE `orders` 
ADD COLUMN `delivery_time_slot_name` VARCHAR(255) NULL AFTER `expected_delivery_date`,
ADD COLUMN `from_hour` TIME NULL AFTER `delivery_time_slot_name`,
ADD COLUMN `to_hour` TIME NULL AFTER `from_hour`;

-- Create index for better performance
CREATE INDEX idx_orders_delivery_time_slot ON orders(delivery_time_slot_name);

-- Update the existing "Morning Slot" to have the correct hours (11:00 AM to 5:00 PM)
UPDATE `delivery_time_slots` 
SET 
  `from_hour` = '11:00:00',
  `to_hour` = '17:00:00',
  `available_days` = '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]',
  `updated_at` = NOW()
WHERE `name` = 'Morning Slot';

-- Populate existing orders with the "Morning Slot" time slot information
UPDATE `orders` 
SET 
  `delivery_time_slot_name` = 'Morning Slot',
  `from_hour` = '11:00:00',
  `to_hour` = '17:00:00'
WHERE `delivery_time_slot_name` IS NULL; 