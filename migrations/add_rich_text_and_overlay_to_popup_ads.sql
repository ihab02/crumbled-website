-- Migration: Add Rich Text and Overlay Support to Popup Ads
-- Description: Adds fields for rich text content and overlay positioning on images/videos
-- Author: AI Assistant
-- Date: 2024-12-01
-- Version: 1.0

-- Add new fields for rich text and overlay functionality
ALTER TABLE `popup_ads` 
ADD COLUMN `content_overlay` BOOLEAN NOT NULL DEFAULT FALSE AFTER `content`,
ADD COLUMN `overlay_position` ENUM('top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right') DEFAULT 'center' AFTER `content_overlay`,
ADD COLUMN `overlay_effect` ENUM('none', 'fade', 'slide', 'bounce', 'glow', 'shadow') DEFAULT 'none' AFTER `overlay_position`,
ADD COLUMN `overlay_background` VARCHAR(20) DEFAULT 'rgba(0,0,0,0.7)' AFTER `overlay_effect`,
ADD COLUMN `overlay_padding` INT DEFAULT 20 AFTER `overlay_background`,
ADD COLUMN `overlay_border_radius` INT DEFAULT 10 AFTER `overlay_padding`;

-- Update existing popups to have content_overlay = false by default
UPDATE `popup_ads` SET `content_overlay` = FALSE WHERE `content_overlay` IS NULL; 