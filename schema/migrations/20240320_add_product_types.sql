-- Create product_types table
CREATE TABLE IF NOT EXISTS product_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_name (name)
);

-- Insert initial product types
INSERT INTO product_types (name, description, display_order) VALUES
    ('Large Dessert', 'Large-sized desserts and pastries', 1),
    ('Mini Dessert', 'Small-sized desserts and pastries', 2),
    ('Drinks', 'Beverages and drinks', 3),
    ('Cakes', 'Full-sized cakes and pastries', 4),
    ('Meringue Cookies', 'Specialty meringue cookies', 5); 