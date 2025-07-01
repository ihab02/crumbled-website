-- Update zones with delivery days and time slots for testing delivery date calculation

-- Update zone 36 (Shorouk) with 2 delivery days and time slot
UPDATE zones 
SET delivery_days = 2, time_slot_id = 1 
WHERE id = 36;

-- Update zone 37 (New Cairo) with 1 delivery day and time slot  
UPDATE zones 
SET delivery_days = 1, time_slot_id = 1 
WHERE id = 37;

-- Update zone 38 (Madinaty) with 3 delivery days (already has time slot)
UPDATE zones 
SET delivery_days = 3 
WHERE id = 38;

-- Update some other zones for testing
UPDATE zones 
SET delivery_days = 1, time_slot_id = 1 
WHERE id = 16; -- Dokki

UPDATE zones 
SET delivery_days = 2, time_slot_id = 1 
WHERE id = 17; -- Agouza

-- Display updated zones
SELECT 
    z.id,
    z.name,
    c.name as city_name,
    z.delivery_days,
    z.delivery_fee,
    dts.name as time_slot_name,
    dts.available_days,
    z.is_active
FROM zones z
LEFT JOIN cities c ON z.city_id = c.id
LEFT JOIN delivery_time_slots dts ON z.time_slot_id = dts.id
WHERE z.delivery_days > 0 OR z.time_slot_id IS NOT NULL
ORDER BY z.id; 