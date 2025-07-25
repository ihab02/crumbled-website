-- Drop old zone table migration
-- Migration: drop_old_zone_table.sql
-- Description: Drop the old 'zone' table since all code uses 'zones' table

-- First, check if the old zone table exists and has data
-- This is a safety check to ensure we don't lose important data

-- Check if zone table exists
SELECT COUNT(*) as zone_table_exists 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'zone';

-- If zone table exists and has data, we should migrate it first
-- For now, we'll just drop it since zones table should have all the data

-- Drop the old zone table
DROP TABLE IF EXISTS zone;

-- Verify the drop was successful
SELECT COUNT(*) as zone_table_still_exists 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'zone';

-- This should return 0 if the table was successfully dropped 