# Enhanced Promo Code System

## Overview

The Enhanced Promo Code System provides a comprehensive solution for managing various types of promotional codes with advanced features and real-time validation. The system supports multiple promo code types, each with specific validation logic and user interface components.

## Supported Promo Code Types

### 1. Basic Promo Codes
- **Type**: `basic`
- **Description**: Standard percentage or fixed amount discounts
- **Features**:
  - Percentage discount (e.g., 10% off)
  - Fixed amount discount (e.g., 50 EGP off)
  - Minimum order amount requirements
  - Maximum discount limits

### 2. Free Delivery Promo Codes
- **Type**: `free_delivery`
- **Description**: Makes delivery free for qualifying orders
- **Features**:
  - Waives delivery fees completely (does NOT affect order subtotal)
  - Minimum order amount requirements
  - Visual indicators showing original vs. new delivery cost
  - Real-time validation
  - **Important**: No discount type or value needed - only affects delivery costs

### 3. Category-Specific Promo Codes
- **Type**: `category_specific`
- **Description**: Applies discounts only to specific product categories
- **Features**:
  - Category restrictions via JSON array
  - Flavor-based matching
  - Visual indicators for eligible items
  - Partial cart discounts

### 4. Buy X Get Y Promo Codes
- **Type**: `buy_x_get_y`
- **Description**: Buy X items, get Y items at a discount
- **Features**:
  - Configurable X and Y quantities
  - Discount percentage for Y items
  - Progress tracking towards promotion
  - Multiple promotion cycles

### 5. First-Time Customer Promo Codes
- **Type**: `first_time_customer`
- **Description**: Exclusive discounts for new customers
- **Features**:
  - Customer order history validation
  - Registration requirements
  - Welcome messaging

### 6. Loyalty Reward Promo Codes
- **Type**: `loyalty_reward`
- **Description**: Rewards for loyal customers
- **Features**:
  - Customer group restrictions
  - Login requirements
  - Exclusive messaging

## Technical Implementation

### Backend API (`/api/validate-promo-code`)

The validation API supports all promo code types with enhanced response data:

```typescript
interface PromoCodeResponse {
  valid: boolean;
  promoCode: {
    id: number;
    code: string;
    name: string;
    description: string;
    discount_type: 'percentage' | 'fixed_amount';
    enhanced_type: string;
    discount_value: number;
    discount_amount: number;
    // Enhanced fields
    free_delivery?: boolean;
    eligible_items?: any[];
    buy_x_get_y_details?: {
      buyX: number;
      getY: number;
      discountPercentage: number;
      promotionCycles: number;
      freeItems: number;
    };
    category_restrictions?: string;
    buy_x_quantity?: number;
    get_y_quantity?: number;
    get_y_discount_percentage?: number;
    minimum_order_amount?: number;
  };
  message: string;
}
```

### Frontend Components

#### EnhancedPromoCodeDisplay
Displays detailed information about applied promo codes based on their type:

- **Visual Icons**: Each promo type has a unique icon
- **Color Coding**: Different colors for different promo types
- **Progress Tracking**: For buy X get Y promotions
- **Eligible Items**: Shows which items qualify for category-specific promos
- **Real-time Updates**: Updates when cart changes

#### EnhancedCartItem
Shows individual cart items with promo eligibility indicators:

- **Eligibility Badges**: Visual indicators for eligible items
- **Category Badges**: Shows relevant categories
- **Promo Type Indicators**: Different styling for different promo types

### Admin Interface

The admin interface (`/admin/enhanced-promo-codes`) provides:

- **Type-Specific Forms**: Different fields based on promo type
- **Validation**: Real-time form validation
- **Preview**: Visual preview of promo code effects
- **Bulk Operations**: Create, edit, and delete multiple codes

## Usage Examples

### Creating a Free Delivery Promo Code

1. Navigate to `/admin/enhanced-promo-codes`
2. Click "Create New Promo Code"
3. Select "Free Delivery" as the type
4. **Note**: Discount type and value fields are hidden for free delivery promos
5. Set minimum order amount (optional)
6. Configure usage limits and validity dates
7. Save the promo code

### Creating a Category-Specific Promo Code

1. Select "Category Specific" as the type
2. Enter category restrictions as JSON array: `["chocolate", "vanilla"]`
3. Set discount type and value
4. Configure other parameters
5. Save the promo code

### Creating a Buy X Get Y Promo Code

1. Select "Buy X Get Y" as the type
2. Set Buy X quantity (e.g., 2)
3. Set Get Y quantity (e.g., 1)
4. Set Y discount percentage (e.g., 100 for free)
5. Configure other parameters
6. Save the promo code

## Validation Logic

### Free Delivery Validation
- Checks minimum order amount
- Always valid if requirements met
- Sets `free_delivery: true` in response
- **No discount calculation** - only affects delivery fee
- Discount amount is always 0 for free delivery promos

### Category-Specific Validation
- Parses category restrictions from JSON
- Matches items by category or flavor names
- Calculates discount only on eligible items
- Returns list of eligible items

### Buy X Get Y Validation
- Calculates total cart quantity
- Determines promotion cycles
- Calculates discount based on average item price
- Returns detailed promotion information

### First-Time Customer Validation
- Checks customer order history
- Validates customer exists
- Ensures no previous orders

### Loyalty Reward Validation
- Requires logged-in customer
- Validates customer group restrictions
- Ensures customer exists

## Real-Time Features

### Cart Change Detection
- Automatically re-validates promo codes when cart changes
- Debounced validation (1-second delay)
- Removes invalid promo codes with user notification

### Visual Feedback
- Toast notifications for success/error states
- Real-time progress indicators
- Dynamic styling based on promo eligibility

## Database Schema

The system uses the `enhanced_promo_codes` table with the following key fields:

```sql
CREATE TABLE enhanced_promo_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  discount_type ENUM('percentage', 'fixed_amount') NOT NULL,
  enhanced_type ENUM('basic', 'free_delivery', 'buy_x_get_y', 'category_specific', 'first_time_customer', 'loyalty_reward') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_order_amount DECIMAL(10,2) DEFAULT 0,
  maximum_discount DECIMAL(10,2) DEFAULT 0,
  usage_limit INT DEFAULT 100,
  used_count INT DEFAULT 0,
  valid_until DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  category_restrictions JSON,
  buy_x_quantity INT DEFAULT 0,
  get_y_quantity INT DEFAULT 0,
  get_y_discount_percentage DECIMAL(5,2) DEFAULT 100,
  usage_per_customer INT DEFAULT 1,
  usage_per_order INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT,
  FOREIGN KEY (created_by) REFERENCES admin_users(id)
);
```

## Testing

Use the test script to verify the system:

```bash
node scripts/test-enhanced-promo-codes.js
```

This script tests:
- Promo code validation for all types
- Admin promo code creation
- API response formats
- Error handling

## Future Enhancements

1. **Advanced Loyalty System**: Points-based rewards
2. **Time-Limited Promos**: Hourly/daily flash sales
3. **Geographic Restrictions**: Location-based promos
4. **Product-Specific Promos**: Individual product discounts
5. **Stacking Rules**: Complex combination logic
6. **Analytics Dashboard**: Promo code performance metrics

## Troubleshooting

### Common Issues

1. **Promo Code Not Applying**: Check minimum order amount and usage limits
2. **Category Matching Issues**: Verify JSON format and category names
3. **Buy X Get Y Not Working**: Ensure cart quantity meets requirements
4. **Free Delivery Not Showing**: Check if delivery fee calculation is correct

### Debug Mode

Enable debug logging to see detailed validation information:

```typescript
// In checkout page
const { debugLog } = useDebugLogger();
debugLog('Promo validation result:', result);
```

## Security Considerations

1. **Input Validation**: All promo code inputs are validated
2. **SQL Injection Prevention**: Parameterized queries used
3. **Rate Limiting**: API endpoints have rate limits
4. **Access Control**: Admin endpoints require authentication
5. **Data Sanitization**: All user inputs are sanitized

## Performance Optimization

1. **Caching**: Promo code data is cached
2. **Database Indexing**: Optimized queries for validation
3. **Debounced Validation**: Prevents excessive API calls
4. **Lazy Loading**: Components load only when needed 