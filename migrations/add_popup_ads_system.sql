-- Migration: Add Popup Ads System
-- Description: Creates tables for popup advertisement management
-- Author: AI Assistant
-- Date: 2024-12-01
-- Version: 1.0

-- Create popup_ads table
CREATE TABLE IF NOT EXISTS `popup_ads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content_type` enum('image','text','html','video') NOT NULL DEFAULT 'image',
  `content` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `video_url` varchar(500) DEFAULT NULL,
  `background_color` varchar(7) DEFAULT '#ffffff',
  `text_color` varchar(7) DEFAULT '#000000',
  `button_text` varchar(100) DEFAULT 'Close',
  `button_color` varchar(7) DEFAULT '#007bff',
  `button_url` varchar(500) DEFAULT NULL,
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

-- Create popup_analytics table
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

-- Insert sample popup ads
INSERT INTO `popup_ads` (
  `title`, 
  `content_type`, 
  `content`, 
  `image_url`, 
  `background_color`, 
  `text_color`, 
  `button_text`, 
  `button_color`, 
  `button_url`, 
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
) VALUES 
(
  'Welcome to Crumbled!',
  'text',
  '🍪 Welcome to Crumbled! Discover our delicious cookie collection and get 10% off your first order!',
  NULL,
  '#fdf6fb',
  '#d946ef',
  'Shop Now',
  '#d946ef',
  '/shop',
  450,
  300,
  'center',
  'fade',
  2,
  'once',
  '["/", "/flavors"]',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 30 DAY),
  1,
  1
),
(
  'Special Offer - Limited Time!',
  'image',
  '🎉 Get 20% off on all cookie packs! Limited time offer, don\'t miss out!',
  '/images/popup/special-offer.jpg',
  '#fff7ed',
  '#ea580c',
  'Claim Offer',
  '#ea580c',
  '/shop?promo=SPECIAL20',
  500,
  350,
  'center',
  'slide',
  5,
  'daily',
  '["/shop", "/flavors"]',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 7 DAY),
  1,
  2
),
(
  'New Flavors Available!',
  'html',
  '<div style="text-align: center;"><h3>🍪 New Cookie Flavors!</h3><p>Try our latest chocolate chip and vanilla bean cookies. Freshly baked daily!</p><img src="/images/popup/new-flavors.jpg" style="max-width: 200px; border-radius: 8px;" /></div>',
  NULL,
  '#f0f9ff',
  '#0369a1',
  'Explore Flavors',
  '#0369a1',
  '/flavors',
  480,
  320,
  'bottom-right',
  'zoom',
  3,
  'weekly',
  '["/", "/shop"]',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 60 DAY),
  1,
  3
);

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