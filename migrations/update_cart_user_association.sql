-- Migration: Update existing carts with user association and expiration dates
-- This script will update existing carts that have null user_id and expires_at values

-- First, let's update the cart_settings table to ensure we have proper settings
INSERT INTO cart_settings (cart_lifetime_days, debug_mode) 
VALUES (7, FALSE) 
ON DUPLICATE KEY UPDATE cart_lifetime_days = 7;

-- Update existing carts with expiration dates (7 days from creation)
UPDATE carts 
SET expires_at = DATE_ADD(created_at, INTERVAL 7 DAY)
WHERE expires_at IS NULL AND status = 'active';

-- For carts that have been inactive for more than 7 days, mark them as abandoned
UPDATE carts 
SET status = 'abandoned'
WHERE status = 'active' 
AND expires_at IS NOT NULL 
AND expires_at < NOW();

-- Log the migration results
SELECT 
    'Migration completed' as status,
    COUNT(*) as total_carts,
    SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) as user_carts,
    SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) as guest_carts,
    SUM(CASE WHEN expires_at IS NOT NULL THEN 1 ELSE 0 END) as carts_with_expiration
FROM carts 
WHERE status = 'active';
