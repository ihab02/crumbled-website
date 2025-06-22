-- Clean up email_settings table to ensure only one record exists
-- This script will keep the most recent record and delete all others

-- First, let's see what we have
SELECT 'Current email settings records:' as info;
SELECT id, smtp_host, from_email, created_at FROM email_settings ORDER BY id;

-- Keep only the most recent record (highest ID)
DELETE FROM email_settings WHERE id NOT IN (
  SELECT id FROM (
    SELECT MAX(id) as id FROM email_settings
  ) as temp
);

-- Verify the cleanup
SELECT 'After cleanup:' as info;
SELECT id, smtp_host, from_email, created_at FROM email_settings;

-- Ensure we have exactly one record
SELECT COUNT(*) as total_records FROM email_settings; 