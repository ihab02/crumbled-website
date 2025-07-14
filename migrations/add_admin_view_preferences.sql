-- Migration: Add admin_view_preferences table
-- Date: 2024-01-01
-- Description: Creates table to store admin user view preferences

CREATE TABLE IF NOT EXISTS `admin_view_preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_user_id` int NOT NULL,
  `view_type` enum('products','flavors','product_types','orders') NOT NULL,
  `show_deleted` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_admin_view` (`admin_user_id`, `view_type`),
  KEY `idx_admin_user_id` (`admin_user_id`),
  KEY `idx_view_type` (`view_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert default preferences for admin user ID 1
INSERT IGNORE INTO `admin_view_preferences` (`admin_user_id`, `view_type`, `show_deleted`) VALUES
(1, 'products', 0),
(1, 'flavors', 0),
(1, 'product_types', 0),
(1, 'orders', 0); 