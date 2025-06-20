-- Drop existing tables in reverse order of dependencies
DROP TABLE IF EXISTS cart_item_flavors;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS cart_settings;
DROP TABLE IF EXISTS carts;

-- Create cart_settings table
CREATE TABLE IF NOT EXISTS cart_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cart_lifetime_days INT NOT NULL DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create carts table
CREATE TABLE IF NOT EXISTS carts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    session_id VARCHAR(255) NOT NULL,
    status ENUM('active', 'abandoned', 'converted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create cart_item_flavors table for pack products
CREATE TABLE IF NOT EXISTS cart_item_flavors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cart_item_id INT NOT NULL,
    flavor_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_item_id) REFERENCES cart_items(id) ON DELETE CASCADE,
    FOREIGN KEY (flavor_id) REFERENCES flavors(id) ON DELETE CASCADE
);

-- Insert default cart settings
INSERT INTO cart_settings (cart_lifetime_days) VALUES (2); 