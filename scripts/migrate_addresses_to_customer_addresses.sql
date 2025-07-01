-- Migrate addresses for user ihab02@gmail.com from addresses to customer_addresses
INSERT INTO customer_addresses (customer_id, street_address, additional_info, city_id, zone_id, is_default, created_at, updated_at)
SELECT a.customer_id, a.street_address, a.additional_info, a.city_id, a.zone_id, a.is_default, a.created_at, a.updated_at
FROM addresses a
WHERE a.customer_id = (SELECT id FROM customers WHERE email = 'ihab02@gmail.com')
  AND NOT EXISTS (
    SELECT 1 FROM customer_addresses ca
    WHERE ca.customer_id = a.customer_id
      AND ca.street_address = a.street_address
      AND ca.zone_id = a.zone_id
  ); 