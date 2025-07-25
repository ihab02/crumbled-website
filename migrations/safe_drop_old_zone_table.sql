-- Safe drop old zone table migration
-- Migration: safe_drop_old_zone_table.sql
-- Description: Safely drop the old 'zone' table after checking for data migration

-- Check if zone table exists
SET @zone_table_exists = (
  SELECT COUNT(*) 
  FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'zone'
);

-- If zone table exists, check if it has data
IF @zone_table_exists > 0 THEN
  -- Check if zone table has data
  SET @zone_data_count = (
    SELECT COUNT(*) 
    FROM zone
  );
  
  -- If there's data in the old zone table, migrate it to zones table
  IF @zone_data_count > 0 THEN
    -- Insert data from old zone table to zones table
    -- Only insert if the zone doesn't already exist in zones table
    INSERT INTO zones (name, city_id, delivery_fee, is_active, created_at, updated_at)
    SELECT 
      z.name,
      z.city_id,
      z.delivery_fee,
      CASE WHEN z.status = 'active' THEN 1 ELSE 0 END as is_active,
      NOW() as created_at,
      NOW() as updated_at
    FROM zone z
    WHERE NOT EXISTS (
      SELECT 1 FROM zones existing 
      WHERE existing.name = z.name 
      AND existing.city_id = z.city_id
    );
    
    -- Log the migration
    SELECT CONCAT('Migrated ', ROW_COUNT(), ' records from zone table to zones table') as migration_result;
  END IF;
  
  -- Now drop the old zone table
  DROP TABLE zone;
  
  SELECT 'Old zone table dropped successfully' as drop_result;
ELSE
  SELECT 'Old zone table does not exist' as result;
END IF; 