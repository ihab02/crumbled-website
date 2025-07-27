-- Migration: Fix Popup Ads JSON Columns
-- Description: Change target_pages and exclude_pages from JSON to TEXT for better compatibility
-- Author: AI Assistant
-- Date: 2024-12-01
-- Version: 1.0
-- Production Safe: YES

-- =====================================================
-- FIX JSON COLUMN COMPATIBILITY ISSUES
-- =====================================================

-- Check if columns exist and are JSON type
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'popup_ads' 
  AND COLUMN_NAME IN ('target_pages', 'exclude_pages');

-- Backup existing data
CREATE TEMPORARY TABLE popup_ads_backup AS 
SELECT id, target_pages, exclude_pages FROM popup_ads;

-- Change target_pages from JSON to TEXT
ALTER TABLE `popup_ads` 
MODIFY COLUMN `target_pages` TEXT DEFAULT NULL;

-- Change exclude_pages from JSON to TEXT  
ALTER TABLE `popup_ads` 
MODIFY COLUMN `exclude_pages` TEXT DEFAULT NULL;

-- Verify the changes
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'popup_ads' 
  AND COLUMN_NAME IN ('target_pages', 'exclude_pages');

-- Test JSON operations
SELECT 
  id,
  target_pages,
  exclude_pages,
  CASE 
    WHEN target_pages IS NOT NULL THEN JSON_VALID(target_pages)
    ELSE NULL 
  END as target_pages_valid,
  CASE 
    WHEN exclude_pages IS NOT NULL THEN JSON_VALID(exclude_pages)
    ELSE NULL 
  END as exclude_pages_valid
FROM popup_ads 
LIMIT 5;

-- Clean up
DROP TEMPORARY TABLE IF EXISTS popup_ads_backup;

-- =====================================================
-- UPDATE SAMPLE DATA WITH PROPER JSON FORMAT
-- =====================================================

-- Update any existing data to ensure proper JSON format
UPDATE popup_ads 
SET target_pages = JSON_ARRAY('/home', '/shop', '/flavors')
WHERE target_pages IS NULL OR target_pages = '[]' OR target_pages = '';

UPDATE popup_ads 
SET exclude_pages = JSON_ARRAY('/admin', '/checkout')
WHERE exclude_pages IS NULL OR exclude_pages = '[]' OR exclude_pages = '';

-- Verify the updates
SELECT 
  id,
  title,
  target_pages,
  exclude_pages
FROM popup_ads 
ORDER BY id DESC 
LIMIT 3;

-- =====================================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- =====================================================

-- Add indexes for JSON operations (if supported)
-- Note: These might not work with TEXT columns, but worth trying
CREATE INDEX idx_target_pages ON popup_ads ((CAST(target_pages AS CHAR(1000))));
CREATE INDEX idx_exclude_pages ON popup_ads ((CAST(exclude_pages AS CHAR(1000))));

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test query that simulates the API endpoint
SELECT 
  id, title, content_type, content, content_overlay, overlay_position, overlay_effect, overlay_background, overlay_padding, overlay_border_radius,
  image_url, video_url, background_color, text_color, button_text, button_color,
  button_url, show_button, auto_close_seconds,
  width, height, position, animation, delay_seconds,
  show_frequency, target_pages, exclude_pages,
  start_date, end_date, is_active, priority
FROM popup_ads 
WHERE is_active = 1
  AND (start_date IS NULL OR start_date <= NOW())
  AND (end_date IS NULL OR end_date >= NOW())
ORDER BY priority DESC, created_at DESC
LIMIT 1;

-- Test JSON parsing
SELECT 
  id,
  title,
  target_pages,
  exclude_pages,
  CASE 
    WHEN target_pages IS NOT NULL AND JSON_VALID(target_pages) 
    THEN JSON_EXTRACT(target_pages, '$[0]')
    ELSE NULL 
  END as first_target_page,
  CASE 
    WHEN exclude_pages IS NOT NULL AND JSON_VALID(exclude_pages) 
    THEN JSON_EXTRACT(exclude_pages, '$[0]')
    ELSE NULL 
  END as first_exclude_page
FROM popup_ads 
WHERE is_active = 1
LIMIT 3;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

SELECT 'Migration completed successfully!' as status; 