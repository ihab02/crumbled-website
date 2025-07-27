-- Migration: Add show_button column to popup_ads table
-- Description: Adds a show_button boolean column to control button visibility
-- Author: AI Assistant
-- Date: 2024-12-01
-- Version: 1.1

-- Add show_button column to popup_ads table
ALTER TABLE `popup_ads` 
ADD COLUMN `show_button` BOOLEAN NOT NULL DEFAULT TRUE 
AFTER `button_url`;

-- Update existing records to have show_button = TRUE by default
UPDATE `popup_ads` SET `show_button` = TRUE WHERE `show_button` IS NULL; 