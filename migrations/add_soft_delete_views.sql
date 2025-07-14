-- Migration: Add Soft Delete Views System
-- This migration implements a comprehensive soft delete system using database views
-- Date: 2025-01-03

-- Phase 1: Add soft delete columns to core tables
ALTER TABLE products 
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN deleted_by INT NULL,
ADD COLUMN deletion_reason VARCHAR(255) NULL;

ALTER TABLE flavors 
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN deleted_by INT NULL,
ADD COLUMN deletion_reason VARCHAR(255) NULL;

ALTER TABLE product_types 
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN deleted_by INT NULL,
ADD COLUMN deletion_reason VARCHAR(255) NULL;

-- Add foreign key constraints for deleted_by
ALTER TABLE products 
ADD CONSTRAINT fk_products_deleted_by 
FOREIGN KEY (deleted_by) REFERENCES admin_users(id) ON DELETE SET NULL;

ALTER TABLE flavors 
ADD CONSTRAINT fk_flavors_deleted_by 
FOREIGN KEY (deleted_by) REFERENCES admin_users(id) ON DELETE SET NULL;

ALTER TABLE product_types 
ADD CONSTRAINT fk_product_types_deleted_by 
FOREIGN KEY (deleted_by) REFERENCES admin_users(id) ON DELETE SET NULL;

-- Phase 2: Create database views for soft delete management

-- Drop existing views if they exist
DROP VIEW IF EXISTS active_products;
DROP VIEW IF EXISTS all_products;
DROP VIEW IF EXISTS active_flavors;
DROP VIEW IF EXISTS all_flavors;
DROP VIEW IF EXISTS active_product_types;
DROP VIEW IF EXISTS all_product_types;
DROP VIEW IF EXISTS active_product_instances;
DROP VIEW IF EXISTS all_product_instances;

-- Create active products view (default for customer-facing pages)
CREATE VIEW active_products AS
SELECT 
    p.*,
    pt.name as product_type_name,
    pt.is_active as product_type_active
FROM products p
LEFT JOIN product_types pt ON p.product_type_id = pt.id
WHERE p.deleted_at IS NULL 
    AND p.is_active = true
    AND (pt.deleted_at IS NULL OR pt.deleted_at IS NULL);

-- Create all products view (for admin with toggle)
CREATE VIEW all_products AS
SELECT 
    p.*,
    pt.name as product_type_name,
    pt.is_active as product_type_active,
    CASE 
        WHEN p.deleted_at IS NOT NULL THEN 'deleted'
        WHEN p.is_active = false THEN 'disabled'
        ELSE 'active'
    END as status
FROM products p
LEFT JOIN product_types pt ON p.product_type_id = pt.id;

-- Create active flavors view
CREATE VIEW active_flavors AS
SELECT 
    f.*,
    CASE 
        WHEN f.stock_quantity <= 0 THEN 'out_of_stock'
        WHEN f.stock_quantity <= 10 THEN 'low_stock'
        ELSE 'in_stock'
    END as stock_status
FROM flavors f
WHERE f.deleted_at IS NULL 
    AND f.is_enabled = true;

-- Create all flavors view
CREATE VIEW all_flavors AS
SELECT 
    f.*,
    CASE 
        WHEN f.deleted_at IS NOT NULL THEN 'deleted'
        WHEN f.is_enabled = false THEN 'disabled'
        WHEN f.stock_quantity <= 0 THEN 'out_of_stock'
        WHEN f.stock_quantity <= 10 THEN 'low_stock'
        ELSE 'in_stock'
    END as status
FROM flavors f;

-- Create active product types view
CREATE VIEW active_product_types AS
SELECT * FROM product_types 
WHERE deleted_at IS NULL 
    AND is_active = true;

-- Create all product types view
CREATE VIEW all_product_types AS
SELECT 
    *,
    CASE 
        WHEN deleted_at IS NOT NULL THEN 'deleted'
        WHEN is_active = false THEN 'disabled'
        ELSE 'active'
    END as status
FROM product_types;

-- Create active product instances view
CREATE VIEW active_product_instances AS
SELECT 
    pi.*,
    p.name as product_name,
    p.is_active as product_active,
    p.deleted_at as product_deleted_at,
    pt.name as product_type_name,
    pt.is_active as product_type_active,
    pt.deleted_at as product_type_deleted_at
FROM product_instance pi
LEFT JOIN products p ON pi.product_id = p.id
LEFT JOIN product_types pt ON p.product_type_id = pt.id
WHERE pi.product_type = 'cookie_pack'
    AND (p.deleted_at IS NULL OR p.deleted_at IS NULL)
    AND (pt.deleted_at IS NULL OR pt.deleted_at IS NULL);

-- Create all product instances view
CREATE VIEW all_product_instances AS
SELECT 
    pi.*,
    p.name as product_name,
    p.is_active as product_active,
    p.deleted_at as product_deleted_at,
    pt.name as product_type_name,
    pt.is_active as product_type_active,
    pt.deleted_at as product_type_deleted_at,
    CASE 
        WHEN p.deleted_at IS NOT NULL THEN 'product_deleted'
        WHEN pt.deleted_at IS NOT NULL THEN 'product_type_deleted'
        WHEN p.is_active = false THEN 'product_disabled'
        WHEN pt.is_active = false THEN 'product_type_disabled'
        ELSE 'active'
    END as status
FROM product_instance pi
LEFT JOIN products p ON pi.product_id = p.id
LEFT JOIN product_types pt ON p.product_type_id = pt.id
WHERE pi.product_type = 'cookie_pack';

-- Phase 3: Create indexes for better performance
CREATE INDEX idx_products_deleted_at ON products(deleted_at);
CREATE INDEX idx_products_status ON products(is_active, deleted_at);
CREATE INDEX idx_flavors_deleted_at ON flavors(deleted_at);
CREATE INDEX idx_flavors_status ON flavors(is_enabled, deleted_at);
CREATE INDEX idx_product_types_deleted_at ON product_types(deleted_at);
CREATE INDEX idx_product_types_status ON product_types(is_active, deleted_at);

-- Phase 4: Create stored procedures for soft delete operations

DELIMITER //

-- Procedure to soft delete a product
CREATE PROCEDURE soft_delete_product(
    IN p_product_id INT,
    IN p_admin_id INT,
    IN p_reason VARCHAR(255)
)
BEGIN
    UPDATE products 
    SET deleted_at = CURRENT_TIMESTAMP,
        deleted_by = p_admin_id,
        deletion_reason = p_reason
    WHERE id = p_product_id;
END //

-- Procedure to restore a soft deleted product
CREATE PROCEDURE restore_product(
    IN p_product_id INT,
    IN p_admin_id INT
)
BEGIN
    UPDATE products 
    SET deleted_at = NULL,
        deleted_by = NULL,
        deletion_reason = NULL
    WHERE id = p_product_id;
END //

-- Procedure to soft delete a flavor
CREATE PROCEDURE soft_delete_flavor(
    IN p_flavor_id INT,
    IN p_admin_id INT,
    IN p_reason VARCHAR(255)
)
BEGIN
    UPDATE flavors 
    SET deleted_at = CURRENT_TIMESTAMP,
        deleted_by = p_admin_id,
        deletion_reason = p_reason
    WHERE id = p_flavor_id;
END //

-- Procedure to restore a soft deleted flavor
CREATE PROCEDURE restore_flavor(
    IN p_flavor_id INT,
    IN p_admin_id INT
)
BEGIN
    UPDATE flavors 
    SET deleted_at = NULL,
        deleted_by = NULL,
        deletion_reason = NULL
    WHERE id = p_flavor_id;
END //

-- Procedure to soft delete a product type
CREATE PROCEDURE soft_delete_product_type(
    IN p_product_type_id INT,
    IN p_admin_id INT,
    IN p_reason VARCHAR(255)
)
BEGIN
    UPDATE product_types 
    SET deleted_at = CURRENT_TIMESTAMP,
        deleted_by = p_admin_id,
        deletion_reason = p_reason
    WHERE id = p_product_type_id;
END //

-- Procedure to restore a soft deleted product type
CREATE PROCEDURE restore_product_type(
    IN p_product_type_id INT,
    IN p_admin_id INT
)
BEGIN
    UPDATE product_types 
    SET deleted_at = NULL,
        deleted_by = NULL,
        deletion_reason = NULL
    WHERE id = p_product_type_id;
END //

DELIMITER ;

-- Phase 5: Migrate existing disabled items to soft deleted
UPDATE products 
SET deleted_at = CURRENT_TIMESTAMP,
    deletion_reason = 'Migrated from disabled status'
WHERE is_active = false AND deleted_at IS NULL;

UPDATE flavors 
SET deleted_at = CURRENT_TIMESTAMP,
    deletion_reason = 'Migrated from disabled status'
WHERE is_enabled = false AND deleted_at IS NULL;

UPDATE product_types 
SET deleted_at = CURRENT_TIMESTAMP,
    deletion_reason = 'Migrated from disabled status'
WHERE is_active = false AND deleted_at IS NULL;

-- Phase 6: Create admin settings for view preferences
CREATE TABLE IF NOT EXISTS admin_view_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_user_id INT NOT NULL,
    view_type ENUM('products', 'flavors', 'product_types', 'orders') NOT NULL,
    show_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_admin_view (admin_user_id, view_type)
);

-- Insert default preferences for existing admin users
INSERT INTO admin_view_preferences (admin_user_id, view_type, show_deleted)
SELECT id, 'products', false FROM admin_users
ON DUPLICATE KEY UPDATE show_deleted = false;

INSERT INTO admin_view_preferences (admin_user_id, view_type, show_deleted)
SELECT id, 'flavors', false FROM admin_users
ON DUPLICATE KEY UPDATE show_deleted = false;

INSERT INTO admin_view_preferences (admin_user_id, view_type, show_deleted)
SELECT id, 'product_types', false FROM admin_users
ON DUPLICATE KEY UPDATE show_deleted = false;

INSERT INTO admin_view_preferences (admin_user_id, view_type, show_deleted)
SELECT id, 'orders', false FROM admin_users
ON DUPLICATE KEY UPDATE show_deleted = false; 