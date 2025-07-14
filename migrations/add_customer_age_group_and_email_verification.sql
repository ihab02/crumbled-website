-- Migration: Add Customer Age Group and Email Verification
-- Date: 2025-01-03
-- Description: Adds age group field and email verification functionality

-- Add age group field to customers table
ALTER TABLE customers 
ADD COLUMN age_group ENUM('13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+') NULL AFTER phone,
ADD COLUMN birth_date DATE NULL AFTER age_group;

-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP NULL,
  INDEX idx_token (token),
  INDEX idx_customer_id (customer_id),
  INDEX idx_expires_at (expires_at),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP NULL,
  INDEX idx_token (token),
  INDEX idx_customer_id (customer_id),
  INDEX idx_expires_at (expires_at),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add indexes for better performance
CREATE INDEX idx_customers_age_group ON customers(age_group);
CREATE INDEX idx_customers_email_verified ON customers(email_verified);

-- Add comments to explain the purpose
ALTER TABLE customers 
MODIFY COLUMN age_group ENUM('13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+') NULL COMMENT 'Customer age group for marketing and analytics',
MODIFY COLUMN birth_date DATE NULL COMMENT 'Customer birth date for age calculation',
MODIFY COLUMN email_verified BOOLEAN DEFAULT FALSE COMMENT 'Whether customer email has been verified'; 