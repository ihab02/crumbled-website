-- Create customer_addresses table
CREATE TABLE IF NOT EXISTS customer_addresses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  street_address TEXT NOT NULL,
  additional_info TEXT,
  city_id INT NOT NULL,
  zone_id INT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE RESTRICT,
  FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE RESTRICT,
  INDEX idx_customer_id (customer_id),
  INDEX idx_city_zone (city_id, zone_id)
);

-- Add some sample addresses for the existing user (ihab02@gmail.com)
INSERT INTO customer_addresses (customer_id, street_address, additional_info, city_id, zone_id, is_default) VALUES
(1, '123 Main Street', 'Apartment 4B', 1, 36, TRUE),
(1, '456 Oak Avenue', 'Building 2, Floor 3', 1, 37, FALSE);
