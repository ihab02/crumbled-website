-- Fix soft delete stored procedures to also update is_active field
-- This ensures consistency between soft delete and is_active fields

DELIMITER //

-- Drop existing procedures
DROP PROCEDURE IF EXISTS soft_delete_flavor;
DROP PROCEDURE IF EXISTS restore_flavor;
DROP PROCEDURE IF EXISTS soft_delete_product;
DROP PROCEDURE IF EXISTS restore_product;
DROP PROCEDURE IF EXISTS soft_delete_product_type;
DROP PROCEDURE IF EXISTS restore_product_type;

-- Recreate soft delete flavor procedure with is_active update
CREATE PROCEDURE soft_delete_flavor(
    IN p_flavor_id INT,
    IN p_admin_id INT,
    IN p_reason VARCHAR(255)
)
BEGIN
    UPDATE flavors 
    SET deleted_at = CURRENT_TIMESTAMP,
        deleted_by = p_admin_id,
        deletion_reason = p_reason,
        is_active = 0
    WHERE id = p_flavor_id;
END //

-- Recreate restore flavor procedure with is_active update
CREATE PROCEDURE restore_flavor(
    IN p_flavor_id INT,
    IN p_admin_id INT
)
BEGIN
    UPDATE flavors 
    SET deleted_at = NULL,
        deleted_by = NULL,
        deletion_reason = NULL,
        is_active = 1
    WHERE id = p_flavor_id;
END //

-- Recreate soft delete product procedure with is_active update
CREATE PROCEDURE soft_delete_product(
    IN p_product_id INT,
    IN p_admin_id INT,
    IN p_reason VARCHAR(255)
)
BEGIN
    UPDATE products 
    SET deleted_at = CURRENT_TIMESTAMP,
        deleted_by = p_admin_id,
        deletion_reason = p_reason,
        is_active = 0
    WHERE id = p_product_id;
END //

-- Recreate restore product procedure with is_active update
CREATE PROCEDURE restore_product(
    IN p_product_id INT,
    IN p_admin_id INT
)
BEGIN
    UPDATE products 
    SET deleted_at = NULL,
        deleted_by = NULL,
        deletion_reason = NULL,
        is_active = 1
    WHERE id = p_product_id;
END //

-- Recreate soft delete product type procedure with is_active update
CREATE PROCEDURE soft_delete_product_type(
    IN p_product_type_id INT,
    IN p_admin_id INT,
    IN p_reason VARCHAR(255)
)
BEGIN
    UPDATE product_types 
    SET deleted_at = CURRENT_TIMESTAMP,
        deleted_by = p_admin_id,
        deletion_reason = p_reason,
        is_active = 0
    WHERE id = p_product_type_id;
END //

-- Recreate restore product type procedure with is_active update
CREATE PROCEDURE restore_product_type(
    IN p_product_type_id INT,
    IN p_admin_id INT
)
BEGIN
    UPDATE product_types 
    SET deleted_at = NULL,
        deleted_by = NULL,
        deletion_reason = NULL,
        is_active = 1
    WHERE id = p_product_type_id;
END //

DELIMITER ;

-- Update existing soft-deleted items to have is_active = 0
UPDATE flavors SET is_active = 0 WHERE deleted_at IS NOT NULL AND is_active = 1;
UPDATE products SET is_active = 0 WHERE deleted_at IS NOT NULL AND is_active = 1;
UPDATE product_types SET is_active = 0 WHERE deleted_at IS NOT NULL AND is_active = 1;

-- Update existing non-deleted items to have is_active = 1
UPDATE flavors SET is_active = 1 WHERE deleted_at IS NULL AND is_active = 0;
UPDATE products SET is_active = 1 WHERE deleted_at IS NULL AND is_active = 0;
UPDATE product_types SET is_active = 1 WHERE deleted_at IS NULL AND is_active = 0; 