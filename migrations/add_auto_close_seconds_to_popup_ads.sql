-- Migration: Add auto_close_seconds column to popup_ads table
-- Description: Adds an auto_close_seconds integer column to control auto-close timer
-- Author: AI Assistant
-- Date: 2024-12-01
-- Version: 1.2

-- Add auto_close_seconds column to popup_ads table
ALTER TABLE `popup_ads` 
ADD COLUMN `auto_close_seconds` INT NOT NULL DEFAULT 0 
AFTER `show_button`;

-- Update existing records to have auto_close_seconds = 0 by default (no auto-close)
UPDATE `popup_ads` SET `auto_close_seconds` = 0 WHERE `auto_close_seconds` IS NULL; 