-- Check user addresses
SELECT 
    c.id as customer_id,
    c.email,
    c.first_name,
    c.last_name,
    ca.id as address_id,
    ca.street_address,
    ca.city_id,
    ca.zone_id,
    ca.is_default
FROM customers c
LEFT JOIN customer_addresses ca ON c.id = ca.customer_id
WHERE c.email = 'ihab02@gmail.com';

-- Check if addresses exist in both tables
SELECT 'addresses' as table_name, COUNT(*) as count FROM addresses WHERE customer_id = (SELECT id FROM customers WHERE email = 'ihab02@gmail.com')
UNION ALL
SELECT 'customer_addresses' as table_name, COUNT(*) as count FROM customer_addresses WHERE customer_id = (SELECT id FROM customers WHERE email = 'ihab02@gmail.com'); 