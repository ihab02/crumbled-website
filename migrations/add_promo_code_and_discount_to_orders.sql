ALTER TABLE orders
  ADD COLUMN promo_code_id INT NULL AFTER customer_id,
  ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0 AFTER total,
  ADD CONSTRAINT fk_orders_promo_code FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE SET NULL; 