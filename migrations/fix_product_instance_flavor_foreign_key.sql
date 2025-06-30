-- Fix product_instance_flavor foreign key constraint
-- Change from referencing cookie_flavor to flavors table

-- Drop the existing foreign key constraint
ALTER TABLE `product_instance_flavor` 
DROP FOREIGN KEY `product_instance_flavor_ibfk_2`;

-- Add the new foreign key constraint referencing flavors table
ALTER TABLE `product_instance_flavor` 
ADD CONSTRAINT `product_instance_flavor_ibfk_2` 
FOREIGN KEY (`flavor_id`) REFERENCES `flavors` (`id`);

-- Also need to update the admin orders API to use the correct table
-- The admin orders API should join with flavors table instead of cookie_flavor 