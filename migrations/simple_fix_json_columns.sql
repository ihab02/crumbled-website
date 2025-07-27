-- Simple Fix for Popup Ads JSON Columns
-- Change target_pages and exclude_pages from JSON to TEXT

-- Change target_pages from JSON to TEXT
ALTER TABLE `popup_ads` 
MODIFY COLUMN `target_pages` TEXT DEFAULT NULL;

-- Change exclude_pages from JSON to TEXT  
ALTER TABLE `popup_ads` 
MODIFY COLUMN `exclude_pages` TEXT DEFAULT NULL;

-- Verify the changes
DESCRIBE popup_ads; 