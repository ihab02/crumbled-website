-- Update zones table to add missing columns
-- Migration: update_zones_table.sql

-- Add delivery_days column
ALTER TABLE zones ADD COLUMN delivery_days INT NOT NULL DEFAULT 0 AFTER city_id;

-- Add time_slot_id column
ALTER TABLE zones ADD COLUMN time_slot_id INT NULL AFTER delivery_days;

-- Add foreign key constraint for time_slot_id
ALTER TABLE zones ADD CONSTRAINT fk_zones_time_slot 
FOREIGN KEY (time_slot_id) REFERENCES delivery_time_slots(id) ON DELETE SET NULL;

-- Add index for time_slot_id
CREATE INDEX idx_zones_time_slot_id ON zones(time_slot_id);

-- Add index for delivery_days
CREATE INDEX idx_zones_delivery_days ON zones(delivery_days); 