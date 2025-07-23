DROP TABLE IF EXISTS promo_code_usages;
CREATE TABLE promo_code_usages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  promo_code_id INT NOT NULL,
  customer_id INT NOT NULL,
  usage_count INT DEFAULT 1,
  last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (promo_code_id, customer_id),
  FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
); 