-- Create sliding_media table for CMS
CREATE TABLE IF NOT EXISTS `sliding_media` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `media_type` enum('image','video') NOT NULL DEFAULT 'image',
  `media_url` varchar(500) NOT NULL,
  `thumbnail_url` varchar(500) DEFAULT NULL,
  `text_content` text DEFAULT NULL,
  `text_size` enum('small','medium','large','xlarge') DEFAULT 'medium',
  `text_color` varchar(7) DEFAULT '#ffffff',
  `text_alignment` enum('left','center','right') DEFAULT 'center',
  `text_position` enum('top','middle','bottom') DEFAULT 'middle',
  `click_url` varchar(500) DEFAULT '/shop',
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_active_dates` (`is_active`, `start_date`, `end_date`),
  KEY `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some sample data
INSERT INTO `sliding_media` (
  `title`, 
  `media_type`, 
  `media_url`, 
  `text_content`, 
  `text_size`, 
  `text_color`, 
  `text_alignment`, 
  `text_position`, 
  `click_url`, 
  `start_date`, 
  `end_date`, 
  `is_active`, 
  `display_order`
) VALUES 
(
  'Summer Special Cookies',
  'image',
  '/images/sliding-media/summer-cookies.jpg',
  'Discover our refreshing summer cookie collection!',
  'large',
  '#ffffff',
  'center',
  'middle',
  '/shop',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 30 DAY),
  1,
  1
),
(
  'New Flavors Available',
  'image',
  '/images/sliding-media/new-flavors.jpg',
  'Try our latest cookie flavors today!',
  'medium',
  '#000000',
  'left',
  'bottom',
  '/flavors',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 60 DAY),
  1,
  2
); 