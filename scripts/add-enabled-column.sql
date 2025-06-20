-- Add is_active column to flavors table
ALTER TABLE flavors ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Update existing records to be active by default
UPDATE flavors SET is_active = TRUE WHERE is_active IS NULL; 