-- Crumbled Website Database Schema
-- Version: 1.0.2
-- Description: Current database schema with multiple images support
-- Date: 2024-03-19

-- Drop tables if they exist
DROP TABLE IF EXISTS flavor_images;
DROP TABLE IF EXISTS flavors;
DROP TABLE IF EXISTS admin_users;

-- Create admin_users table
CREATE TABLE admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (username, password_hash, email) VALUES
('admin', 'admin123', 'admin@crumbled.com');

-- Create flavors table
CREATE TABLE flavors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    mini_price DECIMAL(10,2) NOT NULL,
    medium_price DECIMAL(10,2) NOT NULL,
    large_price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255),
    has_multiple_images BOOLEAN DEFAULT false,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create flavor_images table
CREATE TABLE flavor_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    flavor_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_cover BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (flavor_id) REFERENCES flavors(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_flavors_enabled ON flavors(is_enabled);
CREATE INDEX idx_flavors_multiple_images ON flavors(has_multiple_images);
CREATE INDEX idx_flavor_images_order ON flavor_images(flavor_id, display_order); 