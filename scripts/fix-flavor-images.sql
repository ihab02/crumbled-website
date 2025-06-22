-- Fix flavor image URLs to match actual file names
-- Script: fix-flavor-images.sql

-- Update chocolate flavor images
UPDATE flavor_images SET image_url = '/images/flavors/chocolate-1.jpg' WHERE flavor_id = 1 AND is_cover = 1;
INSERT INTO flavor_images (flavor_id, image_url, is_cover, display_order) VALUES 
(1, '/images/flavors/chocolate-2.jpg', 0, 1),
(1, '/images/flavors/chocolate-3.jpg', 0, 2);

-- Update vanilla flavor images (assuming vanilla-1.jpg exists)
UPDATE flavor_images SET image_url = '/images/flavors/vanilla-1.jpg' WHERE flavor_id = 2 AND is_cover = 1;

-- Update strawberry flavor images (assuming strawberry-1.jpg exists)
UPDATE flavor_images SET image_url = '/images/flavors/strawberry-1.jpg' WHERE flavor_id = 3 AND is_cover = 1;

-- Update oreo flavor images
UPDATE flavor_images SET image_url = '/images/flavors/oreo-1.jpg' WHERE flavor_id = 4 AND is_cover = 1;
INSERT INTO flavor_images (flavor_id, image_url, is_cover, display_order) VALUES 
(4, '/images/flavors/oreo-2.jpg', 0, 1);

-- Update caramel flavor images
UPDATE flavor_images SET image_url = '/images/flavors/caramel-1.jpg' WHERE flavor_id = 5 AND is_cover = 1;
INSERT INTO flavor_images (flavor_id, image_url, is_cover, display_order) VALUES 
(5, '/images/flavors/caramel-2.jpg', 0, 1),
(5, '/images/flavors/caramel-3.jpg', 0, 2);

-- Update mint chocolate flavor images
UPDATE flavor_images SET image_url = '/images/flavors/mint-chocolate-1.jpg' WHERE flavor_id = 6 AND is_cover = 1;
INSERT INTO flavor_images (flavor_id, image_url, is_cover, display_order) VALUES 
(6, '/images/flavors/mint-chocolate-2.jpg', 0, 1),
(6, '/images/flavors/mint-chocolate-3.jpg', 0, 2);

-- Update cookies cream flavor images
UPDATE flavor_images SET image_url = '/images/flavors/cookies-cream-1.jpg' WHERE flavor_id = 7 AND is_cover = 1;
INSERT INTO flavor_images (flavor_id, image_url, is_cover, display_order) VALUES 
(7, '/images/flavors/cookies-cream-2.jpg', 0, 1),
(7, '/images/flavors/cookies-cream-3.jpg', 0, 2);

-- Update blueberry flavor images
UPDATE flavor_images SET image_url = '/images/flavors/blueberry-1.jpg' WHERE flavor_id = 8 AND is_cover = 1;
INSERT INTO flavor_images (flavor_id, image_url, is_cover, display_order) VALUES 
(8, '/images/flavors/blueberry-2.jpg', 0, 1),
(8, '/images/flavors/blueberry-3.jpg', 0, 2);

-- Update red velvet flavor images (assuming red-velvet-1.jpg exists)
UPDATE flavor_images SET image_url = '/images/flavors/red-velvet-1.jpg' WHERE flavor_id = 9 AND is_cover = 1;

-- Update lemon flavor images
UPDATE flavor_images SET image_url = '/images/flavors/lemon-1.jpg' WHERE flavor_id = 10 AND is_cover = 1;
INSERT INTO flavor_images (flavor_id, image_url, is_cover, display_order) VALUES 
(10, '/images/flavors/lemon-2.jpg', 0, 1),
(10, '/images/flavors/lemon-3.jpg', 0, 2); 