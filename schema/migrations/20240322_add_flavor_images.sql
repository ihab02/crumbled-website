-- Create flavor_images table
CREATE TABLE IF NOT EXISTS flavor_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  flavor_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  is_cover BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (flavor_id) REFERENCES flavors(id) ON DELETE CASCADE
);

-- Insert sample images for existing flavors
INSERT INTO flavor_images (flavor_id, image_url, is_cover, display_order) VALUES
(12, '/images/flavors/chocolate.jpg', true, 0),
(13, '/images/flavors/vanilla.jpg', true, 0),
(14, '/images/flavors/strawberry.jpg', true, 0); 