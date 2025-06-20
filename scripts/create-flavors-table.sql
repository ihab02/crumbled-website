-- Create flavors table
CREATE TABLE IF NOT EXISTS `flavors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `mini_price` decimal(10,2) NOT NULL,
  `medium_price` decimal(10,2) NOT NULL,
  `large_price` decimal(10,2) NOT NULL,
  `is_enabled` boolean DEFAULT true,
  `display_order` int DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create flavor images table
CREATE TABLE IF NOT EXISTS `flavor_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `flavor_id` int NOT NULL,
  `image_url` text NOT NULL,
  `is_cover` boolean DEFAULT false,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `flavor_id` (`flavor_id`),
  CONSTRAINT `flavor_images_ibfk_1` FOREIGN KEY (`flavor_id`) REFERENCES `flavors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create trigger to ensure only one cover image per flavor
DELIMITER ;;
CREATE TRIGGER `check_single_cover_image` BEFORE INSERT ON `flavor_images`
FOR EACH ROW
BEGIN
  IF NEW.is_cover = TRUE THEN
    IF EXISTS (
      SELECT 1 FROM flavor_images
      WHERE flavor_id = NEW.flavor_id AND is_cover = TRUE
    ) THEN
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Only one cover image is allowed per flavor';
    END IF;
  END IF;
END;;
DELIMITER ; 