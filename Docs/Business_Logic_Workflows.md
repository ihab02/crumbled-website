# Crumbled Business Logic & Workflows Documentation

## Overview
This document outlines the core business logic, workflows, and user journeys that drive the Crumbled cookie delivery platform. Understanding these processes is crucial for maintaining and extending the application.

## Core Business Model

### Business Concept
- **Product**: Fresh-baked cookie delivery service
- **Target Market**: Local customers in Cairo, Egypt
- **Delivery Model**: Zone-based delivery with assigned delivery personnel
- **Payment**: Cash on delivery (primary), online payment (secondary)
- **Customization**: Flavor and size customization for cookie packs

### Revenue Streams
1. **Cookie Sales**: Individual cookies and customized packs
2. **Delivery Fees**: Zone-based delivery charges
3. **Premium Services**: Express delivery, special packaging
4. **Bulk Orders**: Corporate and event orders

## User Personas & Journeys

### 1. Customer Personas

#### Registered Customer
- **Profile**: Returning customer with account
- **Behavior**: Regular orders, saved addresses, order history
- **Journey**: Browse → Customize → Add to Cart → Checkout → Track Order

#### Guest Customer
- **Profile**: First-time or occasional customer
- **Behavior**: Quick orders, phone verification, no account creation
- **Journey**: Browse → Customize → Add to Cart → Guest Checkout → OTP Verification

#### Corporate Customer
- **Profile**: Business orders for events/offices
- **Behavior**: Large orders, bulk customization, scheduled delivery
- **Journey**: Bulk Selection → Corporate Checkout → Scheduled Delivery

### 2. Admin Personas

#### Super Admin
- **Permissions**: Full system access, user management, system configuration, debug mode control
- **Responsibilities**: User management, system maintenance, analytics, troubleshooting

#### Order Manager
- **Permissions**: Order processing, delivery assignment, customer service
- **Responsibilities**: Order fulfillment, delivery coordination, customer support

#### Product Manager
- **Permissions**: Product catalog, inventory, pricing
- **Responsibilities**: Product management, stock control, pricing strategy

#### Delivery Manager
- **Permissions**: Delivery personnel, route optimization, delivery tracking
- **Responsibilities**: Delivery coordination, personnel management, route planning

#### System Administrator
- **Permissions**: Debug mode management, system monitoring, performance optimization
- **Responsibilities**: System troubleshooting, debug logging, performance monitoring

## Core Business Workflows

### 1. Customer Registration and Delivery Coverage Workflow

#### Registration Process
```
1. Customer fills registration form
   - Personal information (name, email, phone)
   - Address information (city, zone, street address)
   - Age group and birth date (optional)
   ↓
2. Phone verification via OTP
   - SMS sent to customer's phone
   - OTP verification required before registration
   ↓
3. Account creation
   - Customer account created in database
   - Email verification token generated and sent
   ↓
4. Delivery coverage notification
   - System checks if selected city/zone is active
   - If inactive, shows notification: "Your zone is not yet under coverage for the delivery service. We will cover it soon!"
   ↓
5. Redirect to login page
```

#### City and Zone Management
- **All Cities/Zones Visible**: Registration form shows all cities and zones, regardless of active status
- **Visual Indicators**: Inactive cities/zones are marked with "(coming soon)" and grayed out
- **Delivery Coverage**: Only active cities/zones are under delivery coverage
- **Future Expansion**: Inactive cities/zones represent future delivery areas

#### Delivery Coverage Logic
```typescript
// Check delivery coverage after registration
const checkDeliveryCoverage = (cityId: string, zoneId: string) => {
  const city = cities.find(c => c.id.toString() === cityId);
  const zone = zones.find(z => z.id.toString() === zoneId);
  
  if (city && !city.is_active) {
    return `Your city (${city.name}) is not yet under coverage for the delivery service. We will cover it soon!`;
  } else if (zone && !zone.is_active) {
    return `Your zone (${zone.name}) is not yet under coverage for the delivery service. We will cover it soon!`;
  }
  
  return null; // No coverage issue
};
```

#### Benefits of This Approach
1. **Customer Acquisition**: Allows customers from all areas to register
2. **Transparency**: Clear communication about delivery coverage
3. **Future Planning**: Data collection for expansion planning
4. **User Experience**: No barriers to registration, but clear expectations

### 2. Product Customization Workflow

#### Cookie Pack Customization
```
1. Customer selects base pack (e.g., "3 PCS Pack")
   ↓
2. System displays available flavors for the pack
   ↓
3. Customer selects flavors for each position
   ↓
4. System validates flavor availability and stock
   ↓
5. Price calculated: Base Price + Flavor Adjustments
   ↓
6. Customized pack added to cart
```

#### Flavor Selection Rules
- **Minimum Selection**: Must select flavors for all pack positions
- **Flavor Availability**: Only active flavors can be selected
- **Stock Validation**: Check flavor availability before adding to cart
- **Price Adjustments**: Some flavors may have additional costs
- **Size Consistency**: All cookies in pack must be same size

#### Pricing Logic
```typescript
// Pricing calculation
const basePrice = pack.base_price;
const flavorAdjustments = selectedFlavors.reduce((total, flavor) => {
  return total + (flavor.price_adjustment || 0);
}, 0);
const finalPrice = basePrice + flavorAdjustments;
```

### 3. Shopping Cart Workflow

#### Cart Management Rules
```
1. Cart Creation
   - New customer: Create cart with session ID
   - Returning customer: Load existing cart or create new
   ↓
2. Item Addition
   - Validate product availability
   - Check flavor stock
   - Calculate pricing
   - Add to cart with customization details
   ↓
3. Cart Updates
   - Real-time price calculation
   - Stock validation on updates
   - Quantity limits enforcement
   ↓
4. Cart Persistence
   - Save cart to database
   - Maintain cart across sessions
   - Handle guest vs registered user carts
```

#### Cart Validation Rules
- **Stock Validation**: Check availability before adding items
- **Quantity Limits**: Maximum items per cart (e.g., 50 items)
- **Flavor Availability**: Ensure selected flavors are in stock
- **Price Accuracy**: Real-time price calculation and validation
- **Session Management**: Handle cart persistence across sessions

### 4. Checkout Workflow

#### Customer Information Collection
```
1. Customer Type Detection
   - Registered: Auto-fill from profile
   - Guest: Collect name, phone, email
   ↓
2. Contact Information
   - Phone number (required for delivery)
   - Email (optional, for order updates)
   - Name (required for delivery)
   ↓
3. Delivery Information
   - Address selection/entry
   - Zone detection and delivery fee calculation
   - Delivery date selection
   - Time slot selection
   ↓
4. Order Review
   - Item summary with customization details
   - Price breakdown (subtotal, delivery fee, total)
   - Delivery information confirmation
```

#### Guest Checkout Process
```
1. Phone Number Entry
   ↓
2. OTP Generation and SMS
   ↓
3. OTP Verification
   ↓
4. Order Creation with Guest Status
   ↓
5. Order Confirmation
```

#### Delivery Calculation Logic
```typescript
// Delivery fee calculation
const getDeliveryFee = (zone: string, orderValue: number) => {
  const zoneConfig = deliveryZones.find(z => z.name === zone);
  const baseFee = zoneConfig?.delivery_fee || 30;
  
  // Free delivery for orders above threshold
  if (orderValue >= 200) {
    return 0;
  }
  
  return baseFee;
};

// Delivery date calculation
const getDeliveryDate = (orderDate: Date, deliveryDays: number) => {
  const deliveryDate = new Date(orderDate);
  deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
  return deliveryDate;
};
```

### 4. Zone-Based Delivery System
- **Delivery Zones**: Geographic areas with specific delivery fees
- **Delivery Personnel**: Assigned to specific zones with availability schedules
- **Time Slots**: Fixed delivery windows per zone

### 5. Promo Codes System
- **Code Creation**: Admins create promotional codes with flexible rules
- **Discount Types**: Percentage or fixed amount discounts
- **Validation Rules**: Minimum order amounts, usage limits, validity periods
- **Usage Tracking**: Monitor code usage and customer behavior
- **Order Integration**: Apply discounts during checkout process
- **Analytics**: Track promo code effectiveness and ROI

### 6. Product Pricing Management System

#### Pricing Management Workflow
```
1. Admin creates pricing rules
   - Product-specific rules (individual products)
   - Category-based rules (product types, flavors)
   - Time-based rules (scheduled promotions)
   - Customer group rules (VIP, members)
   ↓
2. System applies pricing rules
   - Rule priority determines application order
   - Time-based rules activate/deactivate automatically
   - Customer-specific rules apply based on user type
   ↓
3. Price calculation and display
   - Original price preserved for comparison
   - Sale price calculated and displayed
   - "Was/Now" pricing shown to customers
   ↓
4. Order processing with pricing
   - Pricing rules applied during cart updates
   - Final pricing calculated at checkout
   - Pricing breakdown shown in order summary
   ↓
5. Analytics and reporting
   - Track pricing rule effectiveness
   - Monitor revenue impact
   - Analyze customer pricing behavior
```

#### Pricing Rule Types
- **Product-Specific**: Individual product price management with sale prices
- **Category-Based**: Apply pricing rules to product categories and flavors
- **Time-Based**: Scheduled price changes and promotional periods
- **Customer Group**: VIP and member pricing tiers
- **Advanced Pricing Tiers**: Regular, sale, member, and wholesale pricing
- **Bulk Operations**: Mass price updates and rule creation
- **Pricing Analytics**: Revenue impact and rule effectiveness tracking
- **Integration**: Works alongside promo codes for comprehensive discount strategies

#### Pricing Calculation Logic
```typescript
// Pricing calculation workflow
const calculateFinalPrice = (product, customer, orderAmount) => {
  let finalPrice = product.base_price;
  let appliedRules = [];
  
  // Apply product-specific pricing rules
  const productRules = getProductPricingRules(product.id);
  productRules.forEach(rule => {
    if (isRuleValid(rule, customer, orderAmount)) {
      finalPrice = applyPricingRule(finalPrice, rule);
      appliedRules.push(rule);
    }
  });
  
  // Apply category-based pricing rules
  const categoryRules = getCategoryPricingRules(product.category);
  categoryRules.forEach(rule => {
    if (isRuleValid(rule, customer, orderAmount)) {
      finalPrice = applyPricingRule(finalPrice, rule);
      appliedRules.push(rule);
    }
  });
  
  // Apply customer group pricing
  const customerRules = getCustomerGroupPricingRules(customer.type);
  customerRules.forEach(rule => {
    if (isRuleValid(rule, customer, orderAmount)) {
      finalPrice = applyPricingRule(finalPrice, rule);
      appliedRules.push(rule);
    }
  });
  
  return {
    originalPrice: product.base_price,
    finalPrice: finalPrice,
    appliedRules: appliedRules,
    discountAmount: product.base_price - finalPrice,
    discountPercentage: ((product.base_price - finalPrice) / product.base_price) * 100
  };
};
```

### 7. Debug Logging System

#### Debug Mode Management
```
1. Admin enables debug mode via settings
   ↓
2. System clears debug mode cache
   ↓
3. All debug logging functions become active
   ↓
4. Debug logs appear in console and server logs
   ↓
5. Admin can monitor system behavior in real-time
   ↓
6. Debug mode disabled when troubleshooting complete
```

#### Debug Logging Rules
- **Conditional Execution**: Debug logs only execute when debug mode is enabled
- **Performance Impact**: Minimal performance overhead when disabled
- **Security**: Debug logs may contain sensitive information
- **Caching**: 30-second cache for debug mode status to reduce database queries
- **Admin Only**: Only administrators can enable/disable debug mode

#### Debug Logging Categories
1. **API Operations**: Request/response logging, parameter validation
2. **Database Queries**: Query execution, result processing
3. **Authentication**: Login attempts, session management
4. **Cart Operations**: Add/remove items, price calculations
5. **Order Processing**: Status changes, payment processing
6. **SMS Operations**: OTP generation, delivery status
7. **Performance**: Response times, cache hits/misses

### 8. Order Processing Workflow

#### Order Status Flow
```
pending → confirmed → preparing → out_for_delivery → delivered
    ↓
cancelled (at any stage)
```

#### Order Processing Rules
1. **Pending**: Order received, awaiting confirmation
2. **Confirmed**: Order confirmed, payment verified
3. **Preparing**: Order being prepared in kitchen
4. **Out for Delivery**: Assigned to delivery personnel
5. **Delivered**: Successfully delivered to customer
6. **Cancelled**: Order cancelled (with reason tracking)

#### Payment Processing
```
1. Payment Method Selection
   - Cash on Delivery (primary)
   - Online Payment (secondary)
   ↓
2. Payment Status Tracking
   - Pending: Awaiting payment
   - Paid: Payment received
   - Failed: Payment failed
```

### 9. Password Management Workflow

#### Password Reset Process
```
1. User requests password reset
   - Enters email address
   - System validates email exists
   ↓
2. Reset token generation
   - Secure token generated
   - Token stored in database with expiration
   - Email sent with reset link
   ↓
3. Token validation
   - User clicks reset link
   - System validates token and expiration
   - Shows password reset form if valid
   ↓
4. Password update
   - User enters new password
   - Password hashed and updated
   - Token deleted after use
   - Confirmation email sent
```

#### Security Rules
- **Token Expiration**: Reset tokens expire after 24 hours
- **Single Use**: Tokens are deleted after successful password reset
- **Password Strength**: Minimum 8 characters required
- **Email Verification**: Reset links sent to registered email only

### 10. Guest User Management

#### Guest Checkout Flow
```
1. Guest user browsing
   - No account required for browsing
   - Can add items to cart
   ↓
2. Guest checkout initiation
   - Phone number required
   - OTP verification for security
   ↓
3. Order completion
   - Guest order created
   - No account association
   - Order tracking via phone/email
```

#### Guest vs Registered User Benefits
- **Guest Users**: Quick checkout, no account creation required
- **Registered Users**: Saved addresses, order history, loyalty benefits
- **Conversion**: Guest users can register after first order

## Error Handling and Edge Cases

### Common Error Scenarios
1. **Invalid Reset Tokens**: Redirect to shop instead of reset password page
2. **Expired OTP**: Automatic resend with cooldown period
3. **Stock Unavailable**: Real-time validation and user notification
4. **Delivery Zone Issues**: Clear communication about coverage status

### User Experience Considerations
- **Progressive Disclosure**: Show only necessary information at each step
- **Clear Feedback**: Immediate response to user actions
- **Error Recovery**: Easy paths to correct mistakes
- **Accessibility**: Support for different user abilities and devices

## Performance and Scalability

### Database Optimization
- **Indexed Queries**: Fast lookups for frequently accessed data
- **Connection Pooling**: Efficient database connection management
- **Caching**: Reduce database load for static data

### API Performance
- **Rate Limiting**: Prevent abuse and ensure fair usage
- **Response Caching**: Cache frequently requested data
- **Async Processing**: Non-blocking operations for better user experience

## Security Considerations

### Data Protection
- **Password Hashing**: Secure storage of user credentials
- **Token Security**: Secure generation and validation of reset tokens
- **Input Validation**: Prevent injection attacks and data corruption

### Access Control
- **Role-Based Access**: Different permissions for different user types
- **Session Management**: Secure handling of user sessions
- **API Security**: Protected endpoints with proper authentication

---

**This document provides a comprehensive overview of the business logic and workflows. For technical implementation details, refer to the codebase and API documentation.** 