-- Add cities and zones management tables
-- Migration: add_cities_zones_management.sql

-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create zones table
CREATE TABLE IF NOT EXISTS zones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    city_id INT NOT NULL,
    delivery_days INT NOT NULL DEFAULT 0, -- 0 = same day, 1 = next day, etc.
    time_slot_id INT,
    delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE,
    FOREIGN KEY (time_slot_id) REFERENCES delivery_time_slots(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_cities_active ON cities(is_active);
CREATE INDEX idx_cities_name ON cities(name);
CREATE INDEX idx_zones_active ON zones(is_active);
CREATE INDEX idx_zones_city_id ON zones(city_id);
CREATE INDEX idx_zones_time_slot_id ON zones(time_slot_id);
CREATE INDEX idx_zones_delivery_days ON zones(delivery_days);

-- Insert some default cities
INSERT INTO cities (name, is_active) VALUES
('Cairo', true),
('Giza', true),
('Alexandria', true),
('Sharm El Sheikh', true); 