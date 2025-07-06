-- Migration: Add Customer Reviews System
-- This migration creates a complete customer reviews system
-- Date: 2025-01-03

-- Create reviews table
CREATE TABLE customer_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    order_id INT NULL, -- Optional: link to specific order
    product_id INT NULL, -- Optional: link to specific product
    flavor_id INT NULL, -- Optional: link to specific flavor
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255) NULL,
    review_text TEXT NOT NULL,
    review_images JSON NULL, -- Store image URLs as JSON array
    is_verified_purchase BOOLEAN DEFAULT false,
    is_helpful_count INT DEFAULT 0,
    is_not_helpful_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    is_anonymous BOOLEAN DEFAULT false,
    admin_response TEXT NULL,
    admin_response_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (flavor_id) REFERENCES flavors(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_customer_reviews_customer (customer_id),
    INDEX idx_customer_reviews_product (product_id),
    INDEX idx_customer_reviews_flavor (flavor_id),
    INDEX idx_customer_reviews_rating (rating),
    INDEX idx_customer_reviews_created (created_at),
    INDEX idx_customer_reviews_approved (is_approved),
    INDEX idx_customer_reviews_featured (is_featured)
);

-- Create review_helpful_votes table for tracking helpful votes
CREATE TABLE review_helpful_votes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    review_id INT NOT NULL,
    customer_id INT NOT NULL,
    is_helpful BOOLEAN NOT NULL, -- true for helpful, false for not helpful
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (review_id) REFERENCES customer_reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Prevent duplicate votes from same customer
    UNIQUE KEY unique_customer_review_vote (review_id, customer_id),
    INDEX idx_review_helpful_votes_review (review_id),
    INDEX idx_review_helpful_votes_customer (customer_id)
);

-- Create review_reports table for reporting inappropriate reviews
CREATE TABLE review_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    review_id INT NOT NULL,
    reported_by_customer_id INT NOT NULL,
    reason ENUM('inappropriate', 'spam', 'fake', 'offensive', 'other') NOT NULL,
    description TEXT NULL,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by_admin_id INT NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (review_id) REFERENCES customer_reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by_customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL,
    
    INDEX idx_review_reports_review (review_id),
    INDEX idx_review_reports_resolved (is_resolved)
);

-- Add review-related fields to existing tables
ALTER TABLE customers 
ADD COLUMN total_reviews INT DEFAULT 0,
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN last_review_date TIMESTAMP NULL;

ALTER TABLE products 
ADD COLUMN total_reviews INT DEFAULT 0,
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN review_count_1_star INT DEFAULT 0,
ADD COLUMN review_count_2_star INT DEFAULT 0,
ADD COLUMN review_count_3_star INT DEFAULT 0,
ADD COLUMN review_count_4_star INT DEFAULT 0,
ADD COLUMN review_count_5_star INT DEFAULT 0;

ALTER TABLE flavors 
ADD COLUMN total_reviews INT DEFAULT 0,
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN review_count_1_star INT DEFAULT 0,
ADD COLUMN review_count_2_star INT DEFAULT 0,
ADD COLUMN review_count_3_star INT DEFAULT 0,
ADD COLUMN review_count_4_star INT DEFAULT 0,
ADD COLUMN review_count_5_star INT DEFAULT 0;

-- Create triggers to update review counts and ratings
DELIMITER //

CREATE TRIGGER update_customer_review_stats_after_insert
AFTER INSERT ON customer_reviews
FOR EACH ROW
BEGIN
    -- Update customer review stats
    UPDATE customers 
    SET 
        total_reviews = (
            SELECT COUNT(*) 
            FROM customer_reviews 
            WHERE customer_id = NEW.customer_id AND is_approved = true
        ),
        average_rating = (
            SELECT AVG(rating) 
            FROM customer_reviews 
            WHERE customer_id = NEW.customer_id AND is_approved = true
        ),
        last_review_date = NOW()
    WHERE id = NEW.customer_id;
    
    -- Update product review stats if review is for a product
    IF NEW.product_id IS NOT NULL THEN
        UPDATE products 
        SET 
            total_reviews = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE product_id = NEW.product_id AND is_approved = true
            ),
            average_rating = (
                SELECT AVG(rating) 
                FROM customer_reviews 
                WHERE product_id = NEW.product_id AND is_approved = true
            ),
            review_count_1_star = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE product_id = NEW.product_id AND rating = 1 AND is_approved = true
            ),
            review_count_2_star = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE product_id = NEW.product_id AND rating = 2 AND is_approved = true
            ),
            review_count_3_star = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE product_id = NEW.product_id AND rating = 3 AND is_approved = true
            ),
            review_count_4_star = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE product_id = NEW.product_id AND rating = 4 AND is_approved = true
            ),
            review_count_5_star = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE product_id = NEW.product_id AND rating = 5 AND is_approved = true
            )
        WHERE id = NEW.product_id;
    END IF;
    
    -- Update flavor review stats if review is for a flavor
    IF NEW.flavor_id IS NOT NULL THEN
        UPDATE flavors 
        SET 
            total_reviews = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE flavor_id = NEW.flavor_id AND is_approved = true
            ),
            average_rating = (
                SELECT AVG(rating) 
                FROM customer_reviews 
                WHERE flavor_id = NEW.flavor_id AND is_approved = true
            ),
            review_count_1_star = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE flavor_id = NEW.flavor_id AND rating = 1 AND is_approved = true
            ),
            review_count_2_star = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE flavor_id = NEW.flavor_id AND rating = 2 AND is_approved = true
            ),
            review_count_3_star = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE flavor_id = NEW.flavor_id AND rating = 3 AND is_approved = true
            ),
            review_count_4_star = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE flavor_id = NEW.flavor_id AND rating = 4 AND is_approved = true
            ),
            review_count_5_star = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE flavor_id = NEW.flavor_id AND rating = 5 AND is_approved = true
            )
        WHERE id = NEW.flavor_id;
    END IF;
END//

CREATE TRIGGER update_customer_review_stats_after_update
AFTER UPDATE ON customer_reviews
FOR EACH ROW
BEGIN
    -- Update customer review stats
    UPDATE customers 
    SET 
        total_reviews = (
            SELECT COUNT(*) 
            FROM customer_reviews 
            WHERE customer_id = NEW.customer_id AND is_approved = true
        ),
        average_rating = (
            SELECT AVG(rating) 
            FROM customer_reviews 
            WHERE customer_id = NEW.customer_id AND is_approved = true
        )
    WHERE id = NEW.customer_id;
    
    -- Update product review stats if review is for a product
    IF NEW.product_id IS NOT NULL THEN
        UPDATE products 
        SET 
            total_reviews = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE product_id = NEW.product_id AND is_approved = true
            ),
            average_rating = (
                SELECT AVG(rating) 
                FROM customer_reviews 
                WHERE product_id = NEW.product_id AND is_approved = true
            ),
            review_count_1_star = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE product_id = NEW.product_id AND rating = 1 AND is_approved = true
            ),
            review_count_2_star = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE product_id = NEW.product_id AND rating = 2 AND is_approved = true
            ),
            review_count_3_star = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE product_id = NEW.product_id AND rating = 3 AND is_approved = true
            ),
            review_count_4_star = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE product_id = NEW.product_id AND rating = 4 AND is_approved = true
            ),
            review_count_5_star = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE product_id = NEW.product_id AND rating = 5 AND is_approved = true
            )
        WHERE id = NEW.product_id;
    END IF;
    
    -- Update flavor review stats if review is for a flavor
    IF NEW.flavor_id IS NOT NULL THEN
        UPDATE flavors 
        SET 
            total_reviews = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE flavor_id = NEW.flavor_id AND is_approved = true
            ),
            average_rating = (
                SELECT AVG(rating) 
                FROM customer_reviews 
                WHERE flavor_id = NEW.flavor_id AND is_approved = true
            ),
            review_count_1_star = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE flavor_id = NEW.flavor_id AND rating = 1 AND is_approved = true
            ),
            review_count_2_star = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE flavor_id = NEW.flavor_id AND rating = 2 AND is_approved = true
            ),
            review_count_3_star = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE flavor_id = NEW.flavor_id AND rating = 3 AND is_approved = true
            ),
            review_count_4_star = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE flavor_id = NEW.flavor_id AND rating = 4 AND is_approved = true
            ),
            review_count_5_star = (
                SELECT COUNT(*) 
                FROM customer_reviews 
                WHERE flavor_id = NEW.flavor_id AND rating = 5 AND is_approved = true
            )
        WHERE id = NEW.flavor_id;
    END IF;
END//

CREATE TRIGGER update_helpful_votes_after_insert
AFTER INSERT ON review_helpful_votes
FOR EACH ROW
BEGIN
    UPDATE customer_reviews 
    SET 
        is_helpful_count = (
            SELECT COUNT(*) 
            FROM review_helpful_votes 
            WHERE review_id = NEW.review_id AND is_helpful = true
        ),
        is_not_helpful_count = (
            SELECT COUNT(*) 
            FROM review_helpful_votes 
            WHERE review_id = NEW.review_id AND is_helpful = false
        )
    WHERE id = NEW.review_id;
END//

DELIMITER ;

-- Insert sample reviews for testing
INSERT INTO customer_reviews (customer_id, product_id, rating, title, review_text, is_verified_purchase, is_approved) VALUES
(1, 1, 5, 'Amazing cookies!', 'These cookies are absolutely delicious. Perfect texture and flavor. Will definitely order again!', true, true),
(2, 1, 4, 'Great taste', 'Very good cookies, fresh and tasty. Delivery was fast too.', true, true),
(3, 2, 5, 'Best chocolate cookies ever', 'I love these chocolate cookies! They are so rich and flavorful.', true, true),
(4, 2, 3, 'Good but could be better', 'The cookies are good but a bit too sweet for my taste.', true, true),
(5, 3, 5, 'Perfect for parties', 'Ordered these for a party and everyone loved them! Great presentation and taste.', true, true);

COMMIT; 