-- Add missing flavor images to the database
-- Script: add-missing-flavor-images.sql

-- Add vanilla flavor image
INSERT INTO flavor_images (flavor_id, image_url, is_cover, display_order) VALUES 
(2, '/images/flavors/vanilla-1.jpg', 1, 0);

-- Add strawberry flavor image
INSERT INTO flavor_images (flavor_id, image_url, is_cover, display_order) VALUES 
(3, '/images/flavors/strawberry-1.jpg', 1, 0);

-- Add red velvet flavor image
INSERT INTO flavor_images (flavor_id, image_url, is_cover, display_order) VALUES 
(9, '/images/flavors/red-velvet-1.jpg', 1, 0); 