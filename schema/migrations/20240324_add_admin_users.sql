-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user if it doesn't exist
INSERT INTO admin_users (username, password, email)
SELECT 'admin', 'admin123', 'admin@crumbled.com'
WHERE NOT EXISTS (
    SELECT 1 FROM admin_users WHERE username = 'admin'
); 