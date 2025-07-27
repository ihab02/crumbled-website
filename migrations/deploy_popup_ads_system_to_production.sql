-- Migration: Deploy Popup Ads System to Production
-- Description: Complete popup advertisement management system with all features
-- Author: AI Assistant
-- Date: 2024-12-01
-- Version: 1.0
-- Production Safe: YES

-- =====================================================
-- POPUP ADS SYSTEM - PRODUCTION DEPLOYMENT
-- =====================================================

-- Create popup_ads table (if not exists)
CREATE TABLE IF NOT EXISTS `popup_ads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content_type` enum('image','text','html','video') NOT NULL DEFAULT 'image',
  `content` text NOT NULL,
  `content_overlay` BOOLEAN NOT NULL DEFAULT FALSE,
  `overlay_position` ENUM('top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right') DEFAULT 'center',
  `overlay_effect` ENUM('none', 'fade', 'slide', 'bounce', 'glow', 'shadow') DEFAULT 'none',
  `overlay_background` VARCHAR(20) DEFAULT 'rgba(0,0,0,0.7)',
  `overlay_padding` INT DEFAULT 20,
  `overlay_border_radius` INT DEFAULT 10,
  `image_url` varchar(500) DEFAULT NULL,
  `video_url` varchar(500) DEFAULT NULL,
  `background_color` varchar(7) DEFAULT '#ffffff',
  `text_color` varchar(7) DEFAULT '#000000',
  `button_text` varchar(100) DEFAULT 'Close',
  `button_color` varchar(7) DEFAULT '#007bff',
  `button_url` varchar(500) DEFAULT NULL,
  `show_button` BOOLEAN NOT NULL DEFAULT TRUE,
  `auto_close_seconds` INT NOT NULL DEFAULT 0,
  `width` int(11) DEFAULT 400,
  `height` int(11) DEFAULT 300,
  `position` enum('center','top-left','top-right','bottom-left','bottom-right') DEFAULT 'center',
  `animation` enum('fade','slide','zoom','bounce') DEFAULT 'fade',
  `delay_seconds` int(11) DEFAULT 3,
  `show_frequency` enum('once','daily','weekly','always') DEFAULT 'once',
  `target_pages` json DEFAULT NULL,
  `exclude_pages` json DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `priority` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_active_dates` (`is_active`, `start_date`, `end_date`),
  KEY `idx_priority` (`priority`),
  KEY `idx_content_type` (`content_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create popup_analytics table (if not exists)
CREATE TABLE IF NOT EXISTS `popup_analytics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `popup_id` int(11) NOT NULL,
  `session_id` varchar(255) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` enum('shown','clicked','closed','ignored') NOT NULL,
  `page_url` varchar(500) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_popup_id` (`popup_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_id` (`user_id`),
  FOREIGN KEY (`popup_id`) REFERENCES `popup_ads`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ADD MISSING COLUMNS (SAFE ALTERS)
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
  'ALTER TABLE `popup_ads` ADD COLUMN `overlay_background` VARCHAR(20) DEFAULT \'rgba(0,0,0,0.7)\' AFTER `overlay_effect`',
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
-- CREATE VIEWS (OR REPLACE)
-- =====================================================

-- Create view for active popups
CREATE OR REPLACE VIEW `active_popups` AS
SELECT 
  pa.*,
  CASE 
    WHEN pa.start_date IS NULL OR pa.start_date <= NOW() THEN 1
    ELSE 0
  END as is_started,
  CASE 
    WHEN pa.end_date IS NULL OR pa.end_date >= NOW() THEN 1
    ELSE 0
  END as is_not_expired
FROM popup_ads pa
WHERE pa.is_active = 1
  AND (pa.start_date IS NULL OR pa.start_date <= NOW())
  AND (pa.end_date IS NULL OR pa.end_date >= NOW())
ORDER BY pa.priority DESC, pa.created_at ASC;

-- Create view for popup analytics summary
CREATE OR REPLACE VIEW `popup_analytics_summary` AS
SELECT 
  pa.id,
  pa.title,
  pa.content_type,
  COUNT(CASE WHEN pan.action = 'shown' THEN 1 END) as impressions,
  COUNT(CASE WHEN pan.action = 'clicked' THEN 1 END) as clicks,
  COUNT(CASE WHEN pan.action = 'closed' THEN 1 END) as closes,
  COUNT(CASE WHEN pan.action = 'ignored' THEN 1 END) as ignores,
  CASE 
    WHEN COUNT(CASE WHEN pan.action = 'shown' THEN 1 END) > 0 
    THEN ROUND((COUNT(CASE WHEN pan.action = 'clicked' THEN 1 END) / COUNT(CASE WHEN pan.action = 'shown' THEN 1 END)) * 100, 2)
    ELSE 0
  END as click_through_rate,
  CASE 
    WHEN COUNT(CASE WHEN pan.action = 'shown' THEN 1 END) > 0 
    THEN ROUND((COUNT(CASE WHEN pan.action = 'closed' THEN 1 END) / COUNT(CASE WHEN pan.action = 'shown' THEN 1 END)) * 100, 2)
    ELSE 0
  END as close_rate,
  pa.created_at,
  pa.is_active
FROM popup_ads pa
LEFT JOIN popup_analytics pan ON pa.id = pan.popup_id
GROUP BY pa.id, pa.title, pa.content_type, pa.created_at, pa.is_active
ORDER BY pa.created_at DESC;

-- =====================================================
-- INSERT SAMPLE DATA (ONLY IF TABLE IS EMPTY)
-- =====================================================

-- Insert sample popup ads only if the table is empty
INSERT INTO `popup_ads` (
  `title`, 
  `content_type`, 
  `content`, 
  `content_overlay`,
  `overlay_position`,
  `overlay_effect`,
  `overlay_background`,
  `overlay_padding`,
  `overlay_border_radius`,
  `image_url`, 
  `background_color`, 
  `text_color`, 
  `button_text`, 
  `button_color`, 
  `button_url`, 
  `show_button`,
  `auto_close_seconds`,
  `width`, 
  `height`, 
  `position`, 
  `animation`, 
  `delay_seconds`, 
  `show_frequency`, 
  `target_pages`, 
  `start_date`, 
  `end_date`, 
  `is_active`, 
  `priority`
) 
SELECT * FROM (
  SELECT 
    'Welcome to Crumbled!' as title,
    'text' as content_type,
    '🍪 Welcome to Crumbled! Discover our delicious cookie collection and get 10% off your first order!' as content,
    FALSE as content_overlay,
    'center' as overlay_position,
    'none' as overlay_effect,
    'rgba(0,0,0,0.7)' as overlay_background,
    20 as overlay_padding,
    10 as overlay_border_radius,
    NULL as image_url,
    '#fdf6fb' as background_color,
    '#d946ef' as text_color,
    'Shop Now' as button_text,
    '#d946ef' as button_color,
    '/shop' as button_url,
    TRUE as show_button,
    0 as auto_close_seconds,
    450 as width,
    300 as height,
    'center' as position,
    'fade' as animation,
    2 as delay_seconds,
    'once' as show_frequency,
    '["/", "/flavors"]' as target_pages,
    NOW() as start_date,
    DATE_ADD(NOW(), INTERVAL 30 DAY) as end_date,
    1 as is_active,
    1 as priority
) AS sample_data
WHERE NOT EXISTS (SELECT 1 FROM `popup_ads` LIMIT 1);

-- =====================================================
-- VERIFICATION QUERIES
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

-- Verify sample data was inserted
SELECT COUNT(*) as total_popups FROM `popup_ads`;
SELECT COUNT(*) as total_analytics FROM `popup_analytics`;

-- Show active popups
SELECT id, title, content_type, is_active FROM `popup_ads` ORDER BY priority DESC;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

SELECT 'Popup Ads System deployed successfully to production!' as status; 