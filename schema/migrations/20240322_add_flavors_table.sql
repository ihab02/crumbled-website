-- Create flavors table
CREATE TABLE IF NOT EXISTS flavors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  mini_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  medium_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  large_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  category VARCHAR(50),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create flavor_images table
CREATE TABLE IF NOT EXISTS flavor_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  flavor_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (flavor_id) REFERENCES flavors(id) ON DELETE CASCADE
);

-- Clear existing data
DELETE FROM flavor_images;
DELETE FROM flavors;
ALTER TABLE flavors AUTO_INCREMENT = 1;

-- Insert sample flavors and store their IDs
INSERT INTO flavors (name, slug, description, mini_price, medium_price, large_price, category, is_active) VALUES
('Chocolate', 'chocolate', 'Rich and creamy chocolate flavor', 25.00, 35.00, 45.00, 'Chocolate', true);

SET @chocolate_id = LAST_INSERT_ID();

INSERT INTO flavors (name, slug, description, mini_price, medium_price, large_price, category, is_active) VALUES
('Vanilla', 'vanilla', 'Classic smooth vanilla flavor', 25.00, 35.00, 45.00, 'Classic', true);

SET @vanilla_id = LAST_INSERT_ID();

INSERT INTO flavors (name, slug, description, mini_price, medium_price, large_price, category, is_active) VALUES
('Strawberry', 'strawberry', 'Sweet and fruity strawberry flavor', 25.00, 35.00, 45.00, 'Fruit', true);

SET @strawberry_id = LAST_INSERT_ID();

INSERT INTO flavors (name, slug, description, mini_price, medium_price, large_price, category, is_active) VALUES
('Oreo', 'oreo', 'Delicious cookies and cream flavor', 30.00, 40.00, 50.00, 'Premium', true);

SET @oreo_id = LAST_INSERT_ID();

INSERT INTO flavors (name, slug, description, mini_price, medium_price, large_price, category, is_active) VALUES
('Caramel', 'caramel', 'Sweet and buttery caramel flavor', 28.00, 38.00, 48.00, 'Classic', true);

SET @caramel_id = LAST_INSERT_ID();

INSERT INTO flavors (name, slug, description, mini_price, medium_price, large_price, category, is_active) VALUES
('Mint Chocolate', 'mint-chocolate', 'Refreshing mint with chocolate chips', 30.00, 40.00, 50.00, 'Premium', true);

SET @mint_chocolate_id = LAST_INSERT_ID();

INSERT INTO flavors (name, slug, description, mini_price, medium_price, large_price, category, is_active) VALUES
('Red Velvet', 'red-velvet', 'Classic red velvet with cream cheese', 32.00, 42.00, 52.00, 'Premium', true);

SET @red_velvet_id = LAST_INSERT_ID();

INSERT INTO flavors (name, slug, description, mini_price, medium_price, large_price, category, is_active) VALUES
('Lemon', 'lemon', 'Tangy and refreshing lemon flavor', 25.00, 35.00, 45.00, 'Fruit', true);

SET @lemon_id = LAST_INSERT_ID();

INSERT INTO flavors (name, slug, description, mini_price, medium_price, large_price, category, is_active) VALUES
('Blueberry', 'blueberry', 'Sweet and fruity blueberry flavor', 28.00, 38.00, 48.00, 'Fruit', true);

SET @blueberry_id = LAST_INSERT_ID();

INSERT INTO flavors (name, slug, description, mini_price, medium_price, large_price, category, is_active) VALUES
('Cookies & Cream', 'cookies-cream', 'Classic cookies and cream flavor', 30.00, 40.00, 50.00, 'Classic', true);

SET @cookies_cream_id = LAST_INSERT_ID();

-- Insert sample images for the flavors using the stored IDs
INSERT INTO flavor_images (flavor_id, image_url, is_cover) VALUES
(@chocolate_id, '/images/flavors/chocolate.jpg', true),
(@vanilla_id, '/images/flavors/vanilla.jpg', true),
(@strawberry_id, '/images/flavors/strawberry.jpg', true),
(@oreo_id, '/images/flavors/oreo.jpg', true),
(@caramel_id, '/images/flavors/caramel.jpg', true),
(@mint_chocolate_id, '/images/flavors/mint-chocolate.jpg', true),
(@red_velvet_id, '/images/flavors/red-velvet.jpg', true),
(@lemon_id, '/images/flavors/lemon.jpg', true),
(@blueberry_id, '/images/flavors/blueberry.jpg', true),
(@cookies_cream_id, '/images/flavors/cookies-cream.jpg', true); 