-- Cleanup duplicate addresses in customer_addresses table
-- This script will remove duplicate addresses while keeping the first occurrence

-- First, let's see what duplicates exist
SELECT 
    customer_id,
    street_address,
    additional_info,
    city_id,
    zone_id,
    COUNT(*) as duplicate_count
FROM customer_addresses 
GROUP BY customer_id, street_address, additional_info, city_id, zone_id
HAVING COUNT(*) > 1
ORDER BY customer_id, street_address;

-- Create a temporary table to identify duplicates
CREATE TEMPORARY TABLE duplicate_addresses AS
SELECT 
    id,
    customer_id,
    street_address,
    additional_info,
    city_id,
    zone_id,
    ROW_NUMBER() OVER (
        PARTITION BY customer_id, street_address, additional_info, city_id, zone_id 
        ORDER BY id
    ) as rn
FROM customer_addresses;

-- Delete duplicate addresses (keep the first one, delete the rest)
DELETE ca FROM customer_addresses ca
INNER JOIN duplicate_addresses da ON ca.id = da.id
WHERE da.rn > 1;

-- Drop the temporary table
DROP TEMPORARY TABLE duplicate_addresses;

-- Verify the cleanup
SELECT 
    customer_id,
    street_address,
    additional_info,
    city_id,
    zone_id,
    COUNT(*) as count_after_cleanup
FROM customer_addresses 
GROUP BY customer_id, street_address, additional_info, city_id, zone_id
HAVING COUNT(*) > 1
ORDER BY customer_id, street_address;

-- Show final result for the specific customer
SELECT 
    id,
    customer_id,
    street_address,
    additional_info,
    city_id,
    zone_id,
    is_default,
    created_at
FROM customer_addresses 
WHERE customer_id = (SELECT id FROM customers WHERE email = 'ihab02@gmail.com')
ORDER BY id; 