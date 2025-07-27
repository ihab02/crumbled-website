-- Migration: Add Overlay Columns to Production Popup Ads
-- Description: Adds missing overlay-related columns to existing popup_ads table
-- Author: AI Assistant
-- Date: 2024-12-01
-- Version: 1.1
-- Production Safe: YES

-- =====================================================
-- ADD MISSING OVERLAY COLUMNS TO PRODUCTION
-- =====================================================

-- Add content_overlay column if not exists
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'popup_ads' 
   AND COLUMN_NAME = 'content_overlay') = 0,
  'ALTER TABLE `popup_ads` ADD COLUMN `content_overlay` BOOLEAN NOT NULL DEFAULT FALSE AFTER `content`',
  'SELECT "content_overlay column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add overlay_position column if not exists
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'popup_ads' 
   AND COLUMN_NAME = 'overlay_position') = 0,
  'ALTER TABLE `popup_ads` ADD COLUMN `overlay_position` ENUM(\'top-left\', \'top-center\', \'top-right\', \'center-left\', \'center\', \'center-right\', \'bottom-left\', \'bottom-center\', \'bottom-right\') DEFAULT \'center\' AFTER `content_overlay`',
  'SELECT "overlay_position column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add overlay_effect column if not exists
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'popup_ads' 
   AND COLUMN_NAME = 'overlay_effect') = 0,
  'ALTER TABLE `popup_ads` ADD COLUMN `overlay_effect` ENUM(\'none\', \'fade\', \'slide\', \'bounce\', \'glow\', \'shadow\') DEFAULT \'none\' AFTER `overlay_position`',
  'SELECT "overlay_effect column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add overlay_background column if not exists
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'popup_ads' 
   AND COLUMN_NAME = 'overlay_background') = 0,
  'ALTER TABLE `popup_ads` ADD COLUMN `overlay_background` VARCHAR(100) DEFAULT \'rgba(0,0,0,0.7)\' AFTER `overlay_effect`',
  'SELECT "overlay_background column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add overlay_padding column if not exists
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'popup_ads' 
   AND COLUMN_NAME = 'overlay_padding') = 0,
  'ALTER TABLE `popup_ads` ADD COLUMN `overlay_padding` INT DEFAULT 20 AFTER `overlay_background`',
  'SELECT "overlay_padding column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add overlay_border_radius column if not exists
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'popup_ads' 
   AND COLUMN_NAME = 'overlay_border_radius') = 0,
  'ALTER TABLE `popup_ads` ADD COLUMN `overlay_border_radius` INT DEFAULT 10 AFTER `overlay_padding`',
  'SELECT "overlay_border_radius column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add show_button column if not exists
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'popup_ads' 
   AND COLUMN_NAME = 'show_button') = 0,
  'ALTER TABLE `popup_ads` ADD COLUMN `show_button` BOOLEAN NOT NULL DEFAULT TRUE AFTER `button_url`',
  'SELECT "show_button column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add auto_close_seconds column if not exists
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'popup_ads' 
   AND COLUMN_NAME = 'auto_close_seconds') = 0,
  'ALTER TABLE `popup_ads` ADD COLUMN `auto_close_seconds` INT NOT NULL DEFAULT 0 AFTER `show_button`',
  'SELECT "auto_close_seconds column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- UPDATE EXISTING RECORDS WITH DEFAULT VALUES
-- =====================================================

-- Update existing popups to have proper default values
UPDATE `popup_ads` SET `content_overlay` = FALSE WHERE `content_overlay` IS NULL;
UPDATE `popup_ads` SET `overlay_position` = 'center' WHERE `overlay_position` IS NULL;
UPDATE `popup_ads` SET `overlay_effect` = 'none' WHERE `overlay_effect` IS NULL;
UPDATE `popup_ads` SET `overlay_background` = 'rgba(0,0,0,0.7)' WHERE `overlay_background` IS NULL;
UPDATE `popup_ads` SET `overlay_padding` = 20 WHERE `overlay_padding` IS NULL;
UPDATE `popup_ads` SET `overlay_border_radius` = 10 WHERE `overlay_border_radius` IS NULL;
UPDATE `popup_ads` SET `show_button` = TRUE WHERE `show_button` IS NULL;
UPDATE `popup_ads` SET `auto_close_seconds` = 0 WHERE `auto_close_seconds` IS NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify the table structure
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'popup_ads' 
ORDER BY ORDINAL_POSITION;

-- Show total columns count
SELECT COUNT(*) as total_columns FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'popup_ads';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

SELECT 'Overlay columns added successfully to production popup_ads table!' as status; 