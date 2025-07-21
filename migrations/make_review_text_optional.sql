-- Migration: Make review_text optional in customer_reviews table
-- This allows users to submit reviews with just a rating, no text required
-- Date: 2025-01-03

-- Make review_text field nullable
ALTER TABLE customer_reviews 
MODIFY COLUMN review_text TEXT NULL;

-- Update existing empty reviews to have NULL instead of empty string
UPDATE customer_reviews 
SET review_text = NULL 
WHERE review_text = '' OR review_text IS NULL; 