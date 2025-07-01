-- Test script to verify delivery rules for email service
-- Check zones with delivery rules
SELECT 
    z.id as zone_id,
    z.name as zone_name,
    c.name as city_name,
    z.delivery_days,
    z.delivery_fee,
    z.time_slot_id,
    dts.name as time_slot_name,
    dts.from_hour,
    dts.to_hour
FROM zones z
JOIN cities c ON z.city_id = c.id
LEFT JOIN delivery_time_slots dts ON z.time_slot_id = dts.id
WHERE z.delivery_days IS NOT NULL
ORDER BY z.id;

-- Check customer addresses for testing
SELECT 
    ca.id,
    ca.customer_id,
    ca.street_address,
    ca.additional_info,
    c.name as city_name,
    z.name as zone_name,
    z.delivery_days,
    z.delivery_fee,
    ca.is_default
FROM customer_addresses ca
JOIN cities c ON ca.city_id = c.id
JOIN zones z ON ca.zone_id = z.id
WHERE ca.customer_id = (SELECT id FROM customers WHERE email = 'ihab02@gmail.com'); 