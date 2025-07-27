-- Migration Tracking System
-- This table tracks which migrations have been applied to the database

CREATE TABLE IF NOT EXISTS `migration_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `migration_name` varchar(255) NOT NULL,
  `migration_file` varchar(500) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `applied_by` varchar(100) DEFAULT NULL,
  `execution_time_ms` int(11) DEFAULT NULL,
  `status` enum('success','failed','rolled_back') NOT NULL DEFAULT 'success',
  `error_message` text DEFAULT NULL,
  `backup_file` varchar(500) DEFAULT NULL,
  `checksum` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_migration_name` (`migration_name`),
  KEY `idx_applied_at` (`applied_at`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial record for existing migrations
INSERT IGNORE INTO `migration_history` (
  `migration_name`, 
  `migration_file`, 
  `applied_at`, 
  `applied_by`, 
  `status`
) VALUES 
('initial_schema', 'initial_schema.sql', NOW(), 'system', 'success'),
('sliding_media', 'add_sliding_media.sql', NOW(), 'system', 'success'),
('enhanced_promo_codes', 'add_enhanced_promo_codes_and_pricing_system.sql', NOW(), 'system', 'success'),
('customer_reviews', 'add_customer_reviews.sql', NOW(), 'system', 'success'),
('delivery_management', 'add_delivery_management.sql', NOW(), 'system', 'success'),
('email_verification', 'add_customer_age_group_and_email_verification.sql', NOW(), 'system', 'success'),
('pricing_rules', 'add_pricing_management_system_fixed.sql', NOW(), 'system', 'success'),
('soft_delete', 'add_soft_delete_views.sql', NOW(), 'system', 'success'),
('promo_code_usages', '20240721_create_promo_code_usages_table.sql', NOW(), 'system', 'success'),
('max_usage_per_user', '20240721_add_max_usage_per_user_to_promo_codes.sql', NOW(), 'system', 'success');

-- Create a view to show migration status
CREATE OR REPLACE VIEW `migration_status` AS
SELECT 
  mh.migration_name,
  mh.migration_file,
  mh.applied_at,
  mh.status,
  mh.execution_time_ms,
  mh.applied_by,
  CASE 
    WHEN mh.status = 'success' THEN '✅ Applied'
    WHEN mh.status = 'failed' THEN '❌ Failed'
    WHEN mh.status = 'rolled_back' THEN '🔄 Rolled Back'
  END as status_display
FROM migration_history mh
ORDER BY mh.applied_at DESC; 