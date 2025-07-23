# Crumbled Database Structure Documentation

## Overview
Crumbled is a Next.js-based e-commerce platform for cookie delivery. The database uses MySQL with a comprehensive structure supporting customer management, product catalog, order processing, delivery management, and admin operations.

## Database Name
`crumbled_nextDB`

## Core Tables Structure

### 1. Customer Management

#### `customers` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- first_name (VARCHAR)
- last_name (VARCHAR)
- email (VARCHAR, UNIQUE)
- phone (VARCHAR, UNIQUE)
- password (VARCHAR) - Hashed password for registered users
- type (ENUM: 'guest', 'registered')
- age_group (ENUM: '13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+')
- birth_date (DATE) - Optional birth date
- email_verified (BOOLEAN) - Email verification status
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Purpose**: Stores customer information for both guest and registered users.

**Registration Features**:
- **Age Group Tracking**: Captures customer age demographics for marketing
- **Email Verification**: Tracks email verification status for registered users
- **Password Security**: Hashed passwords for registered customers
- **Delivery Coverage**: Customers can register from any city/zone, with coverage notifications

#### `addresses` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- customer_id (FOREIGN KEY -> customers.id)
- city_id (FOREIGN KEY -> cities.id)
- zone_id (FOREIGN KEY -> zones.id)
- street_address (TEXT)
- is_default (BOOLEAN)
- created_at (TIMESTAMP)
```

**Purpose**: Manages customer delivery addresses with zone-based delivery system.

### 2. Location Management

#### `cities` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR) - City name (e.g., "Cairo", "Giza", "Alexandria")
- is_active (BOOLEAN) - Whether city is under delivery coverage
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Purpose**: Manages cities with delivery coverage status.

**Business Logic**:
- **Active Cities**: Currently under delivery coverage
- **Inactive Cities**: Future expansion areas, customers can register but notified about coverage
- **Registration**: All cities visible in registration form regardless of active status

#### `zones` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR) - Zone name (e.g., "Madinaty", "Al-Rehab", "New Cairo")
- city_id (FOREIGN KEY -> cities.id)
- delivery_fee (DECIMAL) - Zone-specific delivery fee
- delivery_days (INT) - Days until delivery (0 = same day, 1 = next day, etc.)
- time_slot_id (FOREIGN KEY -> delivery_time_slots.id) - Optional time slot
- is_active (BOOLEAN) - Whether zone is under delivery coverage
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Purpose**: Manages delivery zones within cities with coverage and pricing information.

**Business Logic**:
- **Active Zones**: Currently under delivery coverage
- **Inactive Zones**: Future expansion areas, marked as "(coming soon)" in registration
- **Delivery Fees**: Zone-specific delivery charges
- **Delivery Timing**: Zone-specific delivery days and time slots

### 3. Authentication & Security

#### `email_verification_tokens` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- customer_id (FOREIGN KEY -> customers.id)
- email (VARCHAR)
- token (VARCHAR) - Verification token
- expires_at (TIMESTAMP) - Token expiration
- created_at (TIMESTAMP)
```

**Purpose**: Manages email verification tokens for new customer registrations.

#### `password_reset_tokens` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- user_id (VARCHAR) - Customer ID (as string for flexibility)
- user_type (ENUM: 'customer', 'admin') - Type of user
- token_hash (VARCHAR) - Hashed reset token
- expires_at (TIMESTAMP) - Optional expiration (if column exists)
- created_at (TIMESTAMP)
```

**Purpose**: Manages password reset tokens with secure hashing and expiration.

**Security Features**:
- **Token Hashing**: Reset tokens are hashed for security
- **Single Use**: Tokens are deleted after successful password reset
- **Expiration**: Tokens expire after 24 hours (if expires_at column exists)
- **User Type**: Supports both customer and admin password resets

#### `phone_verification` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- phone (VARCHAR) - Phone number
- verification_code (VARCHAR) - OTP code
- is_verified (BOOLEAN) - Verification status
- created_at (TIMESTAMP)
- expires_at (TIMESTAMP) - OTP expiration
```

**Purpose**: Manages phone verification for both guest and registered users.

### 4. Product Catalog

#### `product_types` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR) - e.g., "Cookies", "Bundles", "Packs"
- description (TEXT)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
```

**Purpose**: Categorizes products into types (cookies, bundles, packs).

#### `products` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- product_type_id (FOREIGN KEY -> product_types.id)
- name (VARCHAR)
- description (TEXT)
- base_price (DECIMAL)
- image_url (VARCHAR)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
```

**Purpose**: Base product definitions.

#### `cookie_pack` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR) - e.g., "3 PCS Pack", "6 PCS Pack"
- count (INT) - Number of cookies in pack
- base_price (DECIMAL)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
```

**Purpose**: Defines cookie pack configurations.

#### `flavors` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR) - e.g., "Oreo", "Strawberry", "Vanilla"
- description (TEXT)
- image_url (VARCHAR)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
```

**Purpose**: Available cookie flavors.

#### `flavor_images` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- flavor_id (FOREIGN KEY -> flavors.id)
- image_url (VARCHAR)
- is_primary (BOOLEAN)
- created_at (TIMESTAMP)
```

**Purpose**: Multiple images per flavor for gallery display.

### 5. Product Instances & Configuration

#### `product_instance` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- product_type (ENUM: 'cookie', 'pack', 'bundle')
- product_id (INT) - References products.id or cookie_pack.id
- size_id (INT) - References sizes.id
- base_price (DECIMAL)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
```

**Purpose**: Specific product configurations with sizes and pricing.

#### `product_instance_flavor` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- product_instance_id (FOREIGN KEY -> product_instance.id)
- flavor_id (FOREIGN KEY -> flavors.id)
- flavor_name (VARCHAR) - Cached flavor name
- size_id (INT)
- size_name (VARCHAR) - Cached size name
- quantity (INT)
- price_adjustment (DECIMAL)
- created_at (TIMESTAMP)
```

**Purpose**: Links flavors to product instances with quantity and pricing.

#### `sizes` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR) - "Mini", "Medium", "Large"
- description (TEXT)
- is_active (BOOLEAN)
```

**Purpose**: Cookie size definitions.

### 6. Order Management

#### `orders` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- customer_id (FOREIGN KEY -> customers.id, NULL for guests)
- total (DECIMAL)
- subtotal (DECIMAL)
- delivery_fee (DECIMAL)
- status (ENUM: 'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')
- payment_method (ENUM: 'cash', 'card', 'online')
- payment_status (ENUM: 'pending', 'paid', 'failed')
- delivery_address (TEXT)
- delivery_city (VARCHAR)
- delivery_zone (VARCHAR)
- delivery_additional_info (TEXT)
- delivery_days (INT) - Days until delivery
- expected_delivery_date (TIMESTAMP)
- delivery_man_id (FOREIGN KEY -> delivery_men.id)
- delivery_time_slot_name (VARCHAR)
- from_hour (TIME)
- to_hour (TIME)
- guest_otp (VARCHAR) - For guest orders
- otp_verified (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Purpose**: Main order records with delivery and payment information.

#### `order_items` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- order_id (FOREIGN KEY -> orders.id)
- product_instance_id (FOREIGN KEY -> product_instance.id)
- product_name (VARCHAR(255)) - Cached product name at order time
- product_type (ENUM: 'individual', 'pack') - Cached product type at order time
- pack_size (VARCHAR(50)) - Cached pack size (Mini, Medium, Large) at order time
- flavor_details (JSON) - Serialized flavor selections at order time
- quantity (INT)
- unit_price (DECIMAL)
- created_at (TIMESTAMP)
```

**Purpose**: Individual items in orders with cached product info and flavor details.

**Important Notes**:
- **Cached Fields**: `product_name`, `product_type`, `pack_size` are cached at order time to preserve historical data
- **Flavor Details JSON**: Contains complete flavor selection as JSON array:
  ```json
  [
    {
      "quantity": 1,
      "size_name": "mini",
      "flavor_name": "Chocolate Chip"
    }
  ]
  ```
- **Performance**: Indexes on `product_name`, `product_type` for better query performance

**Special Note**: The `flavor_details` JSON field contains the complete flavor selection:
```json
[
  {
    "id": 16,
    "name": "Brownie Cookie",
    "size": "Large",
    "price": "20.00",
    "quantity": 1
  }
]
```

### 12. Product Pricing Management System

#### `pricing_rules` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR(255)) - Rule name (e.g., "Summer Sale", "VIP Discount")
- description (TEXT) - Detailed rule description
- rule_type (ENUM: 'product', 'category', 'flavor', 'time', 'location', 'customer_group') - Type of pricing rule
- target_id (INT, NULL) - Product ID, category ID, etc.
- target_value (VARCHAR(255), NULL) - For non-ID targets like customer groups
- discount_type (ENUM: 'percentage', 'fixed_amount', 'free_delivery') - Type of discount
- discount_value (DECIMAL(10, 2)) - Discount amount or percentage
- minimum_order_amount (DECIMAL(10, 2), DEFAULT 0.00) - Minimum order for discount
- maximum_discount (DECIMAL(10, 2), NULL) - Maximum discount cap
- start_date (DATETIME, DEFAULT CURRENT_TIMESTAMP) - Rule activation date
- end_date (DATETIME, NULL) - Rule expiration date
- is_active (BOOLEAN, DEFAULT true) - Whether rule is active
- priority (INT, DEFAULT 0) - Higher priority rules apply first
- created_by (INT, FOREIGN KEY -> admin_users.id) - Admin who created rule
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- updated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)
```

**Purpose**: Manages flexible pricing rules for products, categories, and customer groups.

**Business Logic**:
- **Rule Types**: Product-specific, category-based, time-based, customer group pricing
- **Priority System**: Higher priority rules apply first when multiple rules match
- **Time-Based**: Rules can be scheduled with start and end dates
- **Validation**: Minimum order amounts and maximum discount caps
- **Flexibility**: Supports percentage, fixed amount, and free delivery discounts

#### `product_prices` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- product_id (INT, FOREIGN KEY -> products.id) - Reference to product
- price_type (ENUM: 'regular', 'sale', 'member', 'wholesale') - Type of price
- price (DECIMAL(10, 2)) - Price amount
- start_date (DATETIME, DEFAULT CURRENT_TIMESTAMP) - Price activation date
- end_date (DATETIME, NULL) - Price expiration date
- is_active (BOOLEAN, DEFAULT true) - Whether price is active
- created_by (INT, FOREIGN KEY -> admin_users.id) - Admin who set price
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- updated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)
```

**Purpose**: Manages different price tiers for products (regular, sale, member, wholesale).

**Business Logic**:
- **Price Tiers**: Multiple price types for different customer segments
- **Time-Based**: Prices can be scheduled with start and end dates
- **Historical Tracking**: Complete audit trail of price changes
- **Active Management**: Only active prices are applied
- **Admin Control**: Full control over pricing through admin interface

#### `pricing_categories` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR(255)) - Category name (e.g., "Premium Flavors", "Bulk Orders")
- description (TEXT) - Category description
- category_type (ENUM: 'product_type', 'flavor_category', 'size_category', 'customer_group') - Type of category
- target_value (VARCHAR(255)) - Category value (e.g., "Chocolate", "Large", "VIP")
- is_active (BOOLEAN, DEFAULT true) - Whether category is active
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- updated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)
```

**Purpose**: Defines pricing categories for grouping products and customers.

**Business Logic**:
- **Category Types**: Product types, flavor categories, size categories, customer groups
- **Flexible Grouping**: Dynamic categorization for pricing rules
- **Active Management**: Only active categories are used in pricing
- **Target Values**: Specific values within each category type

#### Updated `products` Table (Pricing Fields)
```sql
- original_price (DECIMAL(10, 2), NULL) - Original product price
- sale_price (DECIMAL(10, 2), NULL) - Current sale price
- sale_start_date (DATETIME, NULL) - Sale start date
- sale_end_date (DATETIME, NULL) - Sale end date
- is_on_sale (BOOLEAN, DEFAULT false) - Whether product is currently on sale
```

**Purpose**: Enhanced product pricing with sale management capabilities.

**Business Logic**:
- **Original Price Preservation**: Maintains original price for comparison
- **Sale Management**: Automatic sale price activation/deactivation
- **Sale Indicators**: Clear indication of products on sale
- **Time-Based Sales**: Scheduled sale periods with automatic management

### 7. Cart Management

#### `carts` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- customer_id (FOREIGN KEY -> customers.id, NULL for guests)
- guest_session_id (VARCHAR) - For guest carts
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Purpose**: Shopping cart containers.

#### `cart_items` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- cart_id (FOREIGN KEY -> carts.id)
- product_instance_id (FOREIGN KEY -> product_instance.id)
- quantity (INT)
- created_at (TIMESTAMP)
```

**Purpose**: Items in shopping carts.

#### `cart_item_flavors` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- cart_item_id (FOREIGN KEY -> cart_items.id)
- flavor_id (FOREIGN KEY -> flavors.id)
- flavor_name (VARCHAR)
- size_id (INT)
- size_name (VARCHAR)
- quantity (INT)
- created_at (TIMESTAMP)
```

**Purpose**: Flavor selections for cart items.

### 8. Admin Management

#### `admin_users` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- username (VARCHAR, UNIQUE)
- email (VARCHAR, UNIQUE)
- password (VARCHAR) - Hashed password
- role (ENUM: 'super_admin', 'order_manager', 'product_manager', 'delivery_manager', 'system_admin')
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Purpose**: Admin user accounts with role-based permissions.

#### `admin_view_preferences` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- admin_user_id (FOREIGN KEY -> admin_users.id)
- view_type (ENUM: 'products', 'flavors', 'product_types', 'orders')
- show_deleted (BOOLEAN) - Whether to show soft-deleted items
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Purpose**: Stores admin user preferences for viewing soft-deleted items.

### 9. Delivery Management

#### `delivery_men` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR)
- phone (VARCHAR)
- email (VARCHAR)
- zones (JSON) - Assigned delivery zones
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
```

**Purpose**: Delivery personnel management with zone assignments.

#### `delivery_time_slots` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR) - e.g., "Morning", "Afternoon", "Evening"
- from_hour (TIME)
- to_hour (TIME)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
```

**Purpose**: Available delivery time slots.

### 10. System Configuration

#### `site_settings` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- setting_key (VARCHAR, UNIQUE)
- setting_value (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Purpose**: System-wide configuration settings.

#### `email_settings` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- smtp_host (VARCHAR)
- smtp_port (INT)
- smtp_username (VARCHAR)
- smtp_password (VARCHAR)
- from_email (VARCHAR)
- from_name (VARCHAR)
- use_ssl (BOOLEAN)
- use_tls (BOOLEAN)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Purpose**: Email service configuration for notifications and verifications.

### 11. Promo Codes System

#### `promo_codes` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- code (VARCHAR(50), UNIQUE) - Promo code (e.g., "WELCOME10")
- name (VARCHAR(255)) - Display name (e.g., "Welcome Discount")
- description (TEXT) - Detailed description
- discount_type (ENUM: 'percentage', 'fixed_amount') - Type of discount
- discount_value (DECIMAL(10,2)) - Discount amount or percentage
- minimum_order_amount (DECIMAL(10,2), DEFAULT 0.00) - Minimum order for discount
- maximum_discount (DECIMAL(10,2), NULL) - Maximum discount cap
- usage_limit (INT, NULL) - Maximum usage count (NULL = unlimited)
- used_count (INT, DEFAULT 0) - Current usage count
- valid_from (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - Start date
- valid_until (TIMESTAMP, NULL) - Expiration date
- is_active (BOOLEAN, DEFAULT true) - Whether code is active
- created_by (INT, FOREIGN KEY -> admin_users.id) - Admin who created
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- updated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)
```

**Purpose**: Manages promotional codes with flexible discount rules.

**Business Logic**:
- **Percentage Discounts**: Applied as percentage of order total
- **Fixed Amount Discounts**: Applied as fixed currency amount
- **Usage Tracking**: Monitors how many times each code is used
- **Validity Periods**: Time-based activation and expiration
- **Minimum Orders**: Enforces minimum order amounts for discounts
- **Maximum Caps**: Limits maximum discount amount for percentage codes

#### `promo_code_usage` Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- promo_code_id (INT, FOREIGN KEY -> promo_codes.id) - Reference to promo code
- order_id (INT, FOREIGN KEY -> orders.id) - Order where code was used
- customer_id (INT, FOREIGN KEY -> customers.id, NULL) - Customer who used code
- customer_email (VARCHAR(255), NULL) - Customer email for tracking
- discount_amount (DECIMAL(10,2)) - Actual discount applied
- order_amount (DECIMAL(10,2)) - Order total before discount
- used_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - When code was used
```

**Purpose**: Tracks usage of promotional codes for analytics and validation.

**Business Logic**:
- **Usage History**: Complete audit trail of promo code usage
- **Customer Tracking**: Links usage to specific customers
- **Order Association**: Connects discounts to specific orders
- **Analytics Support**: Enables reporting on promo code effectiveness

#### Orders Table Promo Code Columns
```sql
- promo_code_id (INT, FOREIGN KEY -> promo_codes.id, NULL) - Applied promo code
- promo_code (VARCHAR(50), NULL) - Promo code string for display
- discount_amount (DECIMAL(10,2), DEFAULT 0.00) - Discount applied to order
```

**Purpose**: Links orders to applied promotional codes and tracks discounts.

**Business Logic**:
- **Order Discounts**: Records discounts applied to specific orders
- **Code Reference**: Maintains link to original promo code
- **Display Support**: Stores code string for order display
- **Historical Preservation**: Maintains discount information even if code is deleted

## Key Relationships

### Customer Registration Flow
```
customers ←→ addresses (1:many)
customers ←→ email_verification_tokens (1:many)
customers ←→ password_reset_tokens (1:many)
customers ←→ phone_verification (1:many)
```

### Location Management
```
cities ←→ zones (1:many)
zones ←→ addresses (1:many)
zones ←→ delivery_men (many:many via JSON)
```

### Product Management
```
product_types ←→ products (1:many)
products ←→ product_instance (1:many)
product_instance ←→ product_instance_flavor (1:many)
flavors ←→ product_instance_flavor (1:many)
sizes ←→ product_instance (1:many)
```

### Order Management
```
customers ←→ orders (1:many)
orders ←→ order_items (1:many)
order_items ←→ product_instance (many:1)
promo_codes ←→ orders (1:many) - Applied promo codes
promo_codes ←→ promo_code_usage (1:many) - Usage tracking
orders ←→ promo_code_usage (1:many) - Order usage records
customers ←→ promo_code_usage (1:many) - Customer usage tracking
```

### Pricing Management
```
products ←→ product_prices (1:many) - Product pricing tiers
admin_users ←→ pricing_rules (1:many) - Pricing rule creation
admin_users ←→ product_prices (1:many) - Price setting
pricing_categories ←→ pricing_rules (1:many) - Category-based rules
products ←→ pricing_rules (1:many) - Product-specific rules
```

### Cart Management
```
customers ←→ carts (1:many)
carts ←→ cart_items (1:many)
cart_items ←→ cart_item_flavors (1:many)
cart_item_flavors ←→ flavors (many:1)
```

## Indexes for Performance

### Customer Management
```sql
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_type ON customers(type);
CREATE INDEX idx_customers_age_group ON customers(age_group);
```

### Location Management
```sql
CREATE INDEX idx_cities_active ON cities(is_active);
CREATE INDEX idx_cities_name ON cities(name);
CREATE INDEX idx_zones_active ON zones(is_active);
CREATE INDEX idx_zones_city_id ON zones(city_id);
CREATE INDEX idx_zones_delivery_fee ON zones(delivery_fee);
```

### Authentication
```sql
CREATE INDEX idx_email_verification_customer ON email_verification_tokens(customer_id);
CREATE INDEX idx_email_verification_expires ON email_verification_tokens(expires_at);
CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id, user_type);
CREATE INDEX idx_password_reset_expires ON password_reset_tokens(expires_at);
CREATE INDEX idx_phone_verification_phone ON phone_verification(phone);
CREATE INDEX idx_phone_verification_expires ON phone_verification(expires_at);
```

### Order Management
```sql
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_instance_id);
CREATE INDEX idx_orders_promo_code ON orders(promo_code);
```

### Promo Codes Management
```sql
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX idx_promo_codes_valid_until ON promo_codes(valid_until);
CREATE INDEX idx_promo_code_usage_promo_code_id ON promo_code_usage(promo_code_id);
CREATE INDEX idx_promo_code_usage_order_id ON promo_code_usage(order_id);
CREATE INDEX idx_promo_code_usage_customer_id ON promo_code_usage(customer_id);
```

### Product Pricing Management
```sql
-- Pricing rules indexes
CREATE INDEX idx_pricing_rules_rule_type ON pricing_rules(rule_type);
CREATE INDEX idx_pricing_rules_target_id ON pricing_rules(target_id);
CREATE INDEX idx_pricing_rules_start_date ON pricing_rules(start_date);
CREATE INDEX idx_pricing_rules_end_date ON pricing_rules(end_date);
CREATE INDEX idx_pricing_rules_is_active ON pricing_rules(is_active);
CREATE INDEX idx_pricing_rules_priority ON pricing_rules(priority);

-- Product prices indexes
CREATE INDEX idx_product_prices_product_id ON product_prices(product_id);
CREATE INDEX idx_product_prices_price_type ON product_prices(price_type);
CREATE INDEX idx_product_prices_start_date ON product_prices(start_date);
CREATE INDEX idx_product_prices_end_date ON product_prices(end_date);
CREATE INDEX idx_product_prices_is_active ON product_prices(is_active);

-- Pricing categories indexes
CREATE INDEX idx_pricing_categories_category_type ON pricing_categories(category_type);
CREATE INDEX idx_pricing_categories_target_value ON pricing_categories(target_value);
CREATE INDEX idx_pricing_categories_is_active ON pricing_categories(is_active);

-- Products table pricing indexes
CREATE INDEX idx_products_is_on_sale ON products(is_on_sale);
CREATE INDEX idx_products_sale_start_date ON products(sale_start_date);
CREATE INDEX idx_products_sale_end_date ON products(sale_end_date);
```

## Data Integrity Constraints

### Foreign Key Constraints
- All foreign key relationships are properly defined
- Cascade deletes where appropriate (e.g., customer deletion removes addresses)
- Restrict deletes where needed (e.g., orders with existing order items)

### Unique Constraints
- Customer email and phone numbers are unique
- Admin usernames and emails are unique
- City and zone names are unique within their scope

### Check Constraints
- Age group values are restricted to valid ranges
- Order status values are restricted to valid enum values
- Delivery fees must be non-negative
- Quantities must be positive integers

## Business Logic Implementation

### Delivery Coverage Logic
The system implements a flexible delivery coverage system:

1. **All Cities/Zones Visible**: Registration and checkout forms show all cities and zones
2. **Active Status Tracking**: `is_active` fields track current delivery coverage
3. **User Notification**: Customers are informed about coverage status after registration
4. **Future Expansion**: Inactive cities/zones represent planned delivery areas

### Registration Flow
1. **Data Collection**: Personal info, address, age group, birth date
2. **Phone Verification**: OTP verification required before registration
3. **Account Creation**: Customer account created with email verification
4. **Coverage Check**: System checks if selected city/zone is active
5. **User Notification**: Clear communication about delivery coverage status

### Security Implementation
1. **Password Hashing**: All passwords are hashed using bcrypt
2. **Token Security**: Reset tokens are hashed and have expiration
3. **OTP Verification**: Phone verification required for all users
4. **Email Verification**: Email verification for registered users

---

**This database structure supports the complete Crumbled e-commerce platform with comprehensive customer management, product catalog, order processing, delivery management, and advanced pricing management capabilities.** 