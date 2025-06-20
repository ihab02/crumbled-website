-- Flavor Images Table
CREATE TABLE IF NOT EXISTS flavor_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  flavor_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  is_cover BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (flavor_id) REFERENCES flavors(id) ON DELETE CASCADE,
  INDEX idx_flavor_id (flavor_id),
  INDEX idx_is_cover (is_cover)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample images for flavors
INSERT INTO flavor_images (flavor_id, image_url, is_cover, display_order) VALUES
-- Chocolate
(1, '/images/flavors/chocolate-1.jpg', true, 1),
(1, '/images/flavors/chocolate-2.jpg', false, 2),
(1, '/images/flavors/chocolate-3.jpg', false, 3),

-- Vanilla
(2, '/images/flavors/vanilla-1.jpg', true, 1),
(2, '/images/flavors/vanilla-2.jpg', false, 2),
(2, '/images/flavors/vanilla-3.jpg', false, 3),

-- Strawberry
(3, '/images/flavors/strawberry-1.jpg', true, 1),
(3, '/images/flavors/strawberry-2.jpg', false, 2),
(3, '/images/flavors/strawberry-3.jpg', false, 3),

-- Oreo
(4, '/images/flavors/oreo-1.jpg', true, 1),
(4, '/images/flavors/oreo-2.jpg', false, 2),
(4, '/images/flavors/oreo-3.jpg', false, 3),

-- Caramel
(5, '/images/flavors/caramel-1.jpg', true, 1),
(5, '/images/flavors/caramel-2.jpg', false, 2),
(5, '/images/flavors/caramel-3.jpg', false, 3),

-- Mint Chocolate
(6, '/images/flavors/mint-chocolate-1.jpg', true, 1),
(6, '/images/flavors/mint-chocolate-2.jpg', false, 2),
(6, '/images/flavors/mint-chocolate-3.jpg', false, 3),

-- Red Velvet
(7, '/images/flavors/red-velvet-1.jpg', true, 1),
(7, '/images/flavors/red-velvet-2.jpg', false, 2),
(7, '/images/flavors/red-velvet-3.jpg', false, 3),

-- Lemon
(8, '/images/flavors/lemon-1.jpg', true, 1),
(8, '/images/flavors/lemon-2.jpg', false, 2),
(8, '/images/flavors/lemon-3.jpg', false, 3),

-- Blueberry
(9, '/images/flavors/blueberry-1.jpg', true, 1),
(9, '/images/flavors/blueberry-2.jpg', false, 2),
(9, '/images/flavors/blueberry-3.jpg', false, 3),

-- Cookies & Cream
(10, '/images/flavors/cookies-cream-1.jpg', true, 1),
(10, '/images/flavors/cookies-cream-2.jpg', false, 2),
(10, '/images/flavors/cookies-cream-3.jpg', false, 3); 