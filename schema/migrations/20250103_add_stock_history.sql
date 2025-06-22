-- Add stock history tracking
-- Migration: 20250103_add_stock_history.sql

-- Create stock_history table
CREATE TABLE stock_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    item_type ENUM('flavor', 'product') NOT NULL,
    old_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    change_amount INT NOT NULL,
    change_type ENUM('replacement', 'addition', 'subtraction') NOT NULL,
    notes TEXT,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_item (item_id, item_type),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
